import React from 'react';

export default function AnimatedAppIcon({
  src = './icon.png',
  alt = 'OVERSEER',
  className = '',
  imgProps = {},
}) {
  return (
    <span className={`animated-artifact-icon ${className}`}>
      <img src={src} alt={alt} {...imgProps} />
      <svg className="artifact-energy-overlay" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="artifactCoreGlow" cx="50%" cy="50%" r="38%">
            <stop offset="0%" stopColor="#fff7ff" />
            <stop offset="18%" stopColor="#f2d47b" />
            <stop offset="48%" stopColor="#b45cff" />
            <stop offset="100%" stopColor="#6c2cff" stopOpacity="0" />
          </radialGradient>
          <filter id="artifactEnergyBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <g className="artifact-circuit artifact-circuit-left">
          <path d="M28 33h12l4 7h7" />
          <path d="M24 42h15l5 6h8" />
          <path d="M29 51h11l4 6h8" />
          <path d="M32 61h9l4 5h7" />
        </g>

        <g className="artifact-circuit artifact-circuit-right">
          <path d="M72 33H60l-4 7h-7" />
          <path d="M76 42H61l-5 6h-8" />
          <path d="M71 51H60l-4 6h-8" />
          <path d="M68 61h-9l-4 5h-7" />
        </g>

        <path className="artifact-spine artifact-spine-a" d="M50 17v66" />
        <path className="artifact-spine artifact-spine-b" d="M19 50h62" />
        <circle className="artifact-core-halo" cx="50" cy="50" r="18" fill="url(#artifactCoreGlow)" />
        <circle className="artifact-core" cx="50" cy="50" r="4.6" />
        <g className="artifact-electricity">
          <path d="M50 24 46 42 51 39 47 56 56 35 51 38z" />
          <path d="M50 76 54 58 49 61 53 44 44 65 49 62z" />
          <path d="M24 50 42 46 39 51 56 47 35 56 38 51z" />
          <path d="M76 50 58 54 61 49 44 53 65 44 62 49z" />
        </g>
      </svg>
    </span>
  );
}
