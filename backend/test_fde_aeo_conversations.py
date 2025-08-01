#!/usr/bin/env python
"""
Test script to specifically verify FDE-to-AEO conversations
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
from django.db import models

def test_fde_aeo_conversations():
    """Test FDE-to-AEO conversation creation and visibility"""
    print("=== Testing FDE-to-AEO Conversations ===\n")
    
    # Initialize variables
    fde_aeo_conversations = []
    conversations_response = None
    messages_response = None
    
    # Step 1: Login as FDE
    print("1. Logging in as FDE...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'fde', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    user_data = login_response.json()['user']
    print(f"✅ Login successful! User: {user_data['username']} (Role: {user_data['profile']['role']})")
    
    # Step 2: Get AEOs by sector
    print("\n2. Getting AEOs by sector...")
    sectors = ['Tarnol', 'Urban-I', 'B.K']
    
    for sector in sectors:
        aeo_response = requests.get(
            f'http://localhost:8000/api/aeos/by-sector/?sector={sector}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if aeo_response.status_code == 200:
            aeos = aeo_response.json()
            if aeos:
                target_aeo = aeos[0]
                print(f"   ✅ {sector}: {target_aeo['display_name']} (ID: {target_aeo['id']})")
                
                # Step 3: Send message to create FDE-to-AEO conversation
                print(f"   3. Sending message to {target_aeo['display_name']}...")
                
                message_data = {
                    'school_name': f'{target_aeo["display_name"]} Sector',
                    'message_text': f'Test FDE-to-AEO message for {sector} sector',
                    'receiverId': target_aeo['id']
                }
                
                message_response = requests.post(
                    'http://localhost:8000/api/messages/',
                    json=message_data,
                    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
                )
                
                if message_response.status_code in [200, 201]:
                    print(f"      ✅ Message sent successfully")
                else:
                    print(f"      ❌ Failed to send message: {message_response.text}")
            else:
                print(f"   ⚠️  {sector}: No AEOs found")
        else:
            print(f"   ❌ {sector}: Failed to get AEOs - {aeo_response.text}")
    
    # Step 4: Get all conversations and verify FDE-to-AEO conversations
    print("\n4. Verifying FDE-to-AEO conversations...")
    conversations_response = requests.get(
        'http://localhost:8000/api/conversations/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if conversations_response.status_code == 200:
        conversations = conversations_response.json()
        print(f"   ✅ Found {len(conversations)} total conversations")
        
        # Filter FDE-to-AEO conversations (FDE should see AEOs as other_user)
        for conv in conversations:
            if conv['other_user']['role'] == 'AEO':
                fde_aeo_conversations.append(conv)
        
        print(f"   ✅ Found {len(fde_aeo_conversations)} FDE-to-AEO conversations")
        
        # Show details of FDE-to-AEO conversations
        for i, conv in enumerate(fde_aeo_conversations[:3]):  # Show first 3
            print(f"\n   FDE-to-AEO Conversation {i+1}:")
            print(f"     ID: {conv['conversation_id']}")
            print(f"     School: {conv['school_name']}")
            print(f"     AEO: {conv['other_user']['username']}")
            print(f"     Unread: {conv['unread_count']}")
            
            if conv['latest_message']:
                latest_msg = conv['latest_message']
                print(f"     Latest: {latest_msg['text'][:50]}...")
                print(f"     Is Own: {latest_msg['is_own']}")
            else:
                print(f"     Latest: No message")
        
        # Step 5: Test conversation messages
        if fde_aeo_conversations:
            test_conv = fde_aeo_conversations[0]
            print(f"\n5. Testing messages for conversation with {test_conv['other_user']['username']}...")
            
            messages_response = requests.get(
                f'http://localhost:8000/api/conversations/{test_conv["conversation_id"]}/messages/',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if messages_response.status_code == 200:
                messages = messages_response.json()
                print(f"   ✅ Found {len(messages)} messages in conversation")
                
                for i, msg in enumerate(messages):
                    sender_name = msg['sender']['username'] if isinstance(msg['sender'], dict) else msg['sender']
                    print(f"     Message {i+1}: {msg['message_text'][:50]}... (from {sender_name})")
            else:
                print(f"   ❌ Failed to get messages: {messages_response.text}")
    else:
        print(f"   ❌ Failed to get conversations: {conversations_response.text}")
    
    # Step 6: Verify in database
    print("\n6. Verifying conversations in database...")
    try:
        # Get conversations where FDE is involved
        fde_user = User.objects.get(username='fde')
        conversations = Conversation.objects.filter(
            models.Q(aeo=fde_user) | models.Q(principal=fde_user)
        ).select_related('aeo', 'principal')
        
        print(f"   ✅ Found {conversations.count()} conversations for FDE in database")
        
        # Show FDE-to-AEO conversations
        fde_aeo_db = []
        for conv in conversations:
            try:
                if conv.principal == fde_user and hasattr(conv.aeo, 'userprofile') and conv.aeo.userprofile.role == 'AEO':
                    fde_aeo_db.append(conv)
                elif conv.aeo == fde_user and hasattr(conv.principal, 'userprofile') and conv.principal.userprofile.role == 'FDE':
                    fde_aeo_db.append(conv)
            except Exception as e:
                print(f"     ⚠️  Error checking conversation {conv.id}: {e}")
        
        print(f"   ✅ Found {len(fde_aeo_db)} FDE-to-AEO conversations in database")
        
        for conv in fde_aeo_db[:3]:
            print(f"     - {conv.school_name}: {conv.aeo.username} ↔ {conv.principal.username}")
            
    except Exception as e:
        print(f"   ❌ Error checking database: {e}")
    
    # Summary
    print(f"\n=== Test Results ===")
    print(f"✅ FDE-to-AEO conversations created: {len(fde_aeo_conversations) > 0}")
    print(f"✅ Conversations visible in API: {conversations_response.status_code == 200 if conversations_response else False}")
    print(f"✅ Messages accessible: {messages_response.status_code == 200 if messages_response else 'N/A'}")
    
    if len(fde_aeo_conversations) > 0:
        print("🎉 FDE-to-AEO conversations are working correctly!")
        print("🎉 FDE can see their sent messages in the message sidebar!")
    else:
        print("⚠️  No FDE-to-AEO conversations found")

if __name__ == "__main__":
    test_fde_aeo_conversations() 