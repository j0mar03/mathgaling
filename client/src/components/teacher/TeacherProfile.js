import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TeacherProfile = () => {
    const { user } = useAuth();
    const teacherId = user?.id;

    const [profileData, setProfileData] = useState({
        name: '',
        email: '', // Display only, not editable
        subject_taught: '', // This field might not exist in DB
        // Add other editable fields like preferences if needed
    });
    const [initialData, setInitialData] = useState({}); // To track changes
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
            <h2>My Profile</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}

                <div className="form-group">
                    <label htmlFor="profile-email">Email (Login ID):</label>
                    <input type="email" id="profile-email" value={profileData.email} disabled readOnly />
                </div>

                <div className="form-group">
                    <label htmlFor="profile-name">Name:</label>
                    <input type="text" id="profile-name" name="name" value={profileData.name} onChange={handleInputChange} disabled={saving} />
                </div>

                {/* Add other editable fields here if they exist in the model/DB */}
                 <div className="form-group">
                    <label htmlFor="profile-subject_taught">Subject Taught: (N/A in DB)</label>
                    {/* If subject_taught is added to DB later, enable this input */}
                    {/* <input type="text" id="profile-subject_taught" name="subject_taught" value={profileData.subject_taught} onChange={handleInputChange} disabled={saving} /> */}
                </div>


                <button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default TeacherProfile;