#!/usr/bin/env python3
"""
Script to check data status and guide users on when to sync
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.services import DataService
from api.models import TeacherData, AggregatedData, SchoolData, FilterOptions, DataSyncLog
from django.utils import timezone
from datetime import timedelta

def check_data_status():
    """Check the status of data in the database"""
    print("🔍 Checking Data Status")
    print("=" * 50)
    
    # Check if we have any data
    teacher_count = TeacherData.objects.count()
    aggregated_count = AggregatedData.objects.count()
    school_count = SchoolData.objects.count()
    filter_options_count = FilterOptions.objects.count()
    
    print(f"📊 Current Data Counts:")
    print(f"   Teacher Data: {teacher_count} records")
    print(f"   Aggregated Data: {aggregated_count} records")
    print(f"   School Data: {school_count} records")
    print(f"   Filter Options: {filter_options_count} records")
    
    # Check data freshness
    freshness = DataService.check_data_freshness()
    print(f"\n⏰ Data Freshness (updated within 2 hours):")
    print(f"   Teacher Data: {'✅ Fresh' if freshness['teacher_data_fresh'] else '❌ Stale'}")
    print(f"   Aggregated Data: {'✅ Fresh' if freshness['aggregated_data_fresh'] else '❌ Stale'}")
    print(f"   School Data: {'✅ Fresh' if freshness['school_data_fresh'] else '❌ Stale'}")
    print(f"   Filter Options: {'✅ Fresh' if freshness['filter_options_fresh'] else '❌ Stale'}")
    
    # Check recent sync operations
    recent_syncs = DataSyncLog.objects.filter(
        started_at__gte=timezone.now() - timedelta(hours=24)
    ).order_by('-started_at')
    
    print(f"\n🔄 Recent Sync Operations (last 24 hours):")
    if recent_syncs:
        for sync in recent_syncs[:5]:  # Show last 5 syncs
            status_emoji = "✅" if sync.status == 'success' else "❌"
            print(f"   {status_emoji} {sync.sync_type}: {sync.status} ({sync.records_processed} records)")
    else:
        print("   No recent sync operations found")
    
    # Provide recommendations
    print(f"\n💡 Recommendations:")
    
    if teacher_count == 0 and aggregated_count == 0 and school_count == 0 and filter_options_count == 0:
        print("   🚨 No data found! You need to run the initial sync:")
        print("   python manage.py sync_bigquery_data --data-type=all")
    elif not freshness['all_fresh']:
        print("   ⚠️  Some data is stale. Consider running a sync:")
        print("   python manage.py sync_bigquery_data --data-type=all")
    else:
        print("   ✅ All data is fresh and up to date!")
    
    # Check if cron job is set up
    print(f"\n🤖 Cron Job Status:")
    try:
        import subprocess
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
        if 'sync_bigquery_data' in result.stdout:
            print("   ✅ Cron job is set up for automatic syncing")
        else:
            print("   ⚠️  No cron job found. Set up automatic syncing with:")
            print("   ./setup_cron.sh")
    except:
        print("   ⚠️  Could not check cron job status")

def main():
    """Main function"""
    try:
        check_data_status()
        return 0
    except Exception as e:
        print(f"❌ Error checking data status: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main()) 