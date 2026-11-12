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
      phone: '9820111001',
      city: 'Mumbai',
      state: 'Maharashtra',
      industry: 'IT Services',
      customer_type: 'Large Business',
      contact_person: 'Rajesh Kulkarni',
      gst_number: '27AAACA1234A1Z5',
      address: 'Plot 14, Andheri East',
      notes: 'Priority client',
      status: 'on_hold',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      customer_code: 'CUST-002',
      customer_name: 'Stark Global',
      email: 'info@stark.com',
      phone: '9820111002',
      city: 'Pune',
      state: 'Maharashtra',
      industry: 'Finance',
      customer_type: 'Startup',
      status: 'prospect',
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

  it('renders customer directory table with Industry, Customer Type, and new status badges', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Stark Global')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Industry/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Customer Type/i })).toBeInTheDocument();
      expect(screen.getByText('on hold')).toHaveClass('badge-on-hold');
      expect(screen.getByText('prospect')).toHaveClass('badge-prospect');
    });
  });

  it('displays search input and filter controls including Industry, Customer Type, and Status', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by city')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by industry')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by customer type')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
      expect(screen.getByText('Add Customer')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Filter by industry'), { target: { value: 'IT Services' } });
    fireEvent.change(screen.getByLabelText('Filter by customer type'), { target: { value: 'Large Business' } });
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'churned' } });

    await waitFor(() => {
      expect(customersApi.getCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: 'IT Services',
          customer_type: 'Large Business',
          status: 'churned',
        })
      );
    });
  });

  it('opens create and edit customer modals with extended fields', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('Add Customer')).toBeInTheDocument();
    });

    const addBtn = screen.getByText('Add Customer');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New Customer Account')).toBeInTheDocument();
      expect(screen.getByText(/Company \/ Client Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Industry')).toBeInTheDocument();
      expect(screen.getByLabelText('Customer Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Person Name')).toBeInTheDocument();
      expect(screen.getByLabelText('State')).toBeInTheDocument();
      expect(screen.getByLabelText('GST Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    fireEvent.click(screen.getByLabelText('Edit Acme Corporation'));
    await waitFor(() => {
      expect(screen.getByText('Edit Customer: Acme Corporation')).toBeInTheDocument();
      expect(screen.getByLabelText('Industry').value).toBe('IT Services');
      expect(screen.getByLabelText('Customer Type').value).toBe('Large Business');
      expect(screen.getByLabelText('Contact Person Name').value).toBe('Rajesh Kulkarni');
      expect(screen.getByLabelText('State').value).toBe('Maharashtra');
      expect(screen.getByLabelText('GST Number').value).toBe('27AAACA1234A1Z5');
      expect(screen.getByLabelText('Address').value).toBe('Plot 14, Andheri East');
      expect(screen.getByLabelText('Notes').value).toBe('Priority client');
    });
  });
});
