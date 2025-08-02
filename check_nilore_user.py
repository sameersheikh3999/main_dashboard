#!/usr/bin/env python3
"""
Check nilore user and test messaging
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def check_nilore_user():
    """Check if nilore user exists and get their details"""
    
    # First, login as admin
    admin_login = {
        'username': 'admin',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=admin_login)
    if response.status_code != 200:
        print("❌ Admin login failed")
        return None
    
    admin_token = response.json().get('token')
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Get all users to find nilore
    print("🔍 Searching for user 'nilore'...")
    
    # Check FDEs
    response = requests.get(f'{API_BASE_URL}/fdes/', headers=headers)
    if response.status_code == 200:
        fdes = response.json()
        for fde in fdes:
            if 'nilore' in fde.get('username', '').lower():
                print(f"✅ Found nilore in FDEs: {fde}")
                return fde
    
    # Check AEOs
    response = requests.get(f'{API_BASE_URL}/aeos/', headers=headers)
    if response.status_code == 200:
        aeos = response.json()
        for aeo in aeos:
            if 'nilore' in aeo.get('username', '').lower():
                print(f"✅ Found nilore in AEOs: {aeo}")
                return aeo
    
    # Check Principals
    response = requests.get(f'{API_BASE_URL}/principals/', headers=headers)
    if response.status_code == 200:
        principals = response.json()
        for principal in principals:
            if 'nilore' in principal.get('username', '').lower():
                print(f"✅ Found nilore in Principals: {principal}")
                return principal
    
    print("❌ User 'nilore' not found in any user lists")
    return None

def test_message_to_nilore():
    """Test sending a message to nilore user"""
    
    # First, login as admin
    admin_login = {
        'username': 'admin',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=admin_login)
    if response.status_code != 200:
        print("❌ Admin login failed")
        return
    
    admin_token = response.json().get('token')
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Find nilore user
    nilore_user = check_nilore_user()
    if not nilore_user:
        print("❌ Cannot send message - nilore user not found")
        return
    
    # Send test message
    message_data = {
        'receiver_id': nilore_user['id'],
        'message_text': 'Hello nilore! This is a test message from admin. Please check if you received this message.'
    }
    
    print(f"📤 Sending test message to {nilore_user['username']} (ID: {nilore_user['id']})...")
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    
    if response.status_code == 201:
        message_data = response.json()
        print("✅ Message sent successfully!")
        print(f"Message ID: {message_data['id']}")
        print(f"Conversation ID: {message_data['conversation']}")
        print(f"Timestamp: {message_data['timestamp']}")
        print(f"Message: {message_data['message_text']}")
        
        # Now check if nilore can see the message
        print("\n🔍 Checking if nilore can see the message...")
        check_nilore_conversations(nilore_user['id'])
        
    else:
        print(f"❌ Failed to send message: {response.status_code}")
        print(f"Response: {response.text}")

def check_nilore_conversations(user_id):
    """Check what conversations nilore has access to"""
    
    # Try to login as nilore
    nilore_login = {
        'username': 'aeo_nilore',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=nilore_login)
    if response.status_code != 200:
        print(f"❌ Nilore login failed: {response.text}")
        return
    
    nilore_token = response.json().get('token')
    headers = {'Authorization': f'Bearer {nilore_token}'}
    
    # Get nilore's conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 Nilore has {len(conversations)} conversations:")
        
        for conv in conversations:
            print(f"  - Conversation ID: {conv.get('id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    AEO: {conv.get('aeo')}")
            print(f"    Principal: {conv.get('principal')}")
            print(f"    Last Message: {conv.get('last_message_at')}")
            print()
            
            # Get messages for this conversation
            conv_id = conv.get('id')
            if conv_id:
                msg_response = requests.get(f'{API_BASE_URL}/conversations/{conv_id}/messages/', headers=headers)
                if msg_response.status_code == 200:
                    messages = msg_response.json()
                    print(f"    📨 Messages in this conversation ({len(messages)}):")
                    for msg in messages:
                        print(f"      - {msg.get('sender')} → {msg.get('receiver')}: {msg.get('message_text')[:50]}...")
                        print(f"        Time: {msg.get('timestamp')}")
                        print(f"        Read: {msg.get('is_read')}")
                        print()
    else:
        print(f"❌ Failed to get conversations: {response.status_code}")

def main():
    print("🔍 Checking nilore user and testing messaging...")
    print("=" * 50)
    
    # Check if nilore exists
    nilore_user = check_nilore_user()
    
    if nilore_user:
        print(f"\n✅ Found nilore user:")
        print(f"   Username: {nilore_user.get('username')}")
        print(f"   ID: {nilore_user.get('id')}")
        print(f"   Role: {nilore_user.get('role')}")
        print(f"   School: {nilore_user.get('school_name')}")
        
        # Test messaging
        print(f"\n📤 Testing message sending...")
        test_message_to_nilore()
    else:
        print("\n❌ Nilore user not found. Please check:")
        print("   1. User exists in the database")
        print("   2. User has correct role (FDE, AEO, or Principal)")
        print("   3. User profile is properly set up")

if __name__ == "__main__":
    main() 