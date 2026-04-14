/**
 * Wing 5: Set Theory — "Being"
 *
 * Container managing phase progression through the six learning phases.
 * From wonder at boundaries to creating your own set definition.
 */

import React, { useState, useCallback } from 'react';
import type { PhaseType, FoundationPhase } from '../../../types/index.js';
import { PHASE_ORDER } from '../../../types/index.js';
import { getFoundation, getFoundationPhase } from '../../../core/registry.js';
import { WonderPhase } from './WonderPhase.js';
import { SeePhase } from './SeePhase.js';
import { TouchPhase } from './TouchPhase.js';
import { UnderstandPhase } from './UnderstandPhase.js';
import { ConnectPhase } from './ConnectPhase.js';
import { CreatePhase } from './CreatePhase.js';

export interface SetTheoryWingProps {
  initialPhase?: PhaseType;
  onPhaseComplete?: (phase: PhaseType) => void;
  onWingComplete?: () => void;
  onSaveCreation?: (creation: {
    foundationId: 'set-theory';
    type: 'journal';
    title: string;
    data: string;
    shared: boolean;
  }) => void;
}

const FOUNDATION_ID = 'set-theory' as const;

export const SetTheoryWing: React.FC<SetTheoryWingProps> = ({
  initialPhase = 'wonder',
  onPhaseComplete,
  onWingComplete,
  onSaveCreation,
}) => {
  const foundation = getFoundation(FOUNDATION_ID);
  const [currentPhase, setCurrentPhase] = useState<PhaseType>(initialPhase);

  const advancePhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    onPhaseComplete?.(currentPhase);

    if (currentIndex < PHASE_ORDER.length - 1) {
      setCurrentPhase(PHASE_ORDER[currentIndex + 1]);
    } else {
      onWingComplete?.();
    }
  }, [currentPhase, onPhaseComplete, onWingComplete]);

  const phase = getFoundationPhase(FOUNDATION_ID, currentPhase);

  const renderPhase = () => {
    switch (currentPhase) {
      case 'wonder':
        return <WonderPhase phase={phase} onComplete={advancePhase} />;
      case 'see':
        return <SeePhase phase={phase} onComplete={advancePhase} />;
      case 'touch':
        return <TouchPhase phase={phase} onComplete={advancePhase} />;
      case 'understand':
        return <UnderstandPhase phase={phase} onComplete={advancePhase} />;
      case 'connect':
        return <ConnectPhase phase={phase} onComplete={advancePhase} />;
      case 'create':
        return (
          <CreatePhase
            phase={phase}
            onComplete={advancePhase}
            onSaveCreation={onSaveCreation}
          />
        );
    }
  };

  return (
    <div className="observatory-wing set-theory-wing">
      <header className="wing-header">
        <div className="wing-identity">
          <span className="wing-icon">{foundation.icon}</span>
          <h1>{foundation.name}: {foundation.subtitle}</h1>
        </div>
        <nav className="phase-navigation">
          {PHASE_ORDER.map((p, i) => (
            <span
              key={p}
              className={[
                'phase-indicator',
                p === currentPhase ? 'current' : '',
                PHASE_ORDER.indexOf(currentPhase) > i ? 'completed' : '',
              ].filter(Boolean).join(' ')}
            >
              {p}
            </span>
          ))}
        </nav>
      </header>

      <main className="wing-content">
        {renderPhase()}
      </main>
    </div>
  );
};

export { WonderPhase } from './WonderPhase.js';
export { SeePhase } from './SeePhase.js';
export { TouchPhase } from './TouchPhase.js';
export { UnderstandPhase } from './UnderstandPhase.js';
export { ConnectPhase } from './ConnectPhase.js';
export { CreatePhase } from './CreatePhase.js';
export default SetTheoryWing;
