from django.db.models import Q, Avg, Sum
from django.utils import timezone
from datetime import timedelta
from .models import TeacherData, AggregatedData, SchoolData, FilterOptions, DataSyncLog, UserSchoolProfile

class DataService:
    """Service class to handle data operations from Django database"""
    
    @staticmethod
    def get_teacher_data(user_profile, grade_filter='', subject_filter='', limit=1000):
        """Get teacher data from Django database with role-based filtering"""
        queryset = TeacherData.objects.all()
        
        # Apply role-based filters
        if user_profile.role == 'AEO':
            if user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
        elif user_profile.role == 'Principal':
            queryset = queryset.filter(school=user_profile.school_name)
        elif user_profile.role == 'FDE':
            # FDE can see all data
            pass
        
        # Apply grade filter
        if grade_filter:
            queryset = queryset.filter(grade=grade_filter)
        
        # Apply subject filter
        if subject_filter:
            queryset = queryset.filter(subject=subject_filter)
        
        # Order by school, teacher, and week start
        queryset = queryset.order_by('school', 'teacher', '-week_start')
        
        # Limit results
        queryset = queryset[:limit]
        
        # Convert to list of dictionaries
        data = []
        for item in queryset:
            data.append({
                'user_id': item.user_id,
                'teacher': item.teacher,
                'grade': item.grade,
                'subject': item.subject,
                'sector': item.sector,
                'emis': item.emis,
                'school': item.school,
                'week_start': str(item.week_start) if item.week_start else None,
                'week_end': str(item.week_end) if item.week_end else None,
                'week_number': item.week_number,
                'lp_ratio': float(item.lp_ratio) if item.lp_ratio else 0
            })
        
        # Return empty list if no data found (no dummy data)
        return data
    
    @staticmethod
    def get_aggregated_data(user_profile, period='weekly', grade_filter='', subject_filter='', limit=100):
        """Get aggregated data from Django database"""
        queryset = AggregatedData.objects.filter(period_type=period)
        
        # Apply role-based filters
        if user_profile.role == 'AEO':
            if user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
        elif user_profile.role == 'Principal':
            queryset = queryset.filter(school=user_profile.school_name)
        elif user_profile.role == 'FDE':
            # FDE can see all data
            pass
        
        # Apply grade and subject filters (these would need to be implemented differently
        # since aggregated data doesn't have individual grade/subject breakdown)
        # For now, we'll skip these filters for aggregated data
        
        # Order by period and school
        queryset = queryset.order_by('-period', 'school')
        
        # Limit results
        queryset = queryset[:limit]
        
        # Convert to list of dictionaries
        data = []
        for item in queryset:
            data.append({
                'school': item.school,
                'sector': item.sector,
                'period': str(item.period) if item.period else None,
                'teacher_count': int(item.teacher_count) if item.teacher_count else 0,
                'avg_lp_ratio': float(item.avg_lp_ratio) if item.avg_lp_ratio else 0
            })
        
        # Return empty list if no data found (no dummy data)
        return data
    
    @staticmethod
    def get_school_data(user_profile):
        """Get school data from Django database"""
        if user_profile.role == 'FDE':
            queryset = SchoolData.objects.all()
        elif user_profile.role == 'AEO':
            if user_profile.sector:
                queryset = SchoolData.objects.filter(sector=user_profile.sector)
            else:
                queryset = SchoolData.objects.none()
        elif user_profile.role == 'Principal':
            queryset = SchoolData.objects.filter(school_name=user_profile.school_name)
        else:
            queryset = SchoolData.objects.all()
        queryset = queryset.order_by('school_name')
        data = []
        for item in queryset:
            data.append({
                'school_name': item.school_name,
                'sector': item.sector,
                'emis': item.emis,
                'teacher_count': int(item.teacher_count) if item.teacher_count else 0,
                'avg_lp_ratio': float(item.avg_lp_ratio) if item.avg_lp_ratio else 0
            })
        return data
    
    @staticmethod
    def get_filter_options(user_profile):
        """Get filter options from Django database"""
        # Get schools
        schools_queryset = FilterOptions.objects.filter(option_type='schools')
        if user_profile.role == 'AEO':
            # For AEO, we need to filter schools by sector
            # This is a simplified approach - in a real scenario, you might need to join with school data
            if user_profile.sector:
                schools_queryset = schools_queryset.filter(option_value__contains=user_profile.sector)
        elif user_profile.role == 'Principal':
            schools_queryset = schools_queryset.filter(option_value=user_profile.school_name)
        
        schools = [item.option_value for item in schools_queryset.order_by('option_value')]
        
        # Get sectors
        sectors_queryset = FilterOptions.objects.filter(option_type='sectors')
        if user_profile.role == 'AEO':
            if user_profile.sector:
                sectors_queryset = sectors_queryset.filter(option_value=user_profile.sector)
        elif user_profile.role == 'Principal':
            # Principal can only see their school's sector
            # This would need to be implemented based on the school's sector
            pass
        
        sectors = [item.option_value for item in sectors_queryset.order_by('option_value')]
        
        # Get grades
        grades_queryset = FilterOptions.objects.filter(option_type='grades')
        grades = [item.option_value for item in grades_queryset.order_by('option_value')]
        
        # Get subjects
        subjects_queryset = FilterOptions.objects.filter(option_type='subjects')
        subjects = [item.option_value for item in subjects_queryset.order_by('option_value')]
        
        # Return real filter options from database (no dummy data)
        return {
            'schools': schools,
            'sectors': sectors,
            'grades': grades,
            'subjects': subjects,
            'periods': ['weekly', 'monthly', 'quarterly']
        }
    
    @staticmethod
    def get_summary_stats(user_profile, grade_filter='', subject_filter=''):
        """Get summary statistics from Django database"""
        if user_profile.role == 'FDE':
            total_schools = UserSchoolProfile.objects.values('school').distinct().count()
            total_sectors = SchoolData.objects.values('sector').distinct().count()
            total_teachers = UserSchoolProfile.objects.values('user_id').distinct().count()
            avg_lp_ratio = TeacherData.objects.aggregate(avg_ratio=Avg('lp_ratio'))['avg_ratio'] or 0
        elif user_profile.role == 'AEO':
            # For AEO, use UserSchoolProfile and SchoolData for sector-specific stats
            if user_profile.sector:
                # Get teachers from UserSchoolProfile for the sector
                teacher_data = UserSchoolProfile.objects.filter(sector=user_profile.sector)
                total_teachers = teacher_data.values('user_id').distinct().count()
                
                # Get schools from SchoolData for the sector
                school_data = SchoolData.objects.filter(sector=user_profile.sector)
                total_schools = school_data.count()
                
                # Calculate average LP ratio from SchoolData
                avg_lp_ratio = school_data.aggregate(avg_ratio=Avg('avg_lp_ratio'))['avg_ratio'] or 0
                
                total_sectors = 1  # AEO only sees their sector
            else:
                total_teachers = 0
                total_schools = 0
                total_sectors = 0
                avg_lp_ratio = 0
        else:
            # For Principal and other roles, use TeacherData
            teacher_data = TeacherData.objects.all()
            if user_profile.role == 'Principal':
                teacher_data = teacher_data.filter(school=user_profile.school_name)
            if grade_filter:
                teacher_data = teacher_data.filter(grade=grade_filter)
            if subject_filter:
                teacher_data = teacher_data.filter(subject=subject_filter)
            total_teachers = teacher_data.values('user_id').distinct().count()
            total_schools = teacher_data.values('school').distinct().count()
            total_sectors = teacher_data.values('sector').distinct().count()
            avg_lp_ratio = teacher_data.aggregate(avg_ratio=Avg('lp_ratio'))['avg_ratio'] or 0
        return {
            'total_teachers': total_teachers,
            'total_schools': total_schools,
            'total_sectors': total_sectors,
            'overall_avg_lp_ratio': float(avg_lp_ratio)
        }
    
    @staticmethod
    def check_data_freshness():
        """Check if data is fresh (updated within 2 hours)"""
        two_hours_ago = timezone.now() - timedelta(hours=2)
        
        # Check if we have any recent data
        recent_teacher_data = TeacherData.objects.filter(updated_at__gte=two_hours_ago).exists()
        recent_aggregated_data = AggregatedData.objects.filter(updated_at__gte=two_hours_ago).exists()
        recent_school_data = SchoolData.objects.filter(updated_at__gte=two_hours_ago).exists()
        recent_filter_options = FilterOptions.objects.filter(created_at__gte=two_hours_ago).exists()
        
        return {
            'teacher_data_fresh': recent_teacher_data,
            'aggregated_data_fresh': recent_aggregated_data,
            'school_data_fresh': recent_school_data,
            'filter_options_fresh': recent_filter_options,
            'all_fresh': all([recent_teacher_data, recent_aggregated_data, recent_school_data, recent_filter_options])
        }
    
    @staticmethod
    def get_sync_status():
        """Get the status of recent data sync operations"""
        recent_syncs = DataSyncLog.objects.filter(
            started_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-started_at')
        
        return recent_syncs
    
    @staticmethod
    def get_school_teachers_data(school_name):
        """Get detailed teacher data for a specific school"""
        # Get teachers from UserSchoolProfile for the school
        teachers_data = UserSchoolProfile.objects.filter(school=school_name)
        
        # Get teacher performance data from TeacherData
        teacher_performance = TeacherData.objects.filter(school=school_name)
        
        # Get school details from SchoolData
        school_details = SchoolData.objects.filter(school_name=school_name).first()
        
        # Combine data
        teachers_list = []
        for teacher in teachers_data:
            # Get latest performance data for this teacher
            latest_performance = teacher_performance.filter(
                teacher=teacher.teacher
            ).order_by('-week_start').first()
            
            teachers_list.append({
                'user_id': teacher.user_id,
                'teacher_name': teacher.teacher,
                'sector': teacher.sector,
                'emis': teacher.emis,
                'school': teacher.school,
                'latest_lp_ratio': float(latest_performance.lp_ratio) if latest_performance else 0,
                'latest_week': str(latest_performance.week_start) if latest_performance else None,
                'grade': latest_performance.grade if latest_performance else '',
                'subject': latest_performance.subject if latest_performance else ''
            })
        
        # Sort teachers by LP ratio (lowest to highest for performance review)
        teachers_list.sort(key=lambda x: x['latest_lp_ratio'])
        
        return {
            'school_details': {
                'school_name': school_name,
                'emis': school_details.emis if school_details else '',
                'sector': school_details.sector if school_details else '',
                'total_teachers': len(teachers_list),
                'avg_lp_ratio': float(school_details.avg_lp_ratio) if school_details else 0
            },
            'teachers': teachers_list
        } 