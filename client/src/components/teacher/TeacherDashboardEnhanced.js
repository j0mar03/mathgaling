import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './TeacherDashboardEnhanced.css';

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

const TeacherDashboardEnhanced = () => {
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentsNeedingHelp, setStudentsNeedingHelp] = useState([]);
  const [classroomPerformance, setClassroomPerformance] = useState({});
  const [interventionPriorities, setInterventionPriorities] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const teacherId = user?.id;
  
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!teacherId) {
        setError("Could not identify teacher. Please log in again.");
        setLoading(false);
        return;
      }
      
      try {
        console.log(`[TeacherDashboard] Fetching data for teacher ID: ${teacherId}`);
        
        // Fetch teacher profile and classrooms
        const [teacherResponse, classroomsResponse] = await Promise.all([
          axios.get(`/api/teachers/${teacherId}`),
          axios.get(`/api/teachers/${teacherId}/classrooms`)
        ]);
        
        setTeacher(teacherResponse.data);
        setClassrooms(classroomsResponse.data || []);
        
        // Fetch all students across classrooms
        const allStudentsData = [];
        const classroomPerformanceData = {};
        
        for (const classroom of classroomsResponse.data || []) {
          try {
            const studentsResponse = await axios.get(`/api/classrooms/${classroom.id}/students`);
            const students = studentsResponse.data || [];
            
            // Fetch performance data for each student
            const studentsWithPerformance = await Promise.all(
              students.map(async (student) => {
                try {
                  const [weeklyReport, knowledgeStates] = await Promise.all([
                    axios.get(`/api/parents/students/${student.id}/weekly-report`),
                    axios.get(`/api/students/${student.id}/knowledge-states`)
                  ]);
                  
                  const performance = weeklyReport.data?.weeklyProgress || {};
                  const states = knowledgeStates.data || [];
                  
                  return {
                    ...student,
                    classroomId: classroom.id,
                    classroomName: classroom.name,
                    performance: {
                      overallMastery: performance.averageMastery || 0,
                      activeDays: performance.activeDays || 0,
                      accuracyRate: performance.correctRate || 0,
                      totalQuestions: performance.totalQuestionsAnswered || 0,
                      timeSpent: performance.totalTimeSpent || 0,
                      weeklyChange: performance.weeklyChange || 0,
                      knowledgeStates: states,
                      strugglingAreas: states.filter(ks => ks.p_mastery < 0.5).length,
                      masteredAreas: states.filter(ks => ks.p_mastery >= 0.8).length
                    }
                  };
                } catch (err) {
                  console.warn(`Failed to fetch performance for student ${student.id}`);
                  return {
                    ...student,
                    classroomId: classroom.id,
                    classroomName: classroom.name,
                    performance: {
                      overallMastery: 0,
                      activeDays: 0,
                      accuracyRate: 0,
                      totalQuestions: 0,
                      timeSpent: 0,
                      weeklyChange: 0,
                      knowledgeStates: [],
                      strugglingAreas: 0,
                      masteredAreas: 0
                    }
                  };
                }
              })
            );
            
            allStudentsData.push(...studentsWithPerformance);
            
            // Calculate classroom performance metrics
            const classroomStats = calculateClassroomStats(studentsWithPerformance);
            classroomPerformanceData[classroom.id] = {
              ...classroom,
              students: studentsWithPerformance,
              stats: classroomStats
            };
            
          } catch (err) {
            console.warn(`Failed to fetch students for classroom ${classroom.id}`);
          }
        }
        
        setAllStudents(allStudentsData);
        setClassroomPerformance(classroomPerformanceData);
        
        // Identify students needing help
        const studentsNeedingHelp = identifyStudentsNeedingHelp(allStudentsData);
        setStudentsNeedingHelp(studentsNeedingHelp);
        
        // Generate intervention priorities
        const priorities = generateInterventionPriorities(allStudentsData);
        setInterventionPriorities(priorities);
        
        console.log(`[TeacherDashboard] Data loaded successfully`);
        setLoading(false);
      } catch (err) {
        console.error(`[TeacherDashboard] Error fetching data:`, err);
        setError('Failed to load teacher dashboard. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [teacherId]);
  
  // Helper function to calculate classroom statistics
  const calculateClassroomStats = (students) => {
    if (students.length === 0) return null;
    
    const totalMastery = students.reduce((sum, s) => sum + s.performance.overallMastery, 0);
    const averageMastery = totalMastery / students.length;
    
    const totalActiveDays = students.reduce((sum, s) => sum + s.performance.activeDays, 0);
    const averageActiveDays = totalActiveDays / students.length;
    
    const totalAccuracy = students.reduce((sum, s) => sum + s.performance.accuracyRate, 0);
    const averageAccuracy = totalAccuracy / students.length;
    
    const strugglingStudents = students.filter(s => 
      s.performance.overallMastery < 0.5 || 
      s.performance.activeDays < 3 || 
      s.performance.accuracyRate < 0.6
    ).length;
    
    const excellentStudents = students.filter(s => 
      s.performance.overallMastery >= 0.8 && 
      s.performance.activeDays >= 5 && 
      s.performance.accuracyRate >= 0.8
    ).length;
    
    return {
      totalStudents: students.length,
      averageMastery,
      averageActiveDays,
      averageAccuracy,
      strugglingStudents,
      excellentStudents,
      needsAttention: strugglingStudents > students.length * 0.3
    };
  };
  
  // Helper function to identify students needing help
  const identifyStudentsNeedingHelp = (students) => {
    return students
      .map(student => {
        const issues = [];
        const performance = student.performance;
        let urgencyScore = 0;
        
        // Check mastery level
        if (performance.overallMastery < 0.3) {
          issues.push({ type: 'critical', message: 'Very low mastery level', icon: '🚨' });
          urgencyScore += 10;
        } else if (performance.overallMastery < 0.5) {
          issues.push({ type: 'high', message: 'Below expected mastery', icon: '⚠️' });
          urgencyScore += 7;
        }
        
        // Check activity level
        if (performance.activeDays < 2) {
          issues.push({ type: 'critical', message: 'Very low engagement', icon: '📅' });
          urgencyScore += 8;
        } else if (performance.activeDays < 4) {
          issues.push({ type: 'medium', message: 'Inconsistent practice', icon: '📆' });
          urgencyScore += 5;
        }
        
        // Check accuracy
        if (performance.accuracyRate < 0.5) {
          issues.push({ type: 'high', message: 'Low accuracy rate', icon: '🎯' });
          urgencyScore += 6;
        }
        
        // Check struggling areas
        if (performance.strugglingAreas > 5) {
          issues.push({ type: 'high', message: 'Multiple struggling areas', icon: '📚' });
          urgencyScore += 5;
        }
        
        // Check weekly trend
        if (performance.weeklyChange < -0.05) {
          issues.push({ type: 'medium', message: 'Declining performance', icon: '📉' });
          urgencyScore += 4;
        }
        
        return {
          ...student,
          issues,
          urgencyScore,
          needsHelp: issues.length > 0
        };
      })
      .filter(student => student.needsHelp)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  };
  
  // Helper function to generate intervention priorities
  const generateInterventionPriorities = (students) => {
    const priorities = [];
    
    // Low engagement intervention
    const lowEngagementStudents = students.filter(s => s.performance.activeDays < 3);
    if (lowEngagementStudents.length > 0) {
      priorities.push({
        title: 'Low Engagement Intervention',
        type: 'engagement',
        urgency: 'high',
        studentsCount: lowEngagementStudents.length,
        description: 'Students with inconsistent practice patterns need engagement strategies',
        students: lowEngagementStudents.slice(0, 5),
        actions: [
          'Send parent communication about practice importance',
          'Implement gamification strategies',
          'Schedule one-on-one check-ins',
          'Adjust difficulty level to maintain interest'
        ]
      });
    }
    
    // Low mastery intervention
    const lowMasteryStudents = students.filter(s => s.performance.overallMastery < 0.5);
    if (lowMasteryStudents.length > 0) {
      priorities.push({
        title: 'Academic Support Needed',
        type: 'academic',
        urgency: 'critical',
        studentsCount: lowMasteryStudents.length,
        description: 'Students below grade-level expectations need immediate academic support',
        students: lowMasteryStudents.slice(0, 5),
        actions: [
          'Schedule remedial instruction sessions',
          'Provide additional practice materials',
          'Consider peer tutoring assignments',
          'Contact parents for home support strategies'
        ]
      });
    }
    
    // Accuracy intervention
    const lowAccuracyStudents = students.filter(s => s.performance.accuracyRate < 0.6);
    if (lowAccuracyStudents.length > 0) {
      priorities.push({
        title: 'Accuracy Improvement Focus',
        type: 'accuracy',
        urgency: 'medium',
        studentsCount: lowAccuracyStudents.length,
        description: 'Students making frequent errors need focused accuracy training',
        students: lowAccuracyStudents.slice(0, 5),
        actions: [
          'Review common error patterns',
          'Provide step-by-step problem solving guides',
          'Implement self-checking strategies',
          'Use manipulatives for concrete understanding'
        ]
      });
    }
    
    return priorities.sort((a, b) => {
      const urgencyOrder = { critical: 3, high: 2, medium: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading Teacher Dashboard...</h2>
        <p>Analyzing student performance data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">👩‍🏫</div>
        <h2>Dashboard Load Failed</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Prepare overall performance chart
  const overallPerformanceData = {
    labels: Object.values(classroomPerformance).map(c => c.name),
    datasets: [
      {
        label: 'Average Mastery (%)',
        data: Object.values(classroomPerformance).map(c => (c.stats?.averageMastery || 0) * 100),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2
      },
      {
        label: 'Average Accuracy (%)',
        data: Object.values(classroomPerformance).map(c => (c.stats?.averageAccuracy || 0) * 100),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }
    ]
  };
  
  const overallPerformanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Classroom Performance Overview',
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
        }
      }
    }
  };
  
  // Prepare intervention priority chart
  const interventionData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [
          studentsNeedingHelp.filter(s => s.urgencyScore >= 8).length,
          studentsNeedingHelp.filter(s => s.urgencyScore >= 6 && s.urgencyScore < 8).length,
          studentsNeedingHelp.filter(s => s.urgencyScore >= 4 && s.urgencyScore < 6).length,
          studentsNeedingHelp.filter(s => s.urgencyScore < 4).length
        ],
        backgroundColor: [
          '#dc3545',
          '#fd7e14',
          '#ffc107',
          '#28a745'
        ],
        borderWidth: 0
      }
    ]
  };
  
  const interventionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Students by Intervention Priority',
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    }
  };
  
  return (
    <div className="teacher-dashboard-enhanced">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="teacher-info">
            <div className="teacher-avatar">
              {teacher?.name?.charAt(0) || 'T'}
            </div>
            <div className="teacher-details">
              <h1>Welcome, {teacher?.name || 'Teacher'}</h1>
              <p className="teacher-meta">
                {classrooms.length} Classroom{classrooms.length !== 1 ? 's' : ''} • 
                {allStudents.length} Student{allStudents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/teacher/profile" className="btn-secondary">
              👤 Profile
            </Link>
            <button className="btn-primary">
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card critical">
            <div className="metric-icon">🚨</div>
            <div className="metric-content">
              <div className="metric-value">
                {studentsNeedingHelp.filter(s => s.urgencyScore >= 8).length}
              </div>
              <div className="metric-label">Need Immediate Help</div>
            </div>
          </div>
          
          <div className="metric-card warning">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <div className="metric-value">
                {studentsNeedingHelp.filter(s => s.urgencyScore >= 6 && s.urgencyScore < 8).length}
              </div>
              <div className="metric-label">At Risk Students</div>
            </div>
          </div>
          
          <div className="metric-card success">
            <div className="metric-icon">🌟</div>
            <div className="metric-content">
              <div className="metric-value">
                {allStudents.filter(s => s.performance.overallMastery >= 0.8).length}
              </div>
              <div className="metric-label">High Performers</div>
            </div>
          </div>
          
          <div className="metric-card info">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <div className="metric-value">
                {((allStudents.reduce((sum, s) => sum + s.performance.overallMastery, 0) / allStudents.length) * 100).toFixed(0)}%
              </div>
              <div className="metric-label">Overall Class Mastery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Urgent Interventions Section */}
        {studentsNeedingHelp.filter(s => s.urgencyScore >= 6).length > 0 && (
          <div className="urgent-section">
            <div className="section-header">
              <h2>🚨 Students Requiring Immediate Attention</h2>
              <p>These students need urgent intervention to prevent further academic decline</p>
            </div>
            
            <div className="urgent-students-grid">
              {studentsNeedingHelp.filter(s => s.urgencyScore >= 6).slice(0, 6).map(student => (
                <div key={student.id} className={`student-alert-card ${student.urgencyScore >= 8 ? 'critical' : 'high'}`}>
                  <div className="student-alert-header">
                    <div className="student-name">
                      <strong>{student.name}</strong>
                      <span className="classroom-tag">{student.classroomName}</span>
                    </div>
                    <div className="urgency-badge">
                      {student.urgencyScore >= 8 ? 'CRITICAL' : 'HIGH RISK'}
                    </div>
                  </div>
                  
                  <div className="student-issues">
                    {student.issues.slice(0, 3).map((issue, index) => (
                      <div key={index} className={`issue-item ${issue.type}`}>
                        <span className="issue-icon">{issue.icon}</span>
                        <span className="issue-text">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="student-stats-mini">
                    <div className="stat-mini">
                      <span>Mastery: {(student.performance.overallMastery * 100).toFixed(0)}%</span>
                    </div>
                    <div className="stat-mini">
                      <span>Active: {student.performance.activeDays}/7 days</span>
                    </div>
                  </div>
                  
                  <div className="student-actions">
                    <Link to={`/teacher/student/${student.id}`} className="btn-action">
                      View Details
                    </Link>
                    <button className="btn-action-primary">
                      Start Intervention
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts and Analytics */}
        <div className="analytics-section">
          <div className="charts-grid">
            <div className="chart-container">
              <Bar data={overallPerformanceData} options={overallPerformanceOptions} />
            </div>
            <div className="chart-container">
              <Doughnut data={interventionData} options={interventionOptions} />
            </div>
          </div>
        </div>

        {/* Intervention Priorities */}
        <div className="intervention-priorities">
          <div className="section-header">
            <h2>📋 Intervention Action Plan</h2>
            <p>Systematic approach to addressing student needs</p>
          </div>
          
          <div className="priorities-grid">
            {interventionPriorities.map((priority, index) => (
              <div key={index} className={`priority-card ${priority.urgency}`}>
                <div className="priority-header">
                  <h3>{priority.title}</h3>
                  <div className="priority-meta">
                    <span className={`urgency-tag ${priority.urgency}`}>
                      {priority.urgency.toUpperCase()}
                    </span>
                    <span className="student-count">
                      {priority.studentsCount} student{priority.studentsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <p className="priority-description">{priority.description}</p>
                
                <div className="affected-students">
                  <strong>Affected Students:</strong>
                  <div className="student-chips">
                    {priority.students.map(student => (
                      <span key={student.id} className="student-chip">
                        {student.name}
                      </span>
                    ))}
                    {priority.studentsCount > 5 && (
                      <span className="student-chip more">
                        +{priority.studentsCount - 5} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="action-steps">
                  <strong>Recommended Actions:</strong>
                  <ul>
                    {priority.actions.slice(0, 3).map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="priority-actions">
                  <button className="btn-priority">
                    Create Action Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classroom Overview */}
        <div className="classrooms-overview">
          <div className="section-header">
            <h2>🏫 Classroom Overview</h2>
            <p>Performance summary for each of your classrooms</p>
          </div>
          
          <div className="classrooms-grid">
            {Object.values(classroomPerformance).map(classroom => (
              <div key={classroom.id} className="classroom-card">
                <div className="classroom-header">
                  <h3>{classroom.name}</h3>
                  <div className="classroom-status">
                    {classroom.stats?.needsAttention ? (
                      <span className="status-badge attention">Needs Attention</span>
                    ) : (
                      <span className="status-badge good">On Track</span>
                    )}
                  </div>
                </div>
                
                <div className="classroom-stats">
                  <div className="stat-row">
                    <span>Students:</span>
                    <span>{classroom.stats?.totalStudents || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Avg Mastery:</span>
                    <span>{((classroom.stats?.averageMastery || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="stat-row">
                    <span>Struggling:</span>
                    <span className="text-warning">{classroom.stats?.strugglingStudents || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Excelling:</span>
                    <span className="text-success">{classroom.stats?.excellentStudents || 0}</span>
                  </div>
                </div>
                
                <div className="classroom-actions">
                  <Link to={`/teacher/classroom/${classroom.id}`} className="btn-classroom">
                    View Classroom
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardEnhanced;