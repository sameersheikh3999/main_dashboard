#!/usr/bin/env python
"""
Test script to verify the principal detail endpoint
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

def test_principal_endpoint():
    """Test the principal detail endpoint"""
    print("=== Testing Principal Detail Endpoint ===\n")
    
    # Find a principal to test with
    principal = UserProfile.objects.filter(role='Principal').first()
    if not principal:
        print("No principals found in database")
        return
    
    print(f"Testing with principal: {principal.user.username} (ID: {principal.user.id})")
    print(f"School: {principal.school_name}")
    print(f"Sector: {principal.sector}")
    print(f"EMIS: {principal.emis}")
    
    # Test the endpoint
    try:
        # First, get an admin user for authentication
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("No admin user found")
            return
        
        # Create a test client
        from django.test import Client
        client = Client()
        client.force_login(admin_user)
        
        # Test the endpoint
        response = client.get(f'/api/principals/detail/?schoolName={principal.school_name}')
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response data:")
            print(f"  ID: {data.get('id')} (should be {principal.user.id})")
            print(f"  Username: {data.get('username')}")
            print(f"  School: {data.get('school_name')}")
            print(f"  Role: {data.get('role')}")
            print(f"  EMIS: {data.get('emis')}")
            print(f"  Sector: {data.get('sector')}")
            
            # Verify the ID is correct
            if data.get('id') == principal.user.id:
                print("✅ ID is correct!")
            else:
                print(f"❌ ID mismatch! Expected {principal.user.id}, got {data.get('id')}")
        else:
            print(f"❌ Error: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {str(e)}")

def test_specific_principal():
    """Test with the specific principal that was causing issues"""
    print("\n=== Testing Specific Principal (principal_723) ===\n")
    
    try:
        principal = UserProfile.objects.filter(user__username='principal_723').first()
        if not principal:
            print("Principal 723 not found")
            return
        
        print(f"Principal: {principal.user.username} (ID: {principal.user.id})")
        print(f"School: {principal.school_name}")
        
        # Test the endpoint
        from django.test import Client
        client = Client()
        admin_user = User.objects.filter(is_superuser=True).first()
        client.force_login(admin_user)
        
        response = client.get(f'/api/principals/detail/?schoolName={principal.school_name}')
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response data:")
            print(f"  ID: {data.get('id')} (should be {principal.user.id})")
            print(f"  Username: {data.get('username')}")
            print(f"  School: {data.get('school_name')}")
            
            if data.get('id') == principal.user.id:
                print("✅ ID is correct! The messaging should now work.")
            else:
                print(f"❌ ID mismatch! Expected {principal.user.id}, got {data.get('id')}")
        else:
            print(f"❌ Error: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_principal_endpoint()
    test_specific_principal() 