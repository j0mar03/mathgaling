import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './StudentDashboard.css'; // Import CSS file

// Child-friendly icons for KCs (can be expanded)
const KC_ICONS = {
  default: "🌟",
  "Representing Numbers from 1001 to 10,000": "🔢",
  // Add more specific icons as KCs are defined
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

        // Determine currentLearningStep
        let determinedStep = null;
        const allKcsFromModules = fetchedModules.flatMap(module => module.knowledgeComponents);
        
        // First, try to identify KC1 by sorting all KCs by curriculum_code and taking the first one
        // This is more reliable than searching by name
        if (allKcsFromModules.length > 0) {
          // Sort by curriculum_code to get KC1
          const sortedKCs = [...allKcsFromModules].sort((a, b) => {
            if (a.curriculum_code && b.curriculum_code) {
              return a.curriculum_code.localeCompare(b.curriculum_code);
            }
            return 0;
          });
          
          const firstKC = sortedKCs[0];
          
          if (firstKC) {
            const masteryValue = typeof firstKC.mastery === 'number' ? firstKC.mastery : 0;
            // Prioritize first KC if new student (mastery very low) or if not fully mastered
            if (masteryValue < 0.95) { 
              determinedStep = {
                id: firstKC.id,
                name: firstKC.name,
                description: firstKC.description || `Let's learn all about: ${firstKC.name}!`,
                emoji: KC_ICONS[firstKC.name] || KC_ICONS.default,
                mastery: Math.round(masteryValue * 100),
                difficulty: firstKC.difficulty || 'medium',
                type: 'kc',
                isPrimary: true,
              };
            }
          }
        }
        
        // Fallback 1: If no step determined yet AND fetchedNextActivity exists
        if (!determinedStep && fetchedNextActivity) {
          let displayName = fetchedNextActivity.name;
          let displayDescription = fetchedNextActivity.description || "Let's tackle this next challenge!";

          // If the activity type from backend is NOT 'kc' (meaning it's a general sequential quiz),
          // use generic text that matches the button's general quiz target.
          // This assumes fetchedNextActivity has a 'type' property.
          if (fetchedNextActivity.type !== 'kc') { 
            displayName = "Your Next Learning Adventure!"; 
            displayDescription = "Ready for a mix of fun questions on your learning path?";
          }

          determinedStep = { 
            ...fetchedNextActivity, 
            name: displayName, 
            description: displayDescription, 
            isPrimary: true 
          };
        }
        
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
    <div className="student-dashboard" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Comic Sans MS", "Bubblegum Sans", cursive'
    }}>
      {/* Welcome Header */}
      <header className="dashboard-header" style={{
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        textAlign: 'center',
        position: 'relative' // Added for absolute positioning of messages icon
      }}>
        {/* Messages Icon */}
        <div 
          onClick={() => navigate('/student/messages')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          <span style={{ fontSize: '24px' }}>✉️</span>
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
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {unreadMessages}
            </div>
          )}
        </div>

        <h1 style={{
          fontSize: '2.5em',
          color: '#fff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          marginBottom: '10px'
        }}>
          👋 Kamusta, {student?.name || 'Kaibigan'}!
        </h1>
        <p style={{
          fontSize: '1.2em',
          color: '#fff',
          marginBottom: '15px'
        }}>
          Grade {student?.grade_level || '3'} Math Adventure
        </p>
        
        {/* Learning Streak */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '10px 20px',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>🔥</span>
            <span style={{ fontSize: '1.2em', color: '#FF6B6B' }}>
              {learningStreak} Days Streak!
            </span>
          </div>
        </div>

        {/* Daily Progress */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '15px',
          borderRadius: '15px',
          marginTop: '15px'
        }}>
          <p style={{ marginBottom: '10px', color: '#333' }}>
            Today's Progress: {exercisesCompleted}/{dailyGoal} topics
          </p>
          <div style={{
            height: '20px',
            background: '#E0E0E0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(exercisesCompleted / dailyGoal) * 100}%`,
              background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </header>

      {/* Main Learning Section */}
      {currentLearningStep && currentLearningStep.isPrimary && (
        <section style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '3px solid #FFD700'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '2em',
              color: '#FF6B6B',
              marginBottom: '10px'
            }}>
              🚀 Your Next Math Adventure! 🚀
            </h2>
            <p style={{ fontSize: '1.2em', color: '#666' }}>
              Let's learn together, {student?.name || 'Kaibigan'}!
            </p>
          </div>

          <div style={{
            background: '#f8f9fa',
            borderRadius: '15px',
            padding: '20px',
            border: '2px dashed #FFD700'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '48px' }}>
                {currentLearningStep.emoji || '🌟'}
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.5em',
                  color: '#333',
                  marginBottom: '10px'
                }}>
                  {currentLearningStep.name}
                </h3>
                <p style={{ color: '#666' }}>
                  {currentLearningStep.description}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <div style={{
                background: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <span style={{ color: '#666' }}>Level: </span>
                <span style={{
                  color: currentLearningStep.difficulty === 'easy' ? '#4CAF50' :
                         currentLearningStep.difficulty === 'medium' ? '#2196F3' : '#FF9800',
                  fontWeight: 'bold'
                }}>
                  {currentLearningStep.difficulty === 'easy' ? 'Madali 😊' :
                   currentLearningStep.difficulty === 'medium' ? 'Katamtaman 💪' : 
                   'Mahirap 🌟'}
                </span>
              </div>

              <div style={{
                background: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <span style={{ color: '#666' }}>Your Power: </span>
                <span style={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                  {currentLearningStep.mastery}%
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  // Don't include start=1 parameter to allow the system to determine the appropriate starting KC
                  // based on the student's mastery level
                  let quizUrl = '/student/quiz?mode=sequential&limit=8';
                  if (currentLearningStep && currentLearningStep.id) {
                    const response = await axios.get(`/api/kcs/${currentLearningStep.id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data) {
                      quizUrl = `/student/quiz?kc_id=${currentLearningStep.id}&mode=sequential&limit=8`;
                    }
                  }
                  navigate(quizUrl);
                } catch (error) {
                  navigate('/student/quiz?mode=sequential&limit=8');
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                border: 'none',
                fontSize: '1.2em',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 15px rgba(255,107,107,0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Simulan na! (Let's Start!) ✨
            </button>
          </div>
        </section>
      )}

      {/* Fun Practice Section */}
      <section style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2em',
          color: '#FF6B6B',
          marginBottom: '20px'
        }}>
          🎮 Fun Math Games 🎮
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Math Challenge Card */}
          <div style={{
            background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(76,175,80,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Math Challenge</h3>
            <p style={{ marginBottom: '20px' }}>Try fun math questions!</p>
            <button
              onClick={handleStartChallenge}
              style={{
                background: 'white',
                color: '#4CAF50',
                padding: '12px 25px',
                borderRadius: '25px',
                border: 'none',
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              Start Challenge 🚀
            </button>
          </div>

          {/* Book Quiz Card */}
          <div style={{
            background: 'linear-gradient(135deg, #2196F3, #03A9F4)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(33,150,243,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Book Questions</h3>
            <p style={{ marginBottom: '20px' }}>Practice with your textbook!</p>
            <button
              onClick={handleStartBookQuiz}
              style={{
                background: 'white',
                color: '#2196F3',
                padding: '12px 25px',
                borderRadius: '25px',
                border: 'none',
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              Start Quiz 📝
            </button>
          </div>

          {/* Progress Card */}
          <div style={{
            background: 'linear-gradient(135deg, #9C27B0, #E91E63)',
            borderRadius: '15px',
            padding: '20px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(156,39,176,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>My Progress</h3>
            <p style={{ marginBottom: '20px' }}>See how you're doing!</p>
            <button
              onClick={() => navigate('/student/progress')}
              style={{
                background: 'white',
                color: '#9C27B0',
                padding: '12px 25px',
                borderRadius: '25px',
                border: 'none',
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              View Progress 📈
            </button>
          </div>
        </div>
      </section>

      {/* Show All Topics Button */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setShowAllTopics(!showAllTopics)}
          style={{
            background: showAllTopics ? '#FF6B6B' : '#4CAF50',
            color: 'white',
            padding: '12px 25px',
            borderRadius: '25px',
            border: 'none',
            fontSize: '1.1em',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}
        >
          {showAllTopics ? 'Itago ang Lahat ng Paksa 📚' : 'Ipakita ang Lahat ng Paksa 📚'}
        </button>
      </div>

      {/* All Topics Section */}
      {showAllTopics && (
        <section style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2em',
            color: '#FF6B6B',
            marginBottom: '20px'
          }}>
            Lahat ng Math Topics 📚
          </h2>
          
          {modules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '1.2em', color: '#666' }}>
                No topics available yet. Please check back later!
              </p>
            </div>
          ) : (
            /* Quarter Sections */
            ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'].map((quarter, index) => {
              // Filter modules for this quarter
              const quarterModules = modules.filter(module => module.quarter === index + 1);
              
              // Skip rendering this quarter if no modules
              if (quarterModules.length === 0) return null;
              
              return (
                <div key={quarter} style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '1.8em',
                    color: '#333',
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {quarter}
                  </h3>
                  
                  {/* Module Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    padding: '10px'
                  }}>
                    {quarterModules.map(module => (
                      <div key={module.id} style={{
                        background: '#f8f9fa',
                        borderRadius: '15px',
                        padding: '20px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}>
                        <h4 style={{
                          fontSize: '1.2em',
                          color: '#333',
                          marginBottom: '15px'
                        }}>
                          {module.name}
                        </h4>
                        
                        {/* Knowledge Components */}
                        {module.knowledgeComponents && module.knowledgeComponents.length > 0 ? (
                          module.knowledgeComponents.map(kc => (
                            <div key={kc.id} style={{
                              background: 'white',
                              borderRadius: '10px',
                              padding: '15px',
                              marginBottom: '10px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}>
                              <h5 style={{
                                fontSize: '1em',
                                color: '#666',
                                marginBottom: '10px'
                              }}>
                                {kc.name}
                              </h5>
                              
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                              }}>
                                <span style={{ color: '#666' }}>
                                  Power: {Math.round((kc.mastery || 0) * 100)}%
                                </span>
                                <button
                                  onClick={() => navigate(`/student/practice-quiz?kc_id=${kc.id}`)}
                                  style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    padding: '8px 15px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    fontSize: '0.9em',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Practice! ✏️
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '10px',
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            No topics available in this module yet.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
};

export default StudentDashboard;
