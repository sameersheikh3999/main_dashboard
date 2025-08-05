import React, { useState, useEffect } from 'react';
import getWebSocketService from '../services/websocket';

const WebSocketDebug = () => {
  const [status, setStatus] = useState('Not connected');
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

  // Get backend URL from environment variables
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
  const backendUrl = apiBaseUrl.replace('/api', '');

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWebSocketConnection = async () => {
    try {
      addLog('Testing WebSocket connection...');
      addLog(`Backend URL: ${backendUrl}`);
      
      if (!user || !user.id) {
        addLog('❌ No user found');
        setStatus('No user found');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        addLog('❌ No token found');
        setStatus('No token found');
        return;
      }

      addLog(`✅ User found: ${user.username} (ID: ${user.id})`);
      addLog(`✅ Token found: ${token.substring(0, 20)}...`);

      // Test backend connectivity
      try {
        const response = await fetch(`${backendUrl}/api/health/`);
        if (response.ok) {
          addLog('✅ Backend server is responding');
        } else {
          addLog('❌ Backend server not responding');
          setStatus('Backend not responding');
          return;
        }
      } catch (error) {
        addLog(`❌ Backend connectivity error: ${error.message}`);
        setStatus('Backend connectivity error');
        return;
      }

      // Initialize WebSocket
      try {
        addLog('🔌 Attempting to connect to WebSocket...');
        const websocketService = getWebSocketService();
        await websocketService.initialize(user.id, token);
        addLog('✅ WebSocket initialized successfully');
        setStatus('Connected');
        
        // Test sending a message
        setTimeout(() => {
          addLog('📤 Testing message sending...');
          const success = websocketService.sendChatMessage('Test message', user.id, 'test-conversation');
          if (success) {
            addLog('✅ Message sent successfully via WebSocket');
          } else {
            addLog('❌ Failed to send message via WebSocket');
          }
        }, 1000);
        
      } catch (error) {
        addLog(`❌ WebSocket initialization error: ${error.message}`);
        setStatus('WebSocket initialization failed');
      }

    } catch (error) {
      addLog(`❌ General error: ${error.message}`);
      setStatus('General error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3>WebSocket Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testWebSocketConnection}
          style={{ 
            padding: '8px 16px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Connection
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        padding: '10px',
        height: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '11px'
      }}>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <strong>User Info:</strong> {user ? `${user.username} (${user.id})` : 'Not logged in'}
      </div>
    </div>
  );
};

export default WebSocketDebug; 