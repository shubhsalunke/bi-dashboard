import React from 'react';

export const Badge = ({ status, variant = null, label = null, children = null }) => {
  const normalized = status ? String(status).toLowerCase().replace(/_/g, '-') : 'default';
  const badgeClass = variant ? `badge-${variant}` : `badge-${normalized}`;
  const displayText =
    children || label || (typeof status === 'string' ? status.replace(/_/g, ' ') : status);

  return (
    <span className={`badge ${badgeClass}`}>
      {displayText}
    </span>
  );
};

export default Badge;
