import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiService, getCurrentUser, isAuthenticated } from '../services/api';
import styles from './MessagingSidebar.module.css';

const MessagingSidebar = ({ isOpen, onClose, theme = 'light', onMessagesRead }) => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [recentlyUpdatedConversations, setRecentlyUpdatedConversations] = useState(new Set());
  const [previousUnreadCounts, setPreviousUnreadCounts] = useState({});
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
  const authenticated = useMemo(() => isAuthenticated(), [user?.id]);

  useEffect(() => {
    if (isOpen && user && authenticated && !conversationsLoaded && !loading) {
      loadConversations();
    }
  }, [isOpen, user?.id, authenticated, conversationsLoaded, loading]);

  // Poll for new conversations every 5 seconds when sidebar is open
  useEffect(() => {
    if (!isOpen || !user || !authenticated) return;

    const pollInterval = setInterval(() => {
      if (conversationsLoaded && !loading) {
        loadConversations();
      }
    }, 5000); // Poll every 5 seconds for more responsive updates

    return () => clearInterval(pollInterval);
  }, [isOpen, user?.id, authenticated, conversationsLoaded, loading]);

  useEffect(() => {
    if (isOpen && user && authenticated && activeTab === 'new' && !usersLoaded) {
      loadAvailableUsers();
    }
  }, [isOpen, user?.id, activeTab, usersLoaded, authenticated]);

  // Debug effect to log message changes
  useEffect(() => {
    if (selectedConversation) {
      console.log('Messages state changed for conversation:', selectedConversation.conversation_id);
      console.log('Current messages:', messages[selectedConversation.conversation_id]);
    }
  }, [messages, selectedConversation]);

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

  const loadConversations = async () => {
    if (loading || conversationsLoaded) return;
    
    try {
      setLoading(true);
      const conversationsData = await apiService.getUserConversations();
      console.log('Conversations data:', conversationsData); // Debug log
      
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
            console.log(`New message from ${conversation.other_user.username}`);
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
      console.error('Error loading conversations:', error);
      setConversations([]);
      setConversationsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForConversation = async (conversationId, forceRefresh = false) => {
    if (!forceRefresh && (messages[conversationId] || loadingMessages)) return;
    
    try {
      setLoadingMessages(true);
      console.log('Loading messages for conversation:', conversationId, 'forceRefresh:', forceRefresh);
      
      // Get messages for the conversation
      const conversation = conversations.find(c => c.conversation_id === conversationId);
      if (conversation) {
        console.log('Found conversation:', conversation);
        const messagesData = await apiService.getUserMessages(conversation.other_user.id);
        console.log('Received messages data:', messagesData);
        
        setMessages(prev => {
          const newMessages = {
        ...prev,
        [conversationId]: messagesData
          };
          console.log('Updated messages state:', newMessages);
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
        console.log('Conversation not found for ID:', conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (usersLoaded || activeTab !== 'new') return;
    
    try {
      let users = [];
      
      if (user.role === 'FDE') {
        // FDE can message AEOs
        const aeos = await apiService.getAllAEOs();
        users = aeos.map(aeo => ({
          id: aeo.id,
          name: aeo.username,
          role: 'AEO',
          school_name: aeo.school_name || 'Unknown School',
          emis: aeo.emis || null
        }));
      } else if (user.role === 'AEO') {
        // AEO can message Principals and FDEs
        const principals = await apiService.getAllPrincipals();
        const fdes = await apiService.getAllFDEs?.() || [];
        
        const principalUsers = principals.map(principal => ({
            id: principal.id,
            name: principal.display_name || principal.username,
            role: 'Principal',
          school_name: principal.school_name,
          emis: principal.emis || null
        }));
        
        const fdeUsers = fdes.map(fde => ({
            id: fde.id,
            name: fde.username,
            role: 'FDE',
          school_name: fde.school_name || 'Unknown School',
          emis: fde.emis || null
        }));
        
        users = [...principalUsers, ...fdeUsers];
      } else if (user.role === 'Principal') {
        // Principal can message AEOs
        const aeos = await apiService.getAllAEOs();
        users = aeos.map(aeo => ({
          id: aeo.id,
          name: aeo.username,
          role: 'AEO',
          school_name: aeo.school_name || 'Unknown School',
          emis: aeo.emis || null
        }));
      }
      
      setAvailableUsers(users);
      setUsersLoaded(true);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    if (!messages[conversation.conversation_id]) {
      await loadMessagesForConversation(conversation.conversation_id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const messageText = newMessage.trim();
      
      console.log('Sending message:', {
        school_name: selectedConversation.school_name,
        message: messageText,
        receiver_id: selectedConversation.other_user.id,
        conversation_id: selectedConversation.conversation_id
      });
      
      // Immediately update the conversation list to move this conversation to the top
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(conv => {
          if (conv.conversation_id === selectedConversation.conversation_id) {
            return {
              ...conv,
              latest_message: {
                text: messageText,
                timestamp: new Date().toISOString(),
                sender_id: user.id,
                is_own: true,
              },
              last_message_at: new Date().toISOString(),
            };
          }
          return conv;
        });
        
        // Sort conversations: unread messages first, then by latest message timestamp
        return updatedConversations.sort((a, b) => {
          // First, sort by unread count (higher unread count first)
          if (a.unread_count !== b.unread_count) {
            return b.unread_count - a.unread_count;
          }
          
          // Then, sort by latest message timestamp (most recent first)
          const aTimestamp = a.latest_message?.timestamp || a.created_at;
          const bTimestamp = b.latest_message?.timestamp || b.created_at;
          return new Date(bTimestamp) - new Date(aTimestamp);
        });
      });
      
      // Add this conversation to recently updated set for visual feedback
      setRecentlyUpdatedConversations(prev => new Set([...prev, selectedConversation.conversation_id]));
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        setRecentlyUpdatedConversations(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedConversation.conversation_id);
          return newSet;
        });
      }, 2000);
      
      // Clear the input immediately for better UX
      setNewMessage('');
      
      const result = await apiService.sendMessage(
        selectedConversation.school_name,
        messageText,
        selectedConversation.other_user.id,
        selectedConversation.conversation_id
      );
      
      console.log('Message sent successfully:', result);

      // Add a small delay to ensure the backend has processed the message
      console.log('Waiting 500ms for backend processing...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh messages for this conversation (force refresh to get new message)
      console.log('Refreshing messages...');
      await loadMessagesForConversation(selectedConversation.conversation_id, true);
      
      // Also refresh conversations list to update the latest message preview
      console.log('Refreshing conversations...');
      await loadConversations();

      console.log('Message handling completed');
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (userItem) => {
    try {
      const initialMessage = 'Hello! I would like to start a conversation.';
      
      // Immediately add the new conversation to the list for instant feedback
      const newConversation = {
        conversation_id: `temp-${Date.now()}`, // Temporary ID
        school_name: userItem.school_name,
        other_user: {
          id: userItem.id,
          username: userItem.name,
          role: userItem.role,
          school_name: userItem.school_name,
          emis: userItem.emis,
        },
        latest_message: {
          text: initialMessage,
          timestamp: new Date().toISOString(),
          sender_id: user.id,
          is_own: true,
        },
        unread_count: 0,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };
      
      setConversations(prevConversations => {
        const updatedConversations = [newConversation, ...prevConversations];
        return updatedConversations;
      });
      
      // Add to recently updated set for visual feedback
      setRecentlyUpdatedConversations(prev => new Set([...prev, newConversation.conversation_id]));
      
      // Switch to conversations tab immediately
      setActiveTab('conversations');
      
      // Send initial message to create conversation
      await apiService.sendMessage(
        userItem.school_name,
        initialMessage,
        userItem.id
      );

      // Reload conversations to get the real conversation data
      setConversationsLoaded(false);
      await loadConversations();
      
      // Remove the temporary highlight
      setTimeout(() => {
        setRecentlyUpdatedConversations(prev => {
          const newSet = new Set(prev);
          newSet.delete(newConversation.conversation_id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
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
        icon: '👤',
        school: user.profile?.school_name || null,
        emis: user.profile?.emis || null
      };
    } else {
      return {
        name: selectedConversation?.other_user?.username || message.sender?.username || 'Unknown',
        role: selectedConversation?.other_user?.role || 'Unknown',
        icon: selectedConversation?.other_user?.role === 'AEO' ? '👨‍🏫' : selectedConversation?.other_user?.role === 'Principal' ? '👨‍🏫' : '👨‍💼',
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
              ←
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
              ×
            </button>
          </div>

          <div ref={messageListRef} className={`${styles.messageList} ${styles[theme]}`}>
            {showScrollToBottom && (
              <button
                onClick={scrollToBottom}
                className={`${styles.scrollToBottomButton} ${styles[theme]}`}
                title="Scroll to latest message"
              >
                ↓ New Messages
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
                        {senderInfo.icon} {senderInfo.name}
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
                            • 🏫 {senderInfo.school}
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
                            EMIS: {senderInfo.emis}
                          </span>
                        )}
                      </div>
                      <div className={`${styles.messageTime} ${styles[theme]}`}>
                        🕐 {formatTimestamp(message.timestamp)}
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
                <div className={styles.emptyStateIcon}>💭</div>
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
                  📤 Send
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
          💬 Messages
        </h2>
        <button 
          className={`${styles.closeButton} ${styles[theme]} ${styles.hoverScale}`}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className={styles.sidebarContent}>
        <div className={`${styles.tabsContainer} ${styles[theme]}`}>
          <button 
            className={`${styles.tab} ${activeTab === 'conversations' ? styles.active : ''} ${styles[theme]}`}
            onClick={() => setActiveTab('conversations')}
          >
            💬 Conversations
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'new' ? styles.active : ''} ${styles[theme]}`}
            onClick={() => setActiveTab('new')}
          >
            ✨ New Message
          </button>
        </div>

        <div className={`${styles.tabContent} ${styles[theme]}`}>
          {activeTab === 'conversations' && (
            <>
              {loading ? (
                <div className={`${styles.emptyState} ${styles[theme]}`}>
                  <div className={styles.loadingSpinner}></div>
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className={`${styles.emptyState} ${styles[theme]}`}>
                  <div className={styles.emptyStateIcon}>💬</div>
                  No conversations yet. Start a new conversation to begin messaging.
                  <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                    Switch to "New Message" tab to start a conversation.
                  </div>
                </div>
              ) : (
                <div className={styles.conversationList}>
                  {conversations.map(conversation => {
                    // Add null checks and debugging
                    if (!conversation || !conversation.other_user) {
                      console.warn('Invalid conversation data:', conversation);
                      return null;
                    }
                    
                    return (
                      <div
                        key={conversation.conversation_id}
                        className={`${styles.conversationItem} ${styles[theme]} ${styles.hoverLift} ${conversation.unread_count > 0 ? styles.newMessage : ''} ${recentlyUpdatedConversations.has(conversation.conversation_id) ? styles.recentlyUpdated : ''}`}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <div className={styles.conversationHeader}>
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
                                <span>🏫 {conversation.school_name}</span>
                              )}
                            </div>
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
                        {conversation.latest_message?.text && (
                          <div className={`${styles.messagePreview} ${styles[theme]}`}>
                            <span className={styles.messagePreviewText}>
                              {conversation.latest_message.is_own ? 'You: ' : ''}
                              {conversation.latest_message.text}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'new' && (
            <>
              <div className={styles.userList}>
                {availableUsers.map(userItem => (
                  <div
                    key={userItem.id}
                    className={`${styles.userItem} ${styles[theme]} ${styles.hoverLift}`}
                    onClick={() => handleStartConversation(userItem)}
                  >
                    <div className={styles.userHeader}>
                      <div className={styles.userAvatar}>
                        {getInitials(userItem.name)}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={`${styles.userName} ${styles[theme]}`}>
                          {userItem.role === 'AEO' ? '👨‍🏫' : userItem.role === 'Principal' ? '👨‍🏫' : '👨‍💼'} {userItem.name}
                        </div>
                        <div className={`${styles.userRole} ${styles[theme]}`}>
                          <span className={`${styles.roleBadge} ${styles[theme]}`}>{userItem.role}</span>
                          {userItem.school_name && (
                            <span>🏫 {userItem.school_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {userItem.emis && (
                      <div className={`${styles.emisNumber} ${styles[theme]}`}>
                        EMIS: {userItem.emis}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {availableUsers.length === 0 && (
                <div className={`${styles.emptyState} ${styles[theme]}`}>
                  <div className={styles.emptyStateIcon}>👥</div>
                  No users available to message.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSidebar; 