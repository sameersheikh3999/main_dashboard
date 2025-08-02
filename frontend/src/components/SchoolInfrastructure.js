import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { 
  IoBarChartOutline, 
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoShareOutline,
  IoNotificationsOutline,
  IoMailOutline,
  IoChatbubblesOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoGridOutline,
  IoListOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailUnreadOutline,
  IoConstructOutline,
  IoBuildOutline,
  IoBulbOutline
} from 'react-icons/io5';

const SchoolInfrastructure = ({ schoolName }) => {
  const [infrastructure, setInfrastructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInfrastructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSchoolInfrastructure(schoolName);
      setInfrastructure(response);
    } catch (err) {
      setError('Failed to fetch school infrastructure data');
      console.error('Error fetching school infrastructure:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolName]);

  useEffect(() => {
    if (schoolName) {
      fetchInfrastructure();
    }
  }, [schoolName, fetchInfrastructure]);

  const getWifiStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'Limited': return 'text-yellow-600 bg-yellow-100';
      case 'Not Available': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWifiIcon = (status) => {
    switch (status) {
      case 'Available': return <IoEyeOutline />;
      case 'Limited': return <IoEyeOffOutline />;
      case 'Not Available': return <IoCloseCircleOutline />;
      default: return <IoInformationCircleOutline />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4"><IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> School Infrastructure</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4"><IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> School Infrastructure</h2>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!infrastructure) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4"><IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> School Infrastructure</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2"><IoSchoolOutline /></div>
          <p>No infrastructure data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6"><IoSchoolOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> School Infrastructure</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WiFi Status */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">WiFi Status</h3>
            <span className="text-2xl">{getWifiIcon(infrastructure.wifi_status)}</span>
          </div>
          <div className={`px-3 py-2 rounded-full text-sm font-medium text-center ${getWifiStatusColor(infrastructure.wifi_status)}`}>
            {infrastructure.wifi_status}
          </div>
          <p className="text-sm text-blue-600 mt-2">
            {infrastructure.wifi_available ? 'WiFi is available for teachers and students' : 'WiFi access is limited or not available'}
          </p>
        </div>

        {/* Mobile Phone Usage */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-800">Mobile Phone Access</h3>
            <span className="text-2xl"><IoCallOutline /></span>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {infrastructure.mobile_phone_percentage}%
          </div>
          <p className="text-sm text-green-600">
            {infrastructure.teachers_with_mobile_access} of {infrastructure.total_teachers} teachers have mobile access
          </p>
        </div>

        {/* Infrastructure Score */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-800">Infrastructure Score</h3>
            <span className="text-2xl"><IoBuildOutline /></span>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {infrastructure.avg_infrastructure_score.toFixed(1)}/5.0
          </div>
          <p className="text-sm text-purple-600">
            Average infrastructure quality score
          </p>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3"><IoStatsChartOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Detailed Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">School:</span> {infrastructure.school}</p>
            <p><span className="font-medium">EMIS:</span> {infrastructure.emis}</p>
            <p><span className="font-medium">Sector:</span> {infrastructure.sector}</p>
          </div>
          <div>
            <p><span className="font-medium">Total Teachers:</span> {infrastructure.total_teachers}</p>
            <p><span className="font-medium">Good Infrastructure:</span> {infrastructure.teachers_with_good_infrastructure}</p>
            <p><span className="font-medium">Mobile Access:</span> {infrastructure.teachers_with_mobile_access}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2"><IoBulbOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Recommendations</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          {infrastructure.wifi_status === 'Not Available' && (
            <li>• Consider implementing WiFi infrastructure to improve digital learning</li>
          )}
          {infrastructure.mobile_phone_percentage < 50 && (
            <li>• Support teachers with mobile device access for better communication</li>
          )}
          {infrastructure.avg_infrastructure_score < 3.0 && (
            <li>• Invest in improving overall school infrastructure quality</li>
          )}
          {infrastructure.wifi_status === 'Available' && infrastructure.mobile_phone_percentage >= 80 && (
            <li>• Excellent infrastructure! Consider advanced digital learning tools</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SchoolInfrastructure; 