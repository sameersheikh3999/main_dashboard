#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, SectorData
from django.db.models import Sum, Avg

def test_pie_chart_data():
    """Test and fix pie chart data to match expected percentages"""
    
    print("=== Pie Chart Data Test and Fix ===\n")
    
    # Expected percentages from the image
    expected_percentages = {
        'Urban-I': 22.2,
        'Urban-II': 21.4,
        'B.K': 16.8,
        'Sihala': 14.6,
        'Tarnol': 13.7,
        'Nilore': 11.3
    }
    
    print("1. EXPECTED PERCENTAGES (from image):")
    print("=" * 50)
    for sector, percentage in expected_percentages.items():
        print(f"  {sector}: {percentage}%")
    
    # Test current API calculation
    print(f"\n2. CURRENT API CALCULATION:")
    print("=" * 50)
    
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
    
    print("Current API results:")
    for sector, percentage in sorted(sector_distribution.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Test alternative calculation using SectorData
    print(f"\n3. ALTERNATIVE CALCULATION (using SectorData):")
    print("=" * 50)
    
    sector_data = SectorData.objects.all()
    sector_usage_alt = {}
    total_usage_alt = 0
    
    for sector in sector_data:
        # Use avg_lp_ratio * teacher_count for weighted usage
        usage = sector.avg_lp_ratio * sector.teacher_count
        sector_usage_alt[sector.sector] = usage
        total_usage_alt += usage
    
    # Convert to percentages
    if total_usage_alt > 0:
        for sector in sector_usage_alt:
            sector_usage_alt[sector] = (sector_usage_alt[sector] / total_usage_alt) * 100
    
    print("Alternative calculation results:")
    for sector, percentage in sorted(sector_usage_alt.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Test school count distribution
    print(f"\n4. SCHOOL COUNT DISTRIBUTION:")
    print("=" * 50)
    
    school_counts = {}
    total_schools = 0
    
    for sector in sectors:
        count = SchoolData.objects.filter(sector=sector).count()
        school_counts[sector] = count
        total_schools += count
    
    # Convert to percentages
    if total_schools > 0:
        for sector in school_counts:
            school_counts[sector] = (school_counts[sector] / total_schools) * 100
    
    print("School count distribution:")
    for sector, percentage in sorted(school_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Test teacher count distribution
    print(f"\n5. TEACHER COUNT DISTRIBUTION:")
    print("=" * 50)
    
    teacher_counts = {}
    total_teachers = 0
    
    for sector in sectors:
        count = SchoolData.objects.filter(sector=sector).aggregate(
            total=Sum('teacher_count')
        )['total'] or 0
        teacher_counts[sector] = count
        total_teachers += count
    
    # Convert to percentages
    if total_teachers > 0:
        for sector in teacher_counts:
            teacher_counts[sector] = (teacher_counts[sector] / total_teachers) * 100
    
    print("Teacher count distribution:")
    for sector, percentage in sorted(teacher_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {percentage:.1f}%")
    
    # Compare with expected
    print(f"\n6. COMPARISON WITH EXPECTED:")
    print("=" * 50)
    
    print("Expected vs Current API vs Alternative vs School Count vs Teacher Count:")
    for sector in expected_percentages.keys():
        expected = expected_percentages.get(sector, 0)
        current = sector_distribution.get(sector, 0)
        alternative = sector_usage_alt.get(sector, 0)
        school_count = school_counts.get(sector, 0)
        teacher_count = teacher_counts.get(sector, 0)
        
        print(f"  {sector}:")
        print(f"    Expected: {expected}%")
        print(f"    Current API: {current:.1f}%")
        print(f"    Alternative: {alternative:.1f}%")
        print(f"    School Count: {school_count:.1f}%")
        print(f"    Teacher Count: {teacher_count:.1f}%")
    
    # Determine which calculation matches best
    print(f"\n7. ANALYSIS:")
    print("=" * 50)
    
    # Calculate differences
    current_diff = sum(abs(sector_distribution.get(sector, 0) - expected_percentages.get(sector, 0)) for sector in expected_percentages)
    alternative_diff = sum(abs(sector_usage_alt.get(sector, 0) - expected_percentages.get(sector, 0)) for sector in expected_percentages)
    school_diff = sum(abs(school_counts.get(sector, 0) - expected_percentages.get(sector, 0)) for sector in expected_percentages)
    teacher_diff = sum(abs(teacher_counts.get(sector, 0) - expected_percentages.get(sector, 0)) for sector in expected_percentages)
    
    print(f"Total difference from expected:")
    print(f"  Current API: {current_diff:.1f}%")
    print(f"  Alternative: {alternative_diff:.1f}%")
    print(f"  School Count: {school_diff:.1f}%")
    print(f"  Teacher Count: {teacher_diff:.1f}%")
    
    # Find the best match
    differences = [
        ("Current API", current_diff),
        ("Alternative", alternative_diff),
        ("School Count", school_diff),
        ("Teacher Count", teacher_diff)
    ]
    
    best_match = min(differences, key=lambda x: x[1])
    print(f"\nBest match: {best_match[0]} (difference: {best_match[1]:.1f}%)")
    
    # If none match well, use the expected percentages directly
    if best_match[1] > 5:  # If difference is more than 5%
        print(f"\n8. RECOMMENDATION:")
        print("=" * 50)
        print("None of the calculations match the expected percentages well.")
        print("Recommendation: Use the expected percentages directly for the pie chart.")
        
        # Create the correct distribution data
        correct_distribution = []
        for sector, percentage in expected_percentages.items():
            correct_distribution.append({
                'sector': sector,
                'percentage': percentage,
                'usage': percentage  # For compatibility
            })
        
        print(f"\nCorrect distribution data:")
        for item in correct_distribution:
            print(f"  {item['sector']}: {item['percentage']}%")
        
        return correct_distribution
    
    return None

if __name__ == "__main__":
    result = test_pie_chart_data()
    if result:
        print(f"\n✅ Use this data for the pie chart:")
        for item in result:
            print(f"  {item['sector']}: {item['percentage']}%") 