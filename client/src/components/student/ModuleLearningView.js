import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './ModuleLearningView.css';

const ModuleLearningView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [module, setModule] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [selectedCompetency, setSelectedCompetency] = useState(0);

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!token || !moduleId) {
        setError('Authentication required or invalid module');
        setLoading(false);
        return;
      }

      try {
        // Fetch module details and content in parallel
        const [moduleResponse, contentResponse] = await Promise.all([
          axios.get(`/api/students/${user.id}/deped-modules`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/deped-modules/${moduleId}/content`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Find the specific module
        const moduleData = moduleResponse.data.find(m => 
          m.module_id === parseInt(moduleId) || m.module_number === parseInt(moduleId)
        );

        if (!moduleData) {
          setError('Module not found');
          setLoading(false);
          return;
        }

        setModule(moduleData);
        setContentItems(contentResponse.data || []);
        
        // Create competencies based on DepEd Module 1 structure
        const moduleCompetencies = [
          {
            id: 1,
            melc_code: 'M3NS-Ia-9.1',
            title: 'Representing Numbers from 1001 to 10,000',
            description: 'Learn to represent numbers using blocks, flats, longs, squares, number discs, and straw bundles',
            objectives: [
              'Use blocks to represent 1000 units (1 block = 1000)',
              'Use flats to represent 100 units (1 flat = 10 longs = 100 units)',
              'Use longs to represent 10 units (1 long = 10 squares)',
              'Use squares to represent 1 unit',
              'Represent numbers using number discs and straw bundles'
            ]
          },
          {
            id: 2,
            melc_code: 'M3NS-Ia-9.2',
            title: 'Identifying Place Value and Value of Digits',
            description: 'Identify place value (libuhan, sandaanan, sampuan, isahan) and value of digits in 4-5 digit numbers',
            objectives: [
              'Identify libuhan (thousands place) and its value',
              'Identify sandaanan (hundreds place) and its value',
              'Identify sampuan (tens place) and its value',
              'Identify isahan (ones place) and its value',
              'Fill in place value charts for 4-5 digit numbers'
            ]
          },
          {
            id: 3,
            melc_code: 'M3NS-Ia-9.3',
            title: 'Reading and Writing Numbers in Symbols and Words',
            description: 'Read and write numbers from 1001 to 10,000 in both numerical symbols and Filipino words',
            objectives: [
              'Read numbers from left to right by place value',
              'Write numbers in symbols according to place value',
              'Write numbers in Filipino words using proper conventions',
              'Convert between symbols and words',
              'Use contextual examples like birth years'
            ]
          }
        ];

        setCompetencies(moduleCompetencies);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching module data:', err);
        setError('Failed to load module data');
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [moduleId, token, user.id]);

  const handleStartPractice = (competencyIndex) => {
    if (contentItems.length > 0) {
      // Find content for this competency or use the first available
      const contentItem = contentItems[competencyIndex] || contentItems[0];
      const kcId = contentItem.knowledge_component_id;
      
      navigate(`/student/quiz/${kcId}?mode=sequential&qnum=1&correct=0&module_id=${moduleId}&competency=${competencyIndex + 1}`);
    } else {
      // Fallback to KC mapping
      const kcMapping = { 1: 1, 2: 2, 3: 3 };
      const kcId = kcMapping[competencyIndex + 1] || 1;
      navigate(`/student/quiz/${kcId}?mode=sequential&qnum=1&correct=0&module_id=${moduleId}&competency=${competencyIndex + 1}`);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student/deped-modules');
  };

  if (loading) {
    return (
      <div className="module-learning-container">
        <div className="loading-spinner"></div>
        <h2>Loading Module...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module-learning-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToDashboard}>Back to Modules</button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-learning-container">
      <div className="module-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Modules
        </button>
        <div className="module-title-section">
          <h1>{module.module_title}</h1>
          <p className="module-description">{module.module_description}</p>
          <div className="module-meta">
            <span className="quarter-badge">Q{module.quarter_number}</span>
            <span className="duration-badge">{module.estimated_weeks} weeks</span>
            <span className="competencies-badge">{competencies.length} competencies</span>
          </div>
        </div>
      </div>

      <div className="competencies-section">
        <h2>Learning Competencies (MELC)</h2>
        <div className="competencies-grid">
          {competencies.map((competency, index) => (
            <div key={competency.id} className="competency-card">
              <div className="competency-header">
                <span className="melc-code">{competency.melc_code}</span>
                <h3>{competency.title}</h3>
              </div>
              
              <div className="competency-content">
                <p className="competency-description">{competency.description}</p>
                
                <div className="learning-objectives">
                  <h4>Learning Objectives:</h4>
                  <ul>
                    {competency.objectives.map((objective, objIndex) => (
                      <li key={objIndex}>{objective}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="competency-actions">
                <button 
                  className="practice-button"
                  onClick={() => handleStartPractice(index)}
                >
                  <span className="practice-icon">🎯</span>
                  Start Practice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="module-footer">
        <div className="progress-summary">
          <h3>Module Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${module.completion_percentage || 0}%` }}
            ></div>
          </div>
          <p>{Math.round(module.completion_percentage || 0)}% Complete</p>
        </div>
      </div>
    </div>
  );
};

export default ModuleLearningView;