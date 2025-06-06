import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both your email and password.');
      setLoading(false);
      return;
    }

    try {
      // Use the login function from AuthContext (which now handles mock logins internally)
      const result = await login(email, password);
      // Safely access properties and provide defaults to avoid undefined errors
      const role = result?.role || 'student';
      navigate(`/${role}`);
    } catch (err) {
      console.log('Login error in component:', err);
      
      // Simple error handling with a default message
      let errorMessage = 'Oops! Something went wrong. Please try again.';
      
      // Try to extract a string error message if available
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (err && err.code === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to Math Tagumpay!</h1>
          <p>Let's start your math adventure!</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
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
              className="child-friendly-input"
            />
          </div>

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
              placeholder="Type your password here"
              required
              disabled={loading}
              className="child-friendly-input"
            />
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? 'Getting Ready...' : 'Start Learning!'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            New to Math Mastery? <Link to="/signup" className="signup-link">Join Us!</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
