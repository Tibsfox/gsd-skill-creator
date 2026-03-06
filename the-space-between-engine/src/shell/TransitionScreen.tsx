/**
 * TransitionScreen — Animated Transitions
 *
 * Simple fade transition between phases, slide with
 * foundation color on wing transitions.
 */

import React, { useState, useEffect } from 'react';
import { theme } from './theme.js';

export interface TransitionScreenProps {
  /** Unique key that triggers transition when it changes */
  transitionKey: string;
  /** Foundation color for wing transitions */
  color?: string;
  children: React.ReactNode;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({
  transitionKey,
  color,
  children,
}) => {
  const [visible, setVisible] = useState(true);
  const [currentKey, setCurrentKey] = useState(transitionKey);

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setVisible(false);
      const timeout = setTimeout(() => {
        setCurrentKey(transitionKey);
        setVisible(true);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [transitionKey, currentKey]);

  return (
    <div
      className="transition-screen"
      data-testid="transition-screen"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${theme.animation.normal} ease-in-out`,
        borderTop: color ? `2px solid ${color}` : 'none',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default TransitionScreen;
