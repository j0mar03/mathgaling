import React, { useState, useEffect } from 'react';
import { 
  updateApproveKnowledgeComponent, 
  rejectDeleteKnowledgeComponent 
} from '../../services/reviewService';
import './ReviewItem.css'; // Use the shared CSS

function KnowledgeComponentReviewItem({ kc, pdfUploadId, onUpdate, onReject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...kc }); // Initialize form with KC data
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form data if the kc prop changes
  useEffect(() => {
    setFormData({ ...kc });
    setIsEditing(false); // Close editor if item changes
    setError(null);
  }, [kc]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle potential JSON metadata input if needed
  const handleMetadataChange = (e) => {
     const { value } = e.target;
     try {
       const parsedMeta = value ? JSON.parse(value) : null;
       setFormData(prev => ({ ...prev, metadata: parsedMeta }));
       setError(null);
     } catch (jsonError) {
       console.error("Invalid JSON for metadata:", jsonError);
       setFormData(prev => ({ ...prev, metadata: value })); // Keep raw string on error
       setError('Invalid JSON format for metadata.');
     }
  };

  const handleApprove = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Prepare data for update
      const updateData = {
        name: formData.name,
        description: formData.description,
        grade_level: formData.grade_level ? parseInt(formData.grade_level, 10) : null,
        curriculum_code: formData.curriculum_code,
        metadata: formData.metadata, // Assumes metadata is handled correctly (JSON object or null/string)
        // source_page is usually not editable here, it's informational from extraction
      };
      await updateApproveKnowledgeComponent(kc.id, updateData);
      setIsEditing(false);
      onUpdate(); // Notify parent to refresh list
    } catch (err) {
      setError(err.message || 'Failed to approve knowledge component.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject and delete suggestion ID ${kc.id}?`)) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await rejectDeleteKnowledgeComponent(kc.id);
      onReject(kc.id); // Notify parent this item was rejected
    } catch (err) {
      setError(err.message || 'Failed to reject knowledge component.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`review-item kc-review ${isEditing ? 'editing' : ''}`}>
      {!isEditing ? (
        <>
          <div className="item-details">
            <strong>ID:</strong> {kc.id} <br />
            <strong>Name:</strong> {kc.name} <br />
            <strong>Page:</strong> {kc.source_page || 'N/A'} <br />
            <strong>Description:</strong> <p className="item-content-display">{kc.description}</p>
          </div>
          <div className="item-actions">
            <button onClick={() => setIsEditing(true)} disabled={isLoading}>Edit</button>
            <button onClick={handleReject} disabled={isLoading} className="reject-button">Reject</button>
          </div>
        </>
      ) : (
        <div className="item-editor">
          <label>
            Name:
            <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} />
          </label>
          <label>
            Description:
            <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="3" />
          </label>
          <label>
            Grade Level:
            <input type="number" name="grade_level" value={formData.grade_level || ''} onChange={handleInputChange} />
          </label>
          <label>
            Curriculum Code:
            <input type="text" name="curriculum_code" value={formData.curriculum_code || ''} onChange={handleInputChange} />
          </label>
          {/* Example for editing metadata as JSON - adjust if needed */}
          {/* <label>
            Metadata (JSON):
            <textarea 
              name="metadata" 
              defaultValue={formData.metadata ? JSON.stringify(formData.metadata, null, 2) : ''} 
              onChange={handleMetadataChange} 
              rows="4" 
            />
          </label> */}

          {error && <p className="error-message item-error">{error}</p>}

          <div className="item-actions">
            <button onClick={handleApprove} disabled={isLoading} className="approve-button">
              {isLoading ? 'Saving...' : 'Approve & Save'}
            </button>
            <button onClick={() => { setIsEditing(false); setError(null); setFormData({...kc}); }} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeComponentReviewItem;