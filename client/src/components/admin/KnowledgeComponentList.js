import React, { useState, useEffect, useContext, useRef } from 'react'; // Import useRef
import axios from 'axios'; // Assuming axios is used for API calls
import { useAuth } from '../../context/AuthContext'; // Use the custom hook again
import './AdminContentManagement.css'; // Import the CSS file

function KnowledgeComponentList({ onEdit, onCreate }) { // Removed token prop
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedKCs, setSelectedKCs] = useState([]); // State for tracking selected components
  const [curriculumCodeFilter, setCurriculumCodeFilter] = useState(''); // State for curriculum code filter
  const [kcQuizCounts, setKcQuizCounts] = useState({});
  const { user, token, loading: authLoading } = useAuth();
  const hasFetched = useRef(false); // Ref to track if fetch has been attempted for the current token

  useEffect(() => {
    // Define the function to fetch data
    const fetchKnowledgeComponents = async () => {
      // Token is now available from the top-level scope via the useAuth() call above
      // No need to call useAuth() again here

      // Parent ensures token exists. If it's somehow null here, the API call below will fail.
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/admin/knowledge-components', {
          headers: { Authorization: `Bearer ${token}` } // Use the token from the top-level scope
        });
        setKnowledgeComponents(response.data);
        
        // Fetch content items to get quiz counts for each knowledge component
        const contentResponse = await axios.get('/api/admin/content-items', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000, showAll: true }
        });
        
        // Calculate counts by knowledge component
        const counts = {};
        contentResponse.data.contentItems.forEach(item => {
          const kcId = item.knowledge_component_id;
          if (kcId) {
            counts[kcId] = (counts[kcId] || 0) + 1;
          }
        });
        
        setKcQuizCounts(counts);
      } catch (err) {
        console.error("Error fetching knowledge components:", err);
        setError(err.response?.data?.error || 'Failed to fetch knowledge components.');
      } finally {
        setLoading(false);
      }
    }; // End of fetchKnowledgeComponents

    console.log(`KCList Effect: authLoading=${authLoading}, token=${token ? 'exists' : 'missing'}`); // Add logging
    // Check conditions *before* calling fetch
    if (!authLoading && token) {
      // Auth is done loading and token exists, proceed with fetch
      console.log("KCList Effect: Fetching data..."); // Add logging
      fetchKnowledgeComponents();
    } else if (authLoading) {
      // If auth is still loading, ensure component loading state is true
      console.log("KCList Effect: Auth still loading..."); // Add logging
      setLoading(true);
    } else if (!authLoading && !token) {
      // If auth is done loading but there's no token, set the error
      console.log("KCList Effect: Auth done, but no token found."); // Add logging
      setError("Authentication token not found.");
      setLoading(false);
    }


  // This effect runs when authLoading or token changes
  // Effect depends on authLoading and token
  // Effect depends on authLoading and token changes
  }, [authLoading, token]);

  const handleDelete = async (id) => {
    // Also check authLoading and token before delete
    // Token is available from top-level scope
    // Check token from top-level scope before proceeding with delete
    if (!token) {
      alert("Authentication token not found. Cannot delete.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Knowledge Component ${id}? This might affect linked Content Items.`)) {
      return;
    }
    try {
      // Token check is now done above using currentToken
      // Use token directly in header
      await axios.delete(`/api/admin/knowledge-components/${id}`, {
        headers: { Authorization: `Bearer ${token}` } // Use token from top-level scope
      });
      // Refresh list after delete
      setKnowledgeComponents(prev => prev.filter(kc => kc.id !== id));
      alert('Knowledge Component deleted successfully.');
    } catch (err) {
      console.error("Error deleting knowledge component:", err);
      alert(err.response?.data?.error || 'Failed to delete knowledge component.');
    }
  };

  // Function to handle deleting multiple selected knowledge components
  const handleDeleteSelected = async () => {
    if (!token) {
      alert("Authentication token not found. Cannot delete.");
      return;
    }
    if (selectedKCs.length === 0) {
      alert("No Knowledge Components selected.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedKCs.length} selected Knowledge Components? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.post('/api/admin/knowledge-components/delete-multiple', 
        { ids: selectedKCs },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Remove deleted items from the state
      setKnowledgeComponents(prev => prev.filter(kc => !selectedKCs.includes(kc.id)));
      setSelectedKCs([]); // Clear selection
      alert('Knowledge Components deleted successfully.');
    } catch (err) {
      console.error("Error deleting knowledge components:", err);
      alert(err.response?.data?.error || 'Failed to delete knowledge components.');
    }
  };

  if (loading) return <div>Loading Knowledge Components...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const filteredKnowledgeComponents = knowledgeComponents.filter(kc => 
    kc.curriculum_code?.toLowerCase().includes(curriculumCodeFilter.toLowerCase())
  );

  return (
    <div>
      <h2>Knowledge Component Management</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
        <button onClick={onCreate} className="create-button">Create New Knowledge Component</button>
        {selectedKCs.length > 0 && (
          <button 
            onClick={handleDeleteSelected} 
            className="delete-button">
            Delete Selected ({selectedKCs.length})
          </button>
        )}
      </div>
      {knowledgeComponents.length === 0 ? (
        <p>No Knowledge Components found.</p>
      ) : (
        <table className="content-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedKCs(knowledgeComponents.map(kc => kc.id));
                    } else {
                      setSelectedKCs([]);
                    }
                  }}
                  checked={selectedKCs.length === knowledgeComponents.length && knowledgeComponents.length > 0}
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Grade Level</th>
              <th>
                Curriculum Code
                <input
                  type="text"
                  placeholder="Filter..."
                  value={curriculumCodeFilter}
                  onChange={e => setCurriculumCodeFilter(e.target.value)}
                  style={{ marginLeft: '0.5rem', width: '100px' }}
                />
              </th>
              <th>Quiz Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKnowledgeComponents.map((kc) => (
              <tr key={kc.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedKCs.includes(kc.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedKCs([...selectedKCs, kc.id]);
                      } else {
                        setSelectedKCs(selectedKCs.filter(id => id !== kc.id));
                      }
                    }}
                  />
                </td>
                <td>{kc.id}</td>
                <td>{kc.name}</td>
                <td>{kc.description?.substring(0, 50)}{kc.description?.length > 50 ? '...' : ''}</td>
                <td>{kc.grade_level}</td>
                <td>{kc.curriculum_code || '-'}</td>
                <td>{kcQuizCounts[kc.id] || 0}</td>
                <td className="action-buttons">
                  <button onClick={() => onEdit(kc)} className="edit-button">Edit</button>
                  <button onClick={() => handleDelete(kc.id)} className="delete-button" style={{ marginLeft: '0.5rem' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default KnowledgeComponentList;
