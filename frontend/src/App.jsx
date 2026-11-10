import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Page Imports
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Reports } from './pages/Reports';
import { AIAssistant } from './pages/AIAssistant';
import { UserManagement } from './pages/UserManagement';

// Full screen auth loader
const AuthLoadingScreen = () => (
  <div className="auth-loading-screen" role="status" aria-live="polite">
    <div className="auth-spinner" aria-hidden="true" />
    <div className="auth-loading-text">Authenticating session...</div>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Only Route Guard
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { showError } = useToast();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      showError?.('Access denied: Administrator privileges required.');
    }
  }, [loading, isAuthenticated, isAdmin, showError]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};


// Public Route Guard (Redirects away from Login if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
