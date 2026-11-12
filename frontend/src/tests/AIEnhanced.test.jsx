import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIAssistant } from '../pages/AIAssistant';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { aiApi } from '../api/ai.api';
import { authApi } from '../api/auth.api';

vi.mock('../api/ai.api', () => ({
  aiApi: {
    askQuestion: vi.fn(),
    askQuestionStream: vi.fn(),
    generateInsights: vi.fn(),
    getSuggestions: vi.fn(),
    getConversations: vi.fn(),
    renameConversation: vi.fn(),
    deleteConversation: vi.fn(),
    clearAllConversations: vi.fn(),
    getConversationMessages: vi.fn(),
    submitFeedback: vi.fn(),
    pinWidget: vi.fn(),
    getSqlLogs: vi.fn(),
  },
}));

vi.mock('../api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
  },
}));

const sampleTopics = [
  { topic: 'Sales', questions: ['What were total sales last month?'] },
  { topic: 'Customers', questions: ['Show top 5 customers'] },
  { topic: 'Products', questions: ['Show low stock products'] },
  { topic: 'Trends', questions: ['Predict next month revenue'] },
];

const sampleStreamResult = {
  question: 'Show city revenue',
  intent: 'DYNAMIC_SQL',
  answer: 'Pune leads with ₹1,20,000 followed by Mumbai with ₹80,000.',
  reportTitle: 'Revenue by City',
  columns: [
    { key: 'city', label: 'City' },
    { key: 'revenue', label: 'Revenue' },
  ],
  rows: [
    { city: 'Pune', revenue: 120000 },
    { city: 'Mumbai', revenue: 80000 },
  ],
  chartConfig: {
    chartType: 'bar',
    xKey: 'city',
    xLabel: 'City',
    yKeys: [{ key: 'revenue', label: 'Revenue', isCurrency: true }],
    supportedTypes: ['bar', 'line', 'donut'],
  },
  assumptions: 'Completed orders across all time',
  sql: 'SELECT c.city, SUM(s.total_amount) AS revenue FROM ai_sales s JOIN ai_customers c ON c.id = s.customer_id GROUP BY 1 LIMIT 200',
  followUps: ['Break down by industry', 'Show monthly trend', 'Predict next month revenue'],
  durationMs: 42,
  rowCount: 2,
  conversationId: 10,
  messageId: 99,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <AIAssistant />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Enhanced AIAssistant Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    authApi.getCurrentUser.mockResolvedValue({
      id: 1,
      name: 'Admin User',
      email: 'admin@bi.corp',
      role: 'admin',
    });
    aiApi.getSuggestions.mockResolvedValue(sampleTopics);
    aiApi.getConversations.mockResolvedValue([
      { id: 10, title: 'Previous Pune Query', message_count: 2 },
    ]);
  });

  it('loads topic-grouped sample questions, chat history sidebar, and supports streaming, chart toggle, SQL for admin, feedback, pin, and follow-ups', async () => {
    aiApi.askQuestionStream.mockImplementationOnce(async ({ onChunk }) => {
      onChunk('Pune leads ');
      onChunk('with ₹1,20,000.');
      return sampleStreamResult;
    });
    aiApi.submitFeedback.mockResolvedValueOnce({ id: 1, rating: 'up' });
    aiApi.pinWidget.mockResolvedValueOnce({ id: 5, title: 'Revenue by City' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Previous Pune Query')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Ask a question');
    fireEvent.change(input, { target: { value: 'Show city revenue' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText(sampleStreamResult.answer)).toBeInTheDocument();
    });

    // How I calculated this + collapsed Show SQL for Admin
    expect(screen.getByText(/How I calculated this:/i)).toBeInTheDocument();
    expect(screen.getByText('Show SQL')).toBeInTheDocument();

    // 3 follow-ups
    expect(screen.getByRole('button', { name: 'Break down by industry' })).toBeInTheDocument();

    // Feedback & Pin
    fireEvent.click(screen.getByRole('button', { name: 'Thumbs up feedback' }));
    await waitFor(() => {
      expect(aiApi.submitFeedback).toHaveBeenCalledWith({
        messageId: 99,
        rating: 'up',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pin to dashboard' }));
    await waitFor(() => {
      expect(aiApi.pinWidget).toHaveBeenCalledTimes(1);
    });

    // Toggle Chart / Table views
    fireEvent.click(screen.getByRole('button', { name: /^Chart$/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Table$/i }));
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Up arrow repeats last question
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('Show city revenue');
  });

  it('triggers Insights button, supports Stop button on pending stream, and hides SQL Logs for non-admins', async () => {
    authApi.getCurrentUser.mockResolvedValueOnce({
      id: 3,
      name: 'Analyst User',
      email: 'analyst@bi.corp',
      role: 'analyst',
    });

    aiApi.generateInsights.mockResolvedValueOnce({
      intent: 'INSIGHTS',
      reportTitle: 'Automated 5 Key Business Insights',
      answer: '1. Top Growth Category: Cloud Infrastructure',
      columns: [
        { key: 'insight', label: 'Insight' },
        { key: 'subject', label: 'Subject' },
      ],
      rows: [{ insight: 'Top Growth Category', subject: 'Cloud Infrastructure' }],
      followUps: ['Which active products are low on stock?'],
      assumptions: 'Computed across ai_* views',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Quick Summary/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /SQL Logs/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Quick Summary/i }));

    await waitFor(() => {
      expect(screen.getByText(/1\. Top Growth Category/i)).toBeInTheDocument();
    });
  });

  it('renames, deletes, and clears all conversations in history sidebar', async () => {
    aiApi.renameConversation.mockResolvedValueOnce({ id: 10, title: 'Renamed Chat' });
    aiApi.deleteConversation.mockResolvedValueOnce({ id: 10 });
    aiApi.clearAllConversations.mockResolvedValueOnce({ deletedCount: 1 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Previous Pune Query')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Clear All/i }));
    await waitFor(() => {
      expect(aiApi.clearAllConversations).toHaveBeenCalledTimes(1);
    });
  });

  it('renames and deletes a single conversation in history sidebar', async () => {
    aiApi.renameConversation.mockResolvedValueOnce({ id: 10, title: 'Renamed Chat' });
    aiApi.deleteConversation.mockResolvedValueOnce({ id: 10 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Previous Pune Query')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rename Previous Pune Query' }));
    const renameInput = screen.getByLabelText('Rename conversation');
    fireEvent.change(renameInput, { target: { value: 'Renamed Chat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save conversation name' }));

    await waitFor(() => {
      expect(screen.getByText('Renamed Chat')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Renamed Chat' }));
    await waitFor(() => {
      expect(aiApi.deleteConversation).toHaveBeenCalledWith(10);
    });
  });
});
