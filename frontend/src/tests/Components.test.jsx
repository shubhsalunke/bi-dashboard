import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';

describe('Common UI Components', () => {
  describe('Badge Component', () => {
    it('renders with status class and label', () => {
      const { container } = render(<Badge status="active" />);
      expect(container.firstChild).toHaveClass('badge-active');
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders with custom variant and children', () => {
      const { container } = render(<Badge variant="danger">Critical Alert</Badge>);
      expect(container.firstChild).toHaveClass('badge-danger');
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('renders custom title and description', () => {
      render(
        <EmptyState
          title="No records found"
          description="Try adjusting your search criteria."
        />
      );
      expect(screen.getByText('No records found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria.')).toBeInTheDocument();
    });
  });

  describe('Pagination Component', () => {
    it('renders pagination details and handles navigation', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          page={2}
          totalPages={5}
          total={50}
          limit={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getByText(/Page 2 of 5/i)).toBeInTheDocument();

      const prevBtn = screen.getByRole('button', { name: /Prev/i });
      const nextBtn = screen.getByRole('button', { name: /Next/i });

      fireEvent.click(prevBtn);
      expect(onPageChange).toHaveBeenCalledWith(1);

      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('returns null when total items is 0', () => {
      const { container } = render(
        <Pagination page={1} totalPages={1} total={0} limit={10} onPageChange={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Modal Component', () => {
    it('renders modal content when open', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal Dialog">
          <div>Modal Body Content</div>
        </Modal>
      );

      expect(screen.getByText('Test Modal Dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}} title="Test">
          <div>Hidden Content</div>
        </Modal>
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
