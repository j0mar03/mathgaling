import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './BookQuizDashboard.css';

const BookQuizDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKnowledgeComponents = async () => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Get knowledge components for student's grade level
      const response = await axios.get(`/api/students/${user.id}/grade-knowledge-components`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      // Get student's knowledge states to check completion status
      const statesResponse = await axios.get(`/api/students/${user.id}/knowledge-states`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Create a map of knowledge states for quick lookup
      const knowledgeStates = new Map(
        statesResponse.data.map(state => [state.knowledge_component_id, state])
      );

      // Sort knowledge components by ID and add completion status
      const sortedKCs = response.data
        .map(kc => {
          const state = knowledgeStates.get(kc.id);
          return {
            ...kc,
            id: parseInt(kc.id),
            completed: state?.p_mastery >= 0.6 || false, // Lower threshold to 60% for completion
            mastery: state?.p_mastery || 0
          };
        })
        .sort((a, b) => a.id - b.id);

      setKnowledgeComponents(sortedKCs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching knowledge components:', err);
      setError(err.response?.data?.error || 'Failed to load knowledge components. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeComponents();
  }, [token, user.id]);

  // Add effect to refresh data when returning from quiz
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('refresh') === 'true') {
      fetchKnowledgeComponents();
      // Remove the refresh parameter from URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  const handleStartQuiz = (kcId) => {
    navigate(`/student/practice-quiz?kc_id=${kcId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Book Quiz Dashboard...</h2>
        <p>Please wait while we prepare your quiz materials.</p>
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
    <div className="book-quiz-dashboard">
      <div className="dashboard-header">
        <h1>Book Quiz Dashboard</h1>
        <p>Practice quizzes for each knowledge component (5 questions each)</p>
      </div>

      <div className="knowledge-components-grid">
        {knowledgeComponents.map((kc, index) => {
          // Enable if it's the first KC or if previous KC is completed
          const isPreviousCompleted = index === 0 || knowledgeComponents[index - 1].completed;
          // Enable if previous is completed or this KC is completed
          const isEnabled = isPreviousCompleted || kc.completed;
          
          return (
            <div key={kc.id} className={`kc-card ${kc.completed ? 'completed' : ''}`}>
              <div className="kc-header">
                <span className="kc-number">KC{kc.id}</span>
                <h3>{kc.name}</h3>
              </div>
              <div className="kc-content">
                <p className="kc-description">{kc.description}</p>
                <div className="kc-metrics">
                  <div className="metric">
                    <span className="metric-label">Difficulty</span>
                    <span className="metric-value">{kc.difficulty || 'Medium'}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Questions</span>
                    <span className="metric-value">5</span>
                  </div>
                  {kc.completed && (
                    <div className="metric mastery">
                      <span className="metric-label">Mastery</span>
                      <span className="metric-value">{(kc.mastery * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                className={`start-quiz-button ${!isEnabled ? 'disabled' : ''}`}
                onClick={() => handleStartQuiz(kc.id)}
                disabled={!isEnabled}
              >
                {!isEnabled ? 
                  'Complete Previous KC First' : 
                  kc.completed ? 'Practice Again' : 'Start Practice Quiz'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookQuizDashboard; 