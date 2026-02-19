const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', serviceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Campus Services Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      requests: '/api/requests',
      feedback: '/api/feedback',
      analytics: '/api/analytics',
      services: '/api/services',
      departments: '/api/departments',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Campus Services Management System - Backend');
  console.log('='.repeat(50));
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = app;
