import React from 'react';

export const Logo = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="Smart BI Logo"
    >
      <defs>
        <linearGradient id="smartLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="smartBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.85)" />
        </linearGradient>
        <filter id="smartLogoGlow" x="-2" y="-2" width="44" height="44" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#2563eb" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Squircle container with high-tech gradient */}
      <rect width="40" height="40" rx="10" fill="url(#smartLogoGrad)" filter="url(#smartLogoGlow)" />

      {/* Overlay glass sheen highlight */}
      <path
        d="M0 10C0 4.47715 4.47715 0 10 0H30C35.5228 0 40 4.47715 40 10V18C28 20 12 16 0 24V10Z"
        fill="white"
        fillOpacity="0.12"
      />

      {/* Modern rising analytics columns */}
      <rect x="9" y="21" width="5" height="10" rx="2.5" fill="url(#smartBarGrad)" />
      <rect x="17.5" y="14" width="5" height="17" rx="2.5" fill="url(#smartBarGrad)" />
      <rect x="26" y="9" width="5" height="22" rx="2.5" fill="url(#smartBarGrad)" />

      {/* Cyan intelligence accent spark */}
      <circle cx="28.5" cy="7" r="2.5" fill="#67e8f9" />
    </svg>
  );
};

export default Logo;
