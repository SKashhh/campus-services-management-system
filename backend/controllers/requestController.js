const { query, getClient } = require('../config/database');

// Create new request
const createRequest = async (req, res, next) => {
  try {
    const { serviceId, title, description, priority } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!serviceId || !title || !description || !priority) {
      return res.status(400).json({ 
        error: 'Service ID, title, description, and priority are required' 
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    // Insert request
    const result = await query(
      `INSERT INTO requests (user_id, service_id, title, description, priority, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING request_id, user_id, service_id, title, description, priority, status, submitted_at`,
      [userId, serviceId, title, description, priority]
    );

    res.status(201).json({
      message: 'Request submitted successfully',
      request: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get all requests (admin/staff view)
const getAllRequests = async (req, res, next) => {
  try {
    const { status, priority, serviceId, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        r.request_id, r.title, r.description, r.priority, r.status,
        r.submitted_at, r.approved_at, r.completed_at, r.resolution_hours,
        u.name AS student_name, u.email AS student_email,
        s.service_name, d.dept_name,
        COALESCE(f.rating, 0) AS feedback_rating
      FROM requests r
      JOIN users u ON r.user_id = u.user_id
      JOIN service_types s ON r.service_id = s.service_id
      JOIN departments d ON s.dept_id = d.dept_id
      LEFT JOIN feedback f ON r.request_id = f.request_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryText += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      queryText += ` AND r.priority = $${paramCount}`;
      params.push(priority);
    }

    if (serviceId) {
      paramCount++;
      queryText += ` AND r.service_id = $${paramCount}`;
      params.push(serviceId);
    }

    queryText += ` ORDER BY 
      CASE r.priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      r.submitted_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM requests WHERE 1=1';
    const countParams = [];
    let countParamNum = 0;

    if (status) {
      countParamNum++;
      countQuery += ` AND status = $${countParamNum}`;
      countParams.push(status);
    }
    if (priority) {
      countParamNum++;
      countQuery += ` AND priority = $${countParamNum}`;
      countParams.push(priority);
    }
    if (serviceId) {
      countParamNum++;
      countQuery += ` AND service_id = $${countParamNum}`;
      countParams.push(serviceId);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      requests: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's own requests
const getMyRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        r.request_id, r.title, r.description, r.priority, r.status,
        r.submitted_at, r.approved_at, r.completed_at, r.resolution_hours,
        s.service_name, d.dept_name,
        f.rating AS feedback_rating, f.comment AS feedback_comment
      FROM requests r
      JOIN service_types s ON r.service_id = s.service_id
      JOIN departments d ON s.dept_id = d.dept_id
      LEFT JOIN feedback f ON r.request_id = f.request_id
      WHERE r.user_id = $1
      ORDER BY r.submitted_at DESC`,
      [userId]
    );

    res.json({
      requests: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get single request details
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await query(
      `SELECT 
        r.*,
        u.name AS student_name, u.email AS student_email,
        s.service_name, d.dept_name,
        f.rating, f.comment AS feedback_comment, f.submitted_at AS feedback_date,
        assigned.name AS assigned_staff_name
      FROM requests r
      JOIN users u ON r.user_id = u.user_id
      JOIN service_types s ON r.service_id = s.service_id
      JOIN departments d ON s.dept_id = d.dept_id
      LEFT JOIN feedback f ON r.request_id = f.request_id
      LEFT JOIN users assigned ON r.assigned_to = assigned.user_id
      WHERE r.request_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Authorization check - students can only view their own requests
    if (userRole === 'student' && request.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get activity logs
    const logs = await query(
      `SELECT 
        rl.log_id, rl.previous_status, rl.new_status, rl.remarks, rl.changed_at,
        u.name AS changed_by_name
      FROM request_logs rl
      LEFT JOIN users u ON rl.changed_by = u.user_id
      WHERE rl.request_id = $1
      ORDER BY rl.changed_at DESC`,
      [id]
    );

    res.json({
      request: request,
      activityLog: logs.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Update request status (admin/staff only)
const updateRequestStatus = async (req, res, next) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const staffId = req.user.userId;

    // Validate status
    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // If rejecting, reason is required
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await client.query('BEGIN');

    // Update request
    const updateQuery = status === 'rejected'
      ? `UPDATE requests 
         SET status = $1, rejection_reason = $2, assigned_to = $3, updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $4
         RETURNING *`
      : `UPDATE requests 
         SET status = $1, assigned_to = $2, updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $3
         RETURNING *`;

    const params = status === 'rejected'
      ? [status, rejectionReason, staffId, id]
      : [status, staffId, id];

    const result = await client.query(updateQuery, params);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Request status updated successfully',
      request: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Delete request (admin only or student's own pending request)
const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if request exists and get its details
    const checkResult = await query(
      'SELECT user_id, status FROM requests WHERE request_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = checkResult.rows[0];

    // Authorization: admin can delete any, student can only delete their own pending requests
    if (userRole === 'student') {
      if (request.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (request.status !== 'pending') {
        return res.status(403).json({ error: 'Can only delete pending requests' });
      }
    }

    // Delete request
    await query('DELETE FROM requests WHERE request_id = $1', [id]);

    res.json({
      message: 'Request deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};
