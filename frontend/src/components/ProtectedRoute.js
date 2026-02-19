import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireStaff = false }) => {
  const { isAuthenticated, isAdmin, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStaff && !isStaff()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
