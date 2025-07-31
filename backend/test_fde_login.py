#!/usr/bin/env python3
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

def test_fde_login():
    """Test FDE user login"""
    print("Testing FDE login...")
    
    # Test credentials
    login_data = {
        'username': 'fde',
        'password': 'fde123'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ FDE login successful!")
            print(f"Token received: {data.get('token', 'No token')[:20]}...")
            print(f"User data: {data.get('user', 'No user data')}")
        else:
            print(f"❌ FDE login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing FDE login: {e}")

if __name__ == "__main__":
    test_fde_login() 