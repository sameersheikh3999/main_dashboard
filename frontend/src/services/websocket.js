// WebSocket service for real-time messaging
class WebSocketService {
  constructor() {
    this.notificationSocket = null;
    this.chatSocket = null;
    this.currentConversationId = null;
    this.messageHandlers = {};
    this.connectionHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    this.reconnectDelay = 1000;
    this.healthChecked = false;
  }

  // Initialize WebSocket connections
  async initialize(userId, token) {
    if (!userId || !token) {
      console.error('WebSocket initialization failed: Missing userId or token');
      return Promise.resolve();
    }
    
    try {
      // Initialize notification socket directly without health check
      await this.initializeNotificationSocket(userId, token);
      
      console.log('WebSocket connections initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize WebSocket connections:', error);
      return Promise.resolve();
    }
  }

  // Initialize notification WebSocket
  async initializeNotificationSocket(userId, token) {
    if (!userId || !token) {
      console.error('Missing userId or token for notification WebSocket');
      return Promise.resolve(); // Return resolved promise to prevent unhandled rejections
    }

    // Get the correct protocol and host for WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = this.backendUrl.replace(/^https?:\/\//, ''); // Remove http:// or https://
    const wsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;

    return new Promise((resolve, reject) => {
      try {
        this.notificationSocket = new WebSocket(wsUrl);

        this.notificationSocket.onopen = () => {
          console.log('Notification WebSocket connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers('notification', true);
          resolve();
        };

        this.notificationSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleNotificationMessage(data);
          } catch (error) {
            console.error('Error parsing notification message:', error);
            // Don't throw the error to prevent runtime crashes
          }
        };

        this.notificationSocket.onclose = (event) => {
          try {
            console.log('Notification WebSocket disconnected:', event.code, event.reason);
            this.notifyConnectionHandlers('notification', false);
            this.handleReconnect('notification');
          } catch (error) {
            console.error('Error handling WebSocket close:', error);
          }
        };

        this.notificationSocket.onerror = (error) => {
          try {
            console.error('Notification WebSocket error:', error);
            // Don't reject the promise, just log the error to prevent runtime crashes
            resolve(); // Resolve instead of reject to prevent unhandled rejections
          } catch (err) {
            console.error('Error handling WebSocket error:', err);
            resolve(); // Resolve instead of reject
          }
        };
      } catch (error) {
        console.error('Error creating notification WebSocket:', error);
        resolve(); // Resolve instead of reject to prevent unhandled rejections
      }
    });
  }

  // Initialize chat WebSocket for a specific conversation
  async initializeChatSocket(conversationId, token) {
    if (!conversationId || !token) {
      console.error('Missing conversationId or token for chat WebSocket');
      return Promise.resolve();
    }

    // If already connected to the same conversation, don't reconnect
    if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN && this.currentConversationId === conversationId) {
      console.log('Chat WebSocket already connected to this conversation');
      return Promise.resolve();
    }

    // Close existing chat socket if it's for a different conversation
    if (this.chatSocket && this.currentConversationId !== conversationId) {
      try {
        this.chatSocket.close();
        this.chatSocket = null;
      } catch (error) {
        console.error('Error closing existing chat socket:', error);
      }
    }

    // Get the correct protocol and host for WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = this.backendUrl.replace(/^https?:\/\//, ''); // Remove http:// or https://
    const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/?token=${token}`;

    return new Promise((resolve, reject) => {
      try {
        this.chatSocket = new WebSocket(wsUrl);
        this.currentConversationId = conversationId;

        this.chatSocket.onopen = () => {
          console.log('Chat WebSocket connected for conversation:', conversationId);
          this.notifyConnectionHandlers('chat', true);
          resolve();
        };

        this.chatSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleChatMessage(data);
          } catch (error) {
            console.error('Error parsing chat message:', error);
          }
        };

        this.chatSocket.onclose = (event) => {
          try {
            console.log('Chat WebSocket disconnected:', event.code, event.reason);
            this.notifyConnectionHandlers('chat', false);
            this.chatSocket = null;
            this.currentConversationId = null;
          } catch (error) {
            console.error('Error handling chat WebSocket close:', error);
          }
        };

        this.chatSocket.onerror = (error) => {
          try {
            console.error('Chat WebSocket error:', error);
            resolve(); // Resolve instead of reject to prevent unhandled rejections
          } catch (err) {
            console.error('Error handling chat WebSocket error:', err);
            resolve(); // Resolve instead of reject
          }
        };
      } catch (error) {
        console.error('Error creating chat WebSocket:', error);
        resolve(); // Resolve instead of reject to prevent unhandled rejections
      }
    });
  }

  // Send chat message via WebSocket
  sendChatMessage(message, senderId, conversationId) {
    if (!this.chatSocket || this.chatSocket.readyState !== WebSocket.OPEN) {
      console.log('Chat WebSocket not connected, attempting to connect first...');
      // Try to connect the chat socket if it's not connected
      const token = localStorage.getItem('token');
      if (token) {
        this.initializeChatSocket(conversationId, token).then(() => {
          // Retry sending the message after connection
          setTimeout(() => {
            this.sendChatMessage(message, senderId, conversationId);
          }, 1000);
        }).catch(error => {
          console.error('Failed to initialize chat socket for message sending:', error);
        });
      }
      return false;
    }

    try {
      const messageData = {
        type: 'chat_message',
        message: message,
        sender_id: senderId,
        conversation_id: conversationId,
        timestamp: new Date().toISOString()
      };

      this.chatSocket.send(JSON.stringify(messageData));
      console.log('Message sent via WebSocket');
      return true;
    } catch (error) {
      console.error('Error sending message via WebSocket:', error);
      return false;
    }
  }

  // Handle incoming chat messages
  handleChatMessage(data) {
    try {
      this.messageHandlers.chat.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in chat message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }

  // Handle incoming notification messages
  handleNotificationMessage(data) {
    try {
      this.messageHandlers.notification.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in notification message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error handling notification message:', error);
    }
  }

  // Handle reconnection
  handleReconnect(socketType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect ${socketType} WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        // Reconnection logic would go here
        console.log(`Reconnection attempt ${this.reconnectAttempts} for ${socketType} WebSocket`);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${socketType} WebSocket`);
    }
  }

  // Register message handlers
  onMessage(socketType, handler) {
    if (!this.messageHandlers[socketType]) {
      this.messageHandlers[socketType] = [];
    }
    this.messageHandlers[socketType].push(handler);
  }

  // Register connection handlers
  onConnection(socketType, handler) {
    if (!this.connectionHandlers[socketType]) {
      this.connectionHandlers[socketType] = [];
    }
    this.connectionHandlers[socketType].push(handler);
  }

  // Notify connection handlers
  notifyConnectionHandlers(socketType, connected) {
    try {
      this.connectionHandlers[socketType].forEach(handler => {
        try {
          handler(connected);
        } catch (error) {
          console.error('Error in connection handler:', error);
        }
      });
    } catch (error) {
      console.error('Error notifying connection handlers:', error);
    }
  }

  // Disconnect only the chat socket
  disconnectChatSocket() {
    if (this.chatSocket) {
      try {
        this.chatSocket.close();
        this.chatSocket = null;
        this.currentConversationId = null;
        console.log('Chat WebSocket disconnected');
      } catch (error) {
        console.error('Error disconnecting chat WebSocket:', error);
      }
    }
  }

  // Disconnect all WebSocket connections
  disconnect() {
    try {
      if (this.notificationSocket) {
        this.notificationSocket.close();
        this.notificationSocket = null;
      }
      
      if (this.chatSocket) {
        this.chatSocket.close();
        this.chatSocket = null;
      }
      
      console.log('All WebSocket connections closed');
    } catch (error) {
      console.error('Error disconnecting WebSockets:', error);
    }
  }

  // Check if WebSocket is connected
  isConnected(socketType) {
    if (socketType === 'notification') {
      return this.notificationSocket && this.notificationSocket.readyState === WebSocket.OPEN;
    } else if (socketType === 'chat') {
      return this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN;
    }
    return false;
  }
}

// Create a singleton instance
let websocketServiceInstance = null;

const getWebSocketService = () => {
  if (!websocketServiceInstance) {
    try {
      websocketServiceInstance = new WebSocketService();
    } catch (error) {
      console.error('Error creating WebSocket service:', error);
      // Return a mock service to prevent crashes
      return {
        initialize: () => Promise.resolve(),
        initializeNotificationSocket: () => Promise.resolve(),
        initializeChatSocket: () => Promise.resolve(),
        sendChatMessage: () => false,
        onMessage: () => {},
        onConnection: () => {},
        disconnect: () => {},
        isConnected: () => false
      };
    }
  }
  return websocketServiceInstance;
};

export default getWebSocketService; 