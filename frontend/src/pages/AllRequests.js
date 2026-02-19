import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsAPI, servicesAPI } from '../services/api';
import '../styles/Requests.css';

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    serviceId: '',
  });
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAllServices();
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.serviceId) params.serviceId = filters.serviceId;

      const response = await requestsAPI.getAll(params);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      serviceId: '',
    });
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
    return <div className="loading">Loading requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h1>All Service Requests</h1>
        <p className="header-subtitle">
          Total: {requests.length} request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="serviceId">Service</label>
            <select
              id="serviceId"
              name="serviceId"
              value={filters.serviceId}
              onChange={handleFilterChange}
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.service_name} ({service.dept_name})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {requests.length === 0 ? (
        <div className="no-data">
          <p>No requests found matching the filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Student</th>
                <th>Service</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>#{request.request_id}</td>
                  <td className="request-title">{request.title}</td>
                  <td>{request.student_name}</td>
                  <td>
                    {request.service_name}
                    <br />
                    <small className="text-muted">{request.dept_name}</small>
                  </td>
                  <td>
                    <span
                      className={`priority-badge ${getPriorityClass(
                        request.priority
                      )}`}
                    >
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {request.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Date(request.submitted_at).toLocaleDateString()}
                  </td>
                  <td>
                    {request.feedback_rating ? (
                      <span className="rating">
                        {'⭐'.repeat(request.feedback_rating)}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-small btn-primary"
                      onClick={() =>
                        navigate(`/request/${request.request_id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllRequests;
