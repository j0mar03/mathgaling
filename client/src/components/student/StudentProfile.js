import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './StudentProfile.css'; // Import CSS file

const StudentProfile = () => {
    const { user } = useAuth();
    const studentId = user?.id;

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        grade_level: '',
        language_preference: '',
        age: '',
        avatar: '👤', // Default avatar emoji
        favorite_color: '#4a90e2', // Default favorite color
        achievements: [], // Array to store achievements
    });
    const [initialData, setInitialData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Available avatars for selection
    const availableAvatars = ['👤', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🦸', '🦸‍♂️', '🦸‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️'];

    useEffect(() => {
        const fetchProfile = async () => {
            if (!studentId) {
                setError('Could not identify student.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`/api/students/${studentId}`);
                const data = response.data;
                setProfileData({
                    name: data.name || '',
                    email: data.auth_id || '',
                    grade_level: data.grade_level || '',
                    language_preference: data.language_preference || 'English',
                    age: data.age || '',
                    avatar: data.avatar || '👤',
                    favorite_color: data.favorite_color || '#4a90e2',
                    achievements: data.achievements || [],
                });
                setInitialData({
                    name: data.name || '',
                    grade_level: data.grade_level || '',
                    language_preference: data.language_preference || 'English',
                    age: data.age || '',
                    avatar: data.avatar || '👤',
                    favorite_color: data.favorite_color || '#4a90e2',
                });
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(err.response?.data?.error || 'Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [studentId]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        setSuccess('');
    };

    const handleAvatarSelect = (avatar) => {
        setProfileData(prev => ({ ...prev, avatar }));
        setSuccess('');
    };

    const handleColorSelect = (color) => {
        setProfileData(prev => ({ ...prev, favorite_color: color }));
        setSuccess('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await axios.put(`/api/students/${studentId}`, {
                name: profileData.name,
                grade_level: profileData.grade_level,
                language_preference: profileData.language_preference,
                age: profileData.age,
                avatar: profileData.avatar,
                favorite_color: profileData.favorite_color,
            });
            setSuccess('Profile updated successfully!');
            setInitialData({
                name: profileData.name,
                grade_level: profileData.grade_level,
                language_preference: profileData.language_preference,
                age: profileData.age,
                avatar: profileData.avatar,
                favorite_color: profileData.favorite_color,
            });
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <h2>Loading your profile...</h2>
                <p>Please wait while we get your information.</p>
            </div>
        );
    }

    return (
        <div className="student-profile">
            <div className="profile-header">
                <h1>👤 My Profile</h1>
                <p>Personalize your learning experience!</p>
            </div>

            <div className="profile-content">
                <div className="profile-avatar-section">
                    <h3>Choose Your Avatar</h3>
                    <div className="avatar-grid">
                        {availableAvatars.map((avatar) => (
                            <button
                                key={avatar}
                                className={`avatar-option ${profileData.avatar === avatar ? 'selected' : ''}`}
                                onClick={() => handleAvatarSelect(avatar)}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">Name (Pangalan)</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="age">Age (Edad)</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            min="7"
                            max="15"
                            value={profileData.age}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="grade_level">Grade Level (Antas)</label>
                        <select
                            id="grade_level"
                            name="grade_level"
                            value={profileData.grade_level}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Grade</option>
                            <option value="3">Grade 3</option>
                            <option value="4">Grade 4</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="language_preference">Language Preference (Wika)</label>
                        <select
                            id="language_preference"
                            name="language_preference"
                            value={profileData.language_preference}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="English">English</option>
                            <option value="Filipino">Filipino</option>
                            <option value="Both">Both (English & Filipino)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Favorite Color (Paboritong Kulay)</label>
                        <div className="color-options">
                            {['#4a90e2', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'].map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-option ${profileData.favorite_color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="form-actions">
                        <button type="submit" className="save-button" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentProfile;