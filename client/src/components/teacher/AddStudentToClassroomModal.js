import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AddStudentToClassroomModal.css';

const AddStudentToClassroomModal = ({ onClose, onSuccess, classroomId, classroomName }) => {
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (classroomId && token) {
      fetchAvailableStudents();
    }
  }, [classroomId, token]);

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch all students
      const studentsResponse = await axios.get('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch students already in this classroom
      const classroomStudentsResponse = await axios.get(`/api/classrooms/${classroomId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[AddStudentModal] All students:', studentsResponse.data);
      console.log('[AddStudentModal] Classroom students:', classroomStudentsResponse.data);
      
      // Handle different response formats - check if the response has a nested structure
      const classroomStudents = classroomStudentsResponse.data || [];
      const classroomStudentIds = classroomStudents.map(item => {
        // Handle both formats: direct student object or nested in a student property
        return item.student ? item.student.id : item.id;
      });
      
      const available = studentsResponse.data.filter(student => 
        !classroomStudentIds.includes(student.id)
      );
      
      console.log('[AddStudentModal] Available students:', available);
      
      setAvailableStudents(available);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching available students:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Provide more specific error messages
      if (err.response?.status === 404) {
        setError('Students endpoint not found. Please ensure the API is properly configured.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'Failed to load available students. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to add');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await axios.post(`/api/classrooms/${classroomId}/students`, {
        studentIds: selectedStudents
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Successfully added ${selectedStudents.length} student(s) to ${classroomName}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding students:', err);
      setError(err.response?.data?.error || 'Failed to add students. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.auth_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade_level.toString().includes(searchTerm)
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content add-student-modal">
        <div className="modal-header">
          <h2>Add Students to {classroomName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading available students...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : availableStudents.length === 0 ? (
            <div className="no-students">
              <p>No available students found.</p>
              <p>All students are already enrolled in this classroom.</p>
            </div>
          ) : (
            <>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by name, email, or grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {filteredStudents.length > 0 && (
                  <button 
                    className="select-all-button"
                    onClick={handleSelectAll}
                  >
                    {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              <div className="students-list">
                {filteredStudents.length === 0 ? (
                  <p className="no-results">No students match your search.</p>
                ) : (
                  filteredStudents.map(student => (
                    <div 
                      key={student.id} 
                      className={`student-item ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
                      onClick={() => handleToggleStudent(student.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="student-info">
                        <span className="student-name">{student.name}</span>
                        <span className="student-details">
                          Grade {student.grade_level} • {student.auth_id}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedStudents.length > 0 && (
                <div className="selection-summary">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="button secondary" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="button primary" 
            onClick={handleAddStudents}
            disabled={isProcessing || selectedStudents.length === 0}
          >
            {isProcessing ? 'Adding...' : `Add ${selectedStudents.length || ''} Student${selectedStudents.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentToClassroomModal;