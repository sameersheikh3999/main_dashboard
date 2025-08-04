from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from api.models import TeacherData, AggregatedData, SchoolData, FilterOptions, DataSyncLog, UserSchoolProfile
from google.cloud import bigquery
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sync data from BigQuery to Django database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-type',
            type=str,
            choices=['all', 'teacher_data', 'aggregated_data', 'school_data', 'filter_options', 'userschoolprofile'],
            default='all',
            help='Type of data to sync'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even if data is recent'
        )

    def handle(self, *args, **options):
        data_type = options['data_type']
        force = options['force']

        self.stdout.write(f"Starting BigQuery data sync for: {data_type}")

        try:
            client = bigquery.Client()
            if data_type in ['all', 'userschoolprofile']:
                self.sync_userschoolprofile(client, force)
            if data_type in ['all', 'teacher_data']:
                self.sync_teacher_data(client, force)
            if data_type in ['all', 'aggregated_data']:
                self.sync_aggregated_data(client, force)
            if data_type in ['all', 'school_data']:
                self.sync_school_data(client, force)
            if data_type in ['all', 'filter_options']:
                self.sync_filter_options(client, force)
            self.stdout.write(self.style.SUCCESS('BigQuery data sync completed successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during sync: {str(e)}'))
            logger.error(f'BigQuery sync error: {str(e)}')

    def sync_userschoolprofile(self, client, force=False):
        """Sync all teacher-school assignments from BigQuery"""
        from api.models import UserSchoolProfile
        UserSchoolProfile.objects.all().delete()
        query = '''
        SELECT a.user_id, a.user_name as Teacher, b.Sector, b.EMIS, b.Institute as School
        FROM `tbproddb.user_school_profiles` a
        INNER JOIN `tbproddb.FDE_Schools` b ON a.emis_1 = b.EMIS
        '''
        query_job = client.query(query)
        results = query_job.result()
        objs = []
        for row in results:
            objs.append(UserSchoolProfile(
                user_id=row.user_id,
                teacher=row.Teacher,
                sector=row.Sector,
                emis=row.EMIS,
                school=row.School
            ))
        if objs:
            UserSchoolProfile.objects.bulk_create(objs)
            self.stdout.write(f"Synced {len(objs)} UserSchoolProfile records")
        else:
            self.stdout.write("No UserSchoolProfile data found in BigQuery")

    def sync_teacher_data(self, client, force=False):
        """Sync teacher data from BigQuery"""
        sync_log = DataSyncLog.objects.create(
            sync_type='teacher_data',
            status='running'
        )

        try:
            # Check if we have recent data (within 2 hours)
            if not force:
                recent_data = TeacherData.objects.filter(
                    updated_at__gte=timezone.now() - timezone.timedelta(hours=2)
                ).first()
                if recent_data:
                    self.stdout.write("Teacher data is recent, skipping sync")
                    sync_log.status = 'skipped'
                    sync_log.completed_at = timezone.now()
                    sync_log.save()
                    return

            # Clear existing data
            TeacherData.objects.all().delete()

            # Query to get teacher data with individual LP ratios
            query = """
            SELECT  
                a.user_id,
                d.user_name as Teacher,
                e.Sector,
                e.EMIS,
                e.Institute as School,
                AVG(LEAST(IFNULL(lp_started, 0) / max_classes, 1) * 100) AS lp_ratio
            FROM `tbproddb.weekly_time_table_NF` a
            INNER JOIN `tbproddb.user_school_profiles` d ON a.user_id=d.user_id
            INNER JOIN `tbproddb.FDE_Schools` e ON d.emis_1=e.EMIS
            WHERE max_classes != 0
            GROUP BY user_id, d.user_name, e.Sector, e.EMIS, e.Institute
            ORDER BY e.Institute, d.user_name
            """

            query_job = client.query(query)
            results = query_job.result()

            # Bulk create teacher data
            teacher_data_list = []
            for row in results:
                teacher_data_list.append(TeacherData(
                    user_id=row.user_id,
                    teacher=row.Teacher,
                    grade='N/A',
                    subject='N/A',
                    sector=row.Sector,
                    emis=row.EMIS,
                    school=row.School,
                    week_start=timezone.now().date(),
                    week_end=timezone.now().date(),
                    week_number=1,
                    lp_ratio=float(row.lp_ratio) if row.lp_ratio else 0
                ))

            # Bulk create in batches
            if teacher_data_list:
                batch_size = 1000
                for i in range(0, len(teacher_data_list), batch_size):
                    batch = teacher_data_list[i:i + batch_size]
                    TeacherData.objects.bulk_create(batch)
                self.stdout.write(f"Synced {len(teacher_data_list)} teacher records")
            else:
                self.stdout.write("No teacher data found in BigQuery")

            sync_log.status = 'success'
            sync_log.records_processed = len(teacher_data_list)
            sync_log.completed_at = timezone.now()
            sync_log.save()

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
            raise

    def sync_aggregated_data(self, client, force=False):
        """Sync aggregated data from BigQuery"""
        sync_log = DataSyncLog.objects.create(
            sync_type='aggregated_data',
            status='running'
        )

        try:
            # Check if we have recent data
            if not force:
                recent_data = AggregatedData.objects.filter(
                    updated_at__gte=timezone.now() - timezone.timedelta(hours=2)
                ).first()
                if recent_data:
                    self.stdout.write("Aggregated data is recent, skipping sync")
                    sync_log.status = 'skipped'
                    sync_log.completed_at = timezone.now()
                    sync_log.save()
                    return

            # Clear existing data
            AggregatedData.objects.all().delete()

            # Sync weekly data
            weekly_query = """
            SELECT  
                e.Institute as School,
                e.Sector,
                DATE_TRUNC(a.week_start, WEEK) as period,
                COUNT(DISTINCT a.user_id) as teacher_count,
                AVG(LEAST(IFNULL(lp_started, 0) / max_classes, 1) * 100) as avg_lp_ratio
            FROM `tbproddb.weekly_time_table_NF` a 
            INNER JOIN `tbproddb.slo_grade` b ON a.grade_assigned=b.id 
            INNER JOIN `tbproddb.slo_subject` c ON a.subject_assigned=c.id 
            INNER JOIN `tbproddb.user_school_profiles` d ON a.user_id=d.user_id 
            INNER JOIN `tbproddb.FDE_Schools` e ON d.emis_1=e.EMIS
            WHERE max_classes != 0
            GROUP BY e.Institute, e.Sector, period
            ORDER BY period DESC, e.Institute
            """

            weekly_job = client.query(weekly_query)
            weekly_results = weekly_job.result()

            # Sync monthly data
            monthly_query = """
            SELECT  
                e.Institute as School,
                e.Sector,
                DATE_TRUNC(a.week_start, MONTH) as period,
                COUNT(DISTINCT a.user_id) as teacher_count,
                AVG(LEAST(IFNULL(lp_started, 0) / max_classes, 1) * 100) as avg_lp_ratio
            FROM `tbproddb.weekly_time_table_NF` a 
            INNER JOIN `tbproddb.slo_grade` b ON a.grade_assigned=b.id 
            INNER JOIN `tbproddb.slo_subject` c ON a.subject_assigned=c.id 
            INNER JOIN `tbproddb.user_school_profiles` d ON a.user_id=d.user_id 
            INNER JOIN `tbproddb.FDE_Schools` e ON d.emis_1=e.EMIS
            WHERE max_classes != 0
            GROUP BY e.Institute, e.Sector, period
            ORDER BY period DESC, e.Institute
            """

            monthly_job = client.query(monthly_query)
            monthly_results = monthly_job.result()

            # Process weekly data
            aggregated_data_list = []
            for row in weekly_results:
                aggregated_data_list.append(AggregatedData(
                    school=row.School,
                    sector=row.Sector,
                    period=row.period,
                    teacher_count=int(row.teacher_count) if row.teacher_count else 0,
                    avg_lp_ratio=float(row.avg_lp_ratio) if row.avg_lp_ratio else 0,
                    period_type='weekly'
                ))

            # Process monthly data
            for row in monthly_results:
                aggregated_data_list.append(AggregatedData(
                    school=row.School,
                    sector=row.Sector,
                    period=row.period,
                    teacher_count=int(row.teacher_count) if row.teacher_count else 0,
                    avg_lp_ratio=float(row.avg_lp_ratio) if row.avg_lp_ratio else 0,
                    period_type='monthly'
                ))

            # Bulk create
            if aggregated_data_list:
                AggregatedData.objects.bulk_create(aggregated_data_list)
                self.stdout.write(f"Synced {len(aggregated_data_list)} aggregated records")
            else:
                self.stdout.write("No aggregated data found in BigQuery")

            sync_log.status = 'success'
            sync_log.records_processed = len(aggregated_data_list)
            sync_log.completed_at = timezone.now()
            sync_log.save()

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
            raise

    def sync_school_data(self, client, force=False):
        """Sync school data from BigQuery"""
        sync_log = DataSyncLog.objects.create(
            sync_type='school_data',
            status='running'
        )

        try:
            # Check if we have recent data
            if not force:
                recent_data = SchoolData.objects.filter(
                    updated_at__gte=timezone.now() - timezone.timedelta(hours=2)
                ).first()
                if recent_data:
                    self.stdout.write("School data is recent, skipping sync")
                    sync_log.status = 'skipped'
                    sync_log.completed_at = timezone.now()
                    sync_log.save()
                    return

            # Clear existing data
            SchoolData.objects.all().delete()

            # Query to get school data
            query = """
            SELECT  
                e.Institute as school_name,
                e.Sector as sector,
                e.EMIS as emis,
                COUNT(DISTINCT a.user_id) as teacher_count,
                AVG(LEAST(IFNULL(lp_started, 0) / max_classes, 1) * 100) as avg_lp_ratio
            FROM `tbproddb.FDE_Schools` e
            LEFT JOIN `tbproddb.user_school_profiles` d ON e.EMIS = d.emis_1
            LEFT JOIN `tbproddb.weekly_time_table_NF` a ON d.user_id = a.user_id AND max_classes != 0
            GROUP BY e.Institute, e.Sector, e.EMIS
            ORDER BY e.Institute
            """

            query_job = client.query(query)
            results = query_job.result()

            # Bulk create school data
            school_data_list = []
            for row in results:
                # Skip rows with null school names
                if row.school_name:
                    school_data_list.append(SchoolData(
                        school_name=row.school_name,
                        sector=row.sector or '',
                        emis=row.emis or '',
                        teacher_count=int(row.teacher_count) if row.teacher_count else 0,
                        avg_lp_ratio=float(row.avg_lp_ratio) if row.avg_lp_ratio else 0
                    ))

            if school_data_list:
                SchoolData.objects.bulk_create(school_data_list)
                self.stdout.write(f"Synced {len(school_data_list)} school records")
            else:
                self.stdout.write("No school data found in BigQuery")

            sync_log.status = 'success'
            sync_log.records_processed = len(school_data_list)
            sync_log.completed_at = timezone.now()
            sync_log.save()

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
            raise

    def sync_filter_options(self, client, force=False):
        """Sync filter options from BigQuery"""
        sync_log = DataSyncLog.objects.create(
            sync_type='filter_options',
            status='running'
        )

        try:
            # Check if we have recent data
            if not force:
                recent_data = FilterOptions.objects.filter(
                    created_at__gte=timezone.now() - timezone.timedelta(hours=2)
                ).first()
                if recent_data:
                    self.stdout.write("Filter options are recent, skipping sync")
                    sync_log.status = 'skipped'
                    sync_log.completed_at = timezone.now()
                    sync_log.save()
                    return

            # Clear existing filter options
            FilterOptions.objects.all().delete()

            # Get schools
            schools_query = """
            SELECT DISTINCT e.Institute as school
            FROM `tbproddb.FDE_Schools` e
            ORDER BY e.Institute
            """
            schools_job = client.query(schools_query)
            schools = [row.school for row in schools_job.result()]

            # Get sectors
            sectors_query = """
            SELECT DISTINCT e.Sector as sector
            FROM `tbproddb.FDE_Schools` e
            ORDER BY e.Sector
            """
            sectors_job = client.query(sectors_query)
            sectors = [row.sector for row in sectors_job.result()]

            # Get grades
            grades_query = """
            SELECT DISTINCT b.label as grade
            FROM `tbproddb.weekly_time_table_NF` a 
            INNER JOIN `tbproddb.slo_grade` b ON a.grade_assigned=b.id 
            INNER JOIN `tbproddb.user_school_profiles` d ON a.user_id=d.user_id 
            INNER JOIN `tbproddb.FDE_Schools` e ON d.emis_1=e.EMIS
            WHERE max_classes != 0
            ORDER BY b.label
            """
            grades_job = client.query(grades_query)
            grades = [row.grade for row in grades_job.result()]

            # Get subjects
            subjects_query = """
            SELECT DISTINCT c.label as subject
            FROM `tbproddb.weekly_time_table_NF` a 
            INNER JOIN `tbproddb.slo_subject` c ON a.subject_assigned=c.id 
            INNER JOIN `tbproddb.user_school_profiles` d ON a.user_id=d.user_id 
            INNER JOIN `tbproddb.FDE_Schools` e ON d.emis_1=e.EMIS
            WHERE max_classes != 0
            ORDER BY c.label
            """
            subjects_job = client.query(subjects_query)
            subjects = [row.subject for row in subjects_job.result()]

            # Create filter options
            filter_options_list = []
            
            for school in schools:
                if school:  # Skip empty values
                    filter_options_list.append(FilterOptions(
                        option_type='schools',
                        option_value=school
                    ))

            for sector in sectors:
                if sector:  # Skip empty values
                    filter_options_list.append(FilterOptions(
                        option_type='sectors',
                        option_value=sector
                    ))

            for grade in grades:
                if grade:  # Skip empty values
                    filter_options_list.append(FilterOptions(
                        option_type='grades',
                        option_value=grade
                    ))

            for subject in subjects:
                if subject:  # Skip empty values
                    filter_options_list.append(FilterOptions(
                        option_type='subjects',
                        option_value=subject
                    ))

            if filter_options_list:
                FilterOptions.objects.bulk_create(filter_options_list)
                self.stdout.write(f"Synced {len(filter_options_list)} filter options")
            else:
                self.stdout.write("No filter options found in BigQuery")

            sync_log.status = 'success'
            sync_log.records_processed = len(filter_options_list)
            sync_log.completed_at = timezone.now()
            sync_log.save()

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
            raise 