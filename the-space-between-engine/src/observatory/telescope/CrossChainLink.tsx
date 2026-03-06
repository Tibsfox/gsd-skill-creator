// CrossChainLink — Visual connection showing the same foundation across chains.
// When a foundation is selected, lines radiate from that foundation's position
// on one chain ring to its positions on all other chain rings.
// This is the visual proof that all 4 chains are the same story told differently.

import React from 'react';
import type { CrossChainLinkProps } from './types';

export function CrossChainLink({
  link,
  isHighlighted,
}: CrossChainLinkProps): React.JSX.Element | null {
  if (!isHighlighted || link.positions.length < 2) {
    return null;
  }

  // Connect all positions for this foundation across chains.
  // Draw lines from the first position (innermost ring) to all others,
  // creating a spoke pattern through the center.
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

  for (let i = 0; i < link.positions.length; i++) {
    for (let j = i + 1; j < link.positions.length; j++) {
      const from = link.positions[i]!;
      const to = link.positions[j]!;
      lines.push({
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        key: `${link.foundationId}-${from.chainId}-${to.chainId}`,
      });
    }
  }

  return (
    <g className="telescope__cross-chain-link" opacity={0.6}>
      {lines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(251, 191, 36, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          style={{
            animation: 'telescope-link-draw 0.8s ease forwards',
          }}
        />
      ))}
      {/* Small dots at each endpoint */}
      {link.positions.map((pos) => (
        <circle
          key={`${link.foundationId}-dot-${pos.chainId}`}
          cx={pos.x}
          cy={pos.y}
          r={3}
          fill="rgba(251, 191, 36, 0.8)"
        />
      ))}
    </g>
  );
}
