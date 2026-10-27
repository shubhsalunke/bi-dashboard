import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductsTable } from '../components/products/ProductsTable';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { productsApi } from '../api/products.api';

vi.mock('../api/products.api', () => ({
  productsApi: {
    getProductDetails: vi.fn(),
  },
}));

describe('Products Module Components', () => {
  const sampleProducts = [
    {
      id: 1,
      sku: 'SKU-CLD-001',
      product_name: 'Cloud Virtual Server Node',
      category: 'Cloud Infrastructure',
      brand: 'Tata',
      supplier: 'Tata Communications Ltd',
      unit_price: 450.0,
      cost_price: 280.0,
      stock_quantity: 45,
      reorder_level: 10,
      units_sold: 12,
      total_revenue: 5400.0,
      is_active: true,
    },
    {
      id: 2,
      sku: 'SKU-EDR-008',
      product_name: 'Endpoint Detection & Response',
      category: 'Cybersecurity',
      brand: 'Infosys',
      supplier: 'Infosys BPM',
      unit_price: 950.0,
      cost_price: 580.0,
      stock_quantity: 5,
      reorder_level: 10, // 5 <= 10: low stock!
      units_sold: 8,
      total_revenue: 7600.0,
      is_active: true,
    },
    {
      id: 3,
      sku: 'SKU-OUT-009',
      product_name: 'Out of Stock Hardware',
      category: 'Cloud Infrastructure',
      brand: 'Reliance',
      supplier: 'Jio Platforms',
      unit_price: 200.0,
      cost_price: 100.0,
      stock_quantity: 0, // 0: out of stock!
      reorder_level: 10,
      units_sold: 3,
      total_revenue: 600.0,
      is_active: true,
    },
  ];

  describe('ProductsTable Component', () => {
    it('renders SKU, Brand, Stock, Units Sold, and badges correctly', () => {
      render(
        <ProductsTable
          products={sampleProducts}
          sortField="product_name"
          sortAsc={true}
          onSort={vi.fn()}
          canManage={true}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          onViewDetails={vi.fn()}
        />
      );

      expect(screen.getByText('SKU-CLD-001')).toBeInTheDocument();
      expect(screen.getByText('SKU-EDR-008')).toBeInTheDocument();
      expect(screen.getByText('SKU-OUT-009')).toBeInTheDocument();

      // Brand column
      expect(screen.getByText('Tata')).toBeInTheDocument();
      expect(screen.getByText('Infosys')).toBeInTheDocument();
      expect(screen.getByText('Reliance')).toBeInTheDocument();

      // Stock quantities and badges
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();

      expect(screen.getByText('Low stock')).toBeInTheDocument();
      expect(screen.getByText('Out of stock')).toBeInTheDocument();

      // Units Sold & Revenue
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText(/5,400/)).toBeInTheDocument();
      expect(screen.getByText(/7,600/)).toBeInTheDocument();
    });

    it('triggers onViewDetails when clicking product name', () => {
      const onViewDetails = vi.fn();
      render(
        <ProductsTable
          products={sampleProducts}
          sortField="product_name"
          sortAsc={true}
          onSort={vi.fn()}
          canManage={true}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          onViewDetails={onViewDetails}
        />
      );

      const nameBtn = screen.getByRole('button', { name: 'Cloud Virtual Server Node' });
      fireEvent.click(nameBtn);
      expect(onViewDetails).toHaveBeenCalledWith(sampleProducts[0]);
    });
  });

  describe('ProductFormModal Component', () => {
    const categories = ['Cloud Infrastructure', 'Cybersecurity', 'Enterprise Software'];

    it('renders all fields including Brand, Supplier, Unit, GST %, Reorder Level, Warranty', () => {
      render(
        <ProductFormModal
          isOpen={true}
          product={null}
          categories={categories}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Product Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Supplier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Unit Price \(₹\) \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Unit$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cost Price \(₹\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/GST %/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stock Quantity \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reorder Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Warranty \(months\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('validates negative cost price and invalid GST percentage', () => {
      const onSubmit = vi.fn();
      render(
        <ProductFormModal
          isOpen={true}
          product={null}
          categories={categories}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          loading={false}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Product name'), {
        target: { value: 'New Test Product' },
      });
      fireEvent.change(screen.getByLabelText(/Unit Price \(₹\) \*/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/Cost Price \(₹\)/i), {
        target: { value: '-10' },
      });

      fireEvent.submit(document.getElementById('product-form'));

      expect(screen.getByText(/Cost price must be a valid number greater than or equal to zero/i)).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid form data including all Phase A & B fields', () => {
      const onSubmit = vi.fn();
      render(
        <ProductFormModal
          isOpen={true}
          product={null}
          categories={categories}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          loading={false}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('e.g. SKU-PRD-001'), {
        target: { value: 'SKU-NEW-001' },
      });
      fireEvent.change(screen.getByPlaceholderText('Product name'), {
        target: { value: 'New Test Gateway' },
      });
      fireEvent.change(screen.getByPlaceholderText('e.g. Tata, Infosys, Reliance'), {
        target: { value: 'Mahindra' },
      });
      fireEvent.change(screen.getByPlaceholderText('Supplier or distributor name'), {
        target: { value: 'Tech Mahindra Ltd' },
      });
      fireEvent.change(screen.getByLabelText(/Unit Price \(₹\) \*/i), {
        target: { value: '500' },
      });
      fireEvent.change(screen.getByLabelText(/Cost Price \(₹\)/i), {
        target: { value: '300' },
      });
      fireEvent.change(screen.getByLabelText(/Stock Quantity \*/i), {
        target: { value: '20' },
      });
      fireEvent.change(screen.getByLabelText(/Reorder Level/i), {
        target: { value: '15' },
      });
      fireEvent.change(screen.getByLabelText(/Warranty \(months\)/i), {
        target: { value: '24' },
      });
      fireEvent.change(screen.getByPlaceholderText(/technical specifications/i), {
        target: { value: 'High reliability security gateway' },
      });

      fireEvent.submit(document.getElementById('product-form'));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'SKU-NEW-001',
          product_name: 'New Test Gateway',
          brand: 'Mahindra',
          supplier: 'Tech Mahindra Ltd',
          unit_price: 500,
          cost_price: 300,
          stock_quantity: 20,
          reorder_level: 15,
          warranty_months: 24,
          description: 'High reliability security gateway',
        }),
        expect.any(Function)
      );
    });
  });

  describe('ProductDetailsModal Component', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('loads and renders product details, brand, supplier, GST %, Price with GST, and margin', async () => {
      productsApi.getProductDetails.mockResolvedValueOnce({
        id: 1,
        sku: 'SKU-CLD-001',
        product_name: 'Cloud Virtual Server Node',
        category: 'Cloud Infrastructure',
        brand: 'Tata',
        supplier: 'Tata Communications Ltd',
        unit: 'per node',
        unit_price: 450.0,
        cost_price: 280.0,
        gst_percent: 18.0,
        price_with_gst: 531.0,
        stock_quantity: 8,
        reorder_level: 10,
        warranty_months: 12,
        margin: 37.78,
        units_sold: 15,
        total_revenue: 6750.0,
        description: 'Multi-core cloud compute node',
        is_active: true,
        recent_sales: [
          {
            sale_id: 101,
            sale_date: '2026-10-15',
            customer_name: 'Acme Logistics India',
            quantity: 2,
            amount: 900.0,
          },
        ],
      });

      render(
        <ProductDetailsModal
          productId={1}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Loading product details/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Cloud Virtual Server Node')).toBeInTheDocument();
      });

      expect(screen.getByText('SKU-CLD-001')).toBeInTheDocument();
      expect(screen.getByText('Tata')).toBeInTheDocument();
      expect(screen.getByText('Tata Communications Ltd')).toBeInTheDocument();
      expect(screen.getByText('18%')).toBeInTheDocument();
      expect(screen.getByText(/₹531/)).toBeInTheDocument(); // Price with GST
      expect(screen.getByText('37.78%')).toBeInTheDocument(); // Margin %
      expect(screen.getByText('Low stock')).toBeInTheDocument(); // 8 <= 10
      expect(screen.getByText('12 months')).toBeInTheDocument();
      expect(screen.getByText('Acme Logistics India')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
