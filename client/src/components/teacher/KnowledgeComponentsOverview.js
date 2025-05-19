import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './TeacherDashboard.css';

// Map to display appropriate icons for KC categories
const CATEGORY_ICONS = {
  'NS': '🔢', // Number Sense
  'GEO': '📐', // Geometry
  'MEAS': '📏', // Measurement
  'ALG': '➗', // Algebra
  'STAT': '📊', // Statistics
  'default': '🧮' // Default for unknown categories
};

// Map for difficulty descriptions
const DIFFICULTY_LABELS = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Challenging',
  5: 'Advanced'
};

const KnowledgeComponentsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [knowledgeComponents, setKnowledgeComponents] = useState([]);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categoryGroups, setCategoryGroups] = useState({});
  const { token, user } = useAuth();

  // Extract category from curriculum_code or metadata
  const getCategoryFromKC = (kc) => {
    // Try to get from curriculum_code (e.g., "G3-NS-1" -> "NS")
    if (kc.curriculum_code) {
      const match = kc.curriculum_code.match(/G\d-([A-Z]+)-\d+/);
      if (match) return match[1];
    }
    
    // Try to get from metadata
    try {
      const metadata = typeof kc.metadata === 'string' 
        ? JSON.parse(kc.metadata) 
        : kc.metadata;
      
      if (metadata && metadata.category) {
        return metadata.category;
      }
    } catch (e) {
      console.warn("Failed to parse KC metadata");
    }
    
    // Default category based on ID range
    const id = kc.id || 0;
    if (id <= 12) return 'NS'; // Number Sense
    if (id <= 24) return 'NSO'; // Number Sense & Operations
    if (id <= 36) return 'GEO'; // Geometry
    if (id <= 43) return 'MEAS'; // Measurement
    if (id <= 49) return 'STAT'; // Statistics
    
    return 'default';
  };
  
  const getCategoryDisplayName = (categoryCode) => {
    const categoryNames = {
      'NS': 'Number Sense',
      'NSO': 'Number Sense & Operations',
      'GEO': 'Geometry',
      'MEAS': 'Measurement',
      'STAT': 'Statistics',
      'default': 'Other Topics'
    };
    
    return categoryNames[categoryCode] || categoryCode;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user?.id) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        // Fetch knowledge components from the API
        const response = await axios.get(`/api/teachers/${user.id}/knowledge-component-mastery`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Store raw data
        setKnowledgeComponents(response.data);
        
        // Group by category
        const grouped = {};
        response.data.forEach(kc => {
          const category = getCategoryFromKC(kc);
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(kc);
        });
        
        // Sort KCs within each category by ID or curriculum_code
        Object.keys(grouped).forEach(category => {
          grouped[category].sort((a, b) => {
            // Sort by curriculum_code if available
            if (a.curriculum_code && b.curriculum_code) {
              return a.curriculum_code.localeCompare(b.curriculum_code);
            }
            // Fallback to ID
            return (a.id || 0) - (b.id || 0);
          });
        });
        
        setCategoryGroups(grouped);
        
        // Expand the first category by default
        const categories = Object.keys(grouped);
        if (categories.length > 0) {
          setExpandedCategories({ [categories[0]]: true });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching knowledge components:', err);
        setError('Failed to load knowledge components. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading knowledge components...</h2>
        <p>Please wait while we gather the information.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="knowledge-components-overview">
      <h2>Knowledge Components Overview</h2>
      
      {Object.keys(categoryGroups).length > 0 ? (
        Object.keys(categoryGroups).map(category => (
          <div key={category} className="quarter-section">
            <div 
              className="quarter-header"
              onClick={() => toggleCategory(category)}
            >
              <h3>
                {CATEGORY_ICONS[category] || CATEGORY_ICONS.default} {getCategoryDisplayName(category)}
              </h3>
              <span className="expand-icon">
                {expandedCategories[category] ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedCategories[category] && (
              <div className="kc-list">
                {categoryGroups[category].map(kc => {
                  const mastery = kc.averageMastery || 0;
                  const categoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
                  const displayCode = kc.curriculum_code || `KC${kc.id}`;
                  const difficulty = kc.difficulty || (kc.metadata?.difficulty ? parseInt(kc.metadata.difficulty) : 3);
                  const difficultyLabel = DIFFICULTY_LABELS[difficulty] || 'Medium';
                  const hasContent = kc.totalContentItems > 0;
                  
                  return (
                    <div key={kc.id} className="kc-item">
                      <div className="kc-icon">{categoryIcon}</div>
                      <div className="kc-info">
                        <div className="kc-header">
                          <span className="kc-code">{displayCode}</span>
                          <div className="kc-difficulty" title={`Difficulty: ${difficultyLabel}`}>
                            {Array(difficulty).fill('●').join('')}
                          </div>
                        </div>
                        <span className="kc-name">{kc.name}</span>
                        <div className="kc-details">
                          <span className="kc-students" title="Students with data for this KC">
                            👥 {kc.totalStudents || 0} {kc.totalStudents === 1 ? 'student' : 'students'}
                          </span>
                          <span className="kc-content" title="Content items for this KC">
                            {hasContent ? 
                              `📚 ${kc.totalContentItems} ${kc.totalContentItems === 1 ? 'item' : 'items'}` : 
                              '📚 No content'}
                          </span>
                        </div>
                      </div>
                      <div className="kc-mastery">
                        <div className="mastery-badge" style={{
                          backgroundColor: mastery >= 0.8 ? '#2ecc71' : 
                                        mastery >= 0.6 ? '#f1c40f' : '#e74c3c'
                        }}>
                          {(mastery * 100).toFixed(0)}%
                        </div>
                        {kc.id && (
                          <Link 
                            to={`/teacher/knowledge-components/${kc.id}`}
                            className="view-details-link"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="no-kcs-message">
          <p>No knowledge components found. This could be because:</p>
          <ul>
            <li>No knowledge components exist in the database yet</li>
            <li>No students have interacted with any knowledge components</li>
            <li>There was an error retrieving the knowledge components</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default KnowledgeComponentsOverview; 