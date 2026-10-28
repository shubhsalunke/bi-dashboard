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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '10px' }}>
            <Logo size={40} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>Smart BI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            A simple dashboard for tracking sales, customers, and business revenue.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '4px',
            padding: '10px 12px',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '16px',
          }}>
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
            {emailError && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {emailError}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
                style={{ paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle visibility"
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {passwordError}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px' }}
            disabled={loading || !isFormValid}
          >
            {loading ? 'Signing in...' : 'Sign in to Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
            Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('admin@bi.corp', 'Admin123!')}
              style={{ fontSize: '0.75rem' }}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('manager@bi.corp', 'Manager123!')}
              style={{ fontSize: '0.75rem' }}
            >
              Manager
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('analyst@bi.corp', 'Analyst123!')}
              style={{ fontSize: '0.75rem' }}
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
