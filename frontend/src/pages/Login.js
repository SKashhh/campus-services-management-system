import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">

        {/* LEFT PANEL */}
        <div className="auth-left">

          {/* ✅ LOGO STRIP */}
          <div className="logo-strip">
            <img
              src="/thapar_logo.png"
              alt="Thapar Logo"
              className="auth-logo"
            />
          </div>

          <h2 className="auth-title">
            Campus Services <br /> Management System
          </h2>

          <p className="auth-desc">
            Submit service requests, track progress, and manage campus operations
            seamlessly across departments.
          </p>

          <ul className="auth-features">
            <li>✔ Raise requests in seconds</li>
            <li>✔ Track real-time status</li>
            <li>✔ Department-wise handling</li>
            <li>✔ Feedback & resolution support</li>
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-card">
          <h1>Login</h1>
          <p className="auth-subtitle">Campus Services Portal</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;