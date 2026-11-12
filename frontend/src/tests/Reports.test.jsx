import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Reports } from '../pages/Reports';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboard.api';

vi.mock('../api/dashboard.api', () => ({
  dashboardApi: {
    getSalesReport: vi.fn(),
    getCustomerInsights: vi.fn(),
    getBrandSalesReport: vi.fn(),
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

const mockSalesReport = {
  summary: {
    total_orders: 12,
    unique_customers: 5,
    total_revenue: '48500.00',
    average_order_value: '4041.67',
    total_units: 28,
    top_customer: {
      customer_id: 2,
      customer_code: 'CUST-002',
      customer_name: 'Tata FinTech Solutions',
      orders_count: 4,
      total_revenue: '18500.00',
    },
  },
  comparison: {
    total_orders_pct: 20.0,
    total_revenue_pct: 15.5,
    average_order_value_pct: -3.8,
  },
  byMonth: [
    { month: '2026-10', order_count: 7, units_sold: 16, revenue: '28500.00' },
    { month: '2026-09', order_count: 5, units_sold: 12, revenue: '20000.00' },
  ],
  byWeek: [
    { week_start: '2026-09-28', order_count: 5, units_sold: 12, revenue: '20000.00' },
    { week_start: '2026-10-05', order_count: 7, units_sold: 16, revenue: '28500.00' },
  ],
  byCity: [
    { city: 'Pune', customers_count: 2, orders_count: 5, revenue: '22000.00' },
    { city: 'Mumbai', customers_count: 3, orders_count: 7, revenue: '26500.00' },
  ],
  byCategory: [
    { category: 'Cloud Infrastructure', products_count: 2, units_sold: 18, category_revenue: '30000.00' },
    { category: 'Enterprise Software', products_count: 1, units_sold: 10, category_revenue: '18500.00' },
  ],
  byIndustry: [
    { industry: 'Finance', customers_count: 2, orders_count: 6, revenue: '26000.00' },
    { industry: 'IT Services', customers_count: 3, orders_count: 6, revenue: '22500.00' },
  ],
  byCustomerType: [
    { customer_type: 'Large Business', customers_count: 3, orders_count: 8, revenue: '35000.00' },
    { customer_type: 'Small Business', customers_count: 2, orders_count: 4, revenue: '13500.00' },
  ],
  byState: [
    { state: 'Maharashtra', customers_count: 4, orders_count: 10, revenue: '41000.00' },
    { state: 'Telangana', customers_count: 1, orders_count: 2, revenue: '7500.00' },
  ],
  topCustomers: [
    {
      customer_id: 2,
      customer_code: 'CUST-002',
      customer_name: 'Tata FinTech Solutions',
      city: 'Pune',
      orders_count: 4,
      total_revenue: '18500.00',
    },
  ],
  newVsReturningByMonth: [
    { month: '2026-09', new_customers: 3, returning_customers: 0 },
    { month: '2026-10', new_customers: 2, returning_customers: 3 },
  ],
  customersByStatus: [
    { status: 'active', count: 4 },
    { status: 'inactive', count: 1 },
    { status: 'on_hold', count: 1 },
    { status: 'prospect', count: 2 },
    { status: 'churned', count: 1 },
  ],
  filterOptions: {
    cities: ['Mumbai', 'Pune'],
    categories: ['Cloud Infrastructure', 'Enterprise Software'],
    brands: ['Tata', 'Infosys'],
  },
};

const mockBrandSales = [
  { brand: 'Tata', units_sold: 15, total_revenue: 25000 },
  { brand: 'Infosys', units_sold: 13, total_revenue: 23500 },
];

const mockInsights = [
  {
    customer_id: 2,
    customer_code: 'CUST-002',
    customer_name: 'Tata FinTech Solutions',
    city: 'Pune',
    state: 'Maharashtra',
    industry: 'Finance',
    customer_type: 'Large Business',
    status: 'active',
    value_tier: 'Tier 1 (High Value)',
    lifetime_spend: '18500.00',
    recent_30d_spend: '8500.00',
    purchase_trend: 'Growing',
  },
];

const renderReports = (initialEntry = '/reports') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <ToastProvider>
          <Reports />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    dashboardApi.getSalesReport.mockResolvedValue(mockSalesReport);
    dashboardApi.getBrandSalesReport.mockResolvedValue(mockBrandSales);
    dashboardApi.getCustomerInsights.mockResolvedValue(mockInsights);
  });

  it('renders 6 KPI cards with period comparisons and new report charts', async () => {
    renderReports();

    await waitFor(() => {
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Unique Customers')).toBeInTheDocument();
      expect(screen.getByText('Average Order Value')).toBeInTheDocument();
      expect(screen.getByText('Units Sold')).toBeInTheDocument();
      expect(screen.getByText('Top Customer')).toBeInTheDocument();
      expect(screen.getByText('Tata FinTech Solutions')).toBeInTheDocument();
      expect(screen.getByText('+15.5% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('+20.0% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('-3.8% vs previous period')).toBeInTheDocument();
    });

    expect(screen.getByText('Revenue by Industry')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Customer Type')).toBeInTheDocument();
    expect(screen.getByText('Revenue by State')).toBeInTheDocument();
    expect(screen.getByText('Top 10 Customers by Revenue')).toBeInTheDocument();
  });

  it('supports all date presets, new dropdown filters, active filter count, and Clear Filters', async () => {
    renderReports();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Financial Year' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'This Month' }));
    fireEvent.change(screen.getByLabelText('Filter by category'), {
      target: { value: 'Cloud Infrastructure' },
    });
    fireEvent.change(screen.getByLabelText('Filter by industry'), {
      target: { value: 'Finance' },
    });
    fireEvent.change(screen.getByLabelText('Filter by customer status'), {
      target: { value: 'prospect' },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Active filter count')).toHaveTextContent('4 active');
      expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
      expect(dashboardApi.getSalesReport).toHaveBeenLastCalledWith(
        expect.objectContaining({
          preset: 'this_month',
          category: 'Cloud Infrastructure',
          industry: 'Finance',
          status: 'prospect',
        })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Active filter count')).not.toBeInTheDocument();
    });
  });

  it('toggles Monthly/Weekly and Revenue/Number of Sales, sorts Sales by Category, and opens Export menu', async () => {
    renderReports();

    await waitFor(() => {
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Number of Sales' }));
    expect(screen.getByText('Monthly Sales')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }));
    await waitFor(() => {
      expect(screen.getByText('Weekly Sales')).toBeInTheDocument();
    });

    // Sort Sales by Category table
    fireEvent.click(screen.getByRole('button', { name: /Units/i }));

    // Export dropdown
    fireEvent.click(screen.getByRole('button', { name: /Export/i }));
    expect(screen.getByRole('menuitem', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Export Excel (.xlsx)' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Print / PDF' })).toBeInTheDocument();
  });

  it('switches to Customer Trends tab and displays New vs Returning and Customers by Status charts', async () => {
    renderReports();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Customer Trends' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Customer Trends' }));

    await waitFor(() => {
      expect(screen.getByText('New vs Returning Customers')).toBeInTheDocument();
      expect(screen.getByText('Customers by Status')).toBeInTheDocument();
      expect(screen.getByText('Tata FinTech Solutions')).toBeInTheDocument();
    });
  });
});

