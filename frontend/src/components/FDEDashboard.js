import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';
import MessagingSidebar from './MessagingSidebar';
import styles from './FDEDashboard.module.css';

// Global theme styles - will be applied via useEffect

const FDEDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({});
  const [schools, setSchools] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('All');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [theme, setTheme] = useState('light');
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
    // Filter schools based on selected sector
    if (selectedSector === 'All') {
      setFilteredSchools(schools);
    } else {
      setFilteredSchools(schools.filter(school => school.sector === selectedSector));
    }
  }, [selectedSector, schools]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch real summary stats and all schools/sectors
      const [summary, allSchools, filterOptions] = await Promise.all([
          apiService.getBigQuerySummaryStats({}),
        apiService.getBigQueryAllSchools(),
        apiService.getBigQueryFilterOptions()
      ]);
      setSummaryStats(summary);
      setSchools(allSchools);
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

  // Prepare sector distribution for PieChart
  const sectorCounts = sectors.map(sector => ({
    name: sector,
    value: schools.filter(s => s.sector === sector).length
  }));
  const regionColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Calculate sector performance (mock data for now - you can replace with real metrics)
  const sectorPerformance = sectorList.map(sector => {
    const sectorSchools = schools.filter(s => s.sector === sector);
    const avgLPRatio = sectorSchools.length > 0 ? 
      sectorSchools.reduce((sum, school) => sum + (school.avg_lp_ratio || 0), 0) / sectorSchools.length : 0;
    
    return {
      name: sector,
      schoolCount: sectorSchools.length,
      avgLPRatio: avgLPRatio,
      performanceScore: Math.round(avgLPRatio * 100) / 100
    };
  }).sort((a, b) => a.performanceScore - b.performanceScore); // Sort low to high

  const getPerformanceColor = (rank, total) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 33) return '#ef4444'; // Red for low performing
    if (percentage <= 66) return '#f59e0b'; // Yellow for medium performing
    return '#10b981'; // Green for high performing
  };

  if (loading) {
    return (
      <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
        <div className={`${styles.loadingSpinner} ${styles[theme]}`}>Loading FDE Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} ${styles[theme]}`}>
      
      <header className={styles.header}>
        <div className={`${styles.topBar} ${styles[theme]}`}>
          <div>
            <h1 className={styles.title}>Federal Directorate of Education Dashboard</h1>
            <div className={`${styles.subtitle} ${styles[theme]}`}>
              National oversight of educational performance and school management
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
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#10b981' }}>{summaryStats.total_schools}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Under FDE Management</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Total Teachers</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#8b5cf6' }}>{summaryStats.total_teachers}</div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Across All Schools</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Total Sectors</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#3b82f6' }}>{summaryStats.total_sectors} 6 <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(AEO)</span></div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>Educational Sectors</div>
        </div>
        <div className={`${styles.summaryCard} ${styles[theme]}`}>
          <div className={`${styles.summaryTitle} ${styles[theme]}`}>Avg LP Ratio</div>
          <div className={`${styles.summaryValue} ${styles[theme]}`} style={{ color: '#f59e0b' }}>
            {Math.round(summaryStats.overall_avg_lp_ratio || 0)}%
          </div>
          <div className={`${styles.summarySub} ${styles[theme]}`}>National Average</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>Sector Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sectorCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {sectorCounts.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={regionColors[idx % regionColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={`${styles.card} ${styles[theme]}`}>
          <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
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
                        {sector.schoolCount} schools • Avg LP: {sector.avgLPRatio.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className={styles.sectorPerformance}>
                    <div className={styles.performanceScore} style={{ color: performanceColor }}>
                      {sector.performanceScore}%
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
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/></svg>
                      Ask AEO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={`${styles.sectorFilterContainer} ${styles[theme]}`}>
        <h3 className={`${styles.sectorFilterTitle} ${styles[theme]}`}>Filter by Sector (AEO)</h3>
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
      
      <div className={`${styles.fullWidthCard} ${styles[theme]}`}>
        <h3 className={`${styles.sectionTitle} ${styles[theme]}`}>
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
        <div className={`${styles.schoolsList} ${styles[theme]}`}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredSchools.map(school => {
              const avgLP = school.avg_lp_ratio || 0;
              const isActive = avgLP > 10;
              return (
                <li key={school.emis} className={`${styles.schoolItem} ${styles[theme]} ${!isActive ? styles.inactive : ''}`}>
                  {school.school_name} ({school.sector})
                  <span className={`${styles.statusTag} ${isActive ? styles.active : styles.inactive}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              );
            })}
          </ul>
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