#!/usr/bin/env python3
"""
Check available users in the database
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def check_users():
    """Check what users are available"""
    print("🔍 Checking available users...")
    
    # Test some common usernames
    test_users = [
        'fde', 'test_fde_user', 'fde_user', 'test_fde',
        'Nilore', 'Tarnol', 'Urban 1', 'Urban 2', 'B.K', 'Sihala',
        'principal_723', 'principal_908', 'principal_913'
    ]
    
    for username in test_users:
        try:
            response = requests.post(f"{BASE_URL}/auth/login/", json={
                'username': username,
                'password': 'test123'  # Try a wrong password first
            })
            
            if response.status_code == 401:
                print(f"❌ {username}: Invalid credentials (user might exist)")
            elif response.status_code == 400:
                print(f"❌ {username}: Bad request (user might not exist)")
            else:
                print(f"✅ {username}: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {username}: Error - {e}")

def test_specific_login():
    """Test specific login combinations"""
    print("\n🔍 Testing specific login combinations...")
    
    test_combinations = [
        ('fde', 'fde123'),
        ('Nilore', 'Nilore123'),
        ('principal_723', 'Principal123'),
        ('test_fde_user', 'fde123'),
        ('fde_user', 'fde123')
    ]
    
    for username, password in test_combinations:
        try:
            response = requests.post(f"{BASE_URL}/auth/login/", json={
                'username': username,
                'password': password
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {username}: Login successful")
                print(f"   Token: {data.get('access', 'No token')[:20]}...")
            else:
                print(f"❌ {username}: Login failed - {response.status_code}")
                if response.status_code == 401:
                    print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ {username}: Error - {e}")

if __name__ == "__main__":
    check_users()
    test_specific_login() 