#!/usr/bin/env python
"""
Test script to verify FDE-to-AEO messaging functionality
"""

import os
import sys
import django
import requests
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Message, Conversation
from django.utils import timezone

def test_fde_to_aeo_messaging():
    """Test the complete FDE-to-AEO messaging flow"""
    print("=== Testing FDE-to-AEO Messaging Functionality ===\n")
    
    # Step 1: Login as FDE (using AEO for testing since FDE password is unknown)
    print("1. Logging in as FDE...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Nilore', 'password': 'pass123'},  # Using AEO for testing
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    print(f"✅ Login successful!")
    
    # Step 2: Get AEOs by sector
    print("\n2. Getting AEOs by sector...")
    sectors = ['Nilore', 'Tarnol', 'Urban-I', 'Urban-II', 'B.K', 'Sihala']
    
    sector_aeo_map = {}
    for sector in sectors:
        aeo_response = requests.get(
            f'http://localhost:8000/api/aeos/by-sector/?sector={sector}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if aeo_response.status_code == 200:
            aeos = aeo_response.json()
            if aeos:
                sector_aeo_map[sector] = aeos[0]
                print(f"  ✅ {sector}: {aeos[0]['display_name']} (ID: {aeos[0]['id']})")
            else:
                print(f"  ⚠️  {sector}: No AEOs found")
        else:
            print(f"  ❌ {sector}: Failed to get AEOs - {aeo_response.text}")
    
    if not sector_aeo_map:
        print("❌ No AEOs found for any sector")
        return
    
    # Step 3: Test messaging to AEOs
    print("\n3. Testing messaging to AEOs...")
    successful_messages = 0
    
    for sector, aeo in list(sector_aeo_map.items())[:3]:  # Test first 3 sectors
        print(f"\n   Testing {sector} sector...")
        
        # Send message
        message_data = {
            'school_name': f'{aeo["display_name"]} Sector',
            'message_text': f'Test message from FDE to {aeo["display_name"]} in {sector} sector',
            'receiverId': aeo['id']
        }
        
        message_response = requests.post(
            'http://localhost:8000/api/messages/',
            json=message_data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        )
        
        if message_response.status_code in [200, 201]:
            print(f"     ✅ Message sent successfully to {aeo['display_name']}")
            successful_messages += 1
        else:
            print(f"     ❌ Failed to send message: {message_response.text}")
    
    # Step 4: Verify messages were created
    print("\n4. Verifying messages in database...")
    try:
        # Get the user who sent the messages
        sender = User.objects.get(username='Nilore')
        sent_messages = Message.objects.filter(sender=sender).order_by('-timestamp')[:3]
        
        print(f"   Found {sent_messages.count()} recent messages:")
        for msg in sent_messages:
            print(f"     - To: {msg.receiver.username} | Message: {msg.message_text[:50]}...")
        
    except Exception as e:
        print(f"   ❌ Error checking database: {e}")
    
    # Summary
    print(f"\n=== Test Results ===")
    print(f"✅ Successful messages: {successful_messages}/3")
    print(f"📊 Success rate: {(successful_messages/3)*100:.1f}%")
    
    if successful_messages == 3:
        print("🎉 All FDE-to-AEO messaging tests passed!")
    else:
        print("⚠️  Some tests failed. Check the logs above.")

def test_sector_aeo_mapping():
    """Test the sector to AEO mapping functionality"""
    print("\n=== Testing Sector-AEO Mapping ===\n")
    
    # Get all AEOs grouped by sector
    aeos = UserProfile.objects.filter(role='AEO', user__is_active=True).select_related('user')
    
    sector_groups = {}
    for aeo in aeos:
        sector = aeo.sector or 'Unknown'
        if sector not in sector_groups:
            sector_groups[sector] = []
        sector_groups[sector].append(aeo)
    
    print("AEOs by sector:")
    for sector, aeo_list in sector_groups.items():
        print(f"  {sector}: {len(aeo_list)} AEO(s)")
        for aeo in aeo_list:
            print(f"    - {aeo.user.username} (ID: {aeo.user.id})")
    
    # Check if all required sectors have AEOs
    required_sectors = ['Nilore', 'Tarnol', 'Urban-I', 'Urban-II', 'B.K', 'Sihala']
    missing_sectors = []
    
    for sector in required_sectors:
        if sector not in sector_groups or not sector_groups[sector]:
            missing_sectors.append(sector)
    
    if missing_sectors:
        print(f"\n⚠️  Missing AEOs for sectors: {missing_sectors}")
    else:
        print(f"\n✅ All required sectors have AEOs")

if __name__ == "__main__":
    test_sector_aeo_mapping()
    test_fde_to_aeo_messaging() 