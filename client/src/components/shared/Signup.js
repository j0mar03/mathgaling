import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [newClassroom, setNewClassroom] = useState({ name: '' });
  const [validation, setValidation] = useState({
    email: true,
    password: true,
    student_emails: true
  });
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade_level: '',
    subject_taught: '',
    phone_number: '',
    student_emails: ''
  });
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset validation errors when user types
    if (name in validation) {
      setValidation(prev => ({ ...prev, [name]: true }));
    }
    
    // Clear general error message
    if (error) setError('');
  };

  const handleCreateClassroom = () => {
    if (!newClassroom.name) {
      setError('Classroom name is required');
      return;
    }
    
    setAvailableClassrooms(prev => [...prev, { 
      id: `new-${Date.now()}`, 
      name: newClassroom.name,
      isNew: true
    }]);
    setNewClassroom({ name: '' });
  };

  // Validate form before submission
  const validateForm = () => {
    let isValid = true;
    const newValidation = {...validation};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newValidation.email = false;
      isValid = false;
    }
    
    // Password validation (at least 6 characters)
    if (formData.password.length < 6) {
      newValidation.password = false;
      isValid = false;
    }
    
    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      isValid = false;
    }
    
    // Parent-specific validation
    if (userType === 'parent' && formData.student_emails) {
      const emails = formData.student_emails.split(',').map(email => email.trim());
      for (const email of emails) {
        if (email && !emailRegex.test(email)) {
          newValidation.student_emails = false;
          isValid = false;
          break;
        }
      }
    }
    
    setValidation(newValidation);
    return isValid;
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    
    // Form validation
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    const payload = {
      role: userType,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      grade_level: userType === 'student' ? formData.grade_level : undefined,
      subject_taught: userType === 'teacher' ? formData.subject_taught : undefined,
      phone_number: userType === 'parent' ? formData.phone_number : undefined,
      student_emails: userType === 'parent' ? formData.student_emails.split(',').map(email => email.trim()).filter(email => email) : undefined,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      setSuccess(true);
      // Call the signup function from AuthContext
      const signupResponse = await signup(payload);
      
      if (userType === 'teacher' && availableClassrooms.length > 0) {
        // Create new classrooms and associate teacher
        const classroomsToCreate = availableClassrooms.filter(c => c.isNew);
        if (classroomsToCreate.length > 0) {
          try {
            await Promise.all(classroomsToCreate.map(classroom => 
              axios.post('/api/classrooms', {
                name: classroom.name,
                teacher_id: signupResponse.teacher.id
              })
            ));
          } catch (classroomError) {
            console.error("Error creating classrooms:", classroomError);
            // Continue with login even if classroom creation fails
          }
        }
      }

      // After successful signup, automatically log the user in
      try {
        const { user } = await login(formData.email, formData.password);
        // Navigate to the user's dashboard
        navigate(`/${user.role}`);
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
        setError("Account created successfully! Please log in manually.");
        setTimeout(() => navigate('/login'), 3000);
        setLoading(false);
      }
    } catch (err) {
      setSuccess(false);
      console.error("Signup error:", err);
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {success && !error && (
        <div className="success-message">
          <p>Signup successful! Logging you in...</p>
        </div>
      )}
      
      <form onSubmit={handleSignup}>
        {error && <p className="error-message">{error}</p>}
        
        {/* Render the form fields directly */}
        <>
          <div className="form-group">
            <label>Register as:</label>
            <select 
              value={userType} 
              onChange={(e) => setUserType(e.target.value)} 
              disabled={loading}
              className="form-select"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Your Name"
              disabled={loading}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your.email@example.com"
              disabled={loading}
              className={`form-input ${!validation.email ? 'input-error' : ''}`}
            />
            {!validation.email && (
              <small className="error-text">Please enter a valid email address</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="********"
              disabled={loading}
              className={`form-input ${!validation.password ? 'input-error' : ''}`}
            />
            {!validation.password && (
              <small className="error-text">Password must be at least 6 characters</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              placeholder="********"
              disabled={loading}
              className="form-input"
            />
          </div>

          {/* Role-specific fields */}
          {userType === 'student' && (
            <div className="form-group">
              <label htmlFor="grade_level">Grade Level:</label>
              <input
                type="number"
                id="grade_level"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
                required
                placeholder="e.g., 5"
                disabled={loading}
                min="1"
                max="12"
                className="form-input"
              />
            </div>
          )}
          
          {userType === 'teacher' && (
            <>
              <div className="form-group">
                <label htmlFor="subject_taught">Subject Taught:</label>
                <input
                  type="text"
                  id="subject_taught"
                  name="subject_taught"
                  value={formData.subject_taught}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="teacher-classroom-setup">
                <h4>Create Classrooms (Optional)</h4>
                 <div className="create-classroom">
                   <div className="classroom-input-group">
                     <input
                       type="text"
                       placeholder="Enter classroom name"
                       value={newClassroom.name}
                       onChange={(e) => setNewClassroom({ name: e.target.value })}
                       disabled={loading}
                       className="form-input"
                     />
                     <button
                       type="button"
                       onClick={handleCreateClassroom}
                       disabled={loading || !newClassroom.name}
                       className="classroom-button"
                     >
                       Add Classroom
                     </button>
                   </div>
                 </div>
                 {availableClassrooms.length > 0 && (
                   <div className="classroom-list">
                     <h5>Added Classrooms:</h5>
                     <ul>
                       {availableClassrooms.map((classroom, index) => (
                         <li key={classroom.id || index}>
                           {classroom.name}
                           <button 
                             type="button" 
                             className="remove-button"
                             onClick={() => setAvailableClassrooms(
                               prev => prev.filter((_, i) => i !== index)
                             )}
                           >
                             ✕
                           </button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
              </div>
            </>
          )}
          
          {userType === 'parent' && (
            <>
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number:</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student_emails">Student Email(s):</label>
                <input
                  type="text"
                  id="student_emails"
                  name="student_emails"
                  value={formData.student_emails}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter student email(s), comma-separated"
                  disabled={loading}
                  className={`form-input ${!validation.student_emails ? 'input-error' : ''}`}
                />
                {!validation.student_emails ? (
                  <small className="error-text">Please enter valid email addresses</small>
                ) : (
                  <small>Enter the email address(es) of the student(s) you wish to link.</small>
                )}
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </>
      </form>
      <p className="login-link">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;
