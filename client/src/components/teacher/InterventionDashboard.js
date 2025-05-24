import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './InterventionDashboard.css';

const InterventionDashboard = ({ students, onAssignPractice, onScheduleSession, onSendMessage }) => {
  const [interventionData, setInterventionData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    analyzeStudentPerformance();
  }, [students]);

  const analyzeStudentPerformance = () => {
    const analyzed = students.map(student => {
      const perf = student.performance || {};
      const avgMastery = perf.averageMastery || 0;
      const recentActivity = perf.recentActivity || [];
      const strugglingKCs = perf.strugglingKCs || [];
      
      // Calculate intervention score
      let interventionScore = 0;
      let reasons = [];
      let recommendations = [];

      // Low mastery
      if (avgMastery < 0.6) {
        interventionScore += 40;
        reasons.push('Low overall mastery');
        recommendations.push({
          type: 'practice',
          description: 'Assign foundational practice exercises',
          kcIds: strugglingKCs.slice(0, 3).map(kc => kc.id)
        });
      }

      // No recent activity
      const daysSinceActive = perf.daysSinceLastActivity || 0;
      if (daysSinceActive > 7) {
        interventionScore += 20;
        reasons.push(`Inactive for ${daysSinceActive} days`);
        recommendations.push({
          type: 'message',
          description: 'Send encouragement message'
        });
      }

      // Struggling with specific topics
      if (strugglingKCs.length > 3) {
        interventionScore += 30;
        reasons.push(`Struggling with ${strugglingKCs.length} topics`);
        recommendations.push({
          type: 'session',
          description: 'Schedule 1:1 tutoring session'
        });
      }

      // Recent failures
      const recentFailures = recentActivity.filter(a => !a.is_correct).length;
      if (recentFailures > 5) {
        interventionScore += 10;
        reasons.push('Multiple recent incorrect answers');
        recommendations.push({
          type: 'review',
          description: 'Review learning approach'
        });
      }

      // Determine priority
      let priority = 'low';
      if (interventionScore >= 70) priority = 'high';
      else if (interventionScore >= 40) priority = 'medium';

      return {
        student,
        interventionScore,
        priority,
        reasons,
        recommendations,
        avgMastery,
        daysSinceActive,
        strugglingKCs
      };
    });

    setInterventionData(analyzed);
  };

  const filteredData = interventionData.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'high') return item.priority === 'high';
    if (filter === 'medium') return item.priority === 'medium';
    if (filter === 'low') return item.priority === 'low';
    if (filter === 'inactive') return item.daysSinceActive > 7;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'mastery') {
      return a.avgMastery - b.avgMastery;
    }
    if (sortBy === 'activity') {
      return b.daysSinceActive - a.daysSinceActive;
    }
    if (sortBy === 'name') {
      return a.student.name.localeCompare(b.student.name);
    }
    return 0;
  });

  const handleInterventionClick = (item) => {
    setSelectedStudent(item);
    setShowInterventionModal(true);
  };

  const handleQuickAction = async (action, student, recommendation) => {
    switch (action) {
      case 'practice':
        onAssignPractice(student, recommendation.kcIds);
        break;
      case 'session':
        onScheduleSession(student);
        break;
      case 'message':
        onSendMessage(student, 'encouragement');
        break;
      default:
        break;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 0.8) return '#27ae60';
    if (mastery >= 0.6) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="intervention-dashboard">
      <div className="intervention-header">
        <h2>Student Intervention Dashboard</h2>
        <div className="intervention-controls">
          <div className="filter-group">
            <label>Filter by:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Students</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
              <option value="inactive">Inactive Students</option>
            </select>
          </div>
          <div className="sort-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="mastery">Mastery Level</option>
              <option value="activity">Last Activity</option>
              <option value="name">Student Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="intervention-summary">
        <div className="summary-card high">
          <h3>{interventionData.filter(d => d.priority === 'high').length}</h3>
          <p>High Priority</p>
        </div>
        <div className="summary-card medium">
          <h3>{interventionData.filter(d => d.priority === 'medium').length}</h3>
          <p>Medium Priority</p>
        </div>
        <div className="summary-card low">
          <h3>{interventionData.filter(d => d.priority === 'low').length}</h3>
          <p>Low Priority</p>
        </div>
        <div className="summary-card inactive">
          <h3>{interventionData.filter(d => d.daysSinceActive > 7).length}</h3>
          <p>Inactive</p>
        </div>
      </div>

      <div className="intervention-grid">
        {sortedData.map((item, index) => (
          <div 
            key={index} 
            className={`intervention-card priority-${item.priority}`}
            onClick={() => handleInterventionClick(item)}
          >
            <div className="card-header">
              <h3>{item.student.name}</h3>
              <span 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(item.priority) }}
              >
                {item.priority.toUpperCase()}
              </span>
            </div>

            <div className="card-stats">
              <div className="stat">
                <span className="stat-label">Mastery</span>
                <span 
                  className="stat-value"
                  style={{ color: getMasteryColor(item.avgMastery) }}
                >
                  {(item.avgMastery * 100).toFixed(0)}%
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Last Active</span>
                <span className="stat-value">
                  {item.daysSinceActive === 0 ? 'Today' : 
                   item.daysSinceActive === 1 ? 'Yesterday' :
                   `${item.daysSinceActive} days ago`}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Struggling Topics</span>
                <span className="stat-value">{item.strugglingKCs.length}</span>
              </div>
            </div>

            <div className="card-reasons">
              <h4>Intervention Reasons:</h4>
              <ul>
                {item.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="card-actions">
              <h4>Quick Actions:</h4>
              <div className="action-buttons">
                {item.recommendations.slice(0, 3).map((rec, idx) => (
                  <button
                    key={idx}
                    className={`action-btn ${rec.type}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(rec.type, item.student, rec);
                    }}
                    title={rec.description}
                  >
                    {rec.type === 'practice' && '📝'}
                    {rec.type === 'session' && '👤'}
                    {rec.type === 'message' && '💬'}
                    {rec.type === 'review' && '📊'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showInterventionModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowInterventionModal(false)}>
          <div className="modal-content intervention-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Intervention Plan: {selectedStudent.student.name}</h2>
              <button 
                className="close-button" 
                onClick={() => setShowInterventionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="intervention-detail-content">
              <div className="detail-section">
                <h3>Student Overview</h3>
                <div className="overview-stats">
                  <div className="stat-item">
                    <label>Overall Mastery:</label>
                    <span style={{ color: getMasteryColor(selectedStudent.avgMastery) }}>
                      {(selectedStudent.avgMastery * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="stat-item">
                    <label>Intervention Score:</label>
                    <span>{selectedStudent.interventionScore}/100</span>
                  </div>
                  <div className="stat-item">
                    <label>Priority Level:</label>
                    <span style={{ color: getPriorityColor(selectedStudent.priority) }}>
                      {selectedStudent.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Struggling Topics</h3>
                <div className="struggling-topics">
                  {selectedStudent.strugglingKCs.map((kc, idx) => (
                    <div key={idx} className="topic-item">
                      <span className="topic-name">{kc.name}</span>
                      <span className="topic-mastery">
                        {(kc.mastery * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Recommended Actions</h3>
                <div className="recommendations">
                  {selectedStudent.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <h4>{rec.description}</h4>
                      <button
                        className="action-button primary"
                        onClick={() => {
                          handleQuickAction(rec.type, selectedStudent.student, rec);
                          setShowInterventionModal(false);
                        }}
                      >
                        Take Action
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionDashboard;