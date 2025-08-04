#!/usr/bin/env python3
import os
import sys
import django
from django.db import models

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData

def verify_dashboard_bigquery_match():
    """Verify if dashboard data matches BigQuery data"""
    
    print("=== Dashboard vs BigQuery Data Verification ===\n")
    
    # Calculate current database data
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
        total_lp_ratio = 0
        
        for school in sector_schools:
            # Multiply avg_lp_ratio by teacher_count to get weighted usage
            school_usage = (school.avg_lp_ratio or 0) * (school.teacher_count or 0)
            sector_usage += school_usage
            school_count += 1
            teacher_count += school.teacher_count or 0
            total_lp_ratio += school.avg_lp_ratio or 0
        
        # Calculate average LP ratio for the sector
        avg_lp_ratio = total_lp_ratio / school_count if school_count > 0 else 0
        
        sector_distribution[sector] = {
            'usage': sector_usage,
            'schools': school_count,
            'teachers': teacher_count,
            'avg_lp_ratio': avg_lp_ratio
        }
        total_usage += sector_usage
    
    # Convert to percentages
    if total_usage > 0:
        for sector in sector_distribution:
            sector_distribution[sector]['percentage'] = (sector_distribution[sector]['usage'] / total_usage) * 100
    
    print("1. PIE CHART DATA VERIFICATION:")
    print("=" * 60)
    print("Sector    | Database % | Dashboard % | Match")
    print("=" * 60)
    
    # Dashboard pie chart data from the image
    dashboard_pie_data = {
        'Urban-I': 22.5,
        'Urban-II': 21.1,
        'B.K': 16.8,
        'Sihala': 14.8,
        'Tarnol': 13.5,
        'Nilore': 11.2
    }
    
    pie_match = True
    for sector, dashboard_percent in dashboard_pie_data.items():
        db_percent = sector_distribution.get(sector, {}).get('percentage', 0)
        match = abs(db_percent - dashboard_percent) <= 0.1
        status = "✅" if match else "❌"
        if not match:
            pie_match = False
        
        print(f"{sector:<9} | {db_percent:10.1f}% | {dashboard_percent:11.1f}% | {status}")
    
    print("=" * 60)
    print(f"Pie Chart Match: {'✅ YES' if pie_match else '❌ NO'}")
    
    print("\n" + "=" * 60)
    print("2. PERFORMANCE RANKING VERIFICATION:")
    print("=" * 60)
    print("Rank | Sector    | DB Avg LP | Dashboard Avg LP | Match")
    print("=" * 60)
    
    # Dashboard performance ranking data from the image
    dashboard_performance = {
        'Nilore': 14.83,
        'Tarnol': 15.02,
        'Urban-I': 16.33,
        'Urban-II': 16.35,
        'B.K': 16.38,
        'Sihala': 17.68
    }
    
    # Sort by database LP ratio for ranking
    sorted_sectors = sorted(sector_distribution.items(), key=lambda x: x[1]['avg_lp_ratio'])
    
    performance_match = True
    for rank, (sector, data) in enumerate(sorted_sectors, 1):
        db_avg_lp = data['avg_lp_ratio']
        dashboard_avg_lp = dashboard_performance.get(sector, 0)
        match = abs(db_avg_lp - dashboard_avg_lp) <= 0.1
        status = "✅" if match else "❌"
        if not match:
            performance_match = False
        
        print(f"{rank:4} | {sector:<9} | {db_avg_lp:9.2f}% | {dashboard_avg_lp:15.2f}% | {status}")
    
    print("=" * 60)
    print(f"Performance Ranking Match: {'✅ YES' if performance_match else '❌ NO'}")
    
    print("\n" + "=" * 60)
    print("3. SUMMARY STATS VERIFICATION:")
    print("=" * 60)
    
    # Calculate summary stats
    total_schools = sum(data['schools'] for data in sector_distribution.values())
    total_teachers = sum(data['teachers'] for data in sector_distribution.values())
    total_sectors = len(sector_distribution)
    
    # Calculate national average LP ratio
    all_schools = SchoolData.objects.all()
    national_avg_lp = all_schools.aggregate(avg=models.Avg('avg_lp_ratio'))['avg'] or 0
    
    print(f"Total Schools: {total_schools} (Dashboard: 341)")
    print(f"Total Teachers: {total_teachers} (Dashboard: 3383)")
    print(f"Total Sectors: {total_sectors} (Dashboard: 6)")
    print(f"National Avg LP: {national_avg_lp:.1f}% (Dashboard: 16%)")
    
    print("\n" + "=" * 60)
    print("4. FINAL VERIFICATION:")
    print("=" * 60)
    
    if pie_match and performance_match:
        print("🎉 ALL DATA MATCHES! Dashboard is showing accurate BigQuery data.")
    else:
        print("⚠️  DATA MISMATCH DETECTED!")
        if not pie_match:
            print("   - Pie chart percentages don't match")
        if not performance_match:
            print("   - Performance ranking doesn't match")
        print("\nRecommendation: Re-sync data from BigQuery or check calculations.")

if __name__ == "__main__":
    verify_dashboard_bigquery_match() 