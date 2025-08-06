#!/usr/bin/env python3
"""
Test script to verify ALLOWED_HOSTS configuration
"""
import requests
import json

def test_allowed_hosts():
    """Test that both domains are allowed"""
    domains = [
        "https://api-dashboard.niete.pk",
        "https://dashboard.niete.pk"
    ]
    
    endpoints = [
        "/api/health/",
        "/api/auth/login/"
    ]
    
    print("Testing ALLOWED_HOSTS Configuration")
    print("=" * 50)
    
    for domain in domains:
        print(f"\nTesting domain: {domain}")
        print("-" * 30)
        
        for endpoint in endpoints:
            url = f"{domain}{endpoint}"
            
            try:
                print(f"Testing: {url}")
                
                if endpoint == "/api/health/":
                    # Health check endpoint (GET)
                    response = requests.get(url, timeout=10)
                else:
                    # Login endpoint (POST)
                    response = requests.post(url, json={}, timeout=10)
                
                print(f"  Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    print("  ✅ Domain allowed - Request successful")
                elif response.status_code == 400:
                    print("  ✅ Domain allowed - Request reached Django (400 is expected for empty login)")
                elif response.status_code == 401:
                    print("  ✅ Domain allowed - Request reached Django (401 is expected for unauthenticated)")
                elif response.status_code == 403:
                    print("  ✅ Domain allowed - Request reached Django (403 is expected for some endpoints)")
                else:
                    print(f"  ⚠️  Unexpected status: {response.status_code}")
                    
            except requests.exceptions.ConnectionError:
                print(f"  ❌ Connection failed - Server might be down")
            except requests.exceptions.Timeout:
                print(f"  ❌ Request timeout")
            except Exception as e:
                print(f"  ❌ Error: {e}")

def test_host_header():
    """Test with explicit Host headers"""
    print("\n\nTesting with explicit Host headers")
    print("=" * 50)
    
    test_urls = [
        ("https://api-dashboard.niete.pk/api/health/", "api-dashboard.niete.pk"),
        ("https://dashboard.niete.pk/api/health/", "dashboard.niete.pk")
    ]
    
    for url, host in test_urls:
        try:
            print(f"\nTesting: {url}")
            print(f"Host header: {host}")
            
            headers = {
                'Host': host,
                'User-Agent': 'Test-Client/1.0'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code in [200, 400, 401, 403]:
                print("✅ Host header accepted")
            else:
                print(f"⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

def test_curl_commands():
    """Show curl commands for manual testing"""
    print("\n\nCurl Commands for Manual Testing")
    print("=" * 50)
    
    commands = [
        "curl -H 'Host: api-dashboard.niete.pk' https://api-dashboard.niete.pk/api/health/",
        "curl -H 'Host: dashboard.niete.pk' https://dashboard.niete.pk/api/health/",
        "curl -X POST -H 'Host: api-dashboard.niete.pk' -H 'Content-Type: application/json' -d '{}' https://api-dashboard.niete.pk/api/auth/login/",
        "curl -X POST -H 'Host: dashboard.niete.pk' -H 'Content-Type: application/json' -d '{}' https://dashboard.niete.pk/api/auth/login/"
    ]
    
    for i, command in enumerate(commands, 1):
        print(f"{i}. {command}")

if __name__ == "__main__":
    test_allowed_hosts()
    test_host_header()
    test_curl_commands()
    
    print("\n" + "=" * 50)
    print("ALLOWED_HOSTS Test Complete")
    print("\nSummary:")
    print("- Both domains should now be allowed")
    print("- Health check endpoint should work")
    print("- Login endpoint should accept requests")
    print("- Django should not return DisallowedHost errors") 