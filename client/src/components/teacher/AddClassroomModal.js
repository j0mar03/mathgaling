import React, { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './TeacherDashboard.css'; // Reuse styles or create a new CSS file if needed
// Removed non-existent CSS import: import './AddClassroomModal.css';
const AddClassroomModal = ({ onClose, onSuccess }) => {
  const [classroomName, setClassroomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]); // State for student list
  const [selectedStudentIds, setSelectedStudentIds] = useState([]); // State for selected students
  const [loadingStudents, setLoadingStudents] = useState(true); // State for loading students
  const { user } = useAuth(); // Get user to extract teacherId

  // Fetch eligible students when the modal mounts
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setError(null); // Clear previous errors
      try {
        // Use the new backend endpoint
        const response = await axios.get('/api/teachers/eligible-students');
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
      // Assuming the endpoint requires the teacherId in the URL
      // Adjust endpoint if needed - assuming it uses authenticated user ID implicitly now
      // Send selectedStudentIds along with the name
      const response = await axios.post(`/api/teachers/classrooms`, { // Endpoint might not need teacherId if using auth
        name: classroomName.trim(),
        studentIds: selectedStudentIds, // Send the array of selected student IDs
      });

      // Call the onSuccess callback passed from the parent (TeacherDashboard)
      // with the newly created classroom data
      onSuccess(response.data);

    } catch (err) {
      console.error('Error creating classroom:', err);
      setError(err.response?.data?.error || 'Failed to create classroom. Please try again.');
      setIsSubmitting(false); // Keep modal open on error
    }
    // No finally block needed here as onSuccess should handle closing
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Create New Classroom</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="classroomName">Classroom Name:</label>
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

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="button secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || loadingStudents} className="button primary">
              {isSubmitting ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>

        {/* Student Selection Section */}
        <div className="student-selection-section">
          <h3>Enroll Students (Optional)</h3>
          {loadingStudents ? (
            <p>Loading students...</p>
          ) : error ? (
             <div className="error-message">{error}</div>
          ) : eligibleStudents.length === 0 ? (
            <p>No students available to enroll.</p>
          ) : (
            <div className="student-list">
              {eligibleStudents.map(student => (
                <div key={student.id} className="student-item">
                  <input
                    type="checkbox"
                    id={`student-${student.id}`}
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => handleStudentSelectionChange(student.id)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor={`student-${student.id}`}>
                    {student.name} (Grade {student.grade_level})
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddClassroomModal;