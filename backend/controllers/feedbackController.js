const { query } = require('../config/database');

// Submit feedback for a completed request
const submitFeedback = async (req, res, next) => {
  try {
    const { requestId, rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!requestId || !rating) {
      return res.status(400).json({ error: 'Request ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if request belongs to user and is completed
    const requestCheck = await query(
      'SELECT user_id, status FROM requests WHERE request_id = $1',
      [requestId]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestCheck.rows[0];

    if (request.user_id !== userId) {
      return res.status(403).json({ error: 'Can only submit feedback for your own requests' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Can only submit feedback for completed requests' });
    }

    // Check if feedback already exists
    const existingFeedback = await query(
      'SELECT feedback_id FROM feedback WHERE request_id = $1',
      [requestId]
    );

    if (existingFeedback.rows.length > 0) {
      return res.status(409).json({ error: 'Feedback already submitted for this request' });
    }

    // Insert feedback (trigger will validate completion status)
    const result = await query(
      `INSERT INTO feedback (request_id, rating, comment) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [requestId, rating, comment || null]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get feedback for a specific request
const getFeedbackByRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const result = await query(
      `SELECT f.*, u.name AS student_name 
       FROM feedback f
       JOIN requests r ON f.request_id = r.request_id
       JOIN users u ON r.user_id = u.user_id
       WHERE f.request_id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No feedback found for this request' });
    }

    res.json({
      feedback: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get all feedback (admin/staff only)
const getAllFeedback = async (req, res, next) => {
  try {
    const { minRating, maxRating, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        f.feedback_id, f.request_id, f.rating, f.comment, f.submitted_at,
        r.title AS request_title, r.priority,
        u.name AS student_name, u.email AS student_email,
        s.service_name, d.dept_name
      FROM feedback f
      JOIN requests r ON f.request_id = r.request_id
      JOIN users u ON r.user_id = u.user_id
      JOIN service_types s ON r.service_id = s.service_id
      JOIN departments d ON s.dept_id = d.dept_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (minRating) {
      paramCount++;
      queryText += ` AND f.rating >= $${paramCount}`;
      params.push(minRating);
    }

    if (maxRating) {
      paramCount++;
      queryText += ` AND f.rating <= $${paramCount}`;
      params.push(maxRating);
    }

    queryText += ` ORDER BY f.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      feedback: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByRequest,
  getAllFeedback,
};
