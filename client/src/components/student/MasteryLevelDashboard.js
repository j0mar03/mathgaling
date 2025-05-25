import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './MasteryLevelDashboard.css';

const MasteryLevelDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [overallMastery, setOverallMastery] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicDetails, setShowTopicDetails] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastPracticeDate, setLastPracticeDate] = useState(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(5); // Default daily goal of 5 exercises
  const [exercisesCompleted, setExercisesCompleted] = useState(0);

  // Filipino translations
  const translations = {
    title: "Math Challenge Dashboard",
    loading: "Naglo-load ng iyong math mastery levels...",
    pleaseWait: "Maghintay ka muna habang inihahanda namin ang iyong learning journey!",
    error: "Ay! May nangyaring mali",
    tryAgain: "Subukan Muli",
    currentStreak: "Current Streak",
    lastPractice: "Huling Practice",
    overallMastery: "Overall Mastery",
    startChallenge: "Simulan ang Math Challenge 🚀",
    practiceTopic: "Practice This Topic",
    days: "araw",
    never: "Hindi pa",
    advanced: "Advanced",
    intermediate: "Intermediate",
    beginner: "Beginner",
    starter: "Starter",
    masteryMessages: {
      master: "Math Master ka na! Handa ka na para sa advanced challenges!",
      great: "Magaling! Patuloy lang sa pag-aaral!",
      getting: "Malapit ka na! Practice makes perfect!",
      start: "Simulan natin ang iyong math journey!"
    },
    dailyGoal: "Daily Goal",
    exercisesLeft: "exercises pa",
    congratulations: "Congratulations!",
    newBadge: "Bagong Badge!",
    keepGoing: "Keep going!",
    close: "Isara"
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user?.id) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        // First, fetch knowledge components to ensure we have all topics (with cache busting)
        const kcResponse = await axios.get(`/api/students/${user.id}/grade-knowledge-components?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Then fetch knowledge states (with cache busting)
        const statesResponse = await axios.get(`/api/students/${user.id}/knowledge-states?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!statesResponse.data || !Array.isArray(statesResponse.data)) {
          throw new Error('Invalid response format from server');
        }

        // Create a map of knowledge states for quick lookup
        const statesMap = new Map(
          statesResponse.data.map(state => [state.knowledge_component_id, state])
        );

        // Combine knowledge components with their states
        const combinedData = kcResponse.data.map(kc => {
          const state = statesMap.get(kc.id);
          return {
            id: kc.id,
            KnowledgeComponent: kc,
            p_mastery: state?.p_mastery || 0,
            p_transit: state?.p_transit || 0.1,
            p_guess: state?.p_guess || 0.2,
            p_slip: state?.p_slip || 0.1
          };
        });

        // Sort by mastery level
        const sortedStates = combinedData.sort((a, b) => (b.p_mastery || 0) - (a.p_mastery || 0));
        setKnowledgeStates(sortedStates);
        
        // Calculate overall mastery
        const totalMastery = sortedStates.reduce((sum, state) => sum + (state.p_mastery || 0), 0);
        const averageMastery = totalMastery / sortedStates.length;
        setOverallMastery(averageMastery * 100);

        // Fetch streak data
        try {
          const streakResponse = await axios.get(`/api/students/${user.id}/streak`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStreak(streakResponse.data.streak || 0);
          setLastPracticeDate(streakResponse.data.lastPracticeDate);
          setExercisesCompleted(streakResponse.data.exercisesCompleted || 0);
        } catch (streakError) {
          console.warn('Failed to fetch streak data:', streakError);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Failed to load your math mastery levels. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, token]);

  // Add window focus listener and periodic refresh
  useEffect(() => {
    const handleFocus = () => {
      console.log("[MasteryDashboard] Window focused, refreshing data...");
      if (token && user?.id) {
        setLoading(true);
        // Re-fetch data when window gains focus (user returns from quiz)
        const fetchDataOnFocus = async () => {
          try {
            const kcResponse = await axios.get(`/api/students/${user.id}/grade-knowledge-components?_t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const statesResponse = await axios.get(`/api/students/${user.id}/knowledge-states?_t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (statesResponse.data && Array.isArray(statesResponse.data)) {
              const statesMap = new Map(
                statesResponse.data.map(state => [state.knowledge_component_id, state])
              );

              const combinedData = kcResponse.data.map(kc => {
                const state = statesMap.get(kc.id);
                return {
                  id: kc.id,
                  KnowledgeComponent: kc,
                  p_mastery: state?.p_mastery || 0,
                  p_transit: state?.p_transit || 0.1,
                  p_guess: state?.p_guess || 0.2,
                  p_slip: state?.p_slip || 0.1
                };
              });

              const sortedStates = combinedData.sort((a, b) => (b.p_mastery || 0) - (a.p_mastery || 0));
              setKnowledgeStates(sortedStates);
              
              const totalMastery = sortedStates.reduce((sum, state) => sum + (state.p_mastery || 0), 0);
              const averageMastery = totalMastery / sortedStates.length;
              setOverallMastery(averageMastery * 100);
            }
          } catch (error) {
            console.error("[MasteryDashboard] Error refreshing data:", error);
          } finally {
            setLoading(false);
          }
        };
        
        fetchDataOnFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Add periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log("[MasteryDashboard] Periodic refresh triggered");
      handleFocus();
    }, 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, [user?.id, token]);

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return '#2ecc71'; // Green
    if (mastery >= 60) return '#f1c40f'; // Yellow
    if (mastery >= 40) return '#e67e22'; // Orange
    return '#e74c3c'; // Red
  };

  const getMasteryEmoji = (mastery) => {
    if (mastery >= 80) return '🌟';
    if (mastery >= 60) return '💪';
    if (mastery >= 40) return '📚';
    return '🎯';
  };

  const getMasteryMessage = (mastery) => {
    if (mastery >= 80) return translations.masteryMessages.master;
    if (mastery >= 60) return translations.masteryMessages.great;
    if (mastery >= 40) return translations.masteryMessages.getting;
    return translations.masteryMessages.start;
  };

  const getDifficultyLevel = (mastery) => {
    if (mastery >= 80) return translations.advanced;
    if (mastery >= 60) return translations.intermediate;
    if (mastery >= 40) return translations.beginner;
    return translations.starter;
  };

  const handleStartChallenge = () => {
    navigate('/student/quiz?mode=challenge&practice_mode=true');
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setShowTopicDetails(true);
  };

  const handleCloseDetails = () => {
    setShowTopicDetails(false);
    setSelectedTopic(null);
  };

  const handleExerciseComplete = () => {
    setExercisesCompleted(prev => {
      const newCount = prev + 1;
      if (newCount >= dailyGoal) {
        setShowCongratulations(true);
      }
      return newCount;
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>{translations.loading}</h2>
        <p>{translations.pleaseWait}</p>
        <div className="loading-animation">🌟</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>{translations.error}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>{translations.tryAgain}</button>
      </div>
    );
  }

  return (
    <div className="mastery-dashboard">
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>{translations.title}</h1>
          <button 
            onClick={() => {
              console.log("[MasteryDashboard] Manual refresh requested");
              setLoading(true);
              setTimeout(() => window.location.reload(), 100); // Simple refresh
            }}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄 Refresh'}
          </button>
        </div>
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">{translations.currentStreak}</span>
            <span className="stat-value">{streak} {translations.days} 🔥</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{translations.lastPractice}</span>
            <span className="stat-value">{lastPracticeDate ? new Date(lastPracticeDate).toLocaleDateString() : translations.never}</span>
          </div>
          <div className="stat-item daily-goal">
            <span className="stat-label">{translations.dailyGoal}</span>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(exercisesCompleted / dailyGoal) * 100}%` }}
                ></div>
              </div>
              <span className="goal-text">
                {exercisesCompleted}/{dailyGoal} {translations.exercisesLeft}
              </span>
            </div>
          </div>
        </div>
        <div className="overall-mastery">
          <div className="mastery-circle" style={{ borderColor: getMasteryColor(overallMastery) }}>
            <span className="mastery-percentage">{overallMastery.toFixed(0)}%</span>
            <span className="mastery-label">{translations.overallMastery}</span>
          </div>
        </div>
      </div>

      <div className="topics-grid">
        {knowledgeStates.map((state) => {
          const mastery = (state.p_mastery || 0) * 100;
          return (
            <div 
              key={state.id} 
              className="topic-card" 
              style={{ borderColor: getMasteryColor(mastery) }}
              onClick={() => handleTopicClick(state)}
            >
              <div className="topic-header">
                <h3>{state.KnowledgeComponent?.name || 'Unknown Topic'}</h3>
                <span className="mastery-emoji">{getMasteryEmoji(mastery)}</span>
              </div>
              <div className="mastery-bar">
                <div 
                  className="mastery-fill" 
                  style={{ 
                    width: `${mastery}%`,
                    backgroundColor: getMasteryColor(mastery)
                  }}
                ></div>
              </div>
              <div className="mastery-info">
                <span className="mastery-percentage">{mastery.toFixed(0)}%</span>
                <span className="difficulty-badge">{getDifficultyLevel(mastery)}</span>
                <p className="mastery-message">{getMasteryMessage(mastery)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showTopicDetails && selectedTopic && (
        <div className="topic-details-modal">
          <div className="modal-content">
            <button className="close-button" onClick={handleCloseDetails}>×</button>
            <h2>{selectedTopic.KnowledgeComponent?.name}</h2>
            <div className="topic-stats">
              <div className="stat">
                <span className="stat-label">Mastery Level</span>
                <span className="stat-value">{(selectedTopic.p_mastery * 100).toFixed(0)}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Difficulty</span>
                <span className="stat-value">{getDifficultyLevel(selectedTopic.p_mastery * 100)}</span>
              </div>
            </div>
            <button 
              className="practice-topic-button"
              onClick={() => navigate(`/student/practice-quiz?kc_id=${selectedTopic.id}`)}
            >
              {translations.practiceTopic}
            </button>
          </div>
        </div>
      )}

      {showCongratulations && (
        <div className="congratulations-modal">
          <div className="modal-content">
            <h2>{translations.congratulations} 🎉</h2>
            <p>{translations.newBadge}</p>
            <div className="badge-animation">🏆</div>
            <p>{translations.keepGoing}</p>
            <button onClick={() => setShowCongratulations(false)}>{translations.close}</button>
          </div>
        </div>
      )}

      <div className="dashboard-actions">
        <button 
          className="start-challenge-button"
          onClick={handleStartChallenge}
        >
          {translations.startChallenge}
        </button>
      </div>
    </div>
  );
};

export default MasteryLevelDashboard; 