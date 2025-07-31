#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile
from api.serializers import UserSerializer

def test_aeo_user_data():
    """Test that AEO users have sector information in their serialized data"""
    
    print("=== Testing AEO User Data Serialization ===\n")
    
    # Test each AEO user
    aeo_users = [
        {'username': 'Nilore', 'sector': 'Nilore'},
        {'username': 'Tarnol', 'sector': 'Tarnol'},
        {'username': 'Urban 1', 'sector': 'Urban-I'},
        {'username': 'Urban 2', 'sector': 'Urban-II'},
        {'username': 'B.K', 'sector': 'B.K'},
        {'username': 'Sihala', 'sector': 'Sihala'},
    ]
    
    for aeo_info in aeo_users:
        try:
            user = User.objects.get(username=aeo_info['username'])
            profile = user.userprofile
            
            print(f"Testing AEO: {aeo_info['username']}")
            print(f"  - Profile sector: {profile.sector}")
            print(f"  - Expected sector: {aeo_info['sector']}")
            
            # Test serialization
            serializer = UserSerializer(user)
            user_data = serializer.data
            
            print(f"  - Serialized user data: {user_data}")
            print(f"  - Profile in serialized data: {user_data.get('profile', {})}")
            print(f"  - Sector in serialized data: {user_data.get('profile', {}).get('sector', 'NOT FOUND')}")
            
            # Check if sector is correctly included
            serialized_sector = user_data.get('profile', {}).get('sector')
            if serialized_sector == aeo_info['sector']:
                print(f"  - ✅ Sector correctly serialized")
            else:
                print(f"  - ❌ Sector mismatch: expected {aeo_info['sector']}, got {serialized_sector}")
            
            print()
            
        except User.DoesNotExist:
            print(f"❌ AEO user '{aeo_info['username']}' not found")
        except Exception as e:
            print(f"❌ Error testing {aeo_info['username']}: {e}")
    
    print("=== Test Complete ===")

if __name__ == '__main__':
    test_aeo_user_data() 