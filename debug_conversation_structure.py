#!/usr/bin/env python3
"""
Debug conversation structure to understand why AEO conversations show as "admin ↔ admin"
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def debug_conversation_structure():
    """Debug the conversation structure to understand the issue"""
    
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
    
    print("🔍 Debugging conversation structure...")
    
    # Get admin conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        print(f"📋 Admin has {len(conversations)} total conversations")
        
        # Look for AEO conversations specifically
        aeo_conversations = []
        for conv in conversations:
            school_name = conv.get('school_name', '')
            if 'Admin Broadcast - aeo_' in school_name:
                aeo_conversations.append(conv)
        
        print(f"📋 Found {len(aeo_conversations)} AEO broadcast conversations:")
        
        for i, conv in enumerate(aeo_conversations[:5]):  # Show first 5
            print(f"\n  AEO Conversation {i+1}:")
            print(f"    ID: {conv.get('conversation_id')}")
            print(f"    School: {conv.get('school_name')}")
            print(f"    Other User: {conv.get('other_user', {}).get('username')} ({conv.get('other_user', {}).get('role')})")
            print(f"    Latest Message: {conv.get('latest_message', {}).get('text', '')[:50]}...")
            print(f"    Unread Count: {conv.get('unread_count')}")
            
            # Get detailed conversation data
            conv_id = conv.get('conversation_id')
            if conv_id:
                print(f"    📨 Getting detailed conversation data...")
                msg_response = requests.get(f'{API_BASE_URL}/conversations/{conv_id}/messages/', headers=headers)
                if msg_response.status_code == 200:
                    messages = msg_response.json()
                    print(f"    Found {len(messages)} messages:")
                    for j, msg in enumerate(messages):
                        print(f"      Message {j+1}:")
                        print(f"        Sender: {msg.get('sender', {}).get('username')} (ID: {msg.get('sender', {}).get('id')})")
                        print(f"        Receiver: {msg.get('receiver', {}).get('username')} (ID: {msg.get('receiver', {}).get('id')})")
                        print(f"        Text: {msg.get('message_text', '')[:30]}...")
                        print()
        
        # Now let's check what the actual conversation structure looks like in the database
        print(f"\n🔍 Checking database conversation structure...")
        check_database_conversations(headers)

def check_database_conversations(headers):
    """Check the actual conversation structure in the database"""
    
    # Try to get raw conversation data using a different endpoint
    # Let's check if there's a way to get the conversation details directly
    
    # Get one specific AEO conversation
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        
        # Find an AEO conversation
        aeo_conv = None
        for conv in conversations:
            if 'Admin Broadcast - aeo_' in conv.get('school_name', ''):
                aeo_conv = conv
                break
        
        if aeo_conv:
            print(f"🔍 Analyzing AEO conversation: {aeo_conv.get('school_name')}")
            print(f"   Conversation ID: {aeo_conv.get('conversation_id')}")
            print(f"   Other User: {aeo_conv.get('other_user')}")
            print(f"   This suggests the conversation structure might be incorrect")
            
            # Let's check what the UserConversationsView is actually returning
            print(f"\n🔍 The issue might be in how UserConversationsView determines 'other_user'")
            print(f"   For AEO conversations, the logic should be:")
            print(f"   - If current_user is admin and conversation.aeo is AEO, other_user should be the AEO")
            print(f"   - If current_user is admin and conversation.principal is AEO, other_user should be the AEO")
            print(f"   - But it's showing 'admin' as other_user, which suggests a logic error")

def test_aeo_perspective():
    """Test how AEOs see the same conversation"""
    
    print(f"\n🔍 Testing AEO perspective...")
    
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
    
    # Get aeo_nilore's conversations
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    if response.status_code == 200:
        conversations = response.json()
        
        # Find admin broadcast conversation
        admin_conv = None
        for conv in conversations:
            if 'Admin Broadcast' in conv.get('school_name', ''):
                admin_conv = conv
                break
        
        if admin_conv:
            print(f"✅ aeo_nilore sees admin conversation:")
            print(f"   School: {admin_conv.get('school_name')}")
            print(f"   Other User: {admin_conv.get('other_user', {}).get('username')} ({admin_conv.get('other_user', {}).get('role')})")
            print(f"   This should show 'admin' as the other user, which is correct")
        else:
            print(f"❌ aeo_nilore cannot see admin conversation")

def main():
    print("🔍 Debugging conversation structure issue...")
    print("=" * 50)
    
    debug_conversation_structure()
    test_aeo_perspective()

if __name__ == "__main__":
    main() 