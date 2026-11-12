import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    total_units: 320,
    total_customers: 45,
    new_customers: 6,
    active_customers: 35,
    inactive_customers: 3,
    on_hold_customers: 2,
    prospect_customers: 4,
    churned_customers: 1,
    active_products: 15,
    low_stock_products: 3,
    out_of_stock_products: 1,
  },
  comparison: {
    total_revenue_pct: 12.4,
    total_orders_pct: 8.2,
    average_order_value_pct: -2.1,
  },
  customersByStatus: [
    { status: 'active', count: 35 },
    { status: 'inactive', count: 3 },
    { status: 'on_hold', count: 2 },
    { status: 'prospect', count: 4 },
    { status: 'churned', count: 1 },
  ],
  monthlySales: [
    { month: '2026-05', revenue: '45000.00', sales_count: 30 },
    { month: '2026-06', revenue: '52000.00', sales_count: 35 },
  ],
  weeklySales: [
    { week_start: '2026-06-01', revenue: '22000.00', sales_count: 14 },
    { week_start: '2026-06-08', revenue: '30000.00', sales_count: 21 },
  ],
  byCity: [
    { city: 'Pune', customers_count: 10, orders_count: 45, revenue: '95000.00' },
  ],
  byCategory: [
    { category: 'Software', units_sold: 40, revenue: '80000.00' },
  ],
  byBrand: [
    { brand: 'Tata', units_sold: 25, total_revenue: '60000.00' },
  ],
  byCustomerType: [
    { customer_type: 'Large Business', customers_count: 15, orders_count: 60, revenue: '180000.00' },
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
      customer_id: 1,
      customer_name: 'Nexus Corp',
      city: 'Pune',
      sale_date: new Date().toISOString(),
      total_amount: '3500.00',
      status: 'completed',
    },
  ],
  lowStockProducts: [
    {
      id: 5,
      sku: 'AI-011',
      product_name: 'AI Customer Analytics Integration',
      category: 'Analytics & AI',
      brand: 'Bharat',
      stock_quantity: 0,
      reorder_level: 5,
      unit_price: '2800.00',
    },
  ],
  filterOptions: {
    cities: ['Pune', 'Mumbai'],
    categories: ['Software', 'Analytics & AI'],
    brands: ['Tata', 'Bharat'],
  },
};

const renderDashboard = (initialEntry = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
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
    localStorage.clear();
    localStorage.setItem('token', 'fake-token');
    dashboardApi.getSummary.mockResolvedValue(mockSummary);
  });

  it('renders all 9 clickable KPI cards with period comparisons and status charts', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Average Order Value')).toBeInTheDocument();
      expect(screen.getByText('Units Sold')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('New Customers')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Low stock products')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock products')).toBeInTheDocument();

      expect(screen.getByText('₹2,45,801')).toBeInTheDocument();
      expect(screen.getByText('154')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('+12.4% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('+8.2% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('-2.1% vs previous period')).toBeInTheDocument();
      expect(screen.getByLabelText('Last updated time')).toBeInTheDocument();
    });

    expect(screen.getByText('Customers by Status')).toBeInTheDocument();
    expect(screen.getByText('Sales by City')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Category')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Brand')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Customer Type')).toBeInTheDocument();
  });

  it('renders top tables, recent sales controls, low stock alerts, filters, customize, and export', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Top Products')).toBeInTheDocument();
      expect(screen.getByText('Top Customers')).toBeInTheDocument();
      expect(screen.getByText('Recent Sales')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
      expect(screen.getAllByText('Nexus Corp').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Enterprise Cloud Platform')).toBeInTheDocument();
      expect(screen.getByText('AI Customer Analytics Integration')).toBeInTheDocument();
    });

    // Apply presets & filters
    fireEvent.click(screen.getByRole('button', { name: '7 Days' }));
    fireEvent.change(screen.getByLabelText('Filter by city'), { target: { value: 'Pune' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Active filter count')).toHaveTextContent('2 active');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Active filter count')).not.toBeInTheDocument();
    });

    // Toggle Top Products & Top Customers controls
    fireEvent.click(screen.getByRole('button', { name: 'Units' }));
    fireEvent.change(screen.getByLabelText('Top customers limit'), { target: { value: '10' } });

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({
          topProductsSort: 'units',
          topCustomersLimit: 10,
        })
      );
    });

    // Customize widget visibility & localStorage persistence
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    const lowStockCheckbox = screen.getByLabelText('Low Stock Alerts', { selector: 'input' });
    fireEvent.click(lowStockCheckbox);
    expect(screen.queryByRole('region', { name: 'Low Stock Alerts' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('bi_dashboard_widgets')).lowStockAlerts).toBe(false);

    // Export menu
    fireEvent.click(screen.getByRole('button', { name: /Export/i }));
    expect(screen.getByRole('menuitem', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Export Excel (.xlsx)' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Print / PDF' })).toBeInTheDocument();
  });
});
