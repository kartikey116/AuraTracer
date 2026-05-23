import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import IssuesFeed from './pages/IssuesFeed';
import IssueDetails from './pages/IssueDetails';
import LiveLogs from './pages/LiveLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SetupGuide from './pages/SetupGuide';

// Layout
import DashboardLayout from './components/DashboardLayout';

/**
 * Route protection wrapper.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darkest text-zinc-100 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <SetupGuide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues"
        element={
          <ProtectedRoute>
            <IssuesFeed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/:id"
        element={
          <ProtectedRoute>
            <IssueDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <LiveLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
