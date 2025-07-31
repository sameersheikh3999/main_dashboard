#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData
from api.services import DataService
from django.contrib.auth.models import User
from api.models import UserProfile

def test_sector_calculations():
    """Test sector-specific calculations for total schools and average LP ratio"""
    
    print("=== Testing Sector-Specific Calculations ===\n")
    
    # Test each sector
    sectors = ['Nilore', 'Tarnol', 'Urban-I', 'Urban-II', 'B.K', 'Sihala']
    
    for sector in sectors:
        print(f"Testing Sector: {sector}")
        
        # Get all schools in this sector
        sector_schools = SchoolData.objects.filter(sector=sector)
        total_schools = sector_schools.count()
        
        # Calculate average LP ratio for the sector
        schools_with_lp = sector_schools.exclude(avg_lp_ratio__isnull=True)
        total_lp = sum(school.avg_lp_ratio or 0 for school in schools_with_lp)
        avg_lp_ratio = total_lp / schools_with_lp.count() if schools_with_lp.count() > 0 else 0
        
        # Count active schools (>10% LP ratio)
        active_schools = sector_schools.filter(avg_lp_ratio__gt=10).count()
        
        print(f"  - Total Schools: {total_schools}")
        print(f"  - Schools with LP data: {schools_with_lp.count()}")
        print(f"  - Average LP Ratio: {avg_lp_ratio:.2f}%")
        print(f"  - Active Schools (>10%): {active_schools}")
        print(f"  - Inactive Schools: {total_schools - active_schools}")
        
        # Test DataService filtering
        try:
            # Create a mock user profile for this sector
            mock_profile = UserProfile()
            mock_profile.role = 'AEO'
            mock_profile.sector = sector
            
            # Get filtered data from DataService
            filtered_schools = DataService.get_school_data(mock_profile)
            # DataService returns a list, not a queryset
            filtered_count = len(filtered_schools) if isinstance(filtered_schools, list) else filtered_schools.count()
            
            print(f"  - DataService filtered count: {filtered_count}")
            
            if filtered_count == total_schools:
                print(f"  - ✅ DataService filtering correct")
            else:
                print(f"  - ❌ DataService filtering mismatch: expected {total_schools}, got {filtered_count}")
                
        except Exception as e:
            print(f"  - ❌ DataService error: {e}")
        
        print()
    
    print("=== Test Complete ===")

if __name__ == '__main__':
    test_sector_calculations() 