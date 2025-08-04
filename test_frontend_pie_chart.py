#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, SectorData
from django.db.models import Sum

def test_frontend_pie_chart():
    """Test frontend pie chart data loading and fix issues"""
    
    print("=== Frontend Pie Chart Test ===\n")
    
    # Expected percentages from the image
    expected_percentages = {
        'Urban-I': 22.2,
        'Urban-II': 21.4,
        'B.K': 16.8,
        'Sihala': 14.6,
        'Tarnol': 13.7,
        'Nilore': 11.3
    }
    
    print("1. VERIFYING API ENDPOINT DATA:")
    print("=" * 50)
    
    # Simulate the API endpoint calculation
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
    
    print("API endpoint should return:")
    distribution_data = []
    for sector, percentage in sorted(sector_distribution.items(), key=lambda x: x[1], reverse=True):
        distribution_data.append({
            'sector': sector,
            'percentage': round(percentage, 1),
            'usage': sector_distribution[sector]
        })
        print(f"  {sector}: {percentage:.1f}%")
    
    print(f"\n2. FRONTEND DATA PROCESSING:")
    print("=" * 50)
    
    # Simulate frontend processing
    print("Frontend should process this data as:")
    sectorCounts = []
    for item in distribution_data:
        sectorCounts.append({
            'name': item['sector'],
            'value': item['percentage']
        })
        print(f"  name: '{item['sector']}', value: {item['percentage']}")
    
    print(f"\n3. PIE CHART DATA VERIFICATION:")
    print("=" * 50)
    
    # Verify the data matches expected
    print("Comparing with expected percentages:")
    for item in sectorCounts:
        expected = expected_percentages.get(item['name'], 0)
        actual = item['value']
        match = "✅" if abs(expected - actual) < 0.1 else "❌"
        print(f"  {item['name']}: Expected {expected}%, Got {actual:.1f}% {match}")
    
    print(f"\n4. POTENTIAL FRONTEND ISSUES:")
    print("=" * 50)
    
    # Check if the issue might be in the frontend
    print("Possible issues:")
    print("1. API not being called (check network tab)")
    print("2. Data not being set in state (check console logs)")
    print("3. Fallback to school counts being used")
    print("4. Data structure mismatch")
    
    print(f"\n5. DEBUGGING STEPS:")
    print("=" * 50)
    
    print("Add these console.log statements to FDEDashboard.js:")
    print("""
    // In loadLessonPlanDistribution function:
    console.log('API Response:', response);
    console.log('Distribution data:', response.distribution);
    
    // In the useEffect that sets sectorCounts:
    console.log('lessonPlanDistribution:', lessonPlanDistribution);
    console.log('sectorCounts:', sectorCounts);
    console.log('Schools fallback:', schools.filter(s => s.sector === sector).length);
    """)
    
    print(f"\n6. EXPECTED FRONTEND BEHAVIOR:")
    print("=" * 50)
    
    print("If API works correctly:")
    print("- lessonPlanDistribution should have 6 items")
    print("- sectorCounts should use lessonPlanDistribution data")
    print("- Pie chart should show correct percentages")
    
    print("\nIf API fails:")
    print("- lessonPlanDistribution will be empty")
    print("- sectorCounts will fallback to school counts")
    print("- Pie chart will show school count distribution")
    
    print(f"\n7. RECOMMENDED FIX:")
    print("=" * 50)
    
    print("1. Check browser console for errors")
    print("2. Check network tab for API call to /lesson-plan-usage-distribution/")
    print("3. Verify the API response structure")
    print("4. Add error handling to prevent fallback to school counts")
    
    # Create a test API response
    test_response = {
        'distribution': distribution_data,
        'total_usage': total_usage
    }
    
    print(f"\n8. TEST API RESPONSE STRUCTURE:")
    print("=" * 50)
    print("Expected API response structure:")
    import json
    print(json.dumps(test_response, indent=2))
    
    return distribution_data

if __name__ == "__main__":
    result = test_frontend_pie_chart()
    print(f"\n✅ Test complete. Use this data to verify frontend behavior.") 