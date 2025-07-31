import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the API service
jest.mock('../services/api', () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
  apiService: {
    login: jest.fn(),
    getConversations: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    getAllPrincipals: jest.fn(),
    getAllAEOs: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form when not authenticated', () => {
    const { isAuthenticated } = require('../services/api');
    isAuthenticated.mockReturnValue(false);

    render(<App />);
    
    expect(screen.getByText(/Educational Dashboard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('renders dashboard when authenticated', () => {
    const { isAuthenticated, getCurrentUser } = require('../services/api');
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue({
      username: 'testuser',
      role: 'FDE'
    });

    render(<App />);
    
    expect(screen.getByText(/Educational Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/FDE Dashboard/i)).toBeInTheDocument();
  });

  test('handles login form submission', async () => {
    const { isAuthenticated, apiService } = require('../services/api');
    isAuthenticated.mockReturnValue(false);
    apiService.login.mockResolvedValue({
      access: 'test-token',
      refresh: 'test-refresh-token',
      user: { username: 'testuser', role: 'FDE' }
    });

    render(<App />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass'
      });
    });
  });

  test('handles logout', () => {
    const { isAuthenticated, getCurrentUser, logout } = require('../services/api');
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue({
      username: 'testuser',
      role: 'FDE'
    });

    render(<App />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(logout).toHaveBeenCalled();
  });
}); 