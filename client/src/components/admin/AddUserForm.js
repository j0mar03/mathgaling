import React, { useState } from 'react';
import axios from 'axios';

const AddUserForm = ({ onUserAdded, onCancel }) => {
    const [formData, setFormData] = useState({
        role: 'student', // Default role
        name: '',
        username: '', // For students
        email: '', // Will be used as auth_id
        password: '',
        grade_level: '',
        subject_taught: '',
        phone_number: ''
    });
    const [useUsername, setUseUsername] = useState(true); // Default to username for students
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        const { role, name, username, email, password, ...otherData } = formData;

        // Basic validation
        if (!role || !name || !password) {
            setError('Role, Name, and Password are required.');
            setLoading(false);
            return;
        }
        
        // Validate login credential based on role and preference
        if (role === 'student' && useUsername) {
            if (!username) {
                setError('Username is required for student accounts.');
                setLoading(false);
                return;
            }
        } else {
            if (!email) {
                setError('Email is required.');
                setLoading(false);
                return;
            }
        }

        let payload = {
            role,
            name,
            password,
            // Include role-specific fields only if they are relevant and have values
            ...(role === 'student' && otherData.grade_level && { grade_level: otherData.grade_level }),
            ...(role === 'teacher' && otherData.subject_taught && { subject_taught: otherData.subject_taught }),
            ...(role === 'parent' && otherData.phone_number && { phone_number: otherData.phone_number }),
        };
        
        // Set login credential based on role and preference
        if (role === 'student' && useUsername && username) {
            payload.username = username;
            payload.email = `${username}@student.mathtagumpay.com`; // Auto-generate email
        } else {
            payload.email = email;
        }

        try {
            // Token is automatically included by axios defaults set in AuthContext
            const response = await axios.post('/api/admin/users', payload);
            console.log('User created:', response.data);
            onUserAdded(); // Callback to refresh user list and close form
        } catch (err) {
            console.error("Error creating user:", err);
            setError(err.response?.data?.error || 'Failed to create user.');
            setLoading(false); // Keep form open on error
        }
        // Don't setLoading(false) on success, as the component will likely unmount
    };

    return (
        <div className="add-user-form-container">
            <h3>Add New User</h3>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select id="role" name="role" value={formData.role} onChange={handleInputChange} disabled={loading} required>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={loading} required />
                </div>

                {/* Login Credential Field - depends on role */}
                {formData.role === 'student' ? (
                    <>
                        <div className="form-group">
                            <label>Login Method:</label>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        checked={useUsername}
                                        onChange={() => setUseUsername(true)}
                                        disabled={loading}
                                    />
                                    Username (Recommended)
                                </label>
                                <label style={{marginLeft: '15px'}}>
                                    <input
                                        type="radio"
                                        checked={!useUsername}
                                        onChange={() => setUseUsername(false)}
                                        disabled={loading}
                                    />
                                    Email
                                </label>
                            </div>
                        </div>
                        
                        {useUsername ? (
                            <div className="form-group">
                                <label htmlFor="username">Username:</label>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleInputChange} 
                                    disabled={loading} 
                                    required
                                    pattern="[a-zA-Z0-9]+"
                                    title="Username can only contain letters and numbers"
                                />
                                <small>Student will log in with this username. Email will be auto-generated.</small>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={loading} required />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="form-group">
                        <label htmlFor="email">Email (Login ID):</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={loading} required />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} disabled={loading} required />
                </div>

                {/* Role-specific fields */}
                {formData.role === 'student' && (
                    <div className="form-group">
                        <label htmlFor="grade_level">Grade Level:</label>
                        <input type="number" id="grade_level" name="grade_level" value={formData.grade_level} onChange={handleInputChange} disabled={loading} required /> {/* Added required */}
                    </div>
                )}
                {formData.role === 'teacher' && (
                    <div className="form-group">
                        <label htmlFor="subject_taught">Subject Taught:</label>
                        <input type="text" id="subject_taught" name="subject_taught" value={formData.subject_taught} onChange={handleInputChange} disabled={loading} />
                    </div>
                )}
                {formData.role === 'parent' && (
                    <div className="form-group">
                        <label htmlFor="phone_number">Phone Number:</label>
                        <input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} disabled={loading} />
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddUserForm;