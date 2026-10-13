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
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{start}</span> to{' '}
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{end}</span> of{' '}
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{activeTotal}</span> entries
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0 8px' }}>
          Page {activePage} of {activeTotalPages}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={activePage >= activeTotalPages}
          onClick={() => onPageChange(activePage + 1)}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
