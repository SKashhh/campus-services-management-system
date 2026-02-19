const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate role
    const validRoles = ['student', 'admin', 'staff'];
    const userRole = role || 'student';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, name, email, role, created_at`,
      [name, email, passwordHash, userRole]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await query(
      'SELECT user_id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT user_id, name, email, role, created_at 
       FROM users 
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
