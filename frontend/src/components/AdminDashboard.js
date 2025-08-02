import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { apiService } from '../services/api';
import styles from './AdminDashboard.module.css';

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
  const [pageSize, setPageSize] = useState(50);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    document.body.style.transition = 'all 0.3s ease';
  }, [theme]);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);



  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDashboardData = async () => {
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
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedData = async (dataType) => {
    setDetailedLoading(true);
    try {
      const data = await apiService.getAdminDetailedData(dataType, {
        ...filters,
        page: currentPage,
        page_size: pageSize
      });
      setDetailedData(prev => ({ ...prev, [dataType]: data }));
    } catch (error) {
      console.error(`Error loading ${dataType} data:`, error);
    } finally {
      setDetailedLoading(false);
    }
  };





  const handleSectorClick = (data) => {
    if (data && data.sector) {
      setSelectedSector(data.sector);
      setSelectedSchool(null);
      // Filter data for the selected sector
      const sectorData = dashboardData.school_stats?.filter(school => 
        school.sector === data.sector
      ) || [];
      console.log(`Selected sector: ${data.sector}`, sectorData);
    }
  };

  const handleSchoolClick = (data) => {
    if (data && data.school) {
      setSelectedSchool(data.school);
      console.log(`Selected school: ${data.school}`, data);
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

  const renderOverviewTab = () => (
    <div className={styles.overviewTab}>
      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Teachers</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_teachers ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Schools</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_schools ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_users ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Sectors</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_sectors ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Conversations</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_conversations ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Messages</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_messages ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Average LP Ratio</h3>
                          <p className={styles.statNumber}>{(dashboardData.stats?.avg_lp_ratio ?? 0).toFixed(2)}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total AEOs</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_aeos ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Principals</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_principals ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total FDEs</h3>
                          <p className={styles.statNumber}>{dashboardData.stats?.total_fdes ?? 0}</p>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedSector || selectedSchool) && (
        <div className={styles.selectionSummary}>
          <div className={styles.summaryCard}>
            <h3>📊 Selection Details</h3>
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
                ← Back to All Sectors
              </button>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
                  if (percent > 5) {
                    return selectedSector ? 
                      `${school}\n${avg_lp_ratio?.toFixed(1)}%` :
                      `${sector}\n${teacher_count}`;
                  }
                  return '';
                }}
                outerRadius={80}
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
          <h3>LP Ratio by Sector</h3>
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
          <h3>Top 10 Schools by LP Ratio</h3>
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
          <h3>Teacher & School Distribution</h3>
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
          <h3>Recent Messages</h3>
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
          <h3>Recent Conversations</h3>
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
          Teachers
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
          Schools
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
          Conversations
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
          Messages
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
          Users
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
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminDashboard} ${theme === 'dark' ? styles.dark : ''}`}>
      {/* Header */}
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerLeft}>
          <h1>Admin Dashboard</h1>
          <p>Comprehensive data overview with no restrictions</p>
          <div className={styles.updateIndicator}>
            <span className={styles.staticIndicator}></span>
            Manual refresh only - data updates when database changes
          </div>
          {(selectedSector || selectedSchool) && (
            <div className={styles.selectionIndicator}>
              <span className={styles.selectedItem}>
                {selectedSector && `Sector: ${selectedSector}`}
                {selectedSchool && `School: ${selectedSchool}`}
              </span>
              <button onClick={resetSelection} className={styles.clearSelection}>
                ✕ Clear
              </button>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={loadDashboardData} 
            className={styles.refreshButton}
            title="Refresh Data"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'}
          </button>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={onLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Sector:</label>
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
          <label>School:</label>
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
          <label>Grade:</label>
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
          <label>Subject:</label>
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
          <label>Date From:</label>
          <input 
            type="date" 
            value={filters.date_from} 
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Date To:</label>
          <input 
            type="date" 
            value={filters.date_to} 
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Sort By:</label>
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
          <label>Order:</label>
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
          Overview
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
          Detailed Data
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'detailed' && renderDetailedDataTab()}
      </div>
    </div>
  );
};

export default AdminDashboard; 