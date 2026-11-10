import React from 'react';

export const StatCard = ({ title, value, subtitle, comparison }) => {
  const secondaryLine = comparison ? comparison.text : subtitle;
  const secondaryClass = comparison
    ? (comparison.isPositive ? 'stat-meta stat-meta-positive' : 'stat-meta stat-meta-negative')
    : 'stat-meta';

  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value tabular-nums">{value}</div>
      {secondaryLine && (
        <div className={secondaryClass}>{secondaryLine}</div>
      )}
    </div>
  );
};

export default StatCard;
