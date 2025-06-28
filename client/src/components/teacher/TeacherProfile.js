import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './TeacherProfile.css';

const TeacherProfile = () => {
    const { user } = useAuth();
    const teacherId = user?.id;

    const [profileData, setProfileData] = useState({
        name: '',
        email: '', // Display only, not editable
        subject_taught: '', // This field might not exist in DB
        gender: '',
        // Add other editable fields like preferences if needed
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [initialData, setInitialData] = useState({}); // To track changes
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!teacherId) {
                setError('Could not identify teacher.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`/api/teachers/${teacherId}`);
                const data = response.data;
                const currentData = {
                    name: data.name || '',
                    email: data.auth_id || '', // Use auth_id for display
                    subject_taught: data.subject_taught || '', // Use field if it exists
                    gender: data.gender || '',
                };
                setProfileData(currentData);
                setInitialData(currentData); // Store initial data for comparison
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(err.response?.data?.error || 'Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [teacherId]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        setSuccess(''); // Clear success message on edit
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            return;
        }
        
        setChangingPassword(true);
        setPasswordError('');
        setPasswordSuccess('');
        
        try {
            const authToken = localStorage.getItem('authToken');
            console.log('[TeacherProfile] Attempting password change with token:', authToken ? authToken.substring(0, 20) + '...' : 'No token');
            
            await axios.put(`/api/teachers/${teacherId}/password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordSection(false);
        } catch (err) {
            console.error('Error changing password:', err);
            setPasswordError(err.response?.data?.error || 'Failed to change password.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        // Prepare only changed data
        const changedData = {};
        Object.keys(profileData).forEach(key => {
            // Only include fields that exist in initialData and have changed
            // Exclude email as it's not editable
            if (key !== 'email' && initialData.hasOwnProperty(key) && profileData[key] !== initialData[key]) {
                changedData[key] = profileData[key];
            }
        });

         if (Object.keys(changedData).length === 0) {
            setSuccess('No changes detected.');
            setSaving(false);
            return;
        }

        try {
            const response = await axios.put(`/api/teachers/${teacherId}`, changedData);
            setSuccess('Profile updated successfully!');
            // Update initial data to reflect saved changes
             const updatedCurrentData = {
                 name: response.data.name || '',
                 email: response.data.auth_id || '',
                 subject_taught: response.data.subject_taught || '',
                 gender: response.data.gender || '',
             };
            setInitialData(updatedCurrentData);
             // Optionally update profileData as well
             setProfileData(prev => ({ ...prev, ...updatedCurrentData }));

        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (error && !profileData.email) { // Show error prominently if profile failed to load initially
         return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div className="teacher-profile">
            <div className="profile-header">
                <h1>🎓 Teacher Profile</h1>
                <p>Manage your account information</p>
            </div>

            <div className="profile-content">
                <form onSubmit={handleSubmit} className="profile-form">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="form-group">
                        <label htmlFor="profile-email">Email (Login ID)</label>
                        <input type="email" id="profile-email" value={profileData.email} disabled readOnly />
                    </div>

                    <div className="form-group">
                        <label htmlFor="profile-name">Name</label>
                        <input 
                            type="text" 
                            id="profile-name" 
                            name="name" 
                            value={profileData.name} 
                            onChange={handleInputChange} 
                            disabled={saving}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="profile-gender">Gender</label>
                        <select
                            id="profile-gender"
                            name="gender"
                            value={profileData.gender}
                            onChange={handleInputChange}
                            disabled={saving}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-button" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <div className="password-section">
                    <div className="password-header">
                        <h3>🔒 Change Password</h3>
                        <button 
                            type="button" 
                            className="toggle-password-btn"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            {showPasswordSection ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {showPasswordSection && (
                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    minLength="6"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    minLength="6"
                                    required
                                />
                            </div>

                            {passwordError && <div className="error-message">{passwordError}</div>}
                            {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                            <div className="form-actions">
                                <button type="submit" className="save-button" disabled={changingPassword}>
                                    {changingPassword ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherProfile;