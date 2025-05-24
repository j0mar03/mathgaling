import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './TeacherDashboard.css';
import './ClassroomView.css';
import LinkParentToStudentModal from './LinkParentToStudentModal'; // Import Link Parent Modal

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ClassroomView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddStudentInput, setShowAddStudentInput] = useState(false); // State for add student input
  const [eligibleStudents, setEligibleStudents] = useState([]); // State for eligible students
  const [selectedStudents, setSelectedStudents] = useState([]); // State for selected students
  const [linkingStudent, setLinkingStudent] = useState(null); // State for student being linked to parent
  const [showLinkParentModal, setShowLinkParentModal] = useState(false); // State for link parent modal
  const { user } = useAuth();
  const teacherId = user?.id; // Use logged-in teacher's ID
  
  useEffect(() => {
    const fetchData = async () => {
      // Ensure teacherId is available before fetching
      if (!teacherId) {
        setError("Could not identify teacher. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        console.log('[ClassroomView] Starting to fetch data for classroom:', id);
        
        // Fetch specific classroom data using the new endpoint (ownership checked on backend)
        console.log('[ClassroomView] Fetching classroom details...');
        const classroomResponse = await axios.get(`/api/classrooms/${id}`);
        console.log('[ClassroomView] Classroom details:', classroomResponse.data);
        setClassroom(classroomResponse.data);
        
        // Fetch students in classroom
        console.log('[ClassroomView] Fetching students...');
        const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
        console.log('[ClassroomView] Students:', studentsResponse.data);
        setStudents(studentsResponse.data);
        
        // Fetch performance data
        console.log('[ClassroomView] Fetching performance data...');
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        console.log('[ClassroomView] Performance data:', performanceResponse.data);
        setPerformance(performanceResponse.data);
        
        // Fetch knowledge component performance with real-time data
        console.log('[ClassroomView] Fetching knowledge components with performance data...');
        const kcResponse = await axios.get(`/api/classrooms/${id}/knowledge-components`);
        console.log('[ClassroomView] Knowledge components with performance:', kcResponse.data);
        setKnowledgeComponents(kcResponse.data);
        
        console.log('[ClassroomView] All data loaded successfully!');
        setLoading(false);
      } catch (err) {
        // Enhanced error logging
        console.error('Detailed error fetching classroom data:', err.response || err.request || err.message || err);
        let specificError = 'Failed to load classroom data. Please try again later.';
        if (err.response) {
          // Server responded with non-2xx status
          specificError = `Failed to load classroom data: Server responded with status ${err.response.status}. ${err.response.data?.error || ''}`;
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        } else if (err.request) {
          // No response received
          specificError = 'Failed to load classroom data: No response received from server.';
          console.error('Error request:', err.request);
        } else {
          // Request setup error
          specificError = `Failed to load classroom data: ${err.message}`;
        }
        setError(specificError); // Set more specific error message
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, teacherId]);
  
  // Auto-refresh knowledge component data every 30 seconds
  useEffect(() => {
    if (!id || loading) return;
    
    const interval = setInterval(async () => {
      try {
        console.log('[ClassroomView] Auto-refreshing KC performance data...');
        const kcResponse = await axios.get(`/api/classrooms/${id}/knowledge-components`);
        setKnowledgeComponents(kcResponse.data);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [id, loading]);
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading classroom data...</h2>
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
  
  // Prepare data for knowledge component chart
  const chartData = {
    labels: knowledgeComponents && knowledgeComponents.length > 0 
      ? knowledgeComponents.map(kc => kc.curriculum_code || 'Unknown')
      : ['No data'],
    datasets: [
      {
        label: 'Average Mastery (%)',
        data: knowledgeComponents && knowledgeComponents.length > 0
          ? knowledgeComponents.map(kc => (kc.averageMastery || 0) * 100)
          : [0],
        backgroundColor: 'rgba(74, 111, 165, 0.7)',
        borderColor: 'rgba(74, 111, 165, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Average Mastery Level (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Knowledge Component Codes'
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
        text: 'Class Knowledge Component Performance',
      },
    },
  };
  
  // Sort students by intervention priority, then by name
  const sortedStudents = [...performance].sort((a, b) => {
    // First sort by intervention priority
    if (a.intervention && b.intervention) {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1, undefined: 0 };
      const priorityDiff = 
        priorityOrder[a.intervention.priority] - priorityOrder[b.intervention.priority];
      
      if (priorityDiff !== 0) return -priorityDiff;
    } else if (a.intervention && a.intervention.needed) {
      return -1;
    } else if (b.intervention && b.intervention.needed) {
      return 1;
    }
    
    // Then sort by name
    return a.student.name.localeCompare(b.student.name);
  });

  const handleRemoveStudent = async (studentIdToRemove, studentName) => {
    if (isProcessing) return; // Prevent multiple clicks

    if (window.confirm(`Are you sure you want to remove ${studentName} from this classroom?`)) {
      setIsProcessing(true);
      setError(null);
      try {
        // API call to remove student
        await axios.delete(`/api/classrooms/${id}/students/${studentIdToRemove}`);

        // Refresh student list and performance data after removal
        const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
        setStudents(studentsResponse.data);
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        setPerformance(performanceResponse.data);
        // Optionally show a success message

      } catch (err) {
        console.error('Error removing student:', err);
        setError(err.response?.data?.error || 'Failed to remove student.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handleLinkParent = (student) => {
    console.log('handleLinkParent called with student:', student);
    setLinkingStudent(student);
    setShowLinkParentModal(true);
  };
  
  const handleCloseLinkParentModal = () => {
    setLinkingStudent(null);
    setShowLinkParentModal(false);
  };

  // Toggle visibility of the add student modal and fetch eligible students
  const handleAddStudentClick = async () => {
      // If already showing, just hide it
      if (showAddStudentInput) {
          setShowAddStudentInput(false);
          setSelectedStudents([]);
          setError(null);
          return;
      }
      
      // Otherwise, show it and fetch eligible students
      setIsProcessing(true);
      setError(null);
      
      try {
          // Fetch eligible students from the API
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

  // Handle checkbox change for student selection
  const handleStudentCheckboxChange = (studentId) => {
      setSelectedStudents(prev => {
          if (prev.includes(studentId)) {
              // If already selected, remove it
              return prev.filter(id => id !== studentId);
          } else {
              // Otherwise, add it
              return [...prev, studentId];
          }
      });
  };

  // Handle confirming the addition of selected students
  const handleAddStudentConfirm = async () => {
      if (isProcessing || selectedStudents.length === 0) return;

      setIsProcessing(true);
      setError(null);
      try {
          // API call to add students - using the correct endpoint and request format
          // The API expects an array of studentIds in the request body
          await axios.post(`/api/classrooms/${id}/students`, {
              studentIds: selectedStudents
          });

          // Refresh student list and performance data after adding
          const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
          setStudents(studentsResponse.data);
          const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
          setPerformance(performanceResponse.data);

          // Hide input field and clear state
          setShowAddStudentInput(false);
          setSelectedStudents([]);

      } catch (err) {
          console.error('Error adding students:', err);
          setError(err.response?.data?.error || 'Failed to add students. Please try again.');
      } finally {
          setIsProcessing(false);
      }
  };

  // Removed duplicate handleAddStudentConfirm function
  
  // Add safety check for classroom data
  if (!classroom) {
    return (
      <div className="error-container">
        <h2>Classroom Not Found</h2>
        <p>Unable to load classroom data.</p>
        <Link to="/teacher" className="button">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="classroom-view">
      {/* Parent-Student Linking Modal */}
      {showLinkParentModal && linkingStudent && (
        <LinkParentToStudentModal
          student={linkingStudent}
          classroomId={id}
          onClose={handleCloseLinkParentModal}
          onLinked={() => {
            // Optionally refresh data if needed
            handleCloseLinkParentModal();
          }}
        />
      )}
      <div className="classroom-header">
        <div className="header-content">
          <h1>{classroom?.name || 'Classroom'}</h1>
          <div className="classroom-stats">
            <div className="stat">
              <span className="stat-value">{students.length}</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {performance.length > 0 
                  ? (performance.reduce((sum, s) => 
                      sum + (s.performance?.mathMastery || s.performance?.averageMastery || 0), 0) / performance.length * 100).toFixed(0)
                  : 0}%
              </span>
              <span className="stat-label">Avg. Math Mastery</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {performance.filter(s => s.intervention && s.intervention.needed).length}
              </span>
              <span className="stat-label">Interventions</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/teacher" className="button secondary">Back to Dashboard</Link>
          <button className="button">Manage Classroom</button>
        </div>
      </div>
      
      <div className="classroom-content">
        <div className="students-section">
          <div className="section-header">
            <h2>Students</h2>
            {!showAddStudentInput ? (
                <button className="add-button" onClick={handleAddStudentClick} disabled={isProcessing}>
                    {isProcessing ? 'Loading...' : '+ Add Student'}
                </button>
            ) : (
                <div className="add-student-controls" style={{
                    marginTop: '10px',
                    marginBottom: '10px',
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h3 style={{ marginTop: '0', marginBottom: '10px' }}>Select Students to Add</h3>
                    
                    {eligibleStudents.length === 0 ? (
                        <p>No eligible students found.</p>
                    ) : (
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid #eee',
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: 'white'
                        }}>
                            {eligibleStudents.map(student => (
                                <div key={student.id} style={{
                                    padding: '5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <input
                                        type="checkbox"
                                        id={`student-${student.id}`}
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => handleStudentCheckboxChange(student.id)}
                                        disabled={isProcessing}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <label htmlFor={`student-${student.id}`} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        cursor: 'pointer'
                                    }}>
                                        <span>{student.name}</span>
                                        <span style={{ color: '#666' }}>Grade {student.grade_level}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ marginRight: '10px' }}>
                                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div>
                            <button
                                onClick={handleAddStudentConfirm}
                                disabled={isProcessing || selectedStudents.length === 0}
                                className="button small"
                            >
                                {isProcessing ? 'Adding...' : 'Add Selected Students'}
                            </button>
                            <button
                                onClick={handleAddStudentClick}
                                disabled={isProcessing}
                                style={{ marginLeft: '5px' }}
                                className="button small secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-center">Grade</th>
                  <th>Math Mastery</th>
                  <th>Last Activity</th>
                  <th className="text-center">Intervention</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map(student => (
                  <tr 
                    key={student.student.id} 
                    className={student.intervention && student.intervention.needed ? 'needs-intervention' : ''}
                  >
                    <td className="col-name">{student.student.name}</td>
                    <td className="col-grade">{student.student.grade_level}</td>
                    <td className="col-mastery">
                      <div className="mastery-display">
                        <div className="mastery-percentage">
                          {student.performance?.mathMastery != null 
                            ? (student.performance.mathMastery * 100).toFixed(0) + '%'
                            : student.performance?.averageMastery != null
                            ? (student.performance.averageMastery * 100).toFixed(0) + '%'
                            : student.performance?.averageScore != null
                            ? Math.round(student.performance.averageScore) + '%'
                            : 'N/A'}
                        </div>
                        {(student.performance?.mathMastery != null || student.performance?.averageMastery != null || student.performance?.averageScore != null) && (
                          <div className="mastery-bar">
                            <div 
                              className="mastery-fill" 
                              style={{ 
                                width: `${
                                  student.performance?.mathMastery != null
                                    ? student.performance.mathMastery * 100
                                    : student.performance?.averageMastery != null
                                    ? student.performance.averageMastery * 100
                                    : student.performance?.averageScore != null
                                    ? student.performance.averageScore
                                    : 0
                                }%` 
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="col-activity">
                      {student.performance?.lastActive 
                        ? new Date(student.performance.lastActive).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
                        : 'Never'}
                    </td>
                    <td className="col-intervention">
                      {student.intervention && student.intervention.needed ? (
                        <span className={`priority-badge ${student.intervention.priority.toLowerCase()}`}>
                          {student.intervention.priority}
                        </span>
                      ) : (
                        <span className="no-intervention">None</span>
                      )}
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <Link to={`/teacher/student/${student.student.id}`} className="icon-button view" title="View Student">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          className="icon-button parent"
                          onClick={() => handleLinkParent(student.student)}
                          disabled={isProcessing}
                          title="Link Parent"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                        <button
                          className="icon-button remove"
                          onClick={() => handleRemoveStudent(student.student.id, student.student.name)}
                          disabled={isProcessing}
                          title="Remove Student"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="knowledge-components-section">
          <div className="section-header">
            <h2>Knowledge Component Performance</h2>
            <div className="refresh-indicator">
              <span className="last-updated">Updates every 30s</span>
              <div className="live-indicator"></div>
            </div>
          </div>
          <div className="chart-container-compact">
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className="kc-table-compact">
            <div className="table-header-compact">
              <div className="kc-info-header">Knowledge Component</div>
              <div className="kc-performance-header">Class Performance</div>
              <div className="kc-actions-header">Actions</div>
            </div>
            
            <div className="table-body-compact">
              {knowledgeComponents.length > 0 ? knowledgeComponents.map(kc => (
                <div key={kc.id} className="kc-row-compact">
                  <div className="kc-info">
                    <div className="kc-code">{kc.curriculum_code}</div>
                    <div className="kc-name">{kc.name}</div>
                    <div className="kc-stats">
                      <span className="students-count">
                        {kc.studentsWithData || 0}/{kc.totalStudents || 0} students
                      </span>
                    </div>
                  </div>
                  
                  <div className="kc-performance">
                    <div className="mastery-summary">
                      <div className="mastery-percentage-compact">
                        {((kc.averageMastery || 0) * 100).toFixed(0)}%
                      </div>
                      <div className="mastery-bar-compact">
                        <div 
                          className="mastery-fill-compact" 
                          style={{ width: `${(kc.averageMastery || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="distribution-compact">
                      {kc.masteryLevels && kc.totalStudents > 0 ? (
                        <>
                          <div 
                            className="dist-bar very-low" 
                            style={{ width: `${(kc.masteryLevels.veryLow || 0) / kc.totalStudents * 100}%` }}
                            title={`Very Low (0-20%): ${kc.masteryLevels.veryLow || 0} students`}
                          ></div>
                          <div 
                            className="dist-bar low" 
                            style={{ width: `${(kc.masteryLevels.low || 0) / kc.totalStudents * 100}%` }}
                            title={`Low (20-40%): ${kc.masteryLevels.low || 0} students`}
                          ></div>
                          <div 
                            className="dist-bar medium" 
                            style={{ width: `${(kc.masteryLevels.medium || 0) / kc.totalStudents * 100}%` }}
                            title={`Medium (40-60%): ${kc.masteryLevels.medium || 0} students`}
                          ></div>
                          <div 
                            className="dist-bar high" 
                            style={{ width: `${(kc.masteryLevels.high || 0) / kc.totalStudents * 100}%` }}
                            title={`High (60-80%): ${kc.masteryLevels.high || 0} students`}
                          ></div>
                          <div 
                            className="dist-bar very-high" 
                            style={{ width: `${(kc.masteryLevels.veryHigh || 0) / kc.totalStudents * 100}%` }}
                            title={`Very High (80-100%): ${kc.masteryLevels.veryHigh || 0} students`}
                          ></div>
                        </>
                      ) : (
                        <div className="no-data-compact">No data</div>
                      )}
                    </div>
                    
                    <div className="performance-summary">
                      <span className="high-performers">
                        {kc.masteryLevels ? (kc.masteryLevels.high + kc.masteryLevels.veryHigh) : 0} high
                      </span>
                      <span className="low-performers">
                        {kc.masteryLevels ? (kc.masteryLevels.veryLow + kc.masteryLevels.low) : 0} need help
                      </span>
                    </div>
                  </div>
                  
                  <div className="kc-actions">
                    <Link to={`/teacher/knowledge-components/${kc.id}`} className="btn-view-details">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Details
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="no-kcs-message">
                  <p>No knowledge components found for this classroom's grade level.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="intervention-section">
          <h2>Intervention Recommendations</h2>
          
          {performance.filter(s => s.intervention && s.intervention.needed).length > 0 ? (
            <div className="intervention-list">
              {performance
                .filter(s => s.intervention && s.intervention.needed)
                .map(student => (
                  <div 
                    key={student.student.id} 
                    className={`intervention-item priority-${(student.intervention.priority || 'medium').toLowerCase()}`}
                  >
                    <div className="intervention-details">
                      <h3>{student.student.name}</h3>
                      <p>Grade {student.student.grade_level}</p>
                      <div className="intervention-priority">
                        <span className="priority-label">Priority:</span> 
                        <span className="priority-value">{student.intervention.priority}</span>
                      </div>
                      {student.intervention.recommendations ? (
                        <div className="intervention-recommendations">
                          <p><strong>Difficulty Adjustment:</strong> {student.intervention.recommendations.difficulty || 'N/A'}</p>
                          <p><strong>Hint Strategy:</strong> {student.intervention.recommendations.hints || 'N/A'}</p>
                          {student.intervention.recommendations.pacing && (
                            <p><strong>Pacing:</strong> {student.intervention.recommendations.pacing}</p>
                          )}
                        </div>
                      ) : (
                        <div className="intervention-recommendations">
                          <p><strong>Reason:</strong> {student.intervention.reason || 'Performance tracking needed'}</p>
                        </div>
                      )}
                    </div>
                    <div className="intervention-actions">
                      <Link to={`/teacher/student/${student.student.id}`} className="button">
                        View Student
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="no-interventions">No students currently need intervention in this classroom.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomView;
