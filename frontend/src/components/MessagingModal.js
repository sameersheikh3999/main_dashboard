import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { apiService } from '../services/api';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'dark' ? '#1e293b' : '#ffffff'};
  border-radius: 20px;
  padding: 0;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
  animation: ${slideIn} 0.3s ease-out;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: ${props => props.theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(71, 85, 105, 0.8)' : 'rgba(241, 245, 249, 0.9)'};
    color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
    transform: scale(1.05);
  }
`;

const ModalBody = styled.div`
  padding: 32px;
  flex: 1;
  overflow-y: auto;
`;

const SchoolInfo = styled.div`
  background: ${props => props.theme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(248, 250, 252, 0.8)'};
  border: 1px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
`;

const SchoolName = styled.div`
  font-weight: 700;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 1.1rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PrincipalInfo = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MessageForm = styled.form`
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
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 16px;
  border: 2px solid ${props => props.theme === 'dark' ? '#475569' : '#e2e8f0'};
  border-radius: 12px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  background: ${props => props.theme === 'dark' ? '#334155' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#94a3b8' : '#9ca3af'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#334155' : '#e2e8f0'};
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
  
  ${({ variant, theme }) => {
    if (variant === 'primary') {
      return `
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border-color: #3b82f6;
        
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        &:disabled {
          background: ${theme === 'dark' ? '#475569' : '#9ca3af'};
          border-color: ${theme === 'dark' ? '#475569' : '#9ca3af'};
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `;
    } else {
      return `
        background: ${theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
        color: ${theme === 'dark' ? '#e2e8f0' : '#1e293b'};
        border-color: ${theme === 'dark' ? '#475569' : '#e2e8f0'};
        
        &:hover:not(:disabled) {
          background: ${theme === 'dark' ? 'rgba(71, 85, 105, 0.8)' : 'rgba(241, 245, 249, 0.9)'};
          transform: translateY(-1px);
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `;
    }
  }}
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MessageContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${slideIn} 0.3s ease-out;
`;

const ErrorMessage = styled(MessageContainer)`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;
`;

const SuccessMessage = styled(MessageContainer)`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #059669;
`;

const RecipientAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  margin-right: 16px;
`;

const RecipientDetails = styled.div`
  flex: 1;
`;

const RecipientName = styled.div`
  font-weight: 700;
  color: ${props => props.theme === 'dark' ? '#e2e8f0' : '#1e293b'};
  font-size: 1.1rem;
  margin-bottom: 4px;
`;

const RecipientRole = styled.div`
  color: ${props => props.theme === 'dark' ? '#94a3b8' : '#64748b'};
  font-size: 0.9rem;
  font-weight: 500;
`;

const MessagingModal = ({ isOpen, onClose, schoolName, schoolData, theme = 'light', onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipient, setRecipient] = useState(null);

  useEffect(() => {
    if (isOpen && schoolName) {
      // Check if this is an AEO message (schoolData has id and name)
      if (schoolData && schoolData.id && schoolData.name) {
        // This is an AEO message
        setRecipient({
          id: schoolData.id,
          name: schoolData.name,
          role: 'AEO'
        });
      } else {
        // This is a Principal message
        fetchPrincipal();
      }
    }
  }, [isOpen, schoolName, schoolData]);

  const fetchPrincipal = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching principal for school:', schoolName);
      const principalData = await apiService.getPrincipal(schoolName);
      console.log('Principal data received:', principalData);
      setRecipient(principalData);
    } catch (err) {
      setError(`Failed to fetch principal information: ${err.message}`);
      console.error('Error fetching principal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!recipient) {
      setError('Recipient information not available');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // For AEO messages, use a generic school name since AEOs don't have specific schools
      const schoolNameForMessage = recipient.role === 'AEO' ? 'FDE to AEO' : schoolName;
      
      await apiService.sendMessage(schoolNameForMessage, message.trim(), recipient.id);
      
      setSuccess('Message sent successfully!');
      setMessage('');
      
      // Call the callback to refresh conversations if provided
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    setSuccess('');
    setRecipient(null);
    onClose();
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent theme={theme} onClick={(e) => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            💬 Send Message
          </ModalTitle>
          <CloseButton onClick={handleClose} theme={theme}>
            ×
          </CloseButton>
        </ModalHeader>
        
        <ModalBody theme={theme}>
          <SchoolInfo theme={theme}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RecipientAvatar>
                {recipient ? getInitials(recipient.name || recipient.username) : '??'}
              </RecipientAvatar>
              <RecipientDetails>
                <RecipientName theme={theme}>
                  {recipient?.name || recipient?.username || schoolName}
                </RecipientName>
                <RecipientRole theme={theme}>
                  {loading ? 'Loading recipient information...' : 
                   recipient ? `${recipient.role || 'Recipient'} • ${recipient.school_name || 'School'}` :
                   'Recipient information not available'}
                </RecipientRole>
              </RecipientDetails>
            </div>
          </SchoolInfo>

          <MessageForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label theme={theme}>
                📝 Your Message
              </Label>
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here... Be clear and specific about what you need."
                disabled={loading}
                theme={theme}
              />
            </FormGroup>

            {error && (
              <ErrorMessage>
                ❌ {error}
              </ErrorMessage>
            )}
            
            {success && (
              <SuccessMessage>
                ✅ {success}
              </SuccessMessage>
            )}

            <ButtonGroup theme={theme}>
              <Button type="button" onClick={handleClose} disabled={loading} theme={theme}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading || !recipient} theme={theme}>
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Sending...
                  </>
                ) : (
                  <>
                    📤 Send Message
                  </>
                )}
              </Button>
            </ButtonGroup>
          </MessageForm>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default MessagingModal; 