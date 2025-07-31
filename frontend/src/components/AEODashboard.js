import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';
import MessagingSidebar from './MessagingSidebar';

// Global theme styles
const GlobalStyle = createGlobalStyle`
  body {
    background: ${props => props.theme === 'dark' ? '#0f172a' : '#f8fafc'};
    color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
    transition: all 0.3s ease;
  }
`;

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  background: ${props => props.theme === 'dark' ? '#0f172a' : '#f8fafc'};
  transition: all 0.3s ease;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  position: relative;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'};
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
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

const Subtitle = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 1rem;
  font-weight: 500;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ThemeToggleBtn = styled.button`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(71, 85, 105, 0.8)' : 'rgba(241, 245, 249, 0.9)'};
    transform: translateY(-1px);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
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
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const SummaryCard = styled.div`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)'};
  }
`;

const SummaryTitle = styled.h3`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
`;

const SummarySub = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.85rem;
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme === 'dark' ? '0 6px 25px rgba(0,0,0,0.35)' : '0 6px 25px rgba(0,0,0,0.1)'};
  }
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FullWidthCard = styled.div`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 16px;
  padding: 24px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  margin-bottom: 32px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme === 'dark' ? '0 6px 25px rgba(0,0,0,0.35)' : '0 6px 25px rgba(0,0,0,0.1)'};
  }
`;

const SchoolsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme === 'dark' ? '#334155' : '#f1f5f9'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'dark' ? '#64748b' : '#cbd5e1'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme === 'dark' ? '#94a3b8' : '#94a3b8'};
  }
`;

const SchoolItem = styled.li`
  padding: 12px 16px;
  margin-bottom: 8px;
  background: ${props => props.inactive
    ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
    : props.theme === 'dark'
      ? 'rgba(51, 65, 85, 0.5)'
      : 'rgba(248, 250, 252, 0.8)'};
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  transition: all 0.2s ease;
  color: ${props => props.inactive ? '#fff' : 'inherit'};
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${props => props.theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'};
  }
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

const StatusTag = styled.span`
  display: inline-block;
  margin-left: 12px;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: ${props => props.active ? 'linear-gradient(90deg, #10b981 0%, #22d3ee 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  letter-spacing: 0.5px;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 80px 40px;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 1.1rem;
  font-weight: 500;
  
  &::before {
    content: '⏳';
    display: block;
    font-size: 3rem;
    margin-bottom: 16px;
    animation: spin 2s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const AskPrincipalButton = styled.button`
  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  margin-left: 18px;
  box-shadow: 0 2px 8px rgba(59,130,246,0.08);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(59,130,246,0.18);
  }
`;

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

  useEffect(() => {
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user'));
    console.log('Current user from localStorage:', currentUser);
    setUser(currentUser);
    setUserSector(currentUser?.profile?.sector || '');
    loadData();
  }, []);

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

      // Fetch data filtered by sector
      const [summary, allSchools] = await Promise.all([
        apiService.getBigQuerySummaryStats({ sector: sector }),
        apiService.getBigQueryAllSchools()
      ]);

      // Filter schools by sector
      const sectorSchools = allSchools.filter(school => school.sector === sector);
      
      console.log('Filtered schools for sector:', sector, 'Count:', sectorSchools.length);
      
      // Calculate sector-specific metrics
      const totalSchoolsInSector = sectorSchools.length;
      
      // Calculate average LP ratio for the sector
      const schoolsWithLP = sectorSchools.filter(school => school.avg_lp_ratio !== null && school.avg_lp_ratio !== undefined);
      const totalLP = schoolsWithLP.reduce((sum, school) => sum + (school.avg_lp_ratio || 0), 0);
      const avgLPRatio = schoolsWithLP.length > 0 ? totalLP / schoolsWithLP.length : 0;
      
      console.log('Sector metrics:', {
        totalSchools: totalSchoolsInSector,
        schoolsWithLP: schoolsWithLP.length,
        totalLP: totalLP,
        avgLPRatio: avgLPRatio
      });
      
      // Update summary stats with sector-specific calculations
      const sectorSummaryStats = {
        ...summary,
        total_schools: totalSchoolsInSector,
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

  const getPerformanceColor = (score) => {
    if (score < 30) return '#ef4444'; // Red
    if (score < 70) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  if (loading) {
    return (
      <DashboardContainer theme={theme}>
        <GlobalStyle theme={theme} />
        <LoadingSpinner theme={theme}>
          Loading {userSector} Sector Dashboard...
        </LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer theme={theme}>
      <GlobalStyle theme={theme} />
      
      <Header>
        <TopBar theme={theme}>
          <div>
            <Title>{userSector} Sector - AEO Dashboard</Title>
            <Subtitle theme={theme}>
              Sector-specific oversight of educational performance and school management
            </Subtitle>
          </div>
          <HeaderActions>
            <MessagingBtn onClick={toggleMessagingSidebar}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
              </svg>
              Messages
            </MessagingBtn>
            <ThemeToggleBtn theme={theme} onClick={toggleTheme}>
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
            </ThemeToggleBtn>
            <LogoutBtn onClick={onLogout}>Logout</LogoutBtn>
          </HeaderActions>
        </TopBar>
      </Header>

      <SummaryGrid>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)">
          <SummaryTitle theme={theme}>Total Schools</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#10b981' }}>{summaryStats.total_schools || schools.length}</SummaryValue>
          <SummarySub theme={theme}>In {userSector} Sector</SummarySub>
        </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
          <SummaryTitle theme={theme}>Total Teachers</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#8b5cf6' }}>{summaryStats.total_teachers || 0}</SummaryValue>
          <SummarySub theme={theme}>Across {userSector} Schools</SummarySub>
        </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
          <SummaryTitle theme={theme}>Sector Avg LP Ratio</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#3b82f6' }}>{summaryStats.overall_avg_lp_ratio ? `${summaryStats.overall_avg_lp_ratio.toFixed(1)}%` : '0%'}</SummaryValue>
          <SummarySub theme={theme}>Learning Progress Average</SummarySub>
        </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
          <SummaryTitle theme={theme}>Active Schools</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#f59e0b' }}>{schools.filter(school => (school.avg_lp_ratio || 0) > 10).length}</SummaryValue>
          <SummarySub theme={theme}>High Performance Schools</SummarySub>
        </SummaryCard>
      </SummaryGrid>

      <Grid>
        <Card theme={theme}>
          <SectionTitle theme={theme}>
            📊 Sector Performance Overview
          </SectionTitle>
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
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="avg_lp_ratio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme}>
          <SectionTitle theme={theme}>
            🎯 Performance Distribution
          </SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'High Performance (>10%)', value: schools.filter(s => (s.avg_lp_ratio || 0) > 10).length, color: '#10b981' },
                  { name: 'Medium Performance (5-10%)', value: schools.filter(s => (s.avg_lp_ratio || 0) >= 5 && (s.avg_lp_ratio || 0) <= 10).length, color: '#f59e0b' },
                  { name: 'Low Performance (<5%)', value: schools.filter(s => (s.avg_lp_ratio || 0) < 5).length, color: '#ef4444' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {[
                  { name: 'High Performance (>10%)', value: schools.filter(s => (s.avg_lp_ratio || 0) > 10).length, color: '#10b981' },
                  { name: 'Medium Performance (5-10%)', value: schools.filter(s => (s.avg_lp_ratio || 0) >= 5 && (s.avg_lp_ratio || 0) <= 10).length, color: '#f59e0b' },
                  { name: 'Low Performance (<5%)', value: schools.filter(s => (s.avg_lp_ratio || 0) < 5).length, color: '#ef4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  background: theme === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <FullWidthCard theme={theme}>
        <SectionTitle theme={theme}>
          🏫 {userSector} Sector Schools (Low to High Performance)
          <span style={{ 
            fontSize: '0.9rem', 
            color: theme === 'dark' ? '#94a3b8' : '#64748b', 
            fontWeight: 'normal', 
            marginLeft: '8px' 
          }}>
            ({schools.length} schools)
          </span>
        </SectionTitle>
        <SchoolsList theme={theme}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {schools
              .sort((a, b) => (a.avg_lp_ratio || 0) - (b.avg_lp_ratio || 0)) // Sort from low to high performance
              .map(school => {
                const avgLP = school.avg_lp_ratio || 0;
                const isActive = avgLP > 10;
                return (
                  <SchoolItem key={school.emis} theme={theme} inactive={!isActive}>
                    <div>
                      {school.school_name}
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        marginLeft: '8px'
                      }}>
                        (EMIS: {school.emis})
                      </span>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: theme === 'dark' ? '#94a3b8' : '#64748b',
                        marginLeft: '8px',
                        fontWeight: 'bold'
                      }}>
                        - LP: {avgLP.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StatusTag active={isActive}>{isActive ? 'Active' : 'Inactive'}</StatusTag>
                      <AskPrincipalButton onClick={() => setMessagingModal({ 
                        isOpen: true, 
                        principalId: `principal_${school.emis}`, 
                        schoolName: school.school_name, 
                        type: 'school' 
                      })}>
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
                        </svg>
                        Ask Principal
                      </AskPrincipalButton>
                    </div>
                  </SchoolItem>
                );
              })}
          </ul>
        </SchoolsList>
      </FullWidthCard>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={() => setMessagingModal({ ...messagingModal, isOpen: false })}
        schoolName={messagingModal.schoolName}
        schoolData={{ id: messagingModal.principalId, name: messagingModal.schoolName }}
      />

      {/* Messaging Sidebar */}
      <MessagingSidebar
        isOpen={messagingSidebarOpen}
        onClose={() => setMessagingSidebarOpen(false)}
        theme={theme}
      />
    </DashboardContainer>
  );
};

export default AEODashboard; 