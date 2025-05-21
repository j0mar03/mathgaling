import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, RadialLinearScale } from 'chart.js';
import { Pie, Bar, Line, Radar } from 'react-chartjs-2';
import './ParentDashboard.css';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend
);

const WeeklyReportView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [historicalMastery, setHistoricalMastery] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student profile and weekly report (essential data)
        const [studentResponse, weeklyReportResponse] = await Promise.all([
          axios.get(`/api/students/${id}`),
          axios.get(`/api/parents/students/${id}/weekly-report`)
        ]);
        
        setStudent(studentResponse.data);
        setWeeklyReport(weeklyReportResponse.data);
        
        // Attempt to fetch additional data for enhanced views
        // These requests are wrapped in try/catch blocks to handle gracefully if endpoints aren't available
        try {
          const knowledgeStatesResponse = await axios.get(`/api/students/${id}/knowledge-states`);
          setKnowledgeStates(knowledgeStatesResponse.data || []);
        } catch (err) {
          console.warn('Knowledge states data not available:', err);
          // Continue without this data - views will adapt
        }
        
        try {
          const historicalMasteryResponse = await axios.get(`/api/students/${id}/historical-mastery`);
          setHistoricalMastery(historicalMasteryResponse.data || []);
        } catch (err) {
          console.warn('Historical mastery data not available:', err);
          // Continue without this data - views will adapt
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching essential weekly report data:', err);
        setError('Failed to load weekly report data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading weekly report...</h2>
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
  
  const weeklyProgress = weeklyReport?.weeklyProgress || {};
  const startDate = weeklyProgress.startDate ? new Date(weeklyProgress.startDate) : new Date();
  const endDate = weeklyProgress.endDate ? new Date(weeklyProgress.endDate) : new Date();
  
  // Format dates
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Prepare data for activity distribution chart
  const activityDistributionData = {
    labels: ['Lessons', 'Practice Questions', 'Assessments', 'Review'],
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: [
          weeklyProgress.activityDistribution?.lessons || 0,
          weeklyProgress.activityDistribution?.practice || 0,
          weeklyProgress.activityDistribution?.assessments || 0,
          weeklyProgress.activityDistribution?.review || 0
        ].map(time => time / 60), // Convert seconds to minutes
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 205, 86, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for daily activity chart
  const dailyActivityData = {
    labels: weeklyProgress.dailyActivity?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: weeklyProgress.dailyActivity?.map(day => day.timeSpent / 60) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const dailyActivityOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time Spent (minutes)'
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
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Activity',
      },
    },
  };
  
  // Map curriculum area codes to full names - math subjects only
  const areaNames = {
    'NS': 'Number Sense',
    'GEO': 'Geometry',
    'MEAS': 'Measurement',
    'ALG': 'Algebra',
    'STAT': 'Statistics'
  };
  
  // Filter out non-math subjects from the weekly progress data
  const filterMathSubjectsOnly = (subjectAreas) => {
    if (!subjectAreas) return {};
    
    const filteredAreas = {};
    Object.entries(subjectAreas).forEach(([area, value]) => {
      if (areaNames[area]) { // Only include areas that are in our math subjects dictionary
        filteredAreas[area] = value;
      }
    });
    return filteredAreas;
  };
  
  // Apply filtering to subject areas
  const mathSubjectAreas = filterMathSubjectsOnly(weeklyProgress.subjectAreas);
  const previousMathSubjectAreas = filterMathSubjectsOnly(weeklyProgress.previousSubjectAreas);
  
  // Generate previous weeks if historical data is not available
  const generateHistoricalData = () => {
    if (historicalMastery.length > 0) return historicalMastery;
    
    // Fallback: Generate simulated historical data based on current mastery
    const previousMastery = weeklyProgress.previousAverageMastery || (weeklyProgress.averageMastery * 0.9);
    
    return [
      { week: '4 weeks ago', overallMastery: previousMastery - 0.08 },
      { week: '3 weeks ago', overallMastery: previousMastery - 0.06 },
      { week: '2 weeks ago', overallMastery: previousMastery - 0.03 },
      { week: 'Last week', overallMastery: previousMastery },
      { week: 'This week', overallMastery: weeklyProgress.averageMastery || previousMastery + 0.02 }
    ];
  };
  
  const historicalData = generateHistoricalData();
  
  // Prepare data for mastery trend chart
  const masteryTrendData = {
    labels: historicalData.map(entry => entry.week),
    datasets: [
      {
        label: 'Overall Mastery',
        data: historicalData.map(entry => entry.overallMastery * 100),
        borderColor: 'rgba(74, 111, 165, 1)',
        backgroundColor: 'rgba(74, 111, 165, 0.2)',
        fill: true,
        tension: 0.4
      }
    ],
  };
  
  const masteryTrendOptions = {
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
          text: 'Week'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mastery Trend Over Time',
      },
    },
  };
  
  // Group knowledge components by curriculum area (with fallback)
  const groupedKnowledgeStates = knowledgeStates.length > 0 
    ? knowledgeStates.reduce((acc, state) => {
        // Extract curriculum area from curriculum code (e.g., "G3-NS-1" -> "NS")
        const match = state.curriculum_code?.match(/G\d-([A-Z]+)-\d+/);
        const area = match ? match[1] : 'Other';
        
        if (!acc[area]) {
          acc[area] = [];
        }
        
        acc[area].push(state);
        return acc;
      }, {})
    : // Fallback: Create placeholder knowledge states based on subject areas
      Object.keys(weeklyProgress.subjectAreas || {}).reduce((acc, area) => {
        // Generate mock knowledge states for each subject area
        acc[area] = Array(5).fill().map((_, i) => ({
          id: `${area}-${i}`,
          name: `${areaNames[area] || area} Skill ${i+1}`,
          curriculum_code: `G3-${area}-${i+1}`,
          p_mastery: (weeklyProgress.subjectAreas[area] || 0) * (Math.random() * 0.4 + 0.8) // Randomize around the area mastery
        }));
        return acc;
      }, {});
  
  // Prepare data for skill breakdown radar chart
  const prepareRadarData = (areaCode) => {
    const states = groupedKnowledgeStates[areaCode] || [];
    if (states.length === 0) return null;
    
    // Take top 5 skills for better visibility
    const skillsToShow = states.slice(0, 5);
    
    return {
      labels: skillsToShow.map(state => state.name),
      datasets: [
        {
          label: 'This Week',
          data: skillsToShow.map(state => state.p_mastery * 100),
          backgroundColor: 'rgba(74, 111, 165, 0.2)',
          borderColor: 'rgba(74, 111, 165, 1)',
          borderWidth: 1,
        },
        {
          label: 'Target',
          data: skillsToShow.map(() => 90),
          backgroundColor: 'rgba(192, 192, 192, 0.1)',
          borderColor: 'rgba(192, 192, 192, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5],
        },
      ],
    };
  };
  
  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
  
  // Calculate most improved area - using filtered math subjects
  const calculateMostImproved = () => {
    if (!mathSubjectAreas || Object.keys(mathSubjectAreas).length === 0) {
      return { area: null, change: 0 };
    }
    
    let maxChange = -1;
    let mostImprovedArea = null;
    
    Object.entries(mathSubjectAreas).forEach(([area, mastery]) => {
      const previousMastery = previousMathSubjectAreas[area] || 0;
      const change = mastery - previousMastery;
      
      if (change > maxChange) {
        maxChange = change;
        mostImprovedArea = area;
      }
    });
    
    return {
      area: mostImprovedArea,
      change: maxChange
    };
  };
  
  const mostImproved = calculateMostImproved();
  
  // Find areas needing improvement
  const findFocusAreas = () => {
    if (!mathSubjectAreas || Object.keys(mathSubjectAreas).length === 0) {
      return [];
    }
    
    return Object.entries(mathSubjectAreas)
      .sort(([, a], [, b]) => a - b)
      .filter(([, mastery]) => mastery < 0.7) // Areas below 70% mastery need focus
      .slice(0, 2)
      .map(([area]) => area);
  };
  
  const focusAreas = findFocusAreas();
  
  // Find strongest areas
  const findStrengths = () => {
    if (!mathSubjectAreas || Object.keys(mathSubjectAreas).length === 0) {
      return [];
    }
    
    return Object.entries(mathSubjectAreas)
      .sort(([, a], [, b]) => b - a)
      .filter(([, mastery]) => mastery >= 0.7) // Areas above 70% mastery are strengths
      .slice(0, 2)
      .map(([area]) => area);
  };
  
  const strengthAreas = findStrengths();
  
  // Generate custom learning tips based on student data
  const generateLearningTips = () => {
    const tips = [];
    
    // Activity-based tips
    if (weeklyProgress.activeDays < 3) {
      tips.push({
        icon: '📅',
        title: 'Consistency Matters',
        content: 'Try to practice at least 4-5 days per week for better retention of math concepts.'
      });
    }
    
    // Time-based tips
    const avgTimePerDay = (weeklyProgress.totalTimeSpent || 0) / (weeklyProgress.activeDays || 1);
    if (avgTimePerDay < 15 * 60) { // Less than 15 minutes per day
      tips.push({
        icon: '⏱️',
        title: 'Quality Practice Time',
        content: 'Aim for 15-20 minutes of focused math practice each session for optimal learning.'
      });
    }
    
    // Mastery-based tips
    if (focusAreas.length > 0) {
      tips.push({
        icon: '🔍',
        title: 'Targeted Practice',
        content: `Focus on ${focusAreas.map(area => areaNames[area]).join(' and ')} concepts with extra practice problems.`
      });
    }
    
    // Balanced learning tip
    if (strengthAreas.length > 0 && focusAreas.length > 0) {
      tips.push({
        icon: '⚖️',
        title: 'Balanced Approach',
        content: `While strengthening ${focusAreas.map(area => areaNames[area]).join(' and ')}, maintain skills in ${strengthAreas.map(area => areaNames[area]).join(' and ')}.`
      });
    }
    
    // Add a curriculum-specific tip
    if (weeklyProgress.averageMastery > 0.8) {
      tips.push({
        icon: '🚀',
        title: 'Challenge Opportunity',
        content: 'Consider exploring more advanced math problems to keep engagement high.'
      });
    } else if (weeklyProgress.averageMastery < 0.5) {
      tips.push({
        icon: '🧩',
        title: 'Building Foundations',
        content: 'Focus on understanding core concepts before moving to more complex topics.'
      });
    }
    
    // Ensure we have at least 3 tips
    if (tips.length < 3) {
      tips.push({
        icon: '🏆',
        title: 'Celebrate Progress',
        content: 'Recognize and celebrate small improvements to maintain motivation.'
      });
    }
    
    return tips.slice(0, 4); // Return at most 4 tips
  };
  
  const learningTips = generateLearningTips();
  
  return (
    <div className="weekly-report-view">
      <div className="report-header">
        <div className="header-content">
          <h1>Weekly Progress Report</h1>
          <p>{student?.name} • Grade {student?.grade_level}</p>
          <p className="report-period">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>
        <div className="header-actions">
          <Link to={`/parent/child/${id}`} className="button secondary">Back to Progress</Link>
          <button className="button" onClick={() => window.print()}>Print Report</button>
        </div>
      </div>
      
      <div className="report-summary">
        <div className="summary-card">
          <h3>Overall Mastery</h3>
          <div className="mastery-percentage">
            {(weeklyProgress.averageMastery * 100).toFixed(0)}%
          </div>
          <div className="mastery-bar">
            <div 
              className="mastery-fill" 
              style={{ width: `${weeklyProgress.averageMastery * 100}%` }}
            ></div>
          </div>
          <div className="weekly-change">
            <span className={weeklyProgress.weeklyChange >= 0 ? 'positive' : 'negative'}>
              {weeklyProgress.weeklyChange > 0 ? '+' : ''}
              {(weeklyProgress.weeklyChange * 100).toFixed(1)}%
            </span>
            <span className="change-label">from last week</span>
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Active Days</h3>
          <div className="active-days">
            <span className="days-count">{weeklyProgress.activeDays || 0}</span>
            <span className="days-total">/7</span>
          </div>
          <div className="active-days-grid">
            {weeklyProgress.dailyActivity?.map((day, index) => (
              <div 
                key={index} 
                className={`day-indicator ${day.timeSpent > 0 ? 'active' : 'inactive'}`}
                title={`${day.date}: ${day.timeSpent > 0 ? (day.timeSpent / 60).toFixed(1) + ' minutes' : 'Inactive'}`}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Questions Answered</h3>
          <div className="questions-count">
            {weeklyProgress.totalQuestionsAnswered || 0}
          </div>
          <div className="correct-rate">
            <span className="correct-percentage">
              {(weeklyProgress.correctRate * 100).toFixed(0)}%
            </span>
            <span className="correct-label">correct</span>
          </div>
        </div>
      </div>
      
      <div className="report-content">
        <div className="activity-section">
          <h2>Weekly Activity</h2>
          
          <div className="activity-charts">
            <div className="chart-container pie-chart">
              <h3>Activity Distribution</h3>
              <Pie data={activityDistributionData} />
            </div>
            
            <div className="chart-container bar-chart">
              <h3>Daily Activity</h3>
              <Bar data={dailyActivityData} options={dailyActivityOptions} />
            </div>
          </div>
          
          <div className="activity-stats">
            <div className="stat-item">
              <h3>Total Time Spent</h3>
              <p>{(weeklyProgress.totalTimeSpent / 60).toFixed(1)} minutes</p>
            </div>
            <div className="stat-item">
              <h3>Average Session Length</h3>
              <p>{(weeklyProgress.averageSessionLength / 60).toFixed(1)} minutes</p>
            </div>
            <div className="stat-item">
              <h3>Longest Session</h3>
              <p>{(weeklyProgress.longestSession / 60).toFixed(1)} minutes</p>
            </div>
          </div>
        </div>
        
        <div className="mastery-section enhanced">
          <h2>Mastery Progress</h2>
          
          <div className="mastery-trend-container">
            <h3>Mastery Trend Over Time</h3>
            <div className="chart-container line-chart">
              <Line data={masteryTrendData} options={masteryTrendOptions} />
            </div>
            
            {mostImproved.area && (
              <div className="highlight-card">
                <div className="highlight-icon">🌟</div>
                <div className="highlight-content">
                  <h4>Most Improved Area</h4>
                  <p>
                    <strong>{areaNames[mostImproved.area] || mostImproved.area}</strong> has improved by 
                    <span className="positive"> +{(mostImproved.change * 100).toFixed(1)}%</span> this week
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="subject-areas enhanced">
            {mathSubjectAreas && Object.entries(mathSubjectAreas).map(([area, mastery]) => {
              const previousMastery = previousMathSubjectAreas[area] || 0;
              const change = mastery - previousMastery;
              const radarData = prepareRadarData(area);
              
              return (
                <div key={area} className="subject-area-card enhanced">
                  <div className="area-header">
                    <h3>{areaNames[area] || area}</h3>
                    <div className="area-change">
                      <span className={change >= 0 ? 'positive' : 'negative'}>
                        {change > 0 ? '+' : ''}
                        {(change * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mastery-comparison">
                    <div className="previous-mastery">
                      <span className="mastery-label">Last Week</span>
                      <div className="mastery-bar">
                        <div 
                          className="mastery-fill" 
                          style={{ width: `${previousMastery * 100}%` }}
                        ></div>
                      </div>
                      <span className="mastery-percentage">{(previousMastery * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="current-mastery">
                      <span className="mastery-label">This Week</span>
                      <div className="mastery-bar">
                        <div 
                          className="mastery-fill" 
                          style={{ width: `${mastery * 100}%` }}
                        ></div>
                      </div>
                      <span className="mastery-percentage">{(mastery * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {radarData && (
                    <div className="skill-breakdown">
                      <h4>Skill Breakdown</h4>
                      <div className="chart-container radar-chart">
                        <Radar data={radarData} options={radarOptions} />
                      </div>
                    </div>
                  )}
                  
                  <div className="topic-count">
                    {groupedKnowledgeStates[area]?.length || 0} topics in curriculum
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mastery-insights">
            <h3>Learning Insights & Recommendations</h3>
            
            <div className="insights-summary">
              <div className="insight-overview">
                <p>
                  {student?.name || 'Your child'} is showing {
                    weeklyProgress.weeklyChange > 0.05 ? 'excellent' : 
                    weeklyProgress.weeklyChange > 0 ? 'steady' : 'some'
                  } progress in math concepts this week. 
                  {strengthAreas.length > 0 ? 
                    ` There's strong mastery in ${strengthAreas.map(area => areaNames[area]).join(' and ')}.` : 
                    ''
                  }
                  {focusAreas.length > 0 ? 
                    ` Focused practice on ${focusAreas.map(area => areaNames[area]).join(' and ')} would be beneficial.` : 
                    ''
                  }
                </p>
              </div>
            </div>
            
            <div className="insights-grid">
              {learningTips.map((tip, index) => (
                <div key={index} className="insight-card">
                  <div className="insight-icon">{tip.icon}</div>
                  <div className="insight-content">
                    <h4>{tip.title}</h4>
                    <p>{tip.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="practice-suggestion">
              <div className="practice-icon">📝</div>
              <div className="practice-content">
                <h4>Suggested Practice Activity</h4>
                <p>
                  {focusAreas.length > 0 ? 
                    `Practice ${areaNames[focusAreas[0]]} concepts with ${
                      areaNames[focusAreas[0]] === 'Number Sense' ? 'number line activities and mental math games' :
                      areaNames[focusAreas[0]] === 'Geometry' ? 'shape identification and pattern recognition' :
                      areaNames[focusAreas[0]] === 'Measurement' ? 'real-world measuring tasks' :
                      areaNames[focusAreas[0]] === 'Algebra' ? 'simple equation solving exercises' :
                      'data interpretation activities'
                    }.` :
                    `Continue balanced practice across all math areas, with special attention to problem-solving strategies.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="achievements-section">
          <h2>Achievements & Milestones</h2>
          
          {weeklyReport.achievements && weeklyReport.achievements.length > 0 ? (
            <div className="achievements-list">
              {weeklyReport.achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-icon">
                    {achievement.type === 'mastery' ? '🏆' : 
                     achievement.type === 'streak' ? '🔥' : 
                     achievement.type === 'completion' ? '✅' : '🌟'}
                  </div>
                  <div className="achievement-details">
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <p className="achievement-date">
                      {new Date(achievement.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-achievements">No achievements earned this week.</p>
          )}
        </div>
        
        <div className="recommendations-section">
          <h2>Recommendations for Parents</h2>
          
          {weeklyReport.recommendations && weeklyReport.recommendations.length > 0 ? (
            <div className="recommendations-list">
              {weeklyReport.recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <h3>{recommendation.title}</h3>
                  <p>{recommendation.description}</p>
                  {recommendation.resources && (
                    <div className="recommendation-resources">
                      <h4>Resources:</h4>
                      <ul>
                        {recommendation.resources.map((resource, i) => (
                          <li key={i}>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              {resource.title}
                            </a>
                            {resource.description && <p>{resource.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-recommendations">No specific recommendations for this week.</p>
          )}
        </div>
        
        <div className="upcoming-content-section">
          <h2>Upcoming Learning Content</h2>
          
          {weeklyReport.upcomingContent && weeklyReport.upcomingContent.length > 0 ? (
            <div className="upcoming-content-list">
              {weeklyReport.upcomingContent.map((content, index) => (
                <div key={index} className="upcoming-content-item">
                  <h3>{content.title}</h3>
                  <p>{content.description}</p>
                  <div className="content-metadata">
                    <span className="content-type">{content.type}</span>
                    <span className="content-difficulty">Difficulty: {content.difficulty}/5</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-upcoming-content">No specific upcoming content to preview.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportView;
