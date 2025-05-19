import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './TeacherDashboard.css';

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
        // Fetch specific classroom data using the new endpoint (ownership checked on backend)
        const classroomResponse = await axios.get(`/api/classrooms/${id}`);
        setClassroom(classroomResponse.data);
        
        // Fetch students in classroom
        const studentsResponse = await axios.get(`/api/classrooms/${id}/students`);
        setStudents(studentsResponse.data);
        
        // Fetch performance data
        const performanceResponse = await axios.get(`/api/classrooms/${id}/performance`);
        setPerformance(performanceResponse.data);
        
        // Fetch knowledge component performance
        const kcResponse = await axios.get(`/api/classrooms/${id}/knowledge-components`);
        setKnowledgeComponents(kcResponse.data);
        
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
    labels: knowledgeComponents.map(kc => kc.curriculum_code || 'Unknown'),
    datasets: [
      {
        label: 'Average Mastery (%)',
        data: knowledgeComponents.map(kc => kc.averageMastery * 100),
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

  const handleRemoveStudent = async (studentIdToRemove) => {
    if (isProcessing) return; // Prevent multiple clicks

    if (window.confirm(`Are you sure you want to remove student ID ${studentIdToRemove} from this classroom?`)) {
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
  
  return (
    <div className="classroom-view">
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
            <div className="table-header">
              <div className="col-name">Name</div>
              <div className="col-grade">Grade</div>
              <div className="col-mastery">Math Mastery</div>
              <div className="col-activity">Last Activity</div>
              <div className="col-intervention">Intervention</div>
              <div className="col-actions">Actions</div>
            </div>
            
            <div className="table-body">
              {sortedStudents.map(student => (
                <div 
                  key={student.student.id} 
                  className={`table-row ${student.intervention && student.intervention.needed ? 'needs-intervention' : ''}`}
                >
                  <div className="col-name">{student.student.name}</div>
                  <div className="col-grade">{student.student.grade_level}</div>
                  <div className="col-mastery">
                    <div className="mastery-percentage">
                      {(student.performance?.mathMastery * 100 || student.performance?.averageMastery * 100 || 0).toFixed(0)}%
                    </div>
                    <div className="mastery-bar">
                      <div 
                        className="mastery-fill" 
                        style={{ width: `${student.performance?.mathMastery * 100 || student.performance?.averageMastery * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="col-activity">
                    {student.performance?.lastActive 
                      ? new Date(student.performance.lastActive).toLocaleDateString() 
                      : 'Never'}
                  </div>
                  <div className="col-intervention">
                    {student.intervention && student.intervention.needed ? (
                      <span className={`priority-badge ${student.intervention.priority.toLowerCase()}`}>
                        {student.intervention.priority}
                      </span>
                    ) : (
                      <span className="no-intervention">None</span>
                    )}
                  </div>
                  <div className="col-actions">
                    <Link to={`/teacher/student/${student.student.id}`} className="button small">
                      View
                   </Link>
                   <button
                     className="button small danger"
                     onClick={() => handleRemoveStudent(student.student.id)}
                     disabled={isProcessing}
                     style={{marginLeft: '5px'}}
                   >
                     Remove
                   </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="knowledge-components-section">
          <h2>Knowledge Component Performance</h2>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
          
          <div className="kc-table">
            <div className="table-header">
              <div className="col-code">Code</div>
              <div className="col-name">Name</div>
              <div className="col-mastery">Average Mastery</div>
              <div className="col-distribution">Mastery Distribution</div>
              <div className="col-actions">Actions</div>
            </div>
            
            <div className="table-body">
              {knowledgeComponents.map(kc => (
                <div key={kc.id} className="table-row">
                  <div className="col-code">{kc.curriculum_code}</div>
                  <div className="col-name">{kc.name}</div>
                  <div className="col-mastery">
                    <div className="mastery-percentage">
                      {(kc.averageMastery * 100).toFixed(0)}%
                    </div>
                    <div className="mastery-bar">
                      <div 
                        className="mastery-fill" 
                        style={{ width: `${kc.averageMastery * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="col-distribution">
                    <div className="mastery-distribution">
                      <div 
                        className="dist-segment very-low" 
                        style={{ width: `${kc.masteryLevels.veryLow / kc.totalStudents * 100}%` }}
                        title={`Very Low: ${kc.masteryLevels.veryLow} students`}
                      ></div>
                      <div 
                        className="dist-segment low" 
                        style={{ width: `${kc.masteryLevels.low / kc.totalStudents * 100}%` }}
                        title={`Low: ${kc.masteryLevels.low} students`}
                      ></div>
                      <div 
                        className="dist-segment medium" 
                        style={{ width: `${kc.masteryLevels.medium / kc.totalStudents * 100}%` }}
                        title={`Medium: ${kc.masteryLevels.medium} students`}
                      ></div>
                      <div 
                        className="dist-segment high" 
                        style={{ width: `${kc.masteryLevels.high / kc.totalStudents * 100}%` }}
                        title={`High: ${kc.masteryLevels.high} students`}
                      ></div>
                      <div 
                        className="dist-segment very-high" 
                        style={{ width: `${kc.masteryLevels.veryHigh / kc.totalStudents * 100}%` }}
                        title={`Very High: ${kc.masteryLevels.veryHigh} students`}
                      ></div>
                    </div>
                  </div>
                  <div className="col-actions">
                    <Link to={`/teacher/knowledge-components/${kc.id}`} className="button small">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
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
                    className={`intervention-item priority-${student.intervention.priority.toLowerCase()}`}
                  >
                    <div className="intervention-details">
                      <h3>{student.student.name}</h3>
                      <p>Grade {student.student.grade_level}</p>
                      <div className="intervention-priority">
                        <span className="priority-label">Priority:</span> 
                        <span className="priority-value">{student.intervention.priority}</span>
                      </div>
                      <div className="intervention-recommendations">
                        <p><strong>Difficulty Adjustment:</strong> {student.intervention.recommendations.difficulty}</p>
                        <p><strong>Hint Strategy:</strong> {student.intervention.recommendations.hints}</p>
                        {student.intervention.recommendations.pacing && (
                          <p><strong>Pacing:</strong> {student.intervention.recommendations.pacing}</p>
                        )}
                      </div>
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
