#!/usr/bin/env python3
"""
Debug conversation data to see what's actually stored
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def debug_conversation_data():
    """Debug the conversation data to see what's actually stored"""
    
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
    
    print("🔍 Debugging conversation data for aeo_nilore...")
    
    # Get conversations using the user conversations endpoint
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 aeo_nilore has {len(conversations)} conversations:")
        
        for i, conv in enumerate(conversations):
            print(f"\n  Conversation {i+1}:")
            print(f"    ID: {conv.get('conversation_id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
            print(f"    Latest Message: {conv.get('latest_message', {}).get('text', '')[:50]}...")
            print(f"    Unread Count: {conv.get('unread_count')}")
            print(f"    Last Message At: {conv.get('last_message_at')}")
            
            # Get detailed messages for this conversation
            conv_id = conv.get('conversation_id')
            if conv_id:
                print(f"    📨 Getting detailed messages for conversation {conv_id}...")
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
    else:
        print(f"❌ Failed to get conversations: {response.status_code}")

def check_admin_conversations():
    """Check what conversations admin can see"""
    
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
    
    print("\n🔍 Checking admin conversations...")
    
    # Get admin conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 Admin has {len(conversations)} conversations:")
        
        for i, conv in enumerate(conversations):
            print(f"\n  Conversation {i+1}:")
            print(f"    ID: {conv.get('conversation_id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
            print(f"    Latest Message: {conv.get('latest_message', {}).get('text', '')[:50]}...")
            print(f"    Unread Count: {conv.get('unread_count')}")
            print(f"    Last Message At: {conv.get('last_message_at')}")
    else:
        print(f"❌ Failed to get admin conversations: {response.status_code}")

def main():
    print("🔍 Debugging conversation data...")
    print("=" * 50)
    
    # Debug aeo_nilore conversations
    debug_conversation_data()
    
    # Check admin conversations
    check_admin_conversations()

if __name__ == "__main__":
    main() 