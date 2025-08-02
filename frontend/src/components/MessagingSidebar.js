import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  IoNotificationsOutline,
  IoCheckmarkCircleOutline,
  IoEllipsisHorizontalOutline,
  IoRefreshOutline,
  IoSearchOutline,
  IoAddOutline,
  IoTrashOutline,
  IoArchiveOutline,
  IoStarOutline,
  IoHeartOutline
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
                console.warn('Invalid conversation data:', conversation);
                return null;
              }
              
              return (
                <div
                  key={conversation.conversation_id}
                  className={`${styles.conversationItem} ${styles[theme]} ${styles.hoverLift} ${conversation.unread_count > 0 ? styles.newMessage : ''} ${recentlyUpdatedConversations.has(conversation.conversation_id) ? styles.recentlyUpdated : ''}`}
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