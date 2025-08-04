from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Avg, Count
from api.models import TeacherData, SchoolData, SectorData
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Calculate and store school and sector LP ratios from teacher data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update-schools',
            action='store_true',
            help='Update school LP ratios'
        )
        parser.add_argument(
            '--update-sectors',
            action='store_true',
            help='Update sector LP ratios'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if data exists'
        )

    def handle(self, *args, **options):
        update_schools = options['update_schools']
        update_sectors = options['update_sectors']
        force = options['force']

        # If no specific option is provided, update both
        if not update_schools and not update_sectors:
            update_schools = True
            update_sectors = True

        self.stdout.write("Starting LP ratio calculations...")

        try:
            if update_schools:
                self.update_school_lp_ratios(force)
            
            if update_sectors:
                self.update_sector_lp_ratios(force)

            self.stdout.write(self.style.SUCCESS('LP ratio calculations completed successfully'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during calculations: {str(e)}'))
            logger.error(f'LP ratio calculation error: {str(e)}')

    def update_school_lp_ratios(self, force=False):
        """Update school LP ratios from teacher data"""
        self.stdout.write("Updating school LP ratios...")

        with transaction.atomic():
            # Get aggregated teacher data by school
            school_stats = TeacherData.objects.values('emis', 'school', 'sector').annotate(
                teacher_count=Count('user_id'),
                avg_lp_ratio=Avg('lp_ratio')
            )

            updated_count = 0
            created_count = 0

            for stat in school_stats:
                emis = stat['emis']
                school_name = stat['school']
                sector = stat['sector']
                teacher_count = stat['teacher_count']
                avg_lp_ratio = stat['avg_lp_ratio'] or 0

                # Update or create SchoolData record
                school_data, created = SchoolData.objects.update_or_create(
                    emis=emis,
                    defaults={
                        'school_name': school_name,
                        'sector': sector,
                        'teacher_count': teacher_count,
                        'avg_lp_ratio': avg_lp_ratio
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            self.stdout.write(f"School LP ratios: {created_count} created, {updated_count} updated")

    def update_sector_lp_ratios(self, force=False):
        """Update sector LP ratios from teacher data"""
        self.stdout.write("Updating sector LP ratios...")

        with transaction.atomic():
            # Get aggregated teacher data by sector
            sector_stats = TeacherData.objects.values('sector').annotate(
                teacher_count=Count('user_id'),
                avg_lp_ratio=Avg('lp_ratio'),
                school_count=Count('emis', distinct=True)
            )

            updated_count = 0
            created_count = 0

            for stat in sector_stats:
                sector = stat['sector']
                teacher_count = stat['teacher_count']
                avg_lp_ratio = stat['avg_lp_ratio'] or 0
                school_count = stat['school_count']

                # Update or create SectorData record
                sector_data, created = SectorData.objects.update_or_create(
                    sector=sector,
                    defaults={
                        'teacher_count': teacher_count,
                        'avg_lp_ratio': avg_lp_ratio,
                        'school_count': school_count
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            self.stdout.write(f"Sector LP ratios: {created_count} created, {updated_count} updated")

    def display_summary(self):
        """Display summary of calculated data"""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("LP RATIO CALCULATION SUMMARY")
        self.stdout.write("="*60)

        # School data summary
        total_schools = SchoolData.objects.count()
        avg_school_lp = SchoolData.objects.aggregate(avg=Avg('avg_lp_ratio'))['avg'] or 0
        
        self.stdout.write(f"Total Schools: {total_schools}")
        self.stdout.write(f"Average School LP Ratio: {avg_school_lp:.2f}%")

        # Sector data summary
        total_sectors = SectorData.objects.count()
        self.stdout.write(f"Total Sectors: {total_sectors}")
        
        self.stdout.write("\nSector Details:")
        for sector_data in SectorData.objects.all().order_by('sector'):
            self.stdout.write(f"  {sector_data.sector}: {sector_data.avg_lp_ratio:.2f}% "
                            f"({sector_data.teacher_count} teachers, {sector_data.school_count} schools)")

        self.stdout.write("="*60) 