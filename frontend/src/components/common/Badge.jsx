import React from 'react';

export const Badge = ({ status, variant = null, label = null, children = null }) => {
  const badgeClass = variant ? `badge-${variant}` : `badge-${status?.toLowerCase() || 'default'}`;
  const displayText = children || label || status;

  return (
    <span className={`badge ${badgeClass}`}>
      {displayText}
    </span>
  );
};

export default Badge;
