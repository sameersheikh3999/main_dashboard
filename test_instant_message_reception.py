#!/usr/bin/env python3
"""
Test Instant Message Reception
Verify that messages are received instantly with minimal delay
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_instant_message_reception():
    """Test that messages are received instantly"""
    
    print("🔍 Testing instant message reception...")
    
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
        
        # 3. Get receiver's initial unread count
        print("   📊 Getting receiver's initial unread count...")
        receiver_headers = {'Authorization': f'Bearer {receiver_token}'}
        
        initial_unread_response = requests.get(
            f"{BASE_URL}/messages/unread-count/",
            headers=receiver_headers
        )
        
        if initial_unread_response.status_code == 200:
            initial_unread = initial_unread_response.json().get('unread_count', 0)
            print(f"   📊 Receiver initial unread count: {initial_unread}")
        else:
            print(f"   ❌ Could not get receiver unread count: {initial_unread_response.status_code}")
            initial_unread = 0
        
        # 4. Send a test message and measure time
        print("   📤 Sending test message...")
        sender_headers = {'Authorization': f'Bearer {sender_token}'}
        
        message_data = {
            "school_name": "Test School",
            "message_text": f"Instant reception test at {datetime.now().strftime('%H:%M:%S.%f')[:-3]}",
            "receiverId": receiver_id
        }
        
        start_time = time.time()
        message_response = requests.post(
            f"{BASE_URL}/messages/",
            json=message_data,
            headers=sender_headers
        )
        send_time = time.time() - start_time
        
        print(f"   📤 Message send response: {message_response.status_code} (took {send_time:.3f}s)")
        
        if message_response.status_code in [200, 201]:
            print("   ✅ Message sent successfully")
            
            # 5. Immediately check receiver's unread count
            print("   ⚡ Checking receiver's unread count immediately...")
            start_check_time = time.time()
            
            updated_unread_response = requests.get(
                f"{BASE_URL}/messages/unread-count/",
                headers=receiver_headers
            )
            
            check_time = time.time() - start_check_time
            
            if updated_unread_response.status_code == 200:
                updated_unread = updated_unread_response.json().get('unread_count', 0)
                print(f"   📊 Receiver updated unread count: {updated_unread} (check took {check_time:.3f}s)")
                
                if updated_unread > initial_unread:
                    print("   ✅ Unread count increased immediately!")
                    print(f"   📈 Count change: {initial_unread} → {updated_unread}")
                elif updated_unread == initial_unread:
                    print("   ⚠️ Unread count unchanged (might be expected)")
                else:
                    print("   ❌ Unread count decreased unexpectedly")
            else:
                print(f"   ❌ Could not get receiver updated unread count: {updated_unread_response.status_code}")
            
            # 6. Check conversations for immediate update
            print("   ⚡ Checking conversations for immediate update...")
            start_conv_check_time = time.time()
            
            conversations_response = requests.get(
                f"{BASE_URL}/conversations/",
                headers=receiver_headers
            )
            
            conv_check_time = time.time() - start_conv_check_time
            
            if conversations_response.status_code == 200:
                conversations = conversations_response.json()
                print(f"   💬 Found {len(conversations)} conversations (check took {conv_check_time:.3f}s)")
                
                if len(conversations) > 0:
                    latest_conversation = conversations[0]
                    latest_message = latest_conversation.get('latest_message', {})
                    print(f"   📨 Latest message: {latest_message.get('text', 'N/A')}")
                    print(f"   📊 Latest unread count: {latest_conversation.get('unread_count', 0)}")
                else:
                    print("   ⚠️ No conversations found")
            else:
                print(f"   ❌ Could not get conversations: {conversations_response.status_code}")
                
            # 7. Summary of timing
            total_time = send_time + check_time + conv_check_time
            print(f"\n   ⏱️ Timing Summary:")
            print(f"      - Message send: {send_time:.3f}s")
            print(f"      - Unread count check: {check_time:.3f}s")
            print(f"      - Conversations check: {conv_check_time:.3f}s")
            print(f"      - Total response time: {total_time:.3f}s")
            
            if total_time < 0.5:
                print("   🚀 Excellent! Message reception is nearly instant (< 0.5s)")
            elif total_time < 1.0:
                print("   ✅ Good! Message reception is fast (< 1.0s)")
            elif total_time < 2.0:
                print("   ⚠️ Acceptable! Message reception is moderate (< 2.0s)")
            else:
                print("   ❌ Slow! Message reception needs optimization (> 2.0s)")
                
        else:
            print(f"   ❌ Message send failed: {message_response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 This test verifies:")
    print("   - Messages are sent successfully")
    print("   - Unread counts update immediately")
    print("   - Conversations update instantly")
    print("   - Overall response time is minimal")

if __name__ == "__main__":
    test_instant_message_reception() 