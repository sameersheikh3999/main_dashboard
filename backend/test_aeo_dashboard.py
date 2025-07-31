#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, SchoolData, TeacherData
from api.services import DataService

def test_aeo_sector_filtering():
    """Test that AEO users can only see data from their sector"""
    
    print("=== Testing AEO Sector Filtering ===\n")
    
    # Test each AEO user
    aeo_users = [
        {'username': 'Nilore', 'sector': 'Nilore'},
        {'username': 'Tarnol', 'sector': 'Tarnol'},
        {'username': 'Urban 1', 'sector': 'Urban-I'},
        {'username': 'Urban 2', 'sector': 'Urban-II'},
        {'username': 'B.K', 'sector': 'B.K'},
        {'username': 'Sihala', 'sector': 'Sihala'},
    ]
    
    for aeo_info in aeo_users:
        try:
            user = User.objects.get(username=aeo_info['username'])
            profile = user.userprofile
            
            print(f"Testing AEO: {aeo_info['username']} (Sector: {aeo_info['sector']})")
            
            # Test school data filtering
            schools = DataService.get_school_data(profile)
            sector_schools = [s for s in schools if s['sector'] == aeo_info['sector']]
            
            print(f"  - Total schools in sector: {len(sector_schools)}")
            print(f"  - Schools returned by service: {len(schools)}")
            
            # Verify all returned schools are from the correct sector
            all_correct_sector = all(s['sector'] == aeo_info['sector'] for s in schools)
            print(f"  - All schools from correct sector: {'✅' if all_correct_sector else '❌'}")
            
            # Test summary stats
            stats = DataService.get_summary_stats(profile)
            print(f"  - Summary stats - Total teachers: {stats.get('total_teachers', 0)}")
            print(f"  - Summary stats - Total schools: {stats.get('total_schools', 0)}")
            
            print()
            
        except User.DoesNotExist:
            print(f"❌ AEO user '{aeo_info['username']}' not found")
        except Exception as e:
            print(f"❌ Error testing {aeo_info['username']}: {e}")
    
    print("=== Sector Distribution Test ===")
    
    # Show sector distribution in the database
    sectors = SchoolData.objects.values_list('sector', flat=True).distinct()
    for sector in sectors:
        school_count = SchoolData.objects.filter(sector=sector).count()
        print(f"{sector}: {school_count} schools")
    
    print("\n=== Test Complete ===")

if __name__ == '__main__':
    test_aeo_sector_filtering() 