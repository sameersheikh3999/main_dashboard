#!/usr/bin/env python3
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData

def test_lesson_plan_distribution():
    """Test the lesson plan usage distribution calculation"""
    
    print("=== Testing Lesson Plan Usage Distribution ===\n")
    
    # Calculate manually to verify
    sector_distribution = {}
    total_usage = 0
    
    # Get all sectors
    sectors = SchoolData.objects.values_list('sector', flat=True).distinct()
    
    for sector in sectors:
        # Get all schools in this sector
        sector_schools = SchoolData.objects.filter(sector=sector)
        
        # Calculate total lesson plan usage for this sector
        sector_usage = 0
        for school in sector_schools:
            # Multiply avg_lp_ratio by teacher_count to get weighted usage
            school_usage = (school.avg_lp_ratio or 0) * (school.teacher_count or 0)
            sector_usage += school_usage
        
        sector_distribution[sector] = sector_usage
        total_usage += sector_usage
    
    # Convert to percentages
    if total_usage > 0:
        for sector in sector_distribution:
            sector_distribution[sector] = (sector_distribution[sector] / total_usage) * 100
    
    print("Manual Calculation Results:")
    print("-" * 50)
    for sector, percentage in sector_distribution.items():
        print(f"{sector}: {percentage:.1f}%")
    
    print(f"\nTotal usage: {total_usage}")
    
    # Test API endpoint
    print("\n" + "=" * 50)
    print("Testing API Endpoint:")
    print("=" * 50)
    
    try:
        # First, get a token (you'll need to login first)
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        login_response = requests.post(
            "http://localhost:8001/api/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            
            # Test the lesson plan distribution endpoint
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                "http://localhost:8001/api/lesson-plan-usage-distribution/",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("API Response:")
                print("-" * 30)
                for item in data['distribution']:
                    print(f"{item['sector']}: {item['percentage']}%")
                print(f"Total usage: {data['total_usage']}")
            else:
                print(f"API Error: {response.status_code}")
                print(response.text)
        else:
            print(f"Login failed: {login_response.status_code}")
            print(login_response.text)
            
    except Exception as e:
        print(f"Error testing API: {e}")

if __name__ == "__main__":
    test_lesson_plan_distribution() 