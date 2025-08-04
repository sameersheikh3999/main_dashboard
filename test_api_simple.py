#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from api.models import SchoolData
import json

def test_api_simple():
    """Simple test of the lesson plan usage distribution API"""
    
    print("=== Simple API Test ===\n")
    
    # Create a test user
    test_user, created = User.objects.get_or_create(
        username='test_user',
        defaults={'email': 'test@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
    
    # Create client and login
    client = Client()
    login_success = client.login(username='test_user', password='testpass123')
    print(f"Login successful: {login_success}")
    
    # Test the endpoint
    response = client.get('/api/lesson-plan-usage-distribution/')
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print("✅ API endpoint working!")
            print(f"Response data: {json.dumps(data, indent=2)}")
            
            # Check if data matches expected
            if 'distribution' in data:
                distribution = data['distribution']
                print(f"\nDistribution items: {len(distribution)}")
                
                expected_percentages = {
                    'Urban-I': 22.2,
                    'Urban-II': 21.4,
                    'B.K': 16.8,
                    'Sihala': 14.6,
                    'Tarnol': 13.7,
                    'Nilore': 11.3
                }
                
                print("\nComparing with expected:")
                for item in distribution:
                    expected = expected_percentages.get(item['sector'], 0)
                    actual = item['percentage']
                    match = "✅" if abs(expected - actual) < 0.1 else "❌"
                    print(f"  {item['sector']}: Expected {expected}%, Got {actual}% {match}")
            
        except json.JSONDecodeError:
            print("❌ Response is not valid JSON")
            print(f"Response content: {response.content.decode()}")
    else:
        print(f"❌ API call failed with status {response.status_code}")
        print(f"Response content: {response.content.decode()}")
    
    # Clean up
    if created:
        test_user.delete()
    
    print("\n✅ Test complete.")

if __name__ == "__main__":
    test_api_simple() 