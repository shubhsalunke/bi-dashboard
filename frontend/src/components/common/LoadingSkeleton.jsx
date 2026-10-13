import React from 'react';

export const TableSkeleton = ({ rows = 5, columns = 5, count, height }) => {
  const rowCount = count || rows;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '16px' }}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="skeleton"
              style={{
                height: height ? `${height}px` : '24px',
                flex: cIdx === 0 ? 1.5 : 1,
                borderRadius: '6px',
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
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: '40%', height: '14px' }} />
        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
      </div>
      <div className="skeleton" style={{ width: '60%', height: '32px', margin: '12px 0 6px' }} />
      <div className="skeleton" style={{ width: '50%', height: '12px' }} />
    </div>
  );
};

export const LoadingSkeleton = TableSkeleton;
export default TableSkeleton;
