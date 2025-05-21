import React, { useState, useEffect } from 'react';
import { 
  updateApproveContentItem, 
  rejectDeleteContentItem,
  // We might need a way to fetch available KCs for linking
  // getApprovedKnowledgeComponentsForPdf // Example function name
} from '../../services/reviewService'; 
import './ReviewItem.css'; // Shared CSS for review items

// Define possible content item types
const CONTENT_ITEM_TYPES = ['question', 'example', 'explanation', 'activity', 'other']; 

function ContentItemReviewItem({ item, pdfUploadId, onUpdate, onReject, availableKCs = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...item }); // Initialize form with item data
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form data if the item prop changes
  useEffect(() => {
    setFormData({ ...item });
    setIsEditing(false); // Close editor if item changes
    setError(null);
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJsonInputChange = (e) => {
    const { name, value } = e.target;
    try {
      // Attempt to parse JSON for fields like 'options'
      const parsedValue = value ? JSON.parse(value) : null;
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
      setError(null); // Clear previous JSON errors
    } catch (jsonError) {
      console.error("Invalid JSON input:", jsonError);
      // Keep the raw string value for now, maybe show validation error
      setFormData(prev => ({ ...prev, [name]: value })); 
      setError(`Invalid JSON format for ${name}.`);
    }
  };

  const handleApprove = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Prepare data for update (only send editable fields)
      const updateData = {
        content: formData.content,
        type: formData.type,
        difficulty: parseInt(formData.difficulty, 10) || 1,
        options: formData.options, // Assumes options is handled correctly (JSON or null)
        correct_answer: formData.correct_answer,
        explanation: formData.explanation,
        knowledge_component_id: formData.knowledge_component_id ? parseInt(formData.knowledge_component_id, 10) : null,
      };
      await updateApproveContentItem(item.id, updateData);
      setIsEditing(false);
      onUpdate(); // Notify parent to refresh list
    } catch (err) {
      setError(err.message || 'Failed to approve item.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject and delete suggestion ID ${item.id}?`)) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await rejectDeleteContentItem(item.id);
      // No need to call onUpdate, the item is gone. Parent might refresh anyway.
      onReject(item.id); // Notify parent this item was rejected
    } catch (err) {
      setError(err.message || 'Failed to reject item.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`review-item content-item-review ${isEditing ? 'editing' : ''}`}>
      {!isEditing ? (
        <>
          <div className="item-details">
            <strong>ID:</strong> {item.id} <br />
            <strong>Type:</strong> {item.type || 'N/A'} <br />
            <strong>Difficulty:</strong> {item.difficulty || 'N/A'} <br />
            <strong>Content:</strong> <p className="item-content-display">{item.content}</p>
            {/* Display other fields like options, answer if needed in read-only */}
          </div>
          <div className="item-actions">
            <button onClick={() => setIsEditing(true)} disabled={isLoading}>Edit</button>
            <button onClick={handleReject} disabled={isLoading} className="reject-button">Reject</button>
          </div>
        </>
      ) : (
        <div className="item-editor">
          <label>
            Type:
            <select name="type" value={formData.type || ''} onChange={handleInputChange}>
              <option value="">-- Select Type --</option>
              {CONTENT_ITEM_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Content:
            <textarea name="content" value={formData.content || ''} onChange={handleInputChange} rows="4" />
          </label>
          <label>
            Difficulty (1-5):
            <input type="number" name="difficulty" value={formData.difficulty || ''} onChange={handleInputChange} min="1" max="5" />
          </label>
          <label>
            Options (JSON Array, e.g., ["A", "B", "C"]):
            {/* Use handleJsonInputChange for JSON fields */}
            <textarea name="options" defaultValue={formData.options ? JSON.stringify(formData.options) : ''} onChange={handleJsonInputChange} rows="3" />
          </label>
          <label>
            Correct Answer:
            <input type="text" name="correct_answer" value={formData.correct_answer || ''} onChange={handleInputChange} />
          </label>
          <label>
            Explanation:
            <textarea name="explanation" value={formData.explanation || ''} onChange={handleInputChange} rows="3" />
          </label>
          <label>
            Link to Knowledge Component:
            <select name="knowledge_component_id" value={formData.knowledge_component_id || ''} onChange={handleInputChange}>
              <option value="">-- None --</option>
              {/* Populate with available KCs (passed as prop) */}
              {availableKCs.filter(kc => kc.status === 'approved').map(kc => (
                 <option key={kc.id} value={kc.id}>{kc.name} (ID: {kc.id})</option>
              ))}
            </select>
          </label>

          {error && <p className="error-message item-error">{error}</p>}

          <div className="item-actions">
            <button onClick={handleApprove} disabled={isLoading} className="approve-button">
              {isLoading ? 'Saving...' : 'Approve & Save'}
            </button>
            <button onClick={() => { setIsEditing(false); setError(null); setFormData({...item}); }} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentItemReviewItem;