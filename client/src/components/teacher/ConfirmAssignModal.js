import React, { useState } from 'react';
import './ConfirmAssignModal.css'; // Create this CSS file

const ConfirmAssignModal = ({ student, recommendedItems, onClose, onConfirmAssign }) => {
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleConfirm = async () => {
    setIsAssigning(true);
    const itemIds = recommendedItems.map(item => item.id);
    try {
      // Call the passed-in function which contains the API logic
      await onConfirmAssign(student.id, itemIds, notes); 
      // onClose will likely be called by onConfirmAssign on success
    } catch (error) {
      // Error handling is likely done within onConfirmAssign, 
      // but we could add modal-specific error display if needed.
      console.error("Error during assignment confirmation:", error); 
    } finally {
      setIsAssigning(false);
    }
  };

  if (!student || !recommendedItems) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-assign-modal">
        <h3>Confirm Assignment for {student.name}</h3>
        
        <div className="assignment-summary">
          <h4>Recommended Items:</h4>
          {recommendedItems.length > 0 ? (
            <ul>
              {recommendedItems.map(item => (
                <li key={item.id}>
                  {item.title || `Content Item ${item.id}`} ({item.type || 'Practice'})
                </li>
              ))}
            </ul>
          ) : (
            <p>No specific items recommended.</p>
          )}
        </div>

        <div className="notes-section">
          <label htmlFor="teacherNotes">Add Optional Notes/Guidance:</label>
          <textarea
            id="teacherNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Focus on understanding the steps..."
            rows="4"
          />
        </div>

        <div className="modal-actions">
          <button 
            onClick={handleConfirm} 
            disabled={isAssigning || recommendedItems.length === 0}
          >
            {isAssigning ? 'Assigning...' : `Confirm & Assign (${recommendedItems.length})`}
          </button>
          <button onClick={onClose} className="button-secondary" disabled={isAssigning}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAssignModal;
