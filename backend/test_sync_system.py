#!/usr/bin/env python3
"""
Test script for the BigQuery sync system
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

def test_data_service():
    """Test the DataService methods"""
    print("Testing DataService methods...")
    
    try:
        # Test data freshness check
        freshness = DataService.check_data_freshness()
        print(f"Data freshness: {freshness}")
        
        # Test sync status
        sync_status = DataService.get_sync_status()
        print(f"Recent syncs: {len(sync_status)}")
        
        print("✅ DataService tests passed!")
        return True
    except Exception as e:
        print(f"❌ DataService test failed: {e}")
        return False

def test_models():
    """Test the new models"""
    print("Testing models...")
    
    try:
        # Test model creation
        log = DataSyncLog.objects.create(
            sync_type='test',
            status='success',
            records_processed=0
        )
        print(f"Created test sync log: {log}")
        
        # Clean up
        log.delete()
        
        print("✅ Model tests passed!")
        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def test_management_command():
    """Test the management command"""
    print("Testing management command...")
    
    try:
        from django.core.management import call_command
        from io import StringIO
        
        # Capture output
        out = StringIO()
        
        # Test the command (should skip if no recent data)
        call_command('sync_bigquery_data', '--data-type=filter_options', stdout=out)
        
        output = out.getvalue()
        print(f"Command output: {output}")
        
        print("✅ Management command test passed!")
        return True
    except Exception as e:
        print(f"❌ Management command test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing BigQuery Sync System")
    print("=" * 50)
    
    tests = [
        test_models,
        test_data_service,
        test_management_command,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The system is ready to use.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main()) 