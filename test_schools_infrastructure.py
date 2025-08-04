#!/usr/bin/env python3
"""
Test script to verify the new schools with infrastructure endpoint
"""

import os
import sys
import django
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.views import SchoolsWithInfrastructureDataView
from django.test import RequestFactory
from django.contrib.auth.models import User
from api.models import UserProfile, SchoolData

def test_schools_infrastructure_endpoint():
    """Test the new schools with infrastructure endpoint"""
    
    print("Testing Schools with Infrastructure Endpoint")
    print("=" * 50)
    
    # Create a test user and profile
    try:
        user = User.objects.get(username='test_user')
    except User.DoesNotExist:
        user = User.objects.create_user(username='test_user', password='testpass123')
    
    try:
        profile = user.userprofile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(
            user=user,
            role='FDE',
            sector='Test Sector'
        )
    
    # Create some test school data
    test_schools = [
        {
            'emis': '123',
            'school_name': 'Test School 1',
            'sector': 'Test Sector',
            'teacher_count': 10,
            'avg_lp_ratio': 75.5,
            'internet_availability': 'Yes',
            'student_teacher_ratio': '1:25'
        },
        {
            'emis': '456',
            'school_name': 'Test School 2',
            'sector': 'Test Sector',
            'teacher_count': 15,
            'avg_lp_ratio': 82.3,
            'internet_availability': 'No',
            'student_teacher_ratio': '1:30'
        }
    ]
    
    # Create or update test schools
    for school_data in test_schools:
        SchoolData.objects.update_or_create(
            emis=school_data['emis'],
            defaults=school_data
        )
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/schools-with-infrastructure/')
    request.user = user
    request.query_params = {}  # Add query_params attribute
    
    # Test the view
    view = SchoolsWithInfrastructureDataView()
    view.request = request
    
    try:
        response = view.get(request)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.data
            print(f"Number of schools returned: {len(data)}")
            
            for school in data:
                print(f"\nSchool: {school['school_name']}")
                print(f"  EMIS: {school['emis']}")
                print(f"  Sector: {school['sector']}")
                print(f"  Teachers: {school['teacher_count']}")
                print(f"  Avg LP: {school['avg_lp_ratio']}%")
                print(f"  Internet: {school['internet_availability']}")
                print(f"  Student-Teacher Ratio: {school['student_teacher_ratio']}")
                print(f"  Status: {school['activity_status']}")
            
            print("\n✅ Test passed! The endpoint is working correctly.")
        else:
            print(f"❌ Test failed! Status code: {response.status_code}")
            print(f"Response: {response.data}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Clean up test data
    SchoolData.objects.filter(emis__in=['123', '456']).delete()
    print("\n🧹 Test data cleaned up.")

if __name__ == "__main__":
    test_schools_infrastructure_endpoint() 