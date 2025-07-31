import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { apiService, getCurrentUser, isAuthenticated } from '../services/api';

const SidebarContainer = styled.div`
  position: fixed;
  right: ${props => props.isOpen ? '0' : '-400px'};
  top: 0;
  width: 400px;
  height: 100vh;
  background: ${props => props.theme === 'dark' ? '#1e293b' : '#ffffff'};
  border-left: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  box-shadow: ${props => props.isOpen ? '-4px 0 20px rgba(0,0,0,0.15)' : 'none'};
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? '#475569' : '#f1f5f9'};
    color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 16px;
  background: ${props => props.active ? (props.theme === 'dark' ? '#475569' : '#f1f5f9') : 'transparent'};
  border: none;
  color: ${props => props.active ? (props.theme === 'dark' ? '#e2e8f0' : '#1e293b') : (props.theme === 'dark' ? '#94a3b8' : '#64748b')};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  
  &:hover {
    background: ${props => props.active ? (props.theme === 'dark' ? '#475569' : '#f1f5f9') : (props.theme === 'dark' ? '#334155' : '#f8fafc')};
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ConversationItem = styled.div`
  padding: 16px;
  background: ${props => props.active ? (props.theme === 'dark' ? '#475569' : '#f1f5f9') : (props.theme === 'dark' ? '#334155' : '#ffffff')};
  border: 1px solid ${props => props.active ? '#3b82f6' : (props.theme === 'dark' ? '#475569' : '#e2e8f0')};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? '#475569' : '#f1f5f9'};
    transform: translateY(-1px);
  }
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ConversationName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 1rem;
`;

const UnreadBadge = styled.span`
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ConversationMeta = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.875rem;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const MessageItem = styled.div`
  padding: 12px;
  background: ${props => props.isOwn ? (props.theme === 'dark' ? '#475569' : '#dbeafe') : (props.theme === 'dark' ? '#334155' : '#f8fafc')};
  border-radius: 8px;
  border-left: 3px solid ${props => props.isOwn ? '#3b82f6' : '#10b981'};
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const MessageSender = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 0.875rem;
`;

const MessageTime = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.75rem;
`;

const MessageText = styled.div`
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 0.875rem;
  line-height: 1.4;
`;

const MessageForm = styled.form`
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  background: ${props => props.theme === 'dark' ? '#1e293b' : '#ffffff'};
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.theme === 'dark' ? '#334155' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#94a3b8' : '#9ca3af'};
  }
`;

const SendButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-style: italic;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MessagingSidebar = ({ isOpen, onClose, theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const user = getCurrentUser();
  
  // Memoize authentication status to prevent unnecessary re-renders
  const authenticated = useMemo(() => isAuthenticated(), [user?.id]);

  useEffect(() => {
    if (isOpen && user && authenticated && !conversationsLoaded && !loading) {
      loadConversations();
    } else if (isOpen && (!user || !authenticated)) {
      console.log('User not authenticated, redirecting to login...');
      // You might want to redirect to login or show a message
    }
    
    // Reset loaded states when sidebar is closed
    if (!isOpen) {
      setConversationsLoaded(false);
      setUsersLoaded(false);
    }
  }, [isOpen, user?.id, authenticated, conversationsLoaded, loading]);

  useEffect(() => {
    if (isOpen && user && authenticated && activeTab === 'new' && !usersLoaded) {
      loadAvailableUsers();
    }
  }, [isOpen, user?.id, activeTab, usersLoaded, authenticated]);

  const loadConversations = async () => {
    if (loading || conversationsLoaded) return; // Prevent duplicate requests
    
    try {
      setLoading(true);
      console.log('Loading conversations...');
      const conversationsData = await apiService.getConversations();
      setConversations(conversationsData);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesForConversation = async (conversationId) => {
    // Prevent loading if already loaded or currently loading
    if (messages[conversationId] || loadingMessages) return;
    
    try {
      setLoadingMessages(true);
      const messagesData = await apiService.getMessages(conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: messagesData
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (usersLoaded || activeTab !== 'new') return; // Prevent duplicate requests and wrong tab
    
    try {
      let users = [];
      
      if (user.role === 'FDE') {
        // FDE can message AEOs
        const aeos = await apiService.getAllAEOs();
        users = aeos.map(aeo => ({
          id: aeo.id,
          name: aeo.username,
          role: 'AEO',
          school_name: aeo.school_name || 'Unknown School'
        }));
      } else if (user.role === 'AEO') {
        // AEO can message Principals and FDEs
        const principals = await apiService.getAllPrincipals();
        const fdes = await apiService.getAllFDEs?.() || [];
        users = [
          ...principals.map(principal => ({
            id: principal.id,
            name: principal.display_name || principal.username,
            role: 'Principal',
            school_name: principal.school_name
          })),
          ...fdes.map(fde => ({
            id: fde.id,
            name: fde.username,
            role: 'FDE',
            school_name: fde.school_name || 'Unknown School'
          }))
        ];
      } else if (user.role === 'Principal') {
        // Principal can message AEOs
        const aeos = await apiService.getAllAEOs();
        users = aeos.map(aeo => ({
          id: aeo.id,
          name: aeo.username,
          role: 'AEO',
          school_name: aeo.school_name || 'Unknown School'
        }));
      }
      
      setAvailableUsers(users);
      setUsersLoaded(true);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      // Get the receiver ID based on the conversation
      let receiverId;
      if (user.role === 'FDE') {
        // FDE sending to AEO
        receiverId = conversation.aeo?.id;
      } else if (user.role === 'AEO') {
        // AEO sending to Principal or FDE
        receiverId = conversation.principal?.id || conversation.aeo?.id;
      } else if (user.role === 'Principal') {
        // Principal sending to AEO
        receiverId = conversation.aeo?.id;
      }

      if (!receiverId) {
        throw new Error('Receiver not found');
      }

      await apiService.sendMessage(
        conversation.school_name,
        newMessage.trim(),
        receiverId
      );

      // Refresh messages for this conversation
      await loadMessagesForConversation(selectedConversation);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const createNewConversation = async (receiverId, receiverName, receiverRole, schoolName) => {
    try {
      // Create a new conversation based on user roles
      let conversationData;
      
      if (user.role === 'FDE') {
        // FDE creating conversation with AEO
        conversationData = {
          aeo_id: receiverId,  // AEO is the receiver
          principal_id: user.id,  // FDE is the principal
          school_name: schoolName
        };
      } else if (user.role === 'AEO') {
        if (receiverRole === 'Principal') {
          // AEO creating conversation with Principal
          conversationData = {
            aeo_id: user.id,  // AEO is the sender
            principal_id: receiverId,  // Principal is the receiver
            school_name: schoolName
          };
        } else {
          // AEO creating conversation with FDE
          conversationData = {
            aeo_id: user.id,  // AEO is the sender
            principal_id: receiverId,  // FDE is the principal
            school_name: schoolName
          };
        }
      } else if (user.role === 'Principal') {
        // Principal creating conversation with AEO
        conversationData = {
          aeo_id: receiverId,  // AEO is the receiver
          principal_id: user.id,  // Principal is the sender
          school_name: schoolName
        };
      }
      
      const newConversation = await apiService.createConversation(conversationData);
      
      // Add to conversations list
      setConversations(prev => [...prev, newConversation]);
      
      // Select the new conversation
      setSelectedConversation(newConversation.id);
      
      // Initialize empty messages array for this conversation
      setMessages(prev => ({
        ...prev,
        [newConversation.id]: []
      }));
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const handleStartConversation = async (receiverId, receiverName, receiverRole, schoolName) => {
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.school_name === schoolName && 
        ((user.role === 'FDE' && conv.aeo?.id === receiverId) ||
         (user.role === 'AEO' && (conv.principal?.id === receiverId || conv.aeo?.id === receiverId)) ||
         (user.role === 'Principal' && conv.aeo?.id === receiverId))
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
      } else {
        await createNewConversation(receiverId, receiverName, receiverRole, schoolName);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConversationName = (conversation) => {
    if (user.role === 'FDE') {
      return `AEO: ${conversation.aeo?.username || 'Unknown AEO'}`;
    } else if (user.role === 'AEO') {
      if (conversation.principal?.username) {
        return `Principal: ${conversation.principal.username}`;
      } else {
        return `FDE: ${conversation.aeo?.username || 'Unknown FDE'}`;
      }
    } else if (user.role === 'Principal') {
      return `AEO: ${conversation.aeo?.username || 'Unknown AEO'}`;
    }
    return conversation.school_name;
  };

  const getConversationMeta = (conversation) => {
    return `School: ${conversation.school_name}`;
  };

  const canSendMessage = () => {
    if (!selectedConversation) return false;
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return false;

    // All users can send messages in existing conversations
    return true;
  };

  return (
    <SidebarContainer isOpen={isOpen} theme={theme}>
      <SidebarHeader theme={theme}>
        <SidebarTitle theme={theme}>
          💬 Messages
        </SidebarTitle>
        <CloseButton onClick={onClose} theme={theme}>
          ×
        </CloseButton>
      </SidebarHeader>

      <SidebarContent>
        <TabsContainer theme={theme}>
          <Tab 
            active={activeTab === 'conversations'} 
            onClick={() => setActiveTab('conversations')}
            theme={theme}
          >
            Conversations
          </Tab>
          <Tab 
            active={activeTab === 'new'} 
            onClick={() => setActiveTab('new')}
            theme={theme}
          >
            New Message
          </Tab>
        </TabsContainer>

        <TabContent>
          {activeTab === 'conversations' && (
            <>
              {loading ? (
                <EmptyState theme={theme}>
                  <LoadingSpinner />
                  Loading conversations...
                </EmptyState>
              ) : conversations.length === 0 ? (
                <EmptyState theme={theme}>
                  No conversations yet. Start a new conversation to begin messaging.
                </EmptyState>
              ) : (
                <>
                  <ConversationList>
                    {conversations.map(conversation => (
                      <ConversationItem
                        key={conversation.id}
                        active={selectedConversation === conversation.id}
                        onClick={() => {
                          // Prevent selecting the same conversation multiple times
                          if (selectedConversation === conversation.id) return;
                          
                          setSelectedConversation(conversation.id);
                          // Load messages for this conversation if not already loaded
                          if (!messages[conversation.id]) {
                            loadMessagesForConversation(conversation.id);
                          }
                        }}
                        theme={theme}
                      >
                        <ConversationHeader>
                          <ConversationName theme={theme}>
                            {getConversationName(conversation)}
                          </ConversationName>
                          {conversation.unread_count > 0 && (
                            <UnreadBadge>
                              {conversation.unread_count}
                            </UnreadBadge>
                          )}
                        </ConversationHeader>
                        <ConversationMeta theme={theme}>
                          {getConversationMeta(conversation)}
                        </ConversationMeta>
                      </ConversationItem>
                    ))}
                  </ConversationList>

                  {selectedConversation && (
                    <>
                      <MessageList>
                        {loadingMessages ? (
                          <EmptyState theme={theme}>
                            <LoadingSpinner />
                            Loading messages...
                          </EmptyState>
                        ) : messages[selectedConversation]?.length > 0 ? (
                          messages[selectedConversation].map(message => (
                            <MessageItem
                              key={message.id}
                              isOwn={message.sender.id === user.id}
                              theme={theme}
                            >
                              <MessageHeader>
                                <MessageSender theme={theme}>
                                  {message.sender.id === user.id ? 'You' : message.sender.username}
                                </MessageSender>
                                <MessageTime theme={theme}>
                                  {formatTimestamp(message.timestamp)}
                                </MessageTime>
                              </MessageHeader>
                              <MessageText theme={theme}>
                                {message.message_text}
                              </MessageText>
                            </MessageItem>
                          ))
                        ) : (
                          <EmptyState theme={theme}>
                            No messages yet. Start the conversation!
                          </EmptyState>
                        )}
                      </MessageList>

                      {canSendMessage() && (
                        <MessageForm onSubmit={handleSendMessage} theme={theme}>
                          <MessageInput
                            type="text"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            theme={theme}
                          />
                          <SendButton disabled={sending || !newMessage.trim()}>
                            {sending ? (
                              <>
                                <LoadingSpinner />
                                Sending
                              </>
                            ) : (
                              'Send'
                            )}
                          </SendButton>
                        </MessageForm>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'new' && (
            <>
              <ConversationList>
                {availableUsers.map(userItem => (
                  <ConversationItem
                    key={userItem.id}
                    onClick={() => handleStartConversation(
                      userItem.id, 
                      userItem.name, 
                      userItem.role, 
                      userItem.school_name
                    )}
                    theme={theme}
                  >
                    <ConversationHeader>
                      <ConversationName theme={theme}>
                        {userItem.role}: {userItem.name}
                      </ConversationName>
                    </ConversationHeader>
                    <ConversationMeta theme={theme}>
                      School: {userItem.school_name}
                    </ConversationMeta>
                  </ConversationItem>
                ))}
              </ConversationList>
              
              {availableUsers.length === 0 && (
                <EmptyState theme={theme}>
                  No users available to message.
                </EmptyState>
              )}
            </>
          )}
        </TabContent>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default MessagingSidebar; 