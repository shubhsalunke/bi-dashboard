import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SaleDetailModal } from '../components/sales/SaleDetailModal';
import { ToastProvider } from '../context/ToastContext';
import { salesApi } from '../api/sales.api';

vi.mock('../api/sales.api', () => ({
  salesApi: {
    updateSaleStatus: vi.fn(),
  },
}));

const mockSavePdf = vi.fn();
vi.mock('jspdf', () => ({
  jsPDF: class MockJsPDF {
    setFontSize() {}
    text() {}
    line() {}
    addPage() {}
    save(...args) {
      mockSavePdf(...args);
    }
  },
}));

const sampleSale = {
  id: 12,
  customer_id: 1,
  customer_code: 'CUST-001',
  customer_name: 'Acme Logistics India',
  customer_email: 'contact@acmelogistics.in',
  customer_city: 'Mumbai',
  customer_state: 'Maharashtra',
  customer_gst_number: '27AAACA1234A1Z5',
  sale_date: '2026-06-15',
  total_amount: '2100.00',
  status: 'completed',
  created_by_name: 'Marcus Brody',
  items: [
    {
      id: 1,
      product_id: 1,
      sku: 'CLD-001',
      product_name: 'Cloud Virtual Server Node',
      category: 'Cloud Infrastructure',
      brand: 'Tata',
      quantity: 2,
      unit_price: '450.00',
      line_total: '900.00',
    },
    {
      id: 2,
      product_id: 4,
      sku: 'SFT-004',
      product_name: 'Business Analytics Pro License',
      category: 'Enterprise Software',
      brand: 'Mahindra',
      quantity: 1,
      unit_price: '1200.00',
      subtotal: '1200.00',
    },
  ],
};

describe('SaleDetailModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    window.print = vi.fn();
  });

  it('computes and displays non-zero line item Subtotals (Qty x Unit Price), summary, links, and nav controls', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <MemoryRouter>
        <ToastProvider>
          <SaleDetailModal
            sale={sampleSale}
            isOpen={true}
            loading={false}
            onClose={vi.fn()}
            hasPrevious={true}
            hasNext={true}
            onPrevious={onPrevious}
            onNext={onNext}
            canManage={true}
          />
        </ToastProvider>
      </MemoryRouter>
    );

    const dialog = screen.getByRole('dialog');
    const modal = within(dialog);

    // Header Sale ID & badge + Prev/Next
    expect(modal.getByText('Sale Details #12')).toBeInTheDocument();
    expect(modal.getByText('completed')).toHaveClass('badge-completed');

    fireEvent.click(modal.getByLabelText('Previous sale'));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    fireEvent.click(modal.getByLabelText('Next sale'));
    expect(onNext).toHaveBeenCalledTimes(1);

    // Customer block
    expect(modal.getByText('CUST-001 · Mumbai')).toBeInTheDocument();
    const viewCustLink = modal.getByRole('link', { name: /View customer/i });
    expect(viewCustLink).toHaveAttribute('href', '/customers/1');

    // Line items: category + brand & product link & Subtotals (NOT ₹0!)
    expect(modal.getByText('Cloud Infrastructure · Tata')).toBeInTheDocument();
    expect(modal.getByText('Enterprise Software · Mahindra')).toBeInTheDocument();
    const prodLink = modal.getByRole('link', { name: 'Cloud Virtual Server Node' });
    expect(prodLink).toHaveAttribute('href', '/products?search=CLD-001');

    // Bug fix verification: Subtotals must be ₹900 and ₹1,200 (never ₹0)
    expect(modal.getByText('₹900')).toBeInTheDocument();
    expect(modal.getAllByText('₹1,200').length).toBeGreaterThanOrEqual(2);
    expect(modal.queryByText('₹0')).not.toBeInTheDocument();

    // Summary section
    const summaryBox = modal.getByLabelText('Sale summary totals');
    expect(summaryBox).toHaveTextContent('Subtotal');
    expect(summaryBox).toHaveTextContent('Grand Total');
    expect(summaryBox).toHaveTextContent('₹2,100');
  });

  it('asks confirmation before cancelling status, updates status via API, and supports copy link, print, and PDF', async () => {
    const onStatusUpdated = vi.fn();
    salesApi.updateSaleStatus.mockResolvedValue({ ...sampleSale, status: 'cancelled' });

    render(
      <MemoryRouter>
        <ToastProvider>
          <SaleDetailModal
            sale={sampleSale}
            isOpen={true}
            loading={false}
            onClose={vi.fn()}
            canManage={true}
            onStatusUpdated={onStatusUpdated}
          />
        </ToastProvider>
      </MemoryRouter>
    );

    const statusSelect = screen.getByLabelText('Change Status');
    fireEvent.change(statusSelect, { target: { value: 'cancelled' } });

    // Confirmation prompt appears before API call
    expect(screen.getByText('Confirm Sale Cancellation')).toBeInTheDocument();
    expect(salesApi.updateSaleStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    await waitFor(() => {
      expect(salesApi.updateSaleStatus).toHaveBeenCalledWith(12, 'cancelled');
      expect(onStatusUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 12, status: 'cancelled' }));
    });

    // Copy sale link
    fireEvent.click(screen.getByRole('button', { name: /Copy sale link/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/sales?saleId=12')
      );
    });

    // Print Invoice
    fireEvent.click(screen.getByRole('button', { name: /Print Invoice/i }));
    expect(window.print).toHaveBeenCalledTimes(1);

    // Download PDF
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(mockSavePdf).toHaveBeenCalledWith('invoice_sale_12.pdf');
  });
});

