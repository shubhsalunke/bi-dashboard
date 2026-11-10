import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/common/Logo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Email validation
  const getEmailError = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      return touched.email ? 'Email address is required' : '';
    }
    if (trimmed.length > 254) {
      return 'Email must not exceed 254 characters';
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Password validation
  const getPasswordError = () => {
    if (!password) {
      return touched.password ? 'Password is required' : '';
    }
    if (password.length > 128) {
      return 'Password must not exceed 128 characters';
    }
    return '';
  };

  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const isFormValid =
    email.trim().length > 0 &&
    email.trim().length <= 254 &&
    EMAIL_REGEX.test(email.trim()) &&
    password.length > 0 &&
    password.length <= 128;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({ email: true, password: true });
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await login({ email: email.trim(), password });
      showToast(`Welcome back, ${user.name}`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setTouched({ email: true, password: true });
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Logo size={40} />
          </div>
          <h1 className="login-title">Sales Admin</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="user@example.com"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              required
            />
            {emailError && <div className="form-error">{emailError}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control password-input"
                placeholder="Password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle visibility"
                title={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle-btn"
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {passwordError && <div className="form-error">{passwordError}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo-section">
          <div className="login-demo-label">Demo Accounts</div>
          <div className="login-demo-grid">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('admin@bi.corp', 'Admin123!')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('manager@bi.corp', 'Manager123!')}
            >
              Manager
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('analyst@bi.corp', 'Analyst123!')}
            >
              Analyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
