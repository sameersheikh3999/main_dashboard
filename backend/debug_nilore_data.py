#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import TeacherData, SchoolData, UserSchoolProfile
from api.services import DataService
from django.contrib.auth.models import User
from api.models import UserProfile

def debug_nilore_data():
    """Debug what data exists for Nilore sector"""
    
    print("=== Debugging Nilore Sector Data ===\n")
    
    # Check TeacherData for Nilore
    nilore_teachers = TeacherData.objects.filter(sector='Nilore')
    print(f"TeacherData for Nilore sector: {nilore_teachers.count()} records")
    
    if nilore_teachers.count() > 0:
        print("Sample teacher records:")
        for i, teacher in enumerate(nilore_teachers[:5]):
            print(f"  {i+1}. {teacher.teacher} - {teacher.school} - LP: {teacher.lp_ratio}")
    
    # Check SchoolData for Nilore
    nilore_schools = SchoolData.objects.filter(sector='Nilore')
    print(f"\nSchoolData for Nilore sector: {nilore_schools.count()} records")
    
    if nilore_schools.count() > 0:
        print("Sample school records:")
        for i, school in enumerate(nilore_schools[:5]):
            print(f"  {i+1}. {school.school_name} - Teachers: {school.teacher_count} - LP: {school.avg_lp_ratio}")
    
    # Check UserSchoolProfile for Nilore
    nilore_profiles = UserSchoolProfile.objects.filter(sector='Nilore')
    print(f"\nUserSchoolProfile for Nilore sector: {nilore_profiles.count()} records")
    
    if nilore_profiles.count() > 0:
        print("Sample profile records:")
        for i, profile in enumerate(nilore_profiles[:5]):
            print(f"  {i+1}. {profile.teacher} - {profile.school}")
    
    # Test DataService summary stats for Nilore AEO
    print(f"\n=== Testing DataService for Nilore AEO ===")
    
    # Create a mock Nilore AEO profile
    mock_profile = UserProfile()
    mock_profile.role = 'AEO'
    mock_profile.sector = 'Nilore'
    
    # Get summary stats
    summary_stats = DataService.get_summary_stats(mock_profile)
    print(f"Summary stats for Nilore AEO:")
    print(f"  Total teachers: {summary_stats['total_teachers']}")
    print(f"  Total schools: {summary_stats['total_schools']}")
    print(f"  Total sectors: {summary_stats['total_sectors']}")
    print(f"  Avg LP ratio: {summary_stats['overall_avg_lp_ratio']}")
    
    # Check what sectors exist in TeacherData
    print(f"\n=== All Sectors in TeacherData ===")
    sectors = TeacherData.objects.values_list('sector', flat=True).distinct()
    for sector in sectors:
        count = TeacherData.objects.filter(sector=sector).count()
        print(f"  {sector}: {count} teacher records")
    
    print(f"\n=== Debug Complete ===")

if __name__ == '__main__':
    debug_nilore_data() 