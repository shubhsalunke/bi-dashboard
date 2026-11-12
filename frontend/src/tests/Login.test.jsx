import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Login } from '../pages/Login';
import { AppRoutes } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { authApi } from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    forgotPassword: vi.fn(),
    resetPasswordWithToken: vi.fn(),
  },
}));

const renderLogin = (initialEntries = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reports" element={<div>Reports Target Page</div>} />
              <Route path="/" element={<div>Dashboard Target Page</div>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.stubEnv('VITE_SHOW_DEMO_ACCOUNTS', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders login form elements, theme toggle, footer, and quick fill buttons when VITE_SHOW_DEMO_ACCOUNTS=true', () => {
    renderLogin();

    expect(screen.getByText('Sales Admin')).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(emailInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText(/Remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to dark theme/i })).toBeInTheDocument();
    expect(screen.getByText(/BI Dashboard v1\.0\.0/i)).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();
  });

  it('hides demo account buttons when VITE_SHOW_DEMO_ACCOUNTS is not true', () => {
    vi.stubEnv('VITE_SHOW_DEMO_ACCOUNTS', 'false');
    renderLogin();

    expect(screen.queryByText('Demo Accounts')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('populates credentials when quick fill buttons are clicked and toggles theme', () => {
    renderLogin();

    const adminBtn = screen.getByRole('button', { name: 'Admin' });
    fireEvent.click(adminBtn);

    expect(screen.getByLabelText(/Email Address/i).value).toBe('admin@bi.corp');
    expect(screen.getByLabelText(/Password/i).value).toBe('Admin123!');

    const themeBtn = screen.getByRole('button', { name: /Switch to dark theme/i });
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('shows Caps Lock is ON warning when CapsLock modifier is active', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.keyDown(passwordInput, {
      key: 'A',
      modifierCapsLock: true,
    });

    expect(screen.getByText('Caps Lock is ON')).toBeInTheDocument();
  });

  it('stores tokens in sessionStorage by default and in localStorage when Remember me is checked, redirecting to return URL', async () => {
    authApi.login.mockResolvedValue({
      user: { id: 1, email: 'admin@bi.corp', name: 'System Admin', role: 'admin' },
      accessToken: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
    });

    // Without Remember me -> sessionStorage & return URL /reports?preset=30d
    const { unmount } = renderLogin(['/login?redirect=%2Freports%3Fpreset%3D30d']);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'admin@bi.corp' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Admin123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@bi.corp',
        password: 'Admin123!',
      });
      expect(sessionStorage.getItem('token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByText('Reports Target Page')).toBeInTheDocument();
    });

    unmount();
    sessionStorage.clear();

    // With Remember me checked -> localStorage & rememberMe: true
    renderLogin(['/login']);
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'admin@bi.corp' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Admin123!' },
    });
    fireEvent.click(screen.getByLabelText(/Remember me/i));
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenLastCalledWith({
        email: 'admin@bi.corp',
        password: 'Admin123!',
        rememberMe: true,
      });
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(sessionStorage.getItem('token')).toBeNull();
    });
  });

  it('displays session expired notice and error alert on invalid credentials', async () => {
    authApi.login.mockRejectedValueOnce({ message: 'Invalid email or password' });

    renderLogin(['/login?reason=session_expired']);
    expect(screen.getByText('Session expired, please sign in again.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'wrong@bi.corp' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('submits Forgot password request and shows generic notification message', async () => {
    authApi.forgotPassword.mockResolvedValueOnce({
      success: true,
      message: 'If this email exists, the administrator has been notified',
    });

    renderLogin();
    fireEvent.blur(screen.getByLabelText(/Email Address/i));
    expect(screen.queryByText('Email address is required')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));

    const forgotInput = screen.getByLabelText(/Account Email Address/i);
    fireEvent.change(forgotInput, { target: { value: 'analyst@bi.corp' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Password Reset/i }));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('analyst@bi.corp');
      expect(
        screen.getByText('If this email exists, the administrator has been notified')
      ).toBeInTheDocument();
    });
  });

  it('redirects already logged-in user away from /login to Dashboard', async () => {
    localStorage.setItem('token', 'valid-token');
    authApi.getCurrentUser.mockResolvedValueOnce({
      id: 1,
      name: 'Admin User',
      email: 'admin@bi.corp',
      role: 'admin',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Sign in$/i })).not.toBeInTheDocument();
    });
  });
});
