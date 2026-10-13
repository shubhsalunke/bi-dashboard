import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { authApi } from '../api/auth.api';

// Mock authApi
vi.mock('../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

const renderLogin = () => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <ToastProvider>
          <Login />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form elements and quick fill buttons', () => {
    renderLogin();

    expect(screen.getByText('Smart BI')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in to Workspace/i })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();
  });

  it('populates credentials when quick fill buttons are clicked', () => {
    renderLogin();

    const adminBtn = screen.getByRole('button', { name: 'Admin' });
    fireEvent.click(adminBtn);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    expect(emailInput.value).toBe('admin@bi.corp');
    expect(passwordInput.value).toBe('Admin123!');
  });

  it('submits credentials successfully and stores token', async () => {
    authApi.login.mockResolvedValueOnce({
      user: { id: 1, email: 'admin@bi.corp', name: 'System Admin', role: 'admin' },
      accessToken: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
    });

    renderLogin();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign in to Workspace/i });

    fireEvent.change(emailInput, { target: { value: 'admin@bi.corp' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@bi.corp',
        password: 'Admin123!',
      });
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    });
  });

  it('displays error alert on invalid credentials', async () => {
    authApi.login.mockRejectedValueOnce(new Error('Invalid email or password'));

    renderLogin();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign in to Workspace/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@bi.corp' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
