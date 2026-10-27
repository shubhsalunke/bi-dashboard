import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIAssistant } from '../pages/AIAssistant';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { aiApi } from '../api/ai.api';

vi.mock('../api/ai.api', () => ({
  aiApi: {
    askQuestion: vi.fn(),
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

const mockCitySalesResponse = {
  answer: 'During the last 3 months, top performing cities are Pune (₹45,000.00) and Mumbai (₹32,000.00).',
  reportTitle: 'City-Wise Sales Breakdown (Last 3 Months)',
  operation: 'CITY_SALES',
  dateRange: {
    start: '2026-07-01',
    end: '2026-10-01',
  },
  summaryMetrics: {
    citiesCount: 2,
    totalSalesCount: 25,
    totalRevenue: 77000.0,
  },
  columns: [
    { key: 'city', label: 'City' },
    { key: 'orders_count', label: 'Total Orders' },
    { key: 'total_revenue', label: 'Total Revenue' },
  ],
  rows: [
    { city: 'Pune', orders_count: 15, total_revenue: '₹45,000.00' },
    { city: 'Mumbai', orders_count: 10, total_revenue: '₹32,000.00' },
  ],
};

const renderAIAssistant = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <AIAssistant />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AIAssistant Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-jwt-token');
  });

  it('renders page header, welcome message, and 9 sample question pills', () => {
    renderAIAssistant();

    expect(screen.getByText('AI Business Assistant')).toBeInTheDocument();
    expect(screen.getByText('Answers come from your sales database.')).toBeInTheDocument();
    expect(screen.getByText(/Ask a question about your sales, customers, or products/i)).toBeInTheDocument();

    expect(screen.getByText('What were total sales last month?')).toBeInTheDocument();
    expect(screen.getByText('Show customer list')).toBeInTheDocument();
    expect(screen.getByText('Show product list')).toBeInTheDocument();
    expect(screen.getByText('Show the top 10 customers by sales.')).toBeInTheDocument();
    expect(screen.getByText('Which product generated the highest revenue?')).toBeInTheDocument();
    expect(screen.getByText('Compare this month with the previous month.')).toBeInTheDocument();
    expect(screen.getByText('Give me city-wise sales for the last three months.')).toBeInTheDocument();
    expect(screen.getByText('Summarize business performance for the current quarter.')).toBeInTheDocument();
    expect(screen.getByText('Which customers have reduced their purchases?')).toBeInTheDocument();
  });

  it('renders customer list results in existing table with formatCurrency', async () => {
    const mockCustomerListResponse = {
      answer: 'Showing 2 customers with total spending of ₹50,000.00.',
      reportTitle: 'Customer Directory',
      intent: 'CUSTOMER_LIST',
      summaryMetrics: {
        rowsShown: 2,
        totalSpent: 50000.0,
      },
      columns: [
        { key: 'customer_code', label: 'Customer Code' },
        { key: 'customer_name', label: 'Company Name' },
        { key: 'city', label: 'City' },
        { key: 'status', label: 'Status' },
        { key: 'total_orders', label: 'Total Orders' },
        { key: 'total_spent', label: 'Total Spent' },
      ],
      rows: [
        {
          customer_code: 'CUST-001',
          customer_name: 'Tata Consultancy',
          city: 'Mumbai',
          status: 'active',
          total_orders: 8,
          total_spent: 35000.0,
        },
        {
          customer_code: 'CUST-002',
          customer_name: 'Infosys Ltd',
          city: 'Pune',
          status: 'active',
          total_orders: 5,
          total_spent: 15000.0,
        },
      ],
    };

    aiApi.askQuestion.mockResolvedValueOnce(mockCustomerListResponse);
    renderAIAssistant();

    const pill = screen.getByText('Show customer list');
    fireEvent.click(pill);

    await waitFor(() => {
      expect(screen.getByText(mockCustomerListResponse.answer)).toBeInTheDocument();
    });

    expect(screen.getByText('Tata Consultancy')).toBeInTheDocument();
    expect(screen.getByText('Infosys Ltd')).toBeInTheDocument();
    expect(screen.getByText('₹35,000')).toBeInTheDocument();
    expect(screen.getByText('₹15,000')).toBeInTheDocument();
  });

  it('submits a question via text input and displays grounded response with table and metrics', async () => {
    aiApi.askQuestion.mockResolvedValueOnce(mockCitySalesResponse);
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask about revenue/i);
    fireEvent.change(input, { target: { value: 'Give me city-wise sales for the last three months.' } });

    const submitBtn = screen.getByRole('button', { name: /Ask AI/i });
    fireEvent.click(submitBtn);

    expect(aiApi.askQuestion).toHaveBeenCalledWith('Give me city-wise sales for the last three months.');

    await waitFor(() => {
      expect(screen.getByText(mockCitySalesResponse.answer)).toBeInTheDocument();
    });

    // Check report title
    expect(screen.getByText('City-Wise Sales Breakdown (Last 3 Months)')).toBeInTheDocument();

    // Check structured table
    expect(screen.getByText('Pune')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
    expect(screen.getByText('₹45,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹32,000.00')).toBeInTheDocument();

    // Check summary metrics chips
    expect(screen.getByText(/cities Count:/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/total Sales Count:/i)).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('₹77,000.00')).toBeInTheDocument();
  });

  it('triggers query directly when sample question pill is clicked', async () => {
    aiApi.askQuestion.mockResolvedValueOnce(mockCitySalesResponse);
    renderAIAssistant();

    const sampleBtn = screen.getByText('What were total sales last month?');
    fireEvent.click(sampleBtn);

    expect(aiApi.askQuestion).toHaveBeenCalledWith('What were total sales last month?');
    await waitFor(() => {
      expect(screen.getByText(mockCitySalesResponse.answer)).toBeInTheDocument();
    });
  });

  it('displays error message, toast, and retry banner on API failure', async () => {
    aiApi.askQuestion.mockRejectedValueOnce(new Error('Network timeout contacting AI service.'));
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask about revenue/i);
    fireEvent.change(input, { target: { value: 'What were total sales last month?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Network timeout contacting AI service/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Retry Query/i)).toBeInTheDocument();
    });

    // Retry query
    aiApi.askQuestion.mockResolvedValueOnce(mockCitySalesResponse);
    fireEvent.click(screen.getByText(/Retry Query/i));

    await waitFor(() => {
      expect(screen.getByText(mockCitySalesResponse.answer)).toBeInTheDocument();
    });
  });

  it('displays clear configuration notice banner when AI is unconfigured (AI_NOT_CONFIGURED)', async () => {
    const unconfiguredErr = new Error('AI provider is not configured. Please set OPENAI_API_KEY.');
    unconfiguredErr.code = 'AI_NOT_CONFIGURED';
    aiApi.askQuestion.mockRejectedValueOnce(unconfiguredErr);

    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask about revenue/i);
    fireEvent.change(input, { target: { value: 'Summarize business performance for the current quarter.' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }));

    await waitFor(() => {
      expect(screen.getByText(/AI Provider Configuration Notice/i)).toBeInTheDocument();
      expect(screen.getByText('OPENAI_API_KEY')).toBeInTheDocument();
      expect(screen.getByText('AI_PROVIDER=mock')).toBeInTheDocument();
    });
  });

  it('clears chat history when Clear Chat button is clicked', async () => {
    aiApi.askQuestion.mockResolvedValueOnce(mockCitySalesResponse);
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask about revenue/i);
    fireEvent.change(input, { target: { value: 'Give me city-wise sales for the last three months.' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }));

    await waitFor(() => {
      expect(screen.getByText(mockCitySalesResponse.answer)).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear Chat/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText(mockCitySalesResponse.answer)).not.toBeInTheDocument();
    expect(screen.getByText(/Ask a question about your sales, customers, or products/i)).toBeInTheDocument();
  });
});
