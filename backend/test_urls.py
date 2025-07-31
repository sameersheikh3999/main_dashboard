#!/usr/bin/env python3
import os
import sys
import django
import requests

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

def test_urls():
    """Test the API endpoints with trailing slashes"""
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/health/")
        print(f"Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    # Test BigQuery endpoints (should require authentication)
    endpoints = [
        "/api/bigquery/filter-options/",
        "/api/bigquery/aggregated-data/",
        "/api/bigquery/summary-stats/",
        "/api/bigquery/teacher-data/",
        "/api/bigquery/all-schools/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"{endpoint}: {response.status_code}")
            if response.status_code == 401:
                print("  ✅ Correctly requires authentication")
            elif response.status_code == 200:
                print("  ✅ Working")
            else:
                print(f"  ❌ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"{endpoint} error: {e}")

if __name__ == "__main__":
    print("Testing Django API endpoints...")
    test_urls() 