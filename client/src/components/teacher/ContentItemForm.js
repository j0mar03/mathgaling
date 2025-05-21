import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Use the custom hook

function ContentItemForm({ itemToEdit, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    knowledge_component_id: '',
    type: '',
    content: '',
    metadata: '', // Assuming metadata is stored as JSON string for simplicity
    difficulty: '',
    language: 'English'
  });
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useAuth(); // Get user AND token

  // Fetch available Knowledge Components for the dropdown
  useEffect(() => {
    const fetchKnowledgeComponents = async () => {
      if (!user?.token) return;
      try {
        // Using the general KC endpoint, could be filtered by grade if needed
        const response = await axios.get('/api/knowledge-components', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setKnowledgeComponents(response.data || []);
      } catch (err) {
        console.error("Error fetching knowledge components for form:", err);
        setError('Failed to load knowledge components for selection.');
      }
    };
    fetchKnowledgeComponents();
  }, [user?.token]);

  // Populate form if editing
  useEffect(() => {
    if (itemToEdit) {
      setIsEditing(true);
      setFormData({
        knowledge_component_id: itemToEdit.knowledge_component_id || '',
        type: itemToEdit.type || '',
        content: itemToEdit.content || '',
        metadata: itemToEdit.metadata ? JSON.stringify(itemToEdit.metadata, null, 2) : '',
        difficulty: itemToEdit.difficulty ?? '', // Handle null/undefined difficulty
        language: itemToEdit.language || 'English'
      });
    } else {
      setIsEditing(false);
      // Reset form for creation
      setFormData({
        knowledge_component_id: '', type: '', content: '', metadata: '', difficulty: '', language: 'English'
      });
    }
  }, [itemToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check token from top-level scope
    if (!token) {
      setError("Authentication token not found.");
      return;
    }
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.knowledge_component_id || !formData.type || !formData.content) {
        setError('Knowledge Component, Type, and Content are required.');
        setLoading(false);
        return;
    }

    let metadataJson = null;
    if (formData.metadata) {
        try {
            metadataJson = JSON.parse(formData.metadata);
        } catch (parseError) {
            setError('Metadata must be valid JSON or empty.');
            setLoading(false);
            return;
        }
    }

    const payload = {
        knowledge_component_id: parseInt(formData.knowledge_component_id, 10),
        type: formData.type,
        content: formData.content,
        metadata: metadataJson,
        difficulty: formData.difficulty !== '' ? parseInt(formData.difficulty, 10) : null, // Allow empty difficulty
        language: formData.language
    };

    try {
      let response;
      if (isEditing) {
        // Update existing Content Item
        response = await axios.put(`/api/teacher/content-items/${itemToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` } // Use token variable
        });
      } else {
        // Create new Content Item
        response = await axios.post('/api/teacher/content-items', payload, {
          headers: { Authorization: `Bearer ${token}` } // Use token variable
        });
      }
      onSuccess(response.data); // Pass created/updated data back
    } catch (err) {
      console.error("Error saving content item:", err);
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} content item.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <h3>{isEditing ? 'Edit Content Item' : 'Create New Content Item'}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="knowledge_component_id">Knowledge Component: *</label>
          <select
            id="knowledge_component_id"
            name="knowledge_component_id"
            value={formData.knowledge_component_id}
            onChange={handleChange}
            required
            disabled={isEditing} // Prevent changing KC when editing for simplicity
          >
            <option value="">-- Select Knowledge Component --</option>
            {knowledgeComponents.map(kc => (
              <option key={kc.id} value={kc.id}>
                {kc.name} (Grade {kc.grade_level})
              </option>
            ))}
          </select>
           {isEditing && <small> Cannot change Knowledge Component after creation.</small>}
        </div>
        <div>
          <label htmlFor="type">Type: *</label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="e.g., multiple_choice, fill_in_blank"
            required
          />
        </div>
        <div>
          <label htmlFor="content">Content: *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>
         <div>
          <label htmlFor="metadata">Metadata (JSON format):</label>
          <textarea
            id="metadata"
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            rows="4"
            placeholder='e.g., {"options": ["A", "B"], "answer": "A"}'
          />
           <small>Enter valid JSON or leave empty.</small>
        </div>
         <div>
          <label htmlFor="difficulty">Difficulty (e.g., 1-5):</label>
          <input
            type="number"
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            min="1"
            max="5" // Example range
          />
        </div>
         <div>
          <label htmlFor="language">Language:</label>
          <input
            type="text"
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
          />
        </div>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
          </button>
          <button type="button" onClick={onClose} disabled={loading} style={{ marginLeft: '0.5rem' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContentItemForm;