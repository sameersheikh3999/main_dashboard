#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def create_fde_users():
    """Create FDE users with the provided credentials"""
    fde_credentials = [
        {'username': 'fde', 'password': 'fde123'},
        {'username': 'test_fde_user', 'password': 'fde123'},
        {'username': 'fde_user', 'password': 'fde123'},
        {'username': 'test_fde', 'password': 'fde123'},
    ]
    
    print("Creating FDE users...")
    for cred in fde_credentials:
        username = cred['username']
        password = cred['password']
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            print(f"User '{username}' already exists!")
            continue
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=f'{username.lower().replace("_", "")}@example.com'
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            role='FDE',
            school_name='Field Data Entry'
        )
        
        print(f"✅ Created FDE user: {username}")

def main():
    print("=== Creating FDE Users ===\n")
    
    # Create FDE users
    create_fde_users()
    
    print("\n=== FDE User Creation Complete ===")
    print("\nFDE Login Credentials:")
    print("Username\t\tPassword")
    print("--------\t\t--------")
    print("fde\t\t\tfde123")
    print("test_fde_user\t\tfde123")
    print("fde_user\t\tfde123")
    print("test_fde\t\tfde123")
    
    print("\nAll FDE users have been created successfully!")

if __name__ == '__main__':
    main() 