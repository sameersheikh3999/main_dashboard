#!/usr/bin/env python3
"""
Test script for Admin Messaging functionality
"""

import requests
import json

API_BASE_URL = 'http://localhost:8000/api'

def test_admin_login():
    """Test admin login to get a token"""
    login_data = {
        'username': 'admin',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=login_data)
    print(f"Admin login response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Admin login successful: {data}")
        return data.get('token') or data.get('access')
    else:
        print(f"Admin login failed: {response.text}")
        return None

def test_get_all_users(token):
    """Test getting all users for messaging"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get FDEs
    response = requests.get(f'{API_BASE_URL}/fdes/', headers=headers)
    print(f"\nFDEs response status: {response.status_code}")
    if response.status_code == 200:
        fdes = response.json()
        print(f"Found {len(fdes)} FDEs")
        if fdes:
            print(f"Sample FDE: {fdes[0]}")
    
    # Get AEOs
    response = requests.get(f'{API_BASE_URL}/aeos/', headers=headers)
    print(f"\nAEOs response status: {response.status_code}")
    if response.status_code == 200:
        aeos = response.json()
        print(f"Found {len(aeos)} AEOs")
        if aeos:
            print(f"Sample AEO: {aeos[0]}")
    
    # Get Principals
    response = requests.get(f'{API_BASE_URL}/principals/', headers=headers)
    print(f"\nPrincipals response status: {response.status_code}")
    if response.status_code == 200:
        principals = response.json()
        print(f"Found {len(principals)} Principals")
        if principals:
            print(f"Sample Principal: {principals[0]}")
    
    return fdes, aeos, principals

def test_admin_messaging(token, receiver_id):
    """Test sending admin message"""
    headers = {'Authorization': f'Bearer {token}'}
    
    message_data = {
        'receiver_id': receiver_id,
        'message_text': 'This is a test admin broadcast message!'
    }
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    print(f"\nAdmin messaging response status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"Admin message sent successfully: {data}")
        return True
    else:
        print(f"Admin messaging failed: {response.text}")
        return False

def test_non_admin_messaging(token, receiver_id):
    """Test that non-admin users cannot send admin messages"""
    headers = {'Authorization': f'Bearer {token}'}
    
    message_data = {
        'receiver_id': receiver_id,
        'message_text': 'This should fail for non-admin users'
    }
    
    response = requests.post(f'{API_BASE_URL}/admin/messages/', json=message_data, headers=headers)
    print(f"\nNon-admin messaging response status: {response.status_code}")
    
    if response.status_code == 403:
        print("✓ Non-admin access correctly blocked")
        return True
    else:
        print(f"✗ Non-admin access not blocked: {response.text}")
        return False

def main():
    print("Testing Admin Messaging functionality...")
    
    # Test admin login
    admin_token = test_admin_login()
    if not admin_token:
        print("Failed to get admin token, exiting...")
        return
    
    # Test getting all users
    fdes, aeos, principals = test_get_all_users(admin_token)
    
    # Test admin messaging with first available user
    test_receiver_id = None
    if fdes:
        test_receiver_id = fdes[0]['id']
    elif aeos:
        test_receiver_id = aeos[0]['id']
    elif principals:
        test_receiver_id = principals[0]['id']
    
    if test_receiver_id:
        print(f"\nTesting admin messaging with receiver ID: {test_receiver_id}")
        success = test_admin_messaging(admin_token, test_receiver_id)
        if success:
            print("✅ Admin messaging functionality working correctly!")
        else:
            print("❌ Admin messaging functionality failed!")
    else:
        print("❌ No users found to test messaging with")
    
    print(f"\nAdmin token obtained: {'Yes' if admin_token else 'No'}")

if __name__ == "__main__":
    main() 