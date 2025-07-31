#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import User, UserProfile, Conversation, Message
from django.utils import timezone

def test_message_creation():
    print('Testing message creation...')
    
    # Get two users
    sender = User.objects.first()
    receiver = User.objects.filter(id__gt=sender.id).first()
    
    if not sender or not receiver:
        print('Not enough users for testing')
        return
    
    print(f'Sender: {sender.username}')
    print(f'Receiver: {receiver.username}')
    
    # Create or get conversation
    conv, created = Conversation.objects.get_or_create(
        school_name='Test School',
        aeo=sender,
        principal=receiver,
        defaults={'id': 'test-conv-123'}
    )
    
    print(f'Conversation: {conv.id} (created: {created})')
    
    # Create a test message
    msg = Message.objects.create(
        id='test-msg-123',
        conversation=conv,
        sender=sender,
        receiver=receiver,
        school_name='Test School',
        message_text='Test message from backend'
    )
    
    print(f'Created message: {msg.id}')
    print(f'Message text: {msg.message_text}')
    print(f'Timestamp: {msg.timestamp}')
    
    # Test retrieving messages
    messages = Message.objects.filter(conversation=conv).order_by('timestamp')
    print(f'Total messages in conversation: {messages.count()}')
    
    for msg in messages:
        print(f'- {msg.sender.username} -> {msg.receiver.username}: {msg.message_text}')

if __name__ == '__main__':
    test_message_creation() 