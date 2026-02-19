const { query } = require('../config/database');

// Get department workload analysis
const getDepartmentWorkload = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM get_department_workload()');

    res.json({
      data: result.rows,
      metadata: {
        description: 'Department workload analysis showing pending requests and average resolution time',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get service performance metrics
const getServicePerformance = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM get_service_performance()');

    res.json({
      data: result.rows,
      metadata: {
        description: 'Service performance metrics including completion rate and ratings',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get priority distribution
const getPriorityDistribution = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM get_priority_distribution()');

    res.json({
      data: result.rows,
      metadata: {
        description: 'Distribution of requests by priority level',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get feedback ratings analysis
const getFeedbackRatings = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM get_feedback_ratings()');

    res.json({
      data: result.rows,
      metadata: {
        description: 'Feedback-based ratings and satisfaction rates by department',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get priority summary view
const getPrioritySummary = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM priority_summary');

    res.json({
      data: result.rows,
      metadata: {
        description: 'Summary of requests grouped by priority',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly analytics (materialized view)
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;

    const result = await query(
      'SELECT * FROM monthly_analytics ORDER BY month DESC LIMIT $1',
      [months]
    );

    res.json({
      data: result.rows,
      metadata: {
        description: 'Monthly aggregated analytics data',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh monthly analytics materialized view (admin only)
const refreshMonthlyAnalytics = async (req, res, next) => {
  try {
    await query('SELECT refresh_monthly_analytics()');

    res.json({
      message: 'Monthly analytics refreshed successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard overview statistics
const getDashboardOverview = async (req, res, next) => {
  try {
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_requests,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_requests,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_requests,
        COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count,
        ROUND(AVG(resolution_hours) FILTER (WHERE status = 'completed'), 2) AS avg_resolution_hours
      FROM requests
    `;

    const stats = await query(statsQuery);

    // Get feedback statistics
    const feedbackQuery = `
      SELECT 
        COUNT(*) AS total_feedback,
        ROUND(AVG(rating), 2) AS avg_rating,
        COUNT(*) FILTER (WHERE rating >= 4) AS positive_feedback,
        COUNT(*) FILTER (WHERE rating <= 2) AS negative_feedback
      FROM feedback
    `;

    const feedbackStats = await query(feedbackQuery);

    // Get recent activity (last 7 days)
    const recentActivityQuery = `
      SELECT 
        DATE(submitted_at) AS date,
        COUNT(*) AS requests_count
      FROM requests
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `;

    const recentActivity = await query(recentActivityQuery);

    // Get top performing services
    const topServicesQuery = `
      SELECT 
        s.service_name,
        d.dept_name,
        COUNT(r.request_id) AS request_count,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM service_types s
      JOIN departments d ON s.dept_id = d.dept_id
      LEFT JOIN requests r ON s.service_id = r.service_id
      LEFT JOIN feedback f ON r.request_id = f.request_id
      GROUP BY s.service_id, s.service_name, d.dept_name
      HAVING COUNT(r.request_id) > 0
      ORDER BY avg_rating DESC NULLS LAST
      LIMIT 5
    `;

    const topServices = await query(topServicesQuery);

    res.json({
      overview: stats.rows[0],
      feedback: feedbackStats.rows[0],
      recentActivity: recentActivity.rows,
      topServices: topServices.rows,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// Get SLA compliance report
const getSLACompliance = async (req, res, next) => {
  try {
    const slaQuery = `
      SELECT 
        d.dept_name,
        d.response_sla_hours,
        COUNT(r.request_id) AS total_requests,
        COUNT(r.request_id) FILTER (
          WHERE r.resolution_hours <= d.response_sla_hours
        ) AS within_sla,
        COUNT(r.request_id) FILTER (
          WHERE r.resolution_hours > d.response_sla_hours
        ) AS beyond_sla,
        ROUND(
          (COUNT(r.request_id) FILTER (WHERE r.resolution_hours <= d.response_sla_hours)::NUMERIC / 
          NULLIF(COUNT(r.request_id) FILTER (WHERE r.status = 'completed'), 0)) * 100,
          2
        ) AS sla_compliance_rate
      FROM departments d
      LEFT JOIN service_types s ON d.dept_id = s.dept_id
      LEFT JOIN requests r ON s.service_id = r.service_id
      WHERE r.status = 'completed'
      GROUP BY d.dept_id, d.dept_name, d.response_sla_hours
      ORDER BY sla_compliance_rate DESC NULLS LAST
    `;

    const result = await query(slaQuery);

    res.json({
      data: result.rows,
      metadata: {
        description: 'SLA compliance report by department',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity report (admin only)
const getUserActivityReport = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const activityQuery = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        COUNT(r.request_id) AS total_requests,
        COUNT(r.request_id) FILTER (WHERE r.status = 'completed') AS completed_requests,
        COUNT(f.feedback_id) AS feedback_given,
        MAX(r.submitted_at) AS last_request_date
      FROM users u
      LEFT JOIN requests r ON u.user_id = r.user_id 
        AND r.submitted_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      LEFT JOIN feedback f ON r.request_id = f.request_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.name, u.email, u.role
      HAVING COUNT(r.request_id) > 0
      ORDER BY total_requests DESC
    `;

    const result = await query(activityQuery);

    res.json({
      data: result.rows,
      metadata: {
        description: `User activity report for last ${days} days`,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentWorkload,
  getServicePerformance,
  getPriorityDistribution,
  getFeedbackRatings,
  getPrioritySummary,
  getMonthlyAnalytics,
  refreshMonthlyAnalytics,
  getDashboardOverview,
  getSLACompliance,
  getUserActivityReport,
};
