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
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [allKnowledgeComponents, setAllKnowledgeComponents] = useState([]); // To store all KCs
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(8); // Number of topics to show per page
  const { user, token } = useAuth(); // Get user AND token from context

  // Use the authenticated user's ID
  const studentId = user?.id;
  
  // Add refresh logic for URL parameters (similar to other components)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh')) {
      console.log('[StudentProgress] Refresh triggered by URL parameter');
      // Clear the refresh param from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  // Add window focus listener and periodic refresh like MasteryLevelDashboard
  useEffect(() => {
    const handleFocus = () => {
      console.log("[StudentProgress] Window focused, refreshing data...");
      if (token && studentId) {
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
    
    // Add periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log("[StudentProgress] Periodic refresh triggered");
      handleFocus();
    }, 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
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
  // Sort by mastery, then by whether it's started (to show started ones first within same mastery), then by name
  const sortedCombinedKCs = [...combinedKCs].sort((a, b) => {
    // Primary sort: p_mastery descending
    if (b.p_mastery !== a.p_mastery) {
      return (b.p_mastery || 0) - (a.p_mastery || 0);
    }
    // Secondary sort: started KCs before unstarted KCs
    if (a.started !== b.started) {
      return a.started ? -1 : 1; // if a.started is true, it comes before b (false)
    }
    // Tertiary sort: alphabetically by name
    return (a.name || '').localeCompare(b.name || '');
  });

  const currentTopics = sortedCombinedKCs.slice(indexOfFirstTopic, indexOfLastTopic);
  const totalPages = Math.ceil(combinedKCs.length / topicsPerPage);

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
      </div>
      
      <div className="mastery-chart">
        <h2>Mastery by Topic</h2>
        <div className="chart-container">
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
