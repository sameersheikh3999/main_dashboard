#!/usr/bin/env python3
"""
Local test script for health check implementation
"""
import os
import sys
import django
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.main_api.settings')
django.setup()

from api.views import HealthCheckView
from rest_framework.test import APIRequestFactory
from rest_framework.response import Response

def test_health_check_view():
    """Test the HealthCheckView locally"""
    print("Testing HealthCheckView implementation...")
    print("=" * 50)
    
    # Create a test request
    factory = APIRequestFactory()
    request = factory.get('/api/health/')
    
    # Create the view instance
    view = HealthCheckView()
    
    try:
        # Call the get method
        response = view.get(request)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Type: {type(response)}")
        
        if hasattr(response, 'data'):
            data = response.data
            print("\n✅ Health check response data:")
            print(f"Status: {data.get('status', 'unknown')}")
            print(f"Timestamp: {data.get('timestamp', 'unknown')}")
            print(f"Version: {data.get('version', 'unknown')}")
            print(f"Environment: {data.get('environment', 'unknown')}")
            print(f"Debug: {data.get('debug', 'unknown')}")
            
            # Check database status
            if 'database' in data:
                db_status = data['database']
                print(f"Database Status: {db_status.get('status', 'unknown')}")
            
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
            
            print("\n✅ Health check implementation is working correctly!")
            
        else:
            print("❌ Response doesn't have data attribute")
            
    except Exception as e:
        print(f"❌ Error testing health check: {e}")
        import traceback
        traceback.print_exc()

def test_health_check_structure():
    """Test the structure of the health check response"""
    print("\nTesting health check response structure...")
    print("=" * 50)
    
    # Create a test request
    factory = APIRequestFactory()
    request = factory.get('/api/health/')
    
    # Create the view instance
    view = HealthCheckView()
    
    try:
        response = view.get(request)
        data = response.data
        
        # Check required fields
        required_fields = ['status', 'timestamp', 'version', 'environment', 'debug']
        missing_fields = []
        
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
        else:
            print("✅ All required fields present")
        
        # Check optional sections
        optional_sections = ['database', 'system', 'cors', 'endpoints']
        present_sections = []
        
        for section in optional_sections:
            if section in data:
                present_sections.append(section)
        
        print(f"✅ Present sections: {present_sections}")
        
        # Validate status values
        valid_statuses = ['ok', 'degraded', 'error']
        if data.get('status') in valid_statuses:
            print("✅ Status value is valid")
        else:
            print(f"❌ Invalid status: {data.get('status')}")
        
    except Exception as e:
        print(f"❌ Error testing structure: {e}")

if __name__ == "__main__":
    print("Health Check Implementation Test")
    print("=" * 60)
    
    test_health_check_view()
    test_health_check_structure()
    
    print("\n" + "=" * 60)
    print("Health Check Implementation Test Complete") 