import React from 'react';
import './OverviewPerformanceModal.css';

const OverviewPerformanceModal = ({ 
  isOpen, 
  onClose, 
  classroomData, 
  performance, 
  knowledgeComponents 
}) => {
  if (!isOpen) return null;

  // Ensure we have arrays to work with
  const safePerformance = performance || [];
  const safeKnowledgeComponents = knowledgeComponents || [];

  // Calculate overall statistics
  const totalStudents = safePerformance.length;
  const avgMastery = totalStudents > 0 
    ? (safePerformance.reduce((sum, s) => 
        sum + (s.performance?.mathMastery || s.performance?.averageMastery || 0), 0) / totalStudents * 100)
    : 0;
  
  const interventionCount = safePerformance.filter(s => s.intervention && s.intervention.needed).length;
  const highPerformers = safePerformance.filter(s => 
    (s.performance?.mathMastery || s.performance?.averageMastery || 0) >= 0.8).length;
  const strugglingStudents = safePerformance.filter(s => 
    (s.performance?.mathMastery || s.performance?.averageMastery || 0) < 0.4).length;

  // Calculate mastery distribution
  const masteryDistribution = {
    excellent: safePerformance.filter(s => (s.performance?.mathMastery || s.performance?.averageMastery || 0) >= 0.9).length,
    good: safePerformance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.7 && mastery < 0.9;
    }).length,
    average: safePerformance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.5 && mastery < 0.7;
    }).length,
    needsHelp: safePerformance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.3 && mastery < 0.5;
    }).length,
    struggling: safePerformance.filter(s => (s.performance?.mathMastery || s.performance?.averageMastery || 0) < 0.3).length
  };

  // Top and bottom performing KCs
  const sortedKCs = safeKnowledgeComponents
    .filter(kc => kc.averageMastery != null)
    .sort((a, b) => (b.averageMastery || 0) - (a.averageMastery || 0));
  
  const topKCs = sortedKCs.slice(0, 3);
  const bottomKCs = sortedKCs.slice(-3).reverse();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="overview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>📊 Class Performance Overview</h2>
            <p className="classroom-name">{classroomData?.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Show loading or no data state */}
          {totalStudents === 0 ? (
            <div className="no-data-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>📊 No Student Data Available</h3>
              <p>There are no students in this classroom yet, or student performance data is still loading.</p>
              <p>Add students to your classroom to see performance analytics here.</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <h3>{totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <h3>{avgMastery.toFixed(1)}%</h3>
                <p>Average Mastery</p>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon">⚠️</div>
              <div className="metric-content">
                <h3>{interventionCount}</h3>
                <p>Need Intervention</p>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">⭐</div>
              <div className="metric-content">
                <h3>{highPerformers}</h3>
                <p>High Performers</p>
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="distribution-section">
            <h3>📊 Student Performance Distribution</h3>
            <div className="distribution-chart">
              <div className="distribution-bar">
                <div 
                  className="dist-segment excellent" 
                  style={{ width: `${(masteryDistribution.excellent / totalStudents) * 100}%` }}
                  title={`Excellent (90%+): ${masteryDistribution.excellent} students`}
                >
                  {masteryDistribution.excellent > 0 && masteryDistribution.excellent}
                </div>
                <div 
                  className="dist-segment good" 
                  style={{ width: `${(masteryDistribution.good / totalStudents) * 100}%` }}
                  title={`Good (70-89%): ${masteryDistribution.good} students`}
                >
                  {masteryDistribution.good > 0 && masteryDistribution.good}
                </div>
                <div 
                  className="dist-segment average" 
                  style={{ width: `${(masteryDistribution.average / totalStudents) * 100}%` }}
                  title={`Average (50-69%): ${masteryDistribution.average} students`}
                >
                  {masteryDistribution.average > 0 && masteryDistribution.average}
                </div>
                <div 
                  className="dist-segment needs-help" 
                  style={{ width: `${(masteryDistribution.needsHelp / totalStudents) * 100}%` }}
                  title={`Needs Help (30-49%): ${masteryDistribution.needsHelp} students`}
                >
                  {masteryDistribution.needsHelp > 0 && masteryDistribution.needsHelp}
                </div>
                <div 
                  className="dist-segment struggling" 
                  style={{ width: `${(masteryDistribution.struggling / totalStudents) * 100}%` }}
                  title={`Struggling (< 30%): ${masteryDistribution.struggling} students`}
                >
                  {masteryDistribution.struggling > 0 && masteryDistribution.struggling}
                </div>
              </div>
              <div className="distribution-legend">
                <div className="legend-item excellent">
                  <span className="legend-color"></span>
                  <span>Excellent (90%+)</span>
                </div>
                <div className="legend-item good">
                  <span className="legend-color"></span>
                  <span>Good (70-89%)</span>
                </div>
                <div className="legend-item average">
                  <span className="legend-color"></span>
                  <span>Average (50-69%)</span>
                </div>
                <div className="legend-item needs-help">
                  <span className="legend-color"></span>
                  <span>Needs Help (30-49%)</span>
                </div>
                <div className="legend-item struggling">
                  <span className="legend-color"></span>
                  <span>Struggling (&lt; 30%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Component Insights */}
          <div className="insights-grid">
            <div className="insight-card success">
              <h4>🚀 Top Performing Topics</h4>
              <div className="kc-list">
                {topKCs.length > 0 ? topKCs.map(kc => (
                  <div key={kc.id} className="kc-item">
                    <span className="kc-code">{kc.curriculum_code}</span>
                    <span className="kc-mastery">{((kc.averageMastery || 0) * 100).toFixed(0)}%</span>
                  </div>
                )) : (
                  <p className="no-data">No data available</p>
                )}
              </div>
            </div>

            <div className="insight-card warning">
              <h4>📚 Topics Needing Attention</h4>
              <div className="kc-list">
                {bottomKCs.length > 0 ? bottomKCs.map(kc => (
                  <div key={kc.id} className="kc-item">
                    <span className="kc-code">{kc.curriculum_code}</span>
                    <span className="kc-mastery">{((kc.averageMastery || 0) * 100).toFixed(0)}%</span>
                  </div>
                )) : (
                  <p className="no-data">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h4>🎯 Recommended Actions</h4>
            <div className="action-items">
              {strugglingStudents > 0 && (
                <div className="action-item urgent">
                  <span className="action-icon">🚨</span>
                  <span>Focus on {strugglingStudents} struggling student{strugglingStudents !== 1 ? 's' : ''}</span>
                </div>
              )}
              {interventionCount > 0 && (
                <div className="action-item important">
                  <span className="action-icon">⚡</span>
                  <span>{interventionCount} student{interventionCount !== 1 ? 's' : ''} need immediate intervention</span>
                </div>
              )}
              {bottomKCs.length > 0 && (
                <div className="action-item moderate">
                  <span className="action-icon">📖</span>
                  <span>Review teaching strategies for {bottomKCs[0]?.curriculum_code}</span>
                </div>
              )}
              {highPerformers > totalStudents * 0.7 && (
                <div className="action-item positive">
                  <span className="action-icon">🎉</span>
                  <span>Great work! Most students are performing well</span>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPerformanceModal;