#!/usr/bin/env python
"""
Fix AEO user passwords to enable authentication
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def fix_aeo_passwords():
    """Set all AEO users to have password 'pass123'"""
    print("=== Fixing AEO User Passwords ===\n")
    
    aeos = UserProfile.objects.filter(role='AEO')
    print(f"Found {aeos.count()} AEO users")
    
    for aeo in aeos:
        try:
            aeo.user.set_password('pass123')
            aeo.user.save()
            print(f"✅ Set password for {aeo.user.username} (Sector: {aeo.sector})")
        except Exception as e:
            print(f"❌ Error setting password for {aeo.user.username}: {str(e)}")
    
    print(f"\n✅ Updated {aeos.count()} AEO users with password 'pass123'")

def test_authentication():
    """Test authentication after password fix"""
    print("\n=== Testing Authentication ===\n")
    
    aeos = UserProfile.objects.filter(role='AEO')
    
    for aeo in aeos[:3]:  # Test first 3
        try:
            from django.contrib.auth import authenticate
            user = authenticate(username=aeo.user.username, password='pass123')
            if user:
                print(f"✅ {aeo.user.username} can authenticate with 'pass123'")
            else:
                print(f"❌ {aeo.user.username} cannot authenticate with 'pass123'")
        except Exception as e:
            print(f"❌ Error testing {aeo.user.username}: {str(e)}")

if __name__ == "__main__":
    fix_aeo_passwords()
    test_authentication() 