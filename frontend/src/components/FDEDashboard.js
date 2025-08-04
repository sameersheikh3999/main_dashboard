import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';
import MessagingSidebar from './MessagingSidebar';
import styles from './FDEDashboard.module.css';
import { 
  IoSchoolOutline,
  IoPeopleOutline,
  IoBarChartOutline,
  IoAnalyticsOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoChatbubblesOutline,
  IoLogOutOutline,
  IoEyeOutline,
  IoFilterOutline,
  IoStatsChartOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoBookOutline,
  IoGridOutline,
  IoListOutline,
  IoRefreshOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';

// Global theme styles - will be applied via useEffect

const FDEDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({});
  const [schools, setSchools] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('All');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [theme, setTheme] = useState('light');
  const [sortFilter, setSortFilter] = useState('performance-low-high'); // Default: low to high performing
  const [emisFilter, setEmisFilter] = useState(''); // EMIS number filter
  const [messagingModal, setMessagingModal] = useState({
    isOpen: false,
    aeoId: null,
    aeoName: '',
    type: ''
  });
  const [messagingSidebarOpen, setMessagingSidebarOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Apply theme to body
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    document.body.style.transition = 'all 0.3s ease';
  }, [theme]);

  // Define the 6 sectors
  const sectorList = ['B.K', 'Nilore', 'Sihala', 'Tarnol', 'Urban-I', 'Urban-II'];

  // Map sector to AEO data (will be populated dynamically)
  const [sectorAEOMap, setSectorAEOMap] = useState({});

  useEffect(() => {
    loadData();
    loadAEOData();
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

  const loadAEOData = async () => {
    try {
      const aeoMap = {};
      for (const sector of sectorList) {
        try {
          const aeos = await apiService.getAEOsBySector(sector);
          if (aeos && aeos.length > 0) {
            // Use the first AEO for the sector
            aeoMap[sector] = aeos[0];
          }
        } catch (error) {
          console.error(`Error loading AEO data for sector ${sector}:`, error);
        }
      }
      setSectorAEOMap(aeoMap);
    } catch (error) {
      console.error('Error loading AEO data:', error);
    }
  };

  useEffect(() => {
    // Filter schools based on selected sector and EMIS filter
    let filtered = schools;
    
    // Apply sector filter
    if (selectedSector !== 'All') {
      filtered = filtered.filter(school => school.sector === selectedSector);
    }
    
    // Apply EMIS filter
    if (emisFilter.trim()) {
      filtered = filtered.filter(school => 
        school.emis && school.emis.toString().includes(emisFilter.trim())
      );
    }
    
    // Apply sorting based on sortFilter
    const sortedSchools = [...filtered].sort((a, b) => {
      switch (sortFilter) {
        case 'performance-low-high':
          return (a.avg_lp_ratio || 0) - (b.avg_lp_ratio || 0);
        case 'performance-high-low':
          return (b.avg_lp_ratio || 0) - (a.avg_lp_ratio || 0);
        case 'lp-low-high':
          return (a.avg_lp_ratio || 0) - (b.avg_lp_ratio || 0);
        case 'lp-high-low':
          return (b.avg_lp_ratio || 0) - (a.avg_lp_ratio || 0);
        case 'teachers-low-high':
          return (a.teacher_count || 0) - (b.teacher_count || 0);
        case 'teachers-high-low':
          return (b.teacher_count || 0) - (a.teacher_count || 0);
        case 'emis-asc':
          return (a.emis || 0) - (b.emis || 0);
        case 'emis-desc':
          return (b.emis || 0) - (a.emis || 0);
        case 'name-a-z':
          return (a.school_name || '').localeCompare(b.school_name || '');
        case 'name-z-a':
          return (b.school_name || '').localeCompare(a.school_name || '');
        default:
          return 0;
      }
    });
    
    setFilteredSchools(sortedSchools);
  }, [selectedSector, schools, sortFilter, emisFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch real summary stats, schools with infrastructure data, and filter options
      const [summaryStats, sectorSchools, filterOptions] = await Promise.all([
        apiService.getBigQuerySummaryStats(),
        apiService.getSchoolsWithInfrastructure(),
        apiService.getBigQueryFilterOptions()
      ]);
      setSummaryStats(summaryStats);
      setSchools(sectorSchools);
      setSectors(filterOptions.sectors || []);
    } catch (error) {
      console.error('Error loading FDE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectorClick = (sector) => {
    setSelectedSector(sector);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleMessagingSidebar = () => {
    setMessagingSidebarOpen(!messagingSidebarOpen);
  };

  const handleMessageSent = () => {
    // This will be called when a message is sent through the modal
    // The MessagingSidebar will handle its own refresh
    console.log('Message sent successfully');
    // Refresh unread message count
    loadUnreadMessageCount();
  };

  // Prepare sector distribution for PieChart - use lesson plan usage distribution
  const [lessonPlanDistribution, setLessonPlanDistribution] = useState([]);
  const [sectorLPData, setSectorLPData] = useState([]);
  
  // Load lesson plan usage distribution
  useEffect(() => {
    const loadLessonPlanDistribution = async () => {
      try {
        const response = await apiService.getLessonPlanUsageDistribution();
        setLessonPlanDistribution(response.distribution || []);
      } catch (error) {
        console.error('Error loading lesson plan distribution:', error);
        // Fallback to school count distribution
        const fallbackData = sectorList.map(sector => ({
          name: sector,
          value: schools.filter(s => s.sector === sector).length
        })).filter(item => item.value > 0);
        setLessonPlanDistribution(fallbackData);
      }
    };
    
    if (schools.length > 0) {
      loadLessonPlanDistribution();
    }
  }, [schools]);

  // Load sector LP data
  useEffect(() => {
    const loadSectorLPData = async () => {
      try {
        const response = await apiService.getSectorLPData();
        setSectorLPData(response || []);
      } catch (error) {
        console.error('Error loading sector LP data:', error);
        setSectorLPData([]);
      }
    };
    
    loadSectorLPData();
  }, []);
  
  // Use sector performance data for pie chart, fallback to lesson plan distribution
  const sectorCounts = sectorLPData.length > 0 ? 
    sectorLPData.map(sector => ({
      name: sector.sector,
      value: sector.avg_lp_ratio
    })).sort((a, b) => b.value - a.value) : // Sort high to low for pie chart
    lessonPlanDistribution.length > 0 ? 
      lessonPlanDistribution.map(item => ({
        name: item.sector,
        value: item.percentage
      })) : 
      sectorList.map(sector => ({
        name: sector,
        value: schools.filter(s => s.sector === sector).length
      })).filter(item => item.value > 0);
  
  const regionColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Calculate sector performance using the new sector LP data
  const sectorPerformance = sectorLPData.length > 0 ? 
    sectorLPData.map(sector => ({
      name: sector.sector,
      schoolCount: sector.school_count,
      avgLPRatio: sector.avg_lp_ratio,
      performanceScore: sector.avg_lp_ratio
    })).sort((a, b) => a.performanceScore - b.performanceScore) : // Sort low to high
    sectorList.map(sector => {
    const sectorSchools = schools.filter(s => s.sector === sector);
    const avgLPRatio = sectorSchools.length > 0 ? 
      sectorSchools.reduce((sum, school) => sum + (school.avg_lp_ratio || 0), 0) / sectorSchools.length : 0;
    
    return {
      name: sector,
      schoolCount: sectorSchools.length,
      avgLPRatio: avgLPRatio,
        performanceScore: avgLPRatio
    };
    }).filter(sector => sector.schoolCount > 0)
      .sort((a, b) => a.performanceScore - b.performanceScore); // Sort low to high

  const getPerformanceColor = (rank, total) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 33) return '#ef4444'; // Red for low performing
    if (percentage <= 66) return '#f59e0b'; // Yellow for medium performing
    return '#10b981'; // Green for high performing
  };

  const getPieChartColor = (lpRatio) => {
    // Color based on LP ratio performance using specific colors
    if (lpRatio >= 18.0) return '#14b8a6'; // Teal/Green for highest performing (18%+)
    if (lpRatio >= 17.5) return '#14b8a6'; // Teal/Green (17.5-17.99%)
    if (lpRatio >= 17.0) return '#14b8a6'; // Teal/Green (17.0-17.49%)
    if (lpRatio >= 16.5) return '#f97316'; // Orange (16.5-16.99%)
    if (lpRatio >= 16.0) return '#f97316'; // Orange (16.0-16.49%)
    if (lpRatio >= 15.5) return '#f97316'; // Orange (15.5-15.99%)
    if (lpRatio >= 15.0) return '#ef4444'; // Red (15.0-15.49%)
    if (lpRatio >= 14.5) return '#ef4444'; // Red (14.5-14.99%)
    if (lpRatio >= 14.0) return '#ef4444'; // Red (14.0-14.49%)
    return '#ef4444'; // Red for lowest performing (<14.0%)
  };

  if (loading) {
    return (
      <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
        <div className={`${styles.loadingSpinner} ${styles[theme]}`}>
          <IoRefreshOutline style={{ marginRight: '8px', fontSize: '20px', animation: 'spin 1s linear infinite' }} />
          Loading FDE Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
      
      <header className={styles.header}>
        <div className={`${styles.topBar} ${styles[theme]}`}>
          <div>
            <h1 className={styles.title}>
              <IoSchoolOutline style={{ marginRight: '12px', fontSize: '28px' }} />
              Federal Directorate of Education Dashboard
            </h1>
            <div className={`${styles.subtitle} ${styles[theme]}`}>
              <IoAnalyticsOutline style={{ marginRight: '8px', fontSize: '16px' }} />
              National oversight of educational performance and school management
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
            <IoSchoolOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Total Schools
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>{summaryStats.total_schools}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Under FDE Management</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoPeopleOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Total Teachers
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#8b5cf6' }}>{summaryStats.total_teachers}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Across All Schools</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoBarChartOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Total Sectors
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#3b82f6' }}>{summaryStats.total_sectors} 6 <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(AEO)</span></div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Educational Sectors</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>
            <IoStatsChartOutline style={{ marginRight: '8px', fontSize: '18px' }} />
            Avg LP Ratio
          </div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#f59e0b' }}>
            {sectorLPData.length > 0 ? 
              (sectorLPData.reduce((sum, sector) => sum + sector.avg_lp_ratio, 0) / sectorLPData.length).toFixed(2) :
              (summaryStats.overall_avg_lp_ratio || 0).toFixed(2)
            }%
          </div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>
            {sectorLPData.length > 0 ? 'Sector Average' : 'National Average'}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoBarChartOutline style={{ marginRight: '8px', fontSize: '20px' }} />
            Sector-Wise Lesson Plan Usage
          </h3>
          <ResponsiveContainer width="100%" height={350} style={{ marginTop: '50%',transform: 'translateY(-50%)' }}>
            <PieChart>
              <Pie
                data={sectorCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={40}
                label={({ name, value, percent }) => {
                  // Show label inside the pie slice if percentage is > 8%
                  if (percent > 0.08) {
                    return `${name}\n${value.toFixed(1)}%`;
                  }
                  return '';
                }}
                labelLine={false}
                paddingAngle={2}
              >
                {sectorCounts.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={getPieChartColor(entry.value)} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${entry.payload.name} (${entry.payload.value.toFixed(1)}%)`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoAnalyticsOutline style={{ marginRight: '8px', fontSize: '20px' }} />
            Sector Performance Ranking
            <span style={{ 
              fontSize: '0.9rem', 
              color: theme === 'dark' ? '#94a3b8' : '#64748b', 
              fontWeight: 'normal', 
              marginLeft: '8px' 
            }}>
              (Low to High Performing)
            </span>
          </h3>
          <div className={styles.sectorPerformanceList}>
            {sectorPerformance.map((sector, index) => {
              const performanceColor = getPerformanceColor(index + 1, sectorPerformance.length);
              return (
                <div 
                  key={sector.name} 
                  className={`${styles.sectorPerformanceItem} ${styles[theme]}`}
                  style={{ borderLeftColor: performanceColor }}
                >
                  <div className={styles.sectorInfo}>
                    <div className={styles.sectorRank} style={{ background: performanceColor }}>
                      {index + 1}
                    </div>
                    <div className={styles.sectorDetails}>
                      <div className={`${styles.sectorName} ${styles[theme]}`}>{sector.name}</div>
                      <div className={`${styles.sectorStats} ${styles[theme]}`}>
                        {sector.schoolCount} schools • Avg LP: {sector.avgLPRatio.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className={styles.sectorPerformance}>
                    <div className={styles.performanceScore} style={{ color: performanceColor }}>
                      {index === 0 ? (
                        <IoTrendingDownOutline style={{ marginRight: '4px', fontSize: '16px' }} />
                      ) : index === sectorPerformance.length - 1 ? (
                        <IoTrendingUpOutline style={{ marginRight: '4px', fontSize: '16px' }} />
                      ) : (
                        <IoInformationCircleOutline style={{ marginRight: '4px', fontSize: '16px' }} />
                      )}
                      {sector.performanceScore.toFixed(2)}%
                    </div>
                    <div className={`${styles.performanceLabel} ${styles[theme]}`}>
                      {index === 0 ? 'Lowest' : index === sectorPerformance.length - 1 ? 'Highest' : 'Medium'}
                    </div>
                    <button 
                      className={styles.askAEOButton}
                      onClick={() => {
                        const aeoData = sectorAEOMap[sector.name];
                        if (aeoData) {
                          setMessagingModal({ 
                            isOpen: true, 
                            aeoId: aeoData.id, 
                            aeoName: aeoData.display_name, 
                            type: 'sector' 
                          });
                        } else {
                          alert(`No AEO found for ${sector.name} sector`);
                        }
                      }}
                      disabled={!sectorAEOMap[sector.name]}
                    >
                      <IoChatbubblesOutline style={{ marginRight: '4px', fontSize: '16px' }} />
                      Ask AEO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Section: Detailed Sector LP Data */}
      {sectorLPData.length > 0 && (
        <div className={`${styles.fullWidthCard} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
            <IoStatsChartOutline style={{ marginRight: '8px', fontSize: '20px' }} />
            Sector LP Ratio Details
            <span style={{ 
              fontSize: '0.9rem', 
              color: theme === 'dark' ? '#94a3b8' : '#64748b', 
              fontWeight: 'normal', 
              marginLeft: '8px' 
            }}>
              (Based on Individual Teacher Performance)
            </span>
          </h3>
          <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {sectorLPData.map((sector, index) => {
              const performanceColor = getPerformanceColor(index + 1, sectorLPData.length);
              return (
                <div key={sector.sector} className={`${styles.card} ${styles[theme]}`} style={{ 
                  borderLeft: `4px solid ${performanceColor}`,
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      fontWeight: '600',
                      color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                    }}>
                      {sector.sector}
                    </h4>
                    <div style={{ 
                      background: performanceColor, 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      Rank #{index + 1}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        marginBottom: '5px'
                      }}>
                        Average LP Ratio
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700',
                        color: performanceColor
                      }}>
                        {sector.avg_lp_ratio.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        marginBottom: '5px'
                      }}>
                        Total Teachers
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700',
                        color: theme === 'dark' ? '#e2e8f0' : '#475569'
                      }}>
                        {sector.teacher_count}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    marginBottom: '15px'
                  }}>
                    {sector.school_count} schools in this sector
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: theme === 'dark' ? '#64748b' : '#94a3b8',
                    fontStyle: 'italic'
                  }}>
                    Based on {sector.teacher_count} individual teacher LP ratios
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      <div className={`${styles.fullWidthCard} ${styles[theme]}`}>
        <div className={`${styles.schoolsHeader} ${styles[theme]}`}>
          <div className={styles.schoolsTitleSection}>
            <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
              <IoSchoolOutline style={{ marginRight: '8px', fontSize: '20px' }} />
              {selectedSector === 'All' ? 'All Schools' : `${selectedSector} Sector Schools`}
              <span style={{ 
                fontSize: '0.9rem', 
                color: theme === 'dark' ? '#94a3b8' : '#64748b', 
                fontWeight: 'normal', 
                marginLeft: '8px' 
              }}>
                ({filteredSchools.length} schools)
              </span>
        </h3>
            <div className={`${styles.sectorFilterSection} ${styles[theme]}`}>
        <div className={styles.sectorButtonsRow}>
          <button 
            className={`${styles.sectorButton} ${styles[theme]} ${selectedSector === 'All' ? styles.active : ''}`}
            onClick={() => handleSectorClick('All')}
          >
            All
          </button>
          {sectorList.map(sector => (
            <button 
              key={sector}
              className={`${styles.sectorButton} ${styles[theme]} ${selectedSector === sector ? styles.active : ''}`}
              onClick={() => handleSectorClick(sector)}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>
          </div>
          <div className={styles.schoolsFilterSection}>
            <div className={styles.emisFilterContainer}>
              <input
                type="text"
                placeholder="Filter by EMIS No..."
                value={emisFilter}
                onChange={(e) => setEmisFilter(e.target.value)}
                className={`${styles.emisFilterInput} ${styles[theme]}`}
              />
            </div>
            <div className={styles.sortSelectContainer}>
              <select 
                className={`${styles.sortSelect} ${styles[theme]}`}
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
              >
                <option value="performance-low-high">Low to High Performing</option>
                <option value="performance-high-low">High to Low Performing</option>
                <option value="lp-low-high">Low to High LP Ratio</option>
                <option value="lp-high-low">High to Low LP Ratio</option>
                <option value="teachers-low-high">Low to High Teacher Count</option>
                <option value="teachers-high-low">High to Low Teacher Count</option>
                <option value="emis-asc">EMIS Ascending</option>
                <option value="emis-desc">EMIS Descending</option>
                <option value="name-a-z">Name A-Z</option>
                <option value="name-z-a">Name Z-A</option>
              </select>
            </div>
          </div>
        </div>
        <div className={`${styles.schoolsTable} ${styles[theme]}`}>
          <table className={`${styles.schoolsTableElement} ${styles[theme]}`}>
            <thead>
              <tr className={`${styles.tableHeader} ${styles[theme]}`}>
                <th>EMIS No</th>
                <th>School Name</th>
                <th>Avg LP</th>
                <th>Total Teachers</th>
                <th>Internet Availability</th>
                <th>Student Teacher Ratio</th>
                <th>Active Status</th>
              </tr>
            </thead>
            <tbody>
            {filteredSchools.map(school => {
              const avgLP = school.avg_lp_ratio || 0;
              const isActive = avgLP > 10;
              return (
                  <tr key={school.emis} className={`${styles.tableRow} ${styles[theme]} ${!isActive ? styles.inactive : ''}`}>
                    <td className={styles.emisCell}>{school.emis}</td>
                    <td className={styles.schoolNameCell}>
                      {school.school_name}
                      <span className={styles.sectorTag}>({school.sector})</span>
                    </td>
                    <td className={styles.avgLpCell}>{avgLP.toFixed(2)}%</td>
                    <td className={styles.teacherCell}>{school.teacher_count || 0}</td>
                    <td className={styles.internetCell}>
                      <span className={`${styles.internetBadge} ${school.internet_availability === 'Yes' ? styles.available : styles.notAvailable}`}>
                        {school.internet_availability || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.ratioCell}>{school.student_teacher_ratio || 'N/A'}</td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
                    {isActive ? (
                      <>
                        <IoCheckmarkCircleOutline style={{ marginRight: '4px', fontSize: '14px' }} />
                        Active
                      </>
                    ) : (
                      <>
                        <IoCloseCircleOutline style={{ marginRight: '4px', fontSize: '14px' }} />
                        Inactive
                      </>
                    )}
                  </span>
                    </td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messaging Modal (if needed) */}
      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={() => setMessagingModal({ ...messagingModal, isOpen: false })}
        schoolName={messagingModal.aeoName}
        schoolData={{ id: messagingModal.aeoId, name: messagingModal.aeoName }}
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

export default FDEDashboard; 