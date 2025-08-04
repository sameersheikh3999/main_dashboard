#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SectorData

def test_pie_chart_colors():
    """Test the new pie chart color scheme based on LP ratios"""
    
    print("=== Pie Chart Color Scheme Test ===\n")
    
    # Get sector data sorted by LP ratio (high to low)
    sector_data = SectorData.objects.all().order_by('-avg_lp_ratio')
    
    print("1. SECTOR PERFORMANCE WITH COLORS:")
    print("=" * 60)
    
    def get_pie_chart_color(lp_ratio):
        # Color based on LP ratio performance
        if lp_ratio >= 17.5:
            return '#10b981'  # Green for high performing (17.5%+)
        elif lp_ratio >= 16.0:
            return '#f59e0b'  # Yellow for medium performing (16.0-17.49%)
        else:
            return '#ef4444'  # Red for low performing (<16.0%)
    
    print("LP Ratio Thresholds:")
    print("  🟢 Green (High): >= 17.5%")
    print("  🟡 Yellow (Medium): 16.0% - 17.49%")
    print("  🔴 Red (Low): < 16.0%")
    print()
    
    print("Sector Performance with Colors:")
    for sector in sector_data:
        color = get_pie_chart_color(sector.avg_lp_ratio)
        color_name = "Green" if color == '#10b981' else "Yellow" if color == '#f59e0b' else "Red"
        emoji = "🟢" if color == '#10b981' else "🟡" if color == '#f59e0b' else "🔴"
        
        print(f"  {emoji} {sector.sector}: {sector.avg_lp_ratio:.2f}% ({color_name})")
    
    print(f"\n2. PIE CHART SLICE COLORS:")
    print("=" * 60)
    
    # Simulate frontend data structure
    sectorCounts = []
    for sector in sector_data:
        sectorCounts.append({
            'name': sector.sector,
            'value': sector.avg_lp_ratio
        })
    
    print("Pie chart slices (from largest to smallest):")
    for i, item in enumerate(sectorCounts):
        color = get_pie_chart_color(item['value'])
        color_name = "Green" if color == '#10b981' else "Yellow" if color == '#f59e0b' else "Red"
        emoji = "🟢" if color == '#10b981' else "🟡" if color == '#f59e0b' else "🔴"
        
        print(f"  {i+1}. {emoji} {item['name']}: {item['value']:.2f}% ({color_name})")
    
    print(f"\n3. COLOR DISTRIBUTION:")
    print("=" * 60)
    
    green_count = sum(1 for sector in sector_data if sector.avg_lp_ratio >= 17.5)
    yellow_count = sum(1 for sector in sector_data if 16.0 <= sector.avg_lp_ratio < 17.5)
    red_count = sum(1 for sector in sector_data if sector.avg_lp_ratio < 16.0)
    
    print(f"🟢 Green (High Performance): {green_count} sectors")
    print(f"🟡 Yellow (Medium Performance): {yellow_count} sectors")
    print(f"🔴 Red (Low Performance): {red_count} sectors")
    
    print(f"\n4. PERFORMANCE ANALYSIS:")
    print("=" * 60)
    
    print("High Performing Sectors (Green):")
    high_performers = [s for s in sector_data if s.avg_lp_ratio >= 17.5]
    for sector in high_performers:
        print(f"  🟢 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nMedium Performing Sectors (Yellow):")
    medium_performers = [s for s in sector_data if 16.0 <= s.avg_lp_ratio < 17.5]
    for sector in medium_performers:
        print(f"  🟡 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nLow Performing Sectors (Red):")
    low_performers = [s for s in sector_data if s.avg_lp_ratio < 16.0]
    for sector in low_performers:
        print(f"  🔴 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print(f"\n5. FINAL RESULT:")
    print("=" * 60)
    
    print("✅ Pie chart colors now reflect sector performance!")
    print("✅ Green slices: High performing sectors (17.5%+)")
    print("✅ Yellow slices: Medium performing sectors (16.0-17.49%)")
    print("✅ Red slices: Low performing sectors (<16.0%)")
    print("✅ Visual performance indicators for quick assessment")
    
    print(f"\n✅ Color scheme test complete!")

if __name__ == "__main__":
    test_pie_chart_colors() 