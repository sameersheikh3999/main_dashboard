# WebSocket Real-Time Messaging Implementation

This document outlines the implementation of real-time messaging using WebSockets in the AEO Dashboard project.

## Overview

The messaging system now supports real-time communication using WebSockets alongside the existing REST API. This provides instant message delivery and live updates without requiring page refreshes.

## Architecture

### Backend (Django + Channels)
- **Django Channels**: Enables WebSocket support in Django
- **Redis**: Message broker for channel layers (supports multi-process scaling)
- **ASGI Server**: Daphne for handling both HTTP and WebSocket protocols
- **Authentication**: JWT token-based authentication for WebSocket connections

### Frontend (React)
- **WebSocket Service**: Manages WebSocket connections and message handling
- **Real-time Updates**: Instant message delivery and conversation updates
- **Fallback Support**: Falls back to REST API if WebSocket is unavailable

## Components

### Backend Components

#### 1. WebSocket Consumers (`backend/api/consumers.py`)
- **ChatConsumer**: Handles real-time messaging for specific conversations
- **NotificationConsumer**: Handles user notifications and updates

#### 2. Routing (`backend/api/routing.py`)
- WebSocket URL patterns for chat and notification endpoints

#### 3. Authentication Middleware (`backend/api/middleware.py`)
- JWT token validation for WebSocket connections
- User authentication and authorization

#### 4. ASGI Configuration (`backend/main_api/asgi.py`)
- Protocol routing for HTTP and WebSocket requests
- Middleware integration

### Frontend Components

#### 1. WebSocket Service (`frontend/src/services/websocket.js`)
- Connection management
- Message handling
- Reconnection logic
- Event system for components

#### 2. Updated Messaging Components
- **MessagingSidebar**: Real-time message updates
- **MessagingModal**: WebSocket integration for sending messages

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
pip install channels==4.0.0 channels-redis==4.1.0 daphne==4.0.0

# Or use the installation script
./install_websocket_deps.sh
```

### 2. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### 3. Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 4. Start the Server

**Development (with auto-reload):**
```bash
python manage.py runserver
```

**Production (ASGI server):**
```bash
daphne main_api.asgi:application -b 0.0.0.0 -p 8000
```

## WebSocket Endpoints

### Chat WebSocket
- **URL**: `ws://localhost:8000/ws/chat/{conversation_id}/?token={jwt_token}`
- **Purpose**: Real-time messaging for specific conversations
- **Authentication**: JWT token required

### Notification WebSocket
- **URL**: `ws://localhost:8000/ws/notifications/?token={jwt_token}`
- **Purpose**: User notifications and system updates
- **Authentication**: JWT token required

## Message Flow

### Sending Messages
1. User types message in frontend
2. Frontend sends message via WebSocket to backend
3. Backend saves message to database
4. Backend broadcasts message to all participants in conversation
5. Frontend receives message and updates UI in real-time

### Receiving Messages
1. Backend receives message via WebSocket
2. Message is saved to database
3. Message is broadcast to conversation group
4. All connected participants receive the message
5. Frontend updates conversation list and message display

## Features

### Real-time Features
- ✅ Instant message delivery
- ✅ Live conversation updates
- ✅ Real-time unread message counts
- ✅ Typing indicators (future enhancement)
- ✅ Online status (future enhancement)

### Fallback Support
- ✅ Automatic fallback to REST API if WebSocket fails
- ✅ Reconnection logic with exponential backoff
- ✅ Graceful degradation

### Security
- ✅ JWT token authentication
- ✅ User authorization checks
- ✅ Secure WebSocket connections

## Configuration

### Backend Settings (`backend/main_api/settings.py`)

```python
# Channel Layers Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# ASGI Application
ASGI_APPLICATION = 'main_api.asgi.application'
```

### Frontend Configuration

The WebSocket service automatically detects the current environment and uses appropriate protocols (ws/wss).

## Development

### Testing WebSocket Connections

1. **Browser Console:**
```javascript
// Check if WebSocket is connected
websocketService.isConnected('chat')
websocketService.isConnected('notification')
```

2. **Backend Logs:**
```bash
# Monitor WebSocket connections
tail -f backend/logs/django.log
```

### Debugging

1. **Frontend Debug:**
- Open browser developer tools
- Check Network tab for WebSocket connections
- Monitor console for connection status

2. **Backend Debug:**
- Check Django logs for WebSocket errors
- Monitor Redis for channel layer activity
- Use Django shell to test consumers

## Production Deployment

### Requirements
- **Redis**: For channel layers and message queuing
- **ASGI Server**: Daphne, Uvicorn, or Hypercorn
- **Load Balancer**: For WebSocket connection distribution
- **SSL/TLS**: For secure WebSocket connections (wss://)

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Django Settings
DJANGO_SETTINGS_MODULE=main_api.settings
```

### Docker Deployment
```dockerfile
# Example Dockerfile with WebSocket support
FROM python:3.11
RUN pip install daphne channels-redis
# ... rest of Dockerfile
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if Redis is running
   - Verify ASGI server is being used
   - Check authentication tokens

2. **Messages Not Delivered**
   - Verify channel layers configuration
   - Check Redis connection
   - Monitor backend logs

3. **Authentication Errors**
   - Ensure JWT tokens are valid
   - Check token expiration
   - Verify middleware configuration

### Performance Optimization

1. **Connection Pooling**
   - Configure Redis connection pooling
   - Use connection limits

2. **Message Batching**
   - Implement message batching for high-volume scenarios
   - Use Redis pub/sub efficiently

3. **Scaling**
   - Use multiple ASGI workers
   - Implement Redis clustering for high availability

## Future Enhancements

- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message read receipts
- [ ] File/image sharing
- [ ] Message encryption
- [ ] Push notifications
- [ ] Message search
- [ ] Conversation archiving

## Security Considerations

- ✅ JWT token validation
- ✅ User authorization
- ✅ Rate limiting (to be implemented)
- ✅ Message sanitization
- ✅ CORS configuration
- ✅ SSL/TLS encryption

## Monitoring

- WebSocket connection counts
- Message delivery rates
- Error rates and types
- Performance metrics
- User engagement metrics

---

This implementation provides a robust foundation for real-time messaging while maintaining backward compatibility with the existing REST API system. 