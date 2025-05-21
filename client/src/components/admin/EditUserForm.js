import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditUserForm = ({ userToEdit, onUserUpdated, onCancel }) => {
    // Initialize form data with the user being edited
    const [formData, setFormData] = useState({
        name: '',
        grade_level: '',
        subject_taught: '',
        phone_number: ''
        // Exclude role, email, password as they are not editable here
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-fill form when userToEdit changes
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                grade_level: userToEdit.grade_level || '',
                subject_taught: userToEdit.subject_taught || '', // This field might not exist
                phone_number: userToEdit.phone_number || '' // This field might not exist
            });
        }
    }, [userToEdit]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        if (!userToEdit) {
            setError('No user selected for editing.');
            setLoading(false);
            return;
        }

        const { role, id } = userToEdit;
        const payload = {
            name: formData.name,
            // Include role-specific fields only if they are relevant and have values
            ...(role === 'student' && formData.grade_level && { grade_level: formData.grade_level }),
            // subject_taught and phone_number might not exist in DB, handle gracefully or add them
            ...(role === 'teacher' && formData.subject_taught && { subject_taught: formData.subject_taught }),
            ...(role === 'parent' && formData.phone_number && { phone_number: formData.phone_number }),
        };

        // Remove undefined/empty fields from payload if necessary
        Object.keys(payload).forEach(key => (payload[key] === '' || payload[key] === undefined) && delete payload[key]);


        try {
            // Token is automatically included by axios defaults set in AuthContext
            const response = await axios.put(`/api/admin/users/${role}/${id}`, payload);
            console.log('User updated:', response.data);
            onUserUpdated(); // Callback to refresh user list and close form
        } catch (err) {
            console.error("Error updating user:", err);
            setError(err.response?.data?.error || 'Failed to update user.');
            setLoading(false); // Keep form open on error
        }
         // Don't setLoading(false) on success, as the component will likely unmount
    };

    if (!userToEdit) return null; // Don't render if no user is selected

    return (
        <div className="edit-user-form-container">
            <h3>Edit User: {userToEdit.name} ({userToEdit.role})</h3>
            <p>Email/ID: {userToEdit.auth_id} (Cannot be changed)</p>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="form-group">
                    <label htmlFor="edit-name">Name:</label>
                    <input type="text" id="edit-name" name="name" value={formData.name} onChange={handleInputChange} disabled={loading} required />
                </div>

                {/* Role-specific fields */}
                {userToEdit.role === 'student' && (
                    <div className="form-group">
                        <label htmlFor="edit-grade_level">Grade Level:</label>
                        <input type="number" id="edit-grade_level" name="grade_level" value={formData.grade_level} onChange={handleInputChange} disabled={loading} />
                    </div>
                )}
                {/* Add placeholders or actual inputs if these fields are added to DB later */}
                {userToEdit.role === 'teacher' && (
                     <div className="form-group">
                        <label htmlFor="edit-subject_taught">Subject Taught: (N/A)</label>
                        {/* <input type="text" id="edit-subject_taught" name="subject_taught" value={formData.subject_taught} onChange={handleInputChange} disabled={loading} /> */}
                    </div>
                )}
                {userToEdit.role === 'parent' && (
                     <div className="form-group">
                        <label htmlFor="edit-phone_number">Phone Number: (N/A)</label>
                        {/* <input type="tel" id="edit-phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} disabled={loading} /> */}
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditUserForm;