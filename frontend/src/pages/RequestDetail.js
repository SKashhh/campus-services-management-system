import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestsAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import '../styles/RequestDetail.css';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [request, setRequest] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestsAPI.getById(id);
      setRequest(response.data.request);
      setActivityLog(response.data.activityLog);
      setNewStatus(response.data.request.status);
    } catch (error) {
      console.error('Error fetching request:', error);
      setError(error.response?.data?.error || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === request.status) {
      alert('Status is unchanged');
      return;
    }

    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }

    setUpdating(true);
    try {
      await requestsAPI.updateStatus(id, {
        status: newStatus,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
      });
      alert('Status updated successfully');
      fetchRequest(); // Refresh
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
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
    return <div className="loading">Loading request details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  if (!request) {
    return <div className="no-data">Request not found</div>;
  }

  return (
    <div className="request-detail-container">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Request #{request.request_id}</h1>
      </div>

      <div className="detail-content">
        {/* Main Request Information */}
        <div className="detail-card">
          <div className="card-header">
            <h2>{request.title}</h2>
            <div className="header-badges">
              <span className={`priority-badge ${getPriorityClass(request.priority)}`}>
                {request.priority} priority
              </span>
              <span className={`status-badge ${getStatusClass(request.status)}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Student</label>
                <p>{request.student_name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{request.student_email}</p>
              </div>
              <div className="info-item">
                <label>Service</label>
                <p>{request.service_name}</p>
              </div>
              <div className="info-item">
                <label>Department</label>
                <p>{request.dept_name}</p>
              </div>
              <div className="info-item">
                <label>Submitted</label>
                <p>{new Date(request.submitted_at).toLocaleString()}</p>
              </div>
              {request.completed_at && (
                <div className="info-item">
                  <label>Completed</label>
                  <p>{new Date(request.completed_at).toLocaleString()}</p>
                </div>
              )}
              {request.resolution_hours && (
                <div className="info-item">
                  <label>Resolution Time</label>
                  <p>{parseFloat(request.resolution_hours).toFixed(1)} hours</p>
                </div>
              )}
              {request.assigned_staff_name && (
                <div className="info-item">
                  <label>Assigned To</label>
                  <p>{request.assigned_staff_name}</p>
                </div>
              )}
            </div>

            <div className="description-section">
              <label>Description</label>
              <p className="description-text">{request.description}</p>
            </div>

            {request.rejection_reason && (
              <div className="rejection-section">
                <label>Rejection Reason</label>
                <p className="rejection-text">{request.rejection_reason}</p>
              </div>
            )}

            {request.rating && (
              <div className="feedback-section">
                <label>Student Feedback</label>
                <div className="feedback-rating">
                  {'⭐'.repeat(request.rating)} ({request.rating}/5)
                </div>
                {request.feedback_comment && (
                  <p className="feedback-comment">{request.feedback_comment}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Update (Admin/Staff Only) */}
        {isStaff() && request.status !== 'completed' && (
          <div className="detail-card">
            <div className="card-header">
              <h2>Update Status</h2>
            </div>
            <div className="card-body">
              <div className="status-update-form">
                <div className="form-group">
                  <label htmlFor="newStatus">New Status</label>
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {newStatus === 'rejected' && (
                  <div className="form-group">
                    <label htmlFor="rejectionReason">Rejection Reason *</label>
                    <textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      rows="3"
                    />
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === request.status}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Activity Log</h2>
          </div>
          <div className="card-body">
            {activityLog.length === 0 ? (
              <p className="no-data">No activity recorded</p>
            ) : (
              <div className="activity-timeline">
                {activityLog.map((log) => (
                  <div key={log.log_id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={`status-badge ${getStatusClass(log.new_status)}`}>
                          {log.new_status.replace('_', ' ')}
                        </span>
                        <span className="timeline-date">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      {log.previous_status && (
                        <p className="timeline-change">
                          Changed from: {log.previous_status.replace('_', ' ')}
                        </p>
                      )}
                      {log.changed_by_name && (
                        <p className="timeline-user">By: {log.changed_by_name}</p>
                      )}
                      {log.remarks && (
                        <p className="timeline-remarks">{log.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
