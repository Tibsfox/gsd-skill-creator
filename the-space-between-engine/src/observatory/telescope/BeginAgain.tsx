// BeginAgain — The loop-closing moment.
//
// Two states:
//
// 1. "Loop closed" (Wings 1 AND 8 complete):
//    A subtle visual connection between L-Systems and Unit Circle.
//    A quiet acknowledgment — the bookends are in place.
//
// 2. "Full journey" (all 8 complete):
//    The full "Begin Again" moment.
//    Animation is SLOW — a breath, not a transition.
//    Shows the vision's coda: "Begin again." Two words. No elaboration.
//    Does NOT auto-navigate back to Wing 1.
//    The invitation is to return, not compulsion.
//    Designed for the feeling of arriving back where you started
//    and finding the landscape changed.

import React, { useState, useCallback, useEffect } from 'react';
import type { BeginAgainProps } from './types';

export function BeginAgain({
  state,
  onBeginAgain,
}: BeginAgainProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [showCoda, setShowCoda] = useState(false);

  // Fade in slowly
  useEffect(() => {
    if (state === 'hidden') {
      setVisible(false);
      setShowCoda(false);
      return;
    }

    const fadeTimer = setTimeout(() => setVisible(true), 600);
    let codaTimer: ReturnType<typeof setTimeout> | undefined;

    if (state === 'full-journey') {
      codaTimer = setTimeout(() => setShowCoda(true), 3000);
    }

    return () => {
      clearTimeout(fadeTimer);
      if (codaTimer) clearTimeout(codaTimer);
    };
  }, [state]);

  if (state === 'hidden') return null;

  const handleClick = useCallback(() => {
    if (state === 'full-journey') {
      onBeginAgain();
    }
  }, [state, onBeginAgain]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && state === 'full-journey') {
        e.preventDefault();
        onBeginAgain();
      }
    },
    [state, onBeginAgain]
  );

  return (
    <div
      className="telescope__begin-again"
      style={{
        position: 'absolute',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 2s ease',
        zIndex: 10,
        pointerEvents: state === 'full-journey' ? 'auto' : 'none',
      }}
    >
      {/* Loop-closed state: subtle line between endpoints */}
      {state === 'loop-closed' && (
        <p
          style={{
            color: 'rgba(148, 163, 184, 0.6)',
            fontSize: 13,
            fontStyle: 'italic',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          The first and last are joined.
        </p>
      )}

      {/* Full journey: the coda */}
      {state === 'full-journey' && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Begin again — return to the Unit Circle"
          style={{ cursor: 'pointer' }}
        >
          {/* The slow-appearing coda */}
          <p
            style={{
              color: showCoda ? '#e2e8f0' : 'transparent',
              fontSize: 20,
              fontWeight: 300,
              letterSpacing: '0.08em',
              margin: 0,
              transition: 'color 4s ease',
              userSelect: 'none',
            }}
          >
            Begin again.
          </p>
        </div>
      )}
    </div>
  );
}
