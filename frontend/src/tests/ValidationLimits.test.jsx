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

      const submitBtn = screen.getByRole('button', { name: /^Sign in$/i });
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
      expect(screen.queryByText(/Product name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Unit price must be a valid number greater than zero/i)).not.toBeInTheDocument();

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
    it('does not show required errors on initial open and displays error when left empty on blur', () => {
      render(
        <ToastProvider>
          <CustomerFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSaved={vi.fn()}
          />
        </ToastProvider>
      );

      expect(screen.queryByText(/Customer code is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Customer name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Email address is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/City is required/i)).not.toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Company \/ Client Name \*/i);
      fireEvent.blur(nameInput);
      expect(screen.getByText(/Customer name is required/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      expect(screen.getByText(/Customer code is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/City is required/i)).toBeInTheDocument();
    });

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

    it('validates optional 15-character GSTIN format and keeps Industry and Customer Type optional', () => {
      render(
        <ToastProvider>
          <CustomerFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSaved={vi.fn()}
          />
        </ToastProvider>
      );

      const gstInput = screen.getByLabelText(/GST Number/i);
      expect(gstInput).toHaveAttribute('maxLength', '15');

      // Invalid GSTIN shows inline error on blur
      fireEvent.change(gstInput, { target: { value: 'invalid123' } });
      fireEvent.blur(gstInput);
      expect(gstInput.value).toBe('INVALID123');
      expect(screen.getByText(/GST number must be a valid 15-character GSTIN/i)).toBeInTheDocument();

      // Valid GSTIN clears inline error
      fireEvent.change(gstInput, { target: { value: '27aaaca1234a1z5' } });
      expect(gstInput.value).toBe('27AAACA1234A1Z5');
      expect(screen.queryByText(/GST number must be a valid 15-character GSTIN/i)).not.toBeInTheDocument();

      // Industry & Customer Type have no required asterisk
      expect(screen.getByLabelText('Industry')).not.toBeRequired();
      expect(screen.getByLabelText('Customer Type')).not.toBeRequired();
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
