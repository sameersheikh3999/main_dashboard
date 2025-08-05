#!/usr/bin/env python3
"""
Test script for login timestamp functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "pass123"

def test_login_and_timestamps():
    """Test login and verify timestamp recording"""
    
    print("🔍 Testing Login Timestamp Functionality")
    print("=" * 50)
    
    # Step 1: Login as admin
    print("\n1. Logging in as admin...")
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result['token']
            print("✅ Admin login successful")
            print(f"   User: {login_result['user']['username']}")
        else:
            print(f"❌ Admin login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Login request failed: {e}")
        return
    
    # Step 2: Test login timestamps endpoint
    print("\n2. Testing login timestamps endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        timestamps_response = requests.get(f"{BASE_URL}/admin/login-timestamps/", headers=headers)
        if timestamps_response.status_code == 200:
            timestamps_data = timestamps_response.json()
            print("✅ Login timestamps endpoint working")
            print(f"   Total records: {timestamps_data['pagination']['total_count']}")
            print(f"   Current page: {timestamps_data['pagination']['current_page']}")
            
            if timestamps_data['data']:
                print("\n   Recent login records:")
                for i, record in enumerate(timestamps_data['data'][:5]):
                    print(f"   {i+1}. {record['username']} - {record['date']} {record['time']}")
            else:
                print("   No login records found")
        else:
            print(f"❌ Login timestamps endpoint failed: {timestamps_response.status_code}")
            print(f"   Response: {timestamps_response.text}")
    except Exception as e:
        print(f"❌ Timestamps request failed: {e}")
    
    # Step 3: Test CSV export
    print("\n3. Testing CSV export...")
    try:
        csv_response = requests.get(
            f"{BASE_URL}/admin/login-timestamps/?export_csv=true", 
            headers=headers
        )
        if csv_response.status_code == 200:
            print("✅ CSV export working")
            print(f"   Content-Type: {csv_response.headers.get('Content-Type')}")
            print(f"   Content-Disposition: {csv_response.headers.get('Content-Disposition')}")
            
            # Save CSV file
            filename = f"login_timestamps_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(filename, 'wb') as f:
                f.write(csv_response.content)
            print(f"   CSV saved as: {filename}")
        else:
            print(f"❌ CSV export failed: {csv_response.status_code}")
            print(f"   Response: {csv_response.text}")
    except Exception as e:
        print(f"❌ CSV export request failed: {e}")
    
    # Step 4: Test filtering
    print("\n4. Testing filtering...")
    try:
        filter_response = requests.get(
            f"{BASE_URL}/admin/login-timestamps/?username={ADMIN_USERNAME}", 
            headers=headers
        )
        if filter_response.status_code == 200:
            filter_data = filter_response.json()
            print("✅ Filtering working")
            print(f"   Filtered records: {filter_data['pagination']['total_count']}")
        else:
            print(f"❌ Filtering failed: {filter_response.status_code}")
    except Exception as e:
        print(f"❌ Filter request failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Login timestamp functionality test completed!")

if __name__ == "__main__":
    test_login_and_timestamps() 