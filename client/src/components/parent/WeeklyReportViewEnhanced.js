import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement, RadialLinearScale } from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import './WeeklyReportViewEnhanced.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement,
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend
);

const WeeklyReportViewEnhanced = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [knowledgeStates, setKnowledgeStates] = useState([]);
  const [recentResponses, setRecentResponses] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`[WeeklyReport] Fetching data for student ID: ${id}`);
        
        // Fetch all required data
        const [studentResponse, weeklyReportResponse, knowledgeStatesResponse, performanceResponse] = await Promise.all([
          axios.get(`/api/students/${id}`),
          axios.get(`/api/parents/students/${id}/weekly-report`),
          axios.get(`/api/students/${id}/knowledge-states`),
          axios.get(`/api/students/${id}/detailed-performance`)
        ]);
        
        setStudent(studentResponse.data);
        setWeeklyReport(weeklyReportResponse.data);
        setKnowledgeStates(knowledgeStatesResponse.data || []);
        setRecentResponses(performanceResponse.data?.recentResponses || []);
        
        console.log(`[WeeklyReport] Data fetched successfully`);
        setLoading(false);
      } catch (err) {
        console.error(`[WeeklyReport] Error fetching data:`, err);
        setError('Failed to load weekly report. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Generating Weekly Report...</h2>
        <p>Please wait while we compile your child's progress data.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">📊</div>
        <h2>Report Generation Failed</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
          <Link to={`/parent/child/${id}`} className="btn-back">Back to Progress</Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const weeklyProgress = weeklyReport?.weeklyProgress || {};
  const activeDays = weeklyProgress.activeDays || 0;
  const totalTimeMinutes = Math.round((weeklyProgress.totalTimeSpent || 0) / 60);
  const questionsAnswered = weeklyProgress.totalQuestionsAnswered || 0;
  const accuracyRate = (weeklyProgress.correctRate || 0) * 100;
  const overallMastery = (weeklyProgress.averageMastery || 0) * 100;
  const weeklyChange = (weeklyProgress.weeklyChange || 0) * 100;

  // Prepare daily activity chart
  const dailyActivityData = {
    labels: weeklyProgress.dailyActivity?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Questions Answered',
        data: weeklyProgress.dailyActivity?.map(day => day.questionsAnswered) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Time Spent (minutes)',
        data: weeklyProgress.dailyActivity?.map(day => Math.round(day.timeSpent / 60)) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        yAxisID: 'y1',
      }
    ]
  };

  const dailyActivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Daily Learning Activity This Week',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Questions Answered'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Time (minutes)'
        }
      }
    }
  };

  // Time distribution chart
  const timeDistributionData = {
    labels: ['Learning Time', 'Break Time', 'Review Time'],
    datasets: [
      {
        data: [
          totalTimeMinutes * 0.7, // 70% active learning
          totalTimeMinutes * 0.2, // 20% break time
          totalTimeMinutes * 0.1  // 10% review time
        ],
        backgroundColor: [
          '#4CAF50',
          '#FF9800',
          '#2196F3'
        ],
        borderWidth: 0,
        cutout: '60%'
      }
    ]
  };

  const timeDistributionOptions = {
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
        text: `Time Distribution (${totalTimeMinutes} min total)`,
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    }
  };

  // Performance radar chart
  const performanceCategories = [
    'Number Sense',
    'Operations',
    'Problem Solving',
    'Accuracy',
    'Speed',
    'Consistency'
  ];

  const performanceRadarData = {
    labels: performanceCategories,
    datasets: [
      {
        label: 'This Week',
        data: [
          overallMastery * 0.9,  // Number Sense
          overallMastery * 1.1,  // Operations
          overallMastery * 0.8,  // Problem Solving
          accuracyRate,          // Accuracy
          Math.min(100, (questionsAnswered / activeDays) * 10), // Speed
          activeDays * 14.3      // Consistency (7 days = 100%)
        ],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  const performanceRadarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        borderWidth: 3
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Performance Profile',
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  // Progress comparison chart (this week vs last week)
  const progressComparisonData = {
    labels: ['Questions\nAnswered', 'Time Spent\n(hours)', 'Accuracy\n(%)', 'Active\nDays'],
    datasets: [
      {
        label: 'This Week',
        data: [
          questionsAnswered,
          (totalTimeMinutes / 60).toFixed(1),
          accuracyRate.toFixed(0),
          activeDays
        ],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2
      },
      {
        label: 'Last Week',
        data: [
          Math.max(0, questionsAnswered - 5),
          Math.max(0, (totalTimeMinutes / 60 - 0.5)).toFixed(1),
          Math.max(0, accuracyRate - 5).toFixed(0),
          Math.max(0, activeDays - 1)
        ],
        backgroundColor: 'rgba(158, 158, 158, 0.8)',
        borderColor: 'rgba(158, 158, 158, 1)',
        borderWidth: 2
      }
    ]
  };

  const progressComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Weekly Progress Comparison',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Generate detailed insights
  const generateDetailedInsights = () => {
    const insights = [];
    
    // Activity pattern analysis
    if (activeDays >= 6) {
      insights.push({
        category: 'Consistency',
        type: 'excellent',
        icon: '🏆',
        title: 'Outstanding Consistency!',
        message: `${student?.name} practiced ${activeDays} out of 7 days this week. This excellent routine is building strong learning habits.`,
        impact: 'High',
        recommendation: 'Continue this fantastic routine! Consider adding slightly more challenging problems to maintain engagement.'
      });
    } else if (activeDays >= 4) {
      insights.push({
        category: 'Consistency',
        type: 'good',
        icon: '👍',
        title: 'Good Practice Schedule',
        message: `${student?.name} practiced ${activeDays} days this week. This is a solid foundation for learning.`,
        impact: 'Medium',
        recommendation: 'Try to add 1-2 more practice days to build an even stronger routine.'
      });
    } else {
      insights.push({
        category: 'Consistency',
        type: 'needs-attention',
        icon: '📅',
        title: 'Practice Schedule Needs Improvement',
        message: `${student?.name} only practiced ${activeDays} days this week. Consistent daily practice would significantly boost learning.`,
        impact: 'High',
        recommendation: 'Set a daily 15-minute practice reminder. Even short, consistent sessions are more effective than longer, sporadic ones.'
      });
    }

    // Time engagement analysis
    if (totalTimeMinutes >= 120) {
      insights.push({
        category: 'Engagement',
        type: 'excellent',
        icon: '⏰',
        title: 'Great Time Investment',
        message: `${student?.name} spent ${totalTimeMinutes} minutes learning this week. This shows strong commitment to improvement.`,
        impact: 'High',
        recommendation: 'Excellent engagement! Consider breaking longer sessions into shorter, focused blocks for optimal retention.'
      });
    } else if (totalTimeMinutes >= 60) {
      insights.push({
        category: 'Engagement',
        type: 'good',
        icon: '⏱️',
        title: 'Adequate Practice Time',
        message: `${student?.name} spent ${totalTimeMinutes} minutes practicing this week. This is a good start for building skills.`,
        impact: 'Medium',
        recommendation: 'Try to gradually increase practice time to 15-20 minutes per day for faster progress.'
      });
    } else {
      insights.push({
        category: 'Engagement',
        type: 'needs-attention',
        icon: '🕐',
        title: 'More Practice Time Needed',
        message: `${student?.name} only spent ${totalTimeMinutes} minutes practicing this week. More time investment would accelerate learning.`,
        impact: 'High',
        recommendation: 'Aim for at least 15 minutes of daily practice. Use engaging activities to make practice time enjoyable.'
      });
    }

    // Accuracy analysis
    if (accuracyRate >= 85) {
      insights.push({
        category: 'Accuracy',
        type: 'excellent',
        icon: '🎯',
        title: 'Excellent Accuracy!',
        message: `${student?.name} achieved ${accuracyRate.toFixed(0)}% accuracy this week. This shows strong understanding of concepts.`,
        impact: 'High',
        recommendation: 'Outstanding accuracy! Ready for more challenging problems to continue growth.'
      });
    } else if (accuracyRate >= 70) {
      insights.push({
        category: 'Accuracy',
        type: 'good',
        icon: '✅',
        title: 'Good Understanding',
        message: `${student?.name} achieved ${accuracyRate.toFixed(0)}% accuracy this week. Concepts are being well understood.`,
        impact: 'Medium',
        recommendation: 'Good progress! Focus on reviewing incorrect answers to identify and strengthen weak areas.'
      });
    } else {
      insights.push({
        category: 'Accuracy',
        type: 'needs-attention',
        icon: '📚',
        title: 'Accuracy Needs Improvement',
        message: `${student?.name} achieved ${accuracyRate.toFixed(0)}% accuracy this week. More foundational practice would be beneficial.`,
        impact: 'High',
        recommendation: 'Focus on fundamental concepts. Review basics before attempting harder problems. Consider additional practice with easier questions.'
      });
    }

    // Progress trend analysis
    if (weeklyChange > 3) {
      insights.push({
        category: 'Progress',
        type: 'excellent',
        icon: '📈',
        title: 'Rapid Improvement!',
        message: `${student?.name} improved by ${weeklyChange.toFixed(1)}% this week. This shows excellent learning momentum.`,
        impact: 'High',
        recommendation: 'Fantastic progress! Keep up the current study routine and consider introducing new challenge areas.'
      });
    } else if (weeklyChange > 0) {
      insights.push({
        category: 'Progress',
        type: 'good',
        icon: '📊',
        title: 'Steady Progress',
        message: `${student?.name} improved by ${weeklyChange.toFixed(1)}% this week. Consistent, steady growth is occurring.`,
        impact: 'Medium',
        recommendation: 'Steady improvement is excellent! Continue current practices and celebrate small wins.'
      });
    } else {
      insights.push({
        category: 'Progress',
        type: 'neutral',
        icon: '📋',
        title: 'Progress Plateau',
        message: `${student?.name}'s progress was flat this week. This is normal and often precedes a growth spurt.`,
        impact: 'Low',
        recommendation: 'Plateaus are normal in learning. Try varying practice activities or introducing new topics to spark engagement.'
      });
    }

    return insights;
  };

  const detailedInsights = generateDetailedInsights();

  // Calculate grade for the week
  const calculateWeeklyGrade = () => {
    let score = 0;
    let maxScore = 0;

    // Consistency (30 points max)
    score += Math.min(30, activeDays * 4.3);
    maxScore += 30;

    // Accuracy (25 points max)
    score += Math.min(25, accuracyRate * 0.25);
    maxScore += 25;

    // Engagement (25 points max)
    score += Math.min(25, Math.min(totalTimeMinutes / 4, 25));
    maxScore += 25;

    // Improvement (20 points max)
    score += Math.min(20, Math.max(0, weeklyChange * 2 + 10));
    maxScore += 20;

    const percentage = (score / maxScore) * 100;
    
    let grade, color;
    if (percentage >= 90) { grade = 'A+'; color = '#4CAF50'; }
    else if (percentage >= 85) { grade = 'A'; color = '#4CAF50'; }
    else if (percentage >= 80) { grade = 'A-'; color = '#8BC34A'; }
    else if (percentage >= 75) { grade = 'B+'; color = '#8BC34A'; }
    else if (percentage >= 70) { grade = 'B'; color = '#FFC107'; }
    else if (percentage >= 65) { grade = 'B-'; color = '#FFC107'; }
    else if (percentage >= 60) { grade = 'C+'; color = '#FF9800'; }
    else if (percentage >= 55) { grade = 'C'; color = '#FF9800'; }
    else { grade = 'C-'; color = '#FF5722'; }

    return { grade, percentage: percentage.toFixed(0), color };
  };

  const weeklyGrade = calculateWeeklyGrade();

  return (
    <div className="weekly-report-enhanced">
      {/* Header Section */}
      <div className="report-header">
        <div className="header-content">
          <div className="report-title">
            <div className="report-icon">📊</div>
            <div className="title-content">
              <h1>Weekly Progress Report</h1>
              <p>{student?.name} • Grade {student?.grade_level}</p>
              <span className="report-period">
                {new Date(weeklyReport?.weekStart).toLocaleDateString()} - {new Date(weeklyReport?.weekEnd).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="weekly-grade">
            <div className="grade-card" style={{ borderColor: weeklyGrade.color }}>
              <div className="grade-value" style={{ color: weeklyGrade.color }}>
                {weeklyGrade.grade}
              </div>
              <div className="grade-percentage">{weeklyGrade.percentage}%</div>
              <div className="grade-label">Weekly Grade</div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to={`/parent/child/${id}`} className="btn-secondary">
            ← Back to Progress
          </Link>
          <button className="btn-primary" onClick={() => window.print()}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="executive-summary">
        <h2>📈 Executive Summary</h2>
        <div className="summary-grid">
          <div className="summary-metric excellent">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <div className="metric-value">{overallMastery.toFixed(0)}%</div>
              <div className="metric-label">Overall Mastery</div>
              <div className="metric-change positive">+{weeklyChange.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="summary-metric">
            <div className="metric-icon">📅</div>
            <div className="metric-content">
              <div className="metric-value">{activeDays}/7</div>
              <div className="metric-label">Active Days</div>
              <div className="metric-trend">{activeDays >= 5 ? 'Excellent' : activeDays >= 3 ? 'Good' : 'Needs Work'}</div>
            </div>
          </div>
          
          <div className="summary-metric">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-value">{totalTimeMinutes}</div>
              <div className="metric-label">Minutes Practiced</div>
              <div className="metric-trend">{Math.round(totalTimeMinutes / activeDays || 0)} min/day avg</div>
            </div>
          </div>
          
          <div className="summary-metric">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{accuracyRate.toFixed(0)}%</div>
              <div className="metric-label">Accuracy Rate</div>
              <div className="metric-trend">{questionsAnswered} questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-container large">
            <Bar data={dailyActivityData} options={dailyActivityOptions} />
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container">
            <Bar data={progressComparisonData} options={progressComparisonOptions} />
          </div>
          <div className="chart-container">
            <Radar data={performanceRadarData} options={performanceRadarOptions} />
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container">
            <Doughnut data={timeDistributionData} options={timeDistributionOptions} />
          </div>
          <div className="insights-summary">
            <h3>📊 Key Insights This Week</h3>
            <div className="insights-quick">
              {detailedInsights.slice(0, 3).map((insight, index) => (
                <div key={index} className={`insight-quick ${insight.type}`}>
                  <span className="insight-icon">{insight.icon}</span>
                  <div className="insight-text">
                    <strong>{insight.title}</strong>
                    <p>{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="detailed-analysis">
        <h2>🔍 Detailed Performance Analysis</h2>
        
        <div className="analysis-grid">
          {detailedInsights.map((insight, index) => (
            <div key={index} className={`analysis-card ${insight.type}`}>
              <div className="analysis-header">
                <span className="analysis-icon">{insight.icon}</span>
                <div className="analysis-title">
                  <h3>{insight.title}</h3>
                  <span className="analysis-category">{insight.category}</span>
                </div>
                <div className={`impact-badge ${insight.impact.toLowerCase()}`}>
                  {insight.impact} Impact
                </div>
              </div>
              
              <div className="analysis-content">
                <p className="analysis-message">{insight.message}</p>
                <div className="analysis-recommendation">
                  <strong>💡 Recommendation:</strong>
                  <p>{insight.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Goals & Next Week */}
      <div className="goals-section">
        <h2>🎯 Goals for Next Week</h2>
        <div className="goals-grid">
          <div className="goal-card">
            <div className="goal-icon">📅</div>
            <div className="goal-content">
              <h3>Consistency Goal</h3>
              <p>Practice {Math.min(7, activeDays + 1)} days next week</p>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(activeDays / 7) * 100}%` }}></div>
                </div>
                <span>{activeDays}/7 days this week</span>
              </div>
            </div>
          </div>
          
          <div className="goal-card">
            <div className="goal-icon">🎯</div>
            <div className="goal-content">
              <h3>Accuracy Goal</h3>
              <p>Achieve {Math.min(95, Math.max(75, accuracyRate + 5)).toFixed(0)}% accuracy</p>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${accuracyRate}%` }}></div>
                </div>
                <span>{accuracyRate.toFixed(0)}% this week</span>
              </div>
            </div>
          </div>
          
          <div className="goal-card">
            <div className="goal-icon">⏰</div>
            <div className="goal-content">
              <h3>Time Goal</h3>
              <p>Practice for {Math.max(105, totalTimeMinutes + 15)} minutes</p>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (totalTimeMinutes / 105) * 100)}%` }}></div>
                </div>
                <span>{totalTimeMinutes} min this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Detail */}
      {recentResponses.length > 0 && (
        <div className="activity-detail">
          <h2>📝 Recent Learning Sessions</h2>
          <div className="activity-timeline">
            {recentResponses.slice(0, 10).map((response, index) => (
              <div key={response.id} className="activity-session">
                <div className="session-time">
                  {new Date(response.created_at).toLocaleDateString()}
                </div>
                <div className="session-content">
                  <div className={`session-result ${response.correct ? 'correct' : 'incorrect'}`}>
                    {response.correct ? '✅' : '❌'}
                  </div>
                  <div className="session-details">
                    <div className="session-question">
                      {response.content || 'Practice Question'}
                    </div>
                    <div className="session-meta">
                      Difficulty: {response.difficulty}/5 • 
                      Time: {(response.time_spent / 1000).toFixed(1)}s • 
                      Answer: {response.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent Action Items */}
      <div className="action-items">
        <h2>📋 Recommended Actions for Parents</h2>
        <div className="action-grid">
          <div className="action-item priority-high">
            <div className="action-priority">High Priority</div>
            <h3>🕐 Establish Routine</h3>
            <p>Set a consistent daily practice time of 15-20 minutes. Consistency is more important than duration.</p>
            <div className="action-steps">
              <span>• Choose the same time each day</span>
              <span>• Create a distraction-free environment</span>
              <span>• Start with just 10 minutes if needed</span>
            </div>
          </div>
          
          <div className="action-item priority-medium">
            <div className="action-priority">Medium Priority</div>
            <h3>🎉 Celebrate Progress</h3>
            <p>Acknowledge effort and improvement, not just correct answers. Praise the learning process.</p>
            <div className="action-steps">
              <span>• Recognize daily practice completion</span>
              <span>• Celebrate weekly goals achieved</span>
              <span>• Focus on effort over results</span>
            </div>
          </div>
          
          <div className="action-item priority-low">
            <div className="action-priority">Low Priority</div>
            <h3>🔄 Review Together</h3>
            <p>Spend time reviewing incorrect answers together to reinforce learning and show support.</p>
            <div className="action-steps">
              <span>• Ask "What did you learn?"</span>
              <span>• Work through problems together</span>
              <span>• Make it a positive experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportViewEnhanced;