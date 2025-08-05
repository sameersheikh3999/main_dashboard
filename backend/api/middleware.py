from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from the query string
        query_string = scope.get('query_string', b'').decode()
        token = None
        
        # Parse query string to get token
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if token:
            try:
                # Verify the token and get the user
                user = await self.get_user_from_token(token)
                scope['user'] = user
            except Exception as e:
                print(f"WebSocket authentication error: {e}")
                scope['user'] = None
        else:
            scope['user'] = None
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Import here to avoid Django configuration issues
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            from django.contrib.auth.models import AnonymousUser
            
            User = get_user_model()
            
            # Decode the token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except Exception as e:
            print(f"Token validation error: {e}")
            return None 