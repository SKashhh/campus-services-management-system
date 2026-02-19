const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role 
      });
    }

    next();
  };
};

// Check if user is admin or staff
const isAdminOrStaff = authorize('admin', 'staff');

// Check if user is admin only
const isAdmin = authorize('admin');

// Check if user is student
const isStudent = authorize('student');

module.exports = {
  authenticateToken,
  authorize,
  isAdminOrStaff,
  isAdmin,
  isStudent,
};
