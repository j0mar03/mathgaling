import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import ContentItemList from './ContentItemList'; // Import CI List
import ContentItemForm from './ContentItemForm'; // Import CI Form
import AddClassroomModal from './AddClassroomModal'; // Import the new modal
import AssignPracticeModal from './AssignPracticeModal'; // Import AssignPracticeModal
import ConfirmAssignModal from './ConfirmAssignModal'; // Import ConfirmAssignModal
import KnowledgeComponentsOverview from './KnowledgeComponentsOverview';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomPerformance, setClassroomPerformance] = useState({});
  const [error, setError] = useState(null);
  const [knowledgeComponentMastery, setKnowledgeComponentMastery] = useState([]); // State for KC mastery
  const [showCiForm, setShowCiForm] = useState(false); // State for CI form visibility
  const [editingCi, setEditingCi] = useState(null); // State for CI being edited
  const [showAddClassroomModal, setShowAddClassroomModal] = useState(false); // State for modal visibility
  const [showAssignPracticeModal, setShowAssignPracticeModal] = useState(false); // State for AssignPracticeModal
  const [selectedStudentForPractice, setSelectedStudentForPractice] = useState(null); // Student for AssignPracticeModal
  const [showConfirmAssignModal, setShowConfirmAssignModal] = useState(false); // State for ConfirmAssignModal
  const [dataForConfirmModal, setDataForConfirmModal] = useState({ student: null, items: [] }); // Data for ConfirmAssignModal
  const [showAllInterventions, setShowAllInterventions] = useState(false); // State for showing all interventions
  const { user, token } = useAuth(); // Get user and token from context

  // Use the authenticated user's ID
  const teacherId = user?.id;
  
  useEffect(() => {
    const fetchData = async () => {
      // This check is now implicitly handled by the effect dependency and the if condition below
      // if (!teacherId) {
      //   setError("Could not identify teacher. Please log in again.");
      //   setLoading(false); // setLoading(true) should be set before fetch attempt
      //   return;
      // }
      try {
        // Fetch teacher profile
        const teacherResponse = await axios.get(`/api/teachers/${teacherId}`);
        setTeacher(teacherResponse.data);
        
        // Fetch classrooms
        const classroomsResponse = await axios.get(`/api/teachers/${teacherId}/classrooms`);
        setClassrooms(classroomsResponse.data);
        // Log the raw data received for classrooms again
        console.log("TeacherDashboard - RAW Received classrooms data:", JSON.stringify(classroomsResponse.data, null, 2));
        
        // Fetch performance data for each classroom
        const performanceData = {};
        for (const classroom of classroomsResponse.data) {
          const performanceResponse = await axios.get(`/api/classrooms/${classroom.id}/performance`);
          performanceData[classroom.id] = performanceResponse.data;
        }
        setClassroomPerformance(performanceData);
        
        // Fetch knowledge component mastery data
        const kcMasteryResponse = await axios.get(`/api/teachers/${teacherId}/knowledge-component-mastery`);
        setKnowledgeComponentMastery(kcMasteryResponse.data);
        console.log("TeacherDashboard - RAW Received KC Mastery data:", JSON.stringify(kcMasteryResponse.data, null, 2));

        // setLoading(false) should be inside the try block after successful fetches
      } catch (err) {
        console.error('Error fetching data:', err);
        // Check for 401 specifically, could indicate token issue despite teacherId being present initially
        if (err.response?.status === 401) {
             setError('Authentication error. Please log out and log in again.');
        } else {
             setError('Failed to load dashboard data. Please try again later.');
        }
        // setLoading(false) should be in finally or after error handling
      } finally {
           setLoading(false); // Ensure loading is set to false regardless of success or error
      }
    };

    // Only attempt fetch if teacherId is available
    if (teacherId) {
        setLoading(true); // Set loading true before starting fetch
        setError(null); // Clear previous errors before fetching
        fetchData();
    } else {
        // If teacherId is not yet available, keep loading state true (or handle as needed)
        // setLoading(true); // Already true by default or set by AuthContext potentially
        // setError("Waiting for user authentication..."); // Optional message
    }
  }, [teacherId]); // Add teacherId to dependency array
  // Removed duplicate closing brace and dependency array from previous diff
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading your dashboard...</h2>
        <p>Please wait while we gather your classroom data.</p>
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
  
  // Calculate intervention priorities across all classrooms
  const interventionNeeded = [];
  Object.keys(classroomPerformance).forEach(classroomId => {
    const classroom = classrooms.find(c => c.id === parseInt(classroomId));
    const students = classroomPerformance[classroomId];
    
    students.forEach(student => {
      if (student.intervention && student.intervention.needed) {
        interventionNeeded.push({
          student: {
            ...student.student,
            performance: student.performance // Include the performance data
          },
          classroom: classroom,
          priority: student.intervention.priority,
          recommendations: student.intervention.recommendations
        });
      }
    });
  });
  
  // Sort by priority (high to low)
  interventionNeeded.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // --- CI Management Handlers ---

  const handleCreateCiClick = () => {
    setEditingCi(null);
    setShowCiForm(true);
    setError(null); // Clear any previous errors
  };

  const handleEditCiClick = (ci) => {
    setEditingCi(ci);
    setShowCiForm(true);
    setError(null); // Clear any previous errors
  };

  const handleCiFormSuccess = (/* updatedCi */) => {
    setShowCiForm(false);
    setEditingCi(null);
    // Note: ContentItemList refetches its own data, so no need to trigger fetch here
    alert('Content Item saved successfully!');
  };

  const handleCiFormClose = () => {
    setShowCiForm(false);
    setEditingCi(null);
    setError(null); // Clear any form errors
  };

  // --- Classroom Management Handlers ---
  const handleAddClassroomClick = () => {
    // Open the modal instead of showing an alert
    setShowAddClassroomModal(true);
    setError(null); // Clear any previous errors
  };

  const handleCloseAddClassroomModal = () => {
    setShowAddClassroomModal(false);
    setError(null); // Clear any modal-related errors
  };

  const handleAddClassroomSuccess = (newClassroom) => {
    // Add the new classroom to the state
    setClassrooms(prevClassrooms => [...prevClassrooms, newClassroom]);
    // Initialize performance data for the new classroom (optional, but good practice)
    setClassroomPerformance(prevPerformance => ({
      ...prevPerformance,
      [newClassroom.id]: [] // Start with empty performance data
    }));
    handleCloseAddClassroomModal(); // Close the modal
    alert(`Classroom "${newClassroom.name}" created successfully!`); // Optional success message
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {teacher?.name || 'Teacher'}!</h1>
        <p>Intelligent Tutoring System Dashboard</p>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Classrooms</h3>
          <div className="count">{classrooms.length}</div>
        </div>
        
        <div className="summary-card">
          <h3>Students</h3>
          <div className="count">
            {Object.values(classroomPerformance).reduce((total, students) => total + students.length, 0)}
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Interventions Needed</h3>
          <div className="count">{interventionNeeded.length}</div>
        </div>
      </div>
      
      {interventionNeeded.length > 0 && (
        <div className="intervention-section">
          <h2>Students Needing Intervention</h2>
          <div className="intervention-dropdown">
            <div className="intervention-header">
              <div className="intervention-summary">
                <span className="intervention-count">{interventionNeeded.length} students need attention</span>
                <div className="priority-counts">
                  <span className="priority-count high">High: {interventionNeeded.filter(item => item.priority === 'High').length}</span>
                  <span className="priority-count medium">Medium: {interventionNeeded.filter(item => item.priority === 'Medium').length}</span>
                  <span className="priority-count low">Low: {interventionNeeded.filter(item => item.priority === 'Low').length}</span>
                </div>
              </div>
              <button 
                className="expand-button"
                onClick={() => setShowAllInterventions(!showAllInterventions)}
              >
                {showAllInterventions ? 'Show Less' : 'Show All'}
              </button>
            </div>
            
            <div className={`intervention-list ${showAllInterventions ? 'expanded' : ''}`}>
              {interventionNeeded.map((item, index) => {
                const masteryPercentage = item.student.performance?.averageMastery 
                  ? (item.student.performance.averageMastery * 100).toFixed(0) 
                  : "N/A";
                const interventionScore = item.student.performance?.interventionScore 
                  ? (item.student.performance.interventionScore * 100).toFixed(0)
                  : "N/A";
                
                return (
                  <div key={index} className={`intervention-item priority-${item.priority.toLowerCase()}`}>
                    <div className="intervention-details">
                      <h3>{item.student.name}</h3>
                      <p>Grade {item.student.grade_level} • {item.classroom.name}</p>
                      <div className="intervention-stats">
                        <div className="stat-item">
                          <span className="stat-label">Mastery:</span>
                          <span className={`stat-value ${masteryPercentage < 80 ? 'below-threshold' : ''}`}>
                            {masteryPercentage}%
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Intervention Score:</span>
                          <span className={`stat-value ${interventionScore < 50 ? 'below-threshold' : ''}`}>
                            {interventionScore}%
                          </span>
                        </div>
                        <div className="intervention-priority">
                          <span className="priority-label">Priority:</span>
                          <span className="priority-value">{item.priority}</span>
                        </div>
                      </div>
                    </div>
                    <div className="intervention-actions">
                      <div className="quick-actions">
                        <button 
                          className="action-button" 
                          title="Assign additional practice"
                          onClick={() => {
                            setSelectedStudentForPractice(item.student);
                            setShowAssignPracticeModal(true);
                          }}
                        >
                          <span className="icon">📝</span>
                        </button>
                        <button 
                          className="action-button" 
                          title="Schedule 1:1 session"
                          onClick={async () => {
                            if (!token || !item.student?.id) {
                              alert("Cannot schedule session. Authentication or student data missing.");
                              return;
                            }
                            if (window.confirm(`Schedule a 1:1 session for ${item.student.name}?`)) {
                              try {
                                const today = new Date();
                                const tomorrow = new Date(today);
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                await axios.post(`/api/students/${item.student.id}/interventions/session`, {
                                  studentId: item.student.id,
                                  dateProposed: tomorrow.toISOString(),
                                  type: '1:1',
                                  reason: `Intervention for ${item.priority} priority issues (Score: ${interventionScore}%)`,
                                  requestedBy: 'teacher'
                                }, { headers: { Authorization: `Bearer ${token}` } });
                                alert(`1:1 Session proposed for ${item.student.name} for tomorrow.`);
                              } catch (err) {
                                console.error('Error scheduling 1:1 session:', err);
                                alert(`Failed to schedule 1:1 session for ${item.student.name}. ${err.response?.data?.message || ''}`);
                              }
                            }
                          }}
                        >
                          <span className="icon">👤</span>
                        </button>
                      </div>
                      <Link to={`/teacher/student/${item.student.id}`} className="button">
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <div className="classrooms-section">
        <div className="section-header">
          <h2>Your Classrooms</h2>
          <button className="add-button" onClick={handleAddClassroomClick}>+ Add Classroom</button>
        </div>
        
        <div className="classrooms-grid">
          {classrooms.map(classroom => {
            const students = classroomPerformance[classroom.id] || [];
            const totalStudents = students.length;
            const interventionsCount = students.filter(s => s.intervention && s.intervention.needed).length;
            
            // Calculate average mastery across all students in the classroom
            let totalMastery = 0;
            let totalMathMastery = 0;
            let studentCount = 0;
            
            students.forEach(student => {
              if (student.performance) {
                if (typeof student.performance.mathMastery === 'number') {
                  totalMathMastery += student.performance.mathMastery;
                  studentCount++;
                } else if (typeof student.performance.averageMastery === 'number') {
                  totalMastery += student.performance.averageMastery;
                  studentCount++;
                }
              }
            });
            
            const mathMastery = studentCount > 0 ? 
              (totalMathMastery > 0 ? totalMathMastery / studentCount : totalMastery / studentCount) : 0;
            
            return (
              <div key={classroom.id} className="classroom-card">
                <h3>{classroom.name}</h3>
                <div className="classroom-stats">
                  <div className="stat">
                    <span className="stat-value">{totalStudents}</span>
                    <span className="stat-label">Students</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{(mathMastery * 100).toFixed(0)}%</span>
                    <span className="stat-label">Math Mastery</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{interventionsCount}</span>
                    <span className="stat-label">Interventions</span>
                  </div>
                </div>
                <Link to={`/teacher/classroom/${classroom.id}`} className="button">
                  View Classroom
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="knowledge-components-section">
        <KnowledgeComponentsOverview />
      </div>

      {/* Conditionally render the Add Classroom Modal */}
      {showAddClassroomModal && (
        <AddClassroomModal
          onClose={handleCloseAddClassroomModal}
          onSuccess={handleAddClassroomSuccess}
        />
      )}

      {/* Conditionally render the Assign Practice Modal (for manual assignment) */}
      {showAssignPracticeModal && selectedStudentForPractice && (
        <AssignPracticeModal
          student={selectedStudentForPractice}
          onClose={() => {
            setShowAssignPracticeModal(false);
            setSelectedStudentForPractice(null);
          }}
          onAssignSuccess={() => {
            // Optionally, refresh data or show a more persistent success message
            setShowAssignPracticeModal(false);
            setSelectedStudentForPractice(null);
          }}
        />
      )}

      {/* Conditionally render the Confirm Assign Modal (for recommended assignment) */}
      {showConfirmAssignModal && (
        <ConfirmAssignModal
          student={dataForConfirmModal.student}
          recommendedItems={dataForConfirmModal.items}
          onClose={() => setShowConfirmAssignModal(false)}
          onConfirmAssign={async (studentId, itemIds, notes) => {
            // API call logic will be inside this modal or passed here
            console.log(`Assigning items ${itemIds.join(', ')} to student ${studentId} with notes: "${notes}"`);
            try {
              await axios.post(`/api/students/${studentId}/assign-practice`, 
                { contentItemIds: itemIds, notes: notes }, // Include notes
                { headers: { Authorization: `Bearer ${token}` } }
              );
              alert('Recommended practice assigned successfully!');
              setShowConfirmAssignModal(false); 
              // Optionally refresh data here
            } catch (err) {
              console.error('Error assigning recommended practice:', err);
              alert(`Error assigning recommended practice: ${err.response?.data?.message || err.message}`);
              // Keep modal open on error? Or close? For now, closing.
              setShowConfirmAssignModal(false); 
            }
          }}
        />
      )}


      {/* --- Content Item Management Section --- */}
      <div className="content-item-section" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
        <h2>Content Authoring</h2>
        {showCiForm ? (
          <ContentItemForm
            itemToEdit={editingCi}
            onSuccess={handleCiFormSuccess}
            onClose={handleCiFormClose}
          />
        ) : (
          <ContentItemList
            onEdit={handleEditCiClick}
            onCreate={handleCreateCiClick}
          />
        )}
      </div>

    </div>
  );
};

export default TeacherDashboard;
