#!/usr/bin/env python
"""
Test script to verify Ask Principal button functionality
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

def test_ask_principal_flow():
    """Test the complete Ask Principal flow"""
    print("=== Testing Ask Principal Button Functionality ===\n")
    
    # Step 1: Login as AEO
    print("1. Logging in as AEO...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Nilore', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_response.json()['token']
    print(f"✅ Login successful! AEO: {login_data['user']['username']} (Sector: {login_data['user']['profile']['sector']})")
    
    # Step 2: Get schools for the AEO's sector
    print("\n2. Getting schools for AEO sector...")
    schools_response = requests.get(
        'http://localhost:8000/api/bigquery/all-schools/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if schools_response.status_code != 200:
        print(f"❌ Schools fetch failed: {schools_response.text}")
        return
    
    schools_data = schools_response.json()
    nilore_schools = [school for school in schools_data if school.get('sector') == 'Nilore']
    print(f"✅ Found {len(nilore_schools)} schools in Nilore sector")
    
    if not nilore_schools:
        print("❌ No schools found in Nilore sector")
        return
    
    # Step 3: Test Ask Principal for each school
    print("\n3. Testing Ask Principal for each school...")
    successful_messages = 0
    
    for i, school in enumerate(nilore_schools[:3], 1):  # Test first 3 schools
        school_name = school.get('school_name')
        print(f"\n   {i}. Testing school: {school_name}")
        
        # Get principal details
        principal_response = requests.get(
            f'http://localhost:8000/api/principals/detail/?schoolName={school_name}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if principal_response.status_code != 200:
            print(f"     ❌ Could not get principal for {school_name}")
            continue
        
        principal_data = principal_response.json()
        print(f"     ✅ Principal found: {principal_data['username']} (ID: {principal_data['id']})")
        
        # Send message
        message_data = {
            'school_name': school_name,
            'message_text': f'Test message from AEO to {school_name} principal via Ask Principal button',
            'receiverId': principal_data['id']
        }
        
        message_response = requests.post(
            'http://localhost:8000/api/messages/',
            json=message_data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        )
        
        if message_response.status_code in [200, 201]:
            print(f"     ✅ Message sent successfully to {principal_data['username']}")
            successful_messages += 1
        else:
            print(f"     ❌ Failed to send message: {message_response.text}")
    
    print(f"\n=== Test Results ===")
    print(f"✅ Successful messages: {successful_messages}/3")
    print(f"📊 Success rate: {(successful_messages/3)*100:.1f}%")
    
    if successful_messages == 3:
        print("🎉 All Ask Principal tests passed!")
    else:
        print("⚠️  Some tests failed. Check the logs above.")

def test_principal_availability():
    """Test that principals are available for messaging"""
    print("\n=== Testing Principal Availability ===\n")
    
    # Get all principals in the database
    principals = UserProfile.objects.filter(role='Principal')
    print(f"Total principals in database: {principals.count()}")
    
    # Group by sector
    sector_counts = {}
    for principal in principals:
        sector = principal.sector or 'Unknown'
        sector_counts[sector] = sector_counts.get(sector, 0) + 1
    
    print("\nPrincipals by sector:")
    for sector, count in sector_counts.items():
        print(f"  {sector}: {count} principals")
    
    # Test a few principals from different sectors
    test_principals = principals[:5]
    print(f"\nTesting first 5 principals:")
    
    for i, principal in enumerate(test_principals, 1):
        print(f"  {i}. {principal.user.username} - {principal.school_name} ({principal.sector})")
    
    return len(principals) > 0

if __name__ == "__main__":
    # Test principal availability first
    if test_principal_availability():
        # Then test the Ask Principal flow
        test_ask_principal_flow()
    else:
        print("❌ No principals found in database. Cannot test Ask Principal functionality.") 