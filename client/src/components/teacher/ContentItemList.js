import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Use the custom hook

function ContentItemList({ onEdit, onCreate }) { // Pass handlers from parent
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth(); // Get user AND token

  useEffect(() => {
    const fetchContentItems = async () => {
      // Check token from top-level scope before fetch
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Fetch content items created by this teacher
        // Removed duplicate token check here
        // Corrected API path from /api/teacher/ to /api/teachers/
        const response = await axios.get('/api/teachers/content-items', {
          headers: { Authorization: `Bearer ${token}` } // Use token variable
        });
        setContentItems(response.data);
      } catch (err) {
        console.error("Error fetching teacher's content items:", err);
        setError(err.response?.data?.error || 'Failed to fetch your content items.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if token is available
    if (token) {
        fetchContentItems();
    } else {
        // Handle the case where token is initially null/undefined
        setLoading(false); 
        // Optionally set an error or message if needed, but parent might handle this
        // setError("Waiting for authentication..."); 
    }
  }, [token]); // Depend on token

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Content Item ${id}?`)) {
      return;
    }
    try {
      // Check token from top-level scope before delete
      if (!token) {
        alert("Authentication token not found. Cannot delete.");
        return;
      }
      // Corrected API path for delete as well
      await axios.delete(`/api/teachers/content-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` } // Use token variable
      });
      // Refresh list after delete
      setContentItems(prev => prev.filter(ci => ci.id !== id));
      alert('Content Item deleted successfully.');
    } catch (err) {
      console.error("Error deleting content item:", err);
      alert(err.response?.data?.error || 'Failed to delete content item.');
    }
  };

  if (loading) return <div>Loading Your Content Items...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h3>My Content Items</h3>
      <button onClick={onCreate} style={{ marginBottom: '1rem' }}>Create New Content Item</button>
      {contentItems.length === 0 ? (
        <p>You haven't created any content items yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Content (Preview)</th>
              <th>Knowledge Component</th>
              <th>Difficulty</th>
              <th>Language</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contentItems.map((ci) => (
              <tr key={ci.id}>
                <td>{ci.id}</td>
                <td>{ci.type}</td>
                <td>{ci.content?.substring(0, 50)}{ci.content?.length > 50 ? '...' : ''}</td>
                {/* Assuming KnowledgeComponent data is included from backend */}
                <td>{ci.KnowledgeComponent ? `${ci.KnowledgeComponent.name} (Grade ${ci.KnowledgeComponent.grade_level})` : 'N/A'}</td>
                <td>{ci.difficulty ?? '-'}</td>
                <td>{ci.language}</td>
                <td>
                  <button onClick={() => onEdit(ci)}>Edit</button>
                  <button onClick={() => handleDelete(ci.id)} style={{ marginLeft: '0.5rem', color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ContentItemList;