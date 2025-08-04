#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import TeacherData, SectorData
from django.db.models import Avg, Count

def explain_sector_lp_calculation():
    """Explain how sector LP ratio is calculated"""
    
    print("=== SECTOR LP RATIO CALCULATION EXPLANATION ===\n")
    
    # Step 1: Show the calculation method
    print("1. CALCULATION METHOD:")
    print("=" * 60)
    print("Sector LP Ratio = AVG(lp_ratio) of ALL teachers in that sector")
    print()
    print("Django Query:")
    print("sector_stats = TeacherData.objects.values('sector').annotate(")
    print("    teacher_count=Count('user_id'),")
    print("    avg_lp_ratio=Avg('lp_ratio'),")
    print("    school_count=Count('emis', distinct=True)")
    print(")")
    print()
    
    # Step 2: Show the actual calculation for each sector
    print("2. DETAILED CALCULATION FOR EACH SECTOR:")
    print("=" * 60)
    
    sectors = SectorData.objects.all().order_by('sector')
    
    for sector_data in sectors:
        sector_name = sector_data.sector
        print(f"\nSECTOR: {sector_name}")
        print("-" * 40)
        
        # Get all teachers for this sector
        teachers = TeacherData.objects.filter(sector=sector_name)
        
        print(f"Total teachers in {sector_name}: {teachers.count()}")
        print(f"Stored sector avg_lp_ratio: {sector_data.avg_lp_ratio:.2f}%")
        
        # Calculate manually to verify
        if teachers.exists():
            # Method 1: Using Django aggregate
            django_avg = teachers.aggregate(avg=Avg('lp_ratio'))['avg'] or 0
            
            # Method 2: Manual calculation
            total_lp = sum(teacher.lp_ratio for teacher in teachers)
            manual_avg = total_lp / teachers.count()
            
            print(f"Django calculated avg: {django_avg:.2f}%")
            print(f"Manual calculated avg: {manual_avg:.2f}%")
            
            # Show sample teachers
            print(f"\nSample teachers in {sector_name}:")
            sample_teachers = teachers[:5]
            for i, teacher in enumerate(sample_teachers, 1):
                print(f"  {i}. {teacher.teacher}: {teacher.lp_ratio:.2f}%")
            
            if teachers.count() > 5:
                print(f"  ... and {teachers.count() - 5} more teachers")
            
            # Show calculation breakdown
            print(f"\nCalculation breakdown:")
            print(f"  Sum of all teacher LP ratios: {total_lp:.2f}")
            print(f"  Number of teachers: {teachers.count()}")
            print(f"  Average = {total_lp:.2f} ÷ {teachers.count()} = {manual_avg:.2f}%")
            
            # Verify accuracy
            difference = abs(sector_data.avg_lp_ratio - manual_avg)
            if difference < 0.01:
                print(f"  ✅ VERIFIED: Stored value matches calculated value")
            else:
                print(f"  ⚠️  DISCREPANCY: Difference of {difference:.2f}%")
        
        print()
    
    # Step 3: Show the mathematical formula
    print("3. MATHEMATICAL FORMULA:")
    print("=" * 60)
    print("For each sector:")
    print("Sector LP Ratio = (Σ Teacher LP Ratios) ÷ (Number of Teachers)")
    print()
    print("Example:")
    print("If a sector has 3 teachers with LP ratios: 15%, 20%, 25%")
    print("Sector LP Ratio = (15 + 20 + 25) ÷ 3 = 60 ÷ 3 = 20%")
    print()
    
    # Step 4: Show the SQL equivalent
    print("4. SQL EQUIVALENT:")
    print("=" * 60)
    print("SELECT")
    print("    sector,")
    print("    COUNT(user_id) as teacher_count,")
    print("    AVG(lp_ratio) as avg_lp_ratio,")
    print("    COUNT(DISTINCT emis) as school_count")
    print("FROM TeacherData")
    print("GROUP BY sector")
    print("ORDER BY sector;")
    print()
    
    # Step 5: Show the actual data
    print("5. ACTUAL SECTOR DATA:")
    print("=" * 60)
    print(f"{'Sector':<12} {'Teachers':<10} {'Schools':<8} {'Avg LP':<8} {'Calculation'}")
    print("-" * 60)
    
    for sector_data in sectors:
        teachers = TeacherData.objects.filter(sector=sector_data.sector)
        if teachers.exists():
            total_lp = sum(teacher.lp_ratio for teacher in teachers)
            calc = f"{total_lp:.1f} ÷ {teachers.count()} = {sector_data.avg_lp_ratio:.2f}%"
        else:
            calc = "No teachers"
        
        print(f"{sector_data.sector:<12} {sector_data.teacher_count:<10} "
              f"{sector_data.school_count:<8} {sector_data.avg_lp_ratio:<8.2f} {calc}")
    
    print()
    
    # Step 6: Important notes
    print("6. IMPORTANT NOTES:")
    print("=" * 60)
    print("✅ The calculation includes ALL teachers in the sector")
    print("✅ Each teacher's individual LP ratio contributes equally")
    print("✅ It's a simple arithmetic mean (not weighted)")
    print("✅ Teachers with 0% LP ratio are included in the calculation")
    print("✅ The calculation is done at the teacher level, not school level")
    print("✅ This gives a true average of teacher performance in the sector")
    print()
    
    print("🎉 Sector LP ratio calculation explanation complete!")

if __name__ == "__main__":
    explain_sector_lp_calculation() 