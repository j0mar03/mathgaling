import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './LinkParentToStudentModal.css';

const LinkParentToStudentModal = ({ student, classroomId, onClose, onLinked }) => {
    const [parents, setParents] = useState([]);
    const [linkedParents, setLinkedParents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [linking, setLinking] = useState(false);
    const { token } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch all parents (teachers can see all parents)
            const parentsResponse = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allParents = parentsResponse.data.filter(u => u.role === 'parent');
            setParents(allParents);

            // Fetch currently linked parents for this student
            const linkedResponse = await axios.get(`/api/students/${student.id}/parents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinkedParents(linkedResponse.data || []);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [student, token]);

    useEffect(() => {
        if (student) {
            fetchData();
        }
    }, [student, fetchData]);


    const isLinked = (parentId) => {
        return linkedParents.some(p => p.id === parentId);
    };

    const handleLink = async (parentId) => {
        try {
            setLinking(true);
            setError('');

            console.log('Linking parent:', parentId, 'to student:', student.id, 'Student object:', student);
            
            await axios.post('/api/teacher/parent-student-links', {
                parent_id: parentId,
                student_id: student.id,
                classroom_id: classroomId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh the linked parents list
            await fetchData();
            
        } catch (err) {
            console.error('Error linking parent to student:', err);
            setError(err.response?.data?.error || 'Failed to link parent');
        } finally {
            setLinking(false);
        }
    };

    const handleUnlink = async (parentId) => {
        if (!window.confirm('Are you sure you want to unlink this parent from the student?')) {
            return;
        }

        try {
            setLinking(true);
            setError('');

            await axios.delete(`/api/teacher/parent-student-links/${parentId}/${student.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh the linked parents list
            await fetchData();
            
        } catch (err) {
            console.error('Error unlinking parent from student:', err);
            setError(err.response?.data?.error || 'Failed to unlink parent');
        } finally {
            setLinking(false);
        }
    };

    const filteredParents = parents.filter(parent => 
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.auth_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!student) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="link-parent-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Link Parents to {student.name}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <div className="modal-content">
                    <div className="student-info-section">
                        <p><strong>Student:</strong> {student.name}</p>
                        <p><strong>Grade:</strong> {student.grade_level}</p>
                        <p><strong>Username:</strong> {student.username || 'N/A'}</p>
                    </div>

                    <div className="linked-section">
                        <h3>Currently Linked Parents ({linkedParents.length})</h3>
                        {linkedParents.length === 0 ? (
                            <p className="no-parents">No parents linked yet</p>
                        ) : (
                            <div className="linked-list">
                                {linkedParents.map(parent => (
                                    <div key={parent.id} className="linked-parent">
                                        <div className="parent-info">
                                            <span className="parent-name">{parent.name}</span>
                                            <span className="parent-email">{parent.auth_id}</span>
                                        </div>
                                        <button 
                                            className="unlink-button"
                                            onClick={() => handleUnlink(parent.id)}
                                            disabled={linking}
                                        >
                                            Unlink
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="available-section">
                        <h3>Available Parents</h3>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />

                        {loading ? (
                            <p>Loading parents...</p>
                        ) : (
                            <div className="parents-list">
                                {filteredParents.map(parent => {
                                    const linked = isLinked(parent.id);
                                    return (
                                        <div key={parent.id} className={`parent-item ${linked ? 'linked' : ''}`}>
                                            <div className="parent-info">
                                                <span className="parent-name">{parent.name}</span>
                                                <span className="parent-email">{parent.auth_id}</span>
                                            </div>
                                            <button 
                                                className={`link-button ${linked ? 'linked' : ''}`}
                                                onClick={() => linked ? handleUnlink(parent.id) : handleLink(parent.id)}
                                                disabled={linking}
                                            >
                                                {linked ? 'Linked ✓' : 'Link'}
                                            </button>
                                        </div>
                                    );
                                })}
                                {filteredParents.length === 0 && (
                                    <p className="no-results">No parents found matching your search.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="info-section">
                        <p className="info-text">
                            <strong>Note:</strong> Parents will be able to view this student's progress, 
                            grades, and receive updates about their learning activities.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="done-button" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default LinkParentToStudentModal;