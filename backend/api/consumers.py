import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the user from the scope
        self.user = self.scope.get('user')
        
        if self.user is None or self.user.is_anonymous:
            await self.close()
            return
        
        # Get the conversation_id from the URL
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        
        # Join the conversation group
        await self.channel_layer.group_add(
            f"chat_{self.conversation_id}",
            self.channel_name
        )
        
        await self.accept()
        
        # Send a connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat'
        }))

    async def disconnect(self, close_code):
        # Leave the conversation group
        await self.channel_layer.group_discard(
            f"chat_{self.conversation_id}",
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            message = text_data_json['message']
            sender_id = text_data_json['sender_id']
            conversation_id = text_data_json['conversation_id']
            
            # Save the message to database
            saved_message = await self.save_message(message, sender_id, conversation_id)
            
            # Send message to the conversation group
            await self.channel_layer.group_send(
                f"chat_{conversation_id}",
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': sender_id,
                    'sender_name': saved_message.get('sender_name', 'Unknown'),
                    'timestamp': saved_message.get('timestamp', timezone.now().isoformat()),
                    'message_id': saved_message.get('id'),
                    'conversation_id': conversation_id
                }
            )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id'],
            'conversation_id': event['conversation_id']
        }))

    @database_sync_to_async
    def save_message(self, message_text, sender_id, conversation_id):
        try:
            # Import here to avoid Django configuration issues
            from .models import Conversation, Message
            from django.contrib.auth.models import User
            
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Get the sender user
            try:
                sender = User.objects.get(id=sender_id)
            except User.DoesNotExist:
                print(f"Sender user {sender_id} not found")
                return {
                    'id': None,
                    'sender_name': 'Unknown',
                    'timestamp': timezone.now().isoformat()
                }
            
            # Determine the receiver (the other participant in the conversation)
            receiver = None
            if conversation.aeo.id == sender_id:
                receiver = conversation.principal
            elif conversation.principal and conversation.principal.id == sender_id:
                receiver = conversation.aeo
            else:
                # Fallback: use the other user in the conversation
                receiver = conversation.aeo if conversation.aeo.id != sender_id else conversation.principal
            
            if not receiver:
                print(f"Could not determine receiver for conversation {conversation_id}")
                return {
                    'id': None,
                    'sender_name': 'Unknown',
                    'timestamp': timezone.now().isoformat()
                }
            
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                receiver=receiver,
                school_name=conversation.school_name,
                message_text=message_text,
                timestamp=timezone.now()
            )
            
            return {
                'id': message.id,
                'sender_name': sender.get_full_name() or sender.username,
                'timestamp': message.timestamp.isoformat()
            }
        except Exception as e:
            print(f"Error saving message: {e}")
            return {
                'id': None,
                'sender_name': 'Unknown',
                'timestamp': timezone.now().isoformat()
            }


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the user from the scope
        self.user = self.scope.get('user')
        
        if self.user is None or self.user.is_anonymous:
            await self.close()
            return
        
        # Join the user's personal notification group
        await self.channel_layer.group_add(
            f"user_{self.user.id}",
            self.channel_name
        )
        
        await self.accept()
        
        # Send a connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notifications'
        }))

    async def disconnect(self, close_code):
        # Leave the user's notification group
        await self.channel_layer.group_discard(
            f"user_{self.user.id}",
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle any incoming messages from the client
        pass

    async def notification_message(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'notification_type': event.get('notification_type', 'message'),
            'data': event.get('data', {})
        })) 