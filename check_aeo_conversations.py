#!/usr/bin/env python3
"""
Check specifically for AEO conversations in admin's conversation list
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def check_aeo_conversations():
    """Check specifically for AEO conversations"""
    
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
    
    print("🔍 Checking admin conversations for AEOs...")
    
    # Get admin conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 Admin has {len(conversations)} total conversations")
        
        # Filter for AEO conversations
        aeo_conversations = []
        for conv in conversations:
            other_user_role = conv.get('other_user', {}).get('role')
            if other_user_role == 'AEO':
                aeo_conversations.append(conv)
        
        print(f"📋 Found {len(aeo_conversations)} AEO conversations:")
        
        for i, conv in enumerate(aeo_conversations):
            print(f"\n  AEO Conversation {i+1}:")
            print(f"    ID: {conv.get('conversation_id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
            print(f"    Latest Message: {conv.get('latest_message', {}).get('text', '')[:50]}...")
            print(f"    Unread Count: {conv.get('unread_count')}")
            print(f"    Last Message At: {conv.get('last_message_at')}")
        
        if len(aeo_conversations) == 0:
            print("❌ No AEO conversations found! This is the problem.")
            print("🔍 Let's check what AEOs exist in the system...")
            check_available_aeos(headers)
    else:
        print(f"❌ Failed to get admin conversations: {response.status_code}")

def check_available_aeos(headers):
    """Check what AEOs are available in the system"""
    
    # Get AEOs from the AEO endpoint
    response = requests.get(f'{API_BASE_URL}/aeos/', headers=headers)
    if response.status_code == 200:
        aeos = response.json()
        print(f"📋 Found {len(aeos)} AEOs in the system:")
        
        for i, aeo in enumerate(aeos[:10]):  # Show first 10
            print(f"  {i+1}. ID: {aeo.get('id')}, Username: {aeo.get('username')}, Sector: {aeo.get('sector_name')}")
        
        if len(aeos) > 10:
            print(f"  ... and {len(aeos) - 10} more AEOs")
        
        # Test sending a message to the first AEO
        if len(aeos) > 0:
            first_aeo = aeos[0]
            test_send_to_aeo(first_aeo, headers)
    else:
        print(f"❌ Failed to get AEOs: {response.status_code}")

def test_send_to_aeo(aeo, headers):
    """Test sending a message to a specific AEO"""
    
    print(f"\n🧪 Testing message to AEO: {aeo.get('username')} (ID: {aeo.get('id')})")
    
    message_data = {
        'receiver_id': aeo.get('id'),
        'message_text': f'Test message to {aeo.get("username")} from admin'
    }
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    
    if response.status_code == 201:
        message_data = response.json()
        print(f"✅ Message sent successfully!")
        print(f"Message ID: {message_data['id']}")
        print(f"Conversation ID: {message_data['conversation']}")
        
        # Now check if the conversation appears in admin's list
        print(f"\n🔍 Checking if conversation appears in admin's list...")
        check_conversation_appears(message_data['conversation'], headers)
        
    else:
        print(f"❌ Failed to send message: {response.status_code}")
        print(f"Response: {response.text}")

def check_conversation_appears(conversation_id, headers):
    """Check if the conversation appears in admin's conversation list"""
    
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        
        # Look for the conversation
        found = False
        for conv in conversations:
            if conv.get('conversation_id') == conversation_id:
                found = True
                print(f"✅ Found conversation in admin's list!")
                print(f"   School: {conv.get('school_name')}")
                print(f"   Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
                break
        
        if not found:
            print(f"❌ Conversation {conversation_id} NOT found in admin's list!")
            print("This indicates a problem with conversation creation or retrieval.")
    else:
        print(f"❌ Failed to get conversations: {response.status_code}")

def main():
    print("🔍 Checking AEO conversations specifically...")
    print("=" * 50)
    
    check_aeo_conversations()

if __name__ == "__main__":
    main() 