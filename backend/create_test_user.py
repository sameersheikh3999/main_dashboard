#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def create_test_user():
    # Create a test user
    username = 'testuser'
    password = 'testpass123'
    role = 'AEO'
    school_name = 'Test School'
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists!")
        return
    
    # Create user
    user = User.objects.create_user(
        username=username,
        password=password,
        email='test@example.com'
    )
    
    # Create user profile
    UserProfile.objects.create(
        user=user,
        role=role,
        school_name=school_name
    )
    
    print(f"Created test user:")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print(f"Role: {role}")
    print(f"School: {school_name}")
    print("\nYou can now use these credentials to login!")

if __name__ == '__main__':
    create_test_user() 