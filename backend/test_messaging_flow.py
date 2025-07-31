#!/usr/bin/env python
"""
Test script to verify the complete messaging flow
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

def test_complete_messaging_flow():
    """Test the complete messaging flow from AEO to Principal"""
    print("=== Testing Complete Messaging Flow ===\n")
    
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
    token = login_data['token']
    print(f"✅ Login successful! Token: {token[:50]}...")
    
    # Step 2: Get principal details
    print("\n2. Getting principal details...")
    school_name = "IMSG(I-X) NEW SHAKRIAL"
    principal_response = requests.get(
        f'http://localhost:8000/api/principals/detail/?schoolName={school_name}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if principal_response.status_code != 200:
        print(f"❌ Principal detail failed: {principal_response.text}")
        return
    
    principal_data = principal_response.json()
    print(f"✅ Principal data: {json.dumps(principal_data, indent=2)}")
    
    # Step 3: Send message
    print("\n3. Sending message...")
    message_data = {
        'school_name': school_name,
        'message_text': 'Test message from AEO to Principal',
        'receiverId': principal_data['id']  # Use the numeric ID
    }
    
    message_response = requests.post(
        'http://localhost:8000/api/messages/',
        json=message_data,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    )
    
    print(f"Message response status: {message_response.status_code}")
    if message_response.status_code in [200, 201]:
        print("✅ Message sent successfully!")
        message_result = message_response.json()
        print(f"Message result: {json.dumps(message_result, indent=2)}")
    else:
        print(f"❌ Message failed: {message_response.text}")
        
        # Let's check what the backend is receiving
        print(f"\nDebug - Request data sent:")
        print(f"  school_name: {message_data['school_name']}")
        print(f"  message_text: {message_data['message_text']}")
        print(f"  receiverId: {message_data['receiverId']} (type: {type(message_data['receiverId'])})")

def check_principal_in_database():
    """Check if principal exists in database"""
    print("\n=== Checking Principal in Database ===\n")
    
    principal = UserProfile.objects.filter(user__username='principal_723').first()
    if principal:
        print(f"✅ Principal found:")
        print(f"  Username: {principal.user.username}")
        print(f"  User ID: {principal.user.id}")
        print(f"  School: {principal.school_name}")
        print(f"  Sector: {principal.sector}")
        print(f"  EMIS: {principal.emis}")
    else:
        print("❌ Principal not found in database")

if __name__ == "__main__":
    check_principal_in_database()
    test_complete_messaging_flow() 