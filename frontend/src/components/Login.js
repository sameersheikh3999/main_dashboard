import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f6f8fa;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #0a58ca;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #212529;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #0a58ca;
    box-shadow: 0 0 0 2px rgba(10, 88, 202, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: white;
  cursor: pointer;
  
  &:focus {
    border-color: #0a58ca;
    box-shadow: 0 0 0 2px rgba(10, 88, 202, 0.1);
  }
`;

const LoginButton = styled.button`
  background: #0a58ca;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #084298;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

const DemoCredentials = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  font-size: 0.9rem;
  color: #6c757d;
`;

const DemoTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: #212529;
`;

const DemoItem = styled.div`
  margin-bottom: 4px;
`;

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'AEO'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.login(formData);

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Call the onLogin callback
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>AEO Dashboard Login</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="AEO">AEO</option>
              <option value="FDE">FDE</option>
              <option value="Principal">Principal</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="username">
              {formData.role === 'Principal' ? 'EMIS Number' : 'Username'}
            </Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={
                formData.role === 'AEO' ? 'aeo' : 
                formData.role === 'FDE' ? 'fde' : 
                formData.role === 'Principal' ? '547 (EMIS number)' : 
                'principal_school_name'
              }
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={
                formData.role === 'Principal' ? 'pass123 (default password)' : 
                'Enter password'
              }
              required
            />
          </FormGroup>
          
          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </LoginButton>
        </Form>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <DemoCredentials>
          <DemoTitle>Demo Credentials:</DemoTitle>
          <DemoItem><strong>AEO:</strong> username: aeo, password: aeo123</DemoItem>
          <DemoItem><strong>FDE:</strong> username: fde, password: fde123</DemoItem>
          <DemoItem><strong>Principal (EMIS):</strong> EMIS: 547, password: pass123 (IMCB Mohra Nagial)</DemoItem>
          <DemoItem><strong>Principal (Username):</strong> username: principal_al_noor_elementary, password: principal123</DemoItem>
          <DemoItem><strong>Note:</strong> Principals can login using their EMIS number or username</DemoItem>
        </DemoCredentials>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login; 