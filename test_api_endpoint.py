#!/usr/bin/env python3
import os
import sys
import django
from django.test import Client
from django.contrib.auth.models import User
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

def test_api_endpoint():
    """Test the lesson plan usage distribution API endpoint directly"""
    
    print("=== API Endpoint Test ===\n")
    
    # Create a test user and client
    client = Client()
    
    # Create a test user if it doesn't exist
    try:
        test_user = User.objects.get(username='test_user')
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
    
    # Login the user
    login_success = client.login(username='test_user', password='testpass123')
    print(f"Login successful: {login_success}")
    
    # Test the API endpoint
    print(f"\n1. TESTING API ENDPOINT:")
    print("=" * 50)
    
    response = client.get('/api/lesson-plan-usage-distribution/')
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response data:")
        print(json.dumps(data, indent=2))
        
        print(f"\n2. VERIFYING DATA STRUCTURE:")
        print("=" * 50)
        
        if 'distribution' in data:
            distribution = data['distribution']
            print(f"Distribution has {len(distribution)} items")
            
            for item in distribution:
                print(f"  {item['sector']}: {item['percentage']}%")
            
            # Check if it matches expected
            expected_percentages = {
                'Urban-I': 22.2,
                'Urban-II': 21.4,
                'B.K': 16.8,
                'Sihala': 14.6,
                'Tarnol': 13.7,
                'Nilore': 11.3
            }
            
            print(f"\n3. COMPARING WITH EXPECTED:")
            print("=" * 50)
            
            for item in distribution:
                expected = expected_percentages.get(item['sector'], 0)
                actual = item['percentage']
                match = "✅" if abs(expected - actual) < 0.1 else "❌"
                print(f"  {item['sector']}: Expected {expected}%, Got {actual}% {match}")
        
        else:
            print("❌ No 'distribution' key in response")
    else:
        print(f"❌ API call failed with status {response.status_code}")
        print(f"Response content: {response.content.decode()}")
    
    # Clean up
    try:
        test_user.delete()
    except:
        pass
    
    print(f"\n✅ API endpoint test complete.")

if __name__ == "__main__":
    test_api_endpoint() 