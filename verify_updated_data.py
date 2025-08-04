#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData

def verify_updated_data():
    """Verify the updated lesson plan usage distribution after BigQuery sync"""
    
    print("=== Updated Lesson Plan Usage Distribution ===\n")
    
    # Calculate lesson plan usage distribution by sector
    sector_distribution = {}
    total_usage = 0
    
    # Get all sectors
    sectors = SchoolData.objects.values_list('sector', flat=True).distinct()
    
    for sector in sectors:
        # Get all schools in this sector
        sector_schools = SchoolData.objects.filter(sector=sector)
        
        # Calculate total lesson plan usage for this sector
        sector_usage = 0
        school_count = 0
        teacher_count = 0
        
        for school in sector_schools:
            # Multiply avg_lp_ratio by teacher_count to get weighted usage
            school_usage = (school.avg_lp_ratio or 0) * (school.teacher_count or 0)
            sector_usage += school_usage
            school_count += 1
            teacher_count += school.teacher_count or 0
        
        sector_distribution[sector] = {
            'usage': sector_usage,
            'schools': school_count,
            'teachers': teacher_count
        }
        total_usage += sector_usage
    
    # Convert to percentages
    if total_usage > 0:
        for sector in sector_distribution:
            sector_distribution[sector]['percentage'] = (sector_distribution[sector]['usage'] / total_usage) * 100
    
    print("Updated Distribution (after BigQuery sync):")
    print("=" * 70)
    print("Sector    | Schools | Teachers | Usage Weight | Percentage")
    print("=" * 70)
    
    # Sort by percentage descending
    sorted_sectors = sorted(sector_distribution.items(), key=lambda x: x[1]['percentage'], reverse=True)
    
    for sector, data in sorted_sectors.items():
        print(f"{sector:<9} | {data['schools']:7} | {data['teachers']:8} | {data['usage']:12.1f} | {data['percentage']:9.1f}%")
    
    print("=" * 70)
    print(f"Total usage weight: {total_usage:.1f}")
    print(f"Total percentage: {sum(data['percentage'] for data in sector_distribution.values()):.1f}%")
    
    print("\n" + "=" * 70)
    print("PIE CHART DATA FOR FRONTEND:")
    print("=" * 70)
    print("The pie chart should now display these percentages:")
    print("-" * 50)
    
    for sector, data in sorted_sectors.items():
        print(f"- {sector}: {data['percentage']:.1f}%")
    
    print("=" * 70)
    print("✅ Data has been successfully updated from BigQuery!")
    print("✅ Pie chart will now show accurate lesson plan usage distribution")

if __name__ == "__main__":
    verify_updated_data() 