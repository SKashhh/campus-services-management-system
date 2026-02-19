import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';
import AllRequests from './pages/AllRequests';
import RequestDetail from './pages/RequestDetail';
import Analytics from './pages/Analytics';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/new-request"
              element={
                <ProtectedRoute>
                  <NewRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-requests"
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              }
            />

            {/* Admin/Staff Routes */}
            <Route
              path="/all-requests"
              element={
                <ProtectedRoute requireStaff={true}>
                  <AllRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requireStaff={true}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Shared Routes */}
            <Route
              path="/request/:id"
              element={
                <ProtectedRoute>
                  <RequestDetail />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
