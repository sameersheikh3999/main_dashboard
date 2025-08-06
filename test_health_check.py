#!/usr/bin/env python3
"""
Test script for the enhanced health check endpoint
"""
import requests
import json
from datetime import datetime

def test_health_check():
    """Test the health check endpoint"""
    urls = [
        "http://localhost:8000/api/health/",
        "https://api-dashboard.niete.pk/api/health/"
    ]
    
    for url in urls:
        try:
            print(f"\nTesting health check at: {url}")
            print("=" * 50)
            
            response = requests.get(url, timeout=10)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Time: {response.elapsed.total_seconds():.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Health check successful")
                print(f"Status: {data.get('status', 'unknown')}")
                print(f"Timestamp: {data.get('timestamp', 'unknown')}")
                print(f"Environment: {data.get('environment', 'unknown')}")
                print(f"Debug Mode: {data.get('debug', 'unknown')}")
                
                # Check database status
                if 'database' in data:
                    db_status = data['database']
                    print(f"Database: {db_status.get('status', 'unknown')}")
                
                # Check system resources
                if 'system' in data:
                    system = data['system']
                    if 'cpu_percent' in system:
                        print(f"CPU Usage: {system['cpu_percent']:.1f}%")
                    if 'memory_percent' in system:
                        print(f"Memory Usage: {system['memory_percent']:.1f}%")
                    if 'disk_percent' in system:
                        print(f"Disk Usage: {system['disk_percent']:.1f}%")
                
                # Check CORS configuration
                if 'cors' in data:
                    cors = data['cors']
                    print(f"CORS Frontend Allowed: {cors.get('frontend_origin_allowed', 'unknown')}")
                    print(f"CORS Origins: {cors.get('configured_origins', [])}")
                
                # Check endpoints
                if 'endpoints' in data:
                    print("Available Endpoints:")
                    for name, endpoint in data['endpoints'].items():
                        print(f"  {name}: {endpoint}")
                
            else:
                print(f"❌ Health check failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed for {url}")
        except requests.exceptions.Timeout:
            print(f"❌ Request timeout for {url}")
        except Exception as e:
            print(f"❌ Error testing {url}: {e}")

def test_health_check_simple():
    """Test just the basic health check response"""
    urls = [
        "http://localhost:8000/api/health/",
        "https://api-dashboard.niete.pk/api/health/"
    ]
    
    for url in urls:
        try:
            print(f"\nSimple test for: {url}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ OK - Status: {data.get('status', 'unknown')}")
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Health Check Endpoint Test")
    print("=" * 60)
    
    # Test local first
    test_health_check_simple()
    
    # Then detailed test
    test_health_check()
    
    print("\n" + "=" * 60)
    print("Health Check Test Complete") 