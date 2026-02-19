import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../styles/Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    workload: [],
    performance: [],
    priority: [],
    feedback: [],
    sla: [],
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [workload, performance, priority, feedback, sla] = await Promise.all([
        analyticsAPI.getDepartmentWorkload(),
        analyticsAPI.getServicePerformance(),
        analyticsAPI.getPriorityDistribution(),
        analyticsAPI.getFeedbackRatings(),
        analyticsAPI.getSLACompliance(),
      ]);

      setData({
        workload: workload.data.data,
        performance: performance.data.data.slice(0, 10), // Top 10
        priority: priority.data.data,
        feedback: feedback.data.data,
        sla: sla.data.data,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p className="analytics-subtitle">
          Comprehensive insights into campus service performance
        </p>
      </div>

      {/* Department Workload */}
      <div className="analytics-section">
        <h2>Department Workload Analysis</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.workload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending_count" fill="#FF8042" name="Pending Requests" />
              <Bar dataKey="completed_count" fill="#00C49F" name="Completed Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Requests</th>
                <th>Pending</th>
                <th>Completed</th>
                <th>Avg Resolution (hrs)</th>
                <th>Workload %</th>
              </tr>
            </thead>
            <tbody>
              {data.workload.map((dept, index) => (
                <tr key={index}>
                  <td>{dept.dept_name}</td>
                  <td>{dept.total_requests}</td>
                  <td className="text-warning">{dept.pending_count}</td>
                  <td className="text-success">{dept.completed_count}</td>
                  <td>{dept.avg_resolution_hours || 'N/A'}</td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(dept.workload_percentage || 0, 100)}%`,
                          backgroundColor:
                            dept.workload_percentage > 80
                              ? '#FF8042'
                              : dept.workload_percentage > 50
                              ? '#FFBB28'
                              : '#00C49F',
                        }}
                      ></div>
                    </div>
                    {dept.workload_percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="analytics-section">
        <h2>Priority Distribution</h2>
        <div className="charts-row">
          <div className="chart-half">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.priority}
                  dataKey="total_count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.priority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stats-cards">
            {data.priority.map((item, index) => (
              <div key={index} className="stat-card-small">
                <h4 className={`priority-${item.priority}`}>
                  {item.priority.toUpperCase()} Priority
                </h4>
                <p className="stat-large">{item.total_count}</p>
                <p className="stat-detail">
                  Pending: {item.pending_count} | Completed: {item.completed_count}
                </p>
                <p className="stat-detail">
                  Avg Resolution: {item.avg_resolution_hours || 'N/A'} hrs
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Performance */}
      <div className="analytics-section">
        <h2>Top Service Performance</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.performance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="service_name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="performance_score" fill="#8884D8" name="Performance Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Department</th>
                <th>Total Requests</th>
                <th>Avg Resolution (hrs)</th>
                <th>Completion Rate</th>
                <th>Avg Rating</th>
                <th>Performance Score</th>
              </tr>
            </thead>
            <tbody>
              {data.performance.map((service, index) => (
                <tr key={index}>
                  <td>{service.service_name}</td>
                  <td>{service.dept_name}</td>
                  <td>{service.total_requests}</td>
                  <td>{service.avg_resolution_hours || 'N/A'}</td>
                  <td>{service.completion_rate}%</td>
                  <td>
                    {service.avg_rating ? (
                      <span className="rating">
                        {service.avg_rating} {'⭐'}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        service.performance_score >= 80
                          ? 'text-success'
                          : service.performance_score >= 60
                          ? 'text-warning'
                          : 'text-danger'
                      }
                    >
                      {service.performance_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Ratings */}
      <div className="analytics-section">
        <h2>Feedback & Satisfaction Ratings</h2>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Feedback</th>
                <th>Average Rating</th>
                <th>5-Star Reviews</th>
                <th>1-Star Reviews</th>
                <th>Satisfaction Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.feedback.map((dept, index) => (
                <tr key={index}>
                  <td>{dept.dept_name}</td>
                  <td>{dept.total_feedback}</td>
                  <td>
                    <span className="rating-display">
                      {dept.avg_rating} {'⭐'}
                    </span>
                  </td>
                  <td className="text-success">{dept.five_star_count}</td>
                  <td className="text-danger">{dept.one_star_count}</td>
                  <td>
                    <div className="satisfaction-indicator">
                      <div
                        className="satisfaction-bar"
                        style={{
                          width: `${dept.satisfaction_rate}%`,
                          backgroundColor:
                            dept.satisfaction_rate >= 80
                              ? '#00C49F'
                              : dept.satisfaction_rate >= 60
                              ? '#FFBB28'
                              : '#FF8042',
                        }}
                      ></div>
                      <span>{dept.satisfaction_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="analytics-section">
        <h2>SLA Compliance Report</h2>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>SLA Target (hrs)</th>
                <th>Total Requests</th>
                <th>Within SLA</th>
                <th>Beyond SLA</th>
                <th>Compliance Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.sla.map((dept, index) => (
                <tr key={index}>
                  <td>{dept.dept_name}</td>
                  <td>{dept.response_sla_hours}</td>
                  <td>{dept.total_requests}</td>
                  <td className="text-success">{dept.within_sla}</td>
                  <td className="text-danger">{dept.beyond_sla}</td>
                  <td>
                    <span
                      className={
                        dept.sla_compliance_rate >= 90
                          ? 'badge-success'
                          : dept.sla_compliance_rate >= 70
                          ? 'badge-warning'
                          : 'badge-danger'
                      }
                    >
                      {dept.sla_compliance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
