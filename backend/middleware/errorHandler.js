// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Duplicate entry',
          detail: err.detail,
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Referenced record does not exist',
          detail: err.detail,
        });
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Required field missing',
          detail: err.detail,
        });
      case '23514': // Check constraint violation
        return res.status(400).json({
          error: 'Invalid data',
          detail: err.detail,
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: err.message,
        });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
};

module.exports = {
  errorHandler,
  notFound,
};
