#!/usr/bin/env python3
"""
Test script to check PrincipalDashboard API endpoints
"""

import requests
import json

# API base URL
API_BASE_URL = 'http://localhost:8000/api'

def test_principal_login():
    """Test principal login to get a token"""
    login_data = {
        'username': 'principal_908',
        'password': 'JuepbRvR'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=login_data)
    print(f"Login response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Login successful: {data}")
        return data.get('access')
    else:
        print(f"Login failed: {response.text}")
        return None

def test_school_teachers_data(token):
    """Test the school teachers data endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(f'{API_BASE_URL}/school-teachers/', headers=headers)
    print(f"\nSchool teachers data response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"School teachers data: {json.dumps(data, indent=2)}")
        return data
    else:
        print(f"School teachers data failed: {response.text}")
        return None

def test_user_conversations(token):
    """Test the user conversations endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(f'{API_BASE_URL}/conversations/', headers=headers)
    print(f"\nUser conversations response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"User conversations: {json.dumps(data, indent=2)}")
        return data
    else:
        print(f"User conversations failed: {response.text}")
        return None

def main():
    print("Testing PrincipalDashboard API endpoints...")
    
    # Test login
    token = test_principal_login()
    if not token:
        print("Failed to get token, exiting...")
        return
    
    # Test school teachers data
    school_data = test_school_teachers_data(token)
    
    # Test user conversations
    conversations = test_user_conversations(token)
    
    print("\n" + "="*50)
    print("SUMMARY:")
    print(f"Token obtained: {'Yes' if token else 'No'}")
    print(f"School data obtained: {'Yes' if school_data else 'No'}")
    print(f"Conversations obtained: {'Yes' if conversations else 'No'}")

if __name__ == '__main__':
    main() 