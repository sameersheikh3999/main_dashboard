import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Bar } from 'react-chartjs-2';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';
import MessagingSidebar from './MessagingSidebar';
import styles from './AEODashboard.module.css';
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
  IoMailUnreadOutline
} from 'react-icons/io5';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [internetFilter, setInternetFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [lpFilter, setLpFilter] = useState('all');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('avg_lp_ratio');
  const [sortOrder, setSortOrder] = useState('asc');

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
      
      // Calculate Internet Availability statistics (JSON file only)
      const schoolsWithInternet = sectorSchools.filter(school => school.internet_availability === 'Yes').length;
      const internetPercentage = totalSchoolsInSector > 0 ? (schoolsWithInternet / totalSchoolsInSector * 100) : 0;
      
      // Calculate activity statistics
      const activeSchools = sectorSchools.filter(school => school.activity_status === 'Active').length;
      const activityPercentage = totalSchoolsInSector > 0 ? (activeSchools / totalSchoolsInSector * 100) : 0;
      
      // Calculate average LP ratio for the sector
      const schoolsWithLP = sectorSchools.filter(school => school.avg_lp_ratio !== null && school.avg_lp_ratio !== undefined);
      const totalLP = schoolsWithLP.reduce((sum, school) => sum + (school.avg_lp_ratio || 0), 0);
      const avgLPRatio = schoolsWithLP.length > 0 ? totalLP / schoolsWithLP.length : 0;
      
      // Calculate total teacher count across all schools in the sector
      const totalTeachers = sectorSchools.reduce((sum, school) => sum + (school.teacher_count || 0), 0);
      
      // Debug Internet Availability calculation
      const internetBreakdown = {
        internet_availability_yes: sectorSchools.filter(school => school.internet_availability === 'Yes').length,
        wifi_available_true: sectorSchools.filter(school => school.wifi_available).length,
        wifi_status_available: sectorSchools.filter(school => school.wifi_status === 'Available').length,
        wifi_status_limited: sectorSchools.filter(school => school.wifi_status === 'Limited').length
      };
      
      console.log('Sector metrics:', {
        totalSchools: totalSchoolsInSector,
        totalTeachers: totalTeachers,
        schoolsWithInternet: schoolsWithInternet,
        internetPercentage: internetPercentage,
        internetBreakdown: internetBreakdown,
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
        schools_with_internet: schoolsWithInternet,
        internet_percentage: internetPercentage,
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

  // Filter and sort schools based on search term, filters, and sorting
  const getFilteredSchools = () => {
    let filtered = schools.filter(school => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.emis.toString().includes(searchTerm);

      // Internet availability filter
      const matchesInternet = internetFilter === 'all' || 
        (internetFilter === 'yes' && school.internet_availability === 'Yes') ||
        (internetFilter === 'no' && school.internet_availability === 'No');

      // Activity status filter
      const matchesActivity = activityFilter === 'all' || 
        (activityFilter === 'active' && school.activity_status === 'Active') ||
        (activityFilter === 'inactive' && school.activity_status !== 'Active');

      // LP ratio filter
      const matchesLP = lpFilter === 'all' || 
        (lpFilter === 'high' && school.avg_lp_ratio >= 60) ||
        (lpFilter === 'medium' && school.avg_lp_ratio >= 30 && school.avg_lp_ratio < 60) ||
        (lpFilter === 'low' && school.avg_lp_ratio < 30);

      return matchesSearch && matchesInternet && matchesActivity && matchesLP;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'emis':
          aValue = parseInt(a.emis) || 0;
          bValue = parseInt(b.emis) || 0;
          break;
        case 'school_name':
          aValue = a.school_name.toLowerCase();
          bValue = b.school_name.toLowerCase();
          break;
        case 'avg_lp_ratio':
          aValue = a.avg_lp_ratio || 0;
          bValue = b.avg_lp_ratio || 0;
          break;
        case 'teacher_count':
          aValue = a.teacher_count || 0;
          bValue = b.teacher_count || 0;
          break;
        case 'student_teacher_ratio':
          // Extract the ratio number (e.g., "1:30" -> 30)
          aValue = parseInt(a.student_teacher_ratio?.split(':')[1]) || 0;
          bValue = parseInt(b.student_teacher_ratio?.split(':')[1]) || 0;
          break;
        default:
          aValue = a.school_name.toLowerCase();
          bValue = b.school_name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setInternetFilter('all');
    setActivityFilter('all');
    setLpFilter('all');
    setSortBy('avg_lp_ratio');
    setSortOrder('asc');
  };

  // Calculate internet availability counts for the table
  const getInternetCounts = () => {
    const filteredSchools = getFilteredSchools();
    
    // Count schools using only JSON file data (internet_availability field)
    const withInternet = filteredSchools.filter(school => school.internet_availability === 'Yes').length;
    const withoutInternet = filteredSchools.length - withInternet;
    
    // Debug logging
    console.log('=== INTERNET COUNT CALCULATION (JSON ONLY) ===');
    console.log('Filtered schools total:', filteredSchools.length);
    console.log('Schools with internet (JSON):', withInternet);
    console.log('Schools without internet (JSON):', withoutInternet);
    
    return { withInternet, withoutInternet, total: filteredSchools.length };
  };



  // Calculate top 10 performing schools for charts and ranking
  const topPerformingSchools = useMemo(() => {
    if (!schools || schools.length === 0) return [];
    
    // Filter out schools with null/undefined LP ratios and ensure numeric values
    const validSchools = schools.filter(school => {
      const lpRatio = parseFloat(school.avg_lp_ratio);
      return !isNaN(lpRatio) && lpRatio > 0;
    });
    
    console.log('Valid schools for chart:', validSchools.length);
    console.log('Sample school data:', validSchools.slice(0, 3));
    
    // If no valid schools, create sample data for demonstration
    if (validSchools.length === 0) {
      console.log('No valid schools found, creating sample data');
      return [
        { school_name: 'Sample School 1', avg_lp_ratio: 85.5 },
        { school_name: 'Sample School 2', avg_lp_ratio: 78.2 },
        { school_name: 'Sample School 3', avg_lp_ratio: 72.1 },
        { school_name: 'Sample School 4', avg_lp_ratio: 68.9 },
        { school_name: 'Sample School 5', avg_lp_ratio: 65.3 }
      ];
    }
    
    return validSchools
      .sort((a, b) => (parseFloat(b.avg_lp_ratio) || 0) - (parseFloat(a.avg_lp_ratio) || 0)) // Sort descending by LP ratio
      .slice(0, 10) // Take top 10
      .map(school => ({
        ...school,
        avg_lp_ratio: parseFloat(school.avg_lp_ratio) || 0
      }));
  }, [schools]);

  const handleAskPrincipal = (school) => {
    setMessagingModal({
      isOpen: true,
      schoolName: school.school_name,
      type: 'principal'
    });
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
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Internet Available</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>{summaryStats.schools_with_internet || 0}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>{summaryStats.internet_percentage ? `${summaryStats.internet_percentage.toFixed(1)}%` : '0%'} of Schools</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoStatsChartOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
            <span style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>
              Top 10 Schools Performance Overview
            </span>
            <span style={{ 
              fontSize: '0.9rem', 
              color: theme === 'dark' ? '#94a3b8' : '#64748b', 
              fontWeight: 'normal', 
              marginLeft: '12px' 
            }}>
              🚀 Interactive Chart
            </span>
          </h3>
          <div style={{ 
            height: 'calc(100vh - 400px)', 
            minHeight: '600px', 
            position: 'relative', 
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Bar
              data={{
                labels: topPerformingSchools.map(school => school.school_name),
                datasets: [
                  {
                    label: 'LP Ratio (%)',
                    data: topPerformingSchools.map(school => school.avg_lp_ratio),
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(96, 165, 250, 0.8)'
                      : 'rgba(59, 130, 246, 0.8)',
                    borderColor: theme === 'dark' 
                      ? 'rgba(34, 211, 238, 1)'
                      : 'rgba(6, 182, 212, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: theme === 'dark' 
                      ? 'rgba(139, 92, 246, 0.9)'
                      : 'rgba(139, 92, 246, 0.9)',
                    hoverBorderColor: theme === 'dark' 
                      ? 'rgba(34, 211, 238, 1)'
                      : 'rgba(6, 182, 212, 1)',
                    hoverBorderWidth: 3,
                  }
                ]
              }}
              options={{
                indexAxis: 'y', // This makes it horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    titleColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    bodyColor: theme === 'dark' ? '#e2e8f0' : '#1e293b',
                    borderColor: theme === 'dark' ? '#475569' : '#e2e8f0',
                    borderWidth: 2,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                      size: 14,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 13
                    },
                    callbacks: {
                      title: function(context) {
                        return `🏫 ${context[0].label}`;
                      },
                      label: function(context) {
                        return `LP Ratio: ${context.parsed.x}%`;
                      }
                    }
                  }
                },
                                 scales: {
                   x: {
                     beginAtZero: true,
                     max: Math.max(...topPerformingSchools.map(school => school.avg_lp_ratio)) + 5, // Dynamic max based on data
                     grid: {
                       color: theme === 'dark' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.3)',
                       drawBorder: false
                     },
                     ticks: {
                       color: theme === 'dark' ? '#94a3b8' : '#64748b',
                       font: {
                         size: 11,
                         weight: '500'
                       },
                       callback: function(value) {
                         return value + '%';
                       }
                     },
                     title: {
                       display: true,
                       text: 'LP Ratio (%)',
                       color: theme === 'dark' ? '#94a3b8' : '#64748b',
                       font: {
                         size: 14,
                         weight: '600'
                       }
                     }
                   },
                  y: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: theme === 'dark' ? '#94a3b8' : '#64748b',
                      font: {
                        size: 11,
                        weight: '500'
                      }
                    }
                  }
                },
                animation: {
                  duration: 1500,
                  easing: 'easeOutQuart'
                },
                elements: {
                  bar: {
                    borderRadius: 8
                  }
                }
              }}
            />
          </div>
        </div>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Top 10 Performing Schools
          </h3>
          <div className={styles.schoolPerformanceList}>
            {topPerformingSchools.map((school, index) => {
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
        <div className={styles.tableHeader}>
        <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoPeopleOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> School Performance Table ({getFilteredSchools().length} Schools)
        </h3>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '10px',
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#94a3b8' : '#64748b'
          }}>

            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981' 
              }}></span>
              Internet Available: {getInternetCounts().withInternet}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              color: '#ef4444',
              fontWeight: '500'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#ef4444' 
              }}></span>
              No Internet: {getInternetCounts().withoutInternet}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              fontWeight: '500'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: theme === 'dark' ? '#94a3b8' : '#64748b' 
              }}></span>
              Total: {getInternetCounts().total}
            </span>
          </div>
          <div className={styles.tableControls}>
            <div className={styles.searchContainer}>
              <IoSearchOutline className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search schools or EMIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${styles.searchInput} ${styles[theme]}`}
              />
            </div>
            <div className={styles.quickSortButtons}>
              <button 
                onClick={() => { setSortBy('school_name'); setSortOrder('asc'); }}
                className={`${styles.quickSortBtn} ${styles[theme]} ${sortBy === 'school_name' && sortOrder === 'asc' ? styles.active : ''}`}
                title="Sort A-Z"
              >
                A-Z
              </button>
              <button 
                onClick={() => { setSortBy('school_name'); setSortOrder('desc'); }}
                className={`${styles.quickSortBtn} ${styles[theme]} ${sortBy === 'school_name' && sortOrder === 'desc' ? styles.active : ''}`}
                title="Sort Z-A"
              >
                Z-A
              </button>
              <button 
                onClick={() => { setSortBy('avg_lp_ratio'); setSortOrder('desc'); }}
                className={`${styles.quickSortBtn} ${styles[theme]} ${sortBy === 'avg_lp_ratio' && sortOrder === 'desc' ? styles.active : ''}`}
                title="High to Low Performance"
              >
                High→Low
              </button>
              <button 
                onClick={() => { setSortBy('avg_lp_ratio'); setSortOrder('asc'); }}
                className={`${styles.quickSortBtn} ${styles[theme]} ${sortBy === 'avg_lp_ratio' && sortOrder === 'asc' ? styles.active : ''}`}
                title="Low to High Performance"
              >
                Low→High
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={`${styles.filterLabel} ${styles[theme]}`}>Internet:</label>
            <select 
              value={internetFilter} 
              onChange={(e) => setInternetFilter(e.target.value)}
              className={`${styles.filterSelect} ${styles[theme]}`}
            >
              <option value="all">All</option>
              <option value="yes">Available</option>
              <option value="no">Not Available</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={`${styles.filterLabel} ${styles[theme]}`}>Activity:</label>
            <select 
              value={activityFilter} 
              onChange={(e) => setActivityFilter(e.target.value)}
              className={`${styles.filterSelect} ${styles[theme]}`}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={`${styles.filterLabel} ${styles[theme]}`}>LP Ratio:</label>
            <select 
              value={lpFilter} 
              onChange={(e) => setLpFilter(e.target.value)}
              className={`${styles.filterSelect} ${styles[theme]}`}
            >
              <option value="all">All</option>
              <option value="high">High (≥60%)</option>
              <option value="medium">Medium (30-59%)</option>
              <option value="low">Low (&lt;30%)</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={`${styles.filterLabel} ${styles[theme]}`}>Sort By:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={`${styles.filterSelect} ${styles[theme]}`}
            >
              <option value="avg_lp_ratio">LP Ratio</option>
              <option value="school_name">School Name</option>
              <option value="emis">EMIS Number</option>
              <option value="teacher_count">Teacher Count</option>
              <option value="student_teacher_ratio">Student-Teacher Ratio</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={`${styles.filterLabel} ${styles[theme]}`}>Order:</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className={`${styles.filterSelect} ${styles[theme]}`}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          
          <button 
            onClick={clearFilters}
            className={`${styles.clearFiltersBtn} ${styles[theme]}`}
          >
            <IoRefreshOutline style={{ marginRight: '4px' }} />
            Clear All
          </button>
        </div>
        
        <div className={`${styles.schoolTableContainer} ${styles[theme]}`}>
          <table className={`${styles.schoolTable} ${styles[theme]}`}>
            <thead>
              <tr>
                <th>EMIS NO</th>
                <th>SCHOOL NAME</th>
                <th>AVG LP</th>
                <th>TOTAL TEACHERS</th>
                <th>INTERNET AVAILABILITY</th>
                <th>STUDENT TEACHER RATIO</th>
                <th>ACTIVE STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredSchools().map(school => (
                <tr key={school.emis} className={`${styles.schoolTableRow} ${styles[theme]}`}>
                  <td className={styles.emisCell}>{school.emis}</td>
                  <td className={styles.schoolNameCell}>{school.school_name}</td>
                  <td className={styles.avgLpCell}>
                    {school.avg_lp_ratio ? `${school.avg_lp_ratio.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className={styles.teacherCountCell}>{school.teacher_count || 0}</td>
                  <td className={styles.internetCell}>
                    <span className={`${styles.statusBadge} ${school.internet_availability === 'Yes' ? styles.internetYes : styles.internetNo}`}>
                      {school.internet_availability || 'NO'}
                    </span>
                  </td>
                  <td className={styles.ratioCell}>
                    {school.student_teacher_ratio || '1:0'}
                  </td>
                  <td className={styles.activeStatusCell}>
                    <span className={`${styles.statusBadge} ${school.activity_status === 'Active' ? styles.activeStatus : styles.inactiveStatus}`}>
                      {school.activity_status === 'Active' ? 'Active' : 'Inactive'}
                      {school.activity_status !== 'Active' && (
                        <IoCloseCircleOutline style={{ marginLeft: '4px', fontSize: '14px' }} />
                      )}
                </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      onClick={() => handleAskPrincipal(school)}
                      className={`${styles.askButton} ${styles[theme]}`}
                      title={`Ask ${school.school_name} Principal`}
                    >
                      <IoChatbubblesOutline style={{ marginRight: '4px' }} />
                      Ask
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={() => setMessagingModal({ ...messagingModal, isOpen: false })}
        schoolName={messagingModal.schoolName}
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