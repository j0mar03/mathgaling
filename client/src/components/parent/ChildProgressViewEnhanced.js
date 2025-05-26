import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './ChildProgressViewEnhanced.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

const ChildProgressViewEnhanced = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [recentResponses, setRecentResponses] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`[ChildProgressView] Starting to fetch data for child ID: ${id}`);
        
        // Fetch student profile
        try {
          console.log(`[ChildProgressView] Fetching student profile for ID: ${id}`);
          const studentResponse = await axios.get(`/api/students/${id}`);
          console.log(`[ChildProgressView] ✅ Student profile SUCCESS:`, studentResponse.data);
          setStudent(studentResponse.data);
        } catch (studentError) {
          console.error(`[ChildProgressView] ❌ Student profile FAILED:`, studentError);
          throw new Error(`Student profile failed: ${studentError.response?.status} - ${studentError.message}`);
        }
        
        // Fetch knowledge states
        try {
          console.log(`[ChildProgressView] Fetching knowledge states for student ID: ${id}`);
          const knowledgeStatesResponse = await axios.get(`/api/students/${id}/knowledge-states`);
          console.log(`[ChildProgressView] ✅ Knowledge states SUCCESS:`, knowledgeStatesResponse.data?.length || 0, 'items');
          setKnowledgeStates(knowledgeStatesResponse.data);
        } catch (ksError) {
          console.error(`[ChildProgressView] ❌ Knowledge states FAILED:`, ksError);
          throw new Error(`Knowledge states failed: ${ksError.response?.status} - ${ksError.message}`);
        }
        
        // Fetch learning path
        try {
          console.log(`[ChildProgressView] Fetching learning path for student ID: ${id}`);
          const learningPathResponse = await axios.get(`/api/students/${id}/learning-path`);
          console.log(`[ChildProgressView] ✅ Learning path SUCCESS:`, learningPathResponse.data);
          setLearningPath(learningPathResponse.data);
        } catch (lpError) {
          console.error(`[ChildProgressView] ❌ Learning path FAILED:`, lpError);
          throw new Error(`Learning path failed: ${lpError.response?.status} - ${lpError.message}`);
        }
        
        // Fetch weekly report
        try {
          console.log(`[ChildProgressView] Fetching weekly report for student ID: ${id}`);
          const weeklyReportResponse = await axios.get(`/api/parents/students/${id}/weekly-report`);
          console.log(`[ChildProgressView] ✅ Weekly report SUCCESS:`, weeklyReportResponse.data);
          setWeeklyReport(weeklyReportResponse.data);
        } catch (wrError) {
          console.error(`[ChildProgressView] ❌ Weekly report FAILED:`, wrError);
          throw new Error(`Weekly report failed: ${wrError.response?.status} - ${wrError.message}`);
        }
        
        // Fetch detailed performance
        try {
          console.log(`[ChildProgressView] Fetching detailed performance for student ID: ${id}`);
          const performanceResponse = await axios.get(`/api/students/${id}/detailed-performance`);
          console.log(`[ChildProgressView] ✅ Detailed performance SUCCESS:`, performanceResponse.data);
          setPerformanceData(performanceResponse.data);
          
          if (performanceResponse.data.recentResponses) {
            setRecentResponses(performanceResponse.data.recentResponses);
          }
        } catch (dpError) {
          console.error(`[ChildProgressView] ❌ Detailed performance FAILED:`, dpError);
          throw new Error(`Detailed performance failed: ${dpError.response?.status} - ${dpError.message}`);
        }
        
        console.log(`[ChildProgressView] 🎉 All data fetched successfully for child ID: ${id}`);
        setLoading(false);
      } catch (err) {
        console.error(`[ChildProgressView] 💥 FATAL ERROR fetching child data for ID ${id}:`, err);
        console.error(`[ChildProgressView] 📋 Full error object:`, err);
        setError(`Failed to load your child's data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading your child's progress...</h2>
        <p>Please wait while we gather the latest information.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
          <Link to="/parent" className="btn-back">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Calculate overall mastery
  const overallMastery = knowledgeStates.length > 0 
    ? knowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0) / knowledgeStates.length 
    : 0;

  // Group knowledge components by curriculum area
  const groupedKnowledgeStates = knowledgeStates.reduce((acc, state) => {
    const match = state.curriculum_code?.match(/G\d-([A-Z]+)-\d+/);
    const area = match ? match[1] : 'Other';
    
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
  
  // Calculate area averages
  const areaAverages = Object.entries(groupedKnowledgeStates).map(([area, states]) => {
    const totalMastery = states.reduce((sum, state) => sum + state.p_mastery, 0);
    return {
      area,
      displayName: areaNames[area] || area,
      averageMastery: totalMastery / states.length
    };
  }).sort((a, b) => b.averageMastery - a.averageMastery);

  const strongestArea = areaAverages[0];
  const weakestArea = areaAverages[areaAverages.length - 1];

  // Prepare mastery trend data (mock historical data for now)
  const masteryTrendData = {
    labels: ['4 weeks ago', '3 weeks ago', '2 weeks ago', 'Last week', 'This week'],
    datasets: [
      {
        label: 'Overall Mastery',
        data: [
          Math.max(0.2, overallMastery - 0.3),
          Math.max(0.25, overallMastery - 0.2),
          Math.max(0.3, overallMastery - 0.1),
          Math.max(0.35, overallMastery - 0.05),
          overallMastery
        ].map(val => val * 100),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }
    ]
  };

  const masteryTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Mastery Progress Over Time',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Mastery Level (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    }
  };

  // Weekly activity chart
  const weeklyActivityData = {
    labels: weeklyReport?.weeklyProgress?.dailyActivity?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Questions Answered',
        data: weeklyReport?.weeklyProgress?.dailyActivity?.map(day => day.questionsAnswered) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const weeklyActivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Daily Activity This Week',
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Performance distribution
  const performanceDistributionData = {
    labels: ['Excellent (90-100%)', 'Good (70-89%)', 'Fair (50-69%)', 'Needs Work (Below 50%)'],
    datasets: [
      {
        data: [
          knowledgeStates.filter(ks => ks.p_mastery >= 0.9).length,
          knowledgeStates.filter(ks => ks.p_mastery >= 0.7 && ks.p_mastery < 0.9).length,
          knowledgeStates.filter(ks => ks.p_mastery >= 0.5 && ks.p_mastery < 0.7).length,
          knowledgeStates.filter(ks => ks.p_mastery < 0.5).length
        ],
        backgroundColor: [
          '#4CAF50',
          '#8BC34A', 
          '#FFC107',
          '#FF5722'
        ],
        borderWidth: 0
      }
    ]
  };

  const performanceDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Performance Distribution',
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    }
  };

  // Generate insights and recommendations
  const generateInsights = () => {
    const insights = [];
    const recommendations = [];

    // Overall performance insight
    if (overallMastery >= 0.8) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        title: 'Excellent Progress!',
        message: `${student?.name} is performing exceptionally well with ${(overallMastery * 100).toFixed(0)}% overall mastery.`
      });
      recommendations.push({
        icon: '🚀',
        title: 'Challenge Mode',
        description: 'Consider introducing more challenging problems to keep your child engaged.'
      });
    } else if (overallMastery >= 0.6) {
      insights.push({
        type: 'positive',
        icon: '👍',
        title: 'Good Progress',
        message: `${student?.name} is making solid progress with ${(overallMastery * 100).toFixed(0)}% overall mastery.`
      });
    } else {
      insights.push({
        type: 'attention',
        icon: '💪',
        title: 'Building Foundation',
        message: `${student?.name} is working on building fundamental skills. Extra practice would be beneficial.`
      });
      recommendations.push({
        icon: '📚',
        title: 'Additional Practice',
        description: 'Consider spending 15-20 minutes daily on extra practice problems.'
      });
    }

    // Activity insights
    const activeDays = weeklyReport?.weeklyProgress?.activeDays || 0;
    if (activeDays >= 5) {
      insights.push({
        type: 'positive',
        icon: '🔥',
        title: 'Great Consistency!',
        message: `${student?.name} practiced ${activeDays} days this week. Excellent routine!`
      });
    } else if (activeDays >= 3) {
      insights.push({
        type: 'neutral',
        icon: '📅',
        title: 'Good Routine',
        message: `${student?.name} practiced ${activeDays} days this week. Try for daily practice!`
      });
      recommendations.push({
        icon: '⏰',
        title: 'Daily Practice',
        description: 'Aim for short, daily practice sessions rather than longer, infrequent ones.'
      });
    } else {
      insights.push({
        type: 'attention',
        icon: '📆',
        title: 'More Practice Needed',
        message: `${student?.name} only practiced ${activeDays} days this week. Consistency is key!`
      });
      recommendations.push({
        icon: '🎯',
        title: 'Set a Schedule',
        description: 'Create a regular practice schedule to build a strong learning habit.'
      });
    }

    // Subject area insights
    if (strongestArea && weakestArea && strongestArea !== weakestArea) {
      insights.push({
        type: 'neutral',
        icon: '📊',
        title: 'Subject Strengths',
        message: `Strongest area: ${strongestArea.displayName} (${(strongestArea.averageMastery * 100).toFixed(0)}%). Focus area: ${weakestArea.displayName} (${(weakestArea.averageMastery * 100).toFixed(0)}%).`
      });
      
      if (weakestArea.averageMastery < 0.5) {
        recommendations.push({
          icon: '🎯',
          title: `Focus on ${weakestArea.displayName}`,
          description: `Spend extra time on ${weakestArea.displayName} concepts to strengthen this area.`
        });
      }
    }

    return { insights, recommendations };
  };

  const { insights, recommendations } = generateInsights();

  return (
    <div className="child-progress-enhanced">
      {/* Header Section */}
      <div className="progress-header">
        <div className="header-content">
          <div className="student-info">
            <div className="student-avatar">
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div className="student-details">
              <h1>{student?.name || 'Student'}</h1>
              <p className="student-meta">Grade {student?.grade_level} • ID: {student?.id}</p>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/parent" className="btn-secondary">
              ← Back to Dashboard
            </Link>
            <Link to={`/parent/child/${id}/report`} className="btn-primary">
              📊 Detailed Report
            </Link>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <div className="metric-value">{(overallMastery * 100).toFixed(0)}%</div>
              <div className="metric-label">Overall Mastery</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📅</div>
            <div className="metric-content">
              <div className="metric-value">{weeklyReport?.weeklyProgress?.activeDays || 0}/7</div>
              <div className="metric-label">Active Days</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-value">{Math.round((weeklyReport?.weeklyProgress?.totalTimeSpent || 0) / 60)}</div>
              <div className="metric-label">Minutes This Week</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{((weeklyReport?.weeklyProgress?.correctRate || 0) * 100).toFixed(0)}%</div>
              <div className="metric-label">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="progress-content">
        {/* Mastery Trend - Top Priority */}
        <div className="content-section full-width">
          <div className="section-header">
            <h2>📈 Mastery Progress Over Time</h2>
            <p>Track your child's learning progress and skill development</p>
          </div>
          <div className="chart-container large">
            <Line data={masteryTrendData} options={masteryTrendOptions} />
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="content-section full-width">
          <div className="section-header">
            <h2>💡 Learning Insights & Recommendations</h2>
            <p>Personalized insights based on your child's performance</p>
          </div>
          
          <div className="insights-grid">
            <div className="insights-column">
              <h3>📊 Key Insights</h3>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className={`insight-item ${insight.type}`}>
                    <div className="insight-icon">{insight.icon}</div>
                    <div className="insight-content">
                      <h4>{insight.title}</h4>
                      <p>{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="recommendations-column">
              <h3>🎯 Recommendations</h3>
              <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-icon">{rec.icon}</div>
                    <div className="recommendation-content">
                      <h4>{rec.title}</h4>
                      <p>{rec.description}</p>
                    </div>
                  </div>
                ))}
                
                {/* Default recommendations if none generated */}
                {recommendations.length === 0 && (
                  <>
                    <div className="recommendation-item">
                      <div className="recommendation-icon">🎉</div>
                      <div className="recommendation-content">
                        <h4>Celebrate Success</h4>
                        <p>Acknowledge your child's progress and effort to maintain motivation.</p>
                      </div>
                    </div>
                    <div className="recommendation-item">
                      <div className="recommendation-icon">🎮</div>
                      <div className="recommendation-content">
                        <h4>Make it Fun</h4>
                        <p>Use educational games and interactive activities to reinforce learning.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-section">
            <div className="section-header">
              <h3>📊 Weekly Activity</h3>
              <p>Daily practice sessions this week</p>
            </div>
            <div className="chart-container">
              <Bar data={weeklyActivityData} options={weeklyActivityOptions} />
            </div>
          </div>
          
          <div className="chart-section">
            <div className="section-header">
              <h3>🎯 Performance Distribution</h3>
              <p>Skill level breakdown across topics</p>
            </div>
            <div className="chart-container">
              <Doughnut data={performanceDistributionData} options={performanceDistributionOptions} />
            </div>
          </div>
        </div>

        {/* Subject Areas Performance */}
        <div className="content-section">
          <div className="section-header">
            <h2>📚 Subject Areas Performance</h2>
            <p>Detailed breakdown by math topics</p>
          </div>
          
          <div className="subjects-grid">
            {areaAverages.map((area, index) => (
              <div key={area.area} className="subject-card">
                <div className="subject-header">
                  <h3>{area.displayName}</h3>
                  <div className={`mastery-badge ${area.averageMastery >= 0.8 ? 'excellent' : area.averageMastery >= 0.6 ? 'good' : 'needs-work'}`}>
                    {(area.averageMastery * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${area.averageMastery * 100}%` }}
                  ></div>
                </div>
                <div className="subject-stats">
                  <span>{groupedKnowledgeStates[area.area]?.length || 0} topics</span>
                  <span className={`trend ${index === 0 ? 'positive' : index === areaAverages.length - 1 ? 'attention' : 'neutral'}`}>
                    {index === 0 ? '🔥 Strongest' : index === areaAverages.length - 1 ? '🎯 Focus Area' : '📈 Progressing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentResponses.length > 0 && (
          <div className="content-section">
            <div className="section-header">
              <h2>📝 Recent Activity</h2>
              <p>Latest practice sessions and results</p>
            </div>
            
            <div className="activity-timeline">
              {recentResponses.slice(0, 5).map((response, index) => (
                <div key={response.id} className="activity-item">
                  <div className={`activity-indicator ${response.correct ? 'correct' : 'incorrect'}`}>
                    {response.correct ? '✅' : '❌'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-question">
                      {response.content || 'Practice Question'}
                    </div>
                    <div className="activity-meta">
                      <span>Difficulty: {response.difficulty}/5</span>
                      <span>Time: {(response.time_spent / 1000).toFixed(1)}s</span>
                      <span>{new Date(response.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProgressViewEnhanced;