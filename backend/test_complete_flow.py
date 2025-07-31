#!/usr/bin/env python
import requests
import json

def test_complete_flow():
    """Test the complete authentication and data flow"""
    
    print("=== Testing Complete Authentication and Data Flow ===\n")
    
    base_url = "http://localhost:8000/api"
    
    # Test 1: Login with AEO credentials
    print("1. Testing AEO login...")
    login_data = {
        "username": "Nilore",
        "password": "Nilore123",
        "role": "AEO"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')
            print(f"   ✅ Login successful")
            print(f"   User: {user.get('username')} - Role: {user.get('profile', {}).get('role')}")
            print(f"   Sector: {user.get('profile', {}).get('sector')}")
            print(f"   Token received: {'Yes' if token else 'No'}")
            
            # Test 2: Use token to access all protected endpoints
            if token:
                print("\n2. Testing all protected endpoints with authentication...")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test all endpoints that the frontend uses
                endpoints = [
                    ('summary-stats', 'Summary Stats'),
                    ('all-schools', 'All Schools'),
                    ('filter-options', 'Filter Options'),
                    ('teacher-data', 'Teacher Data'),
                    ('aggregated-data', 'Aggregated Data')
                ]
                
                for endpoint, name in endpoints:
                    try:
                        url = f"{base_url}/bigquery/{endpoint}"
                        if endpoint == 'aggregated-data':
                            url += "?period=weekly"
                        elif endpoint == 'summary-stats':
                            url += "?sector=Nilore"
                            
                        response = requests.get(url, headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if isinstance(data, list):
                                print(f"   ✅ {name}: {len(data)} records")
                            elif isinstance(data, dict):
                                if 'total_teachers' in data:
                                    print(f"   ✅ {name}: {data.get('total_teachers', 0)} teachers, {data.get('total_schools', 0)} schools")
                                else:
                                    print(f"   ✅ {name}: {len(data)} keys")
                            else:
                                print(f"   ✅ {name}: Success")
                        else:
                            print(f"   ❌ {name}: {response.status_code}")
                    except Exception as e:
                        print(f"   ❌ {name}: Error - {e}")
                
                print(f"\n3. Testing frontend-compatible URLs...")
                # Test URLs exactly as the frontend calls them
                frontend_endpoints = [
                    ('bigquery/all-schools', 'All Schools (Frontend)'),
                    ('bigquery/summary-stats', 'Summary Stats (Frontend)'),
                    ('bigquery/filter-options', 'Filter Options (Frontend)'),
                    ('bigquery/teacher-data', 'Teacher Data (Frontend)'),
                    ('bigquery/aggregated-data?period=weekly', 'Aggregated Data (Frontend)')
                ]
                
                for endpoint, name in frontend_endpoints:
                    try:
                        url = f"{base_url}/{endpoint}"
                        response = requests.get(url, headers=headers, timeout=10)
                        if response.status_code == 200:
                            print(f"   ✅ {name}: Success")
                        else:
                            print(f"   ❌ {name}: {response.status_code}")
                    except Exception as e:
                        print(f"   ❌ {name}: Error - {e}")
                        
            else:
                print("   ❌ No token received")
                
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n=== Complete Flow Test Summary ===")
    print("✅ If all endpoints are working, the issue is:")
    print("   - User needs to log in through the frontend")
    print("   - Frontend should show login page when not authenticated")
    print("   - After login, dashboard should load with data")

if __name__ == '__main__':
    test_complete_flow() 