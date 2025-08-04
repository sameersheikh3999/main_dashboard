#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.views import LessonPlanUsageDistributionView
from django.contrib.auth.models import User
from django.test import RequestFactory
from rest_framework.test import force_authenticate
import json

def test_view_direct():
    """Test the lesson plan usage distribution view directly"""
    
    print("=== Direct View Test ===\n")
    
    # Create a test user
    test_user, created = User.objects.get_or_create(
        username='test_user',
        defaults={'email': 'test@example.com'}
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
    
    # Create a request factory
    factory = RequestFactory()
    
    # Create a request
    request = factory.get('/api/lesson-plan-usage-distribution/')
    
    # Authenticate the request
    force_authenticate(request, user=test_user)
    
    # Create the view instance
    view = LessonPlanUsageDistributionView.as_view()
    
    # Call the view
    response = view(request)
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.data
            print("✅ View working correctly!")
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
            
        except Exception as e:
            print(f"❌ Error processing response: {e}")
            print(f"Response content: {response.content.decode()}")
    else:
        print(f"❌ View failed with status {response.status_code}")
        print(f"Response content: {response.content.decode()}")
    
    # Clean up
    if created:
        test_user.delete()
    
    print("\n✅ Test complete.")

if __name__ == "__main__":
    test_view_direct() 