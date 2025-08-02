#!/usr/bin/env python3
"""
Script to create admin user with specified credentials
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

def create_admin_user():
    """Create admin user with specified credentials"""
    username = 'admin'
    password = 'pass123'
    email = 'admin@example.com'
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"Updated existing user '{username}' with new password")
    else:
        # Create new superuser
        user = User.objects.create_superuser(username, email, password)
        print(f"Created new superuser '{username}'")
    
    # Test the login
    test_user = authenticate(username=username, password=password)
    if test_user:
        print(f"Login test successful for user: {username}")
        return True
    else:
        print(f"Login test failed for user: {username}")
        return False

if __name__ == "__main__":
    print("Creating admin user...")
    success = create_admin_user()
    if success:
        print("Admin user setup completed successfully!")
        print("Username: admin")
        print("Password: pass123")
    else:
        print("Failed to setup admin user!") 