import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './SignupImproved.css';

function SignupImproved() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [showClassCodeInput, setShowClassCodeInput] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Student fields
    username: '',
    grade_level: '',
    parentEmail: '',
    
    // Teacher fields
    subject_taught: '',
    school_name: '',
    
    // Parent fields
    phone_number: '',
    childUsername: ''
  });
  
  const roles = [
    { 
      id: 'student', 
      title: "I'm a Student", 
      icon: '🎒', 
      color: '#4ECDC4',
      description: 'Join your classroom and start learning!'
    },
    { 
      id: 'teacher', 
      title: "I'm a Teacher", 
      icon: '👨‍🏫', 
      color: '#FF6B6B',
      description: 'Create and manage your classroom'
    },
    { 
      id: 'parent', 
      title: "I'm a Parent", 
      icon: '👪', 
      color: '#45B7D1',
      description: 'Monitor your child\'s progress'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    // Reset form when switching roles
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      grade_level: '',
      parentEmail: '',
      subject_taught: '',
      school_name: '',
      phone_number: '',
      childUsername: ''
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    // Common validations
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Role-specific validations
    if (selectedRole === 'student') {
      if (!formData.username.trim()) {
        setError('Please choose a username');
        return false;
      }
      if (!formData.grade_level) {
        setError('Please select your grade level');
        return false;
      }
      if (showClassCodeInput && !classCode.trim()) {
        setError('Please enter your class code');
        return false;
      }
    } else {
      // Teacher and Parent need email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    if (selectedRole === 'parent' && formData.childUsername) {
      if (!formData.childUsername.trim()) {
        setError('Please enter your child\'s username');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      let signupData = {
        name: formData.name,
        password: formData.password,
        role: selectedRole
      };

      // Role-specific data
      if (selectedRole === 'student') {
        signupData.username = formData.username;
        signupData.email = `${formData.username}@student.mathgaling.com`; // Generate email from username
        signupData.grade_level = parseInt(formData.grade_level);
        if (formData.parentEmail) {
          signupData.parent_email = formData.parentEmail;
        }
        if (classCode) {
          signupData.class_code = classCode;
        }
      } else if (selectedRole === 'teacher') {
        signupData.email = formData.email;
        signupData.subject_taught = formData.subject_taught || 'Mathematics';
        signupData.school_name = formData.school_name;
      } else if (selectedRole === 'parent') {
        signupData.email = formData.email;
        signupData.phone_number = formData.phone_number;
        if (formData.childUsername) {
          signupData.child_username = formData.childUsername;
        }
      }

      // Call signup API
      await signup(signupData);
      
      setSuccess(true);
      
      // Auto-login after successful signup
      setTimeout(async () => {
        try {
          const loginId = selectedRole === 'student' ? signupData.username : signupData.email;
          const isStudent = selectedRole === 'student';
          await login(loginId, formData.password, isStudent);
          navigate(`/${selectedRole}`);
        } catch (loginErr) {
          // If auto-login fails, redirect to login page
          navigate('/login');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="signup-improved-container">
        <div className="signup-improved-card success-card">
          <div className="success-content">
            <span className="success-icon">🎉</span>
            <h2>Welcome to Mathgaling!</h2>
            <p>Your account has been created successfully.</p>
            <p className="redirect-text">Redirecting you to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-improved-container">
      <div className="signup-improved-card">
        <div className="signup-improved-header">
          <h1>Join MathGaling! 🚀</h1>
          <p>Start your math learning journey today</p>
        </div>

        {!selectedRole ? (
          // Role Selection
          <div className="role-selection">
            <h2>Who are you?</h2>
            <p className="role-instruction">Select your role to get started</p>
            
            <div className="role-buttons">
              {roles.map(role => (
                <button
                  key={role.id}
                  className="role-button"
                  onClick={() => handleRoleSelect(role.id)}
                  style={{ '--role-color': role.color }}
                  type="button"
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-title">{role.title}</span>
                  <span className="role-description">{role.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Registration Form
          <div className="signup-form-container">
            <button 
              className="back-button" 
              onClick={() => setSelectedRole(null)}
              type="button"
            >
              ← Change Role
            </button>

            <div className="selected-role-header">
              <span className="selected-role-icon">
                {roles.find(r => r.id === selectedRole)?.icon}
              </span>
              <h2>Sign up as {roles.find(r => r.id === selectedRole)?.title.substring(4)}</h2>
            </div>

            <form onSubmit={handleSubmit} className="signup-improved-form">
              {/* Common Fields */}
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-icon">😊</span>
                  Your Name:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                  className="friendly-input"
                />
              </div>

              {/* Student-specific fields */}
              {selectedRole === 'student' && (
                <>
                  <div className="form-group">
                    <label htmlFor="username">
                      <span className="label-icon">👤</span>
                      Choose a Username:
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Pick a cool username!"
                      required
                      disabled={loading}
                      className="friendly-input student-input"
                    />
                    <span className="input-hint">You'll use this to log in</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="grade_level">
                      <span className="label-icon">📚</span>
                      Your Grade Level:
                    </label>
                    <select
                      id="grade_level"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="friendly-input student-input"
                    >
                      <option value="">Select your grade</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="parentEmail">
                      <span className="label-icon">👪</span>
                      Parent's Email (Optional):
                    </label>
                    <input
                      type="email"
                      id="parentEmail"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      placeholder="Your parent's email (if they want updates)"
                      disabled={loading}
                      className="friendly-input"
                    />
                  </div>

                  <div className="class-code-section">
                    <button
                      type="button"
                      className="class-code-toggle"
                      onClick={() => setShowClassCodeInput(!showClassCodeInput)}
                    >
                      {showClassCodeInput ? '− Hide' : '+ Have'} Class Code?
                    </button>
                    
                    {showClassCodeInput && (
                      <div className="form-group">
                        <input
                          type="text"
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value)}
                          placeholder="Enter your teacher's class code"
                          className="friendly-input class-code-input"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Teacher-specific fields */}
              {selectedRole === 'teacher' && (
                <>
                  <div className="form-group">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      Your Email:
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@school.com"
                      required
                      disabled={loading}
                      className="friendly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="school_name">
                      <span className="label-icon">🏫</span>
                      School Name (Optional):
                    </label>
                    <input
                      type="text"
                      id="school_name"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleInputChange}
                      placeholder="Your school's name"
                      disabled={loading}
                      className="friendly-input"
                    />
                  </div>
                </>
              )}

              {/* Parent-specific fields */}
              {selectedRole === 'parent' && (
                <>
                  <div className="form-group">
                    <label htmlFor="email">
                      <span className="label-icon">📧</span>
                      Your Email:
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      disabled={loading}
                      className="friendly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone_number">
                      <span className="label-icon">📱</span>
                      Phone Number (Optional):
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Your contact number"
                      disabled={loading}
                      className="friendly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="childUsername">
                      <span className="label-icon">👶</span>
                      Child's Username (Optional):
                    </label>
                    <input
                      type="text"
                      id="childUsername"
                      name="childUsername"
                      value={formData.childUsername}
                      onChange={handleInputChange}
                      placeholder="Your child's MathGaling username"
                      disabled={loading}
                      className="friendly-input"
                    />
                    <span className="input-hint">You can link to your child's account later</span>
                  </div>
                </>
              )}

              {/* Password fields for all roles */}
              <div className="form-group">
                <label htmlFor="password">
                  <span className="label-icon">🔐</span>
                  Create Password:
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={selectedRole === 'student' ? 'Create a secret code' : 'Create a strong password'}
                  required
                  disabled={loading}
                  className="friendly-input"
                  minLength="6"
                />
                {selectedRole === 'student' && (
                  <span className="input-hint">At least 6 characters - remember it!</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <span className="label-icon">🔐</span>
                  Confirm Password:
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Type your password again"
                  required
                  disabled={loading}
                  className="friendly-input"
                />
              </div>

              {error && (
                <div className="error-message-improved">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="signup-button-improved" 
                disabled={loading}
                style={{ 
                  backgroundColor: roles.find(r => r.id === selectedRole)?.color 
                }}
              >
                {loading ? 'Creating Account...' : 
                 selectedRole === 'student' ? 'Start Learning! 🎉' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        <div className="signup-improved-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="login-link-improved">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupImproved;