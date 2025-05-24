import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AddClassroomModal.css';
const AddClassroomModal = ({ onClose, onSuccess }) => {
  const [classroomName, setClassroomName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]); // State for student list
  const [selectedStudentIds, setSelectedStudentIds] = useState([]); // State for selected students
  const [loadingStudents, setLoadingStudents] = useState(true); // State for loading students
  const { user, token } = useAuth(); // Get user and token

  // Fetch eligible students when the modal mounts
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setError(null); // Clear previous errors
      try {
        // Use the new backend endpoint
        const response = await axios.get('/api/teachers/eligible-students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEligibleStudents(response.data);
      } catch (err) {
        console.error('Error fetching eligible students:', err);
        setError('Failed to load student list. Please try closing and reopening the modal.');
        // Keep modal open, but indicate student loading failed
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []); // Empty dependency array means run once on mount

  const handleStudentSelectionChange = (studentId) => {
    setSelectedStudentIds(prevSelected =>
      prevSelected.includes(studentId)
        ? prevSelected.filter(id => id !== studentId) // Remove if already selected
        : [...prevSelected, studentId] // Add if not selected
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classroomName.trim()) {
      setError('Classroom name cannot be empty.');
      return;
    }
    if (!user || !user.id) {
        setError('Could not identify teacher. Please log in again.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('[AddClassroom] Attempting to create classroom with data:', {
        name: classroomName.trim(),
        description: description.trim() || `${classroomName.trim()} - Created by ${user.name || 'Teacher'}`,
        teacher_id: user.id,
        studentIds: selectedStudentIds,
      });
      
      const response = await axios.post(`/api/teachers/classrooms`, {
        name: classroomName.trim(),
        description: description.trim() || `${classroomName.trim()} - Created by ${user.name || 'Teacher'}`,
        teacher_id: user.id, // Add the teacher_id that the API expects
        studentIds: selectedStudentIds, // Send the array of selected student IDs
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[AddClassroom] Response received:', response);
      
      // Call the onSuccess callback passed from the parent (TeacherDashboard)
      // with the newly created classroom data
      onSuccess(response.data.classroom || response.data);

    } catch (err) {
      console.error('[AddClassroom] Full error object:', err);
      console.error('[AddClassroom] Error response:', err.response);
      console.error('[AddClassroom] Error response data:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create classroom. Please try again.');
      setIsSubmitting(false); // Keep modal open on error
    }
    // No finally block needed here as onSuccess should handle closing
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content create-classroom-modal">
        <div className="modal-header">
          <h2>Create New Classroom</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="classroom-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-section">
            <h3>Classroom Information</h3>
            
            <div className="form-group">
              <label htmlFor="classroomName">Classroom Name *</label>
              <input
                type="text"
                id="classroomName"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                placeholder="e.g., Grade 3 - Section A"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the classroom..."
                rows="3"
                disabled={isSubmitting}
              />
              <small>Optional - A brief description to help identify this classroom</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Add Students (Optional)</h3>
            {loadingStudents ? (
              <div className="loading-message">
                <span>⏳</span> Loading available students...
              </div>
            ) : eligibleStudents.length === 0 ? (
              <div className="info-message">
                <span>ℹ️</span> No students available to enroll. You can add students later.
              </div>
            ) : (
              <>
                <p>Select students to enroll in this classroom:</p>
                <div className="student-grid">
                  {eligibleStudents.map(student => (
                    <div key={student.id} className="student-checkbox-item">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => handleStudentSelectionChange(student.id)}
                        disabled={isSubmitting}
                      />
                      <label htmlFor={`student-${student.id}`}>
                        <span className="student-name">{student.name}</span>
                        <span className="student-grade">Grade {student.grade_level}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {selectedStudentIds.length > 0 && (
                  <div className="selected-count">
                    <span>📝</span> {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </>
            )}
          </div>

          {(classroomName.trim() || selectedStudentIds.length > 0) && (
            <div className="form-section">
              <h3>Preview</h3>
              <div className="classroom-preview">
                <div className="preview-header">
                  <span className="preview-icon">🏫</span>
                  <div>
                    <div className="preview-name">{classroomName.trim() || 'New Classroom'}</div>
                    <div className="preview-description">
                      {description.trim() || `${classroomName.trim()} - Created by ${user?.name || 'Teacher'}`}
                    </div>
                  </div>
                </div>
                {selectedStudentIds.length > 0 && (
                  <div className="preview-students">
                    <strong>Students to be enrolled:</strong>
                    <div className="preview-student-list">
                      {selectedStudentIds.map(id => {
                        const student = eligibleStudents.find(s => s.id === id);
                        return student ? (
                          <span key={id} className="preview-student-tag">
                            {student.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="submit-button">
              {isSubmitting ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassroomModal;