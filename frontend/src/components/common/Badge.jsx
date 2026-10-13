import React from 'react';

export const Badge = ({ status, variant = null, label = null, children = null }) => {
  const badgeClass = variant ? `badge-${variant}` : `badge-${status?.toLowerCase() || 'default'}`;
  const displayText = children || label || status;
  const isStatus = ['active', 'inactive', 'completed', 'pending', 'cancelled'].includes(status?.toLowerCase());

  return (
    <span className={`badge ${badgeClass}`}>
      {isStatus && <span className="badge-dot" />}
      <span>{displayText}</span>
    </span>
  );
};

export default Badge;
