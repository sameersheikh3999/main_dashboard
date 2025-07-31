const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// API configuration
const API_CONFIG = {
  timeout: 30000, // Increased timeout to 30 seconds
  retries: 3,
  retryDelay: 1000,
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Helper function to retry failed requests
const retryRequest = async (requestFn, retries = API_CONFIG.retries) => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0 && (error.message.includes('Network') || error.message.includes('500'))) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return retryRequest(requestFn, retries - 1);
    }
    throw error;
  }
};

// Helper function to make API requests
const makeRequest = async (url, options = {}) => {
  const config = {
    headers: getAuthHeaders(),
    timeout: API_CONFIG.timeout,
    ...options,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// API service functions
export const apiService = {
  // Authentication
  login: async (credentials) => {
    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
    );
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
    );
  },

  // Conversations
  getConversations: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/conversations/`));
  },

  createConversation: async (conversationData) => {
    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/conversations/`, {
        method: 'POST',
        body: JSON.stringify(conversationData),
      })
    );
  },

  getMessages: async (conversationId) => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/conversations/${conversationId}/messages/`));
  },

  // Messaging
  sendMessage: async (schoolName, messageText, receiverId) => {
    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        body: JSON.stringify({
          school_name: schoolName,
          message_text: messageText,
          receiverId: receiverId
        }),
      })
    );
  },

  // Principals
  getPrincipal: async (schoolName) => {
    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/principals/detail/?schoolName=${encodeURIComponent(schoolName)}`)
    );
  },

  getAllPrincipals: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/principals/`));
  },

  getAllAEOs: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/aeos/`));
  },

  getAllFDEs: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/fdes/`));
  },

  // Health check
  healthCheck: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/health/`));
  },

  // BigQuery endpoints
  getBigQueryTeacherData: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/bigquery/teacher-data/?${params}`)
    );
  },

  getBigQueryAggregatedData: async (period = 'weekly', filters = {}) => {
    const params = new URLSearchParams();
    params.append('period', period);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/bigquery/aggregated-data/?${params}`)
    );
  },

  getBigQueryFilterOptions: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/bigquery/filter-options/`));
  },

  getBigQuerySummaryStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return retryRequest(() => 
      makeRequest(`${API_BASE_URL}/bigquery/summary-stats/?${params}`)
    );
  },

  getBigQueryAllSchools: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/bigquery/all-schools/`));
  },

  getSchoolTeachersData: async () => {
    return retryRequest(() => makeRequest(`${API_BASE_URL}/school-teachers/`));
  }
};

// Utility functions
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Token refresh interceptor
export const setupTokenRefresh = () => {
  const originalMakeRequest = makeRequest;
  
  return async (url, options = {}) => {
    try {
      return await originalMakeRequest(url, options);
    } catch (error) {
      if (error.message.includes('401') && isAuthenticated()) {
        try {
          const { access } = await apiService.refreshToken();
          localStorage.setItem('token', access);
          // Retry the original request
          return await originalMakeRequest(url, options);
        } catch (refreshError) {
          logout();
          window.location.href = '/login';
          throw refreshError;
        }
      }
      throw error;
    }
  };
}; 