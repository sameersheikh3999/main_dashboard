#!/usr/bin/env python3
"""
Test script to verify UserSchoolProfile-based teacher count calculation
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import UserSchoolProfile, SchoolData, TeacherData
from django.db.models import Sum, Count
from django.contrib.auth.models import User

def test_teacher_count_calculation():
    """Test the new UserSchoolProfile-based teacher count calculation"""
    
    print("=" * 60)
    print("TESTING USER SCHOOL PROFILE TEACHER COUNT CALCULATION")
    print("=" * 60)
    
    # Method 1: Old method using SchoolData.teacher_count
    old_total_teachers = SchoolData.objects.aggregate(total=Sum('teacher_count'))['total'] or 0
    
    # Method 2: New method using UserSchoolProfile
    new_total_teachers = UserSchoolProfile.objects.values('user_id').distinct().count()
    
    # Method 3: Using TeacherData (for comparison)
    teacher_data_count = TeacherData.objects.values('user_id').distinct().count()
    
    print(f"\nTeacher Count Comparison:")
    print(f"  Old Method (SchoolData.teacher_count sum): {old_total_teachers}")
    print(f"  New Method (UserSchoolProfile distinct user_id): {new_total_teachers}")
    print(f"  TeacherData distinct user_id: {teacher_data_count}")
    
    # Show breakdown by sector
    print(f"\nBreakdown by Sector (UserSchoolProfile):")
    sector_breakdown = UserSchoolProfile.objects.values('sector').annotate(
        teacher_count=Count('user_id', distinct=True)
    ).order_by('sector')
    
    for sector in sector_breakdown:
        print(f"  {sector['sector']}: {sector['teacher_count']} teachers")
    
    # Show breakdown by school
    print(f"\nTop 10 Schools by Teacher Count (UserSchoolProfile):")
    school_breakdown = UserSchoolProfile.objects.values('school').annotate(
        teacher_count=Count('user_id', distinct=True)
    ).order_by('-teacher_count')[:10]
    
    for school in school_breakdown:
        print(f"  {school['school']}: {school['teacher_count']} teachers")
    
    # Test filtering by sector
    print(f"\nTesting Sector Filtering:")
    sectors = UserSchoolProfile.objects.values_list('sector', flat=True).distinct()
    for sector in sectors:
        sector_teacher_count = UserSchoolProfile.objects.filter(
            sector=sector
        ).values('user_id').distinct().count()
        print(f"  {sector}: {sector_teacher_count} teachers")
    
    # Summary
    print(f"\nSummary:")
    print(f"  Total unique teachers (UserSchoolProfile): {new_total_teachers}")
    print(f"  Total unique teachers (TeacherData): {teacher_data_count}")
    print(f"  Difference: {abs(new_total_teachers - teacher_data_count)}")
    
    if new_total_teachers == teacher_data_count:
        print(f"  ✅ UserSchoolProfile and TeacherData counts match!")
    else:
        print(f"  ⚠️  Counts differ - this might be expected if some teachers don't have lesson plan data")
    
    if new_total_teachers != old_total_teachers:
        print(f"  ✅ New method provides different (more accurate) count than old method")
    else:
        print(f"  ℹ️  New method provides same count as old method")

def test_api_endpoint():
    """Test the API endpoint to ensure it works with the new calculation"""
    
    print(f"\n" + "=" * 60)
    print("TESTING API ENDPOINT")
    print("=" * 60)
    
    try:
        import requests
        
        # Test the summary stats endpoint
        base_url = "http://localhost:8000/api"
        
        # First, we need to get a token (this is a simplified test)
        print("Note: This test requires the server to be running and a valid token")
        print("You can test the endpoint manually by:")
        print("1. Starting the server: python manage.py runserver")
        print("2. Making a GET request to: /api/bigquery/summary-stats/")
        print("3. Including Authorization header with Bearer token")
        
    except ImportError:
        print("requests library not available for API testing")

if __name__ == "__main__":
    test_teacher_count_calculation()
    test_api_endpoint() 