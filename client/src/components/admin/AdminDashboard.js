import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css'; // Import CSS file
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { useAuth } from '../../context/AuthContext';
import AddUserForm from './AddUserForm';
import EditUserForm from './EditUserForm'; // Import the edit form component
import CSVUserUpload from './CSVUserUpload'; // Import the CSV upload component
import KnowledgeComponentList from './KnowledgeComponentList'; // Import KC List
import KnowledgeComponentForm from './KnowledgeComponentForm'; // Import KC Form
import AdminPDFUploader from './AdminPDFUploader'; // Import PDF Uploader component
import AdminContentItemList from './AdminContentItemList'; // Import Content Item List component

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // State for user being edited
    const [showCsvUpload, setShowCsvUpload] = useState(false); // State for CSV upload visibility
    const [showKcForm, setShowKcForm] = useState(false); // State for KC form visibility
    const [editingKc, setEditingKc] = useState(null); // State for KC being edited
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'kcs', 'content', 'pdf'
    // Get user and the context's loading state
    const { user, token, loading: authLoading } = useAuth(); // Get user, token, and loading state

    // Use useCallback to memoize fetchUsers function
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Explicitly pass the token in the header for this request
            const response = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.response?.data?.error || 'Failed to load users. Ensure you are logged in as an admin.');
        } finally {
            setLoading(false);
        }
    }, [token]); // Add token dependency since it's used in the function

    useEffect(() => {
        // Fetch users only if logged in user is an admin
        if (user?.role === 'admin') {
            fetchUsers();
        } else {
             setError('Access denied. Admin privileges required.');
             // Removed duplicate setError call
             setLoading(false);
        }
    }, [user, fetchUsers]); // Keep dependencies consistent

    // Toggle add user form visibility
    const handleToggleAddForm = () => {
        setShowAddForm(prev => !prev);
        setError('');
        setEditingUser(null); // Ensure edit form is hidden when showing add form
        setShowCsvUpload(false); // Hide CSV upload when showing add form
        setShowKcForm(false); // Hide KC form if showing add user form
        setEditingKc(null);
    };
    
    // Toggle CSV upload form visibility
    const handleToggleCsvUpload = () => {
        setShowCsvUpload(prev => !prev);
        setError('');
        setShowAddForm(false); // Hide add form when showing CSV upload
        setEditingUser(null);
        setShowKcForm(false); // Hide KC form if showing CSV upload
        setEditingKc(null);
    };
    
    // Tab navigation handlers
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowAddForm(false);
        setEditingUser(null);
        setShowCsvUpload(false);
        setShowKcForm(false);
        setEditingKc(null);
        setError('');
    };

    // Callback for when a user is successfully added
    const handleUserAdded = () => {
        setShowAddForm(false);
        fetchUsers();
    };

    // Callback to cancel adding a user
    const handleCancelAdd = () => {
        setShowAddForm(false);
        setError('');
    };

    // Callback for when a user is successfully updated
    const handleUserUpdated = () => {
        setEditingUser(null); // Hide edit form
        fetchUsers(); // Refresh the user list
    };

     // Callback to cancel editing a user
    const handleCancelEdit = () => {
        setEditingUser(null);
        setError('');
    };

    // Set the user to be edited, which triggers the EditUserForm display
    const handleEditUser = (userToEdit) => {
        setEditingUser(userToEdit);
        setShowAddForm(true); // Show the form container area, but it will render EditUserForm
        setShowKcForm(false); // Hide KC form
        setEditingKc(null);
        setError('');
    };

    const handleDeleteUser = async (userId, userRole) => {
        if (window.confirm(`Are you sure you want to delete ${userRole} ID ${userId}? This action cannot be undone.`)) {
            try {
                setLoading(true); // Indicate processing
                await axios.delete(`/api/admin/users/${userRole}/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Show success message
                alert(`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} was successfully deleted.`);
                // Refetch users after delete
                await fetchUsers();
            } catch (err) {
                console.error("Error deleting user:", err);
                setError(err.response?.data?.error || 'Failed to delete user.');
                setLoading(false);
            }
        }
    };


    // --- KC Management Handlers ---

    const handleCreateKcClick = () => {
        setEditingKc(null);
        setShowKcForm(true);
        setShowAddForm(false); // Hide user forms
        setEditingUser(null);
        setError('');
    };

    const handleEditKcClick = (kc) => {
        setEditingKc(kc);
        setShowKcForm(true);
        setShowAddForm(false); // Hide user forms
        setEditingUser(null);
        setError('');
    };

    const handleKcFormSuccess = (/* updatedKc */) => {
        setShowKcForm(false);
        setEditingKc(null);
        // Note: KnowledgeComponentList refetches its own data, so no need to trigger fetch here
        // If we needed to update a shared state, we would do it here.
        alert('Knowledge Component saved successfully!');
    };

    const handleKcFormClose = () => {
        setShowKcForm(false);
        setEditingKc(null);
        setError('');
    };


    // Add check for user object existence along with loading state
    // Check the dashboard's loading state AND the auth context's loading state
    if (loading || authLoading) {
        // Display a generic loading message until both dashboard fetch and auth context are ready
        return <div className="loading">Loading Admin Dashboard...</div>;
    }

    // Error handling remains the same
    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    // After loading is done, explicitly check if user and token are available
    // After loading, check if the token string exists
    if (!token) {
        // If no token after loading, user is not logged in
        return <div className="error-message">Please log in to access the admin dashboard.</div>;
    }

    // Now we know token exists, check the user role (user object should be available if token is valid)
    if (!user || user.role !== 'admin') { // Add extra check for user object just in case
         return <div className="error-message">Access Denied. You must be an administrator.</div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            {/* Navigation Tabs */}
            <div className="dashboard-tabs">
                <button
                    onClick={() => handleTabChange('users')}
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                >
                    User Management
                </button>
                <button
                    onClick={() => handleTabChange('kcs')}
                    className={`tab-button ${activeTab === 'kcs' ? 'active' : ''}`}
                >
                    Knowledge Components
                </button>
                <button
                    onClick={() => handleTabChange('content')}
                    className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                >
                    Quiz Content Management
                </button>
                <button
                    onClick={() => handleTabChange('pdf')}
                    className={`tab-button ${activeTab === 'pdf' ? 'active' : ''}`}
                >
                    PDF Curriculum Management
                </button>
                {/* Add Link to the Review Page */}
                <Link to="/reviews" className="tab-button review-link-button">
                    Review Content Suggestions
                </Link>
            </div>

            {/* --- User Management Section --- */}
            {activeTab === 'users' && (
            <section className="admin-section">
                <h2>User Management</h2>
                {/* Toggle Buttons for Add User and CSV Upload */}
                {!showAddForm && !editingUser && !showCsvUpload && (
                    <div>
                        <button onClick={handleToggleAddForm} className="admin-button">Add Single User</button>
                        <button onClick={handleToggleCsvUpload} className="admin-button">Bulk Import Users</button>
                    </div>
                )}
                
                {/* User Forms: Edit User, Add User, or CSV Upload */}
                {editingUser ? (
                    <EditUserForm
                        userToEdit={editingUser}
                        onUserUpdated={handleUserUpdated}
                        onCancel={handleCancelEdit}
                    />
                ) : showAddForm ? (
                    <AddUserForm onUserAdded={handleUserAdded} onCancel={handleCancelAdd} />
                ) : showCsvUpload ? (
                    <CSVUserUpload onUsersAdded={fetchUsers} />
                ) : null}

                {/* Display user-related error only if no form is shown */}
                {error && !showAddForm && !editingUser && !showCsvUpload && (
                    <div className="error-message">Error: {error}</div>
                )}

                {/* User List Table */}
                {!showAddForm && !editingUser && !showCsvUpload && ( // Only render table if no form is shown
                    loading ? (
                        <p className="loading">Loading users...</p>
                    ) : error ? (
                        null // Error is displayed above
                    ) : users.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Auth ID / Email</th>
                                    <th>Role</th>
                                    <th>Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={`${u.role}-${u.id}`}>
                                        <td>{u.id}</td>
                                        <td>{u.name}</td>
                                        <td>{u.auth_id}</td>
                                        <td>{u.role}</td>
                                        <td>
                                            {u.role === 'student' && `Grade: ${u.grade_level || 'N/A'}`}
                                            {u.role === 'teacher' && `Teacher`}
                                            {u.role === 'parent' && `Parent`}
                                            {u.role === 'admin' && `Admin User`}
                                        </td>
                                        <td>
                                            <button onClick={() => handleEditUser(u)} className="admin-button">Edit</button>
                                            <button onClick={() => handleDeleteUser(u.id, u.role)} className="admin-button danger">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </section>
            )}

            {/* --- Knowledge Component Management Section --- */}
            {activeTab === 'kcs' && (
            <section className="admin-section">
                {showKcForm ? (
                    <KnowledgeComponentForm
                        kcToEdit={editingKc}
                        onSuccess={handleKcFormSuccess}
                        onClose={handleKcFormClose}
                    />
                ) : (
                    <KnowledgeComponentList
                        onEdit={handleEditKcClick}
                        onCreate={handleCreateKcClick}
                    />
                )}
            </section>
            )}
            
            {/* --- PDF Curriculum Management Section --- */}
            {activeTab === 'pdf' && (
            <section className="admin-section">
                <AdminPDFUploader />
            </section>
            )}
            
            {/* --- Quiz Content Management Section --- */}
            {activeTab === 'content' && (
            <section className="admin-section">
                <AdminContentItemList />
            </section>
            )}
        </div>
    );
};

export default AdminDashboard;
