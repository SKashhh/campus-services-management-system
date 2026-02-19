import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsAPI, feedbackAPI } from '../services/api';
import '../styles/Requests.css';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await requestsAPI.getMy();
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests');
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

  const handleFeedbackClick = (request) => {
    setSelectedRequest(request);
    setShowFeedbackModal(true);
    setFeedback({ rating: 5, comment: '' });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackAPI.submit({
        requestId: selectedRequest.request_id,
        rating: feedback.rating,
        comment: feedback.comment,
      });
      setShowFeedbackModal(false);
      fetchRequests(); // Refresh to show feedback submitted
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.response?.data?.error || 'Failed to submit feedback');
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await requestsAPI.delete(requestId);
        setRequests(requests.filter((r) => r.request_id !== requestId));
      } catch (error) {
        console.error('Error deleting request:', error);
        alert(error.response?.data?.error || 'Failed to delete request');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading your requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h1>My Requests</h1>
        <button className="btn-primary" onClick={() => navigate('/new-request')}>
          + New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="no-data">
          <p>You haven't submitted any requests yet.</p>
          <button className="btn-primary" onClick={() => navigate('/new-request')}>
            Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.request_id} className="request-item">
              <div className="request-item-header">
                <h3>{request.title}</h3>
                <div className="request-badges">
                  <span className={`priority-badge ${getPriorityClass(request.priority)}`}>
                    {request.priority}
                  </span>
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="request-item-body">
                <p className="request-description">{request.description}</p>
                <div className="request-info">
                  <span className="info-label">Service:</span>
                  <span>{request.service_name}</span>
                </div>
                <div className="request-info">
                  <span className="info-label">Department:</span>
                  <span>{request.dept_name}</span>
                </div>
                <div className="request-info">
                  <span className="info-label">Submitted:</span>
                  <span>{new Date(request.submitted_at).toLocaleString()}</span>
                </div>
                {request.completed_at && (
                  <div className="request-info">
                    <span className="info-label">Completed:</span>
                    <span>{new Date(request.completed_at).toLocaleString()}</span>
                  </div>
                )}
                {request.resolution_hours && (
                  <div className="request-info">
                    <span className="info-label">Resolution Time:</span>
                    <span>{parseFloat(request.resolution_hours).toFixed(1)} hours</span>
                  </div>
                )}
                {request.feedback_rating && (
                  <div className="request-info">
                    <span className="info-label">Your Rating:</span>
                    <span>{'⭐'.repeat(request.feedback_rating)}</span>
                  </div>
                )}
              </div>

              <div className="request-item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/request/${request.request_id}`)}
                >
                  View Details
                </button>
                {request.status === 'completed' && !request.feedback_rating && (
                  <button
                    className="btn-primary"
                    onClick={() => handleFeedbackClick(request)}
                  >
                    Give Feedback
                  </button>
                )}
                {request.status === 'pending' && (
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(request.request_id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Feedback</h2>
            <p className="modal-subtitle">
              Request: {selectedRequest?.title}
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label htmlFor="rating">Rating *</label>
                <select
                  id="rating"
                  value={feedback.rating}
                  onChange={(e) =>
                    setFeedback({ ...feedback, rating: parseInt(e.target.value) })
                  }
                  required
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Comment (Optional)</label>
                <textarea
                  id="comment"
                  value={feedback.comment}
                  onChange={(e) =>
                    setFeedback({ ...feedback, comment: e.target.value })
                  }
                  placeholder="Share your experience..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
