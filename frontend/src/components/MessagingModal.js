import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';

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

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const SchoolInfo = styled.div`
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const SchoolName = styled.div`
  font-weight: 600;
  color: #212529;
  margin-bottom: 4px;
`;

const PrincipalInfo = styled.div`
  color: #6c757d;
  font-size: 0.9rem;
`;

const MessageForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #0a58ca;
    box-shadow: 0 0 0 2px rgba(10, 88, 202, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  
  ${({ variant }) => {
    if (variant === 'primary') {
      return `
        background: #0a58ca;
        color: white;
        border-color: #0a58ca;
        
        &:hover {
          background: #084298;
          border-color: #084298;
        }
        
        &:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background: white;
        color: #6c757d;
        border-color: #ced4da;
        
        &:hover {
          background: #f8f9fa;
        }
      `;
    }
  }}
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #0a58ca;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 8px;
`;

const SuccessMessage = styled.div`
  color: #198754;
  font-size: 0.9rem;
  margin-top: 8px;
`;

const MessagingModal = ({ isOpen, onClose, schoolName, schoolData }) => {
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

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Send Message to {recipient?.role === 'AEO' ? 'AEO' : 'Principal'}</ModalTitle>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>
        
        <SchoolInfo>
          <SchoolName>{schoolName}</SchoolName>
          <PrincipalInfo>
            {loading ? 'Loading recipient information...' : 
             recipient ? `${recipient.role}: ${recipient.name || recipient.school_name} (${recipient.username})` :
             'Recipient information not available'}
          </PrincipalInfo>
        </SchoolInfo>

        <MessageForm onSubmit={handleSubmit}>
          <div>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Message:
            </label>
            <TextArea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the principal..."
              disabled={loading}
            />
          </div>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <ButtonGroup>
            <Button type="button" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !recipient}>
              {loading ? (
                <>
                  <LoadingSpinner />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </ButtonGroup>
        </MessageForm>
      </ModalContent>
    </ModalOverlay>
  );
};

export default MessagingModal; 