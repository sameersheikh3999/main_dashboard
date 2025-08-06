#!/usr/bin/env python3
"""
Debug Message Reload Issue
Test to see if sending a message causes any unexpected behavior
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_message_send_no_reload():
    """Test message sending to see if it causes reloads"""
    
    print("🔍 Testing message send functionality...")
    
    # Test credentials
    test_users = [
        {"username": "fde", "password": "Pass@1234"},
        {"username": "Nilore", "password": "Pass@123"}
    ]
    
    for user in test_users:
        print(f"\n📝 Testing with user: {user['username']}")
        
        try:
            # 1. Login
            print("   🔐 Logging in...")
            login_response = requests.post(
                f"{BASE_URL}/auth/login/",
                json=user,
                headers={'Content-Type': 'application/json'}
            )
            
            if login_response.status_code != 200:
                print(f"   ❌ Login failed: {login_response.status_code}")
                continue
                
            login_data = login_response.json()
            token = login_data.get('token') or login_data.get('access')
            
            if not token:
                print("   ❌ No token received")
                continue
                
            print("   ✅ Login successful")
            
            # 2. Get unread count before sending
            print("   📊 Getting unread count before sending...")
            headers = {'Authorization': f'Bearer {token}'}
            
            unread_response = requests.get(
                f"{BASE_URL}/messages/unread-count/",
                headers=headers
            )
            
            if unread_response.status_code == 200:
                unread_before = unread_response.json().get('unread_count', 0)
                print(f"   📊 Unread count before: {unread_before}")
            else:
                print(f"   ⚠️ Could not get unread count: {unread_response.status_code}")
                unread_before = 0
            
            # 3. Send a test message
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
                        "message_text": f"Test message from {user['username']} at {datetime.now().strftime('%H:%M:%S')}",
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
                        
                        # 4. Get unread count after sending
                        time.sleep(1)  # Wait a moment
                        print("   📊 Getting unread count after sending...")
                        
                        unread_after_response = requests.get(
                            f"{BASE_URL}/messages/unread-count/",
                            headers=headers
                        )
                        
                        if unread_after_response.status_code == 200:
                            unread_after = unread_after_response.json().get('unread_count', 0)
                            print(f"   📊 Unread count after: {unread_after}")
                            
                            if unread_after > unread_before:
                                print("   ✅ Unread count increased as expected")
                            else:
                                print("   ⚠️ Unread count did not increase")
                        else:
                            print(f"   ❌ Could not get unread count after: {unread_after_response.status_code}")
                    else:
                        print(f"   ❌ Message send failed: {message_response.text}")
                else:
                    print("   ❌ No principals available")
            else:
                print(f"   ❌ Could not get principals: {principal_response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 If the backend is working correctly, the issue might be in the frontend.")
    print("💡 Check browser console for any JavaScript errors or network issues.")

if __name__ == "__main__":
    test_message_send_no_reload() 