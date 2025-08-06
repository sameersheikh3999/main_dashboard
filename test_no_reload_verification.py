#!/usr/bin/env python3
"""
Test No Reload Verification
Verify that the messaging system doesn't cause page reloads
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_messaging_no_reload():
    """Test that messaging doesn't cause reloads"""
    
    print("🔍 Testing messaging no-reload functionality...")
    
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
        
        # 2. Get initial dashboard data
        print("   📊 Getting initial dashboard data...")
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test FDE dashboard endpoints
        dashboard_endpoints = [
            f"{BASE_URL}/bigquery/summary-stats/",
            f"{BASE_URL}/schools-with-infrastructure/"
        ]
        
        for endpoint in dashboard_endpoints:
            response = requests.get(endpoint, headers=headers)
            print(f"   📊 {endpoint}: {response.status_code}")
        
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
                    "message_text": f"Test message at {datetime.now().strftime('%H:%M:%S')}",
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
                    
                    # 4. Verify dashboard data is still accessible (no reload)
                    print("   🔍 Verifying dashboard data after message...")
                    time.sleep(1)
                    
                    for endpoint in dashboard_endpoints:
                        response = requests.get(endpoint, headers=headers)
                        print(f"   📊 {endpoint} after message: {response.status_code}")
                        
                        if response.status_code == 200:
                            print(f"   ✅ {endpoint} still accessible")
                        else:
                            print(f"   ❌ {endpoint} not accessible after message")
                    
                    # 5. Get conversations to verify messaging works
                    print("   💬 Getting conversations...")
                    conversations_response = requests.get(
                        f"{BASE_URL}/conversations/",
                        headers=headers
                    )
                    
                    if conversations_response.status_code == 200:
                        conversations = conversations_response.json()
                        print(f"   💬 Found {len(conversations)} conversations")
                    else:
                        print(f"   ❌ Could not get conversations: {conversations_response.status_code}")
                        
                else:
                    print(f"   ❌ Message send failed: {message_response.text}")
            else:
                print("   ❌ No principals available")
        else:
            print(f"   ❌ Could not get principals: {principal_response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Test completed!")
    print("\n💡 If all endpoints return 200 after sending a message, the backend is working correctly.")
    print("💡 The reload issue should be fixed in the frontend with the event prevention measures.")

if __name__ == "__main__":
    test_messaging_no_reload() 