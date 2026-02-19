import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI, requestsAPI } from '../services/api';
import '../styles/Form.css';

const NewRequest = () => {
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: '',
    serviceId: '',
    title: '',
    description: '',
    priority: 'medium',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.departmentId) {
      const filtered = services.filter(
        (s) => s.dept_id === parseInt(formData.departmentId)
      );
      setFilteredServices(filtered);
      setFormData((prev) => ({ ...prev, serviceId: '' }));
    } else {
      setFilteredServices([]);
    }
  }, [formData.departmentId, services]);

  const fetchData = async () => {
    try {
      const [deptResponse, servicesResponse] = await Promise.all([
        servicesAPI.getAllDepartments(),
        servicesAPI.getAllServices(),
      ]);
      setDepartments(deptResponse.data.departments);
      setServices(servicesResponse.data.services);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load departments and services');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await requestsAPI.create({
        serviceId: formData.serviceId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-requests');
      }, 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.response?.data?.error || 'Failed to submit request');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <h2>✓ Request Submitted Successfully!</h2>
          <p>Redirecting to your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Submit New Request</h1>
        <p className="form-subtitle">Fill in the details of your service request</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-group">
            <label htmlFor="departmentId">Department *</label>
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              required
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="serviceId">Service Type *</label>
            <select
              id="serviceId"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
              disabled={!formData.departmentId}
            >
              <option value="">
                {formData.departmentId
                  ? 'Select a service'
                  : 'Select department first'}
              </option>
              {filteredServices.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.service_name}
                </option>
              ))}
            </select>
            {formData.departmentId && filteredServices.length === 0 && (
              <p className="help-text">No services available for this department</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Request Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief title for your request"
              maxLength="200"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Provide detailed information about your request"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority Level *</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="low">Low - Non-urgent issue</option>
              <option value="medium">Medium - Normal priority</option>
              <option value="high">High - Urgent issue</option>
            </select>
            <p className="help-text">
              High priority should only be used for urgent safety or critical issues
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
