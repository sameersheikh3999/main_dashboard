import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const TeacherObservations = ({ schoolName }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeacherObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getTeacherObservations(schoolName);
      setObservations(response.observations || []);
    } catch (err) {
      setError('Failed to fetch teacher observations');
      console.error('Error fetching teacher observations:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolName]);

  useEffect(() => {
    if (schoolName) {
      fetchTeacherObservations();
    }
  }, [schoolName, fetchTeacherObservations]);

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreClass = (score) => {
    if (!score) return 'bg-gray-100';
    if (score >= 4.0) return 'bg-green-100';
    if (score >= 3.0) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Teacher Observations</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Teacher Observations</h2>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Teacher Observations</h2>
        <div className="text-sm text-gray-600">
          Total Observations: {observations.length}
        </div>
      </div>

      {observations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No teacher observations found for this school</p>
          <p className="text-sm mt-2">Teacher observation data will appear here when available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {observations.map((observation, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">Teacher ID: {observation.user_id}</h3>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(observation.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreClass(observation.overall_average_score)} ${getScoreColor(observation.overall_average_score)}`}>
                    Overall: {observation.overall_average_score || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Supportive Learning Environment</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.supp_learn_envi_score)} ${getScoreColor(observation.supp_learn_envi_score)}`}>
                    {observation.supp_learn_envi_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Positive Behavior Expectations</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.pos_behav_expec_score)} ${getScoreColor(observation.pos_behav_expec_score)}`}>
                    {observation.pos_behav_expec_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Lesson Facilitation</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.lesson_facilitation_score)} ${getScoreColor(observation.lesson_facilitation_score)}`}>
                    {observation.lesson_facilitation_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">CFU Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.cfu_score)} ${getScoreColor(observation.cfu_score)}`}>
                    {observation.cfu_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Feedback Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.feedback_score)} ${getScoreColor(observation.feedback_score)}`}>
                    {observation.feedback_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">CT Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.ct_score)} ${getScoreColor(observation.ct_score)}`}>
                    {observation.ct_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Autonomy Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.autonomy_score)} ${getScoreColor(observation.autonomy_score)}`}>
                    {observation.autonomy_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Perseverance Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.perseverance_score)} ${getScoreColor(observation.perseverance_score)}`}>
                    {observation.perseverance_score || 'N/A'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Social Score</div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreClass(observation.social_score)} ${getScoreColor(observation.social_score)}`}>
                    {observation.social_score || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherObservations; 