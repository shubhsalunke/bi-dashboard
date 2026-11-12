import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserManagement } from '../pages/UserManagement';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { usersApi } from '../api/users.api';

vi.mock('../api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Eleanor Vance',
      email: 'admin@bi.corp',
      role: 'admin',
    }),
  },
}));

vi.mock('../api/users.api', () => ({
  usersApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserStatus: vi.fn(),
    resetPassword: vi.fn(),
    deleteUser: vi.fn(),
    getUserActivity: vi.fn(),
    getAuditLogs: vi.fn(),
    getResetRequests: vi.fn(),
    completeResetRequest: vi.fn(),
    dismissResetRequest: vi.fn(),
  },
}));

const sampleUsers = [
  {
    id: 1,
    name: 'Eleanor Vance',
    email: 'admin@bi.corp',
    role: 'admin',
    phone: '+91 98000 00001',
    department: 'Executive',
    is_active: true,
    last_login_at: '2026-11-12T09:15:00.000Z',
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Marcus Brody',
    email: 'manager@bi.corp',
    role: 'manager',
    phone: '+91 98000 00002',
    department: 'Operations',
    is_active: true,
    last_login_at: null,
    created_at: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'Clara Analyst',
    email: 'analyst@bi.corp',
    role: 'analyst',
    phone: '',
    department: 'Insights',
    is_active: false,
    last_login_at: null,
    created_at: '2026-03-20T10:00:00.000Z',
  },
];

const renderPage = () => {
  localStorage.setItem('token', 'admin-test-token');
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <UserManagement />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('UserManagement Page (/users)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersApi.getUsers.mockResolvedValue({
      success: true,
      data: sampleUsers,
      activeAdminCount: 1,
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });
    usersApi.getAuditLogs.mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    usersApi.getResetRequests.mockResolvedValue([]);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders users table with role badges, status, department, last login, and created date', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Eleanor Vance')).toBeInTheDocument();
      expect(screen.getByText('Marcus Brody')).toBeInTheDocument();
      expect(screen.getByText('Clara Analyst')).toBeInTheDocument();
    });

    expect(screen.getByText('Executive')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getAllByText('Never').length).toBe(2);
  });

  it('Edit modal keeps password empty with autoComplete="new-password" and omits password on submit when blank', async () => {
    usersApi.updateUser.mockResolvedValueOnce({
      ...sampleUsers[1],
      department: 'Logistics',
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Marcus Brody')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Marcus Brody' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    const dialog = screen.getByRole('dialog');
    const passwordInput = within(dialog).getByLabelText(/Password \(leave blank/i);
    expect(passwordInput).toHaveValue('');
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');

    // Role options show clean role names only and description appears under select
    const roleSelect = within(dialog).getByLabelText(/^Role \*/i);
    const options = Array.from(roleSelect.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['Analyst', 'Manager', 'Administrator']);
    expect(
      within(dialog).getByText(/Manage customers and products, record sales transactions/i)
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/^Department$/i), {
      target: { value: 'Logistics' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Update User' }));

    await waitFor(() => {
      expect(usersApi.updateUser).toHaveBeenCalledTimes(1);
    });

    const [, payload] = usersApi.updateUser.mock.calls[0];
    expect(payload).not.toHaveProperty('password');
    expect(payload.department).toBe('Logistics');
  });

  it('supports password eye toggle, strength meter, generator with copy, confirm mismatch, and duplicate email error', async () => {
    usersApi.createUser.mockRejectedValueOnce({
      status: 409,
      message: 'A user with this email address already exists.',
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Eleanor Vance')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    const dialog = screen.getByRole('dialog');

    const passwordInput = within(dialog).getByLabelText(/^Password \*/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Eye toggle reveals password
    fireEvent.click(within(dialog).getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Weak password strength check
    fireEvent.change(passwordInput, { target: { value: 'abc123' } });
    expect(within(dialog).getByText(/Password strength: Weak/i)).toBeInTheDocument();

    // Generate strong password populates both fields and shows Copy button
    fireEvent.click(within(dialog).getByRole('button', { name: /Generate strong password/i }));
    expect(within(dialog).getByText(/Password strength: Strong/i)).toBeInTheDocument();

    const copyBtn = within(dialog).getByRole('button', { name: 'Copy password' });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(passwordInput.value);
    });

    // Confirm password mismatch triggers inline red error
    const confirmInput = within(dialog).getByLabelText(/^Confirm Password \*/i);
    fireEvent.change(confirmInput, { target: { value: 'Mismatch999!' } });
    fireEvent.change(within(dialog).getByLabelText(/^Full Name \*/i), {
      target: { value: 'New Hire' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Email Address \*/i), {
      target: { value: 'admin@bi.corp' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create User' }));
    expect(within(dialog).getByText('Passwords do not match')).toBeInTheDocument();

    // Fix confirm password -> submit triggers 409 inline email error
    fireEvent.change(confirmInput, { target: { value: passwordInput.value } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(
        within(dialog).getByText('A user with this email address already exists.')
      ).toBeInTheDocument();
    });
  });

  it('enforces self and last-admin protections and asks confirmation before deactivate or delete', async () => {
    usersApi.updateUserStatus.mockResolvedValueOnce({ ...sampleUsers[1], is_active: false });
    usersApi.deleteUser.mockResolvedValueOnce({ success: true });

    renderPage();
    await waitFor(() => expect(screen.getByText('Eleanor Vance')).toBeInTheDocument());

    // Self & last active admin has disabled Deactivate and Delete menu items
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Eleanor Vance' }));
    expect(screen.getByRole('menuitem', { name: 'Deactivate' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();

    // Deactivate Marcus Brody requires confirmation modal
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Marcus Brody' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Deactivate' }));
    expect(screen.getByRole('heading', { name: 'Confirm Deactivation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Deactivation' }));
    await waitFor(() => {
      expect(usersApi.updateUserStatus).toHaveBeenCalledWith(2, false);
    });

    // Delete Clara Analyst requires confirmation modal
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Clara Analyst' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(screen.getByText('Confirm User Deletion')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete User' }));
    await waitFor(() => {
      expect(usersApi.deleteUser).toHaveBeenCalledWith(3);
    });
  });

  it('supports Role & Status filters, Clear Filters, Reset Password modal, Activity drawer, and CSV export', async () => {
    usersApi.resetPassword.mockResolvedValueOnce({
      user: sampleUsers[1],
      temporaryPassword: 'Temp#Password99',
    });
    usersApi.getUserActivity.mockResolvedValueOnce({
      success: true,
      user: sampleUsers[1],
      data: [
        {
          id: 101,
          user_email: 'admin@bi.corp',
          action: 'USER_CREATED',
          entity: 'USER',
          entity_id: 2,
          details: { role: 'manager', department: 'Operations' },
          ip_address: '127.0.0.1',
          created_at: '2026-02-15T10:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Marcus Brody')).toBeInTheDocument());

    // Filters + Clear Filters
    fireEvent.change(screen.getByLabelText('Filter by role'), { target: { value: 'manager' } });
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'active' } });

    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: 'manager', status: 'active', page: 1 })
      );
    });

    const clearBtn = screen.getByRole('button', { name: /Clear Filters \(2\)/i });
    fireEvent.click(clearBtn);
    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: undefined, status: undefined, page: 1 })
      );
    });

    // Reset Password flow
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Marcus Brody' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reset Password' }));
    fireEvent.click(screen.getByRole('button', { name: /Generate Temporary Password/i }));

    await waitFor(() => {
      expect(screen.getByTestId('temporary-password-value')).toHaveTextContent('Temp#Password99');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Per-user Activity Log drawer
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Marcus Brody' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Activity Log' }));

    await waitFor(() => {
      expect(screen.getByText('User Activity Log')).toBeInTheDocument();
      expect(screen.getByText('Account Created')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close activity drawer' }));

    // Export CSV
    const createObjectUrlSpy = vi.fn(() => 'blob:users-csv');
    const revokeObjectUrlSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectUrlSpy;
    globalThis.URL.revokeObjectURL = revokeObjectUrlSpy;

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
    await waitFor(() => {
      expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('displays pending password reset requests and lets Admin generate temporary password', async () => {
    usersApi.getResetRequests.mockResolvedValue([
      {
        id: 77,
        user_id: 2,
        email: 'manager@bi.corp',
        user_name: 'Marcus Brody',
        user_role: 'manager',
        created_at: '2026-11-12T10:00:00.000Z',
        expires_at: '2026-11-12T10:30:00.000Z',
      },
    ]);
    usersApi.completeResetRequest.mockResolvedValueOnce({
      requestId: 77,
      user: sampleUsers[1],
      temporaryPassword: 'ResetReq#2026',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Pending Password Reset Requests \(1\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Temp Password/i }));

    await waitFor(() => {
      expect(usersApi.completeResetRequest).toHaveBeenCalledWith(77);
      expect(screen.getByTestId('temporary-password-value')).toHaveTextContent('ResetReq#2026');
    });
  });
});
