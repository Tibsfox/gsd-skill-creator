// ChainSelector — Controls for switching between the 4 parallel chains.
// Positioned at the bottom of the Telescope view.
// Each chain button shows the chain name and subtle color coding.

import React, { useCallback } from 'react';
import type { ChainSelectorProps, ChainId } from './types';

export function ChainSelector({
  chains,
  activeChain,
  onSelectChain,
}: ChainSelectorProps): React.JSX.Element {
  return (
    <nav
      className="telescope__chain-selector"
      aria-label="Chain perspective"
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: 24,
        border: '1px solid rgba(148, 163, 184, 0.15)',
        zIndex: 10,
      }}
    >
      {chains.map((chain) => (
        <ChainButton
          key={chain.id}
          id={chain.id}
          name={chain.name}
          color={chain.color}
          isActive={chain.id === activeChain}
          onSelect={onSelectChain}
        />
      ))}
    </nav>
  );
}

// ─── Individual Chain Button ────────────────────────────────

interface ChainButtonProps {
  id: ChainId;
  name: string;
  color: string;
  isActive: boolean;
  onSelect: (id: ChainId) => void;
}

function ChainButton({
  id,
  name,
  color,
  isActive,
  onSelect,
}: ChainButtonProps): React.JSX.Element {
  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  return (
    <button
      className={`telescope__chain-button ${isActive ? 'telescope__chain-button--active' : ''}`}
      onClick={handleClick}
      aria-pressed={isActive}
      style={{
        padding: '6px 16px',
        borderRadius: 20,
        border: 'none',
        background: isActive ? color : 'transparent',
        color: isActive ? '#0f172a' : '#94a3b8',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </button>
  );
}
