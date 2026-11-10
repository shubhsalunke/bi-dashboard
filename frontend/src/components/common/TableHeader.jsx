import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const TableHeader = ({
  label,
  field,
  sortField,
  sortAsc,
  onSort,
  align = 'left',
  style = {},
}) => {
  const alignClass = align === 'right' ? 'num' : '';

  if (!field || !onSort) {
    return (
      <th className={alignClass} style={{ textAlign: align, ...style }}>
        {label}
      </th>
    );
  }

  const isCurrent = sortField === field;
  const ariaSort = isCurrent ? (sortAsc ? 'ascending' : 'descending') : 'none';

  return (
    <th
      className={alignClass}
      style={{ textAlign: align, ...style }}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className="table-sort-btn"
        onClick={() => onSort(field)}
        style={{
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          width: align === 'right' ? '100%' : 'auto',
        }}
      >
        <span>{label}</span>
        {isCurrent && (
          <span style={{ color: 'var(--accent-text)', display: 'inline-flex' }} aria-hidden="true">
            {sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </span>
        )}
      </button>
    </th>
  );
};

export default TableHeader;
