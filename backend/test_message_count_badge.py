#!/usr/bin/env python
"""
Test script to verify message count badge functionality
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
from api.models import UserProfile, Message, Conversation
from django.utils import timezone

def test_message_count_badge():
    """Test the complete message count badge functionality"""
    print("=== Testing Message Count Badge Functionality ===\n")
    
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
    
    token = login_response.json()['token']
    print(f"✅ Login successful! AEO: Nilore")
    
    # Step 2: Check initial unread count
    print("\n2. Checking initial unread count...")
    count_response = requests.get(
        'http://localhost:8000/api/messages/unread-count/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if count_response.status_code != 200:
        print(f"❌ Unread count failed: {count_response.text}")
        return
    
    initial_count = count_response.json()['unread_count']
    print(f"✅ Initial unread count: {initial_count}")
    
    # Step 3: Create a test message to increase count
    print("\n3. Creating test message to increase count...")
    
    # Get users
    aeo = User.objects.get(username='Nilore')
    principal = User.objects.get(username='principal_723')
    
    # Create conversation if it doesn't exist
    conv, created = Conversation.objects.get_or_create(
        id='test-badge-conv',
        defaults={
            'school_name': 'Test Badge School',
            'aeo': aeo,
            'principal': principal
        }
    )
    
    # Create unread message with unique ID
    import uuid
    test_message = Message.objects.create(
        id=str(uuid.uuid4()),
        conversation=conv,
        sender=principal,
        receiver=aeo,
        message_text='Test message for badge count',
        timestamp=timezone.now(),
        is_read=False
    )
    
    print(f"✅ Created test message: {test_message.id}")
    
    # Step 4: Check updated unread count
    print("\n4. Checking updated unread count...")
    count_response = requests.get(
        'http://localhost:8000/api/messages/unread-count/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if count_response.status_code != 200:
        print(f"❌ Updated unread count failed: {count_response.text}")
        return
    
    updated_count = count_response.json()['unread_count']
    print(f"✅ Updated unread count: {updated_count}")
    
    # Step 5: Mark message as read
    print("\n5. Marking message as read...")
    mark_read_response = requests.post(
        f'http://localhost:8000/api/conversations/{conv.id}/mark-read/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if mark_read_response.status_code in [200, 201]:
        print("✅ Message marked as read")
    else:
        print(f"❌ Mark as read failed: {mark_read_response.text}")
    
    # Step 6: Check final unread count
    print("\n6. Checking final unread count...")
    count_response = requests.get(
        'http://localhost:8000/api/messages/unread-count/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if count_response.status_code != 200:
        print(f"❌ Final unread count failed: {count_response.text}")
        return
    
    final_count = count_response.json()['unread_count']
    print(f"✅ Final unread count: {final_count}")
    
    # Step 7: Clean up test data
    print("\n7. Cleaning up test data...")
    test_message.delete()
    if created:
        conv.delete()
    print("✅ Test data cleaned up")
    
    # Summary
    print(f"\n=== Test Results ===")
    print(f"Initial count: {initial_count}")
    print(f"After creating message: {updated_count}")
    print(f"After marking as read: {final_count}")
    
    if updated_count > initial_count and final_count <= initial_count:
        print("🎉 Message count badge functionality working correctly!")
    else:
        print("⚠️  Some issues detected with message count badge functionality")

def test_multiple_users():
    """Test message count for multiple users"""
    print("\n=== Testing Multiple Users ===\n")
    
    users = [
        ('Nilore', 'AEO'),
        ('principal_723', 'Principal'),
        ('Tarnol', 'AEO')
    ]
    
    for username, role in users:
        print(f"Testing {username} ({role})...")
        
        # Login
        login_response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json={'username': username, 'password': 'pass123'},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"  ❌ Login failed for {username}")
            continue
        
        token = login_response.json()['token']
        
        # Get unread count
        count_response = requests.get(
            'http://localhost:8000/api/messages/unread-count/',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if count_response.status_code == 200:
            count = count_response.json()['unread_count']
            print(f"  ✅ Unread count: {count}")
        else:
            print(f"  ❌ Failed to get count for {username}")

if __name__ == "__main__":
    test_message_count_badge()
    test_multiple_users() 