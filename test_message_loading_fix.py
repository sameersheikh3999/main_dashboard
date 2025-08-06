#!/usr/bin/env python3
"""
Test Message Loading Fix
Verify that messages are loading correctly after the fix
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_message_loading_fix():
    """Test that messages are loading correctly after the fix"""
    
    print("🔍 Testing message loading fix...")
    
    # Test with FDE user
    user_credentials = {"username": "fde", "password": "Pass@1234"}
    
    try:
        # 1. Login user
        print("   🔐 Logging in user...")
        login_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=user_credentials,
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.status_code}")
            return
            
        login_data = login_response.json()
        token = login_data.get('token') or login_data.get('access')
        
        if not token:
            print("   ❌ No token received")
            return
            
        print("   ✅ Login successful")
        headers = {'Authorization': f'Bearer {token}'}
        
        # 2. Get user conversations
        print("   💬 Getting user conversations...")
        conversations_response = requests.get(
            f"{BASE_URL}/conversations/",
            headers=headers
        )
        
        if conversations_response.status_code == 200:
            conversations = conversations_response.json()
            print(f"   💬 Found {len(conversations)} conversations")
            
            if len(conversations) > 0:
                # Test with first conversation
                first_conversation = conversations[0]
                conversation_id = first_conversation['conversation_id']
                print(f"   📋 Testing conversation: {conversation_id}")
                print(f"   👤 Other user: {first_conversation['other_user']['username']}")
                print(f"   📊 Unread count: {first_conversation['unread_count']}")
                
                # 3. Test the conversation messages endpoint (the correct one)
                print(f"   📨 Getting messages for conversation: {conversation_id}")
                
                messages_response = requests.get(
                    f"{BASE_URL}/conversations/{conversation_id}/messages/",
                    headers=headers
                )
                
                print(f"   📨 Messages response: {messages_response.status_code}")
                
                if messages_response.status_code == 200:
                    messages = messages_response.json()
                    print(f"   📨 Found {len(messages)} messages")
                    
                    if len(messages) > 0:
                        print("   📨 Sample messages:")
                        for i, msg in enumerate(messages[:3]):  # Show first 3 messages
                            sender_name = msg.get('sender', {}).get('username', 'Unknown')
                            message_text = msg.get('message_text', 'No text')
                            timestamp = msg.get('timestamp', 'No timestamp')
                            print(f"      {i+1}. {sender_name}: {message_text} ({timestamp})")
                            
                        # Check message structure
                        sample_msg = messages[0]
                        print(f"   📋 Message structure check:")
                        print(f"      - Has 'message_text': {'message_text' in sample_msg}")
                        print(f"      - Has 'sender': {'sender' in sample_msg}")
                        print(f"      - Has 'timestamp': {'timestamp' in sample_msg}")
                        print(f"      - Has 'id': {'id' in sample_msg}")
                        
                    else:
                        print("   ⚠️ No messages found")
                        
                elif messages_response.status_code == 404:
                    print("   ❌ 404 - Conversation messages endpoint not found")
                else:
                    print(f"   ❌ Error: {messages_response.text}")
                    
            else:
                print("   ⚠️ No conversations found")
        else:
            print(f"   ❌ Could not get conversations: {conversations_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 This test verifies:")
    print("   - Conversations are loading correctly")
    print("   - Conversation messages endpoint is working")
    print("   - Message structure is correct")
    print("   - Messages contain the expected fields")

if __name__ == "__main__":
    test_message_loading_fix() 