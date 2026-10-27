import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Customers } from '../pages/Customers';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { customersApi } from '../api/customers.api';

// Mock customersApi
vi.mock('../api/customers.api', () => ({
  customersApi: {
    getCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
  },
}));

vi.mock('../api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Admin User',
      email: 'admin@bi.corp',
      role: 'admin',
    }),
  },
}));

const mockCustomersData = {
  data: [
    {
      id: 1,
      customer_code: 'CUST-001',
      customer_name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+91-98201-11001',
      city: 'Mumbai',
      state: 'MH',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      customer_code: 'CUST-002',
      customer_name: 'Stark Global',
      email: 'info@stark.com',
      phone: '+91-98201-11002',
      city: 'Pune',
      state: 'MH',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

const renderCustomers = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <Customers />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Customers Directory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    customersApi.getCustomers.mockResolvedValue(mockCustomersData);
  });

  it('renders customer directory table and displays customer data', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('Customer Directory')).toBeInTheDocument();
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Stark Global')).toBeInTheDocument();
    });
  });

  it('displays search input and filter controls', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      expect(screen.getByText('Add Customer')).toBeInTheDocument();
    });
  });

  it('opens create customer modal when Add Customer button is clicked', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('Add Customer')).toBeInTheDocument();
    });

    const addBtn = screen.getByText('Add Customer');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Customer Account')).toBeInTheDocument();
      expect(screen.getByText(/Company \/ Client Name \*/i)).toBeInTheDocument();
    });
  });
});
