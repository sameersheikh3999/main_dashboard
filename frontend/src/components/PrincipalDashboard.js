import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService, getCurrentUser } from '../services/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 24px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
`;

const LogoutBtn = styled.button`
  background: #dc3545;
  color: #fff;
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #c82333;
  }
`;

const SubTitle = styled.div`
  color: #6c757d;
  font-size: 0.98rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  min-height: 120px;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const MessagesSection = styled(Card)`
  margin-bottom: 32px;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageItem = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #0a58ca;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MessageSender = styled.div`
  font-weight: 600;
  color: #0a58ca;
`;

const MessageTime = styled.div`
  color: #6c757d;
  font-size: 0.9rem;
`;

const MessageText = styled.div`
  color: #212529;
  line-height: 1.5;
`;

const ReplyForm = styled.form`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const ReplyInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #0a58ca;
    box-shadow: 0 0 0 2px rgba(10, 88, 202, 0.1);
  }
`;

const ReplyButton = styled.button`
  background: #0a58ca;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #084298;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const NoMessages = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
  font-style: italic;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #0a58ca;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PrincipalDashboard = ({ onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});
  const [user] = useState(getCurrentUser());

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const conversationsData = await apiService.getConversations();
      setConversations(conversationsData);
      
      // Fetch messages for each conversation
      const messagesData = {};
      for (const conv of conversationsData) {
        const convMessages = await apiService.getMessages(conv.id);
        messagesData[conv.id] = convMessages;
      }
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (conversationId, e) => {
    e.preventDefault();
    const reply = replyText[conversationId];
    if (!reply || !reply.trim()) return;

    try {
      setSendingReply(prev => ({ ...prev, [conversationId]: true }));
      
      // Find the AEO user ID from the conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Send reply to AEO
      await apiService.sendMessage(
        conversation.school_name,
        reply.trim(),
        conversation.aeo_id
      );

      // Refresh messages
      const updatedMessages = await apiService.getMessages(conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: updatedMessages
      }));

      // Clear reply text
      setReplyText(prev => ({ ...prev, [conversationId]: '' }));
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
          Loading your dashboard...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TopBar>
          <Title>Principal Dashboard - {user?.school_name}</Title>
          <LogoutBtn onClick={onLogout}>Logout</LogoutBtn>
        </TopBar>
        <SubTitle>School-specific data and messages from AEO</SubTitle>
      </Header>

      <Grid>
        <Card>
          <SectionTitle>School Information</SectionTitle>
          <div style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            <p><strong>School:</strong> {user?.school_name}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Username:</strong> {user?.username}</p>
          </div>
        </Card>

        <Card>
          <SectionTitle>Quick Stats</SectionTitle>
          <div style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            <p><strong>Active Conversations:</strong> {conversations.length}</p>
            <p><strong>Total Messages:</strong> {Object.values(messages).flat().length}</p>
            <p><strong>Unread Messages:</strong> {conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}</p>
          </div>
        </Card>
      </Grid>

      <MessagesSection>
        <SectionTitle>Messages from AEO</SectionTitle>
        {conversations.length === 0 ? (
          <NoMessages>
            No messages from AEO yet. Messages will appear here when AEO contacts you.
          </NoMessages>
        ) : (
          <MessageList>
            {conversations.map(conversation => (
              <div key={conversation.id}>
                <div style={{ 
                  background: '#e9ecef', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Conversation: {conversation.school_name}
                  {conversation.unread_count > 0 && (
                    <span style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      fontSize: '0.8rem',
                      marginLeft: '8px'
                    }}>
                      {conversation.unread_count} new
                    </span>
                  )}
                </div>
                
                {messages[conversation.id]?.map(message => (
                  <MessageItem key={message.id}>
                    <MessageHeader>
                      <MessageSender>
                        {message.sender === user.id ? 'You' : 'AEO'}
                      </MessageSender>
                      <MessageTime>{formatTimestamp(message.timestamp)}</MessageTime>
                    </MessageHeader>
                    <MessageText>{message.message_text}</MessageText>
                  </MessageItem>
                ))}

                {/* Reply form */}
                <ReplyForm onSubmit={(e) => handleReply(conversation.id, e)}>
                  <ReplyInput
                    type="text"
                    placeholder="Type your reply..."
                    value={replyText[conversation.id] || ''}
                    onChange={(e) => setReplyText(prev => ({
                      ...prev,
                      [conversation.id]: e.target.value
                    }))}
                    disabled={sendingReply[conversation.id]}
                  />
                  <ReplyButton 
                    type="submit" 
                    disabled={sendingReply[conversation.id] || !replyText[conversation.id]?.trim()}
                  >
                    {sendingReply[conversation.id] ? (
                      <>
                        <LoadingSpinner />
                        Sending...
                      </>
                    ) : (
                      'Reply'
                    )}
                  </ReplyButton>
                </ReplyForm>
              </div>
            ))}
          </MessageList>
        )}
      </MessagesSection>
    </Container>
  );
};

export default PrincipalDashboard; 