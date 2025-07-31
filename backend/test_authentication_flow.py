#!/usr/bin/env python
import requests
import json

def test_authentication_flow():
    """Test the complete authentication flow and data access"""
    
    print("=== Testing Authentication Flow ===\n")
    
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
            
            # Test 2: Use token to access protected endpoints
            if token:
                print("\n2. Testing authenticated data access...")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test summary stats
                response = requests.get(f"{base_url}/bigquery/summary-stats", headers=headers, timeout=10)
                if response.status_code == 200:
                    stats_data = response.json()
                    print(f"   ✅ Summary stats accessible")
                    print(f"   Total teachers: {stats_data.get('total_teachers', 'N/A')}")
                    print(f"   Total schools: {stats_data.get('total_schools', 'N/A')}")
                else:
                    print(f"   ❌ Summary stats failed: {response.status_code}")
                
                # Test all schools
                response = requests.get(f"{base_url}/bigquery/all-schools", headers=headers, timeout=10)
                if response.status_code == 200:
                    schools_data = response.json()
                    print(f"   ✅ All schools accessible: {len(schools_data)} schools")
                    
                    # Filter schools by sector
                    sector = user.get('profile', {}).get('sector')
                    if sector:
                        sector_schools = [s for s in schools_data if s.get('sector') == sector]
                        print(f"   Schools in {sector} sector: {len(sector_schools)}")
                else:
                    print(f"   ❌ All schools failed: {response.status_code}")
                
                # Test filter options
                response = requests.get(f"{base_url}/bigquery/filter-options", headers=headers, timeout=10)
                if response.status_code == 200:
                    filter_data = response.json()
                    print(f"   ✅ Filter options accessible")
                    print(f"   Schools: {len(filter_data.get('schools', []))}")
                    print(f"   Sectors: {len(filter_data.get('sectors', []))}")
                else:
                    print(f"   ❌ Filter options failed: {response.status_code}")
            else:
                print("   ❌ No token received")
                
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n=== Authentication Test Complete ===")

if __name__ == '__main__':
    test_authentication_flow() 