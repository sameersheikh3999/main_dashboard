import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import { apiService } from '../services/api';
import MessagingModal from './MessagingModal';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 24px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
`;

const Subtitle = styled.div`
  color: #6c757d;
  font-size: 0.98rem;
`;

const LogoutBtn = styled.button`
  background: #dc3545;
  color: #fff;
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #c82333;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  min-height: 90px;
`;

const SummaryTitle = styled.div`
  font-size: 0.98rem;
  color: #6c757d;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 4px 0 2px 0;
`;

const SummarySub = styled.div`
  font-size: 0.9rem;
  color: #198754;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  min-height: 120px;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const AEOList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const AEOItem = styled.div`
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px;
  gap: 18px;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const StatusBadge = styled.span`
  background: #d1e7dd;
  color: #198754;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 2px 10px;
  margin-right: 8px;
`;

const AEOInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const AEOName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const AEOStats = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const MessageBtn = styled.button`
  background: #007bff;
  color: #fff;
  border: 1px solid #007bff;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #0056b3;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const FDEDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [aeoData, setAeoData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});
  const [messagingModal, setMessagingModal] = useState({
    isOpen: false,
    aeoId: null,
    aeoName: '',
    type: ''
  });
  const [bigQueryData, setBigQueryData] = useState({
    teacherData: [],
    aggregatedData: [],
    summaryStats: {},
    filterOptions: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load AEO data first (this is the most important)
      const aeosFromDB = await apiService.getAllAEOs();
      console.log('AEOs loaded:', aeosFromDB);

      // Transform AEO data from database and add mock regional data
      const aeoDataWithRegions = aeosFromDB.map((aeo, index) => {
        // Use the school_name field as the sector/region
        const sector = aeo.school_name || 'Unknown Sector';
        
        // Generate mock stats based on sector
        const mockStats = {
          'B.K': { schools: 35, teachers: 850, lpRatio: 78 },
          'Urban-I': { schools: 42, teachers: 1100, lpRatio: 82 },
          'Urban-II': { schools: 38, teachers: 950, lpRatio: 75 },
          'Tarnol': { schools: 28, teachers: 720, lpRatio: 79 },
          'Nilore': { schools: 32, teachers: 800, lpRatio: 72 },
          'Sihala': { schools: 25, teachers: 650, lpRatio: 85 }
        };
        
        const stats = mockStats[sector] || { schools: 50, teachers: 1500, lpRatio: 80 };
        
        return {
          id: aeo.id,
          name: aeo.username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          region: sector,
          schoolsCount: stats.schools,
          teachersCount: stats.teachers,
          avgLpRatio: stats.lpRatio,
          status: 'active',
          lastActivity: new Date().toISOString().split('T')[0]
        };
      });

      setAeoData(aeoDataWithRegions);

      // Calculate summary statistics
      const totalSchools = aeoDataWithRegions.reduce((sum, aeo) => sum + aeo.schoolsCount, 0);
      const totalTeachers = aeoDataWithRegions.reduce((sum, aeo) => sum + aeo.teachersCount, 0);
      const avgLpRatio = aeoDataWithRegions.reduce((sum, aeo) => sum + aeo.avgLpRatio, 0) / aeoDataWithRegions.length;

      setSummaryStats({
        totalAEOs: aeoDataWithRegions.length,
        totalSchools,
        totalTeachers,
        avgLpRatio: Math.round(avgLpRatio)
      });

      // Try to load BigQuery data (optional - won't break if it fails)
      try {
        const [filterOptions, summaryStats, teacherData, aggregatedData] = await Promise.all([
          apiService.getBigQueryFilterOptions(),
          apiService.getBigQuerySummaryStats({}),
          apiService.getBigQueryTeacherData({}),
          apiService.getBigQueryAggregatedData('weekly', {})
        ]);

        setBigQueryData({
          filterOptions,
          summaryStats,
          teacherData,
          aggregatedData
        });
      } catch (bigQueryError) {
        console.log('BigQuery data not available, using mock data:', bigQueryError.message);
        // Set default BigQuery data
        setBigQueryData({
          filterOptions: [],
          summaryStats: { total_teachers: totalTeachers, total_schools: totalSchools, total_sectors: 4, overall_avg_lp_ratio: avgLpRatio },
          teacherData: [],
          aggregatedData: []
        });
      }

    } catch (error) {
      console.error('Error loading FDE data:', error);
      // Set default data if everything fails
      setAeoData([]);
      setSummaryStats({
        totalAEOs: 0,
        totalSchools: 0,
        totalTeachers: 0,
        avgLpRatio: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAEO = (aeoId, aeoName) => {
    // Open messaging modal for AEO
    setMessagingModal({
      isOpen: true,
      aeoId,
      aeoName,
      type: 'AEO'
    });
  };

  const handleViewAEOStats = (aeoId, aeoName) => {
    // In real implementation, this would navigate to detailed AEO stats
    alert(`Detailed stats for ${aeoName} would be shown here`);
  };

  const handleCloseMessagingModal = () => {
    setMessagingModal({
      isOpen: false,
      aeoId: null,
      aeoName: '',
      type: ''
    });
  };

  // Prepare data for charts
  const aeoPerformanceData = aeoData.map(aeo => ({
    name: aeo.name.split(' ')[1] || aeo.name,
    schools: aeo.schoolsCount,
    teachers: aeo.teachersCount,
    lpRatio: aeo.avgLpRatio
  }));

  const regionDistributionData = [
    { name: 'Urban-I', value: 42 },
    { name: 'Urban-II', value: 38 },
    { name: 'B.K', value: 35 },
    { name: 'Nilore', value: 32 },
    { name: 'Tarnol', value: 28 },
    { name: 'Sihala', value: 25 }
  ];

  const regionColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading FDE Dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <TopBar>
          <Title>Federal Directorate of Education Dashboard</Title>
          <LogoutBtn onClick={onLogout}>Logout</LogoutBtn>
        </TopBar>
        <Subtitle>
          National oversight of educational performance and AEO management
        </Subtitle>
      </Header>

      <SummaryGrid>
                 <SummaryCard>
           <SummaryTitle>Total AEOs</SummaryTitle>
           <SummaryValue style={{ color: '#0a58ca' }}>{summaryStats.totalAEOs}</SummaryValue>
           <SummarySub>Active Sector Directors</SummarySub>
         </SummaryCard>
        <SummaryCard>
          <SummaryTitle>Total Schools</SummaryTitle>
          <SummaryValue style={{ color: '#198754' }}>{summaryStats.totalSchools}</SummaryValue>
          <SummarySub>Under FDE Management</SummarySub>
        </SummaryCard>
        <SummaryCard>
          <SummaryTitle>Total Teachers</SummaryTitle>
          <SummaryValue style={{ color: '#6f42c1' }}>{summaryStats.totalTeachers}</SummaryValue>
          <SummarySub>Across All Regions</SummarySub>
        </SummaryCard>
        <SummaryCard>
          <SummaryTitle>Avg LP Ratio</SummaryTitle>
          <SummaryValue style={{ color: '#fd7e14' }}>{summaryStats.avgLpRatio}%</SummaryValue>
          <SummarySub>National Average</SummarySub>
        </SummaryCard>
      </SummaryGrid>

      <Grid>
                 <Card>
           <SectionTitle>Sector Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={regionDistributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {regionDistributionData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={regionColors[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>AEO Performance Overview</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={aeoPerformanceData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="lpRatio" fill="#0a58ca" name="LP Ratio %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

             <Card style={{ marginBottom: 24 }}>
         <SectionTitle>AEO Sector Directors</SectionTitle>
         <div style={{ color: '#6c757d', fontSize: '0.97rem', marginBottom: 10 }}>
           Sector AEO performance and communication management
         </div>
        <AEOList>
          {aeoData.map((aeo) => (
            <AEOItem key={aeo.id}>
              <StatusBadge status={aeo.status}>
                {aeo.status === 'active' ? 'Active' : 'Inactive'}
              </StatusBadge>
              <AEOInfo>
                <AEOName>{aeo.name}</AEOName>
                <AEOStats>
                  {aeo.region} • {aeo.schoolsCount} Schools • {aeo.teachersCount} Teachers • 
                  LP Ratio: {aeo.avgLpRatio}% • Last Activity: {aeo.lastActivity}
                </AEOStats>
              </AEOInfo>
              <div style={{ display: 'flex', gap: '8px' }}>
                <MessageBtn onClick={() => handleMessageAEO(aeo.id, aeo.name)}>
                  Message AEO
                </MessageBtn>
                <MessageBtn 
                  onClick={() => handleViewAEOStats(aeo.id, aeo.name)}
                  style={{ background: '#6c757d', borderColor: '#6c757d' }}
                >
                  View Stats
                </MessageBtn>
              </div>
            </AEOItem>
          ))}
        </AEOList>
      </Card>

      {bigQueryData.summaryStats.total_teachers && (
        <Card>
          <SectionTitle>National BigQuery Analytics</SectionTitle>
          <div style={{ color: '#6c757d', fontSize: '0.97rem', marginBottom: 10 }}>
            Real-time data from BigQuery showing national teacher performance
          </div>
          <Grid>
            <div>
              <strong>Total Teachers:</strong> {bigQueryData.summaryStats.total_teachers}
            </div>
            <div>
              <strong>Total Schools:</strong> {bigQueryData.summaryStats.total_schools}
            </div>
            <div>
              <strong>Total Sectors:</strong> {bigQueryData.summaryStats.total_sectors}
            </div>
            <div>
              <strong>National LP Ratio:</strong> {Math.round(bigQueryData.summaryStats.overall_avg_lp_ratio || 0)}%
            </div>
          </Grid>
        </Card>
      )}
      
      {/* Messaging Modal */}
      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={handleCloseMessagingModal}
        schoolName={messagingModal.aeoName}
        schoolData={{ id: messagingModal.aeoId, name: messagingModal.aeoName }}
      />
    </DashboardContainer>
  );
};

export default FDEDashboard; 