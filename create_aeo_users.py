#!/usr/bin/env python3
"""
Script to create local User records for AEOs from BigQuery
This allows AEOs to log in and see messages sent to them
"""

import os
import sys
import django
from django.contrib.auth.models import User
from google.cloud import bigquery

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import UserProfile

def create_aeo_users():
    """Create local User records for AEOs from BigQuery"""
    
    try:
        # Initialize BigQuery client
        client = bigquery.Client()
        
        # Query to get all AEOs from BigQuery
        query = """
        SELECT DISTINCT
            e.Sector as sector_name,
            CONCAT('aeo_', LOWER(REPLACE(e.Sector, ' ', '_'))) as username,
            CONCAT('AEO ', e.Sector) as display_name
        FROM `tbproddb.FDE_Schools` e
        WHERE e.Sector IS NOT NULL AND e.Sector != ''
        ORDER BY e.Sector
        """
        
        # Execute query
        query_job = client.query(query)
        results = query_job.result()
        
        created_count = 0
        updated_count = 0
        
        for row in results:
            username = row.username
            sector_name = row.sector_name
            display_name = row.display_name
            
            # Check if user already exists
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@example.com',
                    'first_name': display_name,
                    'last_name': '',
                    'is_active': True
                }
            )
            
            if created:
                # Set a default password for AEO users
                user.set_password('aeo123')
                user.save()
                print(f"✅ Created user: {username} (Sector: {sector_name})")
                created_count += 1
            else:
                print(f"ℹ️  User already exists: {username}")
                updated_count += 1
            
            # Create or update UserProfile
            profile, profile_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': 'AEO',
                    'sector': sector_name,
                    'school_name': f'{sector_name} Sector'
                }
            )
            
            if not profile_created:
                # Update existing profile
                profile.role = 'AEO'
                profile.sector = sector_name
                profile.school_name = f'{sector_name} Sector'
                profile.save()
                print(f"  Updated profile for: {username}")
        
        print(f"\n📊 Summary:")
        print(f"  Created users: {created_count}")
        print(f"  Updated users: {updated_count}")
        print(f"  Total AEOs: {created_count + updated_count}")
        
        # List all AEO users
        print(f"\n📋 All AEO users in local database:")
        aeo_users = User.objects.filter(userprofile__role='AEO')
        for user in aeo_users:
            profile = user.userprofile
            print(f"  - {user.username} (Sector: {profile.sector})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating AEO users: {e}")
        return False

def test_aeo_login():
    """Test if AEO users can log in"""
    
    print(f"\n🔐 Testing AEO login...")
    
    # Test with nilore
    test_username = 'aeo_nilore'
    test_password = 'aeo123'
    
    try:
        user = User.objects.get(username=test_username)
        if user.check_password(test_password):
            print(f"✅ Login test successful for {test_username}")
            print(f"  User ID: {user.id}")
            print(f"  Role: {user.userprofile.role}")
            print(f"  Sector: {user.userprofile.sector}")
            return True
        else:
            print(f"❌ Password check failed for {test_username}")
            return False
    except User.DoesNotExist:
        print(f"❌ User {test_username} not found")
        return False

def main():
    print("🚀 Creating AEO users in local database...")
    print("=" * 50)
    
    # Create AEO users
    success = create_aeo_users()
    
    if success:
        # Test login
        test_aeo_login()
        
        print(f"\n✅ AEO user creation completed!")
        print(f"📝 AEO users can now log in with:")
        print(f"   Username: aeo_<sector_name>")
        print(f"   Password: aeo123")
        print(f"   Example: aeo_nilore / aeo123")
    else:
        print(f"\n❌ AEO user creation failed!")

if __name__ == "__main__":
    main() 