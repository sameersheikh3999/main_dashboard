import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { apiService } from '../services/api';
import styles from './BigQueryDashboard.module.css';

const BigQueryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  const [summaryStats, setSummaryStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [filters, setFilters] = useState({
    sector: '',
    school_type: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadFilterOptions();
    loadSummaryStats();
    loadData();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await apiService.getBigQueryFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
      setError('Failed to load filter options');
    }
  };

  const loadSummaryStats = async () => {
    try {
      const stats = await apiService.getBigQuerySummaryStats(filters);
      setSummaryStats(stats);
    } catch (error) {
      console.error('Error loading summary stats:', error);
      setError('Failed to load summary statistics');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getBigQueryData(filters);
      setChartData(data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load dashboard data');
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
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loading}>Loading BigQuery Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>BigQuery Data Dashboard</h1>
        <p className={styles.subtitle}>
          Comprehensive analytics and insights from BigQuery data
        </p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Sector</label>
            <select 
              className={styles.select}
              value={filters.sector} 
              onChange={(e) => handleFilterChange('sector', e.target.value)}
            >
              <option value="">All Sectors</option>
              {filterOptions.sectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>School Type</label>
            <select 
              className={styles.select}
              value={filters.school_type} 
              onChange={(e) => handleFilterChange('school_type', e.target.value)}
            >
              <option value="">All Types</option>
              {filterOptions.school_types?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Date From</label>
            <input 
              type="date" 
              className={styles.input}
              value={filters.date_from} 
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Date To</label>
            <input 
              type="date" 
              className={styles.input}
              value={filters.date_to} 
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </div>
        <button className={styles.button} onClick={loadData}>
          Apply Filters
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summaryStats.total_schools || 0}</div>
          <div className={styles.statLabel}>Total Schools</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summaryStats.total_teachers || 0}</div>
          <div className={styles.statLabel}>Total Teachers</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summaryStats.total_students || 0}</div>
          <div className={styles.statLabel}>Total Students</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summaryStats.avg_lp_ratio ? formatPercentage(summaryStats.avg_lp_ratio) : '0%'}</div>
          <div className={styles.statLabel}>Average LP Ratio</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>LP Ratio Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lp_ratio" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>School Distribution by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="school_count"
                nameKey="sector"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Teacher Performance by School</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="school_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="teacher_count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Student Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="student_count" stackId="1" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BigQueryDashboard; 