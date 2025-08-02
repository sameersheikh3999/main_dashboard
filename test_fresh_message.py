#!/usr/bin/env python3
"""
Test sending a fresh message and check the conversation structure
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def test_fresh_message():
    """Test sending a fresh message to check conversation structure"""
    
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
    
    # Send a fresh test message
    message_data = {
        'receiver_id': 15,  # aeo_nilore local ID
        'message_text': 'FRESH TEST: This is a new test message to check conversation structure.'
    }
    
    print("📤 Sending fresh test message...")
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    
    if response.status_code == 201:
        message_data = response.json()
        print("✅ Fresh message sent successfully!")
        print(f"Message ID: {message_data['id']}")
        print(f"Conversation ID: {message_data['conversation']}")
        
        # Now check the conversation structure
        print(f"\n🔍 Checking conversation structure...")
        check_conversation_structure(message_data['conversation'], headers)
        
    else:
        print(f"❌ Failed to send fresh message: {response.status_code}")
        print(f"Response: {response.text}")

def check_conversation_structure(conversation_id, headers):
    """Check the structure of the conversation"""
    
    # Get messages for this conversation
    response = requests.get(f'{API_BASE_URL}/conversations/{conversation_id}/messages/', headers=headers)
    if response.status_code == 200:
        messages = response.json()
        print(f"📨 Found {len(messages)} messages in conversation:")
        
        for i, msg in enumerate(messages):
            print(f"  Message {i+1}:")
            print(f"    Sender: {msg.get('sender', {}).get('username')} (ID: {msg.get('sender', {}).get('id')})")
            print(f"    Receiver: {msg.get('receiver', {}).get('username')} (ID: {msg.get('receiver', {}).get('id')})")
            print(f"    Text: {msg.get('message_text', '')[:50]}...")
            print()
        
        # Check if the latest message has correct sender/receiver
        if messages:
            latest_msg = messages[-1]
            sender = latest_msg.get('sender', {}).get('username')
            receiver = latest_msg.get('receiver', {}).get('username')
            
            if sender == 'admin' and receiver == 'aeo_nilore':
                print("✅ Conversation structure is CORRECT!")
                print("   - Sender: admin")
                print("   - Receiver: aeo_nilore")
            elif sender == 'admin' and receiver == 'admin':
                print("❌ Conversation structure is WRONG!")
                print("   - Sender: admin")
                print("   - Receiver: admin (should be aeo_nilore)")
            else:
                print(f"⚠️  Unexpected conversation structure:")
                print(f"   - Sender: {sender}")
                print(f"   - Receiver: {receiver}")
    else:
        print(f"❌ Failed to get messages: {response.status_code}")

def main():
    print("🔍 Testing fresh message and conversation structure...")
    print("=" * 60)
    
    test_fresh_message()

if __name__ == "__main__":
    main() 