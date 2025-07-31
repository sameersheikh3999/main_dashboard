#!/usr/bin/env python
"""
Test script to verify authentication and data access
"""

import os
import sys
import django
import requests
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def test_authentication():
    """Test authentication with AEO user"""
    print("=== Testing Authentication ===\n")
    
    # Find an AEO user
    aeo = UserProfile.objects.filter(role='AEO').first()
    if not aeo:
        print("No AEO users found")
        return None
    
    print(f"Testing with AEO: {aeo.user.username} (Sector: {aeo.sector})")
    
    # Test login
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json={
                'username': aeo.user.username,
                'password': 'pass123'  # Default password
            },
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Access token: {data.get('access', 'Not found')[:50]}...")
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_data_access(token):
    """Test data access with token"""
    if not token:
        print("No token available for testing")
        return
    
    print("\n=== Testing Data Access ===\n")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test endpoints
    endpoints = [
        '/api/bigquery/summary-stats/',
        '/api/bigquery/all-schools/',
        '/api/bigquery/filter-options/',
        '/api/health/'
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', headers=headers)
            print(f"{endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    print(f"  ✅ Success - Keys: {list(data.keys())[:5]}")
                elif isinstance(data, list):
                    print(f"  ✅ Success - Items: {len(data)}")
                else:
                    print(f"  ✅ Success - Type: {type(data)}")
            else:
                print(f"  ❌ Failed: {response.text[:100]}")
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")

def check_user_passwords():
    """Check if AEO users have proper passwords"""
    print("\n=== Checking AEO User Passwords ===\n")
    
    aeos = UserProfile.objects.filter(role='AEO')
    print(f"Found {aeos.count()} AEO users:")
    
    for aeo in aeos:
        print(f"- {aeo.user.username} (Sector: {aeo.sector})")
        # Check if user can authenticate
        try:
            from django.contrib.auth import authenticate
            user = authenticate(username=aeo.user.username, password='pass123')
            if user:
                print(f"  ✅ Can authenticate with 'pass123'")
            else:
                print(f"  ❌ Cannot authenticate with 'pass123'")
        except Exception as e:
            print(f"  ❌ Error checking authentication: {str(e)}")

if __name__ == "__main__":
    check_user_passwords()
    token = test_authentication()
    test_data_access(token) 