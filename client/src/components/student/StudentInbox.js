import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './StudentInbox.css';

const StudentInbox = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageViewOpen, setMessageViewOpen] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('/api/messages/inbox', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ensure response.data is an array
        const messageData = Array.isArray(response.data) ? response.data : 
                           response.data?.messages ? response.data.messages : [];
        
        setMessages(messageData);
        setError(null);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
        setMessages([]); // Ensure messages is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [token]);

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setMessageViewOpen(true);
    
    // Mark message as read if it isn't already
    if (!message.read) {
      markMessageAsRead(message.id);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state to mark the message as read
      setMessages(prevMessages => Array.isArray(prevMessages) ? 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        ) : []
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
      // Continue showing the message even if marking as read fails
    }
  };

  const closeMessageView = () => {
    setMessageViewOpen(false);
    setSelectedMessage(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="student-inbox">
      <div className="inbox-header">
        <h1>My Messages</h1>
        <Link to="/student" className="button">Back to Dashboard</Link>
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">
          <p>You don't have any messages yet.</p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message-item ${!message.read ? 'unread' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-info">
                <div className="message-from">
                  <strong>{message.from_name}</strong>
                  {!message.read && <span className="unread-badge">New</span>}
                </div>
                <div className="message-date">{formatDate(message.sent_at)}</div>
              </div>
              <div className="message-preview">
                {message.message.length > 60 
                  ? `${message.message.substring(0, 60)}...` 
                  : message.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message View Modal */}
      {messageViewOpen && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Message from {selectedMessage.from_name}</h2>
              <button className="close-button" onClick={closeMessageView}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="message-metadata">
                <p><strong>From:</strong> {selectedMessage.from_name}</p>
                <p><strong>Date:</strong> {formatDate(selectedMessage.sent_at)}</p>
              </div>
              <div className="message-content">
                {selectedMessage.message.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeMessageView}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInbox; 