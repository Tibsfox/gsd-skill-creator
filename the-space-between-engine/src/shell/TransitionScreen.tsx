// TransitionScreen — Animated transitions between wings.
// Displays the foundation name, color, and a brief narrative intro
// before fading into the wing content.

import React, { useEffect, useState } from 'react';
import type { FoundationId } from '@/types/index';
import { getFoundation } from '@/core/registry';
import { FOUNDATION_COLORS, TEXT, FONT } from './theme';

interface TransitionScreenProps {
  foundation: FoundationId;
  onComplete: () => void;
}

export function TransitionScreen({ foundation, onComplete }: TransitionScreenProps): React.JSX.Element {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const data = getFoundation(foundation);
  const color = FOUNDATION_COLORS[foundation];

  useEffect(() => {
    // entering -> visible after 100ms (fade in)
    const enterTimer = window.setTimeout(() => setPhase('visible'), 100);
    // visible -> exiting after 1600ms
    const exitTimer = window.setTimeout(() => setPhase('exiting'), 1600);
    // complete after 2100ms
    const completeTimer = window.setTimeout(onComplete, 2100);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const opacity = phase === 'visible' ? 1 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        zIndex: 500,
        opacity,
        transition: 'opacity 400ms ease',
        pointerEvents: 'none',
      }}
    >
      {/* Color accent line */}
      <div
        style={{
          width: 80,
          height: 3,
          backgroundColor: color,
          marginBottom: '2rem',
          borderRadius: 2,
        }}
      />

      <h2
        style={{
          color: TEXT.primary,
          fontFamily: FONT.serif,
          fontSize: '2.5rem',
          fontWeight: 300,
          letterSpacing: '0.05em',
          margin: 0,
        }}
      >
        {data.name}
      </h2>

      <p
        style={{
          color: TEXT.secondary,
          fontFamily: FONT.sans,
          fontSize: '1rem',
          fontWeight: 400,
          marginTop: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {data.subtitle}
      </p>
    </div>
  );
}
