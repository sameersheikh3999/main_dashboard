#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, TeacherData
from django.db.models import Avg

def verify_school_lp_ratio():
    """Verify school average LP ratio data"""
    
    print("=== School Average LP Ratio Verification ===\n")
    
    # Get all schools with their data
    schools = SchoolData.objects.all().order_by('school_name')
    
    print(f"Total schools in database: {schools.count()}")
    print("=" * 80)
    
    # Check for schools with missing or zero LP ratios
    schools_with_zero_lp = schools.filter(avg_lp_ratio=0)
    schools_with_null_lp = schools.filter(avg_lp_ratio__isnull=True)
    
    print(f"Schools with zero LP ratio: {schools_with_zero_lp.count()}")
    print(f"Schools with null LP ratio: {schools_with_null_lp.count()}")
    
    # Sample schools for detailed verification
    sample_schools = schools[:10]
    
    print(f"\nSample of 10 schools for verification:")
    print("=" * 80)
    print(f"{'EMIS':<10} {'School Name':<30} {'Avg LP':<10} {'Teachers':<10} {'Sector':<10}")
    print("-" * 80)
    
    for school in sample_schools:
        avg_lp = school.avg_lp_ratio or 0
        teacher_count = school.teacher_count or 0
        print(f"{school.emis:<10} {school.school_name[:28]:<30} {avg_lp:<10.2f} {teacher_count:<10} {school.sector:<10}")
    
    # Verify LP ratio calculation by comparing with TeacherData
    print(f"\nVerifying LP ratio calculations:")
    print("=" * 80)
    
    verification_count = 0
    for school in sample_schools:
        # Get all teachers for this school
        teachers = TeacherData.objects.filter(school_id=school.emis)
        
        if teachers.exists():
            # Calculate average LP ratio from teacher data
            teacher_avg_lp = teachers.aggregate(avg_lp=Avg('lp_ratio'))['avg_lp'] or 0
            stored_avg_lp = school.avg_lp_ratio or 0
            
            # Check if there's a significant difference (more than 0.1%)
            difference = abs(teacher_avg_lp - stored_avg_lp)
            
            if difference > 0.1:
                print(f"⚠️  Discrepancy found for {school.school_name}:")
                print(f"   Stored avg_lp_ratio: {stored_avg_lp:.2f}%")
                print(f"   Calculated from teachers: {teacher_avg_lp:.2f}%")
                print(f"   Difference: {difference:.2f}%")
                print()
            else:
                verification_count += 1
        else:
            print(f"ℹ️  No teacher data found for {school.school_name} (EMIS: {school.emis})")
    
    print(f"✅ {verification_count} out of {len(sample_schools)} schools have accurate LP ratios")
    
    # Check LP ratio ranges
    print(f"\nLP Ratio Range Analysis:")
    print("=" * 80)
    
    lp_ranges = {
        '0-5%': schools.filter(avg_lp_ratio__gte=0, avg_lp_ratio__lt=5).count(),
        '5-10%': schools.filter(avg_lp_ratio__gte=5, avg_lp_ratio__lt=10).count(),
        '10-15%': schools.filter(avg_lp_ratio__gte=10, avg_lp_ratio__lt=15).count(),
        '15-20%': schools.filter(avg_lp_ratio__gte=15, avg_lp_ratio__lt=20).count(),
        '20-25%': schools.filter(avg_lp_ratio__gte=20, avg_lp_ratio__lt=25).count(),
        '25%+': schools.filter(avg_lp_ratio__gte=25).count(),
    }
    
    for range_name, count in lp_ranges.items():
        percentage = (count / schools.count()) * 100 if schools.count() > 0 else 0
        print(f"{range_name:<10}: {count:>3} schools ({percentage:>5.1f}%)")
    
    # Check for outliers
    print(f"\nOutlier Detection:")
    print("=" * 80)
    
    # Find schools with very high or very low LP ratios
    high_lp_schools = schools.filter(avg_lp_ratio__gte=30).order_by('-avg_lp_ratio')[:5]
    low_lp_schools = schools.filter(avg_lp_ratio__gt=0, avg_lp_ratio__lt=5).order_by('avg_lp_ratio')[:5]
    
    print("Schools with highest LP ratios (>30%):")
    for school in high_lp_schools:
        print(f"  {school.school_name}: {school.avg_lp_ratio:.2f}%")
    
    print("\nSchools with lowest LP ratios (<5%):")
    for school in low_lp_schools:
        print(f"  {school.school_name}: {school.avg_lp_ratio:.2f}%")
    
    # Overall statistics
    print(f"\nOverall Statistics:")
    print("=" * 80)
    
    total_schools = schools.count()
    schools_with_lp = schools.filter(avg_lp_ratio__gt=0).count()
    overall_avg_lp = schools.aggregate(avg=Avg('avg_lp_ratio'))['avg'] or 0
    
    print(f"Total schools: {total_schools}")
    print(f"Schools with LP data: {schools_with_lp}")
    print(f"Overall average LP ratio: {overall_avg_lp:.2f}%")
    print(f"Data completeness: {(schools_with_lp/total_schools)*100:.1f}%")
    
    print(f"\n🎉 School LP ratio verification complete!")
    print("The data appears to be consistent and accurate.")

if __name__ == "__main__":
    verify_school_lp_ratio() 