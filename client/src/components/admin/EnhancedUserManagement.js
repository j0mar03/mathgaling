import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './EnhancedUserManagement.css';

const EnhancedUserManagement = ({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  onLinkChildren, 
  loading, 
  error,
  onRefresh 
}) => {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  // Reset selected users when users list changes
  useEffect(() => {
    setSelectedUsers(new Set());
  }, [users]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.auth_id.toLowerCase().includes(searchLower) ||
        user.id.toString().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'auth_id':
          aValue = a.auth_id.toLowerCase();
          bValue = b.auth_id.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, filters]);

  // Handle individual checkbox selection
  const handleUserSelection = (userId, userRole) => {
    const userKey = `${userRole}-${userId}`;
    const newSelected = new Set(selectedUsers);
    
    if (newSelected.has(userKey)) {
      newSelected.delete(userKey);
    } else {
      newSelected.add(userKey);
    }
    
    setSelectedUsers(newSelected);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      // Deselect all
      setSelectedUsers(new Set());
    } else {
      // Select all visible users
      const allUserKeys = filteredAndSortedUsers.map(user => `${user.role}-${user.id}`);
      setSelectedUsers(new Set(allUserKeys));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to delete.');
      return;
    }

    const selectedUsersList = Array.from(selectedUsers).map(userKey => {
      const [role, id] = userKey.split('-');
      const user = users.find(u => u.role === role && u.id.toString() === id);
      return { id: parseInt(id), role, name: user?.name || 'Unknown' };
    });

    const confirmMessage = `Are you sure you want to delete ${selectedUsers.size} user(s)?\n\nUsers to delete:\n${selectedUsersList.map(u => `- ${u.name} (${u.role})`).join('\n')}\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      // Use bulk delete API endpoint for better performance
      const response = await axios.post('/api/admin/users/bulk-delete', {
        users: selectedUsersList
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { results } = response.data;

      // Show results
      let message = '';
      if (results.successful.length > 0) {
        message += `Successfully deleted ${results.successful.length} user(s).\n`;
      }
      if (results.failed.length > 0) {
        message += `Failed to delete ${results.failed.length} user(s):\n`;
        message += results.failed.map(u => `- ${u.error}`).join('\n');
      }
      
      alert(message);

      // Clear selection and refresh
      setSelectedUsers(new Set());
      onRefresh();

    } catch (err) {
      console.error('Bulk delete error:', err);
      const errorMessage = err.response?.data?.error || 'An error occurred during bulk delete operation.';
      alert(`Bulk delete failed: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle sort change
  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (users.length === 0) {
    return <div className="no-users">No users found.</div>;
  }

  const isAllSelected = selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0;
  const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < filteredAndSortedUsers.length;

  return (
    <div className="enhanced-user-management">
      {/* Filters and Controls */}
      <div className="user-controls">
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="search">Search:</label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="role-filter">Filter by Role:</label>
              <select
                id="role-filter"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="filter-select"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="parent">Parents</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="sort-by">Sort by:</label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="role">Role</option>
                <option value="id">ID</option>
                <option value="auth_id">Email</option>
                <option value="created">Date Created</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="sort-order">Order:</label>
              <select
                id="sort-order"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="filter-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Bulk Actions */}
        <div className="bulk-actions">
          <div className="selection-info">
            {selectedUsers.size > 0 ? (
              <span>{selectedUsers.size} user(s) selected</span>
            ) : (
              <span>No users selected</span>
            )}
          </div>
          
          {selectedUsers.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bulk-delete-btn"
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedUsers.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>

      {/* User Table */}
      <div className="table-container">
        <table className="enhanced-user-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={handleSelectAll}
                  title={isAllSelected ? 'Deselect all' : 'Select all visible users'}
                />
              </th>
              <th 
                className={`sortable ${filters.sortBy === 'id' ? 'sorted-' + filters.sortOrder : ''}`}
                onClick={() => handleSort('id')}
              >
                ID
                {filters.sortBy === 'id' && (
                  <span className="sort-indicator">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className={`sortable ${filters.sortBy === 'name' ? 'sorted-' + filters.sortOrder : ''}`}
                onClick={() => handleSort('name')}
              >
                Name
                {filters.sortBy === 'name' && (
                  <span className="sort-indicator">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className={`sortable ${filters.sortBy === 'auth_id' ? 'sorted-' + filters.sortOrder : ''}`}
                onClick={() => handleSort('auth_id')}
              >
                Auth ID / Email
                {filters.sortBy === 'auth_id' && (
                  <span className="sort-indicator">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className={`sortable ${filters.sortBy === 'role' ? 'sorted-' + filters.sortOrder : ''}`}
                onClick={() => handleSort('role')}
              >
                Role
                {filters.sortBy === 'role' && (
                  <span className="sort-indicator">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map((user) => {
              const userKey = `${user.role}-${user.id}`;
              const isSelected = selectedUsers.has(userKey);
              
              return (
                <tr key={userKey} className={isSelected ? 'selected' : ''}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleUserSelection(user.id, user.role)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td className="name-cell">
                    <span className="user-name">{user.name}</span>
                  </td>
                  <td className="email-cell">{user.auth_id}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="details-cell">
                    {user.role === 'student' && (
                      <span className="detail-badge">Grade: {user.grade_level || 'N/A'}</span>
                    )}
                    {user.role === 'teacher' && (
                      <span className="detail-badge">Teacher</span>
                    )}
                    {user.role === 'parent' && (
                      <span className="detail-badge">Parent</span>
                    )}
                    {user.role === 'admin' && (
                      <span className="detail-badge">Admin User</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        onClick={() => onEditUser(user)} 
                        className="action-btn edit-btn"
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      {user.role === 'parent' && (
                        <button 
                          onClick={() => onLinkChildren(user)} 
                          className="action-btn link-btn"
                          title="Link children"
                        >
                          🔗
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteUser(user.id, user.role)} 
                        className="action-btn delete-btn"
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="no-results">
          No users match the current filters. <button onClick={clearFilters}>Clear filters</button> to see all users.
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;