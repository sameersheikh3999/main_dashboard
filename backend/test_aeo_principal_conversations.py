#!/usr/bin/env python
"""
Test script to verify AEO-to-Principal conversations in the message sidebar
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

def test_aeo_principal_conversations():
    """Test AEO-to-Principal conversation creation and visibility"""
    print("=== Testing AEO-to-Principal Conversations ===\n")
    
    # Initialize variables
    aeo_principal_conversations = []
    conversations_response = None
    messages_response = None
    
    # Step 1: Login as AEO
    print("1. Logging in as AEO...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Nilore', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    user_data = login_response.json()['user']
    print(f"✅ Login successful! User: {user_data['username']} (Role: {user_data['profile']['role']})")
    
    # Step 2: Get principals
    print("\n2. Getting principals...")
    principals_response = requests.get(
        'http://localhost:8000/api/principals/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if principals_response.status_code == 200:
        principals = principals_response.json()
        print(f"   ✅ Found {len(principals)} principals")
        
        # Test with first 3 principals
        test_principals = principals[:3]
        
        for i, principal in enumerate(test_principals):
            print(f"   {i+1}. {principal['display_name']} (ID: {principal['id']})")
            
            # Step 3: Send message to create AEO-to-Principal conversation
            print(f"   3. Sending message to {principal['display_name']}...")
            
            message_data = {
                'school_name': principal['school_name'],
                'message_text': f'Test AEO-to-Principal message for {principal["display_name"]}',
                'receiverId': principal['id']
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
        print(f"   ❌ Failed to get principals: {principals_response.text}")
        return
    
    # Step 4: Get all conversations and verify AEO-to-Principal conversations
    print("\n4. Verifying AEO-to-Principal conversations...")
    conversations_response = requests.get(
        'http://localhost:8000/api/conversations/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if conversations_response.status_code == 200:
        conversations = conversations_response.json()
        print(f"   ✅ Found {len(conversations)} total conversations")
        
        # Filter AEO-to-Principal conversations (AEO should see Principals as other_user)
        for conv in conversations:
            if conv['other_user']['role'] == 'Principal':
                aeo_principal_conversations.append(conv)
        
        print(f"   ✅ Found {len(aeo_principal_conversations)} AEO-to-Principal conversations")
        
        # Show details of AEO-to-Principal conversations
        for i, conv in enumerate(aeo_principal_conversations[:3]):  # Show first 3
            print(f"\n   AEO-to-Principal Conversation {i+1}:")
            print(f"     ID: {conv['conversation_id']}")
            print(f"     School: {conv['school_name']}")
            print(f"     Principal: {conv['other_user']['username']}")
            print(f"     Unread: {conv['unread_count']}")
            
            if conv['latest_message']:
                latest_msg = conv['latest_message']
                print(f"     Latest: {latest_msg['text'][:50]}...")
                print(f"     Is Own: {latest_msg['is_own']}")
            else:
                print(f"     Latest: No message")
        
        # Step 5: Test conversation messages
        if aeo_principal_conversations:
            test_conv = aeo_principal_conversations[0]
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
        # Get conversations where AEO is involved
        aeo_user = User.objects.get(username='Nilore')
        conversations = Conversation.objects.filter(
            models.Q(aeo=aeo_user) | models.Q(principal=aeo_user)
        ).select_related('aeo', 'principal')
        
        print(f"   ✅ Found {conversations.count()} conversations for AEO in database")
        
        # Show AEO-to-Principal conversations
        aeo_principal_db = []
        for conv in conversations:
            try:
                if conv.aeo == aeo_user and hasattr(conv.principal, 'userprofile') and conv.principal.userprofile.role == 'Principal':
                    aeo_principal_db.append(conv)
                elif conv.principal == aeo_user and hasattr(conv.aeo, 'userprofile') and conv.aeo.userprofile.role == 'AEO':
                    aeo_principal_db.append(conv)
            except Exception as e:
                print(f"     ⚠️  Error checking conversation {conv.id}: {e}")
        
        print(f"   ✅ Found {len(aeo_principal_db)} AEO-to-Principal conversations in database")
        
        for conv in aeo_principal_db[:3]:
            print(f"     - {conv.school_name}: {conv.aeo.username} ↔ {conv.principal.username}")
            
    except Exception as e:
        print(f"   ❌ Error checking database: {e}")
    
    # Summary
    print(f"\n=== Test Results ===")
    print(f"✅ AEO-to-Principal conversations created: {len(aeo_principal_conversations) > 0}")
    print(f"✅ Conversations visible in API: {conversations_response.status_code == 200 if conversations_response else False}")
    print(f"✅ Messages accessible: {messages_response.status_code == 200 if messages_response else 'N/A'}")
    
    if len(aeo_principal_conversations) > 0:
        print("🎉 AEO-to-Principal conversations are working correctly!")
        print("🎉 AEO can see their sent messages to principals in the message sidebar!")
    else:
        print("⚠️  No AEO-to-Principal conversations found")

def test_aeo_principal_messaging_flow():
    """Test the complete AEO-to-Principal messaging flow"""
    print("\n=== Testing Complete AEO-to-Principal Messaging Flow ===\n")
    
    # Step 1: Login as AEO
    print("1. Logging in as AEO...")
    login_response = requests.post(
        'http://localhost:8000/api/auth/login/',
        json={'username': 'Nilore', 'password': 'pass123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    print(f"✅ Login successful!")
    
    # Step 2: Get principals
    print("\n2. Getting principals...")
    principals_response = requests.get(
        'http://localhost:8000/api/principals/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if principals_response.status_code != 200:
        print(f"❌ Failed to get principals: {principals_response.text}")
        return
    
    principals = principals_response.json()
    if not principals:
        print("❌ No principals found")
        return
    
    target_principal = principals[0]
    print(f"   ✅ Target Principal: {target_principal['display_name']} (ID: {target_principal['id']})")
    
    # Step 3: Send message using "Ask Principal" flow
    print(f"\n3. Sending message to {target_principal['display_name']}...")
    
    message_data = {
        'school_name': target_principal['school_name'],
        'message_text': 'Test message from AEO to Principal via Ask Principal button',
        'receiverId': target_principal['id']
    }
    
    message_response = requests.post(
        'http://localhost:8000/api/messages/',
        json=message_data,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    )
    
    if message_response.status_code in [200, 201]:
        print("   ✅ Message sent successfully")
        
        # Step 4: Verify conversation appears in sidebar
        print("\n4. Verifying conversation appears in sidebar...")
        conversations_response = requests.get(
            'http://localhost:8000/api/conversations/',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if conversations_response.status_code == 200:
            conversations = conversations_response.json()
            
            # Find the conversation with this principal
            target_conversation = None
            for conv in conversations:
                if conv['other_user']['id'] == target_principal['id'] and conv['other_user']['role'] == 'Principal':
                    target_conversation = conv
                    break
            
            if target_conversation:
                print(f"   ✅ Conversation found in sidebar!")
                print(f"      ID: {target_conversation['conversation_id']}")
                print(f"      School: {target_conversation['school_name']}")
                print(f"      Principal: {target_conversation['other_user']['username']}")
                
                if target_conversation['latest_message']:
                    latest_msg = target_conversation['latest_message']
                    print(f"      Latest Message: {latest_msg['text'][:50]}...")
                    print(f"      Is Own Message: {latest_msg['is_own']}")
                
                # Step 5: Test message history
                print(f"\n5. Testing message history...")
                messages_response = requests.get(
                    f'http://localhost:8000/api/conversations/{target_conversation["conversation_id"]}/messages/',
                    headers={'Authorization': f'Bearer {token}'}
                )
                
                if messages_response.status_code == 200:
                    messages = messages_response.json()
                    print(f"   ✅ Found {len(messages)} messages in conversation")
                    
                    for i, msg in enumerate(messages):
                        sender_name = msg['sender']['username'] if isinstance(msg['sender'], dict) else msg['sender']
                        print(f"      Message {i+1}: {msg['message_text'][:50]}... (from {sender_name})")
                else:
                    print(f"   ❌ Failed to get messages: {messages_response.text}")
            else:
                print("   ❌ Conversation not found in sidebar")
        else:
            print(f"   ❌ Failed to get conversations: {conversations_response.text}")
    else:
        print(f"   ❌ Failed to send message: {message_response.text}")
    
    # Summary
    print(f"\n=== Flow Test Results ===")
    print(f"✅ Message sent: {message_response.status_code in [200, 201]}")
    print(f"✅ Conversation in sidebar: {target_conversation is not None}")
    print(f"✅ Message history accessible: {messages_response.status_code == 200 if 'messages_response' in locals() else False}")
    
    if message_response.status_code in [200, 201] and target_conversation:
        print("🎉 Complete AEO-to-Principal messaging flow working correctly!")
    else:
        print("⚠️  Some issues with AEO-to-Principal messaging flow")

if __name__ == "__main__":
    test_aeo_principal_conversations()
    test_aeo_principal_messaging_flow() 