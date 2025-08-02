import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  IoBarChartOutline, 
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoShareOutline,
  IoNotificationsOutline,
  IoMailOutline,
  IoChatbubblesOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoGridOutline,
  IoListOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailUnreadOutline,
  IoCloseOutline
} from 'react-icons/io5';
import styles from './AdminMessagingModal.module.css';

const AdminMessagingModal = ({ isOpen, onClose, theme = 'light', onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRecipientType, setSelectedRecipientType] = useState('all');
  const [recipients, setRecipients] = useState({
    fdes: [],
    aeos: [],
    principals: []
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadAllRecipients();
    }
  }, [isOpen]);

  const loadAllRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const [fdes, aeos, principals] = await Promise.all([
        apiService.getAllFDEs(),
        apiService.getAllAEOs(),
        apiService.getAllPrincipals()
      ]);

      setRecipients({
        fdes: fdes.map(fde => ({
          ...fde,
          id: fde.id,
          name: fde.username,
          role: 'FDE',
          school_name: fde.school_name || 'Unknown School'
        })),
        aeos: aeos.map(aeo => ({
          ...aeo,
          id: aeo.id,
          name: aeo.username,
          role: 'AEO',
          school_name: aeo.school_name || 'Unknown School'
        })),
        principals: principals.map(principal => ({
          ...principal,
          id: principal.id,
          name: principal.display_name || principal.username,
          role: 'Principal',
          school_name: principal.school_name || 'Unknown School'
        }))
      });
    } catch (error) {
      setError('Failed to load recipients: ' + error.message);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const getVisibleRecipients = () => {
    switch (selectedRecipientType) {
      case 'fdes':
        return recipients.fdes;
      case 'aeos':
        return recipients.aeos;
      case 'principals':
        return recipients.principals;
      case 'all':
        return [...recipients.fdes, ...recipients.aeos, ...recipients.principals];
      default:
        return [];
    }
  };

  const handleRecipientToggle = (recipientId) => {
    setSelectedRecipients(prev => {
      if (prev.includes(recipientId)) {
        return prev.filter(id => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  const handleSelectAll = () => {
    const visibleRecipients = getVisibleRecipients();
    setSelectedRecipients(visibleRecipients.map(r => r.id));
  };

  const handleSelectNone = () => {
    setSelectedRecipients([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setSendingProgress(0);
      
      const allRecipients = [...recipients.fdes, ...recipients.aeos, ...recipients.principals];
      const recipientsToMessage = allRecipients.filter(r => selectedRecipients.includes(r.id));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < recipientsToMessage.length; i++) {
        const recipient = recipientsToMessage[i];
        try {
          // Use admin messaging endpoint
          await apiService.sendAdminMessage(recipient.id, message.trim());
          successCount++;
        } catch (err) {
          console.error(`Failed to send message to ${recipient.name}:`, err);
          errorCount++;
        }
        
        // Update progress
        setSendingProgress(((i + 1) / recipientsToMessage.length) * 100);
      }
      
      if (errorCount === 0) {
        setSuccess(`Message sent successfully to all ${successCount} recipients!`);
      } else {
        setSuccess(`Message sent to ${successCount} recipients. ${errorCount} failed.`);
      }
      
      setMessage('');
      setSelectedRecipients([]);
      
      // Call the callback to refresh conversations if provided
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
        setSendingProgress(0);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to send messages');
      console.error('Error sending messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    setSuccess('');
    setSelectedRecipients([]);
    setSendingProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  const visibleRecipients = getVisibleRecipients();
  const selectedCount = selectedRecipients.length;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={`${styles.modalContent} ${theme === 'dark' ? styles.dark : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modalHeader} ${theme === 'dark' ? styles.dark : ''}`}>
          <h2 className={`${styles.modalTitle} ${theme === 'dark' ? styles.dark : ''}`}>
            📢 Admin Broadcast Message
          </h2>
          <button onClick={handleClose} className={`${styles.closeButton} ${theme === 'dark' ? styles.dark : ''}`}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.twoColumnLayout}>
            <div className={styles.leftColumn}>
              <div className={`${styles.recipientSection} ${theme === 'dark' ? styles.dark : ''}`}>
                <label className={`${styles.label} ${theme === 'dark' ? styles.dark : ''}`}>
              <IoPeopleOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Recipients ({selectedCount} selected)
                </label>
            
                <div className={styles.recipientTypeSelector}>
                  <button
                type="button"
                    className={`${styles.recipientTypeButton} ${selectedRecipientType === 'all' ? styles.active : ''} ${theme === 'dark' ? styles.dark : ''}`}
                onClick={() => setSelectedRecipientType('all')}
              >
                All Users ({visibleRecipients.length})
                  </button>
                  <button
                type="button"
                    className={`${styles.recipientTypeButton} ${selectedRecipientType === 'fdes' ? styles.active : ''} ${theme === 'dark' ? styles.dark : ''}`}
                onClick={() => setSelectedRecipientType('fdes')}
              >
                FDEs ({recipients.fdes.length})
                  </button>
                  <button
                type="button"
                    className={`${styles.recipientTypeButton} ${selectedRecipientType === 'aeos' ? styles.active : ''} ${theme === 'dark' ? styles.dark : ''}`}
                onClick={() => setSelectedRecipientType('aeos')}
              >
                AEOs ({recipients.aeos.length})
                  </button>
                  <button
                type="button"
                    className={`${styles.recipientTypeButton} ${selectedRecipientType === 'principals' ? styles.active : ''} ${theme === 'dark' ? styles.dark : ''}`}
                onClick={() => setSelectedRecipientType('principals')}
              >
                Principals ({recipients.principals.length})
                  </button>
                </div>

                <div className={styles.selectButtonsContainer}>
                  <button 
                    type="button" 
                    onClick={handleSelectAll} 
                    className={`${styles.button} ${styles.selectButton} ${theme === 'dark' ? styles.dark : ''}`}
                  >
                Select All
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSelectNone} 
                    className={`${styles.button} ${styles.selectButton} ${theme === 'dark' ? styles.dark : ''}`}
                  >
                Select None
                  </button>
            </div>

            {loadingRecipients ? (
                  <div className={`${styles.loadingContainer} ${theme === 'dark' ? styles.dark : ''}`}>
                Loading recipients...
              </div>
            ) : (
                  <div className={`${styles.recipientList} ${theme === 'dark' ? styles.dark : ''}`}>
                {visibleRecipients.map((recipient) => (
                      <div key={recipient.id} className={`${styles.recipientItem} ${theme === 'dark' ? styles.dark : ''}`}>
                        <input
                      type="checkbox"
                          className={styles.checkbox}
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={() => handleRecipientToggle(recipient.id)}
                    />
                        <div className={styles.recipientInfo}>
                          <div className={`${styles.recipientName} ${theme === 'dark' ? styles.dark : ''}`}>
                        {recipient.name}
                          </div>
                          <div className={`${styles.recipientDetails} ${theme === 'dark' ? styles.dark : ''}`}>
                        {recipient.role} • {recipient.school_name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.rightColumn}>
              <form onSubmit={handleSubmit} className={styles.messageForm}>
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${theme === 'dark' ? styles.dark : ''}`}>
                <IoArrowUpOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Broadcast Message
                  </label>
                  <textarea
                    className={`${styles.textArea} ${theme === 'dark' ? styles.dark : ''}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your broadcast message here... This will be sent to all selected recipients."
                disabled={loading}
              />
                </div>

            {sendingProgress > 0 && sendingProgress < 100 && (
              <div>
                <div style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>
                  Sending messages... {Math.round(sendingProgress)}%
                </div>
                    <div className={`${styles.progressBar} ${theme === 'dark' ? styles.dark : ''}`}>
                      <div className={styles.progressFill} style={{ width: `${sendingProgress}%` }} />
                    </div>
              </div>
            )}

                            {error && (
                  <div className={`${styles.errorMessage} ${theme === 'dark' ? styles.dark : ''}`}>
                    <IoCloseCircleOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {error}
                  </div>
                )}
            
                            {success && (
                  <div className={`${styles.successMessage} ${theme === 'dark' ? styles.dark : ''}`}>
                    <IoCheckmarkCircleOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {success}
                  </div>
                )}

                <div className={styles.buttonGroup}>
                  <button 
                    type="button" 
                    onClick={handleClose} 
                    disabled={loading} 
                    className={`${styles.button} ${theme === 'dark' ? styles.dark : ''}`}
                  >
                Cancel
                  </button>
                  <button 
                type="submit" 
                disabled={loading || selectedRecipients.length === 0} 
                    className={`${styles.button} ${styles.primary} ${theme === 'dark' ? styles.dark : ''}`}
              >
                {loading ? (
                  <>
                        <div className={styles.loadingSpinner} />
                    Sending...
                  </>
                ) : (
                  <>
                    <IoArrowUpOutline style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Send to {selectedCount} Recipients
                  </>
                )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagingModal; 