#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, SectorData

def compare_pie_chart_options():
    """Compare different pie chart data options"""
    
    print("=== Pie Chart Data Options Comparison ===\n")
    
    # Option 1: Current Lesson Plan Usage Distribution (weighted by teacher count)
    print("1. CURRENT PIE CHART: Lesson Plan Usage Distribution")
    print("=" * 60)
    print("(Based on avg_lp_ratio * teacher_count for weighted usage)")
    
    sector_distribution = {}
    total_usage = 0
    
    sectors = SchoolData.objects.values_list('sector', flat=True).distinct()
    
    for sector in sectors:
        sector_schools = SchoolData.objects.filter(sector=sector)
        sector_usage = 0
        for school in sector_schools:
            school_usage = (school.avg_lp_ratio or 0) * (school.teacher_count or 0)
            sector_usage += school_usage
        sector_distribution[sector] = sector_usage
        total_usage += sector_usage
    
    if total_usage > 0:
        for sector in sector_distribution:
            sector_distribution[sector] = (sector_distribution[sector] / total_usage) * 100
    
    print("Current pie chart percentages:")
    for sector, percentage in sorted(sector_distribution.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Option 2: Sector Performance Distribution (based on LP ratios)
    print(f"\n2. NEW OPTION: Sector Performance Distribution")
    print("=" * 60)
    print("(Based on average LP ratios from ranking)")
    
    sector_data = SectorData.objects.all().order_by('avg_lp_ratio')
    total_lp = sum(sector.avg_lp_ratio for sector in sector_data)
    
    performance_distribution = {}
    for sector in sector_data:
        performance_distribution[sector.sector] = (sector.avg_lp_ratio / total_lp) * 100
    
    print("Performance-based pie chart percentages:")
    for sector, percentage in sorted(performance_distribution.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Option 3: Direct LP ratio percentages (normalized to 100%)
    print(f"\n3. ALTERNATIVE: Direct LP Ratio Distribution")
    print("=" * 60)
    print("(LP ratios normalized to sum to 100%)")
    
    lp_ratios = {
        'Nilore': 15.17,
        'Tarnol': 15.84,
        'Urban-I': 16.30,
        'Urban-II': 16.96,
        'Sihala': 17.49,
        'B.K': 18.46
    }
    
    total_ratio = sum(lp_ratios.values())
    normalized_distribution = {}
    for sector, ratio in lp_ratios.items():
        normalized_distribution[sector] = (ratio / total_ratio) * 100
    
    print("Normalized LP ratio percentages:")
    for sector, percentage in sorted(normalized_distribution.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    print(f"\n4. COMPARISON SUMMARY:")
    print("=" * 60)
    print("Current (Usage Distribution): Shows how much lesson plan usage each sector contributes")
    print("Performance Distribution: Shows sector performance based on LP ratios")
    print("Normalized LP Ratios: Shows direct LP ratio distribution")
    
    print(f"\n5. RECOMMENDATION:")
    print("=" * 60)
    print("Which option would you prefer for the pie chart?")
    print("1. Keep current (Lesson Plan Usage Distribution)")
    print("2. Switch to Performance Distribution")
    print("3. Switch to Normalized LP Ratios")
    
    return {
        'current': sector_distribution,
        'performance': performance_distribution,
        'normalized': normalized_distribution
    }

if __name__ == "__main__":
    options = compare_pie_chart_options()
    print(f"\n✅ Comparison complete. Choose your preferred option!") 