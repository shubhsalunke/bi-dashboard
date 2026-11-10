import React from 'react';

export const TableSkeleton = ({ rows = 5, columns, cols, count, height }) => {
  const rowCount = count || rows;
  const colCount = columns || cols || 5;

  return (
    <div className="table-skeleton" aria-busy="true" aria-label="Loading table data">
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <div key={rIdx} className="table-skeleton-row">
          {Array.from({ length: colCount }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="skeleton"
              style={{
                height: height ? `${height}px` : '20px',
                flex: cIdx === 0 ? 1.5 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="stat-card" aria-busy="true" aria-label="Loading metric">
      <div className="skeleton" style={{ width: '48%', height: '14px' }} />
      <div className="skeleton" style={{ width: '64%', height: '28px', marginTop: '6px' }} />
      <div className="skeleton" style={{ width: '52%', height: '12px', marginTop: '6px' }} />
    </div>
  );
};

export const LoadingSkeleton = TableSkeleton;
export default TableSkeleton;
