import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './LinkParentStudentModal.css';

const LinkParentStudentModal = ({ parent, onClose, onLinked }) => {
    const [students, setStudents] = useState([]);
    const [linkedStudents, setLinkedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [linking, setLinking] = useState(false);
    const { token } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch all students
            const studentsResponse = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allStudents = studentsResponse.data.filter(u => u.role === 'student');
            setStudents(allStudents);

            // Fetch currently linked students for this parent
            const linkedResponse = await axios.get(`/api/parents/${parent.id}/children`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinkedStudents(linkedResponse.data || []);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [parent, token]);

    useEffect(() => {
        if (parent) {
            fetchData();
        }
    }, [parent, fetchData]);


    const isLinked = (studentId) => {
        return linkedStudents.some(s => s.id === studentId);
    };

    const handleLink = async (studentId) => {
        try {
            setLinking(true);
            setError('');

            await axios.post('/api/admin/parent-student-links', {
                parent_id: parent.id,
                student_id: studentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh the linked students list
            await fetchData();
            
        } catch (err) {
            console.error('Error linking parent to student:', err);
            setError(err.response?.data?.error || 'Failed to link student');
        } finally {
            setLinking(false);
        }
    };

    const handleUnlink = async (studentId) => {
        try {
            setLinking(true);
            setError('');

            await axios.delete(`/api/admin/parent-student-links/${parent.id}/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh the linked students list
            await fetchData();
            
        } catch (err) {
            console.error('Error unlinking parent from student:', err);
            setError(err.response?.data?.error || 'Failed to unlink student');
        } finally {
            setLinking(false);
        }
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.auth_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!parent) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="link-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Link Children to {parent.name}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <div className="modal-content">
                    <div className="linked-section">
                        <h3>Currently Linked Children ({linkedStudents.length})</h3>
                        {linkedStudents.length === 0 ? (
                            <p className="no-children">No children linked yet</p>
                        ) : (
                            <div className="linked-list">
                                {linkedStudents.map(student => (
                                    <div key={student.id} className="linked-student">
                                        <div className="student-info">
                                            <span className="student-name">{student.name}</span>
                                            <span className="student-grade">Grade {student.grade_level}</span>
                                        </div>
                                        <button 
                                            className="unlink-button"
                                            onClick={() => handleUnlink(student.id)}
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
                        <h3>Available Students</h3>
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />

                        {loading ? (
                            <p>Loading students...</p>
                        ) : (
                            <div className="students-list">
                                {filteredStudents.map(student => {
                                    const linked = isLinked(student.id);
                                    return (
                                        <div key={student.id} className={`student-item ${linked ? 'linked' : ''}`}>
                                            <div className="student-info">
                                                <span className="student-name">{student.name}</span>
                                                <span className="student-details">
                                                    Grade {student.grade_level} • 
                                                    {student.username ? ` @${student.username}` : ` ${student.auth_id}`}
                                                </span>
                                            </div>
                                            <button 
                                                className={`link-button ${linked ? 'linked' : ''}`}
                                                onClick={() => linked ? handleUnlink(student.id) : handleLink(student.id)}
                                                disabled={linking}
                                            >
                                                {linked ? 'Linked ✓' : 'Link'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="done-button" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default LinkParentStudentModal;