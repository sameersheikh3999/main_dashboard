import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';
import MessagingSidebar from './MessagingSidebar';
import styles from './AEODashboard.module.css';

const AEODashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({});
  const [schools, setSchools] = useState([]);
  const [theme, setTheme] = useState('light');
  const [messagingModal, setMessagingModal] = useState({
    isOpen: false,
    principalId: null,
    schoolName: '',
    type: ''
  });
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userSector, setUserSector] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    document.body.style.transition = 'all 0.3s ease';
  }, [theme]);

  useEffect(() => {
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user'));
    console.log('Current user from localStorage:', currentUser);
    setUser(currentUser);
    setUserSector(currentUser?.profile?.sector || '');
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user to determine sector
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const sector = currentUser?.profile?.sector;
      
      console.log('Loading data for sector:', sector);
      console.log('Full user object:', currentUser);
      
      if (!sector) {
        console.error('No sector found for AEO user');
        console.error('User profile:', currentUser?.profile);
        return;
      }

      // Fetch sector schools with WiFi and activity data
      const sectorSchools = await apiService.getAEOSectorSchools();
      
      console.log('Sector schools with WiFi and activity data:', sectorSchools);
      
      // Calculate sector-specific metrics
      const totalSchoolsInSector = sectorSchools.length;
      
      // Calculate WiFi statistics
      const schoolsWithWiFi = sectorSchools.filter(school => school.wifi_available).length;
      const wifiPercentage = totalSchoolsInSector > 0 ? (schoolsWithWiFi / totalSchoolsInSector * 100) : 0;
      
      // Calculate activity statistics
      const activeSchools = sectorSchools.filter(school => school.activity_status === 'Active').length;
      const activityPercentage = totalSchoolsInSector > 0 ? (activeSchools / totalSchoolsInSector * 100) : 0;
      
      // Calculate average LP ratio for the sector
      const schoolsWithLP = sectorSchools.filter(school => school.avg_lp_ratio !== null && school.avg_lp_ratio !== undefined);
      const totalLP = schoolsWithLP.reduce((sum, school) => sum + (school.avg_lp_ratio || 0), 0);
      const avgLPRatio = schoolsWithLP.length > 0 ? totalLP / schoolsWithLP.length : 0;
      
      // Calculate total teacher count across all schools in the sector
      const totalTeachers = sectorSchools.reduce((sum, school) => sum + (school.teacher_count || 0), 0);
      
      console.log('Sector metrics:', {
        totalSchools: totalSchoolsInSector,
        totalTeachers: totalTeachers,
        schoolsWithWiFi: schoolsWithWiFi,
        wifiPercentage: wifiPercentage,
        activeSchools: activeSchools,
        activityPercentage: activityPercentage,
        schoolsWithLP: schoolsWithLP.length,
        totalLP: totalLP,
        avgLPRatio: avgLPRatio
      });
      
      // Update summary stats with sector-specific calculations
      const sectorSummaryStats = {
        total_schools: totalSchoolsInSector,
        total_teachers: totalTeachers,
        schools_with_wifi: schoolsWithWiFi,
        wifi_percentage: wifiPercentage,
        active_schools: activeSchools,
        activity_percentage: activityPercentage,
        overall_avg_lp_ratio: avgLPRatio
      };
      
      setSummaryStats(sectorSummaryStats);
      setSchools(sectorSchools);
    } catch (error) {
      console.error('Error loading AEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleMessagingSidebar = () => {
    setMessagingSidebarOpen(!messagingSidebarOpen);
  };

  const handleMessageSent = () => {
    // This will be called when a message is sent through the modal
    console.log('Message sent successfully');
    // Refresh unread message count
    loadUnreadMessageCount();
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  if (loading) {
    return (
      <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
        <div className={`${styles.loadingSpinner} ${styles[theme]}`}>Loading AEO Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
      
      <header className={styles.header}>
        <div className={`${styles.topBar} ${styles[theme]}`}>
          <div>
            <h1 className={styles.title}>{userSector} Sector - AEO Dashboard</h1>
            <div className={`${styles.subtitle} ${styles[theme]}`}>
              Sector-specific oversight of educational performance and school management
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.messagingBtn} onClick={toggleMessagingSidebar}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
              </svg>
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
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Dark
                </>
              ) : (
                <>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  Light
                </>
              )}
            </button>
            <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Total Schools</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>{summaryStats.total_schools || schools.length}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>In {userSector} Sector</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Total Teachers</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#8b5cf6' }}>{summaryStats.total_teachers || 0}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Across {userSector} Schools</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Sector Avg LP Ratio</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#3b82f6' }}>{summaryStats.overall_avg_lp_ratio ? `${summaryStats.overall_avg_lp_ratio.toFixed(1)}%` : '0%'}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Learning Progress Average</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Active Schools</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#f59e0b' }}>{summaryStats.active_schools || 0}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Schools with {'>'}10% Active Teachers</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>WiFi Available</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>{summaryStats.schools_with_wifi || 0}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>{summaryStats.wifi_percentage ? `${summaryStats.wifi_percentage.toFixed(1)}%` : '0%'} of Schools</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            📊 Sector Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schools.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} />
              <XAxis 
                dataKey="school_name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              />
              <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <Tooltip 
                contentStyle={{
                  background: theme === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                }}
              />
              <Bar dataKey="avg_lp_ratio" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            🏫 School Performance Ranking
          </h3>
          <div className={styles.schoolPerformanceList}>
            {schools.slice(0, 10).map((school, index) => {
              const performanceColor = getPerformanceColor(school.avg_lp_ratio || 0);
              return (
                <div 
                  key={school.emis} 
                  className={`${styles.schoolPerformanceItem} ${styles[theme]}`}
                  style={{ borderLeftColor: performanceColor }}
                >
                  <div className={styles.schoolInfo}>
                    <div className={styles.schoolRank} style={{ background: performanceColor }}>
                      {index + 1}
                    </div>
                    <div className={styles.schoolDetails}>
                      <div className={`${styles.schoolName} ${styles[theme]}`}>{school.school_name}</div>
                      <div className={`${styles.schoolStats} ${styles[theme]}`}>
                        {school.teacher_count || 0} teachers • LP: {school.avg_lp_ratio ? `${school.avg_lp_ratio.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className={styles.schoolPerformance}>
                    <div className={styles.performanceScore} style={{ color: performanceColor }}>
                      {school.avg_lp_ratio ? `${school.avg_lp_ratio.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className={`${styles.performanceLabel} ${styles[theme]}`}>
                      {school.avg_lp_ratio >= 80 ? 'Excellent' : school.avg_lp_ratio >= 60 ? 'Good' : school.avg_lp_ratio >= 40 ? 'Fair' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${styles.fullWidthCard} ${styles[theme]}`}>
        <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
          👥 Teacher Activity Status
        </h3>
        <div className={`${styles.teacherList} ${styles[theme]}`}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {schools.slice(0, 20).map(school => (
              <li key={school.emis} className={`${styles.teacherItem} ${styles[theme]}`}>
                {school.school_name} ({school.teacher_count || 0} teachers)
                <span className={`${styles.teacherStatus} ${school.activity_status === 'Active' ? styles.active : styles.inactive}`}>
                  {school.activity_status || 'Unknown'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={() => setMessagingModal({ ...messagingModal, isOpen: false })}
        schoolName={messagingModal.schoolName}
        schoolData={{ id: messagingModal.principalId, name: messagingModal.schoolName }}
        onMessageSent={handleMessageSent}
      />

      {/* Messaging Sidebar */}
      <MessagingSidebar
        isOpen={messagingSidebarOpen}
        onClose={() => setMessagingSidebarOpen(false)}
        theme={theme}
        onMessagesRead={loadUnreadMessageCount}
      />
    </div>
  );
};

export default AEODashboard; 