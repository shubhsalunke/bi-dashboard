import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { authApi } from '../api/auth.api';
import { AppRoutes } from '../App';

// Mock authApi
vi.mock('../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock dashboardApi to prevent network calls in routing tests
vi.mock('../api/dashboard.api', () => ({
  dashboardApi: {
    getSummary: vi.fn().mockResolvedValue({
      totalRevenue: '125000.00',
      totalSales: 90,
      avgOrderValue: '1388.89',
      totalCustomers: 30,
      recentSales: [],
      monthlyTrends: [],
      topCustomers: [],
    }),
  },
}));

// Mock usersApi
vi.mock('../api/users.api', () => ({
  usersApi: {
    getUsers: vi.fn().mockResolvedValue([
      { id: 1, name: 'Admin', email: 'admin@bi.corp', role: 'admin', is_active: true, created_at: new Date().toISOString() },
    ]),
    getAuditLogs: vi.fn().mockResolvedValue({ data: [], pagination: { total: 0 } }),
  },
}));

describe('Route Protection & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects unauthenticated user from protected dashboard to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign in to Workspace/i })).toBeInTheDocument();
    });
  });

  it('allows authenticated user to view dashboard', async () => {
    localStorage.setItem('token', 'valid-test-token');
    authApi.getCurrentUser.mockResolvedValueOnce({
      id: 2,
      name: 'Manager User',
      email: 'manager@bi.corp',
      role: 'manager',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Intelligence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manager User')).toBeInTheDocument();
    });
  });

  it('restricts /users route to admin role only, redirecting manager', async () => {
    localStorage.setItem('token', 'manager-token');
    authApi.getCurrentUser.mockResolvedValueOnce({
      id: 2,
      name: 'Manager User',
      email: 'manager@bi.corp',
      role: 'manager',
    });

    render(
      <MemoryRouter initialEntries={['/users']}>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Manager should be redirected away to dashboard
    await waitFor(() => {
      expect(screen.getByText('Executive Intelligence Dashboard')).toBeInTheDocument();
    });
  });
});
