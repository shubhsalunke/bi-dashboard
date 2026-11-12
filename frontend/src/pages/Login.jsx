import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth.api';
import { Logo } from '../components/common/Logo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_VERSION = '1.0.0';
const COMPANY_NAME = 'BI Analytics Corp';

const getSafeRedirectUrl = (location, searchParams) => {
  const fromState = location.state?.from;
  if (fromState?.pathname && !fromState.pathname.startsWith('/login')) {
    return `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}`;
  }
  const paramRedirect = searchParams.get('redirect');
  if (
    paramRedirect &&
    paramRedirect.startsWith('/') &&
    !paramRedirect.startsWith('//') &&
    !paramRedirect.startsWith('/login')
  ) {
    return paramRedirect;
  }
  return '/';
};

export const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken') || '';

  const [view, setView] = useState(() => (resetToken ? 'reset' : 'login')); // 'login' | 'forgot' | 'reset'

  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [dirtyEmail, setDirtyEmail] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTouched, setForgotTouched] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Token reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = getSafeRedirectUrl(location, searchParams);
  const isSessionExpiredBannerVisible =
    Boolean(sessionExpired) ||
    Boolean(location.state?.sessionExpired) ||
    searchParams.get('reason') === 'session_expired';

  const showDemoAccounts =
    !import.meta.env.PROD && import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

  const validateEmailValue = (value, isTouched, showRequired) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return showRequired ? 'Email address is required' : '';
    }
    if (trimmed.length > 254) {
      return 'Email must not exceed 254 characters';
    }
    if (isTouched && !EMAIL_REGEX.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const getPasswordError = () => {
    if (!password) {
      return touched.password && submitAttempted ? 'Password is required' : '';
    }
    if (password.length > 128) {
      return 'Password must not exceed 128 characters';
    }
    return '';
  };

  const emailError = validateEmailValue(
    email,
    touched.email || submitAttempted,
    submitAttempted || (touched.email && dirtyEmail)
  );
  const passwordError = getPasswordError();
  const isFormValid =
    email.trim().length > 0 &&
    email.trim().length <= 254 &&
    EMAIL_REGEX.test(email.trim()) &&
    password.length > 0 &&
    password.length <= 128;

  const forgotEmailError = validateEmailValue(
    forgotEmail,
    forgotTouched,
    forgotTouched && forgotEmail.length > 0
  );
  const isForgotValid =
    forgotEmail.trim().length > 0 &&
    forgotEmail.trim().length <= 254 &&
    EMAIL_REGEX.test(forgotEmail.trim());

  const handlePasswordKeyEvent = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!isFormValid) {
      setSubmitAttempted(true);
      setTouched({ email: true, password: true });
      return;
    }

    setError(null);
    clearSessionExpired?.();
    setLoading(true);

    try {
      const user = await login({
        email: email.trim(),
        password,
        rememberMe,
      });
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

  const handleOpenForgot = () => {
    setForgotEmail(email.trim());
    setForgotTouched(false);
    setForgotError('');
    setForgotSuccess('');
    setView('forgot');
  };

  const handleBackToLogin = () => {
    if (resetToken) {
      const next = new URLSearchParams(searchParams);
      next.delete('resetToken');
      setSearchParams(next, { replace: true });
    }
    setForgotError('');
    setForgotSuccess('');
    setResetError('');
    setResetSuccess('');
    setView('login');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    if (!isForgotValid) {
      setForgotTouched(true);
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      setForgotSuccess(
        res?.message || 'If this email exists, the administrator has been notified'
      );
    } catch (err) {
      setForgotError(err.message || 'Unable to submit password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleTokenResetSubmit = async (e) => {
    e.preventDefault();
    if (resetLoading) return;

    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      const res = await authApi.resetPasswordWithToken({
        token: resetToken,
        password: newPassword,
      });
      setResetSuccess(
        res?.message || 'Password has been reset successfully. Please sign in.'
      );
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setResetError(err.message || 'Reset link is invalid or has expired.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-topbar">
          <button
            type="button"
            className="login-theme-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="login-header">
          <div className="login-logo">
            <Logo size={40} />
          </div>
          <h1 className="login-title">Sales Admin</h1>
          <p className="login-subtitle">
            {view === 'forgot'
              ? 'Request a password reset'
              : view === 'reset'
                ? 'Set a new account password'
                : 'Sign in to your account'}
          </p>
        </div>

        {view === 'login' && isSessionExpiredBannerVisible && !error && (
          <div
            className="alert alert-warning"
            role="status"
            aria-live="polite"
            style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
          >
            <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>Session expired, please sign in again.</span>
          </div>
        )}

        {view === 'login' && (
          <>
            {error && (
              <div
                className="alert alert-danger"
                role="alert"
                style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoFocus
                  autoComplete="username"
                  className="form-control"
                  placeholder="user@example.com"
                  maxLength={254}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!dirtyEmail) setDirtyEmail(true);
                    if (error) setError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  required
                />
                {emailError && (
                  <div id="login-email-error" className="form-error" role="alert">
                    {emailError}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="form-control password-input"
                    placeholder="Password"
                    maxLength={128}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      [
                        passwordError ? 'login-password-error' : '',
                        capsLockOn ? 'login-capslock-warning' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={handlePasswordKeyEvent}
                    onKeyUp={handlePasswordKeyEvent}
                    onFocus={handlePasswordKeyEvent}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }));
                      setCapsLockOn(false);
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle visibility"
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="password-toggle-btn"
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {capsLockOn && (
                  <div
                    id="login-capslock-warning"
                    className="login-capslock-warning"
                    role="status"
                    aria-live="polite"
                  >
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>Caps Lock is ON</span>
                  </div>
                )}
                {passwordError && (
                  <div id="login-password-error" className="form-error" role="alert">
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="login-options-row">
                <label className="checkbox-row" htmlFor="remember-me" style={{ cursor: 'pointer' }}>
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-label" style={{ fontSize: '0.875rem' }}>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  className="login-link-btn"
                  onClick={handleOpenForgot}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || !isFormValid}
              >
                {loading && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </form>

            {showDemoAccounts && (
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
            )}
          </>
        )}

        {view === 'forgot' && (
          <div className="stack-md">
            {forgotSuccess && (
              <div className="alert alert-success" role="status" aria-live="polite">
                <CheckCircle2 size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{forgotSuccess}</span>
              </div>
            )}
            {forgotError && (
              <div className="alert alert-danger" role="alert">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Account Email Address
                </label>
                <input
                  id="forgot-email"
                  name="forgot-email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  className="form-control"
                  placeholder="user@example.com"
                  maxLength={254}
                  aria-invalid={Boolean(forgotEmailError)}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onBlur={() => setForgotTouched(true)}
                  required
                />
                {forgotEmailError && (
                  <div className="form-error" role="alert">
                    {forgotEmailError}
                  </div>
                )}
                <div className="form-helper-text">
                  Submit your email to notify your administrator or receive a reset link if email delivery is enabled.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={forgotLoading || !isForgotValid}
              >
                {forgotLoading && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
                <span>{forgotLoading ? 'Submitting...' : 'Request Password Reset'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="login-link-btn"
                onClick={handleBackToLogin}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Back to Sign in</span>
              </button>
            </div>
          </div>
        )}

        {view === 'reset' && (
          <div className="stack-md">
            {resetSuccess && (
              <div className="alert alert-success" role="status" aria-live="polite">
                <CheckCircle2 size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{resetSuccess}</span>
              </div>
            )}
            {resetError && (
              <div className="alert alert-danger" role="alert">
                {resetError}
              </div>
            )}

            {!resetSuccess && (
              <form onSubmit={handleTokenResetSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-new-password">
                    New Password
                  </label>
                  <div className="password-wrapper">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="form-control password-input"
                      placeholder="Enter new password (min 6 chars)"
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label="Toggle new password visibility"
                      className="password-toggle-btn"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} aria-hidden="true" />
                      ) : (
                        <Eye size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reset-confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="form-control"
                    placeholder="Re-enter new password"
                    maxLength={128}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={resetLoading}
                >
                  {resetLoading && <Loader2 size={16} className="btn-spinner" aria-hidden="true" />}
                  <span>{resetLoading ? 'Updating...' : 'Set New Password'}</span>
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="login-link-btn"
                onClick={handleBackToLogin}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Back to Sign in</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="login-footer">
        BI Dashboard v{APP_VERSION} • © {new Date().getFullYear()} {COMPANY_NAME}
      </footer>
    </main>
  );
};

export default Login;
