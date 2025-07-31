#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, SchoolData

def create_aeo_users():
    """Create AEO users with the provided credentials"""
    aeo_credentials = [
        {'username': 'Nilore', 'password': 'Nilore123', 'sector': 'Nilore'},
        {'username': 'Tarnol', 'password': 'Tarnol123', 'sector': 'Tarnol'},
        {'username': 'Urban 1', 'password': 'Urban123', 'sector': 'Urban-I'},
        {'username': 'Urban 2', 'password': 'Urban2123', 'sector': 'Urban-II'},
        {'username': 'B.K', 'password': 'Bk123', 'sector': 'B.K'},
        {'username': 'Sihala', 'password': 'Sihala123', 'sector': 'Sihala'},
    ]
    
    print("Creating AEO users...")
    for cred in aeo_credentials:
        username = cred['username']
        password = cred['password']
        sector = cred['sector']
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            print(f"User '{username}' already exists!")
            continue
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=f'{username.lower().replace(" ", "")}@example.com'
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            role='AEO',
            school_name=f'{sector} District',
            sector=sector
        )
        
        print(f"✅ Created AEO user: {username} (Sector: {sector})")

def create_principal_users():
    """Create Principal users for each school"""
    print("\nCreating Principal users...")
    
    # Get all unique schools from SchoolData
    schools = SchoolData.objects.values('emis', 'school_name', 'sector').distinct()
    
    for school in schools:
        emis = school['emis']
        school_name = school['school_name']
        sector = school['sector']
        
        # Create username from EMIS
        username = f"principal_{emis}"
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            print(f"Principal user for EMIS {emis} already exists!")
            continue
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password='Principal123',
            email=f'principal_{emis}@example.com'
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            role='Principal',
            school_name=school_name,
            emis=emis,
            sector=sector
        )
        
        print(f"✅ Created Principal user: {username} (School: {school_name}, Sector: {sector})")

def main():
    print("=== Creating AEO and Principal Users ===\n")
    
    # Create AEO users
    create_aeo_users()
    
    # Create Principal users
    create_principal_users()
    
    print("\n=== User Creation Complete ===")
    print("\nAEO Login Credentials:")
    print("Username\t\tPassword")
    print("--------\t\t--------")
    print("Nilore\t\t\tNilore123")
    print("Tarnol\t\t\tTarnol123")
    print("Urban 1\t\t\tUrban123")
    print("Urban 2\t\t\tUrban2123")
    print("B.K\t\t\tBk123")
    print("Sihala\t\t\tSihala123")
    
    print("\nPrincipal Login Credentials:")
    print("Username\t\tPassword")
    print("--------\t\t--------")
    print("principal_[EMIS]\tPrincipal123")
    print("(Replace [EMIS] with the actual school EMIS number)")
    
    print("\nAll users have been created successfully!")

if __name__ == '__main__':
    main() 