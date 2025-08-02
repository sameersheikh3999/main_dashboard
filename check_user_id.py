#!/usr/bin/env python3
"""
Check the actual user ID of aeo_nilore in local database
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def check_local_user_id():
    """Check the actual user ID of aeo_nilore in local database"""
    
    # Login as admin
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
    
    # Get detailed user data from admin endpoint
    response = requests.get(f'{API_BASE_URL}/admin/data/users/', headers=headers)
    if response.status_code == 200:
        data = response.json()
        users = data.get('data', [])
        
        print("🔍 Searching for aeo_nilore in local database...")
        for user in users:
            if 'aeo_nilore' in user.get('username', ''):
                print(f"✅ Found aeo_nilore in local database:")
                print(f"   User ID: {user.get('id')}")
                print(f"   Username: {user.get('username')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Sector: {user.get('sector')}")
                return user.get('id')
        
        print("❌ aeo_nilore not found in local database")
        return None
    else:
        print(f"❌ Failed to get user data: {response.status_code}")
        return None

def test_messaging_with_correct_id():
    """Test messaging with the correct local user ID"""
    
    local_user_id = check_local_user_id()
    if not local_user_id:
        print("❌ Cannot test messaging - local user ID not found")
        return
    
    # Login as admin
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
    
    # Send test message with correct local user ID
    message_data = {
        'receiver_id': local_user_id,
        'message_text': 'Hello aeo_nilore! This is a test message using your local user ID.'
    }
    
    print(f"📤 Sending test message to aeo_nilore (Local ID: {local_user_id})...")
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    
    if response.status_code == 201:
        message_data = response.json()
        print("✅ Message sent successfully!")
        print(f"Message ID: {message_data['id']}")
        print(f"Conversation ID: {message_data['conversation']}")
        print(f"Timestamp: {message_data['timestamp']}")
        print(f"Message: {message_data['message_text']}")
        
        # Now check if aeo_nilore can see the message
        print("\n🔍 Checking if aeo_nilore can see the message...")
        check_aeo_conversations()
        
    else:
        print(f"❌ Failed to send message: {response.status_code}")
        print(f"Response: {response.text}")

def check_aeo_conversations():
    """Check what conversations aeo_nilore has access to"""
    
    # Try to login as aeo_nilore
    aeo_login = {
        'username': 'aeo_nilore',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=aeo_login)
    if response.status_code != 200:
        print(f"❌ aeo_nilore login failed: {response.text}")
        return
    
    aeo_token = response.json().get('token')
    headers = {'Authorization': f'Bearer {aeo_token}'}
    
    # Get aeo_nilore's conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 aeo_nilore has {len(conversations)} conversations:")
        
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
    print("🔍 Checking aeo_nilore user ID and testing messaging...")
    print("=" * 60)
    
    # Check local user ID
    local_user_id = check_local_user_id()
    
    if local_user_id:
        # Test messaging with correct ID
        test_messaging_with_correct_id()
    else:
        print("\n❌ Cannot proceed - local user ID not found")

if __name__ == "__main__":
    main() 