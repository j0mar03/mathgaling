import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import './ClassroomViewEnhanced.css';
import LinkParentToStudentModal from './LinkParentToStudentModal';
import OverviewPerformanceModal from './OverviewPerformanceModal';
import DetailedPerformanceModal from './DetailedPerformanceModal';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const ClassroomViewEnhanced = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddStudentInput, setShowAddStudentInput] = useState(false);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [linkingStudent, setLinkingStudent] = useState(null);
  const [showLinkParentModal, setShowLinkParentModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [viewMode, setViewMode] = useState('overview');
  const { user } = useAuth();
  const teacherId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!teacherId) {
        setError("Could not identify teacher. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        console.log('[ClassroomViewEnhanced] Starting to fetch data for classroom:', id);
        
        const classroomResponse = await axios.get(`/api/classrooms/${id}`);
        setClassroom(classroomResponse.data);
        
        const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
        setStudents(studentsResponse.data);
        
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        console.log('[ClassroomViewEnhanced] Performance data received:', performanceResponse.data);
        setPerformance(performanceResponse.data);
        
        const kcResponse = await axios.get(`/api/classrooms/${id}/knowledge-components`);
        setKnowledgeComponents(kcResponse.data);
        
        console.log('[ClassroomViewEnhanced] All data loaded successfully!');
        setLoading(false);
      } catch (err) {
        console.error('Detailed error fetching classroom data:', err.response || err.request || err.message || err);
        setError('Failed to load classroom data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, teacherId]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!id || loading) return;
    
    const interval = setInterval(async () => {
      try {
        const kcResponse = await axios.get(`/api/classrooms/${id}/knowledge-components`);
        setKnowledgeComponents(kcResponse.data);
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        setPerformance(performanceResponse.data);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [id, loading]);

  // Enhanced student analytics
  const analyzeClassroomPerformance = () => {
    if (!performance.length) return null;

    const totalStudents = performance.length;
    const studentsNeedingHelp = performance.filter(s => s.intervention && s.intervention.needed);
    const highPerformers = performance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.8;
    });
    const strugglingStudents = performance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery < 0.4;
    });

    const avgMastery = performance.reduce((sum, s) => 
      sum + (s.performance?.mathMastery || s.performance?.averageMastery || 0), 0) / totalStudents;

    const recentlyActive = performance.filter(s => {
      if (!s.performance?.lastActive) return false;
      const lastActive = new Date(s.performance.lastActive);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return lastActive > threeDaysAgo;
    });

    return {
      totalStudents,
      studentsNeedingHelp: studentsNeedingHelp.length,
      highPerformers: highPerformers.length,
      strugglingStudents: strugglingStudents.length,
      avgMastery: avgMastery * 100,
      engagementRate: (recentlyActive.length / totalStudents) * 100,
      criticalIssues: studentsNeedingHelp.filter(s => s.intervention.priority === 'High').length
    };
  };

  // Identify urgent interventions
  const getUrgentInterventions = () => {
    return performance
      .filter(s => s.intervention && s.intervention.needed)
      .map(student => {
        const mastery = student.performance?.mathMastery || student.performance?.averageMastery || 0;
        const lastActive = student.performance?.lastActive ? new Date(student.performance.lastActive) : null;
        const daysSinceActive = lastActive ? Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24)) : 999;
        
        let urgencyScore = 0;
        let urgencyReasons = [];
        
        // Scoring system for urgency
        if (mastery < 0.2) {
          urgencyScore += 20;
          urgencyReasons.push('Critical mastery level (< 20%)');
        } else if (mastery < 0.3) {
          urgencyScore += 15;
          urgencyReasons.push('Very low mastery level (< 30%)');
        }
        
        if (daysSinceActive >= 999) {
          urgencyScore += 5;
          urgencyReasons.push('Student has not started any quizzes yet');
        } else if (daysSinceActive > 7) {
          urgencyScore += 15;
          urgencyReasons.push(`Inactive for ${daysSinceActive} days`);
        } else if (daysSinceActive > 3) {
          urgencyScore += 10;
          urgencyReasons.push(`Inactive for ${daysSinceActive} days`);
        }

        if (student.intervention.priority === 'High') {
          urgencyScore += 10;
          urgencyReasons.push('High priority intervention needed');
        }

        return {
          ...student,
          urgencyScore,
          urgencyReasons,
          daysSinceActive,
          mastery: mastery * 100
        };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5); // Top 5 most urgent
  };

  // Generate classroom insights
  const generateClassroomInsights = () => {
    const analytics = analyzeClassroomPerformance();
    if (!analytics) return [];

    const insights = [];
    
    if (analytics.criticalIssues > 0) {
      insights.push({
        type: 'critical',
        icon: '🚨',
        title: 'Critical Interventions Needed',
        description: `${analytics.criticalIssues} student${analytics.criticalIssues !== 1 ? 's need' : ' needs'} immediate attention with high-priority interventions.`,
        action: 'Review intervention section below'
      });
    }

    if (analytics.strugglingStudents > analytics.totalStudents * 0.3) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Number of Struggling Students',
        description: `${analytics.strugglingStudents} students (${((analytics.strugglingStudents / analytics.totalStudents) * 100).toFixed(0)}%) have mastery below 40%.`,
        action: 'Consider classroom-wide review sessions'
      });
    }

    if (analytics.engagementRate < 50) {
      insights.push({
        type: 'warning',
        icon: '📉',
        title: 'Low Student Engagement',
        description: `Only ${analytics.engagementRate.toFixed(0)}% of students have been active in the last 3 days.`,
        action: 'Check in with inactive students'
      });
    }

    if (analytics.highPerformers > analytics.totalStudents * 0.4) {
      insights.push({
        type: 'success',
        icon: '🌟',
        title: 'Strong Class Performance',
        description: `${analytics.highPerformers} students (${((analytics.highPerformers / analytics.totalStudents) * 100).toFixed(0)}%) are performing at high mastery levels.`,
        action: 'Consider advanced challenges for high performers'
      });
    }

    if (analytics.avgMastery > 70) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Excellent Average Mastery',
        description: `Class average mastery is ${analytics.avgMastery.toFixed(0)}%, above the 70% target.`,
        action: 'Continue current teaching strategies'
      });
    }

    return insights;
  };

  // Chart data for performance distribution
  const getPerformanceDistributionData = () => {
    if (!performance.length) return null;

    const ranges = {
      'Excellent (80-100%)': 0,
      'Good (60-79%)': 0,
      'Fair (40-59%)': 0,
      'Needs Help (20-39%)': 0,
      'Critical (0-19%)': 0
    };

    performance.forEach(student => {
      const mastery = (student.performance?.mathMastery || student.performance?.averageMastery || 0) * 100;
      if (mastery >= 80) ranges['Excellent (80-100%)']++;
      else if (mastery >= 60) ranges['Good (60-79%)']++;
      else if (mastery >= 40) ranges['Fair (40-59%)']++;
      else if (mastery >= 20) ranges['Needs Help (20-39%)']++;
      else ranges['Critical (0-19%)']++;
    });

    return {
      labels: Object.keys(ranges),
      datasets: [{
        data: Object.values(ranges),
        backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  // Knowledge component priority analysis
  const getKCPriorityAnalysis = () => {
    if (!knowledgeComponents.length) return [];

    return knowledgeComponents
      .map(kc => {
        const avgMastery = (kc.averageMastery || 0) * 100;
        const studentsNeedingHelp = kc.masteryLevels ? 
          (kc.masteryLevels.veryLow + kc.masteryLevels.low) : 0;
        const totalStudents = kc.totalStudents || 0;
        const helpPercentage = totalStudents > 0 ? (studentsNeedingHelp / totalStudents) * 100 : 0;

        let priority = 'Low';
        let priorityScore = 0;

        if (avgMastery < 40) {
          priority = 'High';
          priorityScore = 3;
        } else if (avgMastery < 60 || helpPercentage > 50) {
          priority = 'Medium';
          priorityScore = 2;
        } else {
          priority = 'Low';
          priorityScore = 1;
        }

        return {
          ...kc,
          avgMastery,
          studentsNeedingHelp,
          helpPercentage,
          priority,
          priorityScore
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  };

  const handleRemoveStudent = async (studentIdToRemove, studentName) => {
    if (isProcessing) return;

    if (window.confirm(`Are you sure you want to remove ${studentName} from this classroom?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        await axios.delete(`/api/classrooms/${id}/students/${studentIdToRemove}`);
        const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
        setStudents(studentsResponse.data);
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        setPerformance(performanceResponse.data);
      } catch (err) {
        console.error('Error removing student:', err);
        setError(err.response?.data?.error || 'Failed to remove student.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleLinkParent = (student) => {
    setLinkingStudent(student);
    setShowLinkParentModal(true);
  };

  const handleCloseLinkParentModal = () => {
    setLinkingStudent(null);
    setShowLinkParentModal(false);
  };

  const handleAddStudentClick = async () => {
    if (showAddStudentInput) {
      setShowAddStudentInput(false);
      setSelectedStudents([]);
      setError(null);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/teachers/eligible-students');
      setEligibleStudents(response.data);
      setShowAddStudentInput(true);
    } catch (err) {
      console.error('Error fetching eligible students:', err);
      setError('Failed to fetch eligible students. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStudentCheckboxChange = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAddStudentConfirm = async () => {
    if (isProcessing || selectedStudents.length === 0) return;

    setIsProcessing(true);
    setError(null);
    try {
      await axios.post(`/api/classrooms/${id}/students`, {
        studentIds: selectedStudents
      });

      const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
      setStudents(studentsResponse.data);
      const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
      setPerformance(performanceResponse.data);

      setShowAddStudentInput(false);
      setSelectedStudents([]);
    } catch (err) {
      console.error('Error adding students:', err);
      setError(err.response?.data?.error || 'Failed to add students. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="classroom-enhanced-loading">
        <div className="loading-spinner"></div>
        <h2>Analyzing Classroom Data...</h2>
        <p>Please wait while we gather comprehensive performance analytics.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="classroom-enhanced-error">
        <div className="error-icon">⚠️</div>
        <h2>Unable to Load Classroom</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="classroom-enhanced-error">
        <div className="error-icon">📚</div>
        <h2>Classroom Not Found</h2>
        <p>Unable to load classroom data.</p>
        <Link to="/teacher" className="back-button">Back to Dashboard</Link>
      </div>
    );
  }

  const analytics = analyzeClassroomPerformance();
  const urgentInterventions = getUrgentInterventions();
  const insights = generateClassroomInsights();
  const performanceDistribution = getPerformanceDistributionData();
  const kcPriorityAnalysis = getKCPriorityAnalysis();
  const sortedStudents = [...performance].sort((a, b) => {
    if (a.intervention && b.intervention) {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1, undefined: 0 };
      const priorityDiff = priorityOrder[a.intervention.priority] - priorityOrder[b.intervention.priority];
      if (priorityDiff !== 0) return -priorityDiff;
    } else if (a.intervention && a.intervention.needed) {
      return -1;
    } else if (b.intervention && b.intervention.needed) {
      return 1;
    }
    return a.student.name.localeCompare(b.student.name);
  });

  return (
    <div className="classroom-enhanced">
      {/* Parent-Student Linking Modal */}
      {showLinkParentModal && linkingStudent && (
        <LinkParentToStudentModal
          student={linkingStudent}
          classroomId={id}
          onClose={handleCloseLinkParentModal}
          onLinked={handleCloseLinkParentModal}
        />
      )}

      {/* Overview Performance Modal */}
      <OverviewPerformanceModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        classroomData={classroom}
        performance={performance}
        knowledgeComponents={knowledgeComponents}
      />

      {/* Detailed Performance Modal */}
      <DetailedPerformanceModal
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        classroomData={classroom}
        performance={performance}
        knowledgeComponents={knowledgeComponents}
      />

      {/* Enhanced Header */}
      <div className="classroom-enhanced-header">
        <div className="header-content">
          <div className="classroom-title">
            <h1>{classroom?.name || 'Classroom'}</h1>
            <div className="classroom-subtitle">
              <span>Teacher Dashboard</span>
              <div className="live-indicator">
                <span className="indicator-dot"></span>
                <span>Live Data</span>
              </div>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-card students">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{analytics?.totalStudents || 0}</div>
                <div className="stat-label">Students</div>
              </div>
            </div>
            <div className="stat-card mastery">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{analytics ? analytics.avgMastery.toFixed(0) : 0}%</div>
                <div className="stat-label">Avg. Mastery</div>
              </div>
            </div>
            <div className="stat-card interventions">
              <div className="stat-icon">🚨</div>
              <div className="stat-info">
                <div className="stat-value">{analytics?.studentsNeedingHelp || 0}</div>
                <div className="stat-label">Need Help</div>
              </div>
            </div>
            <div className="stat-card engagement">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <div className="stat-value">{analytics ? analytics.engagementRate.toFixed(0) : 0}%</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-controls">
            <button 
              className="view-toggle overview-btn"
              onClick={() => setShowOverviewModal(true)}
            >
              📊 Overview
            </button>
            <button 
              className="view-toggle detailed-btn"
              onClick={() => setShowDetailedModal(true)}
            >
              📋 Detailed
            </button>
          </div>
          <Link to="/teacher" className="back-button">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {urgentInterventions.length > 0 && (
        <div className="urgent-alerts-section">
          <div className="section-header critical">
            <h2>🚨 Urgent Student Interventions</h2>
            <div className="alert-count">{urgentInterventions.length} students need immediate attention</div>
          </div>
          <div className="urgent-interventions-grid">
            {urgentInterventions.map(student => (
              <div key={student.student.id} className="urgent-intervention-card">
                <div className="student-info">
                  <h3>{student.student.name}</h3>
                  <div className="urgency-score">
                    Urgency Score: <span className="score">{student.urgencyScore}</span>
                  </div>
                </div>
                <div className="urgency-details">
                  <div className="mastery-display">
                    <span className="mastery-label">Mastery:</span>
                    <span className={`mastery-value ${student.mastery < 30 ? 'critical' : 'warning'}`}>
                      {student.mastery.toFixed(0)}%
                    </span>
                  </div>
                  <div className="urgency-reasons">
                    {student.urgencyReasons.map((reason, index) => (
                      <div key={index} className="urgency-reason">⚠️ {reason}</div>
                    ))}
                  </div>
                </div>
                <div className="intervention-actions">
                  <Link to={`/teacher/student/${student.student.id}`} className="action-button primary">
                    View Student
                  </Link>
                  <button 
                    className="action-button secondary"
                    onClick={() => handleLinkParent(student.student)}
                  >
                    Contact Parent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classroom Insights */}
      {insights.length > 0 && (
        <div className="insights-section">
          <div className="section-header">
            <h2>🧠 Classroom Insights & Recommendations</h2>
          </div>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">{insight.icon}</div>
                <div className="insight-content">
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                  <div className="insight-action">
                    <strong>Recommended Action:</strong> {insight.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Management Section */}
      <div className="student-management-section">
        <div className="section-header">
          <h2>👥 Student Management</h2>
          <div className="management-controls">
            {!showAddStudentInput ? (
              <button className="add-student-btn" onClick={handleAddStudentClick} disabled={isProcessing}>
                {isProcessing ? 'Loading...' : '+ Add Student'}
              </button>
            ) : (
              <div className="add-student-modal">
                <div className="modal-header">
                  <h3>Select Students to Add</h3>
                  <button className="close-btn" onClick={handleAddStudentClick}>×</button>
                </div>
                
                {eligibleStudents.length === 0 ? (
                  <p>No eligible students found.</p>
                ) : (
                  <div className="student-selection">
                    <div className="students-list">
                      {eligibleStudents.map(student => (
                        <div key={student.id} className="student-checkbox-item">
                          <input
                            type="checkbox"
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentCheckboxChange(student.id)}
                            disabled={isProcessing}
                          />
                          <label htmlFor={`student-${student.id}`}>
                            <span className="student-name">{student.name}</span>
                            <span className="student-grade">Grade {student.grade_level}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="modal-actions">
                      <div className="selection-count">
                        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="action-buttons">
                        <button
                          onClick={handleAddStudentConfirm}
                          disabled={isProcessing || selectedStudents.length === 0}
                          className="confirm-btn"
                        >
                          {isProcessing ? 'Adding...' : 'Add Selected Students'}
                        </button>
                        <button onClick={handleAddStudentClick} className="cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Student Table */}
        <div className="enhanced-student-table">
          <div className="table-header">
            <div className="col-student">Student</div>
            <div className="col-mastery">Mastery Level</div>
            <div className="col-activity">Last Activity</div>
            <div className="col-intervention">Intervention Status</div>
            <div className="col-actions">Actions</div>
          </div>
          
          <div className="table-body">
            {sortedStudents.map(student => {
              const mastery = student.performance?.mathMastery || student.performance?.averageMastery || 0;
              const masteryPercent = mastery * 100;
              const lastActive = student.performance?.lastActive ? 
                new Date(student.performance.lastActive) : null;
              const daysSinceActive = lastActive ? 
                Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24)) : 999;

              // Debug logging for each student
              console.log(`[ClassroomViewEnhanced] Student ${student.student?.name} activity data:`, {
                lastActive: student.performance?.lastActive,
                lastActiveDate: lastActive,
                daysSinceActive: daysSinceActive,
                masteryLevel: masteryPercent,
                questionsAnswered: student.performance?.questionsAnswered || student.performance?.completedItems || 0,
                fullPerformanceData: student.performance
              });

              return (
                <div 
                  key={student.student.id} 
                  className={`student-row ${student.intervention && student.intervention.needed ? 'needs-intervention' : ''}`}
                >
                  <div className="col-student">
                    <div className="student-info">
                      <div className="student-name">{student.student.name}</div>
                      <div className="student-details">Grade {student.student.grade_level}</div>
                      {daysSinceActive > 7 && daysSinceActive < 999 && (
                        <div className="inactive-warning">⚠️ Inactive {daysSinceActive} days</div>
                      )}
                      {daysSinceActive >= 999 && (
                        <div className="no-activity-warning">📚 Ready to start learning</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-mastery">
                    <div className="mastery-display-enhanced">
                      <div className={`mastery-value ${masteryPercent < 30 ? 'critical' : masteryPercent < 60 ? 'warning' : 'good'}`}>
                        {masteryPercent.toFixed(0)}%
                      </div>
                      <div className="mastery-bar">
                        <div 
                          className="mastery-fill" 
                          style={{ width: `${masteryPercent}%` }}
                        ></div>
                      </div>
                      <div className="mastery-label">
                        {masteryPercent >= 80 ? 'Excellent' : 
                         masteryPercent >= 60 ? 'Good' : 
                         masteryPercent >= 40 ? 'Fair' : 
                         masteryPercent >= 20 ? 'Needs Help' : 'Critical'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-activity">
                    <div className="activity-info">
                      <div className="activity-date">
                        {lastActive ? lastActive.toLocaleDateString() : 'No Quiz Activity'}
                        {/* Debug display for development */}
                        {process.env.NODE_ENV === 'development' && (
                          <div style={{fontSize: '10px', color: '#666'}}>
                            Raw: {student.performance?.lastActive || 'null'} | Questions: {student.performance?.questionsAnswered || student.performance?.completedItems || 0}
                          </div>
                        )}
                      </div>
                      {daysSinceActive < 999 ? (
                        <div className={`activity-status ${daysSinceActive <= 1 ? 'recent' : daysSinceActive <= 3 ? 'moderate' : 'old'}`}>
                          {daysSinceActive === 0 ? 'Today' : 
                           daysSinceActive === 1 ? 'Yesterday' : 
                           `${daysSinceActive} days ago`}
                        </div>
                      ) : (
                        <div className="activity-status never">
                          {(student.performance?.questionsAnswered || student.performance?.completedItems || 0) > 0 
                            ? 'Has attempted questions' 
                            : 'Not started yet'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-intervention">
                    {student.intervention && student.intervention.needed ? (
                      <div className={`intervention-status ${student.intervention.priority.toLowerCase()}`}>
                        <div className="intervention-priority">
                          {student.intervention.priority} Priority
                        </div>
                        <div className="intervention-reason">
                          {student.intervention.reason || 'Performance tracking needed'}
                        </div>
                      </div>
                    ) : (
                      <div className="no-intervention">✅ On Track</div>
                    )}
                  </div>
                  
                  <div className="col-actions">
                    <div className="action-buttons-enhanced">
                      <Link to={`/teacher/student/${student.student.id}`} className="action-btn view" title="View Details">
                        👁️
                      </Link>
                      <button
                        className="action-btn parent"
                        onClick={() => handleLinkParent(student.student)}
                        title="Link Parent"
                      >
                        👪
                      </button>
                      <button
                        className="action-btn remove"
                        onClick={() => handleRemoveStudent(student.student.id, student.student.name)}
                        disabled={isProcessing}
                        title="Remove Student"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Analytics Dashboard */}
      <div className="analytics-dashboard">
        <div className="section-header">
          <h2>📊 Performance Analytics Dashboard</h2>
          <div className="chart-info">Comprehensive overview of classroom performance metrics</div>
        </div>
        <div className="analytics-grid">
          {/* Performance Distribution Chart */}
          <div className="analytics-card chart-card">
            <div className="card-header">
              <h3>📊 Performance Distribution</h3>
              <div className="chart-info">Student mastery levels across the classroom</div>
            </div>
            <div className="chart-container">
              {performanceDistribution && (
                <Doughnut 
                  data={performanceDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 15,
                          usePointStyle: true
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Knowledge Component Priority */}
          <div className="analytics-card priority-card">
            <div className="card-header">
              <h3>🎯 Knowledge Component Priorities</h3>
              <div className="chart-info">Focus areas requiring teacher attention</div>
            </div>
            <div className="priority-list">
              {kcPriorityAnalysis.slice(0, 5).map(kc => (
                <div key={kc.id} className={`priority-item ${kc.priority.toLowerCase()}`}>
                  <div className="priority-header">
                    <span className="kc-code">{kc.curriculum_code}</span>
                    <span className={`priority-badge ${kc.priority.toLowerCase()}`}>
                      {kc.priority} Priority
                    </span>
                  </div>
                  <div className="kc-name">{kc.name}</div>
                  <div className="priority-stats">
                    <div className="stat">
                      <span className="stat-label">Avg. Mastery:</span>
                      <span className="stat-value">{kc.avgMastery.toFixed(0)}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Students Needing Help:</span>
                      <span className="stat-value">{kc.studentsNeedingHelp}</span>
                    </div>
                  </div>
                  <Link to={`/teacher/knowledge-components/${kc.id}`} className="view-details-btn">
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Components Analysis */}
      <div className="kc-analysis-section">
        <div className="section-header">
          <h2>📚 Knowledge Components Analysis</h2>
          <div className="auto-refresh-indicator">
            <span className="refresh-dot"></span>
            <span>Auto-updating every 30s</span>
          </div>
        </div>
        
        <div className="kc-analysis-grid">
          {kcPriorityAnalysis.map(kc => (
            <div key={kc.id} className={`kc-analysis-card priority-${kc.priority.toLowerCase()}`}>
              <div className="kc-header">
                <div className="kc-title">
                  <div className="kc-code">{kc.curriculum_code}</div>
                  <div className="kc-name">{kc.name}</div>
                </div>
                <div className={`priority-indicator ${kc.priority.toLowerCase()}`}>
                  {kc.priority}
                </div>
              </div>
              
              <div className="kc-metrics">
                <div className="metric">
                  <div className="metric-label">Average Mastery</div>
                  <div className={`metric-value ${kc.avgMastery < 40 ? 'critical' : kc.avgMastery < 60 ? 'warning' : 'good'}`}>
                    {kc.avgMastery.toFixed(0)}%
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">Students Needing Help</div>
                  <div className="metric-value">
                    {kc.studentsNeedingHelp}/{kc.totalStudents}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label">Help Percentage</div>
                  <div className={`metric-value ${kc.helpPercentage > 50 ? 'critical' : kc.helpPercentage > 30 ? 'warning' : 'good'}`}>
                    {kc.helpPercentage.toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <div className="kc-distribution">
                <div className="distribution-bar">
                  {kc.masteryLevels && (
                    <>
                      <div 
                        className="dist-segment very-low" 
                        style={{ width: `${(kc.masteryLevels.veryLow / kc.totalStudents) * 100}%` }}
                        title={`Very Low: ${kc.masteryLevels.veryLow} students`}
                      ></div>
                      <div 
                        className="dist-segment low" 
                        style={{ width: `${(kc.masteryLevels.low / kc.totalStudents) * 100}%` }}
                        title={`Low: ${kc.masteryLevels.low} students`}
                      ></div>
                      <div 
                        className="dist-segment medium" 
                        style={{ width: `${(kc.masteryLevels.medium / kc.totalStudents) * 100}%` }}
                        title={`Medium: ${kc.masteryLevels.medium} students`}
                      ></div>
                      <div 
                        className="dist-segment high" 
                        style={{ width: `${(kc.masteryLevels.high / kc.totalStudents) * 100}%` }}
                        title={`High: ${kc.masteryLevels.high} students`}
                      ></div>
                      <div 
                        className="dist-segment very-high" 
                        style={{ width: `${(kc.masteryLevels.veryHigh / kc.totalStudents) * 100}%` }}
                        title={`Very High: ${kc.masteryLevels.veryHigh} students`}
                      ></div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="kc-actions">
                <Link to={`/teacher/knowledge-components/${kc.id}`} className="kc-detail-btn">
                  View Detailed Analysis →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-notification">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomViewEnhanced;