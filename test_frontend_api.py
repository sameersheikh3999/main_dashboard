#!/usr/bin/env python3
"""
Test script to verify frontend can access the new API endpoint
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import UserProfile
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test_frontend_api():
    """Test the frontend API access"""
    
    print("Testing Frontend API Access")
    print("=" * 50)
    
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
        print("Created test FDE user")
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"Generated access token: {access_token[:20]}...")
    
    # Test the new API endpoint
    url = "http://localhost:8000/api/schools-with-infrastructure/"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API returned {len(data)} schools")
            
            if len(data) > 0:
                print("\nSample schools from API:")
                for school in data[:3]:
                    print(f"  - {school['school_name']} (EMIS: {school['emis']})")
                    print(f"    Sector: {school['sector']}, Teachers: {school['teacher_count']}")
                    print(f"    LP: {school['avg_lp_ratio']:.1f}%, Internet: {school['internet_availability']}")
                    print(f"    Ratio: {school['student_teacher_ratio']}, Status: {school['activity_status']}")
                    print()
                
                # Check if we have the new columns
                first_school = data[0]
                has_internet = 'internet_availability' in first_school
                has_ratio = 'student_teacher_ratio' in first_school
                
                print(f"✅ New columns present:")
                print(f"  - Internet Availability: {has_internet}")
                print(f"  - Student Teacher Ratio: {has_ratio}")
                
                if has_internet and has_ratio:
                    print("🎉 All new columns are working correctly!")
                else:
                    print("❌ Some new columns are missing")
            else:
                print("❌ No schools returned from API")
        else:
            print(f"❌ API Error: {response.text}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
    
    # Test the old API endpoint for comparison
    print("\n" + "="*50)
    print("Testing old API endpoint for comparison...")
    
    old_url = "http://localhost:8000/api/bigquery/all-schools/"
    try:
        response = requests.get(old_url, headers=headers)
        print(f"Old API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Old API returned {len(data)} schools")
            
            if len(data) > 0:
                first_school = data[0]
                old_columns = list(first_school.keys())
                print(f"Old API columns: {old_columns}")
        else:
            print(f"Old API Error: {response.text}")
            
    except Exception as e:
        print(f"Old API test failed: {e}")

if __name__ == "__main__":
    test_frontend_api() 