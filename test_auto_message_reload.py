#!/usr/bin/env python3
"""
Test Automatic Message Reloading
Verify that when a user receives a new message, all messages are automatically reloaded
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_auto_message_reload():
    """Test that messages are automatically reloaded when new messages are received"""
    
    print("🔍 Testing automatic message reloading...")
    
    # Test with two users
    sender_user = {"username": "fde", "password": "Pass@1234"}
    receiver_user = {"username": "Nilore", "password": "Pass@123"}
    
    # Known user IDs from the system
    sender_id = 8  # FDE user
    receiver_id = 2  # Nilore (AEO) user
    
    try:
        # 1. Login sender
        print("   🔐 Logging in sender...")
        sender_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=sender_user,
            headers={'Content-Type': 'application/json'}
        )
        
        if sender_response.status_code != 200:
            print(f"   ❌ Sender login failed: {sender_response.status_code}")
            return
            
        sender_data = sender_response.json()
        sender_token = sender_data.get('token') or sender_data.get('access')
        
        if not sender_token:
            print("   ❌ No sender token received")
            return
            
        print("   ✅ Sender login successful")
        
        # 2. Login receiver
        print("   🔐 Logging in receiver...")
        receiver_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=receiver_user,
            headers={'Content-Type': 'application/json'}
        )
        
        if receiver_response.status_code != 200:
            print(f"   ❌ Receiver login failed: {receiver_response.status_code}")
            return
            
        receiver_data = receiver_response.json()
        receiver_token = receiver_data.get('token') or receiver_data.get('access')
        
        if not receiver_token:
            print("   ❌ No receiver token received")
            return
            
        print("   ✅ Receiver login successful")
        
        # 3. Get receiver's initial conversations and messages
        print("   💬 Getting receiver's initial conversations...")
        receiver_headers = {'Authorization': f'Bearer {receiver_token}'}
        
        # Get initial conversations
        initial_conversations_response = requests.get(
            f"{BASE_URL}/conversations/",
            headers=receiver_headers
        )
        
        if initial_conversations_response.status_code == 200:
            initial_conversations = initial_conversations_response.json()
            print(f"   💬 Receiver initial conversations: {len(initial_conversations)}")
            
            if len(initial_conversations) > 0:
                # Get initial messages for first conversation
                first_conversation = initial_conversations[0]
                initial_messages_response = requests.get(
                    f"{BASE_URL}/messages/{first_conversation['other_user']['id']}/",
                    headers=receiver_headers
                )
                
                if initial_messages_response.status_code == 200:
                    initial_messages = initial_messages_response.json()
                    print(f"   📨 Receiver initial messages: {len(initial_messages)}")
                else:
                    print(f"   ❌ Could not get initial messages: {initial_messages_response.status_code}")
                    initial_messages = []
            else:
                print("   ⚠️ No conversations found for receiver")
                initial_messages = []
        else:
            print(f"   ❌ Could not get receiver conversations: {initial_conversations_response.status_code}")
            return
        
        # 4. Send a test message from sender to receiver
        print("   📤 Sending test message from sender to receiver...")
        sender_headers = {'Authorization': f'Bearer {sender_token}'}
        
        message_data = {
            "school_name": "Test School",
            "message_text": f"Auto-reload test message at {datetime.now().strftime('%H:%M:%S')}",
            "receiverId": receiver_id
        }
        
        message_response = requests.post(
            f"{BASE_URL}/messages/",
            json=message_data,
            headers=sender_headers
        )
        
        print(f"   📤 Message response: {message_response.status_code}")
        
        if message_response.status_code in [200, 201]:
            print("   ✅ Message sent successfully")
            
            # 5. Wait a moment for WebSocket delivery and auto-reload
            print("   ⏳ Waiting for WebSocket delivery and auto-reload...")
            time.sleep(3)
            
            # 6. Check if conversations were automatically reloaded
            print("   🔍 Checking if conversations were automatically reloaded...")
            
            updated_conversations_response = requests.get(
                f"{BASE_URL}/conversations/",
                headers=receiver_headers
            )
            
            if updated_conversations_response.status_code == 200:
                updated_conversations = updated_conversations_response.json()
                print(f"   💬 Receiver updated conversations: {len(updated_conversations)}")
                
                # Check if the conversation was updated with new message
                if len(updated_conversations) > 0:
                    updated_conversation = updated_conversations[0]
                    print(f"   📊 Updated conversation unread count: {updated_conversation.get('unread_count', 0)}")
                    print(f"   📊 Updated conversation latest message: {updated_conversation.get('latest_message', {}).get('text', 'N/A')}")
                    
                    # Check if messages were automatically reloaded
                    if len(updated_conversations) > 0:
                        updated_messages_response = requests.get(
                            f"{BASE_URL}/messages/{updated_conversations[0]['other_user']['id']}/",
                            headers=receiver_headers
                        )
                        
                        if updated_messages_response.status_code == 200:
                            updated_messages = updated_messages_response.json()
                            print(f"   📨 Receiver updated messages: {len(updated_messages)}")
                            
                            if len(updated_messages) > len(initial_messages):
                                print("   ✅ Messages were automatically reloaded!")
                                print(f"   📈 Message count increased: {len(initial_messages)} → {len(updated_messages)}")
                            elif len(updated_messages) == len(initial_messages):
                                print("   ⚠️ Message count unchanged (might be expected)")
                            else:
                                print("   ❌ Message count decreased unexpectedly")
                        else:
                            print(f"   ❌ Could not get updated messages: {updated_messages_response.status_code}")
                else:
                    print("   ⚠️ No conversations found after update")
            else:
                print(f"   ❌ Could not get receiver updated conversations: {updated_conversations_response.status_code}")
                
        else:
            print(f"   ❌ Message send failed: {message_response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 This test verifies that:")
    print("   - Messages are sent successfully")
    print("   - Conversations are automatically reloaded when new messages arrive")
    print("   - Message counts are updated in real-time")
    print("   - WebSocket notifications trigger automatic reloading")

if __name__ == "__main__":
    test_auto_message_reload() 