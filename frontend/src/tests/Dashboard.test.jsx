import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboard.api';

vi.mock('../api/dashboard.api', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
  },
}));

vi.mock('../api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Executive Analyst',
      email: 'analyst@bi.corp',
      role: 'analyst',
    }),
  },
}));

const mockSummary = {
  kpi: {
    total_revenue: '245800.50',
    total_sales_count: 154,
    average_order_value: '1596.11',
    total_customers: 45,
    active_customers: 42,
    active_products: 15,
  },
  monthlySales: [
    { month: '2026-05', revenue: '45000.00', sales_count: 30 },
    { month: '2026-06', revenue: '52000.00', sales_count: 35 },
  ],
  topCustomers: [
    {
      customer_id: 1,
      customer_name: 'Nexus Corp',
      customer_code: 'CUST-001',
      city: 'Pune',
      orders_count: 12,
      total_spent: '42000.00',
    },
  ],
  topProducts: [
    {
      product_id: 1,
      product_name: 'Enterprise Cloud Platform',
      category: 'Software',
      units_sold: 40,
      total_revenue: '80000.00',
    },
  ],
  recentSales: [
    {
      id: 101,
      customer_name: 'Nexus Corp',
      city: 'Pune',
      sale_date: new Date().toISOString(),
      total_amount: '3500.00',
      status: 'completed',
    },
  ],
};

const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <Dashboard />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    dashboardApi.getSummary.mockResolvedValue(mockSummary);
  });

  it('renders dashboard metrics and summary cards', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Customer Accounts')).toBeInTheDocument();
      expect(screen.getByText('Catalog Offerings')).toBeInTheDocument();
      // Formatted numbers
      expect(screen.getByText('₹2,45,801')).toBeInTheDocument();
      expect(screen.getByText('154')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  it('renders top customers and recent transactions tables', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Top Client Accounts')).toBeInTheDocument();
      expect(screen.getByText('Recent Sales Activity')).toBeInTheDocument();
      expect(screen.getAllByText('Nexus Corp').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Enterprise Cloud Platform')).toBeInTheDocument();
    });
  });
});
