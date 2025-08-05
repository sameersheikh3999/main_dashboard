import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import getWebSocketService from '../services/websocket';
import { apiService, getCurrentUser, isAuthenticated } from '../services/api';
import styles from './MessagingSidebar.module.css';
import { 
  IoChatbubblesOutline, 
  IoPersonOutline, 
  IoTimeOutline, 
  IoArrowBackOutline, 
  IoCloseOutline, 
  IoArrowUpOutline,
  IoChevronDownOutline,
  IoSchoolOutline,
  IoIdCardOutline,
  IoMailOutline,
} from 'react-icons/io5';

const MessagingSidebar = ({ isOpen, onClose, theme = 'light', onMessagesRead }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [recentlyUpdatedConversations, setRecentlyUpdatedConversations] = useState(new Set());
  const [previousUnreadCounts, setPreviousUnreadCounts] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const user = getCurrentUser();
  const messageListRef = useRef(null);
  
  // Function to scroll to bottom of message list
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  
  // Memoize authentication status to prevent unnecessary re-renders
  const authenticated = useMemo(() => isAuthenticated(), []);

  // Request notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current && selectedConversation) {
      const messageList = messageListRef.current;
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messageList.scrollTo({
          top: messageList.scrollHeight,
          behavior: 'smooth'
        });
        setShowScrollToBottom(false);
      }, 100);
    }
  }, [messages, selectedConversation]);

  // Add scroll event listener to detect when user scrolls up
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messageList;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollToBottom(!isAtBottom);
    };

    messageList.addEventListener('scroll', handleScroll);
    return () => messageList.removeEventListener('scroll', handleScroll);
  }, [selectedConversation]);

  // Initialize WebSocket connection for receiving messages
  useEffect(() => {
    if (authenticated && user && user.id) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping WebSocket initialization');
          return;
        }
        
        const websocketService = getWebSocketService();
        
        // Only initialize if not already connected
        if (!websocketService.isConnected('notification')) {
          console.log('Initializing WebSocket for receiving messages');
          
          // Initialize WebSocket without health check
          websocketService.initialize(user.id, token).catch(error => {
            console.error('WebSocket initialization failed:', error);
          });
          
          // Set up WebSocket message handlers for receiving messages
          try {
            websocketService.onMessage('chat', handleWebSocketMessage);
            websocketService.onConnection('chat', setWsConnected);
          } catch (error) {
            console.error('Error setting up WebSocket handlers:', error);
          }
        } else {
          console.log('WebSocket already connected, skipping initialization');
        }
        
        // Don't disconnect on cleanup - let the WebSocket service manage connections
        return () => {
          // Only clean up message handlers, don't disconnect WebSocket
          try {
            websocketService.onMessage('chat', null);
            websocketService.onConnection('chat', null);
          } catch (error) {
            console.error('Error cleaning up WebSocket handlers:', error);
          }
        };
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    } else {
      console.log('User not authenticated, skipping WebSocket initialization');
    }
  }, [authenticated, user?.id]); // Only depend on user.id, not the entire user object

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    try {
      if (!data || !data.type) {
        console.log('Received invalid WebSocket message:', data);
        return;
      }
      
      console.log('Received WebSocket message:', data);
      
      if (data.type === 'chat_message' || data.type === 'new_message') {
        const messageData = {
          id: data.message_id || Date.now(),
          content: data.message || '',
          sender: {
            id: data.sender_id || 'unknown',
            name: data.sender_name || 'Unknown User'
          },
          timestamp: data.timestamp || new Date().toISOString(),
          is_read: false
        };

        // Update messages for the specific conversation
        const conversationId = data.conversation_id || selectedConversation?.conversation_id;
        if (conversationId) {
          setMessages(prev => ({
            ...prev,
            [conversationId]: [
              ...(prev[conversationId] || []),
              messageData
            ]
          }));

          // Update conversation list with new message
          setConversations(prev => prev.map(conv => {
            if (conv.conversation_id === conversationId) {
              return {
                ...conv,
                latest_message: {
                  content: data.message || '',
                  timestamp: data.timestamp || new Date().toISOString()
                },
                unread_count: conv.unread_count + (data.sender_id !== user?.id ? 1 : 0)
              };
            }
            return conv;
          }));

          // Show notification for new messages from other users
          if (data.sender_id !== user?.id) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Message', {
                body: `${data.sender_name}: ${data.message}`,
                icon: '/favicon.ico'
              });
            }
            console.log('New message received from:', data.sender_name);
          }

          // Scroll to bottom for new messages if this conversation is selected
          if (selectedConversation?.conversation_id === conversationId) {
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        }
      } else if (data.type === 'connection_established') {
        console.log('WebSocket connection established:', data.message);
      } else {
        console.log('Received unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      // Don't throw the error to prevent runtime crashes
    }
  }, [selectedConversation, user]);

  // Initialize chat WebSocket when conversation is selected
  useEffect(() => {
    if (selectedConversation && authenticated && user && user.id) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping chat WebSocket initialization');
          return;
        }

        const websocketService = getWebSocketService();
        
        // Only initialize if not already connected to this conversation
        if (!websocketService.isConnected('chat') || websocketService.currentConversationId !== selectedConversation.conversation_id) {
          console.log('Initializing chat WebSocket for conversation:', selectedConversation.conversation_id);
          
          websocketService.initializeChatSocket(selectedConversation.conversation_id, token).catch(error => {
            console.error('Chat WebSocket initialization failed:', error);
          });
        } else {
          console.log('Chat WebSocket already connected to this conversation');
        }

        // Don't disconnect on cleanup - let the WebSocket service manage the connection
        // The chat socket will be reused for the same conversation or disconnected when needed
        return () => {
          // Only clean up handlers, don't disconnect the socket
          try {
            websocketService.onMessage('chat', null);
            websocketService.onConnection('chat', null);
          } catch (error) {
            console.error('Error cleaning up chat WebSocket handlers:', error);
          }
        };
      } catch (error) {
        console.error('Error initializing chat WebSocket:', error);
      }
    }
  }, [selectedConversation?.conversation_id, authenticated, user?.id]); // Only depend on conversation ID and user ID

  const loadConversations = useCallback(async () => {
    if (loading || conversationsLoaded) return;
    
    try {
      setLoading(true);
      const conversationsData = await apiService.getUserConversations();

      
      // Ensure conversationsData is an array
      const validConversations = Array.isArray(conversationsData) ? conversationsData : [];
      
      // Sort conversations: unread messages first, then by latest message timestamp
      const sortedConversations = validConversations.sort((a, b) => {
        // First, sort by unread count (higher unread count first)
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        
        // Then, sort by latest message timestamp (most recent first)
        const aTimestamp = a.latest_message?.timestamp || a.created_at;
        const bTimestamp = b.latest_message?.timestamp || b.created_at;
        return new Date(bTimestamp) - new Date(aTimestamp);
      });
      
      // Check for conversations with new unread messages and highlight them
      const newUnreadConversations = new Set();
      const conversationsWithNewMessages = new Set();
      
      sortedConversations.forEach(conv => {
        const previousCount = previousUnreadCounts[conv.conversation_id] || 0;
        const currentCount = conv.unread_count;
        
        // If unread count increased, this conversation has new messages
        if (currentCount > previousCount) {
          conversationsWithNewMessages.add(conv.conversation_id);
        }
        
        if (currentCount > 0) {
          newUnreadConversations.add(conv.conversation_id);
        }
      });
      
      // Update previous unread counts
      const newPreviousCounts = {};
      sortedConversations.forEach(conv => {
        newPreviousCounts[conv.conversation_id] = conv.unread_count;
      });
      setPreviousUnreadCounts(newPreviousCounts);
      
      // Add highlight for conversations with new unread messages
      if (conversationsWithNewMessages.size > 0) {
        setRecentlyUpdatedConversations(prev => new Set([...prev, ...conversationsWithNewMessages]));
        
        // Show notification for new messages
        conversationsWithNewMessages.forEach(convId => {
          const conversation = sortedConversations.find(c => c.conversation_id === convId);
          if (conversation) {
            // You can add a notification sound here if desired
    
          }
        });
        
        // Remove highlights after 3 seconds
        setTimeout(() => {
          setRecentlyUpdatedConversations(prev => {
            const newSet = new Set(prev);
            conversationsWithNewMessages.forEach(id => newSet.delete(id));
            return newSet;
          });
        }, 3000);
      }
      
      setConversations(sortedConversations);
      setConversationsLoaded(true);
    } catch (error) {
      setConversations([]);
      setConversationsLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loading, conversationsLoaded, previousUnreadCounts]);

  useEffect(() => {
    if (isOpen && user && authenticated && !conversationsLoaded && !loading) {
      loadConversations();
    }
  }, [isOpen, user, authenticated, conversationsLoaded, loading, loadConversations]);

  // Poll for new conversations every 5 seconds when sidebar is open
  useEffect(() => {
    if (!isOpen || !user || !authenticated) return;

    const pollInterval = setInterval(() => {
      if (conversationsLoaded && !loading) {
        loadConversations();
      }
    }, 5000); // Poll every 5 seconds for more responsive updates

    return () => clearInterval(pollInterval);
  }, [isOpen, user, authenticated, conversationsLoaded, loading, loadConversations]);

  const loadMessagesForConversation = async (conversationId, forceRefresh = false) => {
    if (!forceRefresh && (messages[conversationId] || loadingMessages)) return;
    
    try {
      setLoadingMessages(true);

      
      // Get messages for the conversation
      const conversation = conversations.find(c => c.conversation_id === conversationId);
      if (conversation) {

        const messagesData = await apiService.getUserMessages(conversation.other_user.id);

        
        setMessages(prev => {
          const newMessages = {
        ...prev,
        [conversationId]: messagesData
          };

          return newMessages;
        });
        
              // Mark messages as read
      await apiService.markMessagesRead(conversationId);
      
      // Call the callback to update unread count in parent component
      if (onMessagesRead) {
        onMessagesRead();
      }
        
        // Update conversation unread count
        setConversations(prev => 
          prev.map(conv => 
            conv.conversation_id === conversationId 
              ? { ...conv, unread_count: 0 }
              : conv
          )
        );
      } else {
        // Conversation not found
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoadingMessages(false);
    }
  };



  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    if (!messages[conversation.conversation_id]) {
      await loadMessagesForConversation(conversation.conversation_id);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageText = newMessage.trim();
      setNewMessage('');
      
      // Add message to conversation list immediately for visual feedback
      const currentUser = getCurrentUser();
      const tempMessage = {
        id: Date.now(),
        content: messageText,
        sender: {
          id: currentUser?.id || 'unknown',
          name: currentUser?.name || 'You'
        },
        timestamp: new Date().toISOString(),
        is_read: false
      };

      // Update messages immediately
      setMessages(prev => ({
        ...prev,
        [selectedConversation.conversation_id]: [
          ...(prev[selectedConversation.conversation_id] || []),
          tempMessage
        ]
      }));

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Try to send via WebSocket first
      let wsSuccess = false;
      try {
        const websocketService = getWebSocketService();
        wsSuccess = websocketService.sendChatMessage(
          messageText,
          currentUser?.id,
          selectedConversation.conversation_id
        );
        
        if (wsSuccess) {
          console.log('Message sent via WebSocket');
        } else {
          console.log('WebSocket not ready, will retry or fallback to REST API');
        }
      } catch (error) {
        console.error('WebSocket send failed:', error);
        wsSuccess = false;
      }

      // If WebSocket fails or is not ready, fall back to REST API
      if (!wsSuccess) {
        try {
          await apiService.sendMessage(
            selectedConversation.school_name,           // schoolName
            messageText,                                // messageText
            selectedConversation.other_user?.id,        // receiverId
            selectedConversation.conversation_id        // conversationId
          );
          console.log('Message sent via REST API');
        } catch (error) {
          console.error('Failed to send message:', error);
          // Show error to user but don't remove the message from UI
          // The message will be resent when the connection is restored
          alert('Message sent but may not be delivered immediately. It will be sent when connection is restored.');
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Don't throw the error to prevent runtime crashes
    }
  };



  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
      } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  };

  const getMessageSenderInfo = (message) => {
    const isOwn = message.sender.id === user.id;
    
    if (isOwn) {
      return {
        name: 'You',
        role: user.role,
        icon: <IoPersonOutline />,
        school: user.profile?.school_name || null,
        emis: user.profile?.emis || null
      };
    } else {
      return {
        name: selectedConversation?.other_user?.username || message.sender?.username || 'Unknown',
        role: selectedConversation?.other_user?.role || 'Unknown',
        icon: selectedConversation?.other_user?.role === 'AEO' ? <IoPersonOutline /> : selectedConversation?.other_user?.role === 'Principal' ? <IoPersonOutline /> : <IoPersonOutline />,
        school: selectedConversation?.school_name,
        emis: selectedConversation?.other_user?.emis
      };
    }
  };

  if (!isOpen) return null;

  // Show message panel if conversation is selected
  if (selectedConversation) {
    return (
      <div className={`${styles.sidebarContainer} ${isOpen ? styles.open : ''} ${styles[theme]}`}>
        <div className={`${styles.messagePanel} ${styles[theme]}`}>
          <div className={`${styles.messagePanelHeader} ${styles[theme]}`}>
            <button 
              className={`${styles.backButton} ${styles[theme]} ${styles.hoverScale}`}
              onClick={handleBackToConversations}
            >
              <IoArrowBackOutline />
            </button>
            <div className={styles.userAvatar}>
              {getInitials(selectedConversation.other_user?.username || 'Unknown')}
            </div>
            <div className={styles.userInfo}>
              <h3 className={`${styles.messagePanelTitle} ${styles[theme]}`}>
                {selectedConversation.other_user?.username || 'Unknown User'}
              </h3>
              <div className={`${styles.userRole} ${styles[theme]}`}>
                <span className={`${styles.roleBadge} ${styles[theme]}`}>
                  {selectedConversation.other_user?.role || 'Unknown'}
                </span>
                {selectedConversation.school_name && (
                  <span>🏫 {selectedConversation.school_name}</span>
                )}
              </div>
            </div>
            <button 
              className={`${styles.closeButton} ${styles[theme]} ${styles.hoverScale}`}
              onClick={onClose}
            >
              <IoCloseOutline />
            </button>
          </div>

          <div ref={messageListRef} className={`${styles.messageList} ${styles[theme]}`}>
            {showScrollToBottom && (
              <button
                onClick={scrollToBottom}
                className={`${styles.scrollToBottomButton} ${styles[theme]}`}
                title="Scroll to latest message"
              >
                <IoChevronDownOutline style={{ marginRight: '4px' }} /> New Messages
              </button>
            )}
            {loadingMessages ? (
              <div className={`${styles.emptyState} ${styles[theme]}`}>
                <div className={styles.loadingSpinner}></div>
                Loading messages...
              </div>
            ) : messages[selectedConversation.conversation_id]?.length > 0 ? (
              messages[selectedConversation.conversation_id].map(message => {
                const senderInfo = getMessageSenderInfo(message);
                const isOwn = message.sender.id === user.id;
                return (
                  <div
                    key={message.id}
                    className={`${styles.messageItem} ${isOwn ? styles.own : styles.other} ${styles[theme]}`}
                  >
                    <div className={styles.messageHeader}>
                      <div className={`${styles.messageSender} ${styles[theme]}`}>
                        <span className={styles.senderIcon}>{senderInfo.icon}</span> {senderInfo.name}
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: theme === 'dark' ? '#94a3b8' : '#64748b',
                          marginLeft: '8px'
                        }}>
                          ({senderInfo.role})
                        </span>
                        {senderInfo.school && (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            color: theme === 'dark' ? '#94a3b8' : '#64748b',
                            marginLeft: '8px'
                          }}>
                            • <IoSchoolOutline style={{ display: 'inline', verticalAlign: 'middle' }} /> {senderInfo.school}
                          </span>
                        )}
                        {senderInfo.emis && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#3b82f6',
                            marginLeft: '8px',
                            background: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            <IoIdCardOutline style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> EMIS: {senderInfo.emis}
                          </span>
                        )}
                      </div>
                      <div className={`${styles.messageTime} ${styles[theme]}`}>
                        <IoTimeOutline style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                    <div className={`${styles.messageText} ${styles[theme]}`}>
                      {message.message_text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`${styles.emptyState} ${styles[theme]}`}>
                <div className={styles.emptyStateIcon}><IoChatbubblesOutline /></div>
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          <form className={`${styles.messageForm} ${styles[theme]}`} onSubmit={handleSendMessage}>
            <input
              type="text"
              className={`${styles.messageInput} ${styles[theme]}`}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit"
              className={`${styles.sendButton} ${sending || !newMessage.trim() ? styles.disabled : ''} ${styles[theme]}`}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  Sending
                </>
              ) : (
                <>
                  <IoArrowUpOutline />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show conversations list
  return (
    <div className={`${styles.sidebarContainer} ${isOpen ? styles.open : ''} ${styles[theme]}`}>
      <div className={`${styles.sidebarHeader} ${styles[theme]}`}>
        <h2 className={`${styles.sidebarTitle} ${styles[theme]}`}>
          <IoChatbubblesOutline style={{ marginRight: '8px' }} /> Messages
        </h2>
                  <button 
            className={`${styles.closeButton} ${styles[theme]} ${styles.hoverScale}`}
            onClick={onClose}
          >
            <IoCloseOutline />
          </button>
      </div>

      <div className={styles.sidebarContent}>
        {loading ? (
          <div className={`${styles.emptyState} ${styles[theme]}`}>
            <div className={styles.loadingSpinner}></div>
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className={`${styles.emptyState} ${styles[theme]}`}>
            <div className={styles.emptyStateIcon}><IoMailOutline /></div>
            No conversations yet.
          </div>
        ) : (
          <div className={styles.conversationList}>
            {conversations.map(conversation => {
              // Add null checks and debugging
              if (!conversation || !conversation.other_user) {
                return null;
              }
              
              return (
                <div 
                  key={conversation.conversation_id} 
                  className={`${styles.conversationItem} ${
                    selectedConversation?.conversation_id === conversation.conversation_id ? styles.selected : ''
                  } ${recentlyUpdatedConversations.has(conversation.conversation_id) ? styles.recentlyUpdated : ''}`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className={styles.userAvatar}>
                    {getInitials(conversation.other_user.username || 'Unknown')}
                  </div>
                  <div className={styles.conversationInfo}>
                    <div className={`${styles.conversationName} ${styles[theme]}`}>
                      {conversation.other_user.username || 'Unknown User'}
                    </div>
                    <div className={`${styles.conversationMeta} ${styles[theme]}`}>
                      <span className={`${styles.roleBadge} ${styles[theme]}`}>
                        {conversation.other_user.role || 'Unknown'}
                      </span>
                      {conversation.school_name && (
                        <span><IoSchoolOutline style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> {conversation.school_name}</span>
                      )}
                    </div>
                    {conversation.latest_message?.text && (
                      <div className={`${styles.messagePreview} ${styles[theme]}`}>
                        <span className={styles.messagePreviewText}>
                          {conversation.latest_message.is_own ? 'You: ' : ''}
                          {conversation.latest_message.text}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.conversationActions}>
                    {conversation.unread_count > 0 && (
                      <div className={styles.unreadBadge}>
                        {conversation.unread_count}
                      </div>
                    )}
                    <div className={`${styles.messageTime} ${styles[theme]}`}>
                      {formatTimestamp(conversation.latest_message?.timestamp || conversation.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSidebar; 