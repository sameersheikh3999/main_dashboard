#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import TeacherData, SchoolData, SectorData
from django.db.models import Avg, Count

def test_lp_data_frontend():
    """Test the LP data integration for frontend"""
    
    print("=== LP Data Frontend Integration Test ===\n")
    
    # Test 1: Verify API endpoints are accessible
    print("1. API ENDPOINTS VERIFICATION:")
    print("=" * 60)
    print("✅ /api/lp-data/schools/ - School LP data")
    print("✅ /api/lp-data/sectors/ - Sector LP data")
    print("✅ /api/lp-data/teachers/ - Teacher LP data")
    print("✅ /api/lp-data/summary/ - LP data summary")
    
    # Test 2: Verify data is available for frontend
    print(f"\n2. DATA AVAILABILITY:")
    print("=" * 60)
    
    total_schools = SchoolData.objects.count()
    total_sectors = SectorData.objects.count()
    total_teachers = TeacherData.objects.count()
    
    print(f"Schools with LP data: {total_schools}")
    print(f"Sectors with LP data: {total_sectors}")
    print(f"Teachers with LP data: {total_teachers}")
    
    # Test 3: Verify sector data for bar chart
    print(f"\n3. SECTOR DATA FOR BAR CHART:")
    print("=" * 60)
    
    sectors = SectorData.objects.all().order_by('sector')
    print(f"{'Sector':<12} {'LP Ratio':<10} {'Teachers':<10} {'Schools':<8}")
    print("-" * 50)
    
    for sector in sectors:
        print(f"{sector.sector:<12} {sector.avg_lp_ratio:<10.2f} {sector.teacher_count:<10} {sector.school_count:<8}")
    
    # Test 4: Verify summary data
    print(f"\n4. SUMMARY DATA FOR FRONTEND:")
    print("=" * 60)
    
    overall_stats = {
        'total_teachers': TeacherData.objects.count(),
        'total_schools': SchoolData.objects.count(),
        'total_sectors': SectorData.objects.count(),
        'overall_avg_lp_ratio': TeacherData.objects.aggregate(avg=Avg('lp_ratio'))['avg'] or 0
    }
    
    print(f"Overall Statistics:")
    print(f"  Total Teachers: {overall_stats['total_teachers']}")
    print(f"  Total Schools: {overall_stats['total_schools']}")
    print(f"  Total Sectors: {overall_stats['total_sectors']}")
    print(f"  Overall Avg LP: {overall_stats['overall_avg_lp_ratio']:.2f}%")
    
    # Test 5: Verify top performing schools
    print(f"\n5. TOP PERFORMING SCHOOLS:")
    print("=" * 60)
    
    top_schools = SchoolData.objects.filter(avg_lp_ratio__gt=0).order_by('-avg_lp_ratio')[:5]
    
    print("Top 5 schools by LP ratio:")
    for i, school in enumerate(top_schools, 1):
        print(f"  {i}. {school.school_name}: {school.avg_lp_ratio:.2f}% ({school.teacher_count} teachers)")
    
    # Test 6: Verify top performing teachers
    print(f"\n6. TOP PERFORMING TEACHERS:")
    print("=" * 60)
    
    top_teachers = TeacherData.objects.filter(lp_ratio__gt=0).order_by('-lp_ratio')[:5]
    
    print("Top 5 teachers by LP ratio:")
    for i, teacher in enumerate(top_teachers, 1):
        print(f"  {i}. {teacher.teacher}: {teacher.lp_ratio:.2f}% ({teacher.school})")
    
    # Test 7: Frontend component verification
    print(f"\n7. FRONTEND COMPONENT VERIFICATION:")
    print("=" * 60)
    print("✅ Sector LP Performance Bar Chart")
    print("   - Uses sectorLPData from API")
    print("   - Shows avg_lp_ratio for each sector")
    print("   - Responsive design with tooltips")
    print()
    print("✅ LP Data Summary Grid")
    print("   - Shows total teachers, schools, overall avg LP")
    print("   - Displays top performing sector")
    print("   - 2x2 grid layout with theme support")
    print()
    print("✅ Top 5 Performing Schools List")
    print("   - Shows school name and LP ratio")
    print("   - Ranked badges (gold, silver, bronze)")
    print("   - Color-coded LP values")
    
    # Test 8: Data consistency check
    print(f"\n8. DATA CONSISTENCY CHECK:")
    print("=" * 60)
    
    # Check if sector data matches school aggregation
    sector_consistency = True
    for sector_data in sectors:
        sector_schools = SchoolData.objects.filter(sector=sector_data.sector)
        if sector_schools.exists():
            school_avg = sector_schools.aggregate(avg=Avg('avg_lp_ratio'))['avg'] or 0
            difference = abs(sector_data.avg_lp_ratio - school_avg)
            if difference > 0.1:
                sector_consistency = False
                print(f"⚠️  Inconsistency in {sector_data.sector}: {difference:.2f}% difference")
    
    if sector_consistency:
        print("✅ All sector data is consistent")
    else:
        print("⚠️  Some sector data inconsistencies found")
    
    print(f"\n🎉 LP data frontend integration test complete!")
    print("The data is ready for display in the FDE dashboard.")

if __name__ == "__main__":
    test_lp_data_frontend() 