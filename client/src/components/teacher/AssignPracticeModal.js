import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AssignPracticeModal.css'; // We'll create this CSS file later

const AssignPracticeModal = ({ student, onClose, onAssignSuccess }) => {
  const { token } = useAuth();
  const [strugglingKCs, setStrugglingKCs] = useState([]);
  const [contentItems, setContentItems] = useState({}); // Store content items per KC
  const [selectedContentItems, setSelectedContentItems] = useState([]);
  const [loadingKCs, setLoadingKCs] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student && student.id) {
      setLoadingKCs(true);
      setError(null);
      // Fetch struggling KCs for the student
      // This endpoint needs to be created: /api/students/:studentId/struggling-kcs
      // For now, let's assume it returns an array of KC objects like:
      // [{ id: 1, name: 'Adding Fractions', curriculum_code: 'G5-NS-ADD-FRAC' }, ...]
      axios.get(`/api/students/${student.id}/detailed-performance`, { // Using existing detailed-performance for now
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        // Extract KCs where mastery is below a threshold (e.g., 0.8)
        const allKCs = response.data?.knowledgeStates || [];
        const struggling = allKCs.filter(kc => kc.p_mastery < 0.8);
        setStrugglingKCs(struggling);
        if (struggling.length > 0) {
          // Pre-fetch content items for the first struggling KC or all
          struggling.forEach(kc => fetchContentItems(kc.knowledge_component_id || kc.id));
        }
      })
      .catch(err => {
        console.error('Error fetching struggling KCs:', err);
        setError('Failed to load student knowledge components.');
      })
      .finally(() => {
        setLoadingKCs(false);
      });
    }
  }, [student, token]);

  const fetchContentItems = async (kcId) => {
    if (!kcId || contentItems[kcId]) return; // Don't fetch if already loaded or no kcId

    setLoadingContent(true);
    try {
      // This endpoint needs to be robust: /api/content-items?kcId=${kcId}
      // It should return content items suitable for practice for that KC.
      const response = await axios.get(`/api/content-items?knowledgeComponentId=${kcId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContentItems(prev => ({ ...prev, [kcId]: response.data }));
    } catch (err) {
      const errMsg = `Error fetching content items for KC ID ${kcId}. Status: ${err.response?.status}. Message: ${err.response?.data?.message || err.message}`;
      console.error(errMsg, err.response || err);
      setError(prevError => {
        const newError = `Failed to load content for KC ID ${kcId}.`;
        // Avoid duplicate messages if error is already shown
        return prevError?.includes(newError) ? prevError : `${prevError || ''} ${newError}`;
      });
    } finally {
      setLoadingContent(false);
    }
  };

  const handleToggleContentItem = (itemId) => {
    console.log('Toggling item ID:', itemId, typeof itemId);
    setSelectedContentItems(prevSelectedItems => {
      let newSelectedItems;
      if (prevSelectedItems.includes(itemId)) {
        newSelectedItems = prevSelectedItems.filter(id => id !== itemId);
      } else {
        newSelectedItems = [...prevSelectedItems, itemId];
      }
      console.log('Previous selected items:', prevSelectedItems);
      console.log('New selected items:', newSelectedItems);
      return newSelectedItems;
    });
  };

  const handleAssign = async () => {
    if (selectedContentItems.length === 0) {
      alert('Please select at least one content item to assign.');
      return;
    }
    setError(null);
    try {
      // This endpoint needs to be created: /api/students/:studentId/assign-practice
      await axios.post(`/api/students/${student.id}/assign-practice`, 
        { contentItemIds: selectedContentItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Practice items assigned successfully!');
      if (onAssignSuccess) onAssignSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning practice items:', err);
      setError(err.response?.data?.message || 'Failed to assign practice items.');
      alert(`Error: ${err.response?.data?.message || 'Failed to assign practice items.'}`);
    }
  };

  if (!student) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content assign-practice-modal">
        <h3>Assign Practice for {student.name}</h3>
        {error && <p className="error-message">{error}</p>}
        
        {loadingKCs && <p>Loading student's knowledge components...</p>}
        
        {!loadingKCs && strugglingKCs.length === 0 && (
          <p>{student.name} has no specific knowledge components identified as needing immediate practice based on current data.</p>
        )}

        {strugglingKCs.length > 0 && (
          <div className="kcs-selection">
            <h4>Select Content Items for Struggling KCs:</h4>
            {strugglingKCs.map(kc => (
              <div key={kc.knowledge_component_id || kc.id} className="kc-item">
                <h5>{kc.name || kc.KnowledgeComponent?.name} ({kc.curriculum_code || kc.KnowledgeComponent?.curriculum_code}) - Mastery: {(kc.p_mastery * 100).toFixed(0)}%</h5>
                {loadingContent && !contentItems[kc.knowledge_component_id || kc.id] && <p>Loading content...</p>}
                {contentItems[kc.knowledge_component_id || kc.id] && contentItems[kc.knowledge_component_id || kc.id].length === 0 && (
                  <p>No specific practice items found for this KC.</p>
                )}
                {contentItems[kc.knowledge_component_id || kc.id] && contentItems[kc.knowledge_component_id || kc.id].length > 0 && (
                  <ul className="content-item-list">
                    {contentItems[kc.knowledge_component_id || kc.id].map(item => {
                      // Ensure item and item.id exist before rendering
                      if (!item || typeof item.id === 'undefined') {
                        console.warn('Content item or item.id is undefined:', item);
                        return null; 
                      }
                      return (
                        <li key={item.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedContentItems.includes(item.id)}
                              onChange={() => handleToggleContentItem(item.id)}
                            />
                            {item.title || item.content?.substring(0, 50) || `Content Item ${item.id}`} (Type: {item.type})
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleAssign} disabled={selectedContentItems.length === 0 || loadingKCs || loadingContent}>
            Assign Selected ({selectedContentItems.length})
          </button>
          <button onClick={onClose} className="button-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AssignPracticeModal;
