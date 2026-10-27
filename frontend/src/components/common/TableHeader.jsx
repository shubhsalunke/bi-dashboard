import React from 'react';

export const TableHeader = ({
  label,
  field,
  sortField,
  sortAsc,
  onSort,
  align = 'left',
  style = {},
}) => {
  if (!field || !onSort) {
    return <th style={{ textAlign: align, ...style }}>{label}</th>;
  }

  const isCurrent = sortField === field;

  return (
    <th
      style={{
        textAlign: align,
        cursor: 'pointer',
        userSelect: 'none',
        ...style,
      }}
      onClick={() => onSort(field)}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <span>{label}</span>
        {isCurrent && (
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
            {sortAsc ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

export default TableHeader;
