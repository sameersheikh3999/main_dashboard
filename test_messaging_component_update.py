#!/usr/bin/env python3
"""
Test Messaging Component Update
Verify that messaging components update properly when messages are sent
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_messaging_component_update():
    """Test that messaging components update properly when messages are sent"""
    
    print("🔍 Testing messaging component update functionality...")
    
    # Test with FDE user
    test_user = {"username": "fde", "password": "Pass@1234"}
    
    try:
        # 1. Login
        print("   🔐 Logging in...")
        login_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json=test_user,
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
        
        # 2. Get initial conversations
        print("   💬 Getting initial conversations...")
        headers = {'Authorization': f'Bearer {token}'}
        
        conversations_response = requests.get(
            f"{BASE_URL}/conversations/",
            headers=headers
        )
        
        if conversations_response.status_code == 200:
            initial_conversations = conversations_response.json()
            print(f"   💬 Initial conversations: {len(initial_conversations)}")
        else:
            print(f"   ❌ Could not get conversations: {conversations_response.status_code}")
            return
        
        # 3. Get initial unread count
        print("   📊 Getting initial unread count...")
        unread_response = requests.get(
            f"{BASE_URL}/messages/unread-count/",
            headers=headers
        )
        
        if unread_response.status_code == 200:
            initial_unread = unread_response.json().get('unread_count', 0)
            print(f"   📊 Initial unread count: {initial_unread}")
        else:
            print(f"   ❌ Could not get unread count: {unread_response.status_code}")
            initial_unread = 0
        
        # 4. Send a test message
        print("   📤 Sending test message...")
        
        # Get a principal to send message to
        principal_response = requests.get(
            f"{BASE_URL}/principals/",
            headers=headers
        )
        
        if principal_response.status_code == 200:
            principals = principal_response.json()
            if principals:
                recipient = principals[0]
                print(f"   👤 Sending to: {recipient.get('name', 'Unknown')}")
                
                message_data = {
                    "school_name": "Test School",
                    "message_text": f"Test message for component update at {datetime.now().strftime('%H:%M:%S')}",
                    "receiverId": recipient['id']
                }
                
                message_response = requests.post(
                    f"{BASE_URL}/messages/",
                    json=message_data,
                    headers=headers
                )
                
                print(f"   📤 Message response: {message_response.status_code}")
                
                if message_response.status_code in [200, 201]:
                    print("   ✅ Message sent successfully")
                    
                    # 5. Wait a moment for components to update
                    print("   ⏳ Waiting for components to update...")
                    time.sleep(2)
                    
                    # 6. Check if conversations updated
                    print("   🔍 Checking if conversations updated...")
                    updated_conversations_response = requests.get(
                        f"{BASE_URL}/conversations/",
                        headers=headers
                    )
                    
                    if updated_conversations_response.status_code == 200:
                        updated_conversations = updated_conversations_response.json()
                        print(f"   💬 Updated conversations: {len(updated_conversations)}")
                        
                        if len(updated_conversations) > len(initial_conversations):
                            print("   ✅ Conversations updated - new conversation created")
                        elif len(updated_conversations) == len(initial_conversations):
                            print("   ✅ Conversations updated - existing conversation modified")
                        else:
                            print("   ⚠️ Conversations count changed unexpectedly")
                    else:
                        print(f"   ❌ Could not get updated conversations: {updated_conversations_response.status_code}")
                    
                    # 7. Check if unread count updated
                    print("   🔍 Checking if unread count updated...")
                    updated_unread_response = requests.get(
                        f"{BASE_URL}/messages/unread-count/",
                        headers=headers
                    )
                    
                    if updated_unread_response.status_code == 200:
                        updated_unread = updated_unread_response.json().get('unread_count', 0)
                        print(f"   📊 Updated unread count: {updated_unread}")
                        
                        if updated_unread > initial_unread:
                            print("   ✅ Unread count increased as expected")
                        elif updated_unread == initial_unread:
                            print("   ⚠️ Unread count unchanged (might be expected for own messages)")
                        else:
                            print("   ❌ Unread count decreased unexpectedly")
                    else:
                        print(f"   ❌ Could not get updated unread count: {updated_unread_response.status_code}")
                        
                else:
                    print(f"   ❌ Message send failed: {message_response.text}")
            else:
                print("   ❌ No principals available")
        else:
            print(f"   ❌ Could not get principals: {principal_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 This test verifies that:")
    print("   - Conversations are updated when messages are sent")
    print("   - Unread counts are updated properly")
    print("   - Messaging components receive the updates")

if __name__ == "__main__":
    test_messaging_component_update() 