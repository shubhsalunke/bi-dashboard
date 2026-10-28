import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { CustomerFormModal } from '../pages/CustomerFormModal';
import { AIAssistant } from '../pages/AIAssistant';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

describe('Frontend Input Validation & Boundaries', () => {
  describe('1. Login Form Validation', () => {
    it('disables submit button when inputs are empty or invalid and shows error on blur', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <ToastProvider>
              <Login />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Sign in to Workspace/i });
      expect(submitBtn).toBeDisabled();

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('maxLength', '254');

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute('maxLength', '128');

      // Invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();

      // Valid email & password enables button
      fireEvent.change(emailInput, { target: { value: 'admin@bi.corp' } });
      fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('2. Add / Edit Product Form Validation', () => {
    const categories = ['Cloud Infrastructure', 'Cybersecurity'];

    it('enforces maxLength, auto uppercase, and counter limits', () => {
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

      // Name max 150
      const nameInput = screen.getByLabelText(/Product Name \*/i);
      expect(nameInput).toHaveAttribute('maxLength', '150');

      // Product Code auto uppercase and max 30
      const skuInput = screen.getByLabelText(/Product Code/i);
      expect(skuInput).toHaveAttribute('maxLength', '30');
      fireEvent.change(skuInput, { target: { value: 'cld-001' } });
      expect(skuInput.value).toBe('CLD-001');

      // Description counter
      const descInput = screen.getByLabelText(/Description/i);
      expect(descInput).toHaveAttribute('maxLength', '1000');
      expect(screen.getByText('0/1000')).toBeInTheDocument();
      fireEvent.change(descInput, { target: { value: 'Testing character counter live updates' } });
      expect(screen.getByText('38/1000')).toBeInTheDocument();
    });

    it('strips leading zeros from numeric inputs', () => {
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

      const stockInput = screen.getByLabelText(/Stock Quantity \*/i);
      fireEvent.change(stockInput, { target: { value: '000123' } });
      expect(stockInput.value).toBe('123');
    });

    it('validates cost price greater than unit price and disables submit', () => {
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

      fireEvent.change(screen.getByLabelText(/Product Name \*/i), {
        target: { value: 'Valid Product Name' },
      });
      fireEvent.change(screen.getByLabelText(/Unit Price \(₹\) \*/i), {
        target: { value: '500' },
      });
      fireEvent.change(screen.getByLabelText(/Cost Price \(₹\)/i), {
        target: { value: '600' },
      });

      expect(screen.getByText(/Cost price must not be greater than Unit Price/i)).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /Add Product/i });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('3. Customer Form Validation', () => {
    it('restricts phone to 10 digits and validates length', () => {
      render(
        <ToastProvider>
          <CustomerFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSaved={vi.fn()}
          />
        </ToastProvider>
      );

      const phoneInput = screen.getByPlaceholderText('9820111001');
      expect(phoneInput).toHaveAttribute('maxLength', '10');

      // Typing letters or non-digits gets filtered out
      fireEvent.change(phoneInput, { target: { value: '98abc201' } });
      expect(phoneInput.value).toBe('98201');

      // Short phone triggers inline error
      fireEvent.change(phoneInput, { target: { value: '98201' } });
      expect(screen.getByText(/Phone number must be exactly 10 digits/i)).toBeInTheDocument();
    });
  });

  describe('4. AI Assistant Question Input Limits', () => {
    it('enforces maxLength 500 and renders live character counter', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ToastProvider>
              <AIAssistant />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Ask about revenue, customer spending/i);
      expect(input).toHaveAttribute('maxLength', '500');
      expect(screen.getByText('0/500')).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'How much revenue was generated last month?' } });
      expect(screen.getByText('42/500')).toBeInTheDocument();
    });
  });
});
