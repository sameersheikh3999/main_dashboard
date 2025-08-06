#!/usr/bin/env python3
"""
Test script to verify CORS configuration on production server
"""
import requests
import json

def test_cors_preflight():
    """Test CORS preflight requests"""
    print("🧪 Testing CORS Preflight Requests")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {
            "name": "Login endpoint from dashboard.niete.pk",
            "url": "https://api-dashboard.niete.pk/api/auth/login/",
            "origin": "https://dashboard.niete.pk",
            "method": "POST",
            "headers": ["content-type"]
        },
        {
            "name": "Health check from dashboard.niete.pk",
            "url": "https://api-dashboard.niete.pk/api/health/",
            "origin": "https://dashboard.niete.pk",
            "method": "GET",
            "headers": []
        },
        {
            "name": "Login endpoint from api-dashboard.niete.pk",
            "url": "https://api-dashboard.niete.pk/api/auth/login/",
            "origin": "https://api-dashboard.niete.pk",
            "method": "POST",
            "headers": ["content-type"]
        }
    ]
    
    for test in test_cases:
        print(f"\n📋 Testing: {test['name']}")
        print("-" * 40)
        
        # Prepare headers for preflight request
        headers = {
            'Origin': test['origin'],
            'Access-Control-Request-Method': test['method']
        }
        
        if test['headers']:
            headers['Access-Control-Request-Headers'] = ', '.join(test['headers'])
        
        try:
            print(f"URL: {test['url']}")
            print(f"Origin: {test['origin']}")
            print(f"Method: {test['method']}")
            
            # Make OPTIONS request
            response = requests.options(test['url'], headers=headers, timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            print("CORS Headers:")
            for header, value in cors_headers.items():
                if value:
                    print(f"  ✅ {header}: {value}")
                else:
                    print(f"  ❌ {header}: Missing")
            
            # Evaluate result
            if response.status_code == 200:
                if cors_headers['Access-Control-Allow-Origin']:
                    print("  ✅ CORS preflight successful")
                else:
                    print("  ❌ CORS preflight failed - missing Allow-Origin header")
            else:
                print(f"  ❌ CORS preflight failed - status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("  ❌ Connection failed - Server might be down")
        except requests.exceptions.Timeout:
            print("  ❌ Request timeout")
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_actual_requests():
    """Test actual requests with CORS headers"""
    print("\n\n🧪 Testing Actual Requests with CORS")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "Login request from dashboard.niete.pk",
            "url": "https://api-dashboard.niete.pk/api/auth/login/",
            "origin": "https://dashboard.niete.pk",
            "method": "POST",
            "data": {"username": "test", "password": "test"}
        },
        {
            "name": "Health check from dashboard.niete.pk",
            "url": "https://api-dashboard.niete.pk/api/health/",
            "origin": "https://dashboard.niete.pk",
            "method": "GET",
            "data": None
        }
    ]
    
    for test in test_cases:
        print(f"\n📋 Testing: {test['name']}")
        print("-" * 40)
        
        headers = {
            'Origin': test['origin'],
            'Content-Type': 'application/json'
        }
        
        try:
            print(f"URL: {test['url']}")
            print(f"Origin: {test['origin']}")
            print(f"Method: {test['method']}")
            
            if test['method'] == 'POST':
                response = requests.post(test['url'], headers=headers, json=test['data'], timeout=10)
            else:
                response = requests.get(test['url'], headers=headers, timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            print("CORS Headers:")
            for header, value in cors_headers.items():
                if value:
                    print(f"  ✅ {header}: {value}")
                else:
                    print(f"  ❌ {header}: Missing")
            
            # Evaluate result
            if response.status_code in [200, 400, 401, 403]:
                if cors_headers['Access-Control-Allow-Origin']:
                    print("  ✅ CORS request successful")
                else:
                    print("  ❌ CORS request failed - missing Allow-Origin header")
            else:
                print(f"  ⚠️  Request returned status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("  ❌ Connection failed - Server might be down")
        except requests.exceptions.Timeout:
            print("  ❌ Request timeout")
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_curl_commands():
    """Show curl commands for manual testing"""
    print("\n\n🔧 Curl Commands for Manual Testing")
    print("=" * 50)
    
    commands = [
        "# Test CORS preflight request",
        "curl -X OPTIONS -H 'Origin: https://dashboard.niete.pk' \\",
        "  -H 'Access-Control-Request-Method: POST' \\",
        "  -H 'Access-Control-Request-Headers: content-type' \\",
        "  https://api-dashboard.niete.pk/api/auth/login/",
        "",
        "# Test actual login request",
        "curl -X POST -H 'Origin: https://dashboard.niete.pk' \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"username\":\"test\",\"password\":\"test\"}' \\",
        "  https://api-dashboard.niete.pk/api/auth/login/",
        "",
        "# Test health check",
        "curl -H 'Origin: https://dashboard.niete.pk' \\",
        "  https://api-dashboard.niete.pk/api/health/"
    ]
    
    for command in commands:
        print(command)

def main():
    """Main test function"""
    print("🔧 Production CORS Configuration Test")
    print("=" * 50)
    print("This script tests the CORS configuration on the production server.")
    print("It will check both preflight requests and actual requests.")
    print("")
    
    # Test preflight requests
    test_cors_preflight()
    
    # Test actual requests
    test_actual_requests()
    
    # Show curl commands
    test_curl_commands()
    
    print("\n" + "=" * 50)
    print("📝 Test Summary")
    print("=" * 50)
    print("✅ If you see 'CORS preflight successful' and 'CORS request successful',")
    print("   the CORS configuration is working correctly.")
    print("")
    print("❌ If you see 'CORS preflight failed' or 'CORS request failed',")
    print("   the production server needs to be updated with the correct CORS settings.")
    print("")
    print("📋 See PRODUCTION_CORS_ALLOWED_HOSTS_FIX.md for detailed instructions.")

if __name__ == "__main__":
    main() 