import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import { 
  IoLockClosedOutline, 
  IoEyeOutline, 
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoCloseOutline
} from 'react-icons/io5';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 30px;
  width: 100%;
  max-width: 450px;
  position: relative;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f8f9fa;
    color: #dc3545;
  }
`;

const Title = styled.h2`
  color: #0a58ca;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  text-align: center;
  justify-content: center;
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

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
`;

const SuccessMessage = styled.div`
  color: #198754;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #d1e7dd;
  border: 1px solid #badbcc;
  border-radius: 6px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const CancelButton = styled(Button)`
  background: #6c757d;
  
  &:hover {
    background: #5a6268;
  }
`;

const PasswordChangeModal = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'new_password') {
      validatePassword(value);
    }

    // Clear messages when user starts typing
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.username || !formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New password and confirmation do not match');
      setLoading(false);
      return;
    }

    if (formData.new_password === formData.current_password) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }

    try {
      // First, verify the username and current password by attempting to login
      const loginResult = await apiService.login({
        username: formData.username,
        password: formData.current_password
      });

      if (loginResult.token) {
        // If login successful, proceed with password change
        await apiService.changePassword({
          current_password: formData.current_password,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        });

        setSuccess('Password changed successfully!');
        
        // Reset form
        setFormData({
          username: currentUser?.username || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setPasswordStrength(null);
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      if (err.message.includes('Invalid credentials') || err.message.includes('401')) {
        setError('Username or current password is incorrect');
      } else {
        setError(err.message || 'Error changing password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: currentUser?.username || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
    setPasswordStrength(null);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
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

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleCancel}>
          <IoCloseOutline />
        </CloseButton>
        
        <Title>
          <IoLockClosedOutline />
          Change Password
        </Title>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <IoPersonOutline />
              Username
            </Label>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <IoLockClosedOutline />
              Current Password
            </Label>
            <InputContainer>
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                name="current_password"
                value={formData.current_password}
                onChange={handleInputChange}
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
                value={formData.new_password}
                onChange={handleInputChange}
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
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Confirm new password"
                required
              />
              <PasswordToggle onClick={() => handlePasswordToggle('confirm')}>
                {showPasswords.confirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </PasswordToggle>
            </InputContainer>
          </FormGroup>

          <ButtonGroup>
            <Button type="submit" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
            <CancelButton type="button" onClick={handleCancel}>
              Cancel
            </CancelButton>
          </ButtonGroup>
        </Form>

        {error && <ErrorMessage><IoCloseCircleOutline /> {error}</ErrorMessage>}
        {success && <SuccessMessage><IoCheckmarkCircleOutline /> {success}</SuccessMessage>}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PasswordChangeModal; 