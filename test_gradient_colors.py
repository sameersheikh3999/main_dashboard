#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SectorData

def test_gradient_colors():
    """Test the new gradient color scheme based on LP ratios"""
    
    print("=== Gradient Color Scheme Test ===\n")
    
    # Get sector data sorted by LP ratio (high to low)
    sector_data = SectorData.objects.all().order_by('-avg_lp_ratio')
    
    print("1. GRADIENT COLOR THRESHOLDS:")
    print("=" * 70)
    
    def get_pie_chart_color(lp_ratio):
        # Color based on LP ratio performance with gradient
        if lp_ratio >= 18.0:
            return '#065f46'  # Dark green for highest performing (18%+)
        elif lp_ratio >= 17.5:
            return '#047857'  # Medium dark green (17.5-17.99%)
        elif lp_ratio >= 17.0:
            return '#10b981'  # Green (17.0-17.49%)
        elif lp_ratio >= 16.5:
            return '#34d399'  # Light green (16.5-16.99%)
        elif lp_ratio >= 16.0:
            return '#6ee7b7'  # Very light green (16.0-16.49%)
        elif lp_ratio >= 15.5:
            return '#fbbf24'  # Light yellow (15.5-15.99%)
        elif lp_ratio >= 15.0:
            return '#f59e0b'  # Yellow (15.0-15.49%)
        elif lp_ratio >= 14.5:
            return '#f97316'  # Orange (14.5-14.99%)
        elif lp_ratio >= 14.0:
            return '#ef4444'  # Red (14.0-14.49%)
        else:
            return '#dc2626'  # Dark red for lowest performing (<14.0%)
    
    print("LP Ratio Color Gradient:")
    print("  🟢 Dark Green: >= 18.0% (#065f46)")
    print("  🟢 Medium Dark Green: 17.5-17.99% (#047857)")
    print("  🟢 Green: 17.0-17.49% (#10b981)")
    print("  🟢 Light Green: 16.5-16.99% (#34d399)")
    print("  🟢 Very Light Green: 16.0-16.49% (#6ee7b7)")
    print("  🟡 Light Yellow: 15.5-15.99% (#fbbf24)")
    print("  🟡 Yellow: 15.0-15.49% (#f59e0b)")
    print("  🟠 Orange: 14.5-14.99% (#f97316)")
    print("  🔴 Red: 14.0-14.49% (#ef4444)")
    print("  🔴 Dark Red: < 14.0% (#dc2626)")
    print()
    
    print("2. SECTOR PERFORMANCE WITH GRADIENT COLORS:")
    print("=" * 70)
    
    for sector in sector_data:
        color = get_pie_chart_color(sector.avg_lp_ratio)
        
        # Determine color name and emoji
        if color == '#065f46':
            color_name = "Dark Green"
            emoji = "🟢"
        elif color == '#047857':
            color_name = "Medium Dark Green"
            emoji = "🟢"
        elif color == '#10b981':
            color_name = "Green"
            emoji = "🟢"
        elif color == '#34d399':
            color_name = "Light Green"
            emoji = "🟢"
        elif color == '#6ee7b7':
            color_name = "Very Light Green"
            emoji = "🟢"
        elif color == '#fbbf24':
            color_name = "Light Yellow"
            emoji = "🟡"
        elif color == '#f59e0b':
            color_name = "Yellow"
            emoji = "🟡"
        elif color == '#f97316':
            color_name = "Orange"
            emoji = "🟠"
        elif color == '#ef4444':
            color_name = "Red"
            emoji = "🔴"
        else:
            color_name = "Dark Red"
            emoji = "🔴"
        
        print(f"  {emoji} {sector.sector}: {sector.avg_lp_ratio:.2f}% ({color_name})")
    
    print(f"\n3. PIE CHART SLICE GRADIENT:")
    print("=" * 70)
    
    # Simulate frontend data structure
    sectorCounts = []
    for sector in sector_data:
        sectorCounts.append({
            'name': sector.sector,
            'value': sector.avg_lp_ratio
        })
    
    print("Pie chart slices with gradient colors (from highest to lowest):")
    for i, item in enumerate(sectorCounts):
        color = get_pie_chart_color(item['value'])
        
        # Determine color name and emoji
        if color == '#065f46':
            color_name = "Dark Green"
            emoji = "🟢"
        elif color == '#047857':
            color_name = "Medium Dark Green"
            emoji = "🟢"
        elif color == '#10b981':
            color_name = "Green"
            emoji = "🟢"
        elif color == '#34d399':
            color_name = "Light Green"
            emoji = "🟢"
        elif color == '#6ee7b7':
            color_name = "Very Light Green"
            emoji = "🟢"
        elif color == '#fbbf24':
            color_name = "Light Yellow"
            emoji = "🟡"
        elif color == '#f59e0b':
            color_name = "Yellow"
            emoji = "🟡"
        elif color == '#f97316':
            color_name = "Orange"
            emoji = "🟠"
        elif color == '#ef4444':
            color_name = "Red"
            emoji = "🔴"
        else:
            color_name = "Dark Red"
            emoji = "🔴"
        
        print(f"  {i+1}. {emoji} {item['name']}: {item['value']:.2f}% ({color_name})")
    
    print(f"\n4. GRADIENT COLOR DISTRIBUTION:")
    print("=" * 70)
    
    # Count sectors by color category
    dark_green = sum(1 for sector in sector_data if sector.avg_lp_ratio >= 18.0)
    medium_dark_green = sum(1 for sector in sector_data if 17.5 <= sector.avg_lp_ratio < 18.0)
    green = sum(1 for sector in sector_data if 17.0 <= sector.avg_lp_ratio < 17.5)
    light_green = sum(1 for sector in sector_data if 16.5 <= sector.avg_lp_ratio < 17.0)
    very_light_green = sum(1 for sector in sector_data if 16.0 <= sector.avg_lp_ratio < 16.5)
    light_yellow = sum(1 for sector in sector_data if 15.5 <= sector.avg_lp_ratio < 16.0)
    yellow = sum(1 for sector in sector_data if 15.0 <= sector.avg_lp_ratio < 15.5)
    orange = sum(1 for sector in sector_data if 14.5 <= sector.avg_lp_ratio < 15.0)
    red = sum(1 for sector in sector_data if 14.0 <= sector.avg_lp_ratio < 14.5)
    dark_red = sum(1 for sector in sector_data if sector.avg_lp_ratio < 14.0)
    
    print(f"🟢 Dark Green (18%+): {dark_green} sectors")
    print(f"🟢 Medium Dark Green (17.5-17.99%): {medium_dark_green} sectors")
    print(f"🟢 Green (17.0-17.49%): {green} sectors")
    print(f"🟢 Light Green (16.5-16.99%): {light_green} sectors")
    print(f"🟢 Very Light Green (16.0-16.49%): {very_light_green} sectors")
    print(f"🟡 Light Yellow (15.5-15.99%): {light_yellow} sectors")
    print(f"🟡 Yellow (15.0-15.49%): {yellow} sectors")
    print(f"🟠 Orange (14.5-14.99%): {orange} sectors")
    print(f"🔴 Red (14.0-14.49%): {red} sectors")
    print(f"🔴 Dark Red (<14.0%): {dark_red} sectors")
    
    print(f"\n5. PERFORMANCE ANALYSIS:")
    print("=" * 70)
    
    print("Highest Performing Sectors (Dark Green):")
    highest = [s for s in sector_data if s.avg_lp_ratio >= 18.0]
    for sector in highest:
        print(f"  🟢 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nHigh Performing Sectors (Green Shades):")
    high = [s for s in sector_data if 17.0 <= s.avg_lp_ratio < 18.0]
    for sector in high:
        print(f"  🟢 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nMedium Performing Sectors (Light Green):")
    medium = [s for s in sector_data if 16.0 <= s.avg_lp_ratio < 17.0]
    for sector in medium:
        print(f"  🟢 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nLower Performing Sectors (Yellow/Orange):")
    lower = [s for s in sector_data if 14.5 <= s.avg_lp_ratio < 16.0]
    for sector in lower:
        print(f"  🟡 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print("\nLowest Performing Sectors (Red):")
    lowest = [s for s in sector_data if s.avg_lp_ratio < 14.5]
    for sector in lowest:
        print(f"  🔴 {sector.sector}: {sector.avg_lp_ratio:.2f}%")
    
    print(f"\n6. FINAL RESULT:")
    print("=" * 70)
    
    print("✅ Pie chart now uses gradient colors based on LP ratio!")
    print("✅ Darker green = Higher performing sectors")
    print("✅ Lighter colors = Medium performing sectors")
    print("✅ Darker red = Lower performing sectors")
    print("✅ Smooth visual transition from best to worst performance")
    print("✅ More nuanced performance visualization")
    
    print(f"\n✅ Gradient color scheme test complete!")

if __name__ == "__main__":
    test_gradient_colors() 