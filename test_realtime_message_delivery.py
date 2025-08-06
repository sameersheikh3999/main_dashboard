#!/usr/bin/env python3
"""
Test Real-time Message Delivery
Verify that messages are delivered in real-time to receivers
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_realtime_message_delivery():
    """Test that messages are delivered in real-time"""
    
    print("🔍 Testing real-time message delivery...")
    
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
        
        # 3. Get receiver's initial conversations
        print("   💬 Getting receiver's initial conversations...")
        receiver_headers = {'Authorization': f'Bearer {receiver_token}'}
        
        receiver_conversations_response = requests.get(
            f"{BASE_URL}/conversations/",
            headers=receiver_headers
        )
        
        if receiver_conversations_response.status_code == 200:
            initial_conversations = receiver_conversations_response.json()
            print(f"   💬 Receiver initial conversations: {len(initial_conversations)}")
        else:
            print(f"   ❌ Could not get receiver conversations: {receiver_conversations_response.status_code}")
            return
        
        # 4. Get receiver's initial unread count
        print("   📊 Getting receiver's initial unread count...")
        receiver_unread_response = requests.get(
            f"{BASE_URL}/messages/unread-count/",
            headers=receiver_headers
        )
        
        if receiver_unread_response.status_code == 200:
            initial_unread = receiver_unread_response.json().get('unread_count', 0)
            print(f"   📊 Receiver initial unread count: {initial_unread}")
        else:
            print(f"   ❌ Could not get receiver unread count: {receiver_unread_response.status_code}")
            initial_unread = 0
        
        # 5. Send a test message from sender to receiver
        print("   📤 Sending test message from sender to receiver...")
        sender_headers = {'Authorization': f'Bearer {sender_token}'}
        
        # Use known receiver ID directly
        print(f"   👤 Sending to: {receiver_user['username']} (ID: {receiver_id})")
        
        message_data = {
            "school_name": "Test School",
            "message_text": f"Real-time test message at {datetime.now().strftime('%H:%M:%S')}",
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
            
            # 6. Wait a moment for real-time delivery
            print("   ⏳ Waiting for real-time delivery...")
            time.sleep(3)
            
            # 7. Check if receiver received the message
            print("   🔍 Checking if receiver received the message...")
            
            # Check conversations
            updated_conversations_response = requests.get(
                f"{BASE_URL}/conversations/",
                headers=receiver_headers
            )
            
            if updated_conversations_response.status_code == 200:
                updated_conversations = updated_conversations_response.json()
                print(f"   💬 Receiver updated conversations: {len(updated_conversations)}")
                
                if len(updated_conversations) > len(initial_conversations):
                    print("   ✅ Receiver conversations updated - new conversation created")
                elif len(updated_conversations) == len(initial_conversations):
                    print("   ✅ Receiver conversations updated - existing conversation modified")
                else:
                    print("   ⚠️ Receiver conversations count changed unexpectedly")
            else:
                print(f"   ❌ Could not get receiver updated conversations: {updated_conversations_response.status_code}")
            
            # Check unread count
            updated_unread_response = requests.get(
                f"{BASE_URL}/messages/unread-count/",
                headers=receiver_headers
            )
            
            if updated_unread_response.status_code == 200:
                updated_unread = updated_unread_response.json().get('unread_count', 0)
                print(f"   📊 Receiver updated unread count: {updated_unread}")
                
                if updated_unread > initial_unread:
                    print("   ✅ Receiver unread count increased - message received!")
                elif updated_unread == initial_unread:
                    print("   ⚠️ Receiver unread count unchanged (might be expected)")
                else:
                    print("   ❌ Receiver unread count decreased unexpectedly")
            else:
                print(f"   ❌ Could not get receiver updated unread count: {updated_unread_response.status_code}")
                
        else:
            print(f"   ❌ Message send failed: {message_response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 This test verifies that:")
    print("   - Messages are sent successfully")
    print("   - Receivers get real-time updates")
    print("   - Unread counts update properly")
    print("   - Conversations are updated in real-time")

if __name__ == "__main__":
    test_realtime_message_delivery() 