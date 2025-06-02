import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginImproved.css';

const LoginImproved = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { 
      id: 'student', 
      title: "I'm a Student", 
      icon: '🎒', 
      color: '#4ECDC4',
      description: 'Learn math the fun way!'
    },
    { 
      id: 'teacher', 
      title: "I'm a Teacher", 
      icon: '👨‍🏫', 
      color: '#FF6B6B',
      description: 'Manage your classroom'
    },
    { 
      id: 'parent', 
      title: "I'm a Parent", 
      icon: '👪', 
      color: '#45B7D1',
      description: 'Track your child\'s progress'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    // Clear form fields when switching roles
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate based on role
    if (selectedRole === 'student') {
      if (!username || !password) {
        setError('Please enter your username and password! 😊');
        setLoading(false);
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please enter your email and password.');
        setLoading(false);
        return;
      }
    }

    try {
      // For students, pass username; for others, pass email
      const loginCredential = selectedRole === 'student' ? username : email;
      const isStudent = selectedRole === 'student';
      
      const result = await login(loginCredential, password, isStudent);
      const role = result?.role || 'student';
      
      // Verify the logged-in role matches the selected role
      if (role !== selectedRole) {
        setError(`This account is registered as a ${role}. Please select the correct role.`);
        setLoading(false);
        return;
      }
      
      navigate(`/${role}`);
    } catch (err) {
      console.log('Login error:', err);
      
      // Role-specific error messages
      let errorMessage = 'Oops! Something went wrong. Please try again.';
      
      if (selectedRole === 'student') {
        errorMessage = "Oops! We couldn't find your account. Ask your teacher for help! 🤔";
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    // In a real app, this would open a modal or navigate to forgot password page
    alert('Please contact your administrator to reset your password.');
  };

  return (
    <div className="login-improved-container">
      <div className="login-improved-card">
        <div className="login-improved-header">
          <img src="/logo.png" alt="Math Tagumpay Logo" className="login-logo" />
          <h1>Welcome to Math Tagumpay!</h1>
          <p>Your Intelligent Math Learning System</p>
        </div>

        {!selectedRole ? (
          // Role Selection Screen
          <div className="role-selection">
            <h2>Who are you?</h2>
            <p className="role-instruction">Click on your role to continue</p>
            
            <div className="role-buttons">
              {roles.map(role => (
                <button
                  key={role.id}
                  className="role-button"
                  onClick={() => handleRoleSelect(role.id)}
                  style={{ '--role-color': role.color }}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-title">{role.title}</span>
                  <span className="role-description">{role.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Login Form
          <div className="login-form-container">
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
              <h2>{roles.find(r => r.id === selectedRole)?.title}</h2>
            </div>

            <form className="login-improved-form" onSubmit={handleSubmit}>
              {selectedRole === 'student' ? (
                // Student Login Fields
                <div className="form-group">
                  <label htmlFor="username">
                    <span className="label-icon">👤</span>
                    Your Username:
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Type your username here"
                    required
                    disabled={loading}
                    className="friendly-input student-input"
                    autoComplete="username"
                  />
                  <span className="input-hint">Ask your teacher if you forgot!</span>
                </div>
              ) : (
                // Teacher/Parent Email Field
                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">📧</span>
                    Your Email:
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Type your email here"
                    required
                    disabled={loading}
                    className="friendly-input"
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">
                  <span className="label-icon">🔑</span>
                  Your Password:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={selectedRole === 'student' ? 'Type your secret code' : 'Type your password here'}
                  required
                  disabled={loading}
                  className="friendly-input"
                  autoComplete="current-password"
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
                className="login-button-improved" 
                disabled={loading}
                style={{ 
                  backgroundColor: roles.find(r => r.id === selectedRole)?.color 
                }}
              >
                {loading ? 'Getting Ready...' : 
                 selectedRole === 'student' ? 'Start Learning! 🚀' : 'Sign In'}
              </button>

              {selectedRole !== 'student' && (
                <button 
                  type="button"
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              )}
            </form>
          </div>
        )}

        <div className="login-improved-footer">
          <p>
            New to Math Tagumpay? 
            <Link to="/signup" className="signup-link-improved">
              Join Us!
            </Link>
          </p>
        </div>

        {/* Quick Login Helper for Students */}
        {selectedRole === 'student' && (
          <div className="student-help">
            <p className="help-text">
              <span className="help-icon">💡</span>
              Need help? Ask your teacher or click the help button!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginImproved;