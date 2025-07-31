import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { apiService } from '../services/api';

const DashboardContainer = styled.div`
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #333;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 20px;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 14px;
`;

const ChartSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
`;

const DataTable = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BigQueryDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [summaryStats, setSummaryStats] = useState({});
  const [teacherData, setTeacherData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sector: '',
    school: '',
    teacher: '',
    grade: '',
    subject: ''
  });
  
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    loadFilterOptions();
    loadSummaryStats();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await apiService.getBigQueryFilterOptions();
      // The API now returns an object with arrays, not an array of objects
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadSummaryStats = async () => {
    try {
      const stats = await apiService.getBigQuerySummaryStats(filters);
      setSummaryStats(stats);
    } catch (error) {
      console.error('Error loading summary stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [teacherResults, aggregatedResults] = await Promise.all([
        apiService.getBigQueryTeacherData(filters),
        apiService.getBigQueryAggregatedData(period, filters)
      ]);
      
      setTeacherData(teacherResults);
      setAggregatedData(aggregatedResults);
      await loadSummaryStats();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 100) / 100}%`;
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Teacher Performance Dashboard</Title>
        <Subtitle>BigQuery Analytics - Lesson Plan Completion Rates</Subtitle>
      </Header>

      <FilterSection>
        <h3>Filters</h3>
        <FilterRow>
          <FilterGroup>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Period</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </FilterGroup>
        </FilterRow>
        
        <FilterRow>
          <FilterGroup>
            <Label>Sector</Label>
            <Select
              value={filters.sector}
              onChange={(e) => handleFilterChange('sector', e.target.value)}
            >
              <option value="">All Sectors</option>
              {filterOptions.sectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>School</Label>
            <Select
              value={filters.school}
              onChange={(e) => handleFilterChange('school', e.target.value)}
            >
              <option value="">All Schools</option>
              {filterOptions.schools?.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Grade</Label>
            <Select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
            >
              <option value="">All Grades</option>
              {filterOptions.grades?.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Subject</Label>
            <Select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            >
              <option value="">All Subjects</option>
              {filterOptions.subjects?.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </Select>
          </FilterGroup>
        </FilterRow>

        <Button onClick={loadData} disabled={loading}>
          {loading ? 'Loading...' : 'Load Data'}
        </Button>
      </FilterSection>

      {summaryStats.total_teachers && (
        <StatsGrid>
          <StatCard>
            <StatValue>{summaryStats.total_teachers}</StatValue>
            <StatLabel>Total Teachers</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{summaryStats.total_schools}</StatValue>
            <StatLabel>Total Schools</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{summaryStats.total_sectors}</StatValue>
            <StatLabel>Total Sectors</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatPercentage(summaryStats.overall_avg_lp_ratio)}</StatValue>
            <StatLabel>Average LP Ratio</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {loading ? (
        <LoadingSpinner>Loading data...</LoadingSpinner>
      ) : (
        <>
          {aggregatedData.length > 0 && (
            <ChartSection>
              <ChartTitle>LP Ratio Trends Over Time</ChartTitle>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={aggregatedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [formatPercentage(value), 'LP Ratio']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_lp_ratio" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Average LP Ratio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartSection>
          )}

          {aggregatedData.length > 0 && (
            <ChartSection>
              <ChartTitle>Teacher Count by Period</ChartTitle>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={aggregatedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value, 'Teachers']}
                  />
                  <Legend />
                  <Bar dataKey="teacher_count" fill="#82ca9d" name="Teacher Count" />
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>
          )}

          {teacherData.length > 0 && (
            <DataTable>
              <ChartTitle>Teacher Data</ChartTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Teacher</Th>
                    <Th>School</Th>
                    <Th>Sector</Th>
                    <Th>Grade</Th>
                    <Th>Subject</Th>
                    <Th>Week Start</Th>
                    <Th>Week End</Th>
                    <Th>LP Ratio</Th>
                  </tr>
                </thead>
                <tbody>
                  {teacherData.slice(0, 50).map((row, index) => (
                    <tr key={index}>
                      <Td>{row.Teacher}</Td>
                      <Td>{row.School}</Td>
                      <Td>{row.Sector}</Td>
                      <Td>{row.Grade}</Td>
                      <Td>{row.Subject}</Td>
                      <Td>{formatDate(row.week_start)}</Td>
                      <Td>{formatDate(row.week_end)}</Td>
                      <Td>{formatPercentage(row.lp_ratio)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {teacherData.length > 50 && (
                <p style={{ marginTop: '10px', color: '#666' }}>
                  Showing first 50 records of {teacherData.length} total records
                </p>
              )}
            </DataTable>
          )}
        </>
      )}
    </DashboardContainer>
  );
};

export default BigQueryDashboard; 