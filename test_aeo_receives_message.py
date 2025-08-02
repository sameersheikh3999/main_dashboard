#!/usr/bin/env python3
"""
Test if AEO users can see and receive admin messages
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def test_aeo_receives_message():
    """Test if aeo_nilore can see the admin message"""
    
    # Login as aeo_nilore
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
    
    print("🔍 Testing if aeo_nilore can see admin messages...")
    
    # Get aeo_nilore's conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 aeo_nilore has {len(conversations)} conversations:")
        
        # Look for admin broadcast conversations
        admin_conversations = []
        for conv in conversations:
            school_name = conv.get('school_name', '')
            if 'Admin Broadcast' in school_name:
                admin_conversations.append(conv)
        
        print(f"📋 Found {len(admin_conversations)} admin broadcast conversations:")
        
        for i, conv in enumerate(admin_conversations):
            print(f"\n  Admin Conversation {i+1}:")
            print(f"    ID: {conv.get('conversation_id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
            print(f"    Latest Message: {conv.get('latest_message', {}).get('text', '')[:50]}...")
            print(f"    Unread Count: {conv.get('unread_count')}")
            print(f"    Last Message At: {conv.get('last_message_at')}")
            
            # Get detailed messages for this conversation
            conv_id = conv.get('conversation_id')
            if conv_id:
                print(f"    📨 Getting detailed messages...")
                msg_response = requests.get(f'{API_BASE_URL}/conversations/{conv_id}/messages/', headers=headers)
                if msg_response.status_code == 200:
                    messages = msg_response.json()
                    print(f"    Found {len(messages)} messages:")
                    for j, msg in enumerate(messages):
                        print(f"      Message {j+1}:")
                        print(f"        ID: {msg.get('id')}")
                        print(f"        Sender: {msg.get('sender', {}).get('username')}")
                        print(f"        Receiver: {msg.get('receiver', {}).get('username')}")
                        print(f"        Text: {msg.get('message_text', '')[:50]}...")
                        print(f"        Time: {msg.get('timestamp')}")
                        print(f"        Read: {msg.get('is_read')}")
                        print()
                else:
                    print(f"    ❌ Failed to get messages: {msg_response.status_code}")
        
        if len(admin_conversations) == 0:
            print("❌ No admin broadcast conversations found for aeo_nilore!")
            print("This means aeo_nilore cannot see admin messages.")
            
            # Show all conversations to see what they can see
            print(f"\n🔍 All conversations aeo_nilore can see:")
            for i, conv in enumerate(conversations[:5]):  # Show first 5
                print(f"  {i+1}. School: {conv.get('school_name')}")
                print(f"     Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
                print(f"     Latest Message: {conv.get('latest_message', {}).get('text', '')[:30]}...")
        else:
            print("✅ aeo_nilore CAN see admin messages!")
    else:
        print(f"❌ Failed to get conversations: {response.status_code}")

def test_other_aeos():
    """Test if other AEOs can see admin messages"""
    
    # Login as admin
    admin_login = {
        'username': 'admin',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=admin_login)
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.text}")
        return
    
    admin_token = response.json().get('token')
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Get AEOs
    response = requests.get(f'{API_BASE_URL}/aeos/', headers=headers)
    if response.status_code == 200:
        aeos = response.json()
        print(f"\n🔍 Testing other AEOs...")
        print(f"📋 Found {len(aeos)} AEOs in total")
        
        # Test with a few AEOs
        test_aeos = aeos[:3]  # Test first 3 AEOs
        
        for aeo in test_aeos:
            print(f"\n🧪 Testing AEO: {aeo.get('username')} (ID: {aeo.get('id')})")
            
            # Send a test message
            message_data = {
                'receiver_id': aeo.get('id'),
                'message_text': f'Test message to {aeo.get("username")} from admin'
            }
            
            response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
            
            if response.status_code == 201:
                print(f"✅ Message sent to {aeo.get('username')}")
            else:
                print(f"❌ Failed to send message to {aeo.get('username')}: {response.status_code}")

def main():
    print("🔍 Testing if AEOs can receive admin messages...")
    print("=" * 50)
    
    # Test aeo_nilore specifically
    test_aeo_receives_message()
    
    # Test other AEOs
    test_other_aeos()

if __name__ == "__main__":
    main() 