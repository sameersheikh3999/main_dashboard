import React, { useState } from 'react';
import styled from 'styled-components';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f6f8fa;
`;

const RegisterCard = styled.div`
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

const RegisterButton = styled.button`
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

const SuccessMessage = styled.div`
  color: #198754;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'AEO',
    school_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || Object.values(data)[0] || 'Registration failed');
      }
      setSuccess('Registration successful! You are now logged in.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (onRegister) onRegister(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <Title>Register</Title>
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
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
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
              required
            />
          </FormGroup>
          {formData.role === 'AEO' || formData.role === 'Principal' ? (
            <FormGroup>
              <Label htmlFor="school_name">School Name / Sector</Label>
              <Input
                type="text"
                id="school_name"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                placeholder={formData.role === 'AEO' ? 'Sector' : 'School Name'}
                required={formData.role !== 'FDE'}
              />
            </FormGroup>
          ) : null}
          <RegisterButton type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </RegisterButton>
        </Form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </RegisterCard>
    </RegisterContainer>
  );
}

export default Register;