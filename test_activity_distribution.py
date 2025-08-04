#!/usr/bin/env python3
"""
Test script to check the distribution of active vs inactive schools
"""

import os
import sys
import django
import requests

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, UserProfile
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test_activity_distribution():
    """Test the activity distribution of schools"""
    
    print("Testing School Activity Distribution")
    print("=" * 50)
    
    # Check database directly
    total_schools = SchoolData.objects.count()
    active_schools = SchoolData.objects.filter(avg_lp_ratio__gte=15.0, teacher_count__gt=0).count()
    inactive_schools = total_schools - active_schools
    
    print(f"Database Analysis:")
    print(f"  - Total schools: {total_schools}")
    print(f"  - Active schools (LP >= 15%): {active_schools}")
    print(f"  - Inactive schools (LP < 15%): {inactive_schools}")
    print(f"  - Active percentage: {(active_schools/total_schools)*100:.1f}%")
    
    # Check LP ratio distribution
    print(f"\nLP Ratio Distribution:")
    high_performing = SchoolData.objects.filter(avg_lp_ratio__gte=20.0).count()
    medium_performing = SchoolData.objects.filter(avg_lp_ratio__gte=15.0, avg_lp_ratio__lt=20.0).count()
    low_performing = SchoolData.objects.filter(avg_lp_ratio__lt=15.0).count()
    
    print(f"  - High performing (>= 20%): {high_performing} schools")
    print(f"  - Medium performing (15-20%): {medium_performing} schools")
    print(f"  - Low performing (< 15%): {low_performing} schools")
    
    # Test API endpoint
    print(f"\nAPI Test:")
    
    # Create or get a test FDE user
    try:
        user = User.objects.get(username='test_fde_user')
    except User.DoesNotExist:
        user = User.objects.create_user(username='test_fde_user', password='testpass123')
        UserProfile.objects.create(
            user=user,
            role='FDE',
            sector='Test Sector'
        )
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Test the API endpoint
    url = "http://localhost:8000/api/schools-with-infrastructure/"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            
            api_active = sum(1 for school in data if school['activity_status'] == 'Active')
            api_inactive = sum(1 for school in data if school['activity_status'] == 'Inactive')
            
            print(f"  - API returned {len(data)} schools")
            print(f"  - API Active: {api_active}")
            print(f"  - API Inactive: {api_inactive}")
            print(f"  - API Active percentage: {(api_active/len(data))*100:.1f}%")
            
            # Show sample schools
            print(f"\nSample schools from API:")
            for school in data[:5]:
                status_color = "🟢" if school['activity_status'] == 'Active' else "🔴"
                print(f"  {status_color} {school['school_name']} (EMIS: {school['emis']})")
                print(f"    LP: {school['avg_lp_ratio']:.1f}%, Teachers: {school['teacher_count']}, Status: {school['activity_status']}")
                print(f"    Internet: {school['internet_availability']}, Ratio: {school['student_teacher_ratio']}")
                print()
            
        else:
            print(f"API Error: {response.status_code}")
            
    except Exception as e:
        print(f"API test failed: {e}")

if __name__ == "__main__":
    test_activity_distribution() 