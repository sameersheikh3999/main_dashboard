import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService, getCurrentUser } from '../services/api';
import MessagingSidebar from './MessagingSidebar';
import TeacherObservations from './TeacherObservations';
import SchoolInfrastructure from './SchoolInfrastructure';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 16px;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e2e8f0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SubTitle = styled.div`
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 500;
`;

const MessagingBtn = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const LogoutBtn = styled.button`
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 24px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatCard = styled(Card)`
  text-align: center;
  background: ${props => props.gradient || 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.color || '#3b82f6'};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SchoolInfoCard = styled(Card)`
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const SchoolInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.div`
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 700;
`;

const TeachersSection = styled(Card)`
  grid-column: 1 / -1;
`;

const TeachersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const TeacherItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.performance === 'low' ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 
                props.performance === 'medium' ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : 
                'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'};
  border-radius: 12px;
  border: 1px solid ${props => props.performance === 'low' ? '#fecaca' : 
                       props.performance === 'medium' ? '#fed7aa' : '#bbf7d0'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const TeacherInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TeacherName = styled.div`
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
`;

const TeacherDetails = styled.div`
  color: #64748b;
  font-size: 0.9rem;
  display: flex;
  gap: 16px;
`;

const PerformanceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LPRatio = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${props => props.performance === 'low' ? '#dc2626' : 
           props.performance === 'medium' ? '#d97706' : '#059669'};
`;

const PerformanceBadge = styled.div`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.performance === 'low' ? '#dc2626' : 
                props.performance === 'medium' ? '#d97706' : '#059669'};
  color: white;
`;

const MessagesSection = styled(Card)`
  grid-column: 1 / -1;
  margin-top: 24px;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
`;

const MessageItem = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #3b82f6;
  border: 1px solid #e2e8f0;
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MessageSender = styled.div`
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
`;

const MessageTime = styled.div`
  color: #64748b;
  font-size: 0.9rem;
`;

const MessageText = styled.div`
  color: #1e293b;
  line-height: 1.6;
  font-size: 1rem;
`;

const ReplyForm = styled.form`
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

const ReplyInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ReplyButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const NoMessages = styled.div`
  text-align: center;
  color: #64748b;
  padding: 60px 20px;
  font-style: italic;
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 12px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PrincipalDashboard = ({ onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [user] = useState(getCurrentUser());

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load school teachers data
      const teachersData = await apiService.getSchoolTeachersData();
      setSchoolData(teachersData);
      
      // Load conversations
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
      console.error('Error loading dashboard data:', error);
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
      
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      await apiService.sendMessage(
        conversation.school_name,
        reply.trim(),
        conversation.aeo_id
      );

      const updatedMessages = await apiService.getMessages(conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: updatedMessages
      }));

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

  const toggleMessagingSidebar = () => {
    setMessagingSidebarOpen(!messagingSidebarOpen);
  };

  const getPerformanceLevel = (lpRatio) => {
    if (lpRatio < 5) return 'low';
    if (lpRatio < 10) return 'medium';
    return 'high';
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'low': return '#dc2626';
      case 'medium': return '#d97706';
      case 'high': return '#059669';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <LoadingSpinner />
          <div style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '16px' }}>
            Loading your dashboard...
          </div>
        </div>
      </Container>
    );
  }

  const teachers = schoolData?.teachers || [];
  const schoolDetails = schoolData?.school_details || {};
  const lowPerformers = teachers.filter(t => getPerformanceLevel(t.latest_lp_ratio) === 'low').length;
  const mediumPerformers = teachers.filter(t => getPerformanceLevel(t.latest_lp_ratio) === 'medium').length;
  const highPerformers = teachers.filter(t => getPerformanceLevel(t.latest_lp_ratio) === 'high').length;

  return (
    <Container>
      <Header>
        <TopBar>
          <div>
            <Title>Principal Dashboard - {user?.school_name}</Title>
            <SubTitle>Comprehensive school management and teacher performance overview</SubTitle>
          </div>
          <HeaderActions>
            <MessagingBtn onClick={toggleMessagingSidebar}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
              </svg>
              Messages
            </MessagingBtn>
            <LogoutBtn onClick={onLogout}>Logout</LogoutBtn>
          </HeaderActions>
        </TopBar>
      </Header>

      {/* School Information */}
      <SchoolInfoCard>
        <SectionTitle>
          🏫 School Information
        </SectionTitle>
        <SchoolInfoGrid>
          <InfoItem>
            <InfoLabel>School Name</InfoLabel>
            <InfoValue>{schoolDetails.school_name || user?.school_name}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>EMIS Number</InfoLabel>
            <InfoValue>{schoolDetails.emis || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Sector</InfoLabel>
            <InfoValue>{schoolDetails.sector || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Total Teachers</InfoLabel>
            <InfoValue>{schoolDetails.total_teachers || 0}</InfoValue>
          </InfoItem>
        </SchoolInfoGrid>
      </SchoolInfoCard>

      {/* Performance Stats */}
      <Grid>
        <StatCard gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)">
          <StatValue color="#10b981">{schoolDetails.avg_lp_ratio?.toFixed(1) || 0}%</StatValue>
          <StatLabel>School Avg LP Ratio</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
          <StatValue color="#ef4444">{lowPerformers}</StatValue>
          <StatLabel>Low Performers</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
          <StatValue color="#f59e0b">{mediumPerformers}</StatValue>
          <StatLabel>Medium Performers</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)">
          <StatValue color="#10b981">{highPerformers}</StatValue>
          <StatLabel>High Performers</StatLabel>
        </StatCard>
      </Grid>

      {/* Teachers Performance */}
      <TeachersSection>
        <SectionTitle>
          👨‍🏫 Teachers Performance (Low to High)
          <span style={{ 
            fontSize: '0.9rem', 
            color: '#64748b', 
            fontWeight: 'normal', 
            marginLeft: '8px' 
          }}>
            ({teachers.length} teachers)
          </span>
        </SectionTitle>
        <TeachersList>
          {teachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No teacher data available for this school.
            </div>
          ) : (
            teachers.map((teacher, index) => {
              const performance = getPerformanceLevel(teacher.latest_lp_ratio);
              return (
                <TeacherItem key={teacher.user_id} performance={performance}>
                  <TeacherInfo>
                    <TeacherName>{teacher.teacher_name}</TeacherName>
                    <TeacherDetails>
                      <span>ID: {teacher.user_id}</span>
                      <span>Grade: {teacher.grade || 'N/A'}</span>
                      <span>Subject: {teacher.subject || 'N/A'}</span>
                      <span>Week: {teacher.latest_week || 'N/A'}</span>
                    </TeacherDetails>
                  </TeacherInfo>
                  <PerformanceInfo>
                    <LPRatio performance={performance}>
                      {teacher.latest_lp_ratio.toFixed(1)}%
                    </LPRatio>
                    <PerformanceBadge performance={performance}>
                      {performance}
                    </PerformanceBadge>
                  </PerformanceInfo>
                </TeacherItem>
              );
            })
          )}
        </TeachersList>
      </TeachersSection>

      {/* School Infrastructure Section */}
      <TeachersSection>
        <SectionTitle>
          🏫 School Infrastructure
        </SectionTitle>
        <SchoolInfrastructure schoolName={user?.school_name} />
      </TeachersSection>

      {/* Teacher Observations Section */}
      <TeachersSection>
        <SectionTitle>
          📊 Teacher Observations
        </SectionTitle>
        <TeacherObservations schoolName={user?.school_name} />
      </TeachersSection>

      {/* Messages Section */}
      <MessagesSection>
        <SectionTitle>
          💬 Messages from AEO
        </SectionTitle>
        {conversations.length === 0 ? (
          <NoMessages>
            No messages from AEO yet. Messages will appear here when AEO contacts you.
          </NoMessages>
        ) : (
          <MessageList>
            {conversations.map(conversation => (
              <div key={conversation.id}>
                <div style={{ 
                  background: '#e2e8f0', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  fontWeight: '700',
                  color: '#374151'
                }}>
                  Conversation: {conversation.school_name}
                  {conversation.unread_count > 0 && (
                    <span style={{ 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      marginLeft: '12px'
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

      {/* Messaging Sidebar */}
      <MessagingSidebar
        isOpen={messagingSidebarOpen}
        onClose={() => setMessagingSidebarOpen(false)}
        theme="light"
      />
    </Container>
  );
};

export default PrincipalDashboard; 