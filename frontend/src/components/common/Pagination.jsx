import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page,
  currentPage,
  totalPages,
  total,
  totalItems,
  limit,
  pageSize,
  onPageChange,
}) => {
  const activePage = currentPage || page || 1;
  const activeTotal = total !== undefined ? total : totalItems || 0;
  const activeLimit = pageSize || limit || 10;
  const activeTotalPages = totalPages || Math.ceil(activeTotal / activeLimit) || 1;

  if (activeTotal === 0) return null;

  const start = (activePage - 1) * activeLimit + 1;
  const end = Math.min(activePage * activeLimit, activeTotal);

  return (
    <nav className="pagination-container" aria-label="Pagination">
      <div className="pagination-info tabular-nums">
        Showing <strong>{start}</strong> to <strong>{end}</strong> of{' '}
        <strong>{activeTotal}</strong> entries
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Prev</span>
        </button>
        <span className="pagination-page-label tabular-nums">
          Page {activePage} of {activeTotalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={activePage >= activeTotalPages}
          onClick={() => onPageChange(activePage + 1)}
        >
          <span>Next</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
