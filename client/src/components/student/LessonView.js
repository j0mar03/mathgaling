import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  
  // Hardcoded student ID for prototype
  const studentId = 1;
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`/api/content/${id}`);
        setContent(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson content:', err);
        setError('Failed to load lesson content. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchContent();
    
    // Start timer
    const startTime = Date.now();
    
    // Update time spent every second
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    // Track scroll progress
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      // Calculate scroll percentage
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      setScrollProgress(Math.min(Math.round(scrollPercentage), 100));
      
      // Mark lesson as completed when user reaches the bottom
      if (scrollPercentage > 90 && !lessonCompleted) {
        setLessonCompleted(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Update engagement metrics
    const updateEngagement = async () => {
      try {
        await axios.post(`/api/students/${studentId}/engagement`, {
          sessionId: Date.now().toString(),
          timeOnTask: 60, // 1 minute
          helpRequests: 0,
          disengagementIndicators: {}
        });
      } catch (err) {
        console.error('Error updating engagement metrics:', err);
      }
    };
    
    // Update engagement metrics every minute
    const engagementInterval = setInterval(updateEngagement, 60000);
    
    // Initial engagement update
    updateEngagement();
    
    return () => {
      clearInterval(timer);
      clearInterval(engagementInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [id, lessonCompleted]);
  
  const handleComplete = async () => {
    try {
      // Mark the knowledge component as completed
      await axios.put(`/api/students/${studentId}/knowledge-components/${content.knowledge_component_id}/complete`);
      
      // Navigate back to dashboard
      navigate('/student');
    } catch (err) {
      console.error('Error marking lesson as completed:', err);
      // Navigate anyway
      navigate('/student');
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading lesson...</h2>
        <p>Please wait while we prepare your learning materials.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/student')}>Back to Dashboard</button>
      </div>
    );
  }
  
  // Format time spent
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="lesson-container">
      <div className="lesson-header">
        <div className="lesson-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${scrollProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{scrollProgress}% completed</span>
        </div>
        <div className="lesson-timer">Time: {formatTime(timeSpent)}</div>
      </div>
      
      <div className="lesson-content">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>
      
      <div className="lesson-navigation">
        <button onClick={() => navigate('/student')}>Back to Dashboard</button>
        <button 
          className="complete-button" 
          onClick={handleComplete}
          disabled={!lessonCompleted}
        >
          {lessonCompleted ? 'Mark as Completed' : 'Scroll to End to Complete'}
        </button>
      </div>
      
      {lessonCompleted && (
        <div className="completion-message">
          <h3>Great job!</h3>
          <p>You've completed this lesson. Click "Mark as Completed" to update your progress.</p>
        </div>
      )}
    </div>
  );
};

export default LessonView;
