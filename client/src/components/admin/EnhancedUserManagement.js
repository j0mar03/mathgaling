import React, { useState, useEffect, useMemo } from 'react';
import './EnhancedUserManagement.css';

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await response.json();
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.auth_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle individual checkbox selection
  const handleUserSelect = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedUsers.length);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allUserIds = new Set(filteredAndSortedUsers.map(user => user.id));
      setSelectedUsers(allUserIds);
      setSelectAll(true);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedUsers.size} selected user(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Prepare the users array for bulk delete
      const usersToDelete = Array.from(selectedUsers).map(userId => {
        const user = users.find(u => u.id === userId);
        return { id: userId, role: user.role };
      });

      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: usersToDelete }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete users');
      }

      const result = await response.json();
      
      // Show results
      if (result.results.failed.length > 0) {
        const failedNames = result.results.failed.map(f => `${f.role} ID ${f.id}: ${f.error}`).join('\n');
        alert(`Some deletions failed:\n${failedNames}`);
      }
      
      if (result.results.successful.length > 0) {
        alert(`Successfully deleted ${result.results.successful.length} user(s)`);
      }

      // Refresh the user list
      await fetchUsers();
      setSelectedUsers(new Set());
      setSelectAll(false);
      
    } catch (err) {
      console.error('Error deleting users:', err);
      alert('Failed to delete users. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <div className="enhanced-user-management loading">Loading users...</div>;
  }

  if (error) {
    return <div className="enhanced-user-management error">{error}</div>;
  }

  return (
    <div className="enhanced-user-management">
      <div className="management-header">
        <h2>Enhanced User Management</h2>
        <div className="management-actions">
          <button 
            className="bulk-delete-btn"
            onClick={handleBulkDelete}
            disabled={selectedUsers.size === 0 || isDeleting}
          >
            {isDeleting ? 'Deleting...' : `Delete Selected (${selectedUsers.size})`}
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="role-filter">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <span>Showing {filteredAndSortedUsers.length} of {users.length} users</span>
        {selectedUsers.size > 0 && (
          <span className="selected-count">{selectedUsers.size} selected</span>
        )}
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {getSortIndicator('name')}
              </th>
              <th onClick={() => handleSort('role')} className="sortable">
                Role {getSortIndicator('role')}
              </th>
              <th onClick={() => handleSort('auth_id')} className="sortable">
                Email/Auth ID {getSortIndicator('auth_id')}
              </th>
              <th onClick={() => handleSort('grade_level')} className="sortable">
                Grade Level {getSortIndicator('grade_level')}
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Created {getSortIndicator('createdAt')}
              </th>
              <th onClick={() => handleSort('updatedAt')} className="sortable">
                Updated {getSortIndicator('updatedAt')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map(user => (
              <tr key={user.id} className={selectedUsers.has(user.id) ? 'selected' : ''}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </td>
                <td className="name-cell">{user.name}</td>
                <td className={`role-cell role-${user.role}`}>
                  <span className="role-badge">{user.role}</span>
                </td>
                <td className="auth-id-cell">{user.auth_id}</td>
                <td className="grade-cell">{user.grade_level || 'N/A'}</td>
                <td className="date-cell">{formatDate(user.createdAt)}</td>
                <td className="date-cell">{formatDate(user.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="no-users-message">
          No users found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;