import React from 'react';

export const StatCard = ({ title, value, subtitle, comparison }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value tabular-nums">{value}</div>
      {comparison && (
        <div
          className={`stat-comparison ${
            comparison.isPositive ? 'stat-comparison-positive' : 'stat-comparison-negative'
          }`}
        >
          {comparison.text}
        </div>
      )}
      {subtitle && <div className="stat-footer">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
