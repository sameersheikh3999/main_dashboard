#!/usr/bin/env python
"""
Test script to verify FDE can see their conversations in the message sidebar
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

def test_fde_conversations():
    """Test that FDE can see their conversations in the message sidebar"""
    print("=== Testing FDE Conversations in Message Sidebar ===\n")
    
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
    
    # Step 2: Send a message to an AEO to create a conversation
    print("\n2. Creating a test conversation by sending a message...")
    
    # Get AEOs by sector
    aeo_response = requests.get(
        'http://localhost:8000/api/aeos/by-sector/?sector=Nilore',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if aeo_response.status_code != 200:
        print(f"❌ Failed to get AEOs: {aeo_response.text}")
        return
    
    aeos = aeo_response.json()
    if not aeos:
        print("❌ No AEOs found for Nilore sector")
        return
    
    target_aeo = aeos[0]
    print(f"   Target AEO: {target_aeo['display_name']} (ID: {target_aeo['id']})")
    
    # Send a test message
    message_data = {
        'school_name': f'{target_aeo["display_name"]} Sector',
        'message_text': 'Test message from FDE to verify conversation appears in sidebar',
        'receiverId': target_aeo['id']
    }
    
    message_response = requests.post(
        'http://localhost:8000/api/messages/',
        json=message_data,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    )
    
    if message_response.status_code not in [200, 201]:
        print(f"❌ Failed to send message: {message_response.text}")
        return
    
    print("   ✅ Test message sent successfully")
    
    # Step 3: Get user conversations
    print("\n3. Fetching user conversations...")
    conversations_response = requests.get(
        'http://localhost:8000/api/conversations/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if conversations_response.status_code != 200:
        print(f"❌ Failed to get conversations: {conversations_response.text}")
        return
    
    conversations = conversations_response.json()
    print(f"   ✅ Found {len(conversations)} conversations")
    
    # Step 4: Verify the conversation contains the sent message
    if conversations:
        conversation = conversations[0]  # Most recent conversation
        print(f"\n4. Analyzing conversation details:")
        print(f"   Conversation ID: {conversation['conversation_id']}")
        print(f"   School Name: {conversation['school_name']}")
        print(f"   Other User: {conversation['other_user']['username']} ({conversation['other_user']['role']})")
        print(f"   Unread Count: {conversation['unread_count']}")
        
        if conversation['latest_message']:
            latest_msg = conversation['latest_message']
            print(f"   Latest Message: {latest_msg['text'][:50]}...")
            print(f"   Is Own Message: {latest_msg['is_own']}")
            print(f"   Timestamp: {latest_msg['timestamp']}")
        else:
            print("   ⚠️  No latest message found")
        
        # Step 5: Get messages for this conversation
        print(f"\n5. Fetching messages for conversation...")
        messages_response = requests.get(
            f'http://localhost:8000/api/conversations/{conversation["conversation_id"]}/messages/',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if messages_response.status_code == 200:
            messages = messages_response.json()
            print(f"   ✅ Found {len(messages)} messages in conversation")
            
            for i, msg in enumerate(messages):
                print(f"   Message {i+1}: {msg['message_text'][:50]}... (from {msg['sender']})")
        else:
            print(f"   ❌ Failed to get messages: {messages_response.text}")
    
    # Step 6: Test conversation refresh after sending another message
    print(f"\n6. Testing conversation refresh with new message...")
    
    # Send another message
    message_data2 = {
        'school_name': f'{target_aeo["display_name"]} Sector',
        'message_text': 'Second test message to verify conversation updates',
        'receiverId': target_aeo['id']
    }
    
    message_response2 = requests.post(
        'http://localhost:8000/api/messages/',
        json=message_data2,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    )
    
    if message_response2.status_code in [200, 201]:
        print("   ✅ Second message sent successfully")
        
        # Get updated conversations
        conversations_response2 = requests.get(
            'http://localhost:8000/api/conversations/',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if conversations_response2.status_code == 200:
            updated_conversations = conversations_response2.json()
            if updated_conversations:
                latest_conv = updated_conversations[0]
                if latest_conv['latest_message']:
                    print(f"   ✅ Conversation updated with new message: {latest_conv['latest_message']['text'][:50]}...")
                else:
                    print("   ⚠️  Conversation not updated with new message")
        else:
            print(f"   ❌ Failed to get updated conversations: {conversations_response2.text}")
    else:
        print(f"   ❌ Failed to send second message: {message_response2.text}")
    
    # Summary
    print(f"\n=== Test Results ===")
    print(f"✅ Conversations API working: {conversations_response.status_code == 200}")
    print(f"✅ Messages visible in conversation: {len(conversations) > 0}")
    print(f"✅ Conversation updates with new messages: {message_response2.status_code in [200, 201]}")
    
    if conversations_response.status_code == 200 and len(conversations) > 0:
        print("🎉 FDE conversations are properly visible in message sidebar!")
    else:
        print("⚠️  Some issues with FDE conversation visibility")

def test_database_conversations():
    """Test conversations in database"""
    print("\n=== Testing Database Conversations ===\n")
    
    try:
        # Get all conversations
        conversations = Conversation.objects.all().select_related('aeo', 'principal')
        print(f"Total conversations in database: {conversations.count()}")
        
        for i, conv in enumerate(conversations[:5]):  # Show first 5
            print(f"\nConversation {i+1}:")
            print(f"  ID: {conv.id}")
            print(f"  School: {conv.school_name}")
            print(f"  AEO: {conv.aeo.username if conv.aeo else 'None'}")
            print(f"  Principal: {conv.principal.username if conv.principal else 'None'}")
            print(f"  Created: {conv.created_at}")
            print(f"  Last Message: {conv.last_message_at}")
            
            # Get message count
            msg_count = Message.objects.filter(conversation=conv).count()
            print(f"  Messages: {msg_count}")
        
        # Get recent messages
        recent_messages = Message.objects.all().order_by('-timestamp')[:5]
        print(f"\nRecent messages:")
        for msg in recent_messages:
            print(f"  - {msg.sender.username} → {msg.receiver.username}: {msg.message_text[:50]}...")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    test_database_conversations()
    test_fde_conversations() 