import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AdminContentManagement.css'; // Import common admin styles

function KnowledgeComponentForm({ kcToEdit, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade_level: '',
    curriculum_code: ''
    // prerequisites field removed
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useAuth(); // Get user AND token via the hook

  useEffect(() => {
    if (kcToEdit) {
      setIsEditing(true);
      setFormData({
        name: kcToEdit.name || '',
        description: kcToEdit.description || '',
        grade_level: kcToEdit.grade_level || '',
        curriculum_code: kcToEdit.curriculum_code || ''
        // prerequisites field removed
      });
    } else {
      setIsEditing(false);
      // Reset form for creation
      setFormData({
        name: '', description: '', grade_level: '', curriculum_code: ''
      });
    }
  }, [kcToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use the token variable directly
    if (!token) {
      setError("Authentication token not found.");
      return;
    }
    // Removed duplicate check here
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.name || formData.grade_level === '') {
        setError('Name and Grade Level are required.');
        setLoading(false);
        return;
    }

    // prerequisitesJson handling removed
    const payload = {
        name: formData.name,
        description: formData.description,
        grade_level: parseInt(formData.grade_level, 10), // Ensure grade is integer
        curriculum_code: formData.curriculum_code
        // prerequisites field removed from payload
    };

    try {
      let response;
      if (isEditing) {
        // Update existing KC
        response = await axios.put(`/api/admin/knowledge-components/${kcToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` } // Use token variable
        });
      } else {
        // Create new KC
        response = await axios.post('/api/admin/knowledge-components', payload, {
          headers: { Authorization: `Bearer ${token}` } // Use token variable
        });
      }
      onSuccess(response.data); // Pass created/updated data back
    } catch (err) {
      console.error("Error saving knowledge component:", err);
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} knowledge component.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content-form kc-form"> {/* Use admin-content-form and add specific kc-form class */}
      <h3>{isEditing ? 'Edit Knowledge Component' : 'Create New Knowledge Component'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name: *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Addition within 100"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Briefly describe the knowledge component"
          />
        </div>
        <div className="form-group">
          <label htmlFor="grade_level">Grade Level: *</label>
          <input
            type="number"
            id="grade_level"
            name="grade_level"
            className="form-control"
            value={formData.grade_level}
            onChange={handleChange}
            required
            placeholder="e.g., 3"
          />
        </div>
        <div className="form-group">
          <label htmlFor="curriculum_code">Curriculum Code:</label>
          <input
            type="text"
            id="curriculum_code"
            name="curriculum_code"
            className="form-control"
            value={formData.curriculum_code}
            onChange={handleChange}
            placeholder="e.g., MA.3.NBT.A.2"
          />
        </div>
        {/* Prerequisites field removed */}
        {error && <div className="error-message">{error}</div>}

        <div className="form-buttons">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Component' : 'Create Component')}
          </button>
          <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default KnowledgeComponentForm;
