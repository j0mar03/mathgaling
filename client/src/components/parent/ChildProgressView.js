import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './ParentDashboard.css';

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

const ChildProgressView = () => {
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
        console.log(`[ChildProgressView] Fetching student profile for ID: ${id}`);
        const studentResponse = await axios.get(`/api/students/${id}`);
        console.log(`[ChildProgressView] Student profile response:`, studentResponse.data);
        setStudent(studentResponse.data);
        
        // Fetch knowledge states
        console.log(`[ChildProgressView] Fetching knowledge states for student ID: ${id}`);
        const knowledgeStatesResponse = await axios.get(`/api/students/${id}/knowledge-states`);
        console.log(`[ChildProgressView] Knowledge states response:`, knowledgeStatesResponse.data?.length || 0, 'items');
        setKnowledgeStates(knowledgeStatesResponse.data);
        
        // Fetch learning path
        console.log(`[ChildProgressView] Fetching learning path for student ID: ${id}`);
        const learningPathResponse = await axios.get(`/api/students/${id}/learning-path`);
        console.log(`[ChildProgressView] Learning path response:`, learningPathResponse.data);
        setLearningPath(learningPathResponse.data);
        
        // Fetch weekly report
        console.log(`[ChildProgressView] Fetching weekly report for student ID: ${id}`);
        const weeklyReportResponse = await axios.get(`/api/parents/students/${id}/weekly-report`);
        console.log(`[ChildProgressView] Weekly report response:`, weeklyReportResponse.data);
        setWeeklyReport(weeklyReportResponse.data);
        
        // Fetch detailed performance
        console.log(`[ChildProgressView] Fetching detailed performance for student ID: ${id}`);
        const performanceResponse = await axios.get(`/api/students/${id}/detailed-performance`);
        console.log(`[ChildProgressView] Performance response:`, performanceResponse.data);
        setPerformanceData(performanceResponse.data);
        
        if (performanceResponse.data.recentResponses) {
          setRecentResponses(performanceResponse.data.recentResponses);
        }
        
        console.log(`[ChildProgressView] All data fetched successfully for child ID: ${id}`);
        setLoading(false);
      } catch (err) {
        console.error(`[ChildProgressView] Error fetching child data for ID ${id}:`, err);
        console.error(`[ChildProgressView] Error details:`, {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: {
            url: err.config?.url,
            method: err.config?.method
          }
        });
        setError('Failed to load your child\'s data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading your child's progress...</h2>
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
  
  // Prepare data for mastery chart
  const masteryChartData = {
    labels: knowledgeStates.map(state => state.name),
    datasets: [
      {
        label: 'Mastery Level (%)',
        data: knowledgeStates.map(state => state.p_mastery * 100),
        backgroundColor: 'rgba(74, 111, 165, 0.7)',
        borderColor: 'rgba(74, 111, 165, 1)',
        borderWidth: 1,
      },
    ],
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
        }
      },
      x: {
        title: {
          display: true,
          text: 'Knowledge Components'
        },
        ticks: {
          maxRotation: 90,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Knowledge Component Mastery',
      },
    },
  };
  
  // Prepare data for weekly progress chart
  const weeklyProgressData = {
    labels: weeklyReport?.weeklyProgress?.dailyActivity?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: weeklyReport?.weeklyProgress?.dailyActivity?.map(day => day.timeSpent / 60) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Questions Answered',
        data: weeklyReport?.weeklyProgress?.dailyActivity?.map(day => day.questionsAnswered) || [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
      }
    ],
  };
  
  const weeklyProgressOptions = {
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
          text: 'Time Spent (minutes)'
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
          text: 'Questions Answered'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Weekly Activity',
      },
    },
  };
  
  // Prepare data for performance breakdown chart
  const performanceBreakdownData = {
    labels: ['Correct', 'Incorrect', 'Partially Correct'],
    datasets: [
      {
        data: [
          performanceData?.correctAnswers || 0,
          performanceData?.incorrectAnswers || 0,
          performanceData?.partiallyCorrectAnswers || 0,
        ],
        backgroundColor: [
          'rgba(40, 167, 69, 0.7)',  // green for correct
          'rgba(220, 53, 69, 0.7)',  // red for incorrect
          'rgba(255, 193, 7, 0.7)'   // yellow for partially correct
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(220, 53, 69, 1)',
          'rgba(255, 193, 7, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const performanceBreakdownOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Answer Distribution',
      },
    },
  };
  
  // Group knowledge components by curriculum area
  const groupedKnowledgeStates = knowledgeStates.reduce((acc, state) => {
    // Extract curriculum area from curriculum code (e.g., "G3-NS-1" -> "NS")
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
  
  // Get strongest and weakest areas
  const areaAverageMasteries = Object.entries(groupedKnowledgeStates).map(([area, states]) => {
    const totalMastery = states.reduce((sum, state) => sum + state.p_mastery, 0);
    return {
      area,
      displayName: areaNames[area] || area,
      averageMastery: totalMastery / states.length
    };
  });
  
  const strongestArea = [...areaAverageMasteries].sort((a, b) => b.averageMastery - a.averageMastery)[0];
  const weakestArea = [...areaAverageMasteries].sort((a, b) => a.averageMastery - b.averageMastery)[0];
  
  // Calculate daily streak
  const streak = weeklyReport?.weeklyProgress?.dailyActivity
    ? weeklyReport.weeklyProgress.dailyActivity.filter(day => day.questionsAnswered > 0).length
    : 0;
  
  return (
    <div className="child-progress-view">
      <div className="child-header">
        <div className="header-content">
          <h1>{student?.name || 'Student'}</h1>
          <p>Grade {student?.grade_level} • Student ID: {student?.id}</p>
          
          <div className="child-stats">
            <div className="stat">
              <span className="stat-value">
                {(knowledgeStates.reduce((sum, state) => sum + state.p_mastery, 0) / 
                  (knowledgeStates.length || 1) * 100).toFixed(0)}%
              </span>
              <span className="stat-label">Overall Mastery</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {weeklyReport?.weeklyProgress?.activeDays || 0}/7
              </span>
              <span className="stat-label">Active Days</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {weeklyReport?.weeklyProgress?.totalQuestionsAnswered || 0}
              </span>
              <span className="stat-label">Questions Answered</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/parent" className="button secondary">Back to Dashboard</Link>
          <Link to={`/parent/child/${id}/report`} className="button">Weekly Report</Link>
        </div>
      </div>
      
      <div className="child-content">
        {/* New: Progress Summary Section */}
        <div className="progress-summary-section">
          <h2>Progress Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-details">
                <h3>Learning Progress</h3>
                <p className={weeklyReport?.weeklyProgress?.weeklyChange > 0 ? 'positive' : 'negative'}>
                  {weeklyReport?.weeklyProgress?.weeklyChange > 0 ? '+' : ''}
                  {((weeklyReport?.weeklyProgress?.weeklyChange || 0) * 100).toFixed(1)}% this week
                </p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">🔥</div>
              <div className="summary-details">
                <h3>Learning Streak</h3>
                <p>{streak} day{streak !== 1 ? 's' : ''} in a row</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">💪</div>
              <div className="summary-details">
                <h3>Strongest Area</h3>
                <p>{strongestArea ? strongestArea.displayName : 'N/A'} 
                {strongestArea ? ` (${(strongestArea.averageMastery * 100).toFixed(0)}%)` : ''}
                </p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">🎯</div>
              <div className="summary-details">
                <h3>Focus Area</h3>
                <p>{weakestArea ? weakestArea.displayName : 'N/A'}
                {weakestArea ? ` (${(weakestArea.averageMastery * 100).toFixed(0)}%)` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="weekly-activity-section">
          <h2>Weekly Activity</h2>
          <div className="charts-container">
            <div className="chart-wrapper activity-chart">
              {weeklyReport?.weeklyProgress?.dailyActivity?.length > 0 ? (
                <div className="chart-container">
                  <Line data={weeklyProgressData} options={weeklyProgressOptions} />
                </div>
              ) : (
                <p className="no-data">No activity data available for this week.</p>
              )}
            </div>
            
            <div className="chart-wrapper performance-chart">
              <div className="chart-container donut-chart">
                <Doughnut data={performanceBreakdownData} options={performanceBreakdownOptions} />
              </div>
            </div>
          </div>
          
          <div className="weekly-summary">
            <div className="summary-item">
              <h3>Total Time Spent</h3>
              <p>{((weeklyReport?.weeklyProgress?.totalTimeSpent || 0) / 60).toFixed(1)} minutes</p>
            </div>
            <div className="summary-item">
              <h3>Correct Answer Rate</h3>
              <p>{((weeklyReport?.weeklyProgress?.correctRate || 0) * 100).toFixed(0)}%</p>
            </div>
            <div className="summary-item">
              <h3>Mastery Improvement</h3>
              <p className={weeklyReport?.weeklyProgress?.weeklyChange > 0 ? 'positive' : 'negative'}>
                {weeklyReport?.weeklyProgress?.weeklyChange > 0 ? '+' : ''}
                {((weeklyReport?.weeklyProgress?.weeklyChange || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="mastery-section">
          <h2>Knowledge Component Mastery</h2>
          <div className="chart-container">
            <Bar data={masteryChartData} options={masteryChartOptions} />
          </div>
          
          <div className="curriculum-areas">
            <h3>Mastery by Curriculum Area</h3>
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
                          style={{ width: `${averageMastery * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <p>{states.length} topics</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          
          {recentResponses.length > 0 ? (
            <div className="activity-list">
              {recentResponses.slice(0, 5).map(response => (
                <div key={response.id} className="activity-item">
                  <div className="activity-content">
                    <h4>{response.content}</h4>
                    <p>Answer: {response.answer}</p>
                    <p className="activity-metadata">
                      <span>Difficulty: {response.difficulty}/5</span>
                      <span>Time spent: {(response.time_spent / 1000).toFixed(1)}s</span>
                      <span>Date: {new Date(response.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className={`activity-result ${response.correct ? 'correct' : 'incorrect'}`}>
                    {response.correct ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity">No recent activity to display.</p>
          )}
        </div>
        
        <div className="learning-path-section">
          <h2>Learning Path Progress</h2>
          
          {learningPath && learningPath.sequence ? (
            <div className="learning-path">
              {learningPath.sequence.map((item, index) => (
                <div 
                  key={item.knowledge_component_id} 
                  className={`learning-path-item ${item.status}`}
                >
                  <span className="path-number">{index + 1}</span>
                  <div className="path-content">
                    <h4>{item.name}</h4>
                    <p>{item.curriculum_code}</p>
                    <div className="mastery-bar">
                      <div 
                        className="mastery-fill" 
                        style={{ width: `${item.mastery * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-path">No learning path data available.</p>
          )}
        </div>
        
        <div className="recommendations-section">
          <h2>Parent Recommendations</h2>
          
          {weeklyReport?.recommendations ? (
            <div className="recommendations-list">
              {weeklyReport.recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <h3>{recommendation.title}</h3>
                  <p>{recommendation.description}</p>
                  <div className="recommendation-actions">
                    {recommendation.resources && (
                      <button className="button">View Resources</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-recommendations">No recommendations available at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildProgressView;
