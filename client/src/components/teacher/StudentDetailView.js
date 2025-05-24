import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import './TeacherDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Register our custom plugin
ChartJS.register({
  id: 'componentNames',
  afterRender: (chart) => {
    // This is just a placeholder for a custom plugin
    console.log("Chart rendered with component names plugin");
  }
});

const StudentDetailView = () => {
  console.log('🔴 [StudentDetailView] TEACHER STUDENT DETAIL VIEW LOADING - This should only be accessed by teachers');
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [detailedPerformance, setDetailedPerformance] = useState(null);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [messageError, setMessageError] = useState(null);
  
  // Add refresh logic for URL parameters  
  useEffect(() => {
    console.log('[StudentDetailView] Component mounted - URL:', window.location.pathname);
    console.log('[StudentDetailView] Viewing student ID:', id);
    console.log('[StudentDetailView] This is the TEACHER view component');
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh')) {
      console.log('[StudentDetailView] Refresh triggered by URL parameter');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch detailed student performance (with cache busting for Supabase)
        const performanceResponse = await axios.get(`/api/students/${id}/detailed-performance?_t=${Date.now()}`);
        // Process the performance data to match component expectations
        const performance = performanceResponse.data.performance;
        
        // Create performanceByKC from knowledgeStates
        const performanceByKC = {};
        if (performance.knowledgeStates) {
          performance.knowledgeStates.forEach(state => {
            const kc = state.knowledge_components || state.KnowledgeComponent || {};
            console.log('Processing knowledge state:', state);
            console.log('Knowledge component data:', kc);
            performanceByKC[state.knowledge_component_id] = {
              name: kc.name || state.name || 'Unknown',
              curriculum_code: kc.curriculum_code || state.curriculum_code || `KC-${state.knowledge_component_id}`,
              mastery: state.p_mastery || 0,
              correctRate: 0, // Will be calculated from responses
              totalResponses: 0, // Will be calculated from responses
              correctResponses: 0,
              averageTime: 0
            };
          });
        }
        
        // Calculate response stats per KC
        if (performance.recentActivity) {
          performance.recentActivity.forEach(response => {
            // Handle both nested and flat content_items structure
            const kcId = response.content_items?.knowledge_component_id || 
                         response.ContentItem?.knowledge_component_id ||
                         response.knowledge_component_id;
            if (kcId && performanceByKC[kcId]) {
              performanceByKC[kcId].totalResponses++;
              if (response.correct) {
                performanceByKC[kcId].correctResponses++;
              }
              performanceByKC[kcId].averageTime += response.time_spent || 0;
            }
          });
          
          // Calculate averages
          Object.keys(performanceByKC).forEach(kcId => {
            const kc = performanceByKC[kcId];
            if (kc.totalResponses > 0) {
              kc.correctRate = kc.correctResponses / kc.totalResponses;
              kc.averageTime = kc.averageTime / kc.totalResponses;
            }
          });
        }
        
        // Add missing properties
        const detailedPerformance = {
          ...performance,
          performanceByKC,
          knowledgeStates: performance.knowledgeStates || [],
          recentResponses: performance.recentActivity || [],
          engagementMetrics: [],
          overallMetrics: {
            averageMastery: performance.knowledgeStates && performance.knowledgeStates.length > 0
              ? performance.knowledgeStates.reduce((sum, state) => sum + (state.p_mastery || 0), 0) / performance.knowledgeStates.length
              : 0,
            correctRate: performance.totalQuizzesTaken > 0 
              ? performance.correctAnswers / performance.totalQuizzesTaken 
              : 0,
            totalResponses: performance.totalQuizzesTaken || 0,
            correctResponses: performance.correctAnswers || 0,
            engagement: 0.5 // Default engagement
          }
        };
        
        setDetailedPerformance(detailedPerformance);
        setStudent(performanceResponse.data.student);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading student data...</h2>
        <p>Please wait while we gather the information.</p>
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

  // Add an explicit check for the data object before trying to render
  if (!detailedPerformance || !student) {
    // This can happen if the API call finished but the state update hasn't rendered yet,
    // or if the API returned unexpected null/empty data.
    console.warn("StudentDetailView: detailedPerformance or student data is null/undefined after loading.");
    return <div>Waiting for student data...</div>; // Or return null, or a more specific error
  }

  // Log the structure of the received data right before using it
  console.log("StudentDetailView - Rendering with data:", JSON.stringify(detailedPerformance, null, 2));

  // Log the structure of the received data right before using it
  console.log("StudentDetailView - Rendering with data:", JSON.stringify(detailedPerformance, null, 2));
  // Removed extra closing brace '}' from previous incorrect diff
  
  // Prepare data for mastery chart with color coding based on 80% threshold
  const masteryThreshold = 80; // 80% mastery threshold
  
  // Sort knowledge states by mastery level (lowest to highest)
  const sortedKnowledgeStates = [...detailedPerformance.knowledgeStates]
    .sort((a, b) => a.p_mastery - b.p_mastery);
  
  // Log the knowledge states to debug
  console.log("Knowledge states for chart:", sortedKnowledgeStates);

  // Create standardized curriculum codes for all knowledge states in G3-KC11 format
  sortedKnowledgeStates.forEach(state => {
    const grade = state.grade_level || 
                 (state.KnowledgeComponent && state.KnowledgeComponent.grade_level) || 
                 '3'; // Default to grade 3 if not specified
    
    // If curriculum_code exists, use it if it's properly formatted
    if (state.curriculum_code && /^G\d+-[A-Z]+-\d+$/.test(state.curriculum_code)) {
      state.formatted_code = state.curriculum_code;
    }
    // If code exists but isn't in proper format, try to adapt it
    else if (state.curriculum_code) {
      // Try to extract any part that looks like a KC identifier
      const kcMatch = state.curriculum_code.match(/[A-Z]+-\d+/);
      if (kcMatch) {
        state.formatted_code = `G${grade}-${kcMatch[0]}`;
      } else {
        // Use curriculum_code as is but prefix with grade
        state.formatted_code = `G${grade}-${state.curriculum_code}`;
      }
    }
    // Otherwise create a new formatted code
    else {
      const id = state.knowledge_component_id || state.id;
      state.formatted_code = `G${grade}-KC${id}`;
    }
    console.log(`Knowledge component: ${state.name}, Code: ${state.formatted_code}`);
  });

  const masteryChartData = {
    // Use the knowledge component curriculum codes as labels for x-axis
    labels: sortedKnowledgeStates.map(state => state.formatted_code || 'Unknown'),
    datasets: [
      {
        label: 'Mastery Level (%)',
        data: sortedKnowledgeStates.map(state => state.p_mastery * 100),
        backgroundColor: sortedKnowledgeStates.map(state =>
          state.p_mastery * 100 >= masteryThreshold ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
        ),
        borderColor: sortedKnowledgeStates.map(state =>
          state.p_mastery * 100 >= masteryThreshold ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Add a custom plugin to display component names below the chart
  const componentNamePlugin = {
    id: 'componentNames',
    afterRender: (chart) => {
      // This is just a placeholder for a custom plugin
      // In a real implementation, we would add a legend or tooltip system
      // to show component names without cluttering the chart
      console.log("Chart rendered with component names plugin");
    }
  };

  const masteryChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Mastery Level (%)'
        },
        grid: {
          color: (context) => context.tick.value === masteryThreshold ? 'rgba(231, 76, 60, 0.5)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            if (value === masteryThreshold) {
              return value + '% (Threshold)';
            }
            return value + '%';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Knowledge Components'
        },
        ticks: {
          maxRotation: 90,
          minRotation: 45,
          // Keep the curriculum codes as they are in x-axis
          callback: function(value) {
            // Simply return the curriculum code value
            return value;
          }
        }
      }
    },
    plugins: {
      componentNames: true, // Enable our custom plugin
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Knowledge Component Mastery by Curriculum Code',
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            // Get the knowledge state from the sorted array
            const state = sortedKnowledgeStates[context[0].dataIndex];
            // Always show curriculum code and full name in tooltip
            if (state) {
              // Get the name from the state or its KnowledgeComponent property
              const name = state.name || 
                          (state.KnowledgeComponent ? state.KnowledgeComponent.name : null) || 
                          'Knowledge Component';
              // Show both name and code in the tooltip for reference
              return `${name} (${state.formatted_code})`;
            }
            return 'Knowledge Component';
          },
          label: function(context) {
            const value = context.raw;
            const isMastered = value >= masteryThreshold;
            return `Mastery: ${value.toFixed(1)}% ${isMastered ? '✓' : '✗'}`;
          },
          afterLabel: function(context) {
            const value = context.raw;
            const isMastered = value >= masteryThreshold;
            return isMastered ? 'Mastered' : 'Not Mastered';
          }
        }
      }
    },
  };
  
  // Prepare data for engagement chart if available
  let engagementChartData = null;
  let engagementChartOptions = null;
  
  if (detailedPerformance.engagementMetrics && detailedPerformance.engagementMetrics.length > 0) {
    // Sort by timestamp
    const sortedMetrics = [...detailedPerformance.engagementMetrics].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Get last 10 entries
    const recentMetrics = sortedMetrics.slice(-10);
    
    engagementChartData = {
      labels: recentMetrics.map(metric => {
        const date = new Date(metric.timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: 'Time on Task (min)',
          data: recentMetrics.map(metric => metric.timeOnTask / 60),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Help Requests',
          data: recentMetrics.map(metric => metric.helpRequests),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        }
      ],
    };
    
    engagementChartOptions = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Time on Task (min)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Help Requests'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Session Time'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Recent Engagement Metrics',
        },
      },
    };
  }
  
  // Group knowledge components by curriculum area
  const groupedKnowledgeStates = detailedPerformance.knowledgeStates.reduce((acc, state) => {
    // Extract curriculum area from curriculum code
    let area = 'Other';
    
    if (state.curriculum_code) {
      // Try different patterns to extract the curriculum area
      // Pattern 1: "G3-NS-1" -> "NS"
      const pattern1 = state.curriculum_code.match(/G\d+-?([A-Z]+)-\d+/);
      // Pattern 2: "NS-101" -> "NS"
      const pattern2 = state.curriculum_code.match(/^([A-Z]+)-\d+/);
      // Pattern 3: Just use the first part before any dash
      const pattern3 = state.curriculum_code.split('-')[0];
      
      if (pattern1) {
        area = pattern1[1];
      } else if (pattern2) {
        area = pattern2[1];
      } else if (pattern3 && /^[A-Z]+$/.test(pattern3)) {
        area = pattern3;
      }
      
      // Log the extracted area for debugging
      console.log(`Extracted area "${area}" from curriculum code "${state.curriculum_code}"`);
    }
    
    if (!acc[area]) {
      acc[area] = [];
    }
    
    acc[area].push(state);
    return acc;
  }, {});
  
  // Map curriculum area codes to full names
  const areaNames = {
    'NS': 'Number Sense',
    'GEO': 'Geometry',
    'MEAS': 'Measurement',
    'ALG': 'Algebra',
    'STAT': 'Statistics'
  };
  
  // Helper function to safely get metric values
  const getMetric = (path, defaultValue = 0) => {
    const keys = path.split('.');
    let value = detailedPerformance;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    return value ?? defaultValue;
  };

  // Calculate summary metrics
  const overallMetrics = detailedPerformance.overallMetrics || {};
  const correctResponses = getMetric('overallMetrics.correctResponses', 0);
  const totalResponses = getMetric('overallMetrics.totalResponses', 0);
  const activityCount = getMetric('overallMetrics.activityCount', 0);
  
  // Calculate overall math mastery even if not directly provided
  const calculatedMastery = detailedPerformance.knowledgeStates.length > 0 
    ? detailedPerformance.knowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0) / detailedPerformance.knowledgeStates.length
    : 0;
  
  // Calculate correct rate from responses if not provided
  const calculatedCorrectRate = detailedPerformance.recentResponses.length > 0
    ? detailedPerformance.recentResponses.filter(r => r.correct).length / detailedPerformance.recentResponses.length
    : null;
  
  // Get overall mastery, preferring the API value but using calculated if needed
  const overallMastery = getMetric('overallMetrics.averageMastery', calculatedMastery);
  
  // Get correct rate, preferring the API value but using calculated if needed
  const correctRate = getMetric('overallMetrics.correctRate', calculatedCorrectRate);
  
  // Determine if there are any responses at all for showing activity data
  const hasResponses = totalResponses > 0 || detailedPerformance.recentResponses.length > 0;
  
  // Calculate engagement based on recent activity
  const hasRecentActivity = 
    detailedPerformance.recentResponses.length > 0 || 
    (detailedPerformance.engagementMetrics && detailedPerformance.engagementMetrics.length > 0);
  
  // Get latest activity timestamp
  const latestActivity = detailedPerformance.recentResponses.length > 0 
    ? new Date(detailedPerformance.recentResponses[0].createdAt)
    : null;

  // Handle contact button click
  const handleContactClick = () => {
    setShowContactModal(true);
    setMessageError(null);
    setMessageSuccess(false);
  };

  // Handle closing the contact modal
  const handleCloseModal = () => {
    setShowContactModal(false);
    setContactMessage('');
    setMessageSuccess(false);
    setMessageError(null);
  };

  // Handle sending a message to the student
  const handleSendMessage = async () => {
    if (!contactMessage.trim()) return;
    
    setSendingMessage(true);
    setMessageError(null);
    
    try {
      // Call the API to send the message
      const response = await axios.post(`/api/students/${id}/contact`, {
        message: contactMessage,
        studentName: student?.name || 'Student'
      });
      
      console.log('Message sent successfully:', response.data);
      setMessageSuccess(true);
      setContactMessage('');
      // Close the modal after 2 seconds
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err.response?.data?.error || 
                          'Failed to send message. Please try again later.';
      setMessageError(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="student-detail-view">
      <div className="student-header">
        <div className="header-content">
          <h1>{student?.name || 'Student'}</h1>
          <p>Grade {student?.grade_level} • Student ID: {student?.id}</p>
          
          <div className="student-stats">
            <div className="stat">
              <span className="stat-value" style={{
                color: overallMastery >= 0.8 ? '#2ecc71' : overallMastery >= 0.6 ? '#f39c12' : '#e74c3c'
              }}>
                {(overallMastery * 100).toFixed(1)}%
              </span>
              <span className="stat-label">Overall Math Mastery</span>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>
                {detailedPerformance.knowledgeStates.length} knowledge components
              </span>
            </div>
            <div className="stat">
              <span className="stat-value" style={{
                color: correctRate >= 0.65 ? '#2ecc71' : 
                      correctRate >= 0.5 ? '#f39c12' : '#e74c3c'
              }}>
                {hasResponses ? `${(correctRate * 100).toFixed(1)}%` : 'Pending'}
              </span>
              <span className="stat-label">Correct Rate</span>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>
                {hasResponses ? 
                  `${correctResponses || detailedPerformance.recentResponses.filter(r => r.correct).length} correct of ${totalResponses || detailedPerformance.recentResponses.length} responses` : 
                  'Student has not submitted any responses yet'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-value" style={{
                color: getMetric('overallMetrics.engagement', 0) >= 0.7 ? '#2ecc71' : 
                      getMetric('overallMetrics.engagement', 0) >= 0.5 ? '#f39c12' : '#e74c3c'
              }}>
                {hasRecentActivity ? 
                  `${(getMetric('overallMetrics.engagement', 0.5) * 100).toFixed(1)}%` : 
                  'Pending'}
              </span>
              <span className="stat-label">Engagement</span>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>
                {hasRecentActivity ? 
                  `Last active: ${latestActivity ? latestActivity.toLocaleDateString() : 'Recently'}` : 
                  'Student needs to complete activities'}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/teacher" className="button secondary">Back to Dashboard</Link>
          <button className="button" onClick={handleContactClick}>Contact Student</button>
        </div>
      </div>
      
      <div className="student-content">
        <div className="performance-details-section">
          <h2>Performance Details by Knowledge Component</h2>
          
          {Object.keys(detailedPerformance.performanceByKC).length > 0 ? (
            <>
              <div className="performance-summary" style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginTop: '0', marginBottom: '10px', fontSize: '1.1rem' }}>Performance Summary</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#4a6fa5' }}>Areas of Strength</h4>
                    {Object.values(detailedPerformance.performanceByKC).filter(kc => kc.mastery >= 0.8).length > 0 ? (
                      <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        {Object.values(detailedPerformance.performanceByKC)
                          .filter(kc => kc.mastery >= 0.8)
                          .sort((a, b) => b.mastery - a.mastery)
                          .slice(0, 3)
                          .map(kc => (
                            <li key={kc.curriculum_code} style={{ marginBottom: '5px' }}>
                              <strong>{kc.name}</strong> ({(kc.mastery * 100).toFixed(0)}% mastery)
                            </li>
                          ))
                        }
                      </ul>
                    ) : (
                      <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                        No areas of strength identified yet (mastery ≥ 80%).
                      </p>
                    )}
                  </div>
                  
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#e74c3c' }}>Areas Needing Attention</h4>
                    {Object.values(detailedPerformance.performanceByKC).filter(kc => kc.mastery < 0.6).length > 0 ? (
                      <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        {Object.values(detailedPerformance.performanceByKC)
                          .filter(kc => kc.mastery < 0.6)
                          .sort((a, b) => a.mastery - b.mastery)
                          .slice(0, 3)
                          .map(kc => (
                            <li key={kc.curriculum_code} style={{ marginBottom: '5px' }}>
                              <strong>{kc.name}</strong> ({(kc.mastery * 100).toFixed(0)}% mastery)
                            </li>
                          ))
                        }
                      </ul>
                    ) : (
                      <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                        No areas requiring immediate intervention.
                      </p>
                    )}
                  </div>
                  
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#f39c12' }}>Recommended Actions</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                      {Object.values(detailedPerformance.performanceByKC).filter(kc => kc.mastery < 0.6).length > 0 ? (
                        <li style={{ marginBottom: '5px' }}>Provide additional practice for low-mastery topics</li>
                      ) : null}
                      {Object.values(detailedPerformance.performanceByKC).filter(kc => kc.mastery >= 0.6 && kc.mastery < 0.8).length > 0 ? (
                        <li style={{ marginBottom: '5px' }}>Reinforce topics with moderate mastery</li>
                      ) : null}
                      {correctRate < 0.65 ? (
                        <li style={{ marginBottom: '5px' }}>Review question formats - student may be struggling with how questions are presented</li>
                      ) : null}
                      {!hasRecentActivity ? (
                        <li style={{ marginBottom: '5px' }}>Engage student - no recent activity detected</li>
                      ) : null}
                      {Object.values(detailedPerformance.performanceByKC).every(kc => kc.mastery >= 0.8) ? (
                        <li style={{ marginBottom: '5px' }}>Consider introducing more advanced topics</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            
              <div className="performance-table">
                <div className="table-header">
                  <div className="col-code">Code</div>
                  <div className="col-name">Name</div>
                  <div className="col-mastery">Mastery</div>
                  <div className="col-correct">Correct Rate</div>
                  <div className="col-time">Avg. Time</div>
                  <div className="col-actions">Actions</div>
                </div>
                
                <div className="table-body">
                  {Object.entries(detailedPerformance.performanceByKC)
                    .sort((a, b) => a[1].mastery - b[1].mastery) // Sort by mastery level (lowest to highest)
                    .map(([kcId, kc]) => (
                    <div key={kcId} className="table-row">
                      <div className="col-code"><strong>{kc.curriculum_code || 'N/A'}</strong></div>
                      <div className="col-name">{kc.name}</div>
                      <div className="col-mastery">
                        <div className="mastery-percentage">
                          {(kc.mastery * 100).toFixed(0)}%
                        </div>
                        <div className="mastery-bar">
                          <div 
                            className="mastery-fill" 
                            style={{ 
                              width: `${kc.mastery * 100}%`,
                              backgroundColor: kc.mastery >= 0.8 ? '#2ecc71' : 
                                              kc.mastery >= 0.6 ? '#f39c12' : '#e74c3c'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="col-correct">
                        <span style={{
                          color: kc.correctRate >= 0.65 ? '#2ecc71' : 
                                kc.correctRate >= 0.5 ? '#f39c12' : '#e74c3c'
                        }}>
                          {kc.totalResponses > 0 ? (kc.correctRate * 100).toFixed(1) + '%' : 'No data'}
                        </span>
                        <span className="response-count">
                          {kc.totalResponses > 0 ? `(${kc.correctResponses || 0}/${kc.totalResponses || 0})` : ''}
                        </span>
                      </div>
                      <div className="col-time">
                        {kc.totalResponses > 0 ? (kc.averageTime / 1000 || 0).toFixed(1) + 's' : 'No data'}
                      </div>
                      <div className="col-actions">
                        <Link to={`/teacher/knowledge-components/${kcId}`} className="button small">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="no-data-message" style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>No performance data available yet.</p>
              <p style={{ color: '#6c757d' }}>
                This student has not completed any assessments or activities that would generate mastery data.
                Encourage the student to complete assigned activities to begin collecting performance data.
              </p>
            </div>
          )}
        </div>

        <div className="mastery-section">
          <h2>Knowledge Component Mastery</h2>
          
          {detailedPerformance.knowledgeStates.length > 0 ? (
            <>
              <div className="mastery-summary">
                <div className="mastery-metrics">
                  <div className="metric">
                    <span className="metric-value">{detailedPerformance.knowledgeStates.filter(state => state.p_mastery >= 0.8).length}</span>
                    <span className="metric-label">Components Mastered</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{detailedPerformance.knowledgeStates.filter(state => state.p_mastery < 0.8).length}</span>
                    <span className="metric-label">Components Below Threshold</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{detailedPerformance.knowledgeStates.length}</span>
                    <span className="metric-label">Total Components</span>
                  </div>
                </div>
                <div className="mastery-threshold-info">
                  <div className="threshold-indicator">
                    <span className="threshold-label">Mastery Threshold:</span>
                    <span className="threshold-value">80%</span>
                  </div>
                  <p className="threshold-description">
                    Components below this threshold may require additional practice or intervention.
                  </p>
                </div>
              </div>
              <div className="chart-container">
                <Bar data={masteryChartData} options={masteryChartOptions} />
              </div>
            </>
          ) : (
            <div className="no-mastery-data" style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '5px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                No mastery data available yet
              </p>
              <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                This student hasn't completed enough activities to generate mastery data for math knowledge components.
              </p>
              <div style={{ 
                backgroundColor: '#e9f7fe',
                padding: '15px',
                borderRadius: '5px',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#4a6fa5' }}>Getting Started</h4>
                <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
                  To begin tracking mastery:
                </p>
                <ol style={{ textAlign: 'left', margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Assign initial assessment activities</li>
                  <li style={{ marginBottom: '8px' }}>Ensure the student completes at least 5-10 problems</li>
                  <li style={{ marginBottom: '0' }}>Return to this dashboard to view progress</li>
                </ol>
              </div>
            </div>
          )}
          
          {/* Performance details summary below chart - only show if there's data */}
          {Object.keys(detailedPerformance.performanceByKC).length > 0 && (
            <div className="condensed-performance-details" style={{
              marginTop: '20px',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px'
            }}>
              <h4 style={{ marginTop: '0', marginBottom: '15px' }}>Knowledge Component Performance Summary</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '10px'
              }}>
                {Object.entries(detailedPerformance.performanceByKC)
                  .sort((a, b) => a[1].mastery - b[1].mastery) // Sort by mastery level (lowest to highest)
                  .map(([kcId, kc]) => (
                    <div key={kcId} style={{
                      padding: '8px',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      backgroundColor: kc.mastery * 100 >= masteryThreshold ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: '#4a6fa5' }}>{kc.curriculum_code || `KC-${kcId}`}</span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: kc.mastery * 100 >= masteryThreshold ? '#2ecc71' : '#e74c3c' 
                        }}>
                          {(kc.mastery * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9em', marginBottom: '5px' }}>{kc.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#6c757d' }}>
                        <span>Correct: {kc.totalResponses > 0 ? ((kc.correctRate || 0) * 100).toFixed(1) + '%' : 'No data'} {kc.totalResponses > 0 ? `(${kc.correctResponses || 0}/${kc.totalResponses || 0})` : ''}</span>
                        <span>Avg Time: {kc.totalResponses > 0 ? (kc.averageTime / 1000).toFixed(1) + 's' : 'No data'}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          <div className="mastery-criteria-section">
            <h3>Enhanced Mastery Criteria</h3>
            <p className="criteria-description">
              Our system now uses multiple criteria to determine true mastery, based on research in cognitive science and educational psychology.
            </p>
            <div className="criteria-grid">
              <div className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-icon">📊</span>
                  <h4>Quiz Performance</h4>
                </div>
                <p>At least 60% correct answers on quizzes</p>
              </div>
              <div className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-icon">🔄</span>
                  <h4>Consecutive Correct</h4>
                </div>
                <p>At least 3 consecutive correct answers</p>
              </div>
              <div className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-icon">📆</span>
                  <h4>Multiple Sessions</h4>
                </div>
                <p>Good performance across at least 2 different sessions</p>
              </div>
              <div className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-icon">⏱️</span>
                  <h4>Time on Task</h4>
                </div>
                <p>Appropriate time spent on questions relative to difficulty</p>
              </div>
            </div>
          </div>
          
          <div className="curriculum-areas">
            <h3>Mastery by Curriculum Area (Using Curriculum Codes)</h3>
            
            {/* Create chart data for curriculum areas */}
            {(() => {
              // Prepare data for curriculum area chart
              const curriculumAreas = Object.keys(groupedKnowledgeStates);
              
              if (curriculumAreas.length > 0) {
                // Calculate average mastery for each area
                const areaMasteryData = curriculumAreas.map(area => {
                  const states = groupedKnowledgeStates[area];
                  const totalMastery = states.reduce((sum, state) => sum + state.p_mastery, 0);
                  return totalMastery / states.length;
                });
                
                // Create chart data
                const areaChartData = {
                  labels: curriculumAreas.map(area => areaNames[area] || area),
                  datasets: [
                    {
                      label: 'Average Mastery (%)',
                      data: areaMasteryData.map(mastery => mastery * 100),
                      backgroundColor: areaMasteryData.map(mastery => 
                        mastery * 100 >= masteryThreshold 
                          ? 'rgba(46, 204, 113, 0.7)' 
                          : 'rgba(231, 76, 60, 0.7)'
                      ),
                      borderColor: areaMasteryData.map(mastery => 
                        mastery * 100 >= masteryThreshold 
                          ? 'rgba(46, 204, 113, 1)' 
                          : 'rgba(231, 76, 60, 1)'
                      ),
                      borderWidth: 1,
                    }
                  ]
                };
                
                // Chart options
                const areaChartOptions = {
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Average Mastery (%)'
                      },
                      grid: {
                        color: context => context.tick.value === masteryThreshold 
                          ? 'rgba(231, 76, 60, 0.5)' 
                          : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        callback: value => {
                          if (value === masteryThreshold) {
                            return value + '% (Threshold)';
                          }
                          return value + '%';
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: context => {
                          const value = context.raw;
                          const isMastered = value >= masteryThreshold;
                          return `Mastery: ${value.toFixed(1)}% ${isMastered ? '✓' : '✗'}`;
                        },
                        afterLabel: context => {
                          const area = curriculumAreas[context.dataIndex];
                          return `Curriculum Code: ${area}\n${groupedKnowledgeStates[area].length} topics`;
                        }
                      }
                    }
                  }
                };
                
                // Return both chart and cards
                return (
                  <>
                    <div className="chart-container" style={{ marginBottom: '25px' }}>
                      <Bar data={areaChartData} options={areaChartOptions} />
                    </div>
                    
                    <div className="area-cards">
                      {Object.entries(groupedKnowledgeStates).map(([area, states]) => {
                        const totalMastery = states.reduce((sum, state) => sum + state.p_mastery, 0);
                        const averageMastery = totalMastery / states.length;
                        
                        return (
                          <div key={area} className="area-card">
                            <h4>{areaNames[area] || area}</h4>
                            <div className="area-mastery">
                              <span className="mastery-percentage">{(averageMastery * 100).toFixed(0)}%</span>
                              <div className="mastery-bar">
                                <div 
                                  className="mastery-fill" 
                                  style={{ 
                                    width: `${averageMastery * 100}%`,
                                    backgroundColor: averageMastery * 100 >= masteryThreshold ? '#2ecc71' : '#e74c3c' 
                                  }}
                                ></div>
                              </div>
                            </div>
                            <p>{states.length} topics</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              } else {
                // Return default case if no areas
                return <p>No curriculum area data available.</p>;
              }
            })()}
          </div>
        </div>
        
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          
          {detailedPerformance.recentResponses.length > 0 ? (
            <div className="activity-list">
              {detailedPerformance.recentResponses.slice(0, 5).map(response => (
                <div key={response.id} className="activity-item">
                  <div className="activity-content">
                    <h4>{response.ContentItem?.content || 'No question content'}</h4>
                    <p>Student answer: {response.answer || 'No response recorded'}</p>
                    <p className="activity-metadata">
                      <span>Difficulty: {response.ContentItem?.difficulty || '3'}/5</span>
                      <span>Time spent: {response.time_spent ? (response.time_spent / 1000).toFixed(1) : '1.0'}s</span>
                      <span>Date: {response.createdAt ? new Date(response.createdAt).toLocaleDateString() : 'Not available'}</span>
                    </p>
                  </div>
                  <div className={`activity-result ${response.correct ? 'correct' : 'incorrect'}`}>
                    {response.correct ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              ))}
              
              {detailedPerformance.recentResponses.length > 5 && (
                <div style={{ textAlign: 'center', margin: '15px 0' }}>
                  <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                    Showing 5 of {detailedPerformance.recentResponses.length} recent activities
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="no-activity" style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '5px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                No recent activity data available
              </p>
              <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                This student has not completed any learning activities recently.
              </p>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                backgroundColor: '#e9f7fe',
                padding: '15px',
                borderRadius: '5px',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#4a6fa5' }}>What you can do:</h4>
                <ul style={{ textAlign: 'left', margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Assign new learning activities to the student</li>
                  <li style={{ marginBottom: '8px' }}>Check if the student is having technical difficulties</li>
                  <li style={{ marginBottom: '8px' }}>Schedule a quick check-in to discuss any challenges</li>
                  <li style={{ marginBottom: '0' }}>Review the student's learning path to ensure it's appropriate</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {engagementChartData && (
          <div className="engagement-section">
            <h2>Engagement Metrics</h2>
            <div className="chart-container">
              <Line data={engagementChartData} options={engagementChartOptions} />
            </div>
          </div>
        )}
        
        <div className="learning-path-section">
          <h2>Learning Path Progress</h2>
          
          {(detailedPerformance.learningPath && detailedPerformance.learningPath.sequence) || 
          Object.entries(detailedPerformance.performanceByKC).length > 0 ? (
            <div className="learning-path">
              {(detailedPerformance.learningPath && detailedPerformance.learningPath.sequence) ? 
                detailedPerformance.learningPath.sequence.map((item, index) => (
                  <div 
                    key={item.knowledge_component_id} 
                    className={`learning-path-item ${item.status}`}
                  >
                    <span className="path-number">{index + 1}</span>
                    <div className="path-content">
                      <span className="kc-code">{item.curriculum_code || 'N/A'}</span>
                      <h4>{item.name}</h4>
                      <div className="mastery-bar">
                        <div 
                          className="mastery-fill" 
                          style={{ width: `${item.mastery * 100}%` }}
                        ></div>
                      </div>
                      {item.mastery < 0.8 && (
                        <div className="intervention-indicator" style={{
                          marginTop: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: item.mastery < 0.5 ? '#f8d7da' : '#fff3cd',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          color: item.mastery < 0.5 ? '#dc3545' : '#856404'
                        }}>
                          {item.mastery < 0.5 ? 'Needs Immediate Intervention' : 'May Need Additional Practice'}
                        </div>
                      )}
                    </div>
                  </div>
                )) :
                Object.entries(detailedPerformance.performanceByKC)
                  .sort((a, b) => a[1].mastery - b[1].mastery)
                  .map(([kcId, kc], index) => {
                    let status = "not-started";
                    if (kc.mastery >= 0.8) status = "complete";
                    else if (kc.mastery >= 0.5) status = "in-progress";
                    else if (kc.mastery > 0) status = "started";
                    
                    return (
                      <div 
                        key={kcId} 
                        className={`learning-path-item ${status}`}
                      >
                        <span className="path-number">{index + 1}</span>
                        <div className="path-content">
                          <span className="kc-code">{kc.curriculum_code || `KC-${kcId}`}</span>
                          <h4>{kc.name}</h4>
                          <div className="mastery-bar">
                            <div 
                              className="mastery-fill" 
                              style={{ width: `${kc.mastery * 100}%` }}
                            ></div>
                          </div>
                          {kc.mastery < 0.8 && (
                            <div className="intervention-indicator" style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: kc.mastery < 0.5 ? '#f8d7da' : '#fff3cd',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              color: kc.mastery < 0.5 ? '#dc3545' : '#856404'
                            }}>
                              {kc.mastery < 0.5 ? 'Needs Immediate Intervention' : 'May Need Additional Practice'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          ) : (
            <p className="no-path">No learning path data available.</p>
          )}
        </div>
      </div>
      
      {/* Contact Student Modal */}
      {showContactModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Contact {student?.name || 'Student'}</h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>
            
            {messageSuccess ? (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Message sent successfully!</p>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  {messageError && (
                    <div style={{
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      padding: '15px',
                      borderRadius: '4px',
                      marginBottom: '15px',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0 }}>{messageError}</p>
                    </div>
                  )}
                  
                  <p style={{ marginBottom: '15px' }}>
                    Send a message to {student?.name || 'the student'} regarding their performance or to provide assistance.
                  </p>
                  
                  <label htmlFor="message" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Message:
                  </label>
                  <textarea
                    id="message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Type your message here..."
                    style={{
                      width: '100%',
                      height: '150px',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '1rem'
                    }}
                  />
                  
                  <div className="contact-options" style={{ marginTop: '15px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                      Contact Options:
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setContactMessage(prev => prev + "\n\nI've noticed your recent performance in math. Let's schedule a time to discuss your progress.")}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Schedule Discussion
                      </button>
                      <button
                        onClick={() => setContactMessage(prev => prev + "\n\nI've assigned additional practice problems for the areas where you need improvement.")}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Additional Practice
                      </button>
                      <button
                        onClick={() => setContactMessage(prev => prev + "\n\nGreat job on your recent math activities! Keep up the good work.")}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Positive Reinforcement
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer" style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}>
                  <button
                    onClick={handleCloseModal}
                    className="button secondary"
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!contactMessage.trim() || sendingMessage}
                    className="button"
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#4a6fa5',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: contactMessage.trim() && !sendingMessage ? 'pointer' : 'not-allowed',
                      opacity: contactMessage.trim() && !sendingMessage ? 1 : 0.7
                    }}
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailView;
