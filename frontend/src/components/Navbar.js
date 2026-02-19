import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Campus Services
        </Link>

        <ul className="navbar-menu">
          {user ? (
            <>
              <li className="navbar-item">
                <Link to="/dashboard" className="navbar-link">
                  Dashboard
                </Link>
              </li>
              
              {!isStaff() && (
                <>
                  <li className="navbar-item">
                    <Link to="/new-request" className="navbar-link">
                      New Request
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/my-requests" className="navbar-link">
                      My Requests
                    </Link>
                  </li>
                </>
              )}

              {isStaff() && (
                <>
                  <li className="navbar-item">
                    <Link to="/all-requests" className="navbar-link">
                      All Requests
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/analytics" className="navbar-link">
                      Analytics
                    </Link>
                  </li>
                </>
              )}

              <li className="navbar-item navbar-user">
                <span className="user-info">
                  {user.name} ({user.role})
                </span>
              </li>

              <li className="navbar-item">
                <button onClick={handleLogout} className="navbar-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/register" className="navbar-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
