#!/usr/bin/env python3
"""
Test script to verify CORS configuration on local development server
"""
import requests
import json

def test_local_cors_preflight():
    """Test CORS preflight request to local API"""
    api_url = "http://localhost:8000/api/auth/login/"
    
    # Test preflight request (OPTIONS)
    headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
    }
    
    try:
        print("Testing local CORS preflight request...")
        response = requests.options(api_url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'Not found')}")
        print(f"Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'Not found')}")
        print(f"Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'Not found')}")
        print(f"Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials', 'Not found')}")
        
        if response.status_code == 200:
            print("✅ Local CORS preflight request successful")
        else:
            print("❌ Local CORS preflight request failed")
            
    except Exception as e:
        print(f"❌ Error testing local CORS: {e}")

def test_production_origin_on_local():
    """Test production origin on local server"""
    api_url = "http://localhost:8000/api/auth/login/"
    
    # Test preflight request (OPTIONS) with production origin
    headers = {
        'Origin': 'https://dashboard.niete.pk',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
    }
    
    try:
        print("\nTesting production origin on local server...")
        response = requests.options(api_url, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'Not found')}")
        
        if response.status_code == 200 and 'https://dashboard.niete.pk' in response.headers.get('Access-Control-Allow-Origin', ''):
            print("✅ Production origin allowed on local server")
        else:
            print("❌ Production origin not allowed on local server")
            
    except Exception as e:
        print(f"❌ Error testing production origin: {e}")

if __name__ == "__main__":
    print("Testing Local CORS Configuration")
    print("=" * 40)
    
    test_local_cors_preflight()
    test_production_origin_on_local()
    
    print("\n" + "=" * 40)
    print("Local CORS Test Complete") 