import React, { useState, useEffect } from 'react';
import { apiService, getCurrentUser } from '../services/api';
import MessagingSidebar from './MessagingSidebar';
import TeacherObservations from './TeacherObservations';
import SchoolInfrastructure from './SchoolInfrastructure';
import styles from './PrincipalDashboard.module.css';

const PrincipalDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [recentMessages, setRecentMessages] = useState([]);
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadDashboardData();
    loadUnreadMessageCount();
  }, []);

  const loadUnreadMessageCount = async () => {
    try {
      const countData = await apiService.getUnreadMessageCount();
      setUnreadMessageCount(countData.unread_count || 0);
    } catch (error) {
      console.error('Error loading unread message count:', error);
      setUnreadMessageCount(0);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get current user to determine school name
      const currentUser = getCurrentUser();
      const schoolName = currentUser?.profile?.school_name;
      
      console.log('Loading dashboard data for principal:', currentUser);
      console.log('School name:', schoolName);
      
      if (!schoolName) {
        console.error('No school name found for principal user');
        return;
      }

      // Use available API methods to get data
      const [schoolTeachersData, conversations] = await Promise.all([
        apiService.getSchoolTeachersData(),
        apiService.getUserConversations()
      ]);
      
      console.log('School teachers data:', schoolTeachersData);
      console.log('Conversations:', conversations);
      
      // Process school teachers data for dashboard stats
      // The API returns { school_details: {...}, teachers: [...] }
      const schoolDetails = schoolTeachersData.school_details;
      const teachersList = schoolTeachersData.teachers || [];
      
      console.log('School details:', schoolDetails);
      console.log('Teachers list:', teachersList);
      
      if (schoolDetails) {
        const dashboardStats = {
          total_teachers: schoolDetails.total_teachers || 0,
          active_teachers: teachersList.filter(t => t.latest_lp_ratio > 0).length || 0,
          avg_lp_ratio: schoolDetails.avg_lp_ratio || 0,
          total_students: 0, // Not available in current API
          school_name: schoolDetails.school_name,
          emis_number: schoolDetails.emis,
          sector: schoolDetails.sector,
          infrastructure_status: 'Good', // Default value
          teachers: teachersList // Store teachers for display
        };
        
        console.log('Dashboard stats:', dashboardStats);
        setDashboardData(dashboardStats);
      } else {
        console.log('No school details found for:', schoolName);
        // Set default data if no school found
        setDashboardData({
          total_teachers: 0,
          active_teachers: 0,
          avg_lp_ratio: 0,
          total_students: 0,
          school_name: schoolName,
          emis_number: 'N/A',
          sector: 'N/A',
          infrastructure_status: 'Unknown',
          teachers: []
        });
      }
      
      // Process conversations for recent messages
      const recentMessages = conversations.slice(0, 5).map(conv => ({
        id: conv.id,
        sender_name: conv.participants?.find(p => p.id !== currentUser.id)?.username || 'Unknown',
        content: conv.last_message?.content || 'No message content',
        timestamp: conv.last_message?.timestamp || conv.created_at,
        conversation_id: conv.id
      }));
      
      console.log('Recent messages:', recentMessages);
      setRecentMessages(recentMessages);
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
      await apiService.sendMessage(conversationId, reply);
      setReplyText({ ...replyText, [conversationId]: '' });
      // Refresh messages
      const messages = await apiService.getRecentMessages();
      setRecentMessages(messages);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleMessagingSidebar = () => {
    setMessagingSidebarOpen(!messagingSidebarOpen);
  };

  const getPerformanceLevel = (lpRatio) => {
    if (lpRatio >= 80) return 'Excellent';
    if (lpRatio >= 60) return 'Good';
    if (lpRatio >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return '#10b981';
      case 'Good': return '#3b82f6';
      case 'Fair': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading Principal Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.title}>Principal Dashboard</h1>
            <div className={styles.subTitle}>
              Welcome back, {user?.display_name || 'Principal'}
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.messagingBtn} onClick={toggleMessagingSidebar}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
              </svg>
              Messages
              {unreadMessageCount > 0 && (
                <div className={`${styles.messageCountBadge} ${styles.hasUnread}`}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </div>
              )}
            </button>
            <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statValue}>{dashboardData.total_teachers || 0}</div>
          <div className={styles.statLabel}>Total Teachers</div>
        </div>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statValue}>{dashboardData.active_teachers || 0}</div>
          <div className={styles.statLabel}>Active Teachers</div>
        </div>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statValue}>{dashboardData.avg_lp_ratio ? `${dashboardData.avg_lp_ratio.toFixed(1)}%` : '0%'}</div>
          <div className={styles.statLabel}>Avg LP Ratio</div>
        </div>
        <div className={`${styles.statCard} ${styles.card}`}>
          <div className={styles.statValue}>{dashboardData.total_students || 0}</div>
          <div className={styles.statLabel}>Total Students</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={`${styles.schoolInfoCard} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>School Information</h2>
          <div className={styles.schoolInfoGrid}>
            <div className={`${styles.infoItem} ${styles.infrastructureStatusGood}`}>
              <div className={styles.infoLabel}>School Name</div>
              <div className={styles.infoValue}>{dashboardData.school_name || 'N/A'}</div>
            </div>
            <div className={`${styles.infoItem} ${styles.infrastructureStatusInfo}`}>
              <div className={styles.infoLabel}>EMIS Number</div>
              <div className={styles.infoValue}>{dashboardData.emis_number || 'N/A'}</div>
            </div>
            <div className={`${styles.infoItem} ${styles.infrastructureStatusGood}`}>
              <div className={styles.infoLabel}>Sector</div>
              <div className={styles.infoValue}>{dashboardData.sector || 'N/A'}</div>
            </div>
            <div className={`${styles.infoItem} ${styles.infrastructureStatusWarning}`}>
              <div className={styles.infoLabel}>Infrastructure Status</div>
              <div className={styles.infoValue}>{dashboardData.infrastructure_status || 'Good'}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.teachersSection} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>Teacher Performance</h2>
          <div className={styles.teacherPerformanceList}>
            {dashboardData.teachers && dashboardData.teachers.length > 0 ? (
              dashboardData.teachers.slice(0, 10).map((teacher, index) => {
                const performanceLevel = getPerformanceLevel(teacher.latest_lp_ratio || 0);
                const performanceColor = getPerformanceColor(performanceLevel);
                return (
                  <div key={teacher.user_id} className={styles.teacherPerformanceItem}>
                    <div className={styles.teacherInfo}>
                      <div className={styles.teacherName}>{teacher.teacher_name}</div>
                      <div className={styles.performanceInfo}>
                        <div className={styles.lpRatio}>LP: {teacher.latest_lp_ratio ? `${teacher.latest_lp_ratio.toFixed(1)}%` : 'N/A'}</div>
                        <div className={styles.performanceBadge} style={{ color: performanceColor, background: `${performanceColor}20` }}>
                          {performanceLevel}
                        </div>
                      </div>
                    </div>
                    <div className={styles.teacherDetails}>
                      <div>Subject: {teacher.subject || 'N/A'}</div>
                      <div>Grade: {teacher.grade || 'N/A'}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noMessages}>No teacher data available</div>
            )}
          </div>
        </div>

        <div className={`${styles.messagesSection} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>Recent Messages</h2>
          <div className={styles.recentMessagesList}>
            {recentMessages.length > 0 ? (
              recentMessages.map(message => (
                <div key={message.id} className={styles.messageItem}>
                  <div className={styles.messageHeader}>
                    <div className={styles.messageSender}>
                      <span>💬</span>
                      {message.sender_name}
                    </div>
                    <div className={styles.messageTime}>{formatTimestamp(message.timestamp)}</div>
                  </div>
                  <div className={styles.messageText}>{message.content}</div>
                  <form onSubmit={(e) => handleReply(message.conversation_id, e)} className={styles.replyForm}>
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      value={replyText[message.conversation_id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [message.conversation_id]: e.target.value })}
                      className={styles.replyInput}
                    />
                    <button type="submit" className={styles.replyButton}>Reply</button>
                  </form>
                </div>
              ))
            ) : (
              <div className={styles.noMessages}>No recent messages</div>
            )}
          </div>
        </div>
      </div>

      {/* Messaging Sidebar */}
      <MessagingSidebar
        isOpen={messagingSidebarOpen}
        onClose={() => setMessagingSidebarOpen(false)}
        theme="light"
        onMessagesRead={loadUnreadMessageCount}
      />
    </div>
  );
};

export default PrincipalDashboard; 