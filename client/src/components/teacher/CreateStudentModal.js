import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './CreateStudentModal.css';

const CreateStudentModal = ({ onClose, onSuccess, classroomId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    grade_level: '3',
    gender: 'Other',
    birthdate: '',
    parentEmail: '',
    learningStyle: 'visual',
    specialNeeds: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const generateEmail = () => {
    const firstName = formData.name.split(' ')[0].toLowerCase();
    const randomNum = Math.floor(Math.random() * 9999);
    const email = `${firstName}${randomNum}@mathgaling.student`;
    setFormData(prev => ({ ...prev, email }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First create the student account
      const signupResponse = await axios.post('/api/auth/register/student', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        grade_level: parseInt(formData.grade_level)
      });

      if (!signupResponse.data.student) {
        throw new Error('Failed to create student account');
      }

      const studentId = signupResponse.data.student.id;

      // If classroomId is provided, add student to classroom
      if (classroomId) {
        await axios.post(`/api/classrooms/${classroomId}/students`, {
          student_ids: [studentId]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Create parent link if parent email provided
      if (formData.parentEmail) {
        try {
          await axios.post('/api/parent-student-links', {
            student_id: studentId,
            parent_email: formData.parentEmail
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (parentErr) {
          console.error('Failed to link parent:', parentErr);
          // Don't fail the whole operation if parent linking fails
        }
      }

      // Create initial learning profile
      if (formData.learningStyle || formData.specialNeeds) {
        try {
          await axios.post(`/api/students/${studentId}/profile`, {
            learning_style: formData.learningStyle,
            special_needs: formData.specialNeeds,
            birthdate: formData.birthdate,
            gender: formData.gender
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (profileErr) {
          console.error('Failed to create learning profile:', profileErr);
          // Don't fail if profile creation fails
        }
      }

      onSuccess({
        ...signupResponse.data.student,
        credentials: {
          email: formData.email,
          password: formData.password
        }
      });
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err.response?.data?.message || 'Failed to create student');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content create-student-modal">
        <div className="modal-header">
          <h2>Create New Student Account</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Student Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Juan dela Cruz"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grade_level">Grade Level *</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  required
                >
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthdate">Birthdate</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Account Credentials</h3>
            
            <div className="form-group">
              <label htmlFor="email">Email/Username *</label>
              <div className="input-with-button">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="student@example.com"
                />
                <button type="button" onClick={generateEmail} className="generate-btn">
                  Generate
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 6 characters"
                />
                <button type="button" onClick={generatePassword} className="generate-btn">
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Learning Profile (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="parentEmail">Parent Email</label>
              <input
                type="email"
                id="parentEmail"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                placeholder="parent@example.com"
              />
              <small>If provided, parent will receive login credentials</small>
            </div>

            <div className="form-group">
              <label htmlFor="learningStyle">Learning Style</label>
              <select
                id="learningStyle"
                name="learningStyle"
                value={formData.learningStyle}
                onChange={handleChange}
              >
                <option value="visual">Visual Learner</option>
                <option value="auditory">Auditory Learner</option>
                <option value="kinesthetic">Kinesthetic Learner</option>
                <option value="reading">Reading/Writing Learner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="specialNeeds">Special Needs / Notes</label>
              <textarea
                id="specialNeeds"
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleChange}
                rows="3"
                placeholder="Any special accommodations or notes..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Student Account'}
            </button>
          </div>

          {formData.email && formData.password && (
            <div className="credentials-preview">
              <h4>Login Credentials Preview:</h4>
              <div className="credential-item">
                <span>Email:</span> {formData.email}
              </div>
              <div className="credential-item">
                <span>Password:</span> {formData.password}
              </div>
              <small>Make sure to save these credentials!</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateStudentModal;