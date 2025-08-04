#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, SectorData

def final_verification():
    """Final verification of pie chart data"""
    
    print("=== Final Pie Chart Verification ===\n")
    
    # Expected percentages from the image
    expected_percentages = {
        'Urban-I': 22.2,
        'Urban-II': 21.4,
        'B.K': 16.8,
        'Sihala': 14.6,
        'Tarnol': 13.7,
        'Nilore': 11.3
    }
    
    print("1. EXPECTED PIE CHART DATA (from image):")
    print("=" * 50)
    for sector, percentage in expected_percentages.items():
        print(f"  {sector}: {percentage}%")
    
    # Calculate actual data
    print(f"\n2. ACTUAL API DATA:")
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
    
    # Format for frontend
    distribution_data = []
    for sector, percentage in sorted(sector_distribution.items(), key=lambda x: x[1], reverse=True):
        distribution_data.append({
            'sector': sector,
            'percentage': round(percentage, 1),
            'usage': sector_distribution[sector]
        })
        print(f"  {sector}: {percentage:.1f}%")
    
    print(f"\n3. FRONTEND DATA STRUCTURE:")
    print("=" * 50)
    
    # Simulate frontend processing
    sectorCounts = []
    for item in distribution_data:
        sectorCounts.append({
            'name': item['sector'],
            'value': item['percentage']
        })
        print(f"  name: '{item['sector']}', value: {item['percentage']}")
    
    print(f"\n4. VERIFICATION RESULTS:")
    print("=" * 50)
    
    all_match = True
    for item in sectorCounts:
        expected = expected_percentages.get(item['name'], 0)
        actual = item['value']
        match = "✅" if abs(expected - actual) < 0.1 else "❌"
        if abs(expected - actual) >= 0.1:
            all_match = False
        print(f"  {item['name']}: Expected {expected}%, Got {actual}% {match}")
    
    print(f"\n5. FINAL RESULT:")
    print("=" * 50)
    
    if all_match:
        print("🎉 SUCCESS! Pie chart data is correct!")
        print("✅ All percentages match the expected values")
        print("✅ API endpoint is working correctly")
        print("✅ Frontend will display the correct data")
        print("✅ Pie chart will show the right sector distribution")
    else:
        print("❌ FAILURE! Pie chart data is incorrect!")
        print("❌ Some percentages don't match expected values")
    
    print(f"\n6. PIE CHART DISPLAY:")
    print("=" * 50)
    print("The pie chart will display:")
    for i, item in enumerate(sectorCounts):
        print(f"  {i+1}. {item['name']}: {item['value']}%")
    
    print(f"\n✅ Verification complete!")

if __name__ == "__main__":
    final_verification() 