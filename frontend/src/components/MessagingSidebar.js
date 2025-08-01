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
      setConversations(validConversations);
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
      console.log('Sending message:', {
        school_name: selectedConversation.school_name,
        message: newMessage.trim(),
        receiver_id: selectedConversation.other_user.id,
        conversation_id: selectedConversation.conversation_id
      });
      
      const result = await apiService.sendMessage(
        selectedConversation.school_name,
        newMessage.trim(),
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

      setNewMessage('');
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
      // Send initial message to create conversation
      await apiService.sendMessage(
        userItem.school_name,
        'Hello! I would like to start a conversation.',
        userItem.id
      );

      // Reload conversations to show the new one
      setConversationsLoaded(false);
      await loadConversations();
      
      // Switch to conversations tab
      setActiveTab('conversations');
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
                        className={`${styles.conversationItem} ${styles[theme]} ${styles.hoverLift}`}
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