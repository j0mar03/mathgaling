import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './DepEdModuleDashboard.css';

const DepEdModuleDashboard = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  const fetchModulesAndProgress = useCallback(async () => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Fetch modules and progress in parallel
      const [modulesResponse, progressResponse] = await Promise.all([
        axios.get(`/api/students/${user.id}/deped-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/students/${user.id}/module-progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!modulesResponse.data || !Array.isArray(modulesResponse.data)) {
        throw new Error('Invalid modules response format');
      }

      if (!progressResponse.data || !Array.isArray(progressResponse.data)) {
        throw new Error('Invalid progress response format');
      }

      setModules(modulesResponse.data);
      setProgress(progressResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching DepEd modules:', err);
      setError(err.response?.data?.error || 'Failed to load DepEd modules. Please try again.');
      setLoading(false);
    }
  }, [token, user.id]);

  useEffect(() => {
    fetchModulesAndProgress();
  }, [fetchModulesAndProgress]);

  // Add effect to refresh data when returning from quiz
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('refresh') === 'true') {
      fetchModulesAndProgress();
      // Remove the refresh parameter from URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, fetchModulesAndProgress, navigate, location.pathname]);

  // Group modules by quarter and calculate progress
  const quarterData = useMemo(() => {
    const grouped = modules.reduce((acc, module) => {
      const quarter = module.quarter_number;
      if (!acc[quarter]) {
        acc[quarter] = {
          quarter_number: quarter,
          quarter_title: module.quarter_title,
          modules: []
        };
      }
      
      // Find progress for this module
      const moduleProgress = progress.find(p => p.module_number === module.module_number && p.quarter_number === quarter);
      
      acc[quarter].modules.push({
        ...module,
        completion_percentage: moduleProgress?.completion_percentage || 0,
        questions_answered: moduleProgress?.questions_answered || 0,
        questions_correct: moduleProgress?.questions_correct || 0,
        started_at: moduleProgress?.started_at,
        completed_at: moduleProgress?.completed_at,
        last_activity_at: moduleProgress?.last_activity_at,
        is_completed: (moduleProgress?.completion_percentage || 0) >= 100
      });
      
      return acc;
    }, {});

    // Calculate quarter completion percentages
    Object.values(grouped).forEach(quarter => {
      const totalModules = quarter.modules.length;
      const completedModules = quarter.modules.filter(m => m.is_completed).length;
      quarter.completion_percentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    });

    return grouped;
  }, [modules, progress]);

  const availableQuarters = useMemo(() => {
    return Object.keys(quarterData).map(Number).sort();
  }, [quarterData]);

  const currentQuarterModules = useMemo(() => {
    return quarterData[selectedQuarter]?.modules || [];
  }, [quarterData, selectedQuarter]);

  const handleStartModule = useCallback((moduleId, moduleNumber) => {
    // For now, redirect to the existing quiz system with KC mapping
    // In the future, this would go to a module-specific learning experience
    
    // Map module numbers to existing KC IDs (temporary solution)
    const moduleToKcMapping = {
      1: 1, // Module 1 -> KC1 (Representing Numbers)
      2: 4, // Module 2 -> KC4 (Comparison)
      3: 5, // Module 3 -> KC5 (Addition)
      4: 6  // Module 4 -> KC6 (Subtraction)
    };
    
    const kcId = moduleToKcMapping[moduleNumber] || moduleNumber;
    navigate(`/student/quiz/${kcId}?mode=sequential&qnum=1&correct=0&module_id=${moduleId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading DepEd Modules...</h2>
        <p>Please wait while we prepare your learning modules.</p>
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

  const currentQuarter = quarterData[selectedQuarter];

  return (
    <div className="deped-module-dashboard">
      <div className="dashboard-header">
        <h1>DepEd Learning Modules</h1>
        <p>Follow the official Department of Education curriculum for Grade {user.grade_level || 3} Mathematics</p>
      </div>

      {/* Quarter Navigation */}
      <div className="quarter-navigation">
        {availableQuarters.map(quarter => (
          <button
            key={quarter}
            className={`quarter-tab ${selectedQuarter === quarter ? 'active' : ''}`}
            onClick={() => setSelectedQuarter(quarter)}
          >
            <span className="quarter-number">Q{quarter}</span>
            <span className="quarter-title">
              {quarterData[quarter]?.quarter_title || `Quarter ${quarter}`}
            </span>
            <div className="quarter-progress">
              <div 
                className="quarter-progress-bar"
                style={{ width: `${quarterData[quarter]?.completion_percentage || 0}%` }}
              ></div>
            </div>
            <span className="quarter-percentage">
              {Math.round(quarterData[quarter]?.completion_percentage || 0)}%
            </span>
          </button>
        ))}
      </div>

      {/* Current Quarter Modules */}
      {currentQuarter && (
        <div className="quarter-content">
          <div className="quarter-header">
            <h2>{currentQuarter.quarter_title}</h2>
            <div className="quarter-stats">
              <span className="modules-count">
                {currentQuarter.modules.length} modules
              </span>
              <span className="completion-status">
                {currentQuarter.modules.filter(m => m.is_completed).length} completed
              </span>
            </div>
          </div>

          <div className="modules-grid">
            {currentQuarterModules.map((module, index) => {
              // Determine if module is accessible (sequential unlocking)
              const previousModule = index > 0 ? currentQuarterModules[index - 1] : null;
              const isAccessible = index === 0 || previousModule?.is_completed || module.completion_percentage > 0;
              
              return (
                <div 
                  key={`${module.quarter_number}-${module.module_number}`} 
                  className={`module-card ${module.is_completed ? 'completed' : ''} ${!isAccessible ? 'locked' : ''}`}
                >
                  <div className="module-header">
                    <div className="module-number">
                      Module {module.module_number}
                    </div>
                    <div className="module-melc-count">
                      {module.competency_count || 3} competencies
                    </div>
                  </div>

                  <div className="module-content">
                    <h3 className="module-title">{module.module_title}</h3>
                    <p className="module-description">{module.module_description}</p>
                    
                    <div className="module-metrics">
                      <div className="metric">
                        <span className="metric-label">Duration</span>
                        <span className="metric-value">{module.estimated_weeks} weeks</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Content Items</span>
                        <span className="metric-value">{module.content_item_count || '~15'}</span>
                      </div>
                      {module.completion_percentage > 0 && (
                        <div className="metric progress">
                          <span className="metric-label">Progress</span>
                          <span className="metric-value">{Math.round(module.completion_percentage)}%</span>
                        </div>
                      )}
                    </div>

                    {module.questions_answered > 0 && (
                      <div className="module-stats">
                        <span className="stat">
                          {module.questions_answered} questions answered
                        </span>
                        <span className="stat">
                          {module.questions_correct} correct
                        </span>
                        <span className="stat accuracy">
                          {Math.round((module.questions_correct / module.questions_answered) * 100)}% accuracy
                        </span>
                      </div>
                    )}

                    {module.last_activity_at && (
                      <div className="last-activity">
                        Last activity: {new Date(module.last_activity_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="module-actions">
                    <button
                      className={`start-module-button ${!isAccessible ? 'disabled' : ''}`}
                      onClick={() => handleStartModule(module.module_number, module.module_number)}
                      disabled={!isAccessible}
                    >
                      {!isAccessible ? (
                        <>
                          <span className="lock-icon">🔒</span>
                          Complete Previous Module
                        </>
                      ) : module.is_completed ? (
                        <>
                          <span className="review-icon">📖</span>
                          Review Module
                        </>
                      ) : module.completion_percentage > 0 ? (
                        <>
                          <span className="continue-icon">▶️</span>
                          Continue Learning
                        </>
                      ) : (
                        <>
                          <span className="start-icon">🚀</span>
                          Start Module
                        </>
                      )}
                    </button>
                  </div>

                  {module.is_completed && (
                    <div className="completion-badge">
                      <span className="check-icon">✅</span>
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {availableQuarters.length === 0 && (
        <div className="no-modules-message">
          <h3>No modules available</h3>
          <p>DepEd modules for your grade level are being prepared. Please check back soon!</p>
        </div>
      )}
    </div>
  );
});

export default DepEdModuleDashboard;