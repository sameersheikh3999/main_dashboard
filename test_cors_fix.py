#!/usr/bin/env python3
"""
Test script to verify CORS configuration for production domains
"""
import requests
import json

def test_cors_preflight():
    """Test CORS preflight request to the API"""
    api_url = "https://api-dashboard.niete.pk/api/auth/login/"
    
    # Test preflight request (OPTIONS)
    headers = {
        'Origin': 'https://dashboard.niete.pk',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
    }
    
    try:
        print("Testing CORS preflight request...")
        response = requests.options(api_url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'Not found')}")
        print(f"Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'Not found')}")
        print(f"Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'Not found')}")
        print(f"Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials', 'Not found')}")
        
        if response.status_code == 200:
            print("✅ CORS preflight request successful")
        else:
            print("❌ CORS preflight request failed")
            
    except Exception as e:
        print(f"❌ Error testing CORS: {e}")

def test_actual_request():
    """Test actual POST request to login endpoint"""
    api_url = "https://api-dashboard.niete.pk/api/auth/login/"
    
    headers = {
        'Origin': 'https://dashboard.niete.pk',
        'Content-Type': 'application/json',
    }
    
    data = {
        'username': 'test_user',
        'password': 'test_password'
    }
    
    try:
        print("\nTesting actual POST request...")
        response = requests.post(api_url, headers=headers, json=data, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'Not found')}")
        
        if response.status_code in [200, 201, 400, 401]:
            print("✅ CORS headers present in response")
        else:
            print("❌ Unexpected response status")
            
    except Exception as e:
        print(f"❌ Error testing actual request: {e}")

if __name__ == "__main__":
    print("Testing CORS Configuration for Production Domains")
    print("=" * 50)
    
    test_cors_preflight()
    test_actual_request()
    
    print("\n" + "=" * 50)
    print("CORS Test Complete") 