#!/usr/bin/env python
"""
Register Principals Script
This script creates principal users for all schools in the system.
"""

import os
import sys
import django
import random
import string

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, SchoolData

def generate_password(length=8):
    """Generate a random password"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def create_principal_for_school(school_data, index):
    """Create a principal user for a specific school"""
    school_name = school_data.school_name
    sector = school_data.sector
    emis = school_data.emis
    
    # Generate username based on school name
    username = f"principal_{school_name.lower().replace(' ', '_').replace(',', '').replace('-', '_')}_{index}"
    username = username[:30]  # Django username limit
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"User {username} already exists for {school_name}")
        return None
    
    # Generate email
    email = f"{username}@school.edu.pk"
    
    # Generate password
    password = generate_password()
    
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

def register_all_principals():
    """Register principals for all schools"""
    print("=== Principal Registration Script ===\n")
    
    # Get all schools
    schools = SchoolData.objects.all()
    print(f"Total schools found: {schools.count()}")
    
    # Get existing principals
    existing_principals = UserProfile.objects.filter(role='Principal')
    print(f"Existing principals: {existing_principals.count()}")
    
    # Get schools that already have principals
    schools_with_principals = set()
    for principal in existing_principals:
        if principal.school_name:
            schools_with_principals.add(principal.school_name)
    
    print(f"Schools with existing principals: {len(schools_with_principals)}")
    
    # Create principals for schools without principals
    created_principals = []
    skipped_count = 0
    
    for index, school in enumerate(schools, 1):
        if school.school_name in schools_with_principals:
            print(f"⏭️  Skipping {school.school_name} (already has principal)")
            skipped_count += 1
            continue
        
        principal_data = create_principal_for_school(school, index)
        if principal_data:
            created_principals.append(principal_data)
    
    # Summary
    print("\n=== Registration Summary ===")
    print(f"Total schools: {schools.count()}")
    print(f"Schools with existing principals: {len(schools_with_principals)}")
    print(f"Schools skipped: {skipped_count}")
    print(f"New principals created: {len(created_principals)}")
    
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
        with open('principal_credentials.txt', 'w') as f:
            f.write("=== Principal Credentials ===\n\n")
            for i, principal in enumerate(created_principals, 1):
                f.write(f"{i}. Username: {principal['username']}\n")
                f.write(f"   Password: {principal['password']}\n")
                f.write(f"   Email: {principal['email']}\n")
                f.write(f"   School: {principal['school']}\n")
                f.write(f"   Sector: {principal['sector']}\n")
                f.write(f"   EMIS: {principal['emis']}\n")
                f.write("-" * 50 + "\n")
        
        print(f"✅ Credentials saved to: principal_credentials.txt")
    
    return created_principals

def list_existing_principals():
    """List all existing principals"""
    print("=== Existing Principals ===\n")
    
    principals = UserProfile.objects.filter(role='Principal').select_related('user')
    
    if not principals.exists():
        print("No principals found in the system.")
        return
    
    for i, principal in enumerate(principals, 1):
        print(f"{i}. Username: {principal.user.username}")
        print(f"   Name: {principal.user.get_full_name()}")
        print(f"   Email: {principal.user.email}")
        print(f"   School: {principal.school_name}")
        print(f"   Sector: {principal.sector}")
        print(f"   EMIS: {principal.emis}")
        print(f"   Active: {principal.user.is_active}")
        print("-" * 50)

def main():
    """Main function"""
    print("Principal Registration Tool")
    print("1. List existing principals")
    print("2. Register principals for all schools")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        list_existing_principals()
    elif choice == "2":
        register_all_principals()
    elif choice == "3":
        print("Exiting...")
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    main() 