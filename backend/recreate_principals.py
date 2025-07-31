#!/usr/bin/env python
"""
Recreate Principals Script
This script deletes existing principals and recreates them with new format:
Username: principal_[EMIS]
Password: pass123
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
from api.models import UserProfile, SchoolData

def delete_existing_principals():
    """Delete all existing principals"""
    print("=== Deleting Existing Principals ===\n")
    
    # Get all principals
    principals = UserProfile.objects.filter(role='Principal')
    print(f"Found {principals.count()} existing principals")
    
    if principals.count() == 0:
        print("No principals to delete.")
        return 0
    
    # Delete principals and their associated users
    deleted_count = 0
    for principal in principals:
        try:
            user = principal.user
            principal.delete()
            user.delete()
            deleted_count += 1
            print(f"✅ Deleted principal: {user.username}")
        except Exception as e:
            print(f"❌ Error deleting principal: {str(e)}")
    
    print(f"\nTotal principals deleted: {deleted_count}")
    return deleted_count

def create_principal_with_emis(school_data):
    """Create a principal user with EMIS-based username"""
    school_name = school_data.school_name
    sector = school_data.sector
    emis = school_data.emis
    
    # Generate username based on EMIS
    username = f"principal_{emis}"
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"User {username} already exists for {school_name}")
        return None
    
    # Generate email
    email = f"{username}@school.edu.pk"
    
    # Fixed password
    password = "pass123"
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=f"Principal",
            last_name=school_name.split()[0] if school_name.split() else "School"
        )
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            role='Principal',
            school_name=school_name,
            sector=sector,
            emis=str(emis)
        )
        
        print(f"✅ Created principal: {username} for {school_name}")
        print(f"   Password: {password}")
        print(f"   Email: {email}")
        print(f"   Sector: {sector}")
        print(f"   EMIS: {emis}")
        print("-" * 60)
        
        return {
            'username': username,
            'password': password,
            'email': email,
            'school': school_name,
            'sector': sector,
            'emis': emis
        }
        
    except Exception as e:
        print(f"❌ Error creating principal for {school_name}: {str(e)}")
        return None

def recreate_all_principals():
    """Recreate principals for all schools with new format"""
    print("=== Principal Recreation Script ===\n")
    
    # Step 1: Delete existing principals
    deleted_count = delete_existing_principals()
    
    print("\n" + "="*60 + "\n")
    
    # Step 2: Get all schools
    schools = SchoolData.objects.all()
    print(f"Total schools found: {schools.count()}")
    
    # Step 3: Create new principals
    created_principals = []
    
    for school in schools:
        principal_data = create_principal_with_emis(school)
        if principal_data:
            created_principals.append(principal_data)
    
    # Summary
    print("\n=== Recreation Summary ===")
    print(f"Principals deleted: {deleted_count}")
    print(f"New principals created: {len(created_principals)}")
    print(f"Total schools: {schools.count()}")
    
    if created_principals:
        print(f"\n=== New Principals Created ===")
        for i, principal in enumerate(created_principals, 1):
            print(f"{i}. Username: {principal['username']}")
            print(f"   Password: {principal['password']}")
            print(f"   School: {principal['school']}")
            print(f"   Sector: {principal['sector']}")
            print()
    
    # Save credentials to file
    if created_principals:
        with open('principal_credentials_new.txt', 'w') as f:
            f.write("=== Principal Credentials (New Format) ===\n\n")
            f.write("All principals use password: pass123\n\n")
            for i, principal in enumerate(created_principals, 1):
                f.write(f"{i}. Username: {principal['username']}\n")
                f.write(f"   Password: {principal['password']}\n")
                f.write(f"   Email: {principal['email']}\n")
                f.write(f"   School: {principal['school']}\n")
                f.write(f"   Sector: {principal['sector']}\n")
                f.write(f"   EMIS: {principal['emis']}\n")
                f.write("-" * 50 + "\n")
        
        print(f"✅ Credentials saved to: principal_credentials_new.txt")
    
    return created_principals

def verify_principals():
    """Verify the new principals"""
    print("\n=== Verification ===\n")
    
    principals = UserProfile.objects.filter(role='Principal')
    print(f"Total principals in system: {principals.count()}")
    
    # Check for duplicate usernames
    usernames = principals.values_list('user__username', flat=True)
    unique_usernames = set(usernames)
    print(f"Unique usernames: {len(unique_usernames)}")
    
    if len(usernames) != len(unique_usernames):
        print("⚠️  Warning: Duplicate usernames found!")
    else:
        print("✅ All usernames are unique")
    
    # Show sample principals
    print(f"\nSample principals:")
    for i, principal in enumerate(principals[:5], 1):
        print(f"{i}. {principal.user.username} - {principal.school_name} (EMIS: {principal.emis})")

def main():
    """Main function"""
    print("Principal Recreation Tool")
    print("This will DELETE all existing principals and recreate them with new format!")
    print("New format: principal_[EMIS] with password 'pass123'")
    
    confirm = input("\nAre you sure you want to proceed? (yes/no): ").strip().lower()
    
    if confirm == 'yes':
        recreate_all_principals()
        verify_principals()
    else:
        print("Operation cancelled.")

if __name__ == "__main__":
    main() 