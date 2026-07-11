import React from "react";

interface ForgeLogoProps {
  size?: number;
  className?: string;
}

export default function ForgeLogo({ size = 120, className = "" }: ForgeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none transition-all duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        {/* Metallic silver-blue gradient for the stylized 'F' */}
        <linearGradient id="f-gradient" x1="92" y1="55" x2="110" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Sleek dark gradient for the anvil */}
        <linearGradient id="anvil-gradient" x1="35" y1="125" x2="165" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Glow filter for circuit paths */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stylized 'F' */}
      <path
        d="M 92 55 L 142 55 L 136 72 L 106 72 L 101 92 L 126 92 L 122 107 L 98 107 L 92 130 L 74 130 Z"
        fill="url(#f-gradient)"
        stroke="#475569"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Circuit lines */}
      <g stroke="#5cf0d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#neon-glow)">
        {/* Trace from stem to junction */}
        <path d="M 83 100 L 92 100" />
        {/* Top branch */}
        <path d="M 92 100 L 108 84 L 136 84" />
        {/* Middle branch */}
        <path d="M 92 100 L 144 100" />
        {/* Bottom branch */}
        <path d="M 92 100 L 108 116 L 128 116" />
      </g>

      {/* Circuit nodes (dots) */}
      <g fill="#5cf0d0" filter="url(#neon-glow)">
        {/* Junction dot */}
        <circle cx="92" cy="100" r="3.5" fill="#7c5cff" stroke="#5cf0d0" strokeWidth="1" />
        {/* Terminating dots */}
        <circle cx="136" cy="84" r="4.5" className="animate-pulse" />
        <circle cx="144" cy="100" r="4.5" className="animate-pulse" />
        <circle cx="128" cy="116" r="4.5" className="animate-pulse" />
      </g>

      {/* Anvil */}
      <path
        d="M 35 125 L 165 125 Q 168 129, 160 132 C 120 134, 115 142, 115 155 C 115 165, 124 171, 132 175 L 122 175 Q 100 162, 78 175 L 68 175 C 76 171, 85 165, 85 155 C 85 142, 80 134, 40 132 Q 32 129, 35 125 Z"
        fill="url(#anvil-gradient)"
        stroke="#475569"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
