// ChainView — Renders a single chain (math / nature / skill-creator / hundred-voices)
// as a ring of 8 foundation nodes arranged in a circle.
// Active chain nodes are fully opaque; inactive chains are dimmed.
// Each chain ring has a different radius so the 4 rings are concentric.

import React from 'react';
import type { ChainViewProps } from './types';
import { FoundationNode } from './FoundationNode';

export function ChainView({
  chain,
  layout,
  isActive,
  selectedFoundation,
  progress,
  onSelectFoundation,
}: ChainViewProps): React.JSX.Element {
  return (
    <g
      className={`telescope__chain-view telescope__chain-view--${chain.id}`}
      data-chain={chain.id}
    >
      {/* Chain ring outline — very subtle */}
      <circle
        cx={0}
        cy={0}
        r={layout.radius}
        fill="none"
        stroke={chain.color}
        strokeWidth={isActive ? 1 : 0.5}
        opacity={isActive ? 0.2 : 0.06}
        strokeDasharray={isActive ? 'none' : '4 8'}
        style={{ transition: 'opacity 0.5s ease, stroke-width 0.5s ease' }}
      />

      {/* Foundation nodes */}
      {layout.nodes.map((nodePos, index) => {
        const nodeData = chain.nodes[index];
        if (!nodeData) return null;

        const nodeProgress = progress.get(nodePos.foundationId);
        if (!nodeProgress) return null;

        return (
          <FoundationNode
            key={`${chain.id}-${nodePos.foundationId}`}
            foundationId={nodePos.foundationId}
            label={nodeData.label}
            description={nodeData.description}
            position={nodePos}
            isSelected={nodePos.foundationId === selectedFoundation}
            isActive={isActive}
            progress={nodeProgress}
            chainColor={chain.color}
            onSelect={onSelectFoundation}
          />
        );
      })}
    </g>
  );
}
