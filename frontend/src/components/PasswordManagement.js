import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import { 
  IoLockClosedOutline, 
  IoEyeOutline, 
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoMailOutline,
  IoPersonOutline
} from 'react-icons/io5';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #0a58ca;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
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

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 4px;
  
  &:hover {
    color: #0a58ca;
  }
`;

const Button = styled.button`
  background: #0a58ca;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: #084298;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: #6c757d;
  
  &:hover {
    background: #5a6268;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const SuccessMessage = styled.div`
  color: #198754;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const PasswordStrength = styled.div`
  margin-top: 10px;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
`;

const StrengthWeak = styled(PasswordStrength)`
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
`;

const StrengthMedium = styled(PasswordStrength)`
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
`;

const StrengthStrong = styled(PasswordStrength)`
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
`;

const Tab = styled.button`
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: ${props => props.active ? '#0a58ca' : '#6c757d'};
  border-bottom: 2px solid ${props => props.active ? '#0a58ca' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: #0a58ca;
  }
`;

const PasswordRequirements = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 15px;
  font-size: 0.9rem;
`;

const Requirement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: ${props => props.met ? '#198754' : '#6c757d'};
`;

const PasswordManagement = () => {
  const [activeTab, setActiveTab] = useState('change');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    reset: false,
    resetConfirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Password change form
  const [changeForm, setChangeForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Password reset form
  const [resetForm, setResetForm] = useState({
    username: '',
    role: '',
    reset_token: '',
    new_password: '',
    confirm_password: ''
  });

  // Reset request form
  const [resetRequestForm, setResetRequestForm] = useState({
    username: '',
    role: ''
  });

  const handlePasswordToggle = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = async (password) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    try {
      const result = await apiService.validatePassword(password);
      setPasswordStrength(result);
      setValidationErrors(result.errors || []);
    } catch (error) {
      console.error('Password validation error:', error);
    }
  };

  const handleChangeFormChange = (e) => {
    const { name, value } = e.target;
    setChangeForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'new_password') {
      validatePassword(value);
    }
  };

  const handleResetFormChange = (e) => {
    const { name, value } = e.target;
    setResetForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'new_password') {
      validatePassword(value);
    }
  };

  const handleResetRequestFormChange = (e) => {
    const { name, value } = e.target;
    setResetRequestForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.changePassword(changeForm);
      setSuccess('Password changed successfully!');
      setChangeForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordStrength(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.requestPasswordReset(resetRequestForm);
      setSuccess(`Password reset request submitted successfully! Reset token: ${result.reset_token}`);
      setResetRequestForm({
        username: '',
        role: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.confirmPasswordReset(resetForm);
      setSuccess('Password reset successfully!');
      setResetForm({
        username: '',
        role: '',
        reset_token: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordStrength(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthComponent = () => {
    if (!passwordStrength) return null;

    const { strength, score, errors } = passwordStrength;
    
    switch (strength) {
      case 'strong':
        return (
          <StrengthStrong>
            <IoShieldCheckmarkOutline /> Strong password (Score: {score}/6)
          </StrengthStrong>
        );
      case 'medium':
        return (
          <StrengthMedium>
            <IoWarningOutline /> Medium strength password (Score: {score}/6)
          </StrengthMedium>
        );
      case 'weak':
        return (
          <StrengthWeak>
            <IoCloseCircleOutline /> Weak password (Score: {score}/6)
          </StrengthWeak>
        );
      default:
        return null;
    }
  };

  const renderPasswordRequirements = () => {
    const requirements = [
      { text: 'At least 8 characters long', met: !validationErrors.includes('Password must be at least 8 characters long') },
      { text: 'Contains uppercase letter', met: !validationErrors.includes('Password must contain at least one uppercase letter') },
      { text: 'Contains lowercase letter', met: !validationErrors.includes('Password must contain at least one lowercase letter') },
      { text: 'Contains number', met: !validationErrors.includes('Password must contain at least one number') },
      { text: 'Contains special character', met: !validationErrors.includes('Password must contain at least one special character') }
    ];

    return (
      <PasswordRequirements>
        <strong>Password Requirements:</strong>
        {requirements.map((req, index) => (
          <Requirement key={index} met={req.met}>
            {req.met ? <IoCheckmarkCircleOutline /> : <IoCloseCircleOutline />}
            {req.text}
          </Requirement>
        ))}
      </PasswordRequirements>
    );
  };

  return (
    <Container>
      <TabContainer>
        <Tab 
          active={activeTab === 'change'} 
          onClick={() => setActiveTab('change')}
        >
          <IoLockClosedOutline /> Change Password
        </Tab>
        <Tab 
          active={activeTab === 'reset'} 
          onClick={() => setActiveTab('reset')}
        >
          <IoRefreshOutline /> Reset Password
        </Tab>
      </TabContainer>

      {activeTab === 'change' && (
        <Card>
          <Title>
            <IoLockClosedOutline />
            Change Password
          </Title>
          
          <Form onSubmit={handlePasswordChange}>
            <FormGroup>
              <Label>
                <IoPersonOutline />
                Current Password
              </Label>
              <InputContainer>
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="current_password"
                  value={changeForm.current_password}
                  onChange={handleChangeFormChange}
                  placeholder="Enter current password"
                  required
                />
                <PasswordToggle onClick={() => handlePasswordToggle('current')}>
                  {showPasswords.current ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </PasswordToggle>
              </InputContainer>
            </FormGroup>

            <FormGroup>
              <Label>
                <IoLockClosedOutline />
                New Password
              </Label>
              <InputContainer>
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="new_password"
                  value={changeForm.new_password}
                  onChange={handleChangeFormChange}
                  placeholder="Enter new password"
                  required
                />
                <PasswordToggle onClick={() => handlePasswordToggle('new')}>
                  {showPasswords.new ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </PasswordToggle>
              </InputContainer>
              {getPasswordStrengthComponent()}
              {renderPasswordRequirements()}
            </FormGroup>

            <FormGroup>
              <Label>
                <IoLockClosedOutline />
                Confirm New Password
              </Label>
              <InputContainer>
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={changeForm.confirm_password}
                  onChange={handleChangeFormChange}
                  placeholder="Confirm new password"
                  required
                />
                <PasswordToggle onClick={() => handlePasswordToggle('confirm')}>
                  {showPasswords.confirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </PasswordToggle>
              </InputContainer>
            </FormGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Form>

          {error && <ErrorMessage><IoCloseCircleOutline /> {error}</ErrorMessage>}
          {success && <SuccessMessage><IoCheckmarkCircleOutline /> {success}</SuccessMessage>}
        </Card>
      )}

      {activeTab === 'reset' && (
        <>
          <Card>
            <Title>
              <IoMailOutline />
              Request Password Reset
            </Title>
            
            <Form onSubmit={handlePasswordResetRequest}>
              <FormGroup>
                <Label>
                  <IoPersonOutline />
                  Username or EMIS Number
                </Label>
                <Input
                  type="text"
                  name="username"
                  value={resetRequestForm.username}
                  onChange={handleResetRequestFormChange}
                  placeholder="Enter username or EMIS number"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <IoInformationCircleOutline />
                  Role (for EMIS lookup)
                </Label>
                <select
                  name="role"
                  value={resetRequestForm.role}
                  onChange={handleResetRequestFormChange}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select role</option>
                  <option value="Principal">Principal</option>
                  <option value="AEO">AEO</option>
                  <option value="FDE">FDE</option>
                </select>
              </FormGroup>

              <Button type="submit" disabled={loading}>
                {loading ? 'Requesting Reset...' : 'Request Password Reset'}
              </Button>
            </Form>

            {error && <ErrorMessage><IoCloseCircleOutline /> {error}</ErrorMessage>}
            {success && <SuccessMessage><IoCheckmarkCircleOutline /> {success}</SuccessMessage>}
          </Card>

          <Card>
            <Title>
              <IoLockClosedOutline />
              Confirm Password Reset
            </Title>
            
            <Form onSubmit={handlePasswordResetConfirm}>
              <FormGroup>
                <Label>
                  <IoPersonOutline />
                  Username
                </Label>
                <Input
                  type="text"
                  name="username"
                  value={resetForm.username}
                  onChange={handleResetFormChange}
                  placeholder="Enter username"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <IoInformationCircleOutline />
                  Reset Token
                </Label>
                <Input
                  type="text"
                  name="reset_token"
                  value={resetForm.reset_token}
                  onChange={handleResetFormChange}
                  placeholder="Enter reset token"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <IoLockClosedOutline />
                  New Password
                </Label>
                <InputContainer>
                  <Input
                    type={showPasswords.reset ? 'text' : 'password'}
                    name="new_password"
                    value={resetForm.new_password}
                    onChange={handleResetFormChange}
                    placeholder="Enter new password"
                    required
                  />
                  <PasswordToggle onClick={() => handlePasswordToggle('reset')}>
                    {showPasswords.reset ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </PasswordToggle>
                </InputContainer>
                {getPasswordStrengthComponent()}
                {renderPasswordRequirements()}
              </FormGroup>

              <FormGroup>
                <Label>
                  <IoLockClosedOutline />
                  Confirm New Password
                </Label>
                <InputContainer>
                  <Input
                    type={showPasswords.resetConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={resetForm.confirm_password}
                    onChange={handleResetFormChange}
                    placeholder="Confirm new password"
                    required
                  />
                  <PasswordToggle onClick={() => handlePasswordToggle('resetConfirm')}>
                    {showPasswords.resetConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </PasswordToggle>
                </InputContainer>
              </FormGroup>

              <Button type="submit" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </Form>

            {error && <ErrorMessage><IoCloseCircleOutline /> {error}</ErrorMessage>}
            {success && <SuccessMessage><IoCheckmarkCircleOutline /> {success}</SuccessMessage>}
          </Card>
        </>
      )}
    </Container>
  );
};

export default PasswordManagement; 