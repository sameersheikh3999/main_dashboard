import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line
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
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'};
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#475569'};
  border: 2px solid ${props => props.theme === 'dark' ? '#475569' : '#cbd5e1'};
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const LogoutBtn = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  }
`;

const SectorFilterContainer = styled.div`
  margin-bottom: 32px;
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  padding: 24px;
  border-radius: 16px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
`;

const SectorFilterTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f1f5f9' : '#1e293b'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '🎯';
    font-size: 1.2rem;
  }
`;

const SectorButtonsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const SectorButton = styled.button`
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
    : props.theme === 'dark' 
      ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  };
  color: ${props => props.active ? '#ffffff' : props.theme === 'dark' ? '#e2e8f0' : '#475569'};
  border: 2px solid ${props => props.active ? '#3b82f6' : props.theme === 'dark' ? '#475569' : '#cbd5e1'};
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 90px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 0.9rem;
    min-width: 80px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  border-radius: 16px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.gradient || 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'};
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)'};
  }
`;

const SummaryTitle = styled.div`
  font-size: 0.95rem;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-weight: 600;
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  margin: 8px 0;
  color: ${props => props.theme === 'dark' ? '#f1f5f9' : '#1e293b'};
`;

const SummarySub = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme === 'dark' ? '#64748b' : '#94a3b8'};
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  border-radius: 16px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  padding: 28px;
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.theme === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)'};
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: ${props => props.theme === 'dark' ? '#f1f5f9' : '#1e293b'};
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: '📊';
    font-size: 1.2rem;
  }
`;

const FullWidthCard = styled.div`
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  border-radius: 16px;
  box-shadow: ${props => props.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'};
  padding: 28px;
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  transition: all 0.3s ease;
  margin-bottom: 32px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.theme === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.12)'};
  }
`;

const SectorPerformanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectorPerformanceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
  border-radius: 12px;
  border-left: 4px solid ${props => props.performanceColor};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
    transform: translateX(4px);
  }
`;

const SectorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectorRank = styled.div`
  background: ${props => props.performanceColor};
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
`;

const SectorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectorName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f1f5f9' : '#1e293b'};
  font-size: 1rem;
`;

const SectorStats = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.85rem;
  margin-top: 2px;
`;

const SectorPerformance = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const PerformanceScore = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${props => props.performanceColor};
`;

const PerformanceLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SchoolsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.95rem;
  padding-right: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme === 'dark' ? '#334155' : '#f1f5f9'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'dark' ? '#64748b' : '#cbd5e1'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme === 'dark' ? '#94a3b8' : '#94a3b8'};
  }
`;

const SchoolItem = styled.li`
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.inactive ? 'red' : 'transparent'};
  border-radius: 8px;
  border-left: 4px solid ${props => props.inactive
    ? props.theme === 'dark'
      ? '#ef4444'
      : '#e2e8f0'
    : 'transparent'};
  transition: all 0.2s ease;
  color: ${props => props.inactive ? '#333' : 'inherit'};
  
  &:hover {
    background: ${props => props.inactive
      ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
      : props.theme === 'dark' 
        ? 'rgba(59, 130, 246, 0.1)' 
        : 'rgba(59, 130, 246, 0.05)'};
    transform: translateX(4px);
    color: ${props => props.inactive ? '#fff' : 'inherit'};
  }
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

const AskAEOButton = styled.button`
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
  position: relative;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(59,130,246,0.18);
  }
`;

const MessageCountBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: ${props => props.hasUnread ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

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
      <DashboardContainer theme={theme}>
        <GlobalStyle theme={theme} />
        <LoadingSpinner theme={theme}>Loading FDE Dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer theme={theme}>
      <GlobalStyle theme={theme} />
      
      <Header>
        <TopBar theme={theme}>
          <div>
          <Title>Federal Directorate of Education Dashboard</Title>
            <Subtitle theme={theme}>
              National oversight of educational performance and school management
            </Subtitle>
          </div>
          <HeaderActions>
            <MessagingBtn onClick={toggleMessagingSidebar}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8zm-9 4h.01M12 16h.01"/>
              </svg>
              Messages
              {unreadMessageCount > 0 && (
                <MessageCountBadge hasUnread={unreadMessageCount > 0}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </MessageCountBadge>
              )}
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
          <SummaryValue theme={theme} style={{ color: '#10b981' }}>{summaryStats.total_schools}</SummaryValue>
          <SummarySub theme={theme}>Under FDE Management</SummarySub>
         </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
          <SummaryTitle theme={theme}>Total Teachers</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#8b5cf6' }}>{summaryStats.total_teachers}</SummaryValue>
          <SummarySub theme={theme}>Across All Schools</SummarySub>
        </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
          <SummaryTitle theme={theme}>Total Sectors</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#3b82f6' }}>{summaryStats.total_sectors}</SummaryValue>
          <SummarySub theme={theme}>Educational Sectors</SummarySub>
        </SummaryCard>
        <SummaryCard theme={theme} gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
          <SummaryTitle theme={theme}>Avg LP Ratio</SummaryTitle>
          <SummaryValue theme={theme} style={{ color: '#f59e0b' }}>
            {Math.round(summaryStats.overall_avg_lp_ratio || 0)}%
          </SummaryValue>
          <SummarySub theme={theme}>National Average</SummarySub>
        </SummaryCard>
      </SummaryGrid>

      <Grid>
        <Card theme={theme}>
          <SectionTitle theme={theme}>Sector Distribution</SectionTitle>
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
        </Card>
        <Card theme={theme}>
          <SectionTitle theme={theme}>
            Sector Performance Ranking
            <span style={{ 
              fontSize: '0.9rem', 
              color: theme === 'dark' ? '#94a3b8' : '#64748b', 
              fontWeight: 'normal', 
              marginLeft: '8px' 
            }}>
              (Low to High Performing)
            </span>
          </SectionTitle>
          <SectorPerformanceList>
            {sectorPerformance.map((sector, index) => {
              const performanceColor = getPerformanceColor(index + 1, sectorPerformance.length);
              return (
                <SectorPerformanceItem 
                  key={sector.name} 
                  theme={theme}
                  performanceColor={performanceColor}
                >
                  <SectorInfo>
                    <SectorRank performanceColor={performanceColor}>
                      {index + 1}
                    </SectorRank>
                    <SectorDetails>
                      <SectorName theme={theme}>{sector.name}</SectorName>
                      <SectorStats theme={theme}>
                        {sector.schoolCount} schools • Avg LP: {sector.avgLPRatio.toFixed(1)}%
                      </SectorStats>
                    </SectorDetails>
                  </SectorInfo>
                  <SectorPerformance>
                    <PerformanceScore performanceColor={performanceColor}>
                      {sector.performanceScore}%
                    </PerformanceScore>
                    <PerformanceLabel theme={theme}>
                      {index === 0 ? 'Lowest' : index === sectorPerformance.length - 1 ? 'Highest' : 'Medium'}
                    </PerformanceLabel>
                    <AskAEOButton 
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
                    </AskAEOButton>
                  </SectorPerformance>
                </SectorPerformanceItem>
              );
            })}
          </SectorPerformanceList>
        </Card>
      </Grid>
      <SectorFilterContainer theme={theme}>
        <SectorFilterTitle theme={theme}>Filter by Sector (AEO)</SectorFilterTitle>
        <SectorButtonsRow>
          <SectorButton 
            theme={theme}
            active={selectedSector === 'All'} 
            onClick={() => handleSectorClick('All')}
          >
            All
          </SectorButton>
          {sectorList.map(sector => (
            <SectorButton 
              key={sector}
              theme={theme}
              active={selectedSector === sector} 
              onClick={() => handleSectorClick(sector)}
            >
              {sector}
            </SectorButton>
          ))}
        </SectorButtonsRow>
      </SectorFilterContainer>
      
      <FullWidthCard theme={theme}>
        <SectionTitle theme={theme}>
          {selectedSector === 'All' ? 'All Schools' : `${selectedSector} Sector Schools`}
          <span style={{ 
            fontSize: '0.9rem', 
            color: theme === 'dark' ? '#94a3b8' : '#64748b', 
            fontWeight: 'normal', 
            marginLeft: '8px' 
          }}>
            ({filteredSchools.length} schools)
          </span>
        </SectionTitle>
        <SchoolsList theme={theme}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredSchools.map(school => {
              const avgLP = school.avg_lp_ratio || 0;
              const isActive = avgLP > 10;
              return (
                <SchoolItem key={school.emis} theme={theme} inactive={!isActive}>
                  {school.school_name} ({school.sector})
                  <StatusTag active={isActive}>{isActive ? 'Active' : 'Inactive'}</StatusTag>
                </SchoolItem>
              );
            })}
          </ul>
        </SchoolsList>
      </FullWidthCard>

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
    </DashboardContainer>
  );
};

export default FDEDashboard; 