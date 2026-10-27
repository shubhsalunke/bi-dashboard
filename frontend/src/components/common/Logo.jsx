import React from 'react';

export const Logo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="Smart BI Logo"
    >
      <rect width="32" height="32" rx="4" fill="#0f766e" />
      <rect x="7" y="16" width="4" height="9" rx="1" fill="#ffffff" />
      <rect x="14" y="11" width="4" height="14" rx="1" fill="#ffffff" />
      <rect x="21" y="7" width="4" height="18" rx="1" fill="#ffffff" />
    </svg>
  );
};

export default Logo;
