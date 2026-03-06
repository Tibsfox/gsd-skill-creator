// FoundationNode — Renders a single foundation node on the Telescope circle.
// Displays label, progress ring, and responds to selection.
// Each node sits at a computed (x, y) position on its chain ring.

import React, { useCallback } from 'react';
import type { FoundationNodeProps } from './types';

const NODE_RADIUS = 32;
const PROGRESS_RING_RADIUS = 38;
const PROGRESS_RING_WIDTH = 4;

export function FoundationNode({
  foundationId,
  label,
  description,
  position,
  isSelected,
  isActive,
  progress,
  chainColor,
  onSelect,
}: FoundationNodeProps): React.JSX.Element {
  const handleClick = useCallback(() => {
    onSelect(foundationId);
  }, [foundationId, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(foundationId);
      }
    },
    [foundationId, onSelect]
  );

  // Progress arc: SVG arc from 0 to percentage of full circle
  const circumference = 2 * Math.PI * PROGRESS_RING_RADIUS;
  const progressOffset = circumference * (1 - progress.percentage / 100);

  // Opacity: active chain nodes are fully visible, inactive are dimmed
  const opacity = isActive ? 1.0 : 0.35;

  // Scale: selected node pulses slightly larger
  const scale = isSelected ? 1.15 : 1.0;

  return (
    <g
      className="telescope__foundation-node"
      transform={`translate(${position.x}, ${position.y}) scale(${scale})`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${description}. ${progress.isComplete ? 'Complete' : `${Math.round(progress.percentage)}% complete`}`}
      style={{
        cursor: 'pointer',
        opacity,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      {/* Progress ring */}
      <circle
        r={PROGRESS_RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={PROGRESS_RING_WIDTH}
      />
      <circle
        r={PROGRESS_RING_RADIUS}
        fill="none"
        stroke={progress.isComplete ? '#4ade80' : chainColor}
        strokeWidth={PROGRESS_RING_WIDTH}
        strokeDasharray={circumference}
        strokeDashoffset={progressOffset}
        strokeLinecap="round"
        transform="rotate(-90)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />

      {/* Node circle */}
      <circle
        r={NODE_RADIUS}
        fill={isSelected ? chainColor : 'rgba(15, 23, 42, 0.9)'}
        stroke={chainColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{ transition: 'fill 0.3s ease, stroke-width 0.3s ease' }}
      />

      {/* Label */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={isSelected ? '#0f172a' : '#e2e8f0'}
        fontSize={label.length > 12 ? 8 : 10}
        fontWeight={isSelected ? 600 : 400}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label.length > 16 ? `${label.slice(0, 14)}...` : label}
      </text>

      {/* Completion dot */}
      {progress.isComplete && (
        <circle
          cx={NODE_RADIUS * 0.7}
          cy={-NODE_RADIUS * 0.7}
          r={5}
          fill="#4ade80"
          stroke="#0f172a"
          strokeWidth={1}
        />
      )}

      {/* Selection highlight ring */}
      {isSelected && (
        <circle
          r={PROGRESS_RING_RADIUS + 6}
          fill="none"
          stroke={chainColor}
          strokeWidth={1}
          opacity={0.5}
          style={{ animation: 'telescope-pulse 2s ease-in-out infinite' }}
        />
      )}
    </g>
  );
}
