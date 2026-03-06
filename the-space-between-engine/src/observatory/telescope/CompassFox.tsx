// CompassFox — The fox at the center of convergence.
// The fox first appeared in Wing 4 (Vector Calculus) and resurfaces here.
// The fox IS the learner: navigates by invisible fields (Vector Calculus),
// processes information through physical sensation (Information Theory),
// persists as pattern across changing atoms (Set Theory),
// grows according to recursive rules (L-Systems).
//
// The fox is rendered as an SVG at the center of the telescope circle.
// When a foundation is selected, the fox subtly orients toward it.
// During "Begin Again," the fox glows with quiet recognition.

import React, { useMemo } from 'react';
import type { CompassFoxProps } from './types';
import type { FoundationId } from '@/types/index';
import { FOUNDATION_ORDER } from '@/types/index';

// Angle of each foundation on the circle (matching the Telescope layout)
function foundationAngle(id: FoundationId): number {
  const index = FOUNDATION_ORDER.indexOf(id);
  return (2 * Math.PI * index) / FOUNDATION_ORDER.length - Math.PI / 2;
}

export function CompassFox({
  centerX,
  centerY,
  selectedFoundation,
  beginAgainState,
}: CompassFoxProps): React.JSX.Element {
  // Fox rotates to face the selected foundation
  const rotation = useMemo(() => {
    if (!selectedFoundation) return 0;
    const angle = foundationAngle(selectedFoundation);
    return (angle * 180) / Math.PI + 90; // +90 because the fox faces "up" by default
  }, [selectedFoundation]);

  const glowIntensity = beginAgainState === 'full-journey' ? 0.8
    : beginAgainState === 'loop-closed' ? 0.4
    : 0;

  const foxScale = beginAgainState === 'full-journey' ? 1.1 : 1.0;

  return (
    <g
      className="telescope__compass-fox"
      transform={`translate(${centerX}, ${centerY})`}
      role="img"
      aria-label="The compass fox at the center of convergence"
    >
      {/* Glow circle behind the fox — visible during Begin Again states */}
      {glowIntensity > 0 && (
        <circle
          r={36}
          fill="none"
          stroke="rgba(251, 191, 36, 0.3)"
          strokeWidth={2}
          opacity={glowIntensity}
          style={{
            animation: beginAgainState === 'full-journey'
              ? 'telescope-fox-glow 4s ease-in-out infinite'
              : 'none',
          }}
        />
      )}

      {/* Fox body — simplified geometric fox */}
      <g
        transform={`rotate(${rotation}) scale(${foxScale})`}
        style={{ transition: 'transform 1.2s ease-in-out' }}
      >
        {/* Body: warm amber shape */}
        <path
          d="M0,-18 L-10,6 L-6,14 L0,10 L6,14 L10,6 Z"
          fill="#d97706"
          opacity={0.9}
        />

        {/* Left ear */}
        <path
          d="M-8,-16 L-14,-28 L-3,-18 Z"
          fill="#f59e0b"
          opacity={0.9}
        />

        {/* Right ear */}
        <path
          d="M8,-16 L14,-28 L3,-18 Z"
          fill="#f59e0b"
          opacity={0.9}
        />

        {/* Ear inner (left) */}
        <path
          d="M-7,-17 L-11,-25 L-4,-18 Z"
          fill="#92400e"
          opacity={0.5}
        />

        {/* Ear inner (right) */}
        <path
          d="M7,-17 L11,-25 L4,-18 Z"
          fill="#92400e"
          opacity={0.5}
        />

        {/* Snout */}
        <ellipse cx={0} cy={-10} rx={4} ry={3} fill="#fbbf24" opacity={0.8} />

        {/* Nose */}
        <circle cx={0} cy={-13} r={1.5} fill="#1c1917" />

        {/* Eyes */}
        <circle cx={-4} cy={-16} r={1.8} fill="#1c1917" />
        <circle cx={4} cy={-16} r={1.8} fill="#1c1917" />

        {/* Eye glints */}
        <circle cx={-3.5} cy={-16.5} r={0.6} fill="#fef3c7" />
        <circle cx={4.5} cy={-16.5} r={0.6} fill="#fef3c7" />

        {/* Tail */}
        <path
          d="M0,10 Q-12,18 -8,24 Q-4,20 0,14"
          fill="#d97706"
          opacity={0.8}
        />

        {/* White chest */}
        <path
          d="M-4,4 Q0,8 4,4 L2,12 Q0,14 -2,12 Z"
          fill="#fef3c7"
          opacity={0.7}
        />
      </g>

      {/* "Compass" indicator: subtle cardinal points */}
      <g opacity={0.15}>
        <line x1={0} y1={-28} x2={0} y2={-24} stroke="#94a3b8" strokeWidth={1} />
        <line x1={0} y1={24} x2={0} y2={28} stroke="#94a3b8" strokeWidth={1} />
        <line x1={-28} y1={0} x2={-24} y2={0} stroke="#94a3b8" strokeWidth={1} />
        <line x1={24} y1={0} x2={28} y2={0} stroke="#94a3b8" strokeWidth={1} />
      </g>
    </g>
  );
}
