import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { apiService } from '../services/api';
import styles from './AdminDashboard.module.css';
import AdminMessagingModal from './AdminMessagingModal';
import MessagingSidebar from './MessagingSidebar';
import PasswordChangeModal from './PasswordChangeModal';
import { 
  IoBarChartOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoMailOutline,
  IoChatbubblesOutline,
  IoPersonOutline,

  IoCloseCircleOutline,
  IoInformationCircleOutline,
  IoArrowUpOutline,
  IoGridOutline,
  IoListOutline,
  IoArrowBackOutline,
  IoCloseOutline,
  IoNotificationsOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoTrendingUpOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoTimeOutline
} from 'react-icons/io5';

const AdminDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    sector: '',
    school: '',
    grade: '',
    subject: '',
    date_from: '',
    date_to: '',
    sort_by: 'school',
    sort_order: 'asc'
  });
  const [detailedData, setDetailedData] = useState({});
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginTimestamps, setShowLoginTimestamps] = useState(true);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    document.body.style.transition = 'all 0.3s ease';
  }, [theme]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminDashboard(filters);
      
      // Process sector stats to improve chart readability
      if (data.sector_stats && data.sector_stats.length > 0) {
        // Remove duplicates and aggregate by sector name
        const sectorMap = new Map();
        data.sector_stats.forEach(stat => {
          const sectorName = stat.sector || 'Unknown';
          if (sectorMap.has(sectorName)) {
            const existing = sectorMap.get(sectorName);
            existing.teacher_count += stat.teacher_count;
            existing.school_count += stat.school_count;
            existing.total_lp += stat.avg_lp_ratio * stat.teacher_count;
            existing.total_teachers += stat.teacher_count;
          } else {
            sectorMap.set(sectorName, {
              sector: sectorName,
              teacher_count: stat.teacher_count,
              school_count: stat.school_count,
              total_lp: stat.avg_lp_ratio * stat.teacher_count,
              total_teachers: stat.teacher_count
            });
          }
        });

        // Convert to array and calculate weighted average LP ratio
        const processedSectors = Array.from(sectorMap.values()).map(sector => ({
          ...sector,
          avg_lp_ratio: sector.total_teachers > 0 ? sector.total_lp / sector.total_teachers : 0
        }));

        // Sort by teacher count and limit to top 6 sectors
        const sortedSectors = processedSectors
          .sort((a, b) => b.teacher_count - a.teacher_count)
          .slice(0, 6);
        
        // If there are more sectors, aggregate the rest into "Others"
        if (processedSectors.length > 6) {
          const otherSectors = processedSectors.slice(6);
          const otherTotal = otherSectors.reduce((sum, sector) => sum + sector.teacher_count, 0);
          const otherSchools = otherSectors.reduce((sum, sector) => sum + sector.school_count, 0);
          const otherTotalLP = otherSectors.reduce((sum, sector) => sum + sector.total_lp, 0);
          const otherTotalTeachers = otherSectors.reduce((sum, sector) => sum + sector.total_teachers, 0);
          
          sortedSectors.push({
            sector: 'Others',
            teacher_count: otherTotal,
            school_count: otherSchools,
            avg_lp_ratio: otherTotalTeachers > 0 ? otherTotalLP / otherTotalTeachers : 0
          });
        }
        
        data.sector_stats = sortedSectors;
      }
      
      setDashboardData(data);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboardData();
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user'));
    setUser(currentUser);
  }, [filters, loadDashboardData]);

  const loadUnreadMessageCount = async () => {
    try {
      const count = await apiService.getUnreadMessageCount();
      setUnreadMessageCount(count.unread_count || 0);
    } catch (error) {
      // Handle error silently
    }
  };

  // Periodically update unread count to ensure real-time updates
  useEffect(() => {
    const unreadCountInterval = setInterval(() => {
      loadUnreadMessageCount();
    }, 2000); // Update every 2 seconds for instant message indicators

    return () => clearInterval(unreadCountInterval);
  }, [loadUnreadMessageCount]);



  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDetailedData = async (dataType) => {
    setDetailedLoading(true);
    try {
      let data;
      if (dataType === 'login_timestamps') {
        data = await apiService.getLoginTimestamps({
          ...filters,
          page: currentPage,
          page_size: pageSize
        });
      } else {
        data = await apiService.getAdminDetailedData(dataType, {
          ...filters,
          page: currentPage,
          page_size: pageSize
        });
      }
      setDetailedData(prev => ({ ...prev, [dataType]: data }));
    } catch (error) {
      // Handle error silently
    } finally {
      setDetailedLoading(false);
    }
  };





  const handleSectorClick = (data) => {
    if (data && data.sector) {
      setSelectedSector(data.sector);
      setSelectedSchool(null);
      // Filter data for the selected sector
    }
  };

  const handleSchoolClick = (data) => {
    if (data && data.school) {
      setSelectedSchool(data.school);
    }
  };

  const resetSelection = () => {
    setSelectedSector(null);
    setSelectedSchool(null);
  };

  const getFilteredData = () => {
    if (selectedSector) {
      return {
        ...dashboardData,
        school_stats: dashboardData.school_stats?.filter(school => 
          school.sector === selectedSector
        ) || []
      };
    }
    return dashboardData;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (activeTab !== 'overview') {
      loadDetailedData(activeTab);
    }
  };

  const handleSortChange = (sortBy) => {
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: newSortOrder }));
  };

  const handleCSVExport = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        export_csv: 'true'
      });
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/admin/login-timestamps/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `login_timestamps_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleMessagingSidebar = () => {
    setMessagingSidebarOpen(!messagingSidebarOpen);
  };

  // Load unread message count on component mount
  useEffect(() => {
    loadUnreadMessageCount();
  }, []);

  const renderOverviewTab = () => (
    <div className={styles.overviewTab}>
      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3><IoPeopleOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Teachers</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_teachers ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Schools</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_schools ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoPersonOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Users</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_users ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoGridOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Sectors</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_sectors ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoChatbubblesOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Conversations</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_conversations ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoMailOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Messages</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_messages ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoAnalyticsOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Average LP Ratio</h3>
                          <p className={styles.statNumber}>{(dashboardData.stats?.avg_lp_ratio ?? 0).toFixed(2)}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoPersonOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total AEOs</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_aeos ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoPersonOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total Principals</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_principals ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3><IoPersonOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Total FDEs</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_fdes ?? 0}</p>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedSector || selectedSchool) && (
        <div className={styles.selectionSummary}>
          <div className={styles.summaryCard}>
            <h3><IoStatsChartOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Selection Details</h3>
            {selectedSector && (
              <div className={styles.summaryContent}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Sector:</span>
                  <span className={styles.summaryValue}>{selectedSector}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Schools:</span>
                  <span className={styles.summaryValue}>
                    {getFilteredData().school_stats?.length || 0}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Avg LP Ratio:</span>
                  <span className={styles.summaryValue}>
                    {dashboardData.sector_stats?.find(s => s.sector === selectedSector)?.avg_lp_ratio?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Teachers:</span>
                  <span className={styles.summaryValue}>
                    {dashboardData.sector_stats?.find(s => s.sector === selectedSector)?.teacher_count || 0}
                  </span>
                </div>
              </div>
            )}
            {selectedSchool && (
              <div className={styles.summaryContent}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>School:</span>
                  <span className={styles.summaryValue}>{selectedSchool}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>LP Ratio:</span>
                  <span className={styles.summaryValue}>
                    {dashboardData.school_stats?.find(s => s.school === selectedSchool)?.avg_lp_ratio?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Teachers:</span>
                  <span className={styles.summaryValue}>
                    {dashboardData.school_stats?.find(s => s.school === selectedSchool)?.teacher_count || 0}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Sector:</span>
                  <span className={styles.summaryValue}>
                    {dashboardData.school_stats?.find(s => s.school === selectedSchool)?.sector || 'Unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Sector Distribution */}
        <div className={styles.chartCard}>
          <h3>
            {selectedSector ? `${selectedSector} - Sector Details` : 'Sector Distribution'}
            {selectedSector && (
              <button onClick={resetSelection} className={styles.backButton}>
                <IoArrowBackOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Back to All Sectors
              </button>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={selectedSector ? 
                  (getFilteredData().school_stats?.slice(0, 8) || []) :
                  (dashboardData.sector_stats ?? [])
                }
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ sector, teacher_count, school, avg_lp_ratio, percent }) => {
                  if (percent > 0.08) {
                    return selectedSector ? 
                      `${school}\n${avg_lp_ratio?.toFixed(1)}%` :
                      `${sector}\n${teacher_count}`;
                  }
                  return '';
                }}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey={selectedSector ? "avg_lp_ratio" : "teacher_count"}
                animationDuration={1000}
                animationBegin={0}
                paddingAngle={2}
                onClick={selectedSector ? handleSchoolClick : handleSectorClick}
                style={{ cursor: 'pointer' }}
              >
                {(selectedSector ? 
                  (getFilteredData().school_stats?.slice(0, 8) || []) :
                  (dashboardData.sector_stats ?? [])
                ).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  if (selectedSector) {
                    return [`${props.payload.school}: ${value.toFixed(2)}%`, 'LP Ratio'];
                  }
                  return [`${props.payload.sector}: ${value} teachers`, 'Teacher Count'];
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => selectedSector ? entry.payload.school : entry.payload.sector}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LP Ratio by Sector */}
        <div className={styles.chartCard}>
          <h3><IoAnalyticsOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> LP Ratio by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={dashboardData.sector_stats ?? []}
              animationDuration={1000}
              animationBegin={0}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sector" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Average LP Ratio (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value.toFixed(2)}%`,
                  'LP Ratio'
                ]}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="avg_lp_ratio" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
                onClick={handleSectorClick}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* School Performance Trend */}
        <div className={styles.chartCard}>
          <h3><IoTrendingUpOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Top 10 Schools by LP Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart 
              data={dashboardData.school_stats?.slice(0, 10) ?? []}
              animationDuration={1000}
              animationBegin={0}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="school" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                label={{ value: 'LP Ratio (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value.toFixed(2)}%`,
                  'LP Ratio'
                ]}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="avg_lp_ratio" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                strokeWidth={2}
                onClick={handleSchoolClick}
                style={{ cursor: 'pointer' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Teacher Distribution Line Chart */}
        <div className={styles.chartCard}>
          <h3><IoPeopleOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Teacher & School Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={dashboardData.sector_stats ?? []}
              animationDuration={1000}
              animationBegin={0}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sector" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  value,
                  name === 'teacher_count' ? 'Teachers' : 'Schools'
                ]}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value, entry) => entry.dataKey === 'teacher_count' ? 'Teachers' : 'Schools'}
              />
              <Line 
                type="monotone" 
                dataKey="teacher_count" 
                stroke="#82ca9d" 
                strokeWidth={3}
                dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="school_count" 
                stroke="#ffc658" 
                strokeWidth={3}
                dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <div className={styles.recentMessages}>
          <h3><IoMailOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Recent Messages</h3>
          <div className={styles.messageList}>
            {dashboardData.recent_messages?.map((msg, index) => (
              <div key={index} className={styles.messageItem}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>{msg.sender}</span>
                  <span className={styles.receiver}>→ {msg.receiver}</span>
                  <span className={styles.school}>{msg.school_name}</span>
                  <span className={styles.timestamp}>{formatDateTime(msg.timestamp)}</span>
                </div>
                <div className={styles.messageText}>{msg.message_text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.recentConversations}>
          <h3><IoChatbubblesOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Recent Conversations</h3>
          <div className={styles.conversationList}>
            {dashboardData.recent_conversations?.map((conv, index) => (
              <div key={index} className={styles.conversationItem}>
                <div className={styles.conversationHeader}>
                  <span className={styles.school}>{conv.school_name}</span>
                  <span className={styles.participants}>
                    {conv.aeo} ↔ {conv.principal || 'No Principal'}
                  </span>
                  <span className={styles.timestamp}>{formatDateTime(conv.last_message_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Divider */}
        <div className={styles.sectionDivider}>
          <div className={styles.dividerLine}></div>
          <div className={styles.dividerTitle}>
            <span>User Activity Monitoring</span>
          </div>
          <div className={styles.dividerLine}></div>
        </div>

        {/* Login Timestamps Section */}
        <div className={styles.loginTimestampsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <div className={styles.titleIcon}>
                <IoTimeOutline />
              </div>
              <div className={styles.titleContent}>
                <h2>User Login Activity Monitor</h2>
                <p>Track and monitor all user login activities across the platform</p>
                <div className={styles.statsBadge}>
                  <span className={styles.badgeCount}>
                    {detailedData.login_timestamps?.pagination?.total_count || 0}
                  </span>
                  <span className={styles.badgeLabel}>Total Logins</span>
                </div>
              </div>
            </div>
            <div className={styles.sectionActions}>
              <div className={styles.actionGroup}>
                <button 
                  onClick={() => handleCSVExport()}
                  className={styles.exportButton}
                  title="Export to CSV"
                >
                  <IoDownloadOutline />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={() => setShowLoginTimestamps(prev => !prev)}
                  className={styles.toggleButton}
                  title="Toggle Login Monitor"
                >
                  {showLoginTimestamps ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </div>
            </div>
          </div>
          
          {showLoginTimestamps && (
            <div className={styles.loginTimestampsContent}>
              {detailedLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading login timestamps...</p>
                </div>
              ) : detailedData.login_timestamps ? (
                <div className={styles.tableContainer}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.loginTable}>
                      <thead>
                        <tr>
                          <th className={styles.userIdCol}>User ID</th>
                          <th className={styles.usernameCol}>Username</th>
                          <th className={styles.dateCol}>Date</th>
                          <th className={styles.timeCol}>Time</th>
                          <th className={styles.createdCol}>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedData.login_timestamps.data?.slice(0, 10).map((record, index) => (
                          <tr key={index} className={styles.tableRow}>
                            <td className={styles.userIdCell}>
                              <span className={styles.userIdBadge}>{record.user_id}</span>
                            </td>
                            <td className={styles.usernameCell}>
                              <span className={styles.usernameText}>{record.username}</span>
                            </td>
                            <td className={styles.dateCell}>
                              <span className={styles.dateBadge}>{record.date}</span>
                            </td>
                            <td className={styles.timeCell}>
                              <span className={styles.timeText}>{record.time}</span>
                            </td>
                            <td className={styles.createdCell}>
                              <span className={styles.createdText}>{formatDateTime(record.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <IoTimeOutline />
                  </div>
                  <h3>No Login Data Available</h3>
                  <p>Login timestamps will appear here once users start logging in</p>
                </div>
              )}
            </div>
          )}
          
          <div className={styles.loadMoreSection}>
            <button 
              onClick={() => {
                if (!detailedData.login_timestamps) {
                  loadDetailedData('login_timestamps');
                }
              }}
              className={styles.loadMoreButton}
            >
              <IoRefreshOutline />
              <span>Load Login Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailedDataTab = () => (
    <div className={styles.detailedDataTab}>
      <div className={styles.dataTypeSelector}>
        <button 
          className={`${styles.dataTypeBtn} ${activeTab === 'teachers' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('teachers');
            if (!detailedData.teachers) {
              loadDetailedData('teachers');
            }
          }}
        >
          <IoPeopleOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Teachers
        </button>
        <button 
          className={`${styles.dataTypeBtn} ${activeTab === 'schools' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('schools');
            if (!detailedData.schools) {
              loadDetailedData('schools');
            }
          }}
        >
          <IoSchoolOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Schools
        </button>
        <button 
          className={`${styles.dataTypeBtn} ${activeTab === 'conversations' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('conversations');
            if (!detailedData.conversations) {
              loadDetailedData('conversations');
            }
          }}
        >
          <IoChatbubblesOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Conversations
        </button>
        <button 
          className={`${styles.dataTypeBtn} ${activeTab === 'messages' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('messages');
            if (!detailedData.messages) {
              loadDetailedData('messages');
            }
          }}
        >
          <IoMailOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Messages
        </button>
        <button 
          className={`${styles.dataTypeBtn} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('users');
            if (!detailedData.users) {
              loadDetailedData('users');
            }
          }}
        >
          <IoPersonOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Users
        </button>
      </div>

      <div className={styles.dataTable}>
        {detailedLoading ? (
          <div className={styles.loading}>Loading data...</div>
        ) : (
          <>
            {activeTab === 'teachers' && detailedData.teachers && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('teacher')}>Teacher</th>
                    <th onClick={() => handleSortChange('school')}>School</th>
                    <th onClick={() => handleSortChange('sector')}>Sector</th>
                    <th onClick={() => handleSortChange('grade')}>Grade</th>
                    <th onClick={() => handleSortChange('subject')}>Subject</th>
                    <th onClick={() => handleSortChange('lp_ratio')}>LP Ratio</th>
                    <th onClick={() => handleSortChange('week_start')}>Week Start</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.teachers.data?.map((teacher, index) => (
                    <tr key={index}>
                      <td>{teacher.teacher}</td>
                      <td>{teacher.school}</td>
                      <td>{teacher.sector}</td>
                      <td>{teacher.grade}</td>
                      <td>{teacher.subject}</td>
                      <td style={{ color: getPerformanceColor(teacher.lp_ratio) }}>
                        {teacher.lp_ratio?.toFixed(2)}
                      </td>
                      <td>{formatDate(teacher.week_start)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'schools' && detailedData.schools && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('school_name')}>School</th>
                    <th onClick={() => handleSortChange('sector')}>Sector</th>
                    <th onClick={() => handleSortChange('emis')}>EMIS</th>
                    <th onClick={() => handleSortChange('teacher_count')}>Teachers</th>
                    <th onClick={() => handleSortChange('avg_lp_ratio')}>Avg LP Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.schools.data?.map((school, index) => (
                    <tr key={index}>
                      <td>{school.school_name}</td>
                      <td>{school.sector}</td>
                      <td>{school.emis}</td>
                      <td>{school.teacher_count}</td>
                      <td style={{ color: getPerformanceColor(school.avg_lp_ratio) }}>
                        {school.avg_lp_ratio?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'conversations' && detailedData.conversations && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('school_name')}>School</th>
                    <th onClick={() => handleSortChange('aeo')}>AEO</th>
                    <th onClick={() => handleSortChange('principal')}>Principal</th>
                    <th onClick={() => handleSortChange('created_at')}>Created</th>
                    <th onClick={() => handleSortChange('last_message_at')}>Last Message</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.conversations.data?.map((conv, index) => (
                    <tr key={index}>
                      <td>{conv.school_name}</td>
                      <td>{conv.aeo}</td>
                      <td>{conv.principal || 'No Principal'}</td>
                      <td>{formatDateTime(conv.created_at)}</td>
                      <td>{formatDateTime(conv.last_message_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'messages' && detailedData.messages && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('sender')}>Sender</th>
                    <th onClick={() => handleSortChange('receiver')}>Receiver</th>
                    <th onClick={() => handleSortChange('school_name')}>School</th>
                    <th onClick={() => handleSortChange('message_text')}>Message</th>
                    <th onClick={() => handleSortChange('timestamp')}>Timestamp</th>
                    <th onClick={() => handleSortChange('is_read')}>Read</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.messages.data?.map((msg, index) => (
                    <tr key={index}>
                      <td>{msg.sender}</td>
                      <td>{msg.receiver}</td>
                      <td>{msg.school_name}</td>
                      <td className={styles.messageCell}>{msg.message_text}</td>
                      <td>{formatDateTime(msg.timestamp)}</td>
                      <td>{msg.is_read ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && detailedData.users && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('username')}>Username</th>
                    <th onClick={() => handleSortChange('email')}>Email</th>
                    <th onClick={() => handleSortChange('role')}>Role</th>
                    <th onClick={() => handleSortChange('sector')}>Sector</th>
                    <th onClick={() => handleSortChange('school_name')}>School</th>
                    <th onClick={() => handleSortChange('date_joined')}>Joined</th>
                    <th onClick={() => handleSortChange('last_login')}>Last Login</th>
                    <th onClick={() => handleSortChange('is_active')}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.users.data?.map((user, index) => (
                    <tr key={index}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.sector}</td>
                      <td>{user.school_name}</td>
                      <td>{formatDateTime(user.date_joined)}</td>
                      <td>{user.last_login ? formatDateTime(user.last_login) : 'Never'}</td>
                      <td>{user.is_active ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}



                         {/* Pagination */}
             {detailedData[activeTab]?.pagination && (
               <div className={styles.pagination}>
                 <button 
                   onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                   disabled={currentPage === 1}
                 >
                   Previous
                 </button>
                 <span>
                   Page {currentPage} of {detailedData[activeTab].pagination.total_pages}
                 </span>
                 <button 
                   onClick={() => handlePageChange(currentPage + 1)}
                   disabled={currentPage >= detailedData[activeTab].pagination.total_pages}
                 >
                   Next
                 </button>
               </div>
             )}
          </>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${styles.adminDashboard} ${theme === 'dark' ? styles.dark : ''}`}>
        {/* Header */}
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
          <div className={styles.headerLeft}>
            <h1><IoBarChartOutline style={{ marginRight: '12px', verticalAlign: 'middle' }} /> Admin Dashboard</h1>
            <p><IoInformationCircleOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Comprehensive data overview with no restrictions</p>
            <div className={styles.updateIndicator}>
              <span className={styles.staticIndicator}></span>
              <IoRefreshOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Manual refresh only - data updates when database changes
            </div>
          </div>
          <div className={styles.headerRight}>
            <button 
              onClick={toggleMessagingSidebar}
              className={styles.messagesButton}
              title="View Messages"
            >
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
            <button 
              onClick={() => setShowMessagingModal(true)}
              className={styles.messagingButton}
              title="Send Broadcast Message"
            >
              <IoNotificationsOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Message All
            </button>
            <button 
              onClick={loadDashboardData} 
              className={styles.refreshButton}
              title="Refresh Data"
              disabled={loading}
            >
              {loading ? <IoTimeOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : <IoRefreshOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
            </button>
            <button onClick={toggleTheme} className={styles.themeToggle}>
              {theme === 'light' ? <IoMoonOutline /> : <IoSunnyOutline />}
            </button>
            <button 
              onClick={() => setPasswordChangeModalOpen(true)}
              style={{ 
                marginRight: '10px',
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
            <button onClick={onLogout} className={styles.logoutBtn}>
              <IoCloseCircleOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Logout
            </button>
          </div>
        </header>

        {/* Loading Content */}
        <div className={styles.loadingContent}>
          <div className={styles.loadingGrid}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}>
              <div className={styles.loadingTitle}>Total Schools</div>
              <div className={styles.loadingValue}>
                <div className={styles.smallLoadingSpinner}></div>
              </div>
            </div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}>
              <div className={styles.loadingTitle}>Total Teachers</div>
              <div className={styles.loadingValue}>
                <div className={styles.smallLoadingSpinner}></div>
              </div>
            </div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}>
              <div className={styles.loadingTitle}>Total Sectors</div>
              <div className={styles.loadingValue}>
                <div className={styles.smallLoadingSpinner}></div>
              </div>
            </div>
            <div className={`${styles.loadingCard} ${styles.loadingCard4}`}>
              <div className={styles.loadingTitle}>Avg LP Ratio</div>
              <div className={styles.loadingValue}>
                <div className={styles.smallLoadingSpinner}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminDashboard} ${theme === 'dark' ? styles.dark : ''}`}>
      {/* Header */}
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerLeft}>
          <h1><IoBarChartOutline style={{ marginRight: '12px', verticalAlign: 'middle' }} /> Admin Dashboard</h1>
          <p><IoInformationCircleOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Comprehensive data overview with no restrictions</p>
          <div className={styles.updateIndicator}>
            <span className={styles.staticIndicator}></span>
            <IoRefreshOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Manual refresh only - data updates when database changes
          </div>
          {(selectedSector || selectedSchool) && (
            <div className={styles.selectionIndicator}>
              <span className={styles.selectedItem}>
                {selectedSector && `Sector: ${selectedSector}`}
                {selectedSchool && `School: ${selectedSchool}`}
              </span>
              <button onClick={resetSelection} className={styles.clearSelection}>
                <IoCloseOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Clear
              </button>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={toggleMessagingSidebar}
            className={styles.messagesButton}
            title="View Messages"
          >
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
          <button 
            onClick={() => setShowMessagingModal(true)}
            className={styles.messagingButton}
            title="Send Broadcast Message"
          >
            <IoNotificationsOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Message All
          </button>
          <button 
            onClick={loadDashboardData} 
            className={styles.refreshButton}
            title="Refresh Data"
            disabled={loading}
          >
            {loading ? <IoTimeOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : <IoRefreshOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
          </button>
          <button onClick={toggleTheme} className={styles.themeToggle}>
                            {theme === 'light' ? <IoMoonOutline /> : <IoSunnyOutline />}
          </button>
          <button 
            onClick={() => setPasswordChangeModalOpen(true)}
            style={{ 
              marginRight: '10px',
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
          <button onClick={onLogout} className={styles.logoutBtn}>
            <IoCloseCircleOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Logout
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label><IoGridOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Sector:</label>
          <select 
            value={filters.sector} 
            onChange={(e) => handleFilterChange('sector', e.target.value)}
          >
            <option value="">All Sectors</option>
            {dashboardData.filter_options?.sectors?.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label><IoSchoolOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> School:</label>
          <select 
            value={filters.school} 
            onChange={(e) => handleFilterChange('school', e.target.value)}
          >
            <option value="">All Schools</option>
            {dashboardData.filter_options?.schools?.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label><IoBookOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Grade:</label>
          <select 
            value={filters.grade} 
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">All Grades</option>
            {dashboardData.filter_options?.grades?.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label><IoBookOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Subject:</label>
          <select 
            value={filters.subject} 
            onChange={(e) => handleFilterChange('subject', e.target.value)}
          >
            <option value="">All Subjects</option>
            {dashboardData.filter_options?.subjects?.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label><IoCalendarOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Date From:</label>
          <input 
            type="date" 
            value={filters.date_from} 
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label><IoCalendarOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Date To:</label>
          <input 
            type="date" 
            value={filters.date_to} 
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label><IoFilterOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Sort By:</label>
          <select 
            value={filters.sort_by} 
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
          >
            <option value="school">School</option>
            <option value="sector">Sector</option>
            <option value="lp_ratio">LP Ratio</option>
            <option value="date">Date</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label><IoArrowUpOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Order:</label>
          <select 
            value={filters.sort_order} 
            onChange={(e) => handleFilterChange('sort_order', e.target.value)}
          >
            <option value="asc">Low to High</option>
            <option value="desc">High to Low</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <IoBarChartOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'detailed' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('detailed');
            if (!detailedData[activeTab]) {
              loadDetailedData('teachers');
            }
          }}
        >
          <IoListOutline style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Detailed Data
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'detailed' && renderDetailedDataTab()}
      </div>

      {/* Admin Messaging Modal */}
      <AdminMessagingModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        theme={theme}
        onMessageSent={loadUnreadMessageCount}
      />

      {/* Messaging Sidebar */}
      <MessagingSidebar
        isOpen={messagingSidebarOpen}
        onClose={() => setMessagingSidebarOpen(false)}
        theme={theme}
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

export default AdminDashboard; 