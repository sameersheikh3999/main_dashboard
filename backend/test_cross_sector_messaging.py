#!/usr/bin/env python
"""
Test script to verify cross-sector messaging between AEO and Principal
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

def test_cross_sector_messaging():
    """Test messaging between AEO from one sector and Principal from another"""
    print("=== Testing Cross-Sector Messaging ===\n")
    
    # Step 1: Login as Tarnol AEO
    print("1. Logging in as Tarnol AEO...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Tarnol', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_response.json()['token']
    print(f"✅ Login successful! AEO: {login_data['user']['username']} (Sector: {login_data['user']['profile']['sector']})")
    
    # Step 2: Get principal details (from Nilore sector)
    print("\n2. Getting principal details (Nilore sector)...")
    school_name = "IMSG(I-X) NEW SHAKRIAL"  # This principal is in Nilore sector
    principal_response = requests.get(
        f'http://localhost:8000/api/principals/detail/?schoolName={school_name}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if principal_response.status_code != 200:
        print(f"❌ Principal detail failed: {principal_response.text}")
        return
    
    principal_data = principal_response.json()
    print(f"✅ Principal data: {principal_data['username']} (Sector: {principal_data['sector']})")
    
    # Step 3: Send cross-sector message
    print("\n3. Sending cross-sector message...")
    message_data = {
        'school_name': school_name,
        'message_text': 'Cross-sector message from Tarnol AEO to Nilore Principal',
        'receiverId': principal_data['id']
    }
    
    message_response = requests.post(
        'http://localhost:8000/api/messages/',
        json=message_data,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    )
    
    print(f"Message response status: {message_response.status_code}")
    if message_response.status_code in [200, 201]:
        print("✅ Cross-sector message sent successfully!")
        message_result = message_response.json()
        print(f"Message ID: {message_result['id']}")
        print(f"Sender: {message_result['sender']['username']} ({message_result['sender']['profile']['sector']})")
        print(f"Receiver: {message_result['receiver']['username']} ({message_result['receiver']['profile']['sector']})")
        print(f"Message: {message_result['message_text']}")
    else:
        print(f"❌ Cross-sector message failed: {message_response.text}")

def test_multiple_principals():
    """Test messaging to different principals"""
    print("\n=== Testing Multiple Principals ===\n")
    
    # Login as AEO
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Nilore', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    
    # Get a few different principals
    principals = UserProfile.objects.filter(role='Principal')[:3]
    
    for i, principal in enumerate(principals, 1):
        print(f"\n{i}. Testing with principal: {principal.user.username} (School: {principal.school_name})")
        
        # Get principal details via API
        principal_response = requests.get(
            f'http://localhost:8000/api/principals/detail/?schoolName={principal.school_name}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if principal_response.status_code == 200:
            principal_data = principal_response.json()
            
            # Send message
            message_data = {
                'school_name': principal.school_name,
                'message_text': f'Test message to {principal.user.username}',
                'receiverId': principal_data['id']
            }
            
            message_response = requests.post(
                'http://localhost:8000/api/messages/',
                json=message_data,
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            )
            
            if message_response.status_code in [200, 201]:
                print(f"  ✅ Message sent successfully to {principal.user.username}")
            else:
                print(f"  ❌ Failed to send message to {principal.user.username}")
        else:
            print(f"  ❌ Could not get details for {principal.user.username}")

if __name__ == "__main__":
    test_cross_sector_messaging()
    test_multiple_principals() 