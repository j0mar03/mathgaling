import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './StudentProgress.css'; // Import CSS file

// Register ChartJS components
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StudentProgress = () => {
  console.log('🟢 [StudentProgress] STUDENT PROGRESS COMPONENT LOADING - This should be the student view');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [allKnowledgeComponents, setAllKnowledgeComponents] = useState([]); // To store all KCs
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(12); // Number of topics to show per page
  const [selectedArea, setSelectedArea] = useState('all'); // Filter by curriculum area
  const [showOnlyStarted, setShowOnlyStarted] = useState(false); // Filter by started status
  const { user, token } = useAuth(); // Get user AND token from context

  // Use the authenticated user's ID
  const studentId = user?.id;
  
  // Add refresh logic for URL parameters (similar to other components)
  useEffect(() => {
    console.log('[StudentProgress] Component mounted - URL:', window.location.pathname);
    console.log('[StudentProgress] User role:', user?.role, 'User ID:', user?.id);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh')) {
      console.log('[StudentProgress] Refresh triggered by URL parameter');
      // Clear the refresh param from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      // Ensure studentId is available before fetching
      if (!studentId) {
        setError("Could not identify student. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        // Ensure token is available
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Add authorization header to all requests
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch student profile (with cache busting for Supabase)
        const studentResponse = await axios.get(`/api/students/${studentId}?_t=${Date.now()}`, { headers });
        setStudent(studentResponse.data);
        
        // Fetch knowledge states (with cache busting for Supabase)
        const knowledgeStatesResponse = await axios.get(`/api/students/${studentId}/knowledge-states?_t=${Date.now()}`, { headers });
        setKnowledgeStates(knowledgeStatesResponse.data);

        // Fetch knowledge components for the student's grade level (with cache busting)
        const gradeKCsResponse = await axios.get(`/api/students/${studentId}/grade-knowledge-components?_t=${Date.now()}`, { headers });
        setAllKnowledgeComponents(gradeKCsResponse.data);
        
        // Fetch learning path (which includes responses)
        // const learningPathResponse = await axios.get(`/api/students/${studentId}/learning-path`, { headers }); // We might not need this if allKCs gives us the path
        
        // Fetch detailed performance (which includes responses)
        // Call the student-specific endpoint with auth header
        const performanceResponse = await axios.get(`/api/students/me/detailed-performance`, { headers });
        if (performanceResponse.data.recentResponses) {
          setResponses(performanceResponse.data.recentResponses);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError('Failed to load your progress data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId, token]);

  // Enhanced refresh functionality with quiz completion detection
  useEffect(() => {
    const handleFocus = () => {
      console.log("[StudentProgress] Window focused, refreshing data...");
      if (token && studentId) {
        // Check if returning from quiz (URL params or localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const returnedFromQuiz = urlParams.get('from_quiz') || localStorage.getItem('quiz_completed');
        
        if (returnedFromQuiz) {
          console.log("[StudentProgress] Detected return from quiz, forcing refresh");
          // Clear the indicator
          urlParams.delete('from_quiz');
          localStorage.removeItem('quiz_completed');
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        setLoading(true);
        // Re-fetch data when window gains focus
        const fetchDataOnFocus = async () => {
          try {
            const headers = { Authorization: `Bearer ${token}` };

            const studentResponse = await axios.get(`/api/students/${studentId}?_t=${Date.now()}`, { headers });
            setStudent(studentResponse.data);
            
            const knowledgeStatesResponse = await axios.get(`/api/students/${studentId}/knowledge-states?_t=${Date.now()}`, { headers });
            setKnowledgeStates(knowledgeStatesResponse.data);

            const gradeKCsResponse = await axios.get(`/api/students/${studentId}/grade-knowledge-components?_t=${Date.now()}`, { headers });
            setAllKnowledgeComponents(gradeKCsResponse.data);
            
            // Also refresh recent activity
            const performanceResponse = await axios.get(`/api/students/me/detailed-performance?_t=${Date.now()}`, { headers });
            if (performanceResponse.data.recentResponses) {
              setResponses(performanceResponse.data.recentResponses);
            }
            
          } catch (error) {
            console.error("[StudentProgress] Error refreshing data:", error);
          } finally {
            setLoading(false);
          }
        };
        
        fetchDataOnFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Add periodic refresh every 30 seconds, but only if user is active
    let lastActivity = Date.now();
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
    
    const refreshInterval = setInterval(() => {
      // Only refresh if user was active in the last 2 minutes
      if (Date.now() - lastActivity < 120000) {
        console.log("[StudentProgress] Periodic refresh triggered");
        handleFocus();
      }
    }, 30000);
    
    // Enhanced quiz completion check with retry mechanism
    const checkQuizCompletion = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const quizCompleted = urlParams.get('from_quiz') || localStorage.getItem('quiz_completed');
      
      if (quizCompleted) {
        console.log('[StudentProgress] Quiz completion detected, implementing enhanced refresh');
        
        // Add delay to allow database processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear the indicator to prevent infinite refreshes
        localStorage.removeItem('quiz_completed');
        urlParams.delete('from_quiz');
        window.history.replaceState({}, '', window.location.pathname);
        
        // Implement retry mechanism for data fetching
        let retryCount = 0;
        const maxRetries = 3;
        
        const retryFetch = async () => {
          try {
            console.log(`[StudentProgress] Fetching updated data (attempt ${retryCount + 1}/${maxRetries})`);
            setLoading(true);
            
            const headers = { Authorization: `Bearer ${token}` };
            
            // Force fresh data with stronger cache busting
            const timestamp = Date.now();
            const studentResponse = await axios.get(`/api/students/${studentId}?_t=${timestamp}&fresh=true`, { headers });
            setStudent(studentResponse.data);
            
            const knowledgeStatesResponse = await axios.get(`/api/students/${studentId}/knowledge-states?_t=${timestamp}&fresh=true`, { headers });
            setKnowledgeStates(knowledgeStatesResponse.data);

            const gradeKCsResponse = await axios.get(`/api/students/${studentId}/grade-knowledge-components?_t=${timestamp}&fresh=true`, { headers });
            setAllKnowledgeComponents(gradeKCsResponse.data);
            
            const performanceResponse = await axios.get(`/api/students/me/detailed-performance?_t=${timestamp}&fresh=true`, { headers });
            if (performanceResponse.data.recentResponses) {
              setResponses(performanceResponse.data.recentResponses);
            }
            
            console.log('[StudentProgress] ✅ Data refresh completed successfully');
            setLoading(false);
            
          } catch (error) {
            console.error(`[StudentProgress] Retry ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              console.log(`[StudentProgress] Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
              setTimeout(retryFetch, 2000);
            } else {
              console.error('[StudentProgress] All retry attempts failed');
              setLoading(false);
            }
          }
        };
        
        retryFetch();
      }
    };
    
    checkQuizCompletion();
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [studentId, token]); // Dependency array includes studentId and token from context
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading your progress...</h2>
        <p>Please wait while we gather your learning data.</p>
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
  
  // Combine all KCs with student's knowledge states
  const combinedKCs = allKnowledgeComponents.map(kc => {
    const studentKCState = knowledgeStates.find(ks => ks.kc_id === kc.id || ks.KnowledgeComponent?.id === kc.id);
    return {
      ...kc, // Spread all properties from the KC itself (name, description, curriculum_code etc.)
      KnowledgeComponent: kc, // Ensure KnowledgeComponent structure for consistency if needed elsewhere
      p_mastery: studentKCState ? studentKCState.p_mastery : 0, // Default to 0 if no state
      started: !!studentKCState // Flag if the student has started this KC
    };
  });

  // Calculate pagination for topics
  const indexOfLastTopic = currentPage * topicsPerPage;
  const indexOfFirstTopic = indexOfLastTopic - topicsPerPage;
  // Filter by curriculum area and started status
  const filteredKCs = combinedKCs.filter(kc => {
    const matchesArea = selectedArea === 'all' || kc.curriculum_code?.includes(selectedArea);
    const matchesStarted = !showOnlyStarted || kc.started;
    return matchesArea && matchesStarted;
  });

  // Sort by mastery, then by whether it's started, then by curriculum code, then by name
  const sortedCombinedKCs = [...filteredKCs].sort((a, b) => {
    // Primary sort: p_mastery descending
    if (b.p_mastery !== a.p_mastery) {
      return (b.p_mastery || 0) - (a.p_mastery || 0);
    }
    // Secondary sort: started KCs before unstarted KCs
    if (a.started !== b.started) {
      return a.started ? -1 : 1;
    }
    // Tertiary sort: by curriculum code
    const curriculumA = a.curriculum_code || '';
    const curriculumB = b.curriculum_code || '';
    if (curriculumA !== curriculumB) {
      return curriculumA.localeCompare(curriculumB);
    }
    // Quaternary sort: alphabetically by name
    return (a.name || '').localeCompare(b.name || '');
  });

  const currentTopics = sortedCombinedKCs.slice(indexOfFirstTopic, indexOfLastTopic);
  const totalPages = Math.ceil(sortedCombinedKCs.length / topicsPerPage);

  // Function to change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get color based on mastery level
  const getMasteryColor = (mastery) => {
    if (mastery >= 0.8) return 'rgba(46, 204, 113, 0.7)'; // Green for high mastery
    if (mastery >= 0.5) return 'rgba(52, 152, 219, 0.7)'; // Blue for medium mastery
    return 'rgba(231, 76, 60, 0.7)'; // Red for low mastery
  };

  // Prepare data for horizontal bar chart
  const chartData = {
    labels: currentTopics.map(kc => {
      const name = kc.name || 'Unknown Topic'; // Use kc.name directly
      return name.length > 25 ? name.substring(0, 22) + '...' : name;
    }),
    datasets: [
      {
        label: 'Mastery Level (%)',
        data: currentTopics.map(kc => kc.p_mastery * 100),
        backgroundColor: currentTopics.map(kc => getMasteryColor(kc.p_mastery)),
        borderColor: currentTopics.map(kc => getMasteryColor(kc.p_mastery).replace('0.7', '1')),
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Mastery Level (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Topics',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#2c3e50'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            return currentTopics[index].name || 'Unknown Topic'; // Use .name
          },
          label: function(context) {
            return `Mastery: ${context.raw.toFixed(1)}%`;
          },
          afterLabel: function(context) {
            const index = context.dataIndex;
            // Ensure description is taken from the KC object itself
            const description = currentTopics[index].description || (currentTopics[index].KnowledgeComponent ? currentTopics[index].KnowledgeComponent.description : '');
            return description;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        cornerRadius: 6
      }
    }
  };
  
  // Group combined KCs by curriculum area
  const groupedCombinedKCs = combinedKCs.reduce((acc, kc) => {
    // curriculum_code should be directly on kc object now
    const code = kc.curriculum_code; 
    const match = code?.match(/G\d+-([A-Z]+)-\d+/);
    const area = match ? match[1] : 'Other';

    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(kc);
    return acc;
  }, {});
  
  // Calculate average mastery by area using combinedKCs
  const areaAverages = Object.entries(groupedCombinedKCs).map(([area, kcsInArea]) => {
    const totalMastery = kcsInArea.reduce((sum, kc) => sum + (kc.p_mastery || 0), 0);
    // Average mastery should be based on all KCs in that area, not just started ones
    const averageMastery = kcsInArea.length > 0 ? totalMastery / kcsInArea.length : 0;
    
    return {
      area,
      averageMastery,
      count: kcsInArea.length // Corrected from states.length to kcsInArea.length
    };
  });
  
  // Add Filipino translations for mastery levels
  const getMasteryLabel = (mastery) => {
    if (mastery >= 0.8) return 'Napakagaling! (Excellent!)';
    if (mastery >= 0.5) return 'Magaling! (Good Progress)';
    return 'Kailangan pa ng practice (Needs Practice)';
  };

  // Add Filipino translations for curriculum areas
  const areaNames = {
    'NS': 'Number Sense (Bilang)',
    'GEO': 'Geometry (Heometriya)',
    'MEAS': 'Measurement (Sukat)',
    'ALG': 'Algebra (Alhebra)',
    'STAT': 'Statistics (Estadistika)'
  };
  
  return (
    <div className="student-progress">
      <div className="progress-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>📊 Ang Iyong Learning Progress</h1>
            <p>I-track ang iyong mastery sa iba't ibang math topics!</p>
          </div>
          <button 
            onClick={() => {
              console.log("[StudentProgress] Manual refresh requested");
              setLoading(true);
              setTimeout(() => window.location.reload(), 100);
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
      </div>
      
      <div className="progress-summary">
        <div className="summary-card">
          <h3>🌟 Overall Mastery</h3>
          <div className="mastery-percentage">
            {(combinedKCs.reduce((sum, kc) => sum + (kc.p_mastery || 0), 0) /
              (combinedKCs.length || 1) * 100).toFixed(0)}%
          </div>
          <div className="mastery-bar">
            <div
              className="mastery-fill"
              style={{
                width: `${(combinedKCs.reduce((sum, kc) => sum + (kc.p_mastery || 0), 0) /
                  (combinedKCs.length || 1) * 100)}%`
              }}
            ></div>
          </div>
        </div>
        
        <div className="summary-card">
          <h3>📚 Topics Progress</h3>
          <div className="topics-count">
            {combinedKCs.filter(kc => kc.started).length} / {combinedKCs.length}
          </div>
          <p>topics na nasimulan na</p>
        </div>
        
        <div className="summary-card">
          <h3>🎯 Recent Activity</h3>
          <div className="activity-count">{responses.length} responses</div>
          <p>sa huling session</p>
        </div>
        
        <div className="summary-card">
          <h3>🏆 Mastery Level</h3>
          <div className="mastery-level">
            {combinedKCs.filter(kc => kc.p_mastery >= 0.8).length}
          </div>
          <p>mastered topics</p>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Filter by Area:</label>
          <select 
            value={selectedArea} 
            onChange={(e) => {
              setSelectedArea(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="filter-select"
          >
            <option value="all">All Areas</option>
            <option value="NS">🔢 Number Sense</option>
            <option value="GEO">📐 Geometry</option>
            <option value="MEAS">📏 Measurement</option>
            <option value="ALG">🧮 Algebra</option>
            <option value="STAT">📊 Statistics</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showOnlyStarted}
              onChange={(e) => {
                setShowOnlyStarted(e.target.checked);
                setCurrentPage(1); // Reset to first page when filtering
              }}
            />
            Show only started topics
          </label>
        </div>
        
        <div className="results-info">
          Showing {sortedCombinedKCs.length} of {combinedKCs.length} topics
        </div>
      </div>
      
      <div className="mastery-chart">
        <h2>Mastery by Topic {selectedArea !== 'all' && `- ${areaNames[selectedArea] || selectedArea}`}</h2>
        
        {/* Topic Cards Grid */}
        <div className="topic-cards-grid">
          {currentTopics.map((kc, index) => {
            const masteryPercentage = Math.round((kc.p_mastery || 0) * 100);
            const getTopicEmoji = (name) => {
              const lower = name.toLowerCase();
              if (lower.includes('number')) return '🔢';
              if (lower.includes('add')) return '➕';
              if (lower.includes('subtract')) return '➖';
              if (lower.includes('multiply')) return '✖️';
              if (lower.includes('divid')) return '➗';
              if (lower.includes('money')) return '💰';
              if (lower.includes('place value')) return '🔣';
              if (lower.includes('compar')) return '⚖️';
              if (lower.includes('order')) return '📊';
              if (lower.includes('round')) return '🔄';
              if (lower.includes('fraction')) return '½';
              if (lower.includes('ordinal')) return '🏅';
              return '📝';
            };
            
            return (
              <div key={kc.id} className={`topic-card ${!kc.started ? 'not-started' : ''}`}>
                <div className="topic-header">
                  <span className="topic-emoji">{getTopicEmoji(kc.name)}</span>
                  <div className="topic-title">
                    <h4>{kc.name?.replace(/^KC\d+:\s*/, '') || 'Unknown Topic'}</h4>
                    <span className="curriculum-code">{kc.curriculum_code}</span>
                  </div>
                </div>
                
                <div className="topic-progress">
                  <div className="progress-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="circle"
                        strokeDasharray={`${masteryPercentage}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{
                          stroke: masteryPercentage >= 80 ? '#27ae60' : 
                                  masteryPercentage >= 50 ? '#3498db' : '#e74c3c'
                        }}
                      />
                      <text x="18" y="20.35" className="percentage">{masteryPercentage}%</text>
                    </svg>
                  </div>
                  
                  <div className="mastery-status">
                    {masteryPercentage >= 80 ? '🏆 Mastered!' :
                     masteryPercentage >= 50 ? '📈 Good Progress' :
                     kc.started ? '💪 Keep Practicing' : '🆕 Not Started'}
                  </div>
                </div>
                
                <div className="topic-actions">
                  {kc.started ? (
                    <Link 
                      to={`/student/quiz?kc_id=${kc.id}&mode=practice`}
                      className="practice-button"
                    >
                      {masteryPercentage >= 80 ? '🔄 Review' : '📚 Practice'}
                    </Link>
                  ) : (
                    <Link 
                      to={`/student/quiz?kc_id=${kc.id}&mode=practice`}
                      className="start-button"
                    >
                      🚀 Start Learning
                    </Link>
                  )}
                </div>
                
                {kc.description && (
                  <div className="topic-description">
                    {kc.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Keep the bar chart as an alternative view */}
        <div className="chart-toggle">
          <button 
            onClick={() => {
              const chartContainer = document.querySelector('.chart-container');
              const isHidden = chartContainer.style.display === 'none';
              chartContainer.style.display = isHidden ? 'block' : 'none';
            }}
            className="toggle-chart-btn"
          >
            📊 Toggle Bar Chart View
          </button>
        </div>
        
        <div className="chart-container" style={{ display: 'none', marginTop: '20px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {/* Pagination controls */}
        {combinedKCs.length > topicsPerPage && (
          <div className="pagination-controls">
            <button
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              &laquo; Previous
            </button>
            
            <div className="page-indicator">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next &raquo;
            </button>
          </div>
        )}
      </div>
      
      <div className="curriculum-areas">
        <h2>Progress by Curriculum Area</h2>
        <div className="area-cards">
          {areaAverages.map(area => {
            const doughnutData = {
              labels: ['Mastered', 'Remaining'],
              datasets: [
                {
                  data: [area.averageMastery * 100, 100 - (area.averageMastery * 100)],
                  backgroundColor: [
                    area.averageMastery >= 0.8 ? 'rgba(46, 204, 113, 0.8)' :
                    area.averageMastery >= 0.5 ? 'rgba(52, 152, 219, 0.8)' :
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(234, 236, 238, 0.5)'
                  ],
                  borderWidth: 0,
                  cutout: '70%'
                }
              ]
            };
            
            const doughnutOptions = {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: false
                }
              }
            };
            
            const getAreaEmoji = (areaCode) => {
              switch(areaCode) {
                case 'NS': return '🔢';
                case 'GEO': return '📐';
                case 'MEAS': return '📏';
                case 'ALG': return '🧮';
                case 'STAT': return '📊';
                default: return '📚';
              }
            };
            
            return (
              <div key={area.area} className="area-card">
                <div className="area-header">
                  <span className="area-emoji">{getAreaEmoji(area.area)}</span>
                  <h3>{areaNames[area.area] || area.area}</h3>
                </div>
                
                <div className="area-chart-container">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="doughnut-center">
                    <span className="doughnut-percentage">{(area.averageMastery * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="area-details">
                  <p><strong>{area.count}</strong> topics</p>
                  <p className="mastery-label" style={{
                    color: area.averageMastery >= 0.8 ? '#27ae60' :
                           area.averageMastery >= 0.5 ? '#2980b9' :
                           '#c0392b'
                  }}>
                    {getMasteryLabel(area.averageMastery)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {responses.length > 0 ? (
          <div className="activity-list">
            {responses.slice(0, 5).map(response => (
              <div key={response.id} className="activity-item">
                <div className="activity-content">
                  <h4>{response.content}</h4>
                  <p>Your answer: {response.answer}</p>
                </div>
                <div className={`activity-result ${response.correct ? 'correct' : 'incorrect'}`}>
                  {response.correct ? 'Tama! (Correct)' : 'Mali (Incorrect)'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-activity">No recent activity to display.</p>
        )}
      </div>
      
      <div className="progress-actions">
        <Link to="/student" className="button">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default StudentProgress;
