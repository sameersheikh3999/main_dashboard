#!/usr/bin/env python3
"""
Test Message Loading Debug
Debug why messages are not loading properly on the messaging page
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_message_loading_debug():
    """Debug message loading issues"""
    
    print("🔍 Debugging message loading issues...")
    
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
                print(f"   📋 Testing conversation: {first_conversation['conversation_id']}")
                print(f"   👤 Other user: {first_conversation['other_user']['username']} (ID: {first_conversation['other_user']['id']})")
                print(f"   📊 Unread count: {first_conversation['unread_count']}")
                
                # 3. Try to get messages using the user ID
                other_user_id = first_conversation['other_user']['id']
                print(f"   📨 Getting messages for user ID: {other_user_id}")
                
                messages_response = requests.get(
                    f"{BASE_URL}/users/{other_user_id}/messages/",
                    headers=headers
                )
                
                print(f"   📨 Messages response: {messages_response.status_code}")
                
                if messages_response.status_code == 200:
                    messages = messages_response.json()
                    print(f"   📨 Found {len(messages)} messages")
                    
                    if len(messages) > 0:
                        print("   📨 Sample messages:")
                        for i, msg in enumerate(messages[:3]):  # Show first 3 messages
                            print(f"      {i+1}. {msg.get('sender', {}).get('username', 'Unknown')}: {msg.get('message_text', 'No text')}")
                    else:
                        print("   ⚠️ No messages found")
                        
                elif messages_response.status_code == 404:
                    print("   ❌ 404 - User messages endpoint not found")
                else:
                    print(f"   ❌ Error: {messages_response.text}")
                    
                # 4. Try alternative endpoint - conversation messages
                print(f"   📨 Trying conversation messages endpoint...")
                conv_messages_response = requests.get(
                    f"{BASE_URL}/conversations/{first_conversation['conversation_id']}/messages/",
                    headers=headers
                )
                
                print(f"   📨 Conversation messages response: {conv_messages_response.status_code}")
                
                if conv_messages_response.status_code == 200:
                    conv_messages = conv_messages_response.json()
                    print(f"   📨 Found {len(conv_messages)} conversation messages")
                    
                    if len(conv_messages) > 0:
                        print("   📨 Sample conversation messages:")
                        for i, msg in enumerate(conv_messages[:3]):  # Show first 3 messages
                            print(f"      {i+1}. {msg.get('sender', {}).get('username', 'Unknown')}: {msg.get('message_text', 'No text')}")
                    else:
                        print("   ⚠️ No conversation messages found")
                else:
                    print(f"   ❌ Conversation messages error: {conv_messages_response.text}")
                    
            else:
                print("   ⚠️ No conversations found")
        else:
            print(f"   ❌ Could not get conversations: {conversations_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Debug completed!")
    print("\n💡 This test helps identify:")
    print("   - Whether conversations are being loaded")
    print("   - Whether message endpoints are working")
    print("   - Whether messages exist in the database")
    print("   - Which endpoint should be used for messages")

if __name__ == "__main__":
    test_message_loading_debug() 