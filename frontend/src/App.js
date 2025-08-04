import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import styled, { createGlobalStyle } from 'styled-components';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import MessagingModal from './components/MessagingModal';
import Login from './components/Login';
import PrincipalDashboard from './components/PrincipalDashboard';
import FDEDashboard from './components/FDEDashboard';
import AEODashboard from './components/AEODashboard';
import AdminDashboard from './components/AdminDashboard';
import Register from './components/Register';
import { isAuthenticated, getCurrentUser, logout, apiService } from './services/api';

// Global Styles
const GlobalStyle = createGlobalStyle`
  body {
    background: #f6f8fa;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
  }
`;

// Styled Components
const Container = styled.div`
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
const NavButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const NavBtn = styled.button`
  background: ${({ active }) => (active ? '#0a58ca' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#0a58ca')};
  border: 1px solid #0a58ca;
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
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
const SubTitle = styled.div`
  color: #6c757d;
  font-size: 0.98rem;
`;
const ToggleBar = styled.div`
  display: flex;
  gap: 8px;
  margin: 16px 0 24px 0;
`;
const ToggleBtn = styled.button`
  background: ${({ active }) => (active ? '#212529' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#212529')};
  border: 1px solid #212529;
  border-radius: 6px;
  padding: 5px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
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
const SummaryCard = styled(Card)`
  align-items: flex-start;
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
const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
`;
const SchoolsOverviewSection = styled(Card)`
  margin-bottom: 32px;
`;
const SchoolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const SchoolItem = styled.div`
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
  background: ${({ status }) => (status === 'active' ? '#d1e7dd' : '#f8d7da')};
  color: ${({ status }) => (status === 'active' ? '#198754' : '#dc3545')};
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 2px 10px;
  margin-right: 8px;
`;
const TeachersActive = styled.span`
  color: #0a58ca;
  font-weight: 500;
  margin-right: 8px;
`;
const AvgCompletion = styled.span`
  color: #6c757d;
  font-size: 0.95rem;
`;
const ProgressBarContainer = styled.div`
  background: #e9ecef;
  border-radius: 6px;
  width: 120px;
  height: 10px;
  margin: 0 16px;
  overflow: hidden;
`;
const ProgressBar = styled.div`
  background: #0a58ca;
  height: 100%;
  width: ${({ percent }) => percent}%;
  transition: width 0.4s;
`;
const AskBtn = styled.button`
  background: ${({ disabled }) => disabled ? '#f8f9fa' : '#fff'};
  color: ${({ disabled }) => disabled ? '#6c757d' : '#0a58ca'};
  border: 1px solid ${({ disabled }) => disabled ? '#dee2e6' : '#0a58ca'};
  border-radius: 6px;
  padding: 4px 14px;
  font-weight: 500;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  margin-left: auto;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ disabled }) => disabled ? '#f8f9fa' : '#f8f9fa'};
  }
  
  @media (max-width: 600px) {
    margin-left: 0;
  }
`;
const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  gap: 12px;
`;
const ActivityBadge = styled.span`
  background: ${({ type }) => {
    if (type === 'lesson') return '#d1e7dd';
    if (type === 'planning') return '#cff4fc';
    return '#f8d7da';
  }};
  color: ${({ type }) => {
    if (type === 'lesson') return '#198754';
    if (type === 'planning') return '#0dcaf0';
    return '#dc3545';
  }};
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 2px 10px;
  margin-right: 8px;
`;
const ActivityPercent = styled.div`
  margin-left: auto;
  font-weight: 600;
  color: #0a58ca;
`;

// Dummy Data - will be replaced by BigQuery data
const activityTrendsData = [
  { month: 'Jan', lessons: 40, planning: 20, engagement: 60 },
  { month: 'Feb', lessons: 50, planning: 25, engagement: 70 },
  { month: 'Mar', lessons: 60, planning: 30, engagement: 80 },
  { month: 'Apr', lessons: 70, planning: 35, engagement: 90 },
  { month: 'May', lessons: 80, planning: 40, engagement: 100 },
  { month: 'Jun', lessons: 90, planning: 45, engagement: 110 },
  { month: 'Jul', lessons: 120, planning: 60, engagement: 140 },
];

const teacherEngagementData = [
  { name: 'Highly Active', value: 18 },
  { name: 'Moderately Active', value: 12 },
  { name: 'Low Activity', value: 10 },
];
const teacherEngagementColors = ['#0d6efd', '#ffc107', '#fd7e14'];

const recentTeacherActivity = [
  {
    school: 'Al-Noor Elementary',
    type: 'lesson',
    desc: 'Completed Advanced Teaching Methods',
    percent: 98,
  },
  {
    school: 'Green Valley High',
    type: 'planning',
    desc: 'Submitted Lesson Plan for Q2',
    percent: 92,
  },
  {
    school: 'Sunrise Primary',
    type: 'lesson',
    desc: 'Completed Classroom Management',
    percent: 80,
  },
  {
    school: 'Green Valley High',
    type: 'planning',
    desc: 'Engaged in Lesson Planning',
    percent: 85,
  },
  {
    school: 'Heritage Middle',
    type: 'lesson',
    desc: 'Completed Science Quizzes',
    percent: 91,
  },
  {
    school: 'Sunrise Primary',
    type: 'lesson',
    desc: 'Completed Student Development Strategies',
    percent: 78,
  },
];

// Components
function App() {
  const [dashboard, setDashboard] = useState('AEO');
  const [view, setView] = useState('overview');
  const [currentView, setCurrentView] = useState('dashboard');
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bigQueryData, setBigQueryData] = useState({
    teacherData: [],
    aggregatedData: [],
    summaryStats: {},
    filterOptions: {},
    allSchools: []
  });
  const [bigQueryLoading, setBigQueryLoading] = useState(false);
  const [messagingModal, setMessagingModal] = useState({
    isOpen: false,
    schoolName: '',
    schoolData: null
  });
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // Add filter state variables
  const [filters, setFilters] = useState({
    grade: '',
    subject: ''
  });

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      console.log('Checking authentication status...');
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        console.log('User is authenticated:', currentUser?.username);
        setUser(currentUser);
        setAuthenticated(true);
      } else {
        console.log('User is not authenticated');
      }
    };
    
    checkAuth();
    
    Papa.parse(process.env.PUBLIC_URL + '/teach_tool_scores.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setCsvData(results.data.filter(row => row.School));
        setLoading(false);
      },
    });
  }, []);

  // Load BigQuery data when user is authenticated
  useEffect(() => {
    if (authenticated && user) {
      console.log('User authenticated, loading BigQuery data...', { user: user.username, role: user.profile?.role });
      loadBigQueryData();
    } else {
      console.log('User not authenticated yet', { authenticated, user: user?.username });
    }
  }, [authenticated, user]);

  // Reload data when filters change
  useEffect(() => {
    if (authenticated && user) {
      loadBigQueryData();
    }
  }, [filters]);

  const loadBigQueryData = async () => {
    setBigQueryLoading(true);
    try {
      console.log('Loading BigQuery data...');
      
      // Check if we have a valid token before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping BigQuery data load');
        return;
      }
      
      // Apply filters to API calls only when filters are selected
      const filterParams = {};
      if (filters.grade) filterParams.grade = filters.grade;
      if (filters.subject) filterParams.subject = filters.subject;
      
      // Only apply filters to teacher data if filters are selected
      const teacherDataParams = (filters.grade || filters.subject) ? filterParams : {};
      const summaryStatsParams = (filters.grade || filters.subject) ? filterParams : {};
      const aggregatedDataParams = (filters.grade || filters.subject) ? filterParams : {};
      
      const [filterOptions, summaryStats, teacherData, aggregatedData, allSchools] = await Promise.all([
        apiService.getBigQueryFilterOptions(),
        apiService.getBigQuerySummaryStats(summaryStatsParams),
        apiService.getBigQueryTeacherData(teacherDataParams),
        apiService.getBigQueryAggregatedData('weekly', aggregatedDataParams),
        apiService.getSchoolsWithInfrastructure()
      ]);

      console.log('BigQuery data loaded:', {
        filterOptions: filterOptions,
        summaryStats,
        teacherData: teacherData?.length,
        aggregatedData: aggregatedData?.length,
        allSchools: allSchools?.length
      });

      setBigQueryData({
        filterOptions,
        summaryStats,
        teacherData,
        aggregatedData,
        allSchools
      });
    } catch (error) {
      console.error('Error loading BigQuery data:', error);
      // If we get a 401, clear the token and redirect to login
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('Authentication failed, clearing token...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthenticated(false);
        setUser(null);
      }
    } finally {
      setBigQueryLoading(false);
    }
  };

  // Group and aggregate data for dashboard
  const schoolsMap = {};
  const sectorMap = {};
  let totalTeachers = 0;
  let activeTeachers = 0;
  let totalSchools = 0;
  let completedLessons = 0;
  let completionSum = 0;
  let completionCount = 0;

  csvData.forEach(row => {
    const school = row.School;
    const sector = row.Sector;
    const status = 'active'; // You can add logic for status if available
    const avgScore = parseFloat(row.overall_average_score) || 0;
    
    // Filter schools based on user role
    if (user && user.profile?.role === 'Principal' && user.profile?.school_name !== school) {
      return; // Skip schools that don't belong to this principal
    }
    
    if (!schoolsMap[school]) {
      schoolsMap[school] = {
        name: school,
        status,
        teachersActive: 0,
        teachersTotal: 0,
        avgCompletion: 0,
        sector,
        scores: [],
      };
      totalSchools++;
    }
    schoolsMap[school].teachersTotal++;
    schoolsMap[school].teachersActive++; // Assume all are active for now
    schoolsMap[school].scores.push(avgScore);
    if (!sectorMap[sector]) sectorMap[sector] = [];
    sectorMap[sector].push(row);
    totalTeachers++;
    activeTeachers++;
    completedLessons += avgScore >= 3 ? 1 : 0; // Example: lessons with avg >= 3 are 'completed'
    completionSum += avgScore;
    completionCount++;
  });

  // Calculate average completion for each school
  Object.values(schoolsMap).forEach(school => {
    if (school.scores.length > 0) {
      school.avgCompletion = Math.round(
        school.scores.reduce((a, b) => a + b, 0) / school.scores.length * 20 // scale to percent
      );
    }
  });

  // Prepare data for UI - Use BigQuery data if available, fallback to CSV data
  const schools = Object.values(schoolsMap);
  
  // Use BigQuery data for summary statistics if available
  const summaryData = bigQueryData.summaryStats.total_teachers ? [
    {
      title: user?.profile?.role === 'Principal' ? 'School' : 'Total Schools',
      value: user?.profile?.role === 'Principal' ? user.profile?.school_name : bigQueryData.summaryStats.total_schools,
      sub: user?.profile?.role === 'Principal' ? 'Your School' : `${bigQueryData.summaryStats.total_schools} active`,
      color: '#0a58ca',
    },
    {
      title: 'Active Teachers',
      value: bigQueryData.summaryStats.total_teachers,
      sub: filters.grade || filters.subject ? 
        `${filters.grade || 'All Grades'} - ${filters.subject || 'All Subjects'}` : 
        'from BigQuery data',
      color: '#198754',
    },
    {
      title: 'Total Sectors',
      value: bigQueryData.summaryStats.total_sectors,
      sub: 'educational sectors',
      color: '#6f42c1',
    },
    {
      title: 'Avg LP Ratio',
      value: `${Math.round(bigQueryData.summaryStats.overall_avg_lp_ratio || 0)}%`,
      sub: filters.grade || filters.subject ? 
        `${filters.grade || 'All Grades'} - ${filters.subject || 'All Subjects'}` : 
        'lesson plan completion',
      color: '#fd7e14',
    },
  ] : [
    {
      title: user?.profile?.role === 'Principal' ? 'School' : 'Total Schools',
      value: user?.profile?.role === 'Principal' ? user.profile?.school_name : totalSchools,
      sub: user?.profile?.role === 'Principal' ? 'Your School' : `${schools.length} active`,
      color: '#0a58ca',
    },
    {
      title: 'Active Teachers',
      value: activeTeachers,
      sub: `of ${totalTeachers} total`,
      color: '#198754',
    },
    {
      title: 'Completed Lessons',
      value: completedLessons,
      sub: '+15% this month',
      color: '#6f42c1',
    },
    {
      title: 'Completion Rate',
      value: completionCount ? `${Math.round((completionSum / completionCount) * 20)}%` : '0%',
      sub: '+5.2% this month',
      color: '#fd7e14',
    },
  ];
  // Use BigQuery data for charts if available
  const schoolStatusData = bigQueryData.allSchools.length > 0 ? [
    { 
      name: 'Active Schools', 
      value: bigQueryData.allSchools.filter(school => school.avg_lp_ratio >= 30).length 
    },
    { 
      name: 'Inactive Schools', 
      value: bigQueryData.allSchools.filter(school => school.avg_lp_ratio < 30).length 
    },
  ] : bigQueryData.summaryStats.total_schools ? [
    { name: 'Active Schools', value: bigQueryData.summaryStats.total_schools },
    { name: 'Total Sectors', value: bigQueryData.summaryStats.total_sectors },
  ] : [
    { name: 'Active', value: schools.length },
    { name: 'Inactive', value: 0 },
  ];
  const schoolStatusColors = ['#198754', '#dc3545'];
  
  // Performance data from BigQuery or CSV
  const performanceData = bigQueryData.aggregatedData.length > 0 
    ? bigQueryData.aggregatedData.slice(0, 10).map(item => ({ 
        name: item.School ? item.School.split(' ')[0] : 'School', 
        completion: Math.round(item.avg_lp_ratio || 0) 
      }))
    : schools.map(s => ({ name: s.name.split(' ')[0], completion: s.avgCompletion }));

  // Transform BigQuery data for activity trends
  const getActivityTrendsData = () => {
    if (bigQueryData.aggregatedData.length > 0) {
      return bigQueryData.aggregatedData.slice(0, 7).map((item, index) => ({
        month: new Date(item.period).toLocaleDateString('en-US', { month: 'short' }),
        lessons: Math.round(item.teacher_count || 0),
        planning: Math.round(item.avg_lp_ratio || 0),
        engagement: Math.round((item.avg_lp_ratio || 0) * 1.5)
      }));
    }
    return activityTrendsData;
  };

  const currentActivityTrendsData = getActivityTrendsData();

  // Helper function to determine which schools data to show
  const getSchoolsToDisplay = () => {
    // If filters are applied and we have filtered teacher data, use that
    if ((filters.grade || filters.subject) && bigQueryData.teacherData.length > 0) {
      // Group teachers by school and calculate filtered statistics
      const schoolStats = bigQueryData.teacherData.reduce((acc, teacher) => {
        const schoolName = teacher.school;
        if (!acc[schoolName]) {
          acc[schoolName] = {
            school_name: schoolName,
            teachers: [],
            teacher_count: 0,
            avg_lp_ratio: 0
          };
        }
        acc[schoolName].teachers.push(teacher);
        acc[schoolName].teacher_count++;
        return acc;
      }, {});

      // Calculate average LP ratio for each school
      Object.values(schoolStats).forEach(school => {
        if (school.teachers.length > 0) {
          const totalLpRatio = school.teachers.reduce((sum, teacher) => sum + (teacher.lp_ratio || 0), 0);
          school.avg_lp_ratio = totalLpRatio / school.teachers.length;
        }
      });

      return {
        schools: Object.values(schoolStats),
        isFiltered: true
      };
    }
    
    // Otherwise, show all schools
    if (bigQueryData.allSchools.length > 0) {
      return {
        schools: bigQueryData.allSchools,
        isFiltered: false
      };
    }
    
    // Fallback to CSV data
    return {
      schools: schools,
      isFiltered: false
    };
  };

  // Handler for opening messaging modal
  const handleAskPrincipal = (schoolName, schoolData) => {
    // Only AEO can send messages to principals
    if (user && user.profile?.role === 'AEO') {
      setMessagingModal({
        isOpen: true,
        schoolName,
        schoolData
      });
    } else {
      alert('Only AEO users can send messages to principals.');
    }
  };

  // Handler for closing messaging modal
  const handleCloseMessagingModal = () => {
    setMessagingModal({
      isOpen: false,
      schoolName: '',
      schoolData: null
    });
  };

  const handleMessageSent = () => {
    // This will be called when a message is sent through the modal
    console.log('Message sent successfully');
  };

  // Handler for successful login
  const handleLogin = (userData) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
    setAuthenticated(true);
  };

  // Handler for successful registration
  const handleRegister = (userData) => {
    setUser(userData);
    setAuthenticated(true);
    setShowRegister(false);
  };

  // Handler for logout
  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
  };

  // Loading state
  if (loading) return <div style={{ padding: 40 }}>Loading dashboard data...</div>;

  // Show login if not authenticated
  if (!authenticated) {
    return (
      <div>
        {showRegister ? (
          <Register onRegister={handleRegister} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {showRegister ? (
            <button
              onClick={() => setShowRegister(false)}
              style={{
                color: '#0a58ca',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Already have an account? Login
            </button>
          ) : (
            <button
              onClick={() => setShowRegister(true)}
              style={{
                color: '#0a58ca',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Don't have an account? Register
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show Principal Dashboard if user is a Principal
  if (user && user.profile?.role === 'Principal') {
    console.log('Principal user detected, showing PrincipalDashboard');
    return <PrincipalDashboard onLogout={handleLogout} />;
  }

  // Show FDE Dashboard if user is FDE
  if (user && user.profile?.role === 'FDE') {
    console.log('FDE user detected, showing FDEDashboard');
    return <FDEDashboard onLogout={handleLogout} />;
  }

  // Show AEO Dashboard if user is AEO
  if (user && user.profile?.role === 'AEO') {
    console.log('AEO user detected, showing AEODashboard');
    return <AEODashboard onLogout={handleLogout} />;
  }

  // Show Admin Dashboard if user is admin/superuser
  if (user && (user.is_superuser || user.is_staff)) {
    console.log('Admin user detected, showing AdminDashboard');
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Fallback - show default dashboard for users without specific roles
  console.log('No specific role detected, user data:', user);
  console.log('User profile:', user?.profile);
  console.log('User is_superuser:', user?.is_superuser);
  console.log('User is_staff:', user?.is_staff);

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <TopBar>
            <Title>
              {user?.profile?.role === 'Principal' 
                ? `${user.profile?.school_name} - Principal Dashboard`
                : 'AEO Schools Management Dashboard'
              }
            </Title>
            <NavButtons>
              {user?.profile?.role === 'AEO' && (
                <>
                  <NavBtn active={view === 'overview'} onClick={() => setView('overview')}>Overview</NavBtn>
                  <NavBtn active={view === 'analytics'} onClick={() => setView('analytics')}>Detailed Analytics</NavBtn>
                </>
              )}
              {user && (
                <>
                  <div style={{ color: '#6c757d', fontSize: '0.9rem', marginLeft: '16px' }}>
                    Logged in as: {user.username} ({user.profile?.role})
                    {user.profile?.role === 'Principal' && ` - ${user.profile?.school_name}`}
                  </div>
                  <LogoutBtn onClick={handleLogout}>Logout</LogoutBtn>
                </>
              )}
            </NavButtons>
          </TopBar>
          <SubTitle>
            {user?.profile?.role === 'Principal' 
              ? `School-specific data and performance analytics for ${user.profile?.school_name}`
              : 'Comprehensive overview of all schools, teachers, and performance analytics'
            }
          </SubTitle>
        </Header>
        {bigQueryLoading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: 'white', 
            borderRadius: '10px', 
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ color: '#007bff', fontSize: '16px', marginBottom: '10px' }}>
              🔄 Loading BigQuery Data...
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              Connecting to BigQuery and fetching teacher performance data
            </div>
          </div>
        )}
        
        <SummaryGrid>
          {summaryData.map((item, i) => (
            <SummaryCard key={item.title}>
              <SummaryTitle>{item.title}</SummaryTitle>
              <SummaryValue style={{ color: item.color }}>{item.value}</SummaryValue>
              <SummarySub>{item.sub}</SummarySub>
            </SummaryCard>
          ))}
        </SummaryGrid>
        <ToggleBar>
          <ToggleBtn active={view === 'overview'} onClick={() => setView('overview')}>Overview</ToggleBtn>
          <ToggleBtn active={view === 'analytics'} onClick={() => setView('analytics')}>Detailed Analytics</ToggleBtn>
        </ToggleBar>
        {view === 'overview' ? (
          <>
            <Grid>
              <Card>
                <SectionTitle>School Status Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={schoolStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={30}
                      label={({ name, percent }) => {
                        if (percent > 0.1) {
                          return `${name}\n${(percent * 100).toFixed(0)}%`;
                        }
                        return '';
                      }}
                      labelLine={false}
                      paddingAngle={2}
                    >
                      {schoolStatusData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={schoolStatusColors[idx]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionTitle>Performance by School</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion" fill="#0a58ca" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <SchoolsOverviewSection>
              <SectionTitle>
                {user?.profile?.role === 'Principal' ? 'School Performance' : 'Schools Overview'}
                {filters.grade || filters.subject ? (
                  <span style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: 'normal' }}>
                    {' '}- Filtered by {filters.grade || 'All Grades'} - {filters.subject || 'All Subjects'}
                  </span>
                ) : null}
              </SectionTitle>
              <div style={{ color: '#6c757d', fontSize: '0.97rem', marginBottom: 10 }}>
                {user?.profile?.role === 'Principal' 
                  ? `Performance overview for ${user.profile?.school_name}`
                  : 'School-level performance and status overview'
                }
                {filters.grade || filters.subject ? (
                  <span style={{ color: '#0a58ca', fontWeight: '500' }}>
                    {' '}(Showing only {filters.grade || 'all grades'} - {filters.subject || 'all subjects'} data)
                  </span>
                ) : null}
              </div>
              
              {/* Add filter controls */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '20px', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
                  <label style={{ 
                    fontWeight: '500', 
                    marginBottom: '5px', 
                    color: '#333',
                    fontSize: '0.9rem'
                  }}>
                    Grade
                  </label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="">All Grades</option>
                    {bigQueryData.filterOptions?.grades?.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
                  <label style={{ 
                    fontWeight: '500', 
                    marginBottom: '5px', 
                    color: '#333',
                    fontSize: '0.9rem'
                  }}>
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="">All Subjects</option>
                    {bigQueryData.filterOptions?.subjects?.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setFilters({ grade: '', subject: '' })}
                  style={{
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '20px'
                  }}
                >
                  Clear Filters
                </button>
              </div>
              
              <SchoolList>
                {(() => {
                  const { schools: schoolsToShow, isFiltered } = getSchoolsToDisplay();
                  
                  return schoolsToShow.map((school) => {
                    const isActive = school.avg_lp_ratio >= 30;
                    const filterInfo = isFiltered ? 
                      `(${filters.grade || 'All Grades'} - ${filters.subject || 'All Subjects'})` : '';
                    
                    return (
                      <SchoolItem key={school.school_name || school.name}>
                        <StatusBadge status={isActive ? "active" : "inactive"}>
                          {isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                        <div style={{ fontWeight: 600, minWidth: 170 }}>
                          {school.school_name || school.name}
                          {filterInfo && (
                            <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'normal' }}>
                              {filterInfo}
                            </div>
                          )}
                        </div>
                        <TeachersActive>
                          {school.teacher_count || school.teachersActive || 0} Teachers Active
                        </TeachersActive>
                        <AvgCompletion>
                          {isFiltered ? 'Avg LP Ratio' : 'Avg Completion'}: {Math.round(school.avg_lp_ratio || school.avgCompletion || 0)}%
                        </AvgCompletion>
                        <ProgressBarContainer>
                          <ProgressBar percent={Math.round(school.avg_lp_ratio || school.avgCompletion || 0)} />
                        </ProgressBarContainer>
                        <AskBtn 
                          onClick={() => handleAskPrincipal(school.school_name || school.name, school)}
                          disabled={!user || user.profile?.role !== 'AEO'}
                        >
                          Ask Principal
                        </AskBtn>
                      </SchoolItem>
                    );
                  });
                })()}
              </SchoolList>
            </SchoolsOverviewSection>
          </>
        ) : (
          <>
            <Grid>
              <Card>
                <SectionTitle>School Status Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={schoolStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={30}
                      label={({ name, percent }) => {
                        if (percent > 0.1) {
                          return `${name}\n${(percent * 100).toFixed(0)}%`;
                        }
                        return '';
                      }}
                      labelLine={false}
                      paddingAngle={2}
                    >
                      {schoolStatusData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={schoolStatusColors[idx]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionTitle>Comprehensive Activity Trends</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={currentActivityTrendsData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lessons" fill="#0a58ca" name="Teachers" />
                    <Bar dataKey="planning" fill="#fd7e14" name="LP Ratio" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid>
              <Card>
                <SectionTitle>Teacher Engagement Levels</SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={teacherEngagementData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={30}
                      label={({ name, percent }) => {
                        if (percent > 0.1) {
                          return `${name}\n${(percent * 100).toFixed(0)}%`;
                        }
                        return '';
                      }}
                      labelLine={false}
                      paddingAngle={2}
                    >
                      {teacherEngagementData.map((entry, idx) => (
                        <Cell key={`cell-engage-${idx}`} fill={teacherEngagementColors[idx]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionTitle>Activity Trends</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={currentActivityTrendsData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#0a58ca" strokeWidth={2} name="Engagement" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Card style={{ marginBottom: 24 }}>
              <SectionTitle>Recent Teacher Activity</SectionTitle>
              <div style={{ color: '#6c757d', fontSize: '0.97rem', marginBottom: 10 }}>
                Latest activity logs from teachers across schools
              </div>
              <ActivityList>
                {recentTeacherActivity.map((act, idx) => (
                  <ActivityItem key={idx}>
                    <ActivityBadge type={act.type}>
                      {act.type === 'lesson' ? 'Lesson' : 'Planning'}
                    </ActivityBadge>
                    <div style={{ fontWeight: 500, minWidth: 160 }}>{act.school}</div>
                    <div style={{ color: '#6c757d', fontSize: '0.97rem' }}>{act.desc}</div>
                    <ActivityPercent>{act.percent}%</ActivityPercent>
                  </ActivityItem>
                ))}
              </ActivityList>
            </Card>
            <SchoolsOverviewSection>
              <SectionTitle>
                {user?.profile?.role === 'Principal' ? 'School Performance' : 'Schools Overview'}
                {filters.grade || filters.subject ? (
                  <span style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: 'normal' }}>
                    {' '}- Filtered by {filters.grade || 'All Grades'} - {filters.subject || 'All Subjects'}
                  </span>
                ) : null}
              </SectionTitle>
              <div style={{ color: '#6c757d', fontSize: '0.97rem', marginBottom: 10 }}>
                {user?.profile?.role === 'Principal' 
                  ? `Performance overview for ${user.profile?.school_name}`
                  : 'School-level performance and status overview'
                }
                {filters.grade || filters.subject ? (
                  <span style={{ color: '#0a58ca', fontWeight: '500' }}>
                    {' '}(Showing only {filters.grade || 'all grades'} - {filters.subject || 'all subjects'} data)
                  </span>
                ) : null}
              </div>
              
              {/* Add filter controls */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '20px', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
                  <label style={{ 
                    fontWeight: '500', 
                    marginBottom: '5px', 
                    color: '#333',
                    fontSize: '0.9rem'
                  }}>
                    Grade
                  </label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="">All Grades</option>
                    {bigQueryData.filterOptions?.grades?.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
                  <label style={{ 
                    fontWeight: '500', 
                    marginBottom: '5px', 
                    color: '#333',
                    fontSize: '0.9rem'
                  }}>
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="">All Subjects</option>
                    {bigQueryData.filterOptions?.subjects?.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setFilters({ grade: '', subject: '' })}
                  style={{
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '20px'
                  }}
                >
                  Clear Filters
                </button>
              </div>
              
              <SchoolList>
                {(() => {
                  const { schools: schoolsToShow, isFiltered } = getSchoolsToDisplay();
                  
                  return schoolsToShow.map((school) => {
                    const isActive = school.avg_lp_ratio >= 30;
                    const filterInfo = isFiltered ? 
                      `(${filters.grade || 'All Grades'} - ${filters.subject || 'All Subjects'})` : '';
                    
                    return (
                      <SchoolItem key={school.school_name || school.name}>
                        <StatusBadge status={isActive ? "active" : "inactive"}>
                          {isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                        <div style={{ fontWeight: 600, minWidth: 170 }}>
                          {school.school_name || school.name}
                          {filterInfo && (
                            <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'normal' }}>
                              {filterInfo}
                            </div>
                          )}
                        </div>
                        <TeachersActive>
                          {school.teacher_count || school.teachersActive || 0} Teachers Active
                        </TeachersActive>
                        <AvgCompletion>
                          {isFiltered ? 'Avg LP Ratio' : 'Avg Completion'}: {Math.round(school.avg_lp_ratio || school.avgCompletion || 0)}%
                        </AvgCompletion>
                        <ProgressBarContainer>
                          <ProgressBar percent={Math.round(school.avg_lp_ratio || school.avgCompletion || 0)} />
                        </ProgressBarContainer>
                        <AskBtn 
                          onClick={() => handleAskPrincipal(school.school_name || school.name, school)}
                          disabled={!user || user.profile?.role !== 'AEO'}
                        >
                          Ask Principal
                        </AskBtn>
                      </SchoolItem>
                    );
                  });
                })()}
              </SchoolList>
            </SchoolsOverviewSection>
          </>
        )}
        
        {/* Messaging Modal */}
        <MessagingModal
          isOpen={messagingModal.isOpen}
          onClose={handleCloseMessagingModal}
          schoolName={messagingModal.schoolName}
          schoolData={messagingModal.schoolData}
          onMessageSent={handleMessageSent}
        />
      </Container>
    </>
  );
}

export default App; 