import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './DetailedPerformanceModal.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DetailedPerformanceModal = ({ 
  isOpen, 
  onClose, 
  classroomData, 
  performance, 
  knowledgeComponents 
}) => {
  const [activeTab, setActiveTab] = useState('individual');

  if (!isOpen) return null;

  // Individual Student Performance Data
  const sortedStudents = [...performance].sort((a, b) => {
    const masteryA = a.performance?.mathMastery || a.performance?.averageMastery || 0;
    const masteryB = b.performance?.mathMastery || b.performance?.averageMastery || 0;
    return masteryB - masteryA;
  });

  // Knowledge Component Performance Data
  const sortedKCs = knowledgeComponents
    .filter(kc => kc.averageMastery != null)
    .sort((a, b) => (b.averageMastery || 0) - (a.averageMastery || 0));

  // Chart data for KC performance
  const kcChartData = {
    labels: sortedKCs.slice(0, 10).map(kc => kc.curriculum_code || 'Unknown'),
    datasets: [
      {
        label: 'Average Mastery (%)',
        data: sortedKCs.slice(0, 10).map(kc => (kc.averageMastery || 0) * 100),
        backgroundColor: sortedKCs.slice(0, 10).map((kc, index) => {
          const mastery = (kc.averageMastery || 0) * 100;
          if (mastery >= 80) return '#27ae60';
          if (mastery >= 60) return '#3498db';
          if (mastery >= 40) return '#f39c12';
          return '#e74c3c';
        }),
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const kcChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Knowledge Component Performance',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Average Mastery (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Knowledge Components'
        }
      }
    },
  };

  // Mastery distribution for doughnut chart
  const masteryDistribution = {
    excellent: performance.filter(s => (s.performance?.mathMastery || s.performance?.averageMastery || 0) >= 0.9).length,
    good: performance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.7 && mastery < 0.9;
    }).length,
    average: performance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.5 && mastery < 0.7;
    }).length,
    needsHelp: performance.filter(s => {
      const mastery = s.performance?.mathMastery || s.performance?.averageMastery || 0;
      return mastery >= 0.3 && mastery < 0.5;
    }).length,
    struggling: performance.filter(s => (s.performance?.mathMastery || s.performance?.averageMastery || 0) < 0.3).length
  };

  const doughnutData = {
    labels: ['Excellent (90%+)', 'Good (70-89%)', 'Average (50-69%)', 'Needs Help (30-49%)', 'Struggling (<30%)'],
    datasets: [
      {
        data: [
          masteryDistribution.excellent,
          masteryDistribution.good,
          masteryDistribution.average,
          masteryDistribution.needsHelp,
          masteryDistribution.struggling
        ],
        backgroundColor: [
          '#27ae60',
          '#3498db',
          '#f39c12',
          '#e67e22',
          '#e74c3c'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Class Mastery Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
  };

  const getMasteryLevel = (mastery) => {
    const percent = mastery * 100;
    if (percent >= 90) return { level: 'Excellent', class: 'excellent' };
    if (percent >= 70) return { level: 'Good', class: 'good' };
    if (percent >= 50) return { level: 'Average', class: 'average' };
    if (percent >= 30) return { level: 'Needs Help', class: 'needs-help' };
    return { level: 'Struggling', class: 'struggling' };
  };

  const getInterventionColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'none';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detailed-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>📋 Detailed Performance Analysis</h2>
            <p className="classroom-name">{classroomData?.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setActiveTab('individual')}
          >
            👥 Individual Students
          </button>
          <button 
            className={`tab-button ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            📚 Knowledge Components
          </button>
          <button 
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'individual' && (
            <div className="individual-tab">
              <div className="tab-header">
                <h3>Individual Student Performance</h3>
                <p>Detailed breakdown of each student's progress and intervention needs</p>
              </div>

              <div className="students-detailed-table">
                <div className="table-header-detailed">
                  <div>Student</div>
                  <div>Mastery Level</div>
                  <div>Progress</div>
                  <div>Last Activity</div>
                  <div>Intervention</div>
                  <div>Status</div>
                </div>

                <div className="table-body-detailed">
                  {sortedStudents.map((student, index) => {
                    const mastery = student.performance?.mathMastery || student.performance?.averageMastery || 0;
                    const masteryInfo = getMasteryLevel(mastery);
                    const lastActive = student.performance?.lastActive 
                      ? new Date(student.performance.lastActive).toLocaleDateString()
                      : 'Never';

                    return (
                      <div key={student.student.id} className="student-detailed-row">
                        <div className="student-info">
                          <div className="student-rank">#{index + 1}</div>
                          <div className="student-details">
                            <div className="student-name">{student.student.name}</div>
                            <div className="student-grade">Grade {student.student.grade_level}</div>
                          </div>
                        </div>

                        <div className="mastery-info">
                          <div className={`mastery-badge ${masteryInfo.class}`}>
                            {masteryInfo.level}
                          </div>
                          <div className="mastery-percentage">
                            {(mastery * 100).toFixed(1)}%
                          </div>
                        </div>

                        <div className="progress-visual">
                          <div className="progress-bar-detailed">
                            <div 
                              className={`progress-fill ${masteryInfo.class}`}
                              style={{ width: `${mastery * 100}%` }}
                            ></div>
                          </div>
                          <div className="progress-stats">
                            <span>{student.performance?.totalQuestions || 0} questions</span>
                          </div>
                        </div>

                        <div className="activity-info">
                          <div className="last-active">{lastActive}</div>
                          <div className="activity-streak">
                            {student.performance?.streak || 0} day streak
                          </div>
                        </div>

                        <div className="intervention-status">
                          {student.intervention && student.intervention.needed ? (
                            <div className={`intervention-badge ${getInterventionColor(student.intervention.priority)}`}>
                              {student.intervention.priority} Priority
                            </div>
                          ) : (
                            <div className="intervention-badge none">No Intervention</div>
                          )}
                        </div>

                        <div className="student-status">
                          <div className={`status-indicator ${masteryInfo.class}`}></div>
                          <div className="status-text">
                            {mastery >= 0.7 ? 'On Track' : mastery >= 0.4 ? 'At Risk' : 'Needs Support'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="knowledge-tab">
              <div className="tab-header">
                <h3>Knowledge Component Analysis</h3>
                <p>Performance breakdown by math topics and concepts</p>
              </div>

              <div className="kc-chart-container">
                <Bar data={kcChartData} options={kcChartOptions} />
              </div>

              <div className="kc-detailed-list">
                {sortedKCs.map((kc, index) => (
                  <div key={kc.id} className="kc-detailed-item">
                    <div className="kc-rank">#{index + 1}</div>
                    
                    <div className="kc-info-detailed">
                      <div className="kc-header">
                        <span className="kc-code-detailed">{kc.curriculum_code}</span>
                        <span className="kc-mastery-detailed">{((kc.averageMastery || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="kc-name-detailed">{kc.name}</div>
                      <div className="kc-description">{kc.description || 'No description available'}</div>
                    </div>

                    <div className="kc-stats-detailed">
                      <div className="stat-item">
                        <span className="stat-label">Students with Data:</span>
                        <span className="stat-value">{kc.studentsWithData || 0}/{kc.totalStudents || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">High Performers:</span>
                        <span className="stat-value">
                          {kc.masteryLevels ? (kc.masteryLevels.high + kc.masteryLevels.veryHigh) : 0}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Need Help:</span>
                        <span className="stat-value">
                          {kc.masteryLevels ? (kc.masteryLevels.veryLow + kc.masteryLevels.low) : 0}
                        </span>
                      </div>
                    </div>

                    <div className="kc-progress-detailed">
                      <div className="kc-progress-bar">
                        <div 
                          className="kc-progress-fill"
                          style={{ width: `${(kc.averageMastery || 0) * 100}%` }}
                        ></div>
                      </div>
                      
                      {kc.masteryLevels && (
                        <div className="mastery-distribution-mini">
                          <div 
                            className="mini-dist very-low" 
                            style={{ width: `${(kc.masteryLevels.veryLow || 0) / (kc.totalStudents || 1) * 100}%` }}
                            title={`Very Low: ${kc.masteryLevels.veryLow || 0}`}
                          ></div>
                          <div 
                            className="mini-dist low" 
                            style={{ width: `${(kc.masteryLevels.low || 0) / (kc.totalStudents || 1) * 100}%` }}
                            title={`Low: ${kc.masteryLevels.low || 0}`}
                          ></div>
                          <div 
                            className="mini-dist medium" 
                            style={{ width: `${(kc.masteryLevels.medium || 0) / (kc.totalStudents || 1) * 100}%` }}
                            title={`Medium: ${kc.masteryLevels.medium || 0}`}
                          ></div>
                          <div 
                            className="mini-dist high" 
                            style={{ width: `${(kc.masteryLevels.high || 0) / (kc.totalStudents || 1) * 100}%` }}
                            title={`High: ${kc.masteryLevels.high || 0}`}
                          ></div>
                          <div 
                            className="mini-dist very-high" 
                            style={{ width: `${(kc.masteryLevels.veryHigh || 0) / (kc.totalStudents || 1) * 100}%` }}
                            title={`Very High: ${kc.masteryLevels.veryHigh || 0}`}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <div className="tab-header">
                <h3>Class Analytics & Insights</h3>
                <p>Statistical analysis and trends for data-driven instruction</p>
              </div>

              <div className="analytics-grid">
                <div className="analytics-chart">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>

                <div className="analytics-insights">
                  <h4>📊 Key Insights</h4>
                  <div className="insight-list">
                    <div className="insight-item">
                      <span className="insight-icon">🎯</span>
                      <div className="insight-content">
                        <strong>Class Average:</strong> {((performance.reduce((sum, s) => 
                          sum + (s.performance?.mathMastery || s.performance?.averageMastery || 0), 0) / performance.length) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="insight-item">
                      <span className="insight-icon">📈</span>
                      <div className="insight-content">
                        <strong>Top Performer:</strong> {sortedStudents[0]?.student.name} 
                        ({((sortedStudents[0]?.performance?.mathMastery || sortedStudents[0]?.performance?.averageMastery || 0) * 100).toFixed(1)}%)
                      </div>
                    </div>

                    <div className="insight-item">
                      <span className="insight-icon">🔍</span>
                      <div className="insight-content">
                        <strong>Needs Attention:</strong> {performance.filter(s => 
                          (s.performance?.mathMastery || s.performance?.averageMastery || 0) < 0.5).length} students below 50%
                      </div>
                    </div>

                    <div className="insight-item">
                      <span className="insight-icon">🏆</span>
                      <div className="insight-content">
                        <strong>Strongest Topic:</strong> {sortedKCs[0]?.curriculum_code} 
                        ({((sortedKCs[0]?.averageMastery || 0) * 100).toFixed(1)}%)
                      </div>
                    </div>

                    <div className="insight-item">
                      <span className="insight-icon">📖</span>
                      <div className="insight-content">
                        <strong>Focus Area:</strong> {sortedKCs[sortedKCs.length - 1]?.curriculum_code} 
                        ({((sortedKCs[sortedKCs.length - 1]?.averageMastery || 0) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recommendations-section">
                <h4>💡 Teaching Recommendations</h4>
                <div className="recommendation-grid">
                  <div className="recommendation-card immediate">
                    <h5>🚨 Immediate Actions</h5>
                    <ul>
                      {performance.filter(s => s.intervention && s.intervention.needed).length > 0 && (
                        <li>Schedule intervention sessions for {performance.filter(s => s.intervention && s.intervention.needed).length} students</li>
                      )}
                      {sortedKCs.filter(kc => (kc.averageMastery || 0) < 0.4).length > 0 && (
                        <li>Review teaching strategies for {sortedKCs.filter(kc => (kc.averageMastery || 0) < 0.4)[0]?.curriculum_code}</li>
                      )}
                      <li>Provide additional practice for struggling concepts</li>
                    </ul>
                  </div>

                  <div className="recommendation-card short-term">
                    <h5>📅 This Week</h5>
                    <ul>
                      <li>Group students by mastery level for differentiated instruction</li>
                      <li>Create peer tutoring pairs with high and low performers</li>
                      <li>Focus class time on weakest knowledge components</li>
                    </ul>
                  </div>

                  <div className="recommendation-card long-term">
                    <h5>🎯 Long-term Goals</h5>
                    <ul>
                      <li>Increase class average to 75% mastery</li>
                      <li>Reduce number of students needing intervention</li>
                      <li>Strengthen understanding in bottom 3 knowledge components</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedPerformanceModal;