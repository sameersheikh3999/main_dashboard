#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SectorData

def test_new_pie_chart_data():
    """Test the new pie chart data using sector performance"""
    
    print("=== New Pie Chart Data Test (Sector Performance) ===\n")
    
    # Get sector data
    sector_data = SectorData.objects.all().order_by('-avg_lp_ratio')
    
    print("1. SECTOR PERFORMANCE DATA:")
    print("=" * 50)
    
    # Simulate frontend processing
    sectorCounts = []
    for sector in sector_data:
        sectorCounts.append({
            'name': sector.sector,
            'value': sector.avg_lp_ratio
        })
        print(f"  {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print(f"\n2. PIE CHART DATA STRUCTURE:")
    print("=" * 50)
    
    for item in sectorCounts:
        print(f"  name: '{item['name']}', value: {item['value']:.2f}")
    
    print(f"\n3. EXPECTED PERCENTAGES (from ranking image):")
    print("=" * 50)
    
    expected_percentages = {
        'B.K': 18.46,
        'Sihala': 17.49,
        'Urban-II': 16.96,
        'Urban-I': 16.30,
        'Tarnol': 15.84,
        'Nilore': 15.17
    }
    
    for sector, percentage in expected_percentages.items():
        print(f"  {sector}: {percentage}%")
    
    print(f"\n4. VERIFICATION RESULTS:")
    print("=" * 50)
    
    all_match = True
    for item in sectorCounts:
        expected = expected_percentages.get(item['name'], 0)
        actual = item['value']
        match = "✅" if abs(expected - actual) < 0.1 else "❌"
        if abs(expected - actual) >= 0.1:
            all_match = False
        print(f"  {item['name']}: Expected {expected}%, Got {actual:.2f}% {match}")
    
    print(f"\n5. PIE CHART DISPLAY:")
    print("=" * 50)
    print("The pie chart will now display:")
    for i, item in enumerate(sectorCounts):
        print(f"  {i+1}. {item['name']}: {item['value']:.2f}%")
    
    print(f"\n6. FINAL RESULT:")
    print("=" * 50)
    
    if all_match:
        print("🎉 SUCCESS! New pie chart data is correct!")
        print("✅ All percentages match the sector performance ranking")
        print("✅ Pie chart now shows sector performance distribution")
        print("✅ Data is sorted from highest to lowest performance")
    else:
        print("❌ FAILURE! Some percentages don't match expected values")
    
    print(f"\n✅ Test complete!")

if __name__ == "__main__":
    test_new_pie_chart_data() 