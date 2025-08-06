#!/usr/bin/env python3
"""
Test script to verify instant message reception and real-time updates
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_USERS = {
    'fde': {
        'username': 'fde',
        'password': 'Pass@1234'
    },
    'aeo': {
        'username': 'Nilore',
        'password': 'Pass@123'
    }
}

def authenticate_user(username, password):
    """Authenticate user and return token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", {
            'username': username,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token') or data.get('access')
            if token:
                print(f"✅ Authenticated {username} successfully")
                return token
            else:
                print(f"❌ No token received for {username}")
                return None
        else:
            print(f"❌ Authentication failed for {username}: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error authenticating {username}: {e}")
        return None

def get_user_info(token, username):
    """Get user information"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Got user info for {username}: {user_data.get('username')}")
            return user_data
        else:
            print(f"❌ Failed to get user info for {username}: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting user info for {username}: {e}")
        return None

def get_conversations(token):
    """Get user conversations"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{BASE_URL}/conversations/", headers=headers)
        
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ Got {len(conversations)} conversations")
            return conversations
        else:
            print(f"❌ Failed to get conversations: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting conversations: {e}")
        return []

def get_messages(token, conversation_id):
    """Get messages for a conversation"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{BASE_URL}/conversations/{conversation_id}/messages/", headers=headers)
        
        if response.status_code == 200:
            messages = response.json()
            print(f"✅ Got {len(messages)} messages for conversation {conversation_id}")
            return messages
        else:
            print(f"❌ Failed to get messages: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting messages: {e}")
        return []

def send_message(token, school_name, message_text, receiver_id, conversation_id=None):
    """Send a message"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        data = {
            'school_name': school_name,
            'message_text': message_text,
            'receiverId': receiver_id
        }
        if conversation_id:
            data['conversation_id'] = conversation_id
            
        response = requests.post(f"{BASE_URL}/messages/", json=data, headers=headers)
        
        if response.status_code == 201:
            message_data = response.json()
            print(f"✅ Message sent successfully: {message_data.get('id')}")
            return message_data
        else:
            print(f"❌ Failed to send message: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return None

def test_instant_message_reception():
    """Test instant message reception between FDE and AEO"""
    print("🚀 Testing Instant Message Reception")
    print("=" * 50)
    
    # Authenticate both users
    fde_token = authenticate_user(TEST_USERS['fde']['username'], TEST_USERS['fde']['password'])
    aeo_token = authenticate_user(TEST_USERS['aeo']['username'], TEST_USERS['aeo']['password'])
    
    if not fde_token or not aeo_token:
        print("❌ Failed to authenticate users")
        return
    
    # Get user info
    fde_info = get_user_info(fde_token, 'fde')
    aeo_info = get_user_info(aeo_token, 'Nilore')
    
    if not fde_info or not aeo_info:
        print("❌ Failed to get user info")
        return
    
    # Get conversations for both users
    print("\n📋 Getting conversations...")
    fde_conversations = get_conversations(fde_token)
    aeo_conversations = get_conversations(aeo_token)
    
    # Find conversation between FDE and AEO
    target_conversation = None
    for conv in fde_conversations:
        if conv.get('other_user', {}).get('username') == 'Nilore':
            target_conversation = conv
            break
    
    if not target_conversation:
        print("❌ No conversation found between FDE and AEO")
        return
    
    conversation_id = target_conversation['conversation_id']
    school_name = target_conversation['school_name']
    
    print(f"✅ Found conversation: {conversation_id} for {school_name}")
    
    # Get initial messages
    print("\n📨 Getting initial messages...")
    initial_messages = get_messages(fde_token, conversation_id)
    initial_count = len(initial_messages)
    print(f"Initial message count: {initial_count}")
    
    # Send test message from FDE to AEO
    print(f"\n📤 Sending test message from FDE to AEO...")
    test_message = f"Instant reception test at {datetime.now().strftime('%H:%M:%S.%f')[:-3]}"
    
    message_result = send_message(
        fde_token, 
        school_name, 
        test_message, 
        aeo_info['id'],
        conversation_id
    )
    
    if not message_result:
        print("❌ Failed to send test message")
        return
    
    print(f"✅ Test message sent: {message_result.get('id')}")
    
    # Wait a moment for processing
    print("⏳ Waiting for message processing...")
    time.sleep(1)
    
    # Check if message appears for both users
    print("\n📥 Checking message reception...")
    
    # Check FDE's messages
    fde_messages = get_messages(fde_token, conversation_id)
    fde_count = len(fde_messages)
    print(f"FDE message count: {fde_count} (was {initial_count})")
    
    # Check AEO's messages
    aeo_messages = get_messages(aeo_token, conversation_id)
    aeo_count = len(aeo_messages)
    print(f"AEO message count: {aeo_count}")
    
    # Verify the test message is present
    test_message_found = False
    for msg in fde_messages:
        if test_message in msg.get('message_text', ''):
            test_message_found = True
            print(f"✅ Test message found in FDE's messages: {msg.get('id')}")
            break
    
    if not test_message_found:
        print("❌ Test message not found in FDE's messages")
    
    # Check unread count
    print("\n📊 Checking unread counts...")
    headers = {'Authorization': f'Bearer {aeo_token}'}
    response = requests.get(f"{BASE_URL}/unread-count/", headers=headers)
    if response.status_code == 200:
        unread_data = response.json()
        print(f"✅ AEO unread count: {unread_data.get('unread_count', 0)}")
    else:
        print(f"❌ Failed to get unread count: {response.status_code}")
    
    # Test WebSocket connectivity (basic check)
    print("\n🔌 Testing WebSocket connectivity...")
    try:
        import websocket
        ws_url = "ws://localhost:8000/ws/notification/"
        ws = websocket.create_connection(ws_url, timeout=5)
        print("✅ WebSocket connection established")
        ws.close()
    except Exception as e:
        print(f"⚠️ WebSocket test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   • Initial messages: {initial_count}")
    print(f"   • FDE messages after send: {fde_count}")
    print(f"   • AEO messages after send: {aeo_count}")
    print(f"   • Test message found: {'✅' if test_message_found else '❌'}")
    print(f"   • Message sent successfully: {'✅' if message_result else '❌'}")
    
    if fde_count > initial_count and test_message_found:
        print("🎉 SUCCESS: Instant message reception is working!")
    else:
        print("❌ FAILURE: Instant message reception has issues")

if __name__ == "__main__":
    test_instant_message_reception() 