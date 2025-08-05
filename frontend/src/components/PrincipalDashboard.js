import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiService, getCurrentUser } from '../services/api';
import styles from './PrincipalDashboard.module.css';
import MessagingSidebar from './MessagingSidebar';
import TeacherObservations from './TeacherObservations';
import SchoolInfrastructure from './SchoolInfrastructure';
import PasswordChangeModal from './PasswordChangeModal';
import {
  IoBarChartOutline,
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoShareOutline,
  IoNotificationsOutline,
  IoMailOutline,
  IoChatbubblesOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoGridOutline,
  IoListOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailUnreadOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLogOutOutline
} from 'react-icons/io5';



const PrincipalDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [recentMessages, setRecentMessages] = useState([]);
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [replyText, setReplyText] = useState({});
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lp_ratio');
  const [sortOrder, setSortOrder] = useState('desc');
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    document.body.style.transition = 'all 0.3s ease';
  }, [theme]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadDashboardData();
    loadUnreadMessageCount();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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

  // Filter and sort teachers
  const getFilteredTeachers = useMemo(() => {
    if (!dashboardData.teachers) return [];
    
    let filtered = dashboardData.teachers.filter(teacher => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        teacher.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.grade?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Performance filter
      const performanceLevel = getPerformanceLevel(teacher.latest_lp_ratio || 0);
      const matchesPerformance = performanceFilter === 'all' || performanceLevel === performanceFilter;
      
      // Subject filter
      const matchesSubject = subjectFilter === 'all' || teacher.subject === subjectFilter;
      
      return matchesSearch && matchesPerformance && matchesSubject;
    });
    
    // Sort teachers
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'lp_ratio':
          aValue = a.latest_lp_ratio || 0;
          bValue = b.latest_lp_ratio || 0;
          break;
        case 'name':
          aValue = a.teacher_name || '';
          bValue = b.teacher_name || '';
          break;
        case 'subject':
          aValue = a.subject || '';
          bValue = b.subject || '';
          break;
        default:
          aValue = a.latest_lp_ratio || 0;
          bValue = b.latest_lp_ratio || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [dashboardData.teachers, searchTerm, performanceFilter, subjectFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setPerformanceFilter('all');
    setSubjectFilter('all');
    setSortBy('lp_ratio');
    setSortOrder('desc');
  };

  const getUniqueSubjects = () => {
    if (!dashboardData.teachers) return [];
    return [...new Set(dashboardData.teachers.map(t => t.subject).filter(Boolean))];
  };

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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading Principal Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <header className={`${styles.header} ${styles[theme]}`}>
        <div className={`${styles.topBar} ${styles[theme]}`}>
          <div>
            <h1 className={styles.title}>
              <IoSchoolOutline style={{ marginRight: '12px', fontSize: '28px' }} />
              Principal Dashboard
            </h1>
            <div className={`${styles.subTitle} ${styles[theme]}`}>
              <IoPersonOutline style={{ marginRight: '8px', fontSize: '16px' }} />
              Welcome back, {user?.display_name || 'Principal'}
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.messagingBtn} onClick={toggleMessagingSidebar}>
              <IoChatbubblesOutline style={{ marginRight: '8px', fontSize: '18px' }} />
              Messages
              {unreadMessageCount > 0 && (
                <div className={`${styles.messageCountBadge} ${unreadMessageCount > 0 ? styles.hasUnread : ''}`}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </div>
              )}
            </button>
            <button className={`${styles.themeToggleBtn} ${styles[theme]}`} onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <IoMoonOutline style={{ marginRight: '8px', fontSize: '18px' }} />
                  Dark
                </>
              ) : (
                <>
                  <IoSunnyOutline style={{ marginRight: '8px', fontSize: '18px' }} />
                  Light
                </>
              )}
            </button>
            <button 
              className={styles.logoutBtn} 
              onClick={() => setPasswordChangeModalOpen(true)}
              style={{ 
                marginRight: '10px',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                color: '#475569',
                border: '1px solid #cbd5e1'
              }}
            >
              Change Password
            </button>
            <button className={styles.logoutBtn} onClick={onLogout}>
              <IoLogOutOutline style={{ marginRight: '8px', fontSize: '18px' }} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoPeopleOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Total Teachers
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>
            {dashboardData.total_teachers || 0}
          </div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>
            Teaching Staff
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoCheckmarkCircleOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Active Teachers
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#3b82f6' }}>
            {dashboardData.active_teachers || 0}
          </div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>
            Currently Active
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoBarChartOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Avg LP Ratio
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#8b5cf6' }}>
            {dashboardData.avg_lp_ratio ? `${dashboardData.avg_lp_ratio.toFixed(1)}%` : '0%'}
          </div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>
            Learning Progress
          </div>
        </div>

      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            School Information
          </h3>
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

        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoBarChartOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Teacher Performance Overview
          </h3>
          <div style={{ height: '300px', position: 'relative' }}>
            {dashboardData.teachers && dashboardData.teachers.length > 0 ? (
              <Bar
                data={{
                  labels: dashboardData.teachers.slice(0, 8).map(teacher => teacher.teacher_name?.split(' ')[0] || 'Teacher'),
                  datasets: [
                    {
                      label: 'LP Ratio (%)',
                      data: dashboardData.teachers.slice(0, 8).map(teacher => teacher.latest_lp_ratio || 0),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(34, 197, 94, 0.8)'
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(34, 197, 94, 1)'
                      ],
                      borderWidth: 2,
                      borderRadius: 8,
                      borderSkipped: false,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      titleColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                      bodyColor: theme === 'dark' ? '#cbd5e1' : '#64748b',
                      borderColor: theme === 'dark' ? '#475569' : '#e2e8f0',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: false,
                      callbacks: {
                        label: function(context) {
                          return `LP Ratio: ${context.parsed.y.toFixed(1)}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
                      },
                      ticks: {
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        font: {
                          size: 11
                        },
                        maxRotation: 45
                      }
                    }
                  }
                }}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                fontSize: '1.1rem'
              }}>
                <IoBarChartOutline style={{ marginRight: '8px', fontSize: '24px' }} />
                No teacher data available for chart
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoStatsChartOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Activity Distribution
          </h3>
          <div style={{ height: '300px', position: 'relative' }}>
            {dashboardData.total_teachers > 0 ? (
              <Doughnut
                data={{
                  labels: ['Active Teachers', 'Inactive Teachers'],
                  datasets: [
                    {
                      data: [
                        dashboardData.active_teachers || 0,
                        (dashboardData.total_teachers || 0) - (dashboardData.active_teachers || 0)
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                      ],
                      borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                      ],
                      borderWidth: 3,
                      hoverOffset: 4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        font: {
                          size: 12
                        },
                        usePointStyle: true,
                        padding: 20
                      }
                    },
                    tooltip: {
                      backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      titleColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                      bodyColor: theme === 'dark' ? '#cbd5e1' : '#64748b',
                      borderColor: theme === 'dark' ? '#475569' : '#e2e8f0',
                      borderWidth: 1,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                fontSize: '1.1rem'
              }}>
                <IoStatsChartOutline style={{ marginRight: '8px', fontSize: '24px' }} />
                No teacher data available for chart
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.teachersSection} ${styles.card} ${styles[theme]}`}>
          <h2 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoPeopleOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Teacher Performance
          </h2>
          
          {/* Search and Filter Controls */}
          <div className={styles.filterControls}>
            <div className={styles.searchContainer}>
              <IoSearchOutline className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search teachers, subjects, or grades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Performance:</label>
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Performance</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Subject:</label>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="lp_ratio">LP Ratio</option>
                  <option value="name">Name</option>
                  <option value="subject">Subject</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
              
              <button onClick={clearFilters} className={styles.clearFiltersBtn}>
                <IoRefreshOutline style={{ marginRight: '4px' }} />
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className={styles.resultsCount}>
            Showing {getFilteredTeachers.length} of {dashboardData.teachers?.length || 0} teachers
          </div>
          
          <div className={styles.teacherPerformanceList}>
            {getFilteredTeachers.length > 0 ? (
              getFilteredTeachers.map((teacher, index) => {
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
              <div className={styles.noMessages}>
                {searchTerm || performanceFilter !== 'all' || subjectFilter !== 'all' 
                  ? 'No teachers match your filters' 
                  : 'No teacher data available'}
              </div>
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

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordChangeModalOpen}
        onClose={() => setPasswordChangeModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
};

export default PrincipalDashboard; 