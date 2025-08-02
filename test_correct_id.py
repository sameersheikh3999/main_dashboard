#!/usr/bin/env python3
"""
Test messaging with correct local user ID for aeo_nilore
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def test_messaging_with_correct_id():
    """Test messaging with the correct local user ID (15)"""
    
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
    
    # Send test message with correct local user ID (15)
    message_data = {
        'receiver_id': 15,  # Correct local user ID for aeo_nilore
        'message_text': 'Hello aeo_nilore! This is a test message using your correct local user ID (15).'
    }
    
    print(f"📤 Sending test message to aeo_nilore (Local ID: 15)...")
    
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
    print("🔍 Testing messaging with correct local user ID...")
    print("=" * 50)
    
    # Test messaging with correct ID
    test_messaging_with_correct_id()

if __name__ == "__main__":
    main() 