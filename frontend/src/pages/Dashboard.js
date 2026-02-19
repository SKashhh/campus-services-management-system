import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { analyticsAPI, requestsAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isStaff()) {
        // Admin/Staff Dashboard
        const response = await analyticsAPI.getDashboard();
        setStats(response.data);
      } else {
        // Student Dashboard
        const response = await requestsAPI.getMy();
        setRecentRequests(response.data.requests.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'approved':
      case 'in_progress':
        return 'status-in-progress';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}!</h1>
        <p className="dashboard-subtitle">
          {isStaff() ? 'Admin Dashboard' : 'Student Dashboard'}
        </p>
      </div>

      {isStaff() ? (
        // Admin/Staff Dashboard
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Requests</h3>
              <p className="stat-number">{stats?.overview?.total_requests || 0}</p>
            </div>
            <div className="stat-card stat-pending">
              <h3>Pending</h3>
              <p className="stat-number">{stats?.overview?.pending_requests || 0}</p>
            </div>
            <div className="stat-card stat-progress">
              <h3>In Progress</h3>
              <p className="stat-number">{stats?.overview?.in_progress_requests || 0}</p>
            </div>
            <div className="stat-card stat-completed">
              <h3>Completed</h3>
              <p className="stat-number">{stats?.overview?.completed_requests || 0}</p>
            </div>
            <div className="stat-card stat-high">
              <h3>High Priority</h3>
              <p className="stat-number">{stats?.overview?.high_priority_count || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Avg Resolution Time</h3>
              <p className="stat-number">
                {stats?.overview?.avg_resolution_hours 
                  ? `${parseFloat(stats.overview.avg_resolution_hours).toFixed(1)}h`
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="feedback-stats">
            <h2>Feedback Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Feedback</h3>
                <p className="stat-number">{stats?.feedback?.total_feedback || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Average Rating</h3>
                <p className="stat-number">
                  {stats?.feedback?.avg_rating 
                    ? `${parseFloat(stats.feedback.avg_rating).toFixed(1)} / 5.0`
                    : 'N/A'}
                </p>
              </div>
              <div className="stat-card stat-completed">
                <h3>Positive Feedback</h3>
                <p className="stat-number">{stats?.feedback?.positive_feedback || 0}</p>
              </div>
              <div className="stat-card stat-rejected">
                <h3>Negative Feedback</h3>
                <p className="stat-number">{stats?.feedback?.negative_feedback || 0}</p>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="action-button"
                onClick={() => navigate('/all-requests')}
              >
                View All Requests
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/analytics')}
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Student Dashboard
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Requests</h3>
              <p className="stat-number">{recentRequests.length}</p>
            </div>
            <div className="stat-card stat-pending">
              <h3>Pending</h3>
              <p className="stat-number">
                {recentRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="stat-card stat-completed">
              <h3>Completed</h3>
              <p className="stat-number">
                {recentRequests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="recent-requests">
            <h2>Recent Requests</h2>
            {recentRequests.length === 0 ? (
              <p className="no-data">No requests yet. Submit your first request!</p>
            ) : (
              <div className="requests-list">
                {recentRequests.map((request) => (
                  <div key={request.request_id} className="request-card">
                    <div className="request-header">
                      <h3>{request.title}</h3>
                      <span className={`priority-badge ${getPriorityClass(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    <p className="request-service">{request.service_name} - {request.dept_name}</p>
                    <div className="request-footer">
                      <span className={`status-badge ${getStatusClass(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span className="request-date">
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="action-button"
                onClick={() => navigate('/new-request')}
              >
                Submit New Request
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/my-requests')}
              >
                View All My Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
