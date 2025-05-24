import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './StudentDashboard.css'; // Import CSS file

// Child-friendly icons for KCs (can be expanded)
const KC_ICONS = {
  default: "🌟",
  "Representing Numbers from 1001 to 10,000": "🔢",
  "Visualizing Numbers up to 10,000": "👁️",
  "Place Value": "🏗️",
  "Digit Values": "🔢",
  "Number Words": "📝",
  "Comparing Numbers": "⚖️",
  "Rounding Numbers": "🎯",
  "Ordering Numbers": "📊",
  "Money Representation": "💰",
  "Addition": "➕",
  "Subtraction": "➖",
  "Multiplication": "✖️",
  "Division": "➗",
  "Fractions": "🍕",
  "Word Problems": "📖",
  "Estimation": "🎯",
  "Mental Math": "🧠",
  "Properties": "📐",
  "Patterns": "🔄"
};

// Filipino cultural elements and encouragements
const FILIPINO_ENCOURAGEMENTS = [
  "Magaling! (Excellent!)",
  "Napakagaling mo! (You're doing great!)",
  "Tuloy lang! (Keep going!)",
  "Kaya mo yan! (You can do it!)"
];

const FILIPINO_EMOJIS = {
  numbers: "🔢",
  money: "💰",
  shapes: "⭐",
  addition: "➕",
  subtraction: "➖",
  multiplication: "✖️",
  division: "➗"
};

const StudentDashboard = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [modules, setModules] = useState([]); // State for modules and their KCs
  const [error, setError] = useState(null);
  const [nextActivity, setNextActivity] = useState(null); 
  const [currentLearningStep, setCurrentLearningStep] = useState(null); // Primary KC for sequential path
  const [showAllTopics, setShowAllTopics] = useState(false); // Toggle for showing all topics
  const [encouragement, setEncouragement] = useState('');
  const [learningStreak, setLearningStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, token } = useAuth(); // Get user AND token from context
  const navigate = useNavigate();

  // Use the authenticated user's ID
  const studentId = user?.id;
  
  // Rotate encouragements
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEncouragement = FILIPINO_ENCOURAGEMENTS[
        Math.floor(Math.random() * FILIPINO_ENCOURAGEMENTS.length)
      ];
      setEncouragement(randomEncouragement);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Add refresh listener for URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('refresh')) {
      console.log('[StudentDashboard] Refresh triggered by URL parameter');
      // Clear the refresh param from URL
      window.history.replaceState({}, '', '/student');
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setError("Could not identify student. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        // Fetch student profile (with cache busting for Supabase)
        const studentResponse = await axios.get(`/api/students/${studentId}?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(studentResponse.data);

        // Fetch unread messages count
        try {
          const messagesResponse = await axios.get('/api/messages/inbox', {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Handle both array format and object format responses
          const messages = Array.isArray(messagesResponse.data) ? 
            messagesResponse.data : 
            (messagesResponse.data.messages || []);
          const unreadCount = messages.filter(msg => !msg.read).length;
          setUnreadMessages(unreadCount);
        } catch (msgErr) {
          console.error('Error fetching messages:', msgErr);
          // Don't set an error for the whole page if just message fetching fails
          setUnreadMessages(0); // Set to 0 as fallback
        }

        // Fetch kid-friendly next activity recommendation
        const activityResponse = await axios.get(`/api/students/${studentId}/kid-friendly-next-activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedNextActivity = activityResponse.data;
        console.log('[StudentDashboard] Kid-friendly next activity response:', {
          type: fetchedNextActivity?.type,
          kc_id: fetchedNextActivity?.kc_id,
          kc_name: fetchedNextActivity?.kc_name,
          message: fetchedNextActivity?.message,
          completed_sequence: fetchedNextActivity?.completed_sequence,
          all_mastered: fetchedNextActivity?.all_mastered,
          fullResponse: fetchedNextActivity
        });
        setNextActivity(fetchedNextActivity);

        // Fetch consolidated dashboard data (with cache busting for Supabase)
        const dashboardResponse = await axios.get(`/api/students/${studentId}/dashboard?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let fetchedModules = [];
        let fetchedRecommendedTopics = [];

        if (dashboardResponse.data && dashboardResponse.data.modules) {
          // Ensure modules have the correct structure with knowledgeComponents
          fetchedModules = dashboardResponse.data.modules.map(module => {
            // Determine quarter based on curriculum_code
            let quarter = 1; // Default to quarter 1
            if (module.curriculum_code) {
              if (module.curriculum_code.startsWith('Q2')) {
                quarter = 2;
              } else if (module.curriculum_code.startsWith('Q3')) {
                quarter = 3;
              } else if (module.curriculum_code.startsWith('Q4')) {
                quarter = 4;
              }
            }
            module.quarter = quarter;
            
            // Ensure knowledgeComponents is an array
            if (!module.knowledgeComponents || !Array.isArray(module.knowledgeComponents)) {
              module.knowledgeComponents = [];
            }
            
            return module;
          });
          
          setModules(fetchedModules);
          
          fetchedRecommendedTopics = fetchedModules
            .flatMap(module => module.knowledgeComponents)
            .filter(kc => kc.mastery < 0.8) 
            .sort((a, b) => a.mastery - b.mastery) 
            .slice(0, 3); 
          
          setRecommendedTopics(fetchedRecommendedTopics);
        } else {
          // If no modules data, try to fetch knowledge components directly
          try {
            const kcsResponse = await axios.get(`/api/students/${studentId}/grade-knowledge-components?_t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (kcsResponse.data && Array.isArray(kcsResponse.data)) {
              // Create a default module structure with the knowledge components
              fetchedModules = [
                {
                  id: 'default-module-1',
                  name: 'Module 1',
                  quarter: 1,
                  knowledgeComponents: kcsResponse.data.slice(0, Math.ceil(kcsResponse.data.length / 2))
                },
                {
                  id: 'default-module-2',
                  name: 'Module 2',
                  quarter: 2,
                  knowledgeComponents: kcsResponse.data.slice(Math.ceil(kcsResponse.data.length / 2))
                }
              ];
              
              setModules(fetchedModules);
              
              fetchedRecommendedTopics = kcsResponse.data
                .filter(kc => kc.mastery < 0.8)
                .sort((a, b) => a.mastery - b.mastery)
                .slice(0, 3);
                
              setRecommendedTopics(fetchedRecommendedTopics);
            } else {
              setModules([]);
            }
          } catch (kcsErr) {
            console.error('Error fetching knowledge components:', kcsErr);
            setModules([]);
          }
        }

        // Enhanced KC progression algorithm - finds where student left off
        let determinedStep = null;
        const allKcsFromModules = fetchedModules.flatMap(module => module.knowledgeComponents);
        
        console.log('[StudentDashboard] Total KCs from modules:', allKcsFromModules.length);
        console.log('[StudentDashboard] All KCs with mastery:', allKcsFromModules.map(kc => ({
          id: kc.id,
          name: kc.name,
          curriculum_code: kc.curriculum_code,
          mastery: kc.mastery
        })));
        
        // PRIORITY 1: Use the kid-friendly-next-activity API response if it has a valid KC
        if (fetchedNextActivity && fetchedNextActivity.kc_id && !fetchedNextActivity.completed_sequence) {
          console.log('[StudentDashboard] Using kid-friendly-next-activity API response:', fetchedNextActivity);
          
          let displayName = fetchedNextActivity.kc_name || fetchedNextActivity.name || "Your Next Learning Adventure!";
          let displayDescription = fetchedNextActivity.message || fetchedNextActivity.description || "Let's continue learning!";

          // Get emoji based on KC name (with partial matching)
          let emoji = KC_ICONS.default;
          for (const [key, value] of Object.entries(KC_ICONS)) {
            if (displayName.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(displayName.toLowerCase().split(' ')[0])) {
              emoji = value;
              break;
            }
          }

          determinedStep = { 
            ...fetchedNextActivity,
            id: fetchedNextActivity.kc_id,
            name: displayName, 
            description: displayDescription, 
            isPrimary: true,
            actionType: 'continue',
            buttonText: 'Magpatuloy',
            emoji: emoji,
            type: 'kc',
            kc_id: fetchedNextActivity.kc_id,
            mastery: 0 // Will be updated from module data if available
          };
          
          // Try to get mastery from module data
          const kcFromModules = allKcsFromModules.find(kc => kc.id === fetchedNextActivity.kc_id);
          if (kcFromModules) {
            determinedStep.mastery = Math.round((kcFromModules.mastery || 0) * 100);
          }
        }
        
        // PRIORITY 2: If no valid API response, find from modules
        if (!determinedStep && allKcsFromModules.length > 0) {
          // Sort by curriculum_code to get proper KC sequence
          const sortedKCs = [...allKcsFromModules].sort((a, b) => {
            if (a.curriculum_code && b.curriculum_code) {
              return a.curriculum_code.localeCompare(b.curriculum_code);
            }
            return 0;
          });
          
          // Find the first non-mastered KC in sequence (where student left off)
          let nextKC = null;
          let lastMasteredKC = null;
          
          for (let i = 0; i < sortedKCs.length; i++) {
            const kc = sortedKCs[i];
            const masteryValue = typeof kc.mastery === 'number' ? kc.mastery : 0;
            
            console.log(`[StudentDashboard] Checking KC ${i}: ${kc.name} (${kc.curriculum_code}), mastery: ${masteryValue}`);
            
            if (masteryValue >= 0.95) {
              // This KC is mastered
              lastMasteredKC = kc;
            } else {
              // This is the first non-mastered KC - where student should continue
              nextKC = kc;
              console.log('[StudentDashboard] Found next KC where student left off:', nextKC);
              break;
            }
          }
          
          // Determine action type and button text
          let actionType = 'start';
          let buttonText = 'Simulan';
          let description = '';
          
          if (nextKC) {
            const masteryValue = typeof nextKC.mastery === 'number' ? nextKC.mastery : 0;
            
            if (lastMasteredKC) {
              // Student has mastered some KCs, continuing progression
              actionType = 'continue';
              buttonText = 'Magpatuloy';
              description = `Ipagpatuloy ang pag-aaral sa: ${nextKC.name}`;
            } else if (masteryValue > 0 && masteryValue < 0.95) {
              // Student started but hasn't mastered this KC
              actionType = 'resume';
              buttonText = 'Ipagpatuloy';
              description = `Tapusin ang pag-aaral sa: ${nextKC.name}`;
            } else {
              // New student or first KC
              actionType = 'start';
              buttonText = 'Simulan';
              description = `Magsimula sa: ${nextKC.name}`;
            }
            
            // Get emoji based on KC name (with partial matching)
            let emoji = KC_ICONS.default;
            for (const [key, value] of Object.entries(KC_ICONS)) {
              if (nextKC.name.toLowerCase().includes(key.toLowerCase()) || 
                  key.toLowerCase().includes(nextKC.name.toLowerCase().split(' ')[0])) {
                emoji = value;
                break;
              }
            }
            
            determinedStep = {
              id: nextKC.id,
              name: nextKC.name,
              description: description || `Let's learn all about: ${nextKC.name}!`,
              emoji: emoji,
              mastery: Math.round(masteryValue * 100),
              difficulty: nextKC.difficulty || 'medium',
              type: 'kc',
              isPrimary: true,
              actionType: actionType,
              buttonText: buttonText
            };
          } else if (lastMasteredKC) {
            // All KCs are mastered - perfect student!
            actionType = 'perfect';
            buttonText = 'Magpatuloy';
            description = 'Napakahusay! Lahat ng paksa ay natapos na. Mag-review tayo!';
            
            determinedStep = {
              id: lastMasteredKC.id,
              name: 'Perfect Mastery!',
              description: description,
              emoji: '🏆',
              mastery: 100,
              difficulty: 'mastered',
              type: 'review',
              isPrimary: true,
              actionType: actionType,
              buttonText: buttonText
            };
          }
        }
        
        // This fallback is now handled as PRIORITY 1 above
        
        // Fallback 2: If still no step, use the first recommended topic
        if (!determinedStep && fetchedRecommendedTopics.length > 0) {
          const firstRecommended = fetchedRecommendedTopics[0];
          determinedStep = {
            id: firstRecommended.id,
            name: firstRecommended.name,
            description: firstRecommended.description || `Let's explore: ${firstRecommended.name}!`,
            emoji: KC_ICONS[firstRecommended.name] || KC_ICONS.default,
            mastery: Math.round(firstRecommended.mastery * 100),
            difficulty: firstRecommended.difficulty || 'medium',
            type: 'kc',
            isPrimary: true, 
          };
        }
        
        // Final fallback: If still no step determined, find the first KC for the grade level
        if (!determinedStep) {
          console.log('[StudentDashboard] No determined step found, using first KC for grade level');
          
          // Try to get the first KC from the sorted KCs
          let firstKC = null;
          if (allKcsFromModules && allKcsFromModules.length > 0) {
            // Sort by curriculum_code to get the first KC in sequence
            const sortedKCs = [...allKcsFromModules].sort((a, b) => {
              if (a.curriculum_code && b.curriculum_code) {
                return a.curriculum_code.localeCompare(b.curriculum_code);
              }
              return 0;
            });
            firstKC = sortedKCs[0];
          }
          
          if (firstKC) {
            determinedStep = {
              id: firstKC.id,
              name: firstKC.name || "Let's Start Learning!",
              description: firstKC.description || "Ready to begin your math adventure?",
              emoji: KC_ICONS[firstKC.name] || KC_ICONS.default || "🎯",
              mastery: 0,
              difficulty: 'easy',
              type: 'kc',
              isPrimary: true,
              actionType: 'start',
              buttonText: 'Simulan'
            };
          } else {
            // Absolute fallback - no KCs found at all
            console.warn('[StudentDashboard] No KCs found for student, using minimal fallback');
            determinedStep = {
              id: null, // Don't default to a specific KC ID
              name: "Welcome to Math!",
              description: "Let's explore math together!",
              emoji: "🎯",
              mastery: 0,
              difficulty: 'easy',
              type: 'explore',
              isPrimary: true,
              actionType: 'explore',
              buttonText: 'Explore'
            };
          }
        }
        
        console.log('[StudentDashboard] Final determinedStep:', {
          id: determinedStep?.id,
          kc_id: determinedStep?.kc_id,
          name: determinedStep?.name,
          type: determinedStep?.type,
          actionType: determinedStep?.actionType,
          mastery: determinedStep?.mastery
        });
        setCurrentLearningStep(determinedStep);
        
        // Fetch learning streak and daily progress
        const progressResponse = await axios.get(`/api/students/${studentId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (progressResponse.data) {
          setLearningStreak(progressResponse.data.streak || 0);
          setExercisesCompleted(progressResponse.data.topicsCompleted || 0);
          setTotalTopics(progressResponse.data.totalTopics || 0);
          // Set daily goal to 20% of total topics, minimum 3
          setDailyGoal(Math.max(3, Math.ceil(progressResponse.data.totalTopics * 0.2)));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your personalized dashboard. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Update engagement metrics
    const updateEngagement = async () => {
      try {
        if (!studentId || !token) {
          console.log('[StudentDashboard] Missing studentId or token, skipping engagement update');
          return;
        }

        console.log('[StudentDashboard] Updating engagement metrics...');
        
        const response = await axios.post(`/api/students/${studentId}/engagement`, {
          sessionId: Date.now().toString(),
          timeOnTask: 60, // 1 minute
          helpRequests: 0,
          disengagementIndicators: {}
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.success) {
          console.log('[StudentDashboard] Engagement metrics updated successfully');
        } else {
          console.warn('[StudentDashboard] Engagement update response missing success flag:', response.data);
        }
      } catch (err) {
        // Only log error if it's not a 401/403 (unauthorized/forbidden)
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error('[StudentDashboard] Error updating engagement metrics:', {
            error: err.message,
            status: err.response?.status,
            data: err.response?.data
          });
        }
      }
    };
    
    // Update engagement metrics every minute
    const engagementInterval = setInterval(updateEngagement, 60000);
    
    // Initial engagement update
    updateEngagement();
    
    return () => {
      console.log('[StudentDashboard] Cleaning up engagement interval');
      clearInterval(engagementInterval);
    };
  }, [studentId, token]); // Add token to dependency array
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading your fun math adventure...</h2>
        <p>Please wait while we prepare your learning journey!</p>
        <div className="loading-animation">🌟</div>
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
  
  // Helper function to get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#4caf50'; // Green
      case 'medium': return '#2196f3'; // Blue
      case 'challenging': return '#ff9800'; // Orange
      default: return '#4a90e2'; // Default blue
    }
  };
  
  const handleStartBookQuiz = () => {
    navigate('/student/book-quiz-dashboard');
  };

  const handleStartChallenge = () => {
    // Redirect to the math mastery dashboard
    navigate('/student/mastery-dashboard');
  };

  return (
    <div className="student-dashboard-container">
      <div className="student-dashboard">
        {/* Welcome Header */}
        <header className="dashboard-header">
          {/* Messages Icon */}
          <div className="profile-icon" onClick={() => navigate('/student/messages')}>
            ✉️
            {unreadMessages > 0 && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#FF6B6B',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {unreadMessages}
              </div>
            )}
          </div>

          <h1>
            👋 Kamusta, {student?.name || 'Kaibigan'}!
          </h1>
          <p className="subtitle">
            Grade {student?.grade_level || '3'} Math Adventure
          </p>
          <p className="encouragement-text">
            Ready for today's math adventure? Let's learn something amazing!
          </p>
        
          <button className="progress-button" onClick={() => navigate('/student/progress')}>
            View My Progress
          </button>
        </header>
        
        {/* Progress Stats Section */}
        <div className="progress-stats">
          <div className="streak-container">
            <span className="streak-icon">🔥</span>
            <span className="streak-count">{learningStreak} Days</span>
          </div>
          
          <div className="daily-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min((exercisesCompleted / dailyGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="progress-text">
              Today's Progress: {exercisesCompleted}/{dailyGoal} topics completed
            </p>
          </div>
        </div>

        {/* Main Learning Section */}
        {currentLearningStep && currentLearningStep.isPrimary && (
          <section className="learning-path-focus">
            <div className="focus-header">
              <h2>🌟 Your Next Adventure</h2>
              <p>Ready to learn something amazing?</p>
            </div>
            <div className="focus-card">
              <div className="focus-emoji">{currentLearningStep?.emoji || '🎯'}</div>
              <div className="focus-content">
                <h3>{currentLearningStep?.name || "Let's Learn!"}</h3>
                <p className="focus-description">
                  {currentLearningStep?.description || "Ready for your next math adventure?"}
                </p>
                
                <div className="focus-details">
                  <div className="detail-item">
                    <div className="detail-label">Level</div>
                    <div className="detail-value">
                      {currentLearningStep.difficulty === 'easy' ? 'Easy 😊' :
                       currentLearningStep.difficulty === 'medium' ? 'Medium 💪' : 
                       'Hard 🌟'}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">Mastery</div>
                    <div className="detail-value">{currentLearningStep.mastery}%</div>
                  </div>
                </div>
                
                <div className="action-buttons">
                  <button
                    className="action-button practice-button"
                    onClick={() => {
                      // Handle different action types
                      if (currentLearningStep?.type === 'explore' || !currentLearningStep?.id) {
                        // If no specific KC, go to mastery dashboard to explore all topics
                        navigate('/student/mastery-dashboard');
                      } else {
                        // Use the KC ID from currentLearningStep if available
                        let quizUrl = '/student/quiz?mode=sequential&limit=8';
                        
                        if (currentLearningStep && currentLearningStep.kc_id) {
                          // Use kc_id if available (from the kid-friendly-next-activity API)
                          quizUrl = `/student/quiz?kc_id=${currentLearningStep.kc_id}&mode=sequential&limit=8`;
                        } else if (currentLearningStep && currentLearningStep.id) {
                          // Use id as KC ID
                          quizUrl = `/student/quiz?kc_id=${currentLearningStep.id}&mode=sequential&limit=8`;
                        }
                        
                        console.log('[StudentDashboard] Navigating to quiz with currentLearningStep:', currentLearningStep);
                        console.log('[StudentDashboard] Quiz URL:', quizUrl);
                        navigate(quizUrl);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {currentLearningStep?.buttonText || 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{exercisesCompleted}</div>
            <div className="stat-label">Completed</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{learningStreak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{Math.round((exercisesCompleted / Math.max(totalTopics, 1)) * 100)}%</div>
            <div className="stat-label">Progress</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-value">{dailyGoal - exercisesCompleted > 0 ? dailyGoal - exercisesCompleted : 0}</div>
            <div className="stat-label">To Goal</div>
          </div>
        </div>
        
        {/* Fun Practice Section */}
        <section className="learning-path-focus">
          <div className="focus-header">
            <h2>🎮 Fun Math Games</h2>
            <p>Choose your adventure and have fun learning!</p>
          </div>
          
          <div className="action-buttons">
            <button
              className="action-button quiz-button"
              onClick={handleStartChallenge}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Math Challenge
            </button>
            
            <button
              className="action-button mastery-button"
              onClick={handleStartBookQuiz}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Book Questions
            </button>
            
            <button
              className="action-button practice-button"
              onClick={() => navigate('/student/progress')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Progress
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
