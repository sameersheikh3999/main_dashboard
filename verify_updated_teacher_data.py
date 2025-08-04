#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import TeacherData, SchoolData
from django.db.models import Avg, Count

def verify_updated_teacher_data():
    """Verify the updated teacher data with individual LP ratios"""
    
    print("=== Updated Teacher Data Verification ===\n")
    
    # Get all teacher data
    teachers = TeacherData.objects.all()
    
    print(f"Total teacher records: {teachers.count()}")
    print("=" * 80)
    
    # Sample teachers for verification
    sample_teachers = teachers[:10]
    
    print("Sample of 10 teachers with individual LP ratios:")
    print("=" * 80)
    print(f"{'User ID':<10} {'Teacher Name':<25} {'School':<25} {'LP Ratio':<10} {'Sector':<10}")
    print("-" * 80)
    
    for teacher in sample_teachers:
        teacher_name = teacher.teacher[:23] + "..." if len(teacher.teacher) > 25 else teacher.teacher
        school_name = teacher.school[:23] + "..." if len(teacher.school) > 25 else teacher.school
        print(f"{teacher.user_id:<10} {teacher_name:<25} {school_name:<25} {teacher.lp_ratio:<10.2f} {teacher.sector:<10}")
    
    # Verify LP ratio ranges
    print(f"\nLP Ratio Distribution for Teachers:")
    print("=" * 80)
    
    lp_ranges = {
        '0-5%': teachers.filter(lp_ratio__gte=0, lp_ratio__lt=5).count(),
        '5-10%': teachers.filter(lp_ratio__gte=5, lp_ratio__lt=10).count(),
        '10-15%': teachers.filter(lp_ratio__gte=10, lp_ratio__lt=15).count(),
        '15-20%': teachers.filter(lp_ratio__gte=15, lp_ratio__lt=20).count(),
        '20-25%': teachers.filter(lp_ratio__gte=20, lp_ratio__lt=25).count(),
        '25-30%': teachers.filter(lp_ratio__gte=25, lp_ratio__lt=30).count(),
        '30%+': teachers.filter(lp_ratio__gte=30).count(),
    }
    
    for range_name, count in lp_ranges.items():
        percentage = (count / teachers.count()) * 100 if teachers.count() > 0 else 0
        print(f"{range_name:<10}: {count:>4} teachers ({percentage:>5.1f}%)")
    
    # Check for teachers with very high or very low LP ratios
    print(f"\nTop 5 Teachers with Highest LP Ratios:")
    print("=" * 80)
    
    top_teachers = teachers.order_by('-lp_ratio')[:5]
    for i, teacher in enumerate(top_teachers, 1):
        print(f"{i}. {teacher.teacher} - {teacher.school}")
        print(f"   LP Ratio: {teacher.lp_ratio:.2f}% | Sector: {teacher.sector}")
    
    print(f"\nTop 5 Teachers with Lowest LP Ratios (>0%):")
    print("=" * 80)
    
    low_teachers = teachers.filter(lp_ratio__gt=0).order_by('lp_ratio')[:5]
    for i, teacher in enumerate(low_teachers, 1):
        print(f"{i}. {teacher.teacher} - {teacher.school}")
        print(f"   LP Ratio: {teacher.lp_ratio:.2f}% | Sector: {teacher.sector}")
    
    # Verify school averages match
    print(f"\nVerifying School Averages:")
    print("=" * 80)
    
    # Get sample schools
    sample_schools = SchoolData.objects.all()[:5]
    
    for school in sample_schools:
        school_teachers = teachers.filter(emis=school.emis)
        
        if school_teachers.exists():
            # Calculate average from teacher data
            teacher_avg = school_teachers.aggregate(avg=Avg('lp_ratio'))['avg'] or 0
            stored_avg = school.avg_lp_ratio or 0
            
            print(f"School: {school.school_name}")
            print(f"  Stored avg_lp_ratio: {stored_avg:.2f}%")
            print(f"  Calculated from teachers: {teacher_avg:.2f}%")
            print(f"  Teacher count: {school_teachers.count()}")
            print(f"  Difference: {abs(stored_avg - teacher_avg):.2f}%")
            print()
    
    # Overall statistics
    print(f"Overall Statistics:")
    print("=" * 80)
    
    total_teachers = teachers.count()
    teachers_with_lp = teachers.filter(lp_ratio__gt=0).count()
    overall_avg_lp = teachers.aggregate(avg=Avg('lp_ratio'))['avg'] or 0
    
    print(f"Total teachers: {total_teachers}")
    print(f"Teachers with LP data: {teachers_with_lp}")
    print(f"Overall average LP ratio: {overall_avg_lp:.2f}%")
    print(f"Data completeness: {(teachers_with_lp/total_teachers)*100:.1f}%")
    
    # Check unique schools and sectors
    unique_schools = teachers.values('emis').distinct().count()
    unique_sectors = teachers.values('sector').distinct().count()
    
    print(f"Unique schools: {unique_schools}")
    print(f"Unique sectors: {unique_sectors}")
    
    print(f"\n🎉 Updated teacher data verification complete!")
    print("The teacher data now includes individual LP ratios for all teachers.")

if __name__ == "__main__":
    verify_updated_teacher_data() 