#!/usr/bin/env python3
"""
Debug script to check school data and API endpoint
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

from api.models import SchoolData, UserProfile
from django.contrib.auth.models import User

def debug_school_data():
    """Debug the school data and API endpoint"""
    
    print("Debugging School Data and API")
    print("=" * 50)
    
    # Check if there's any data in SchoolData table
    school_count = SchoolData.objects.count()
    print(f"Total schools in SchoolData table: {school_count}")
    
    if school_count > 0:
        print("\nSample schools:")
        for school in SchoolData.objects.all()[:5]:
            print(f"  - {school.school_name} (EMIS: {school.emis}, Sector: {school.sector})")
    else:
        print("No schools found in SchoolData table!")
    
    # Check if there are any users with profiles
    user_count = UserProfile.objects.count()
    print(f"\nTotal user profiles: {user_count}")
    
    if user_count > 0:
        print("\nSample user profiles:")
        for profile in UserProfile.objects.all()[:3]:
            print(f"  - User: {profile.user.username}, Role: {profile.role}, Sector: {profile.sector}")
    
    # Test the API endpoint directly
    print("\nTesting API endpoint...")
    try:
        # Create a test user if none exists
        if user_count == 0:
            user = User.objects.create_user(username='test_fde', password='testpass123')
            UserProfile.objects.create(
                user=user,
                role='FDE',
                sector='Test Sector'
            )
            print("Created test FDE user")
        
        # Get the first user with FDE role
        fde_user = UserProfile.objects.filter(role='FDE').first()
        if not fde_user:
            print("No FDE user found!")
            return
        
        # Make API request
        url = "http://localhost:8000/api/schools-with-infrastructure/"
        headers = {'Authorization': 'Bearer test'}
        
        response = requests.get(url, headers=headers)
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"API returned {len(data)} schools")
            if len(data) > 0:
                print("\nSample API response:")
                for school in data[:3]:
                    print(f"  - {school['school_name']} (EMIS: {school['emis']})")
        else:
            print(f"API Error: {response.text}")
            
    except Exception as e:
        print(f"API test failed: {e}")
    
    # Check JSON file
    json_path = os.path.join('frontend', 'src', 'components', 'school_profile_data.json')
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            json_data = json.load(f)
        main_sheet = json_data.get('Main Sheet', [])
        print(f"\nJSON file contains {len(main_sheet)} school records")
        if len(main_sheet) > 0:
            print("Sample JSON records:")
            for record in main_sheet[:3]:
                emis = record.get("School's EMIS", "N/A")
                internet = record.get("Internet", "N/A")
                ratio = record.get("Student Teacher Ratio", "N/A")
                print(f"  - EMIS: {emis}, Internet: {internet}, Ratio: {ratio}")
    else:
        print(f"\nJSON file not found at: {json_path}")

if __name__ == "__main__":
    debug_school_data() 