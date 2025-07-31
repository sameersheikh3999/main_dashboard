#!/usr/bin/env python
"""
Admin Access Helper Script
This script helps you access the Django admin panel and manage superusers.
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
from django.contrib.auth import authenticate

def check_superusers():
    """Check existing superusers"""
    superusers = User.objects.filter(is_superuser=True)
    print(f"\n=== Existing Superusers ({superusers.count()}) ===")
    for user in superusers:
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Active: {user.is_active}")
        print(f"Last Login: {user.last_login}")
        print("-" * 40)

def create_superuser(username, email, password):
    """Create a new superuser"""
    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists!")
        return False
    
    user = User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created successfully!")
    return True

def test_login(username, password):
    """Test login with given credentials"""
    user = authenticate(username=username, password=password)
    if user:
        print(f"Login successful for user: {username}")
        return True
    else:
        print(f"Login failed for user: {username}")
        return False

if __name__ == "__main__":
    print("=== Django Admin Access Helper ===\n")
    
    # Check existing superusers
    check_superusers()
    
    print("\n=== Admin Panel Access ===")
    print("To access the admin panel:")
    print("1. Make sure the Django server is running: python manage.py runserver")
    print("2. Open your browser and go to: http://localhost:8000/admin/")
    print("3. Use one of the superuser credentials above to log in")
    
    print("\n=== Available Models in Admin ===")
    print("The following models are now available in the admin panel:")
    print("- UserProfile: User profiles with roles and school information")
    print("- Conversation: Chat conversations between AEOs and principals")
    print("- Message: Individual messages in conversations")
    print("- TeacherData: Teacher performance data from BigQuery")
    print("- AggregatedData: Aggregated school performance data")
    print("- SchoolData: School-level information")
    print("- FilterOptions: Available filter options for the dashboard")
    print("- DataSyncLog: Logs of data synchronization operations")
    print("- UserSchoolProfile: User-school profile mappings")
    
    print("\n=== Admin Features ===")
    print("- Search and filter capabilities for all models")
    print("- Message management (mark as read/unread)")
    print("- Conversation tracking with message counts")
    print("- Data synchronization monitoring")
    print("- User profile management")
    
    # Interactive mode
    print("\n=== Interactive Options ===")
    print("1. Create new superuser")
    print("2. Test login")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        username = input("Enter username: ").strip()
        email = input("Enter email: ").strip()
        password = input("Enter password: ").strip()
        create_superuser(username, email, password)
    
    elif choice == "2":
        username = input("Enter username: ").strip()
        password = input("Enter password: ").strip()
        test_login(username, password)
    
    elif choice == "3":
        print("Exiting...")
    
    else:
        print("Invalid choice!") 