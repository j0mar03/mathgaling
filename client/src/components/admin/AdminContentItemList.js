import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminContentItemForm from './AdminContentItemForm';
import './AdminContentManagement.css';

function AdminContentItemList() {
  // State for content items and loading
  const [contentItems, setContentItems] = useState([]);
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [kcQuizCounts, setKcQuizCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    showAll: false
  });
  
  // State for filters
  const [filters, setFilters] = useState({
    type: '',
    kcId: '',
    difficulty: '',
    search: '',
    showAll: false
  });
  
  // State for form visibility and editing
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Get auth token
  const { token } = useAuth();
  
  // Fetch knowledge components for filter dropdown
  useEffect(() => {
    const fetchKnowledgeComponents = async () => {
      try {
        const response = await axios.get('/api/admin/knowledge-components', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKnowledgeComponents(response.data);
        
        // Get quiz counts for each knowledge component
        const countResponse = await axios.get('/api/admin/content-items', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000, showAll: true }
        });
        
        // Calculate counts by knowledge component
        const counts = {};
        countResponse.data.contentItems.forEach(item => {
          const kcId = item.knowledge_component_id;
          if (kcId) {
            counts[kcId] = (counts[kcId] || 0) + 1;
          }
        });
        
        setKcQuizCounts(counts);
      } catch (err) {
        console.error("Error fetching knowledge components:", err);
      }
    };
    
    if (token) {
      fetchKnowledgeComponents();
    }
  }, [token]);
  
  // Fetch content items with filters and pagination
  const fetchContentItems = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/content-items', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...filters,
          page,
          limit: filters.showAll ? 1000 : pagination.limit // Use large limit when showing all
        }
      });
      
      setContentItems(response.data.contentItems);
      setPagination({
        total: response.data.total,
        totalPages: filters.showAll ? 1 : response.data.totalPages,
        currentPage: 1,
        limit: filters.showAll ? 1000 : pagination.limit,
        showAll: filters.showAll
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching content items:", err);
      setError(err.response?.data?.error || 'Failed to fetch content items');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch content items when filters or pagination changes
  useEffect(() => {
    if (token) {
      fetchContentItems(pagination.currentPage);
    }
  }, [token, filters, pagination.currentPage, pagination.limit]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  // Handle showing all questions
  const handleShowAllQuestions = () => {
    setFilters(prev => ({
      ...prev,
      showAll: !prev.showAll
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };
  
  // Handle creating new content item
  const handleCreateClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };
  
  // Handle editing content item
  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };
  
  // Handle deleting content item
  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content item?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/content-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove item from state
      setContentItems(prev => prev.filter(item => item.id !== id));
      // Refresh the list if we deleted the last item on the page
      if (contentItems.length === 1 && pagination.currentPage > 1) {
        handlePageChange(pagination.currentPage - 1);
      } else {
        fetchContentItems(pagination.currentPage);
      }
      
      alert('Content item deleted successfully');
    } catch (err) {
      console.error("Error deleting content item:", err);
      alert(err.response?.data?.error || 'Failed to delete content item');
    }
  };
  
  // Handle form submission success
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchContentItems(pagination.currentPage);
  };
  
  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };
  
  // Render content item type with appropriate label
  const renderItemType = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'fill_in_blank':
        return 'Fill in Blank';
      case 'question':
        return 'Open Question';
      default:
        return type;
    }
  };
  
  return (
    <div className="admin-content-management">
      <h2>Quiz Content Management</h2>
      
      {/* Show form or list */}
      {showForm ? (
        <AdminContentItemForm 
          itemToEdit={editingItem}
          knowledgeComponents={knowledgeComponents}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="content-filters">
            <input 
              type="text"
              name="search"
              placeholder="Search content..."
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
            
            <select 
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="fill_in_blank">Fill in Blank</option>
              <option value="question">Open Question</option>
            </select>
            
            <select 
              name="kcId"
              value={filters.kcId}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Knowledge Components</option>
              {knowledgeComponents.map(kc => (
                <option key={kc.id} value={kc.id}>
                  {kc.name} (Grade {kc.grade_level}) - {kcQuizCounts[kc.id] || 0} quizzes
                </option>
              ))}
            </select>
            
            <select 
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Difficulties</option>
              <option value="1">1 (Easy)</option>
              <option value="2">2</option>
              <option value="3">3 (Medium)</option>
              <option value="4">4</option>
              <option value="5">5 (Hard)</option>
            </select>

            <button 
              onClick={handleShowAllQuestions} 
              className={`show-all-button ${filters.showAll ? 'active' : ''}`}
            >
              {filters.showAll ? 'Show Paginated' : 'Show All Questions'}
            </button>
            
            <button onClick={handleCreateClick} className="create-button">
              Create New Question
            </button>
          </div>
          
          {/* Content items table */}
          {loading ? (
            <p className="loading-message">Loading content items...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : contentItems.length === 0 ? (
            <p className="no-items-message">No content items found.</p>
          ) : (
            <>
              <table className="content-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Content</th>
                    <th>Knowledge Component</th>
                    <th>Difficulty</th>
                    <th>Has Image</th>
                    <th>Has Hint</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{renderItemType(item.type)}</td>
                      <td className="content-preview">
                        {item.content?.substring(0, 50)}
                        {item.content?.length > 50 ? '...' : ''}
                      </td>
                      <td>
                        {item.KnowledgeComponent ? 
                          `${item.KnowledgeComponent.name} (Grade ${item.KnowledgeComponent.grade_level})` : 
                          'N/A'}
                      </td>
                      <td>{item.difficulty || '-'}</td>
                      <td className="has-feature">
                        {item.metadata?.imageUrl ? '✓' : '✗'}
                      </td>
                      <td className="has-feature">
                        {item.metadata?.hint ? '✓' : '✗'}
                      </td>
                      <td className="action-buttons">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination - only show if not showing all */}
              {!filters.showAll && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="pagination-button first-page"
                  >
                    &laquo; First
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="pagination-button prev-page"
                  >
                    &lt; Prev
                  </button>
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-button next-page"
                  >
                    Next &gt;
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-button last-page"
                  >
                    Last &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AdminContentItemList;