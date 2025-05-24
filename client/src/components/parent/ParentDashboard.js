import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import './ParentDashboard.css';

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [childrenProgress, setChildrenProgress] = useState({});
  const [childrenActivity, setChildrenActivity] = useState({});
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user from context

  // Use the authenticated user's ID
  const parentId = user?.id;
  
  useEffect(() => {
    const fetchData = async () => {
      // Ensure parentId is available before fetching
      if (!parentId) {
        setError("Could not identify parent. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        // Fetch parent profile
        const parentResponse = await axios.get(`/api/parents/${parentId}`);
        setParent(parentResponse.data);
        
        // Fetch children
        const childrenResponse = await axios.get(`/api/parents/${parentId}/children`);
        setChildren(childrenResponse.data);
        
        // Fetch progress data and activity data for each child
        const progressData = {};
        const activityData = {};
        
        for (const child of childrenResponse.data) {
          // Get weekly report data
          const weeklyReportResponse = await axios.get(`/api/parents/students/${child.id}/weekly-report`);
          progressData[child.id] = weeklyReportResponse.data;
          
          // Get recent activity data
          const recentActivityResponse = await axios.get(`/api/students/${child.id}/detailed-performance`);
          if (recentActivityResponse.data.recentResponses) {
            activityData[child.id] = recentActivityResponse.data.recentResponses;
          } else {
            activityData[child.id] = [];
          }
        }
        
        setChildrenProgress(progressData);
        setChildrenActivity(activityData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [parentId]); // Dependency array includes parentId from context
  
  if (loading) {
    return (
      <div className="loading">
        <h2>Loading your dashboard...</h2>
        <p>Please wait while we gather your children's data.</p>
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
  
  // Handle case where parent has no children linked
  if (children.length === 0) {
    return (
      <div className="parent-dashboard fullwidth">
        <div className="dashboard-header">
          <h1>Welcome, {parent?.name || 'Parent'}!</h1>
          <p>Let's get started by linking your child's account</p>
        </div>
        
        <div className="no-children-container">
          <div className="no-children-card">
            <div className="no-children-icon">👨‍👩‍👧‍👦</div>
            <h2>No Children Linked Yet</h2>
            <p className="no-children-message">
              To view your child's learning progress, you need to link their student account first.
            </p>
            
            <div className="link-child-instructions">
              <h3>How to Link Your Child's Account:</h3>
              <ol>
                <li>Ask your child's teacher for their student username or email</li>
                <li>Contact your school administrator to link the accounts</li>
                <li>Once linked, you'll be able to track their progress here</li>
              </ol>
            </div>
            
            <div className="contact-info">
              <p>Need help? Contact your child's teacher or school administrator.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="parent-dashboard fullwidth">
      <div className="dashboard-header">
        <h1>Welcome, {parent?.name || 'Parent'}!</h1>
        <p>Stay updated on your children's learning progress</p>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Children</h3>
          <div className="count">{children.length}</div>
        </div>
        
        <div className="summary-card">
          <h3>Active Today</h3>
          <div className="count">
            {children.filter(child => {
              const progress = childrenProgress[child.id] || {};
              const weeklyProgress = progress.weeklyProgress || {};
              const dailyActivity = weeklyProgress.dailyActivity || [];
              const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return dailyActivity.some(day => day.date === today && day.timeSpent > 0);
            }).length}
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Weekly Reports</h3>
          <div className="count">{children.length}</div>
        </div>
      </div>
      
      <div className="children-section">
        <h2>Your Children</h2>
        
        <div className="children-grid">
          {children.map(child => {
            const progress = childrenProgress[child.id] || {};
            const weeklyProgress = progress.weeklyProgress || {};
            const recentActivity = childrenActivity[child.id] || [];
            
            // Calculate average mastery
            const averageMastery = weeklyProgress.averageMastery || 0;
            
            // Calculate weekly change
            const weeklyChange = weeklyProgress.weeklyChange || 0;
            const changeClass = weeklyChange > 0 ? 'positive' : weeklyChange < 0 ? 'negative' : 'neutral';
            
            // Calculate time spent this week in minutes
            const timeSpentMinutes = ((weeklyProgress.totalTimeSpent || 0) / 60).toFixed(0);
            
            // Calculate correct answer rate
            const correctRate = ((weeklyProgress.correctRate || 0) * 100).toFixed(0);
            
            return (
              <div key={child.id} className="child-card enhanced">
                <div className="child-header-enhanced">
                  <div className="child-info">
                    <h3>{child.name}</h3>
                    <p>Grade {child.grade_level}</p>
                  </div>
                  <div className="child-avatar">
                    <div className="avatar-placeholder">{child.name.charAt(0)}</div>
                  </div>
                </div>
                
                <div className="child-stats-enhanced">
                  <div className="stat">
                    <span className="stat-value">{(averageMastery * 100).toFixed(0)}%</span>
                    <span className="stat-label">Overall Mastery</span>
                  </div>
                  
                  <div className="stat">
                    <span className={`stat-value ${changeClass}`}>
                      {weeklyChange > 0 ? '+' : ''}{(weeklyChange * 100).toFixed(0)}%
                      <span className="trend-indicator">{weeklyChange > 0 ? '↑' : weeklyChange < 0 ? '↓' : '→'}</span>
                    </span>
                    <span className="stat-label">Weekly Change</span>
                  </div>
                  
                  <div className="stat">
                    <span className="stat-value">{weeklyProgress.activeDays || 0}/7</span>
                    <span className="stat-label">Active Days</span>
                  </div>
                </div>
                
                <div className="activity-summary">
                  <div className="summary-item">
                    <h4>{timeSpentMinutes} min</h4>
                    <p>Time Spent</p>
                  </div>
                  <div className="summary-item">
                    <h4>{weeklyProgress.totalQuestionsAnswered || 0}</h4>
                    <p>Questions</p>
                  </div>
                  <div className="summary-item">
                    <h4>{correctRate}%</h4>
                    <p>Correct</p>
                  </div>
                </div>
                
                {recentActivity.length > 0 && (
                  <div className="recent-activity-preview">
                    <h4>Recent Activity</h4>
                    <div className="recent-item">
                      <div className="activity-result-badge" 
                           title={recentActivity[0].correct ? "Correct" : "Incorrect"}>
                        {recentActivity[0].correct ? "✓" : "✗"}
                      </div>
                      <div className="activity-brief">
                        <p className="activity-content-preview">{recentActivity[0].content}</p>
                        <p className="activity-meta">
                          {new Date(recentActivity[0].created_at).toLocaleDateString()} • 
                          Difficulty: {recentActivity[0].difficulty}/5
                        </p>
                      </div>
                    </div>
                    <div className="recent-activity-count">
                      {recentActivity.length - 1} more activities this week
                    </div>
                  </div>
                )}
                
                {progress.recommendations && progress.recommendations.length > 0 && (
                  <div className="learning-focus">
                    <h4>Learning Focus</h4>
                    <p>{progress.recommendations[0].title}</p>
                  </div>
                )}
                
                <div className="child-actions">
                  <Link to={`/parent/child/${child.id}`} className="button primary">
                    View Progress
                  </Link>
                  <Link to={`/parent/child/${child.id}/report`} className="button secondary">
                    Weekly Report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="resources-section">
        <h2>Learning Resources</h2>
        
        <div className="resources-grid">
          <div className="resource-card">
            <h3>Math Practice Activities</h3>
            <p>Fun activities to reinforce math concepts at home</p>
            <button className="button">View Resources</button>
          </div>
          
          <div className="resource-card">
            <h3>Math Games Collection</h3>
            <p>Interactive games that make learning math enjoyable</p>
            <button className="button">View Resources</button>
          </div>
          
          <div className="resource-card">
            <h3>Parent Guides</h3>
            <p>How to support your child's math learning journey</p>
            <button className="button">View Resources</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
