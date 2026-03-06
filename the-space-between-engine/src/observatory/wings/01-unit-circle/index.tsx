/**
 * Wing 1: Unit Circle — "Seeing"
 *
 * Container component managing phase progression through
 * Wonder -> See -> Touch -> Understand -> Connect -> Create
 */

import React, { useCallback, useState } from 'react';
import type { FoundationId, LearnerState, PhaseType } from '../../../types/index.js';
import { PHASE_ORDER } from '../../../types/index.js';
import { WonderPhase, wonderMeta } from './WonderPhase.js';
import { SeePhase, seeMeta } from './SeePhase.js';
import { TouchPhase, touchMeta } from './TouchPhase.js';
import { UnderstandPhase, understandMeta } from './UnderstandPhase.js';
import { ConnectPhase, connectMeta } from './ConnectPhase.js';
import { CreatePhase, createMeta } from './CreatePhase.js';

export interface UnitCircleWingProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onPhaseComplete?: (foundation: FoundationId, phase: PhaseType) => void;
  onNavigate?: (foundation: FoundationId) => void;
  onSaveCreation?: (creation: { title: string; data: string }) => void;
}

export const WING_ID: FoundationId = 'unit-circle';
export const WING_NAME = 'Unit Circle';
export const WING_SUBTITLE = 'Seeing';

export const UnitCircleWing: React.FC<UnitCircleWingProps> = ({
  foundationId,
  learnerState,
  onPhaseComplete,
  onNavigate,
  onSaveCreation,
}) => {
  // Determine initial phase from learner state
  const completedPhases = learnerState.completedPhases[foundationId] || [];
  const initialPhaseIndex = Math.min(
    completedPhases.length,
    PHASE_ORDER.length - 1,
  );
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(initialPhaseIndex);

  const currentPhase = PHASE_ORDER[currentPhaseIndex];

  const advancePhase = useCallback(() => {
    onPhaseComplete?.(foundationId, currentPhase);
    if (currentPhaseIndex < PHASE_ORDER.length - 1) {
      setCurrentPhaseIndex((i) => i + 1);
    }
  }, [currentPhaseIndex, currentPhase, foundationId, onPhaseComplete]);

  const goBack = useCallback(() => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex((i) => i - 1);
    }
  }, [currentPhaseIndex]);

  return (
    <div className="wing unit-circle-wing">
      <header className="wing-header">
        <h1>Wing 1: {WING_NAME}</h1>
        <p className="wing-subtitle">{WING_SUBTITLE}</p>
        <nav className="phase-nav">
          {PHASE_ORDER.map((phase, i) => (
            <span
              key={phase}
              className={`phase-indicator ${i === currentPhaseIndex ? 'active' : ''} ${i < currentPhaseIndex ? 'completed' : ''}`}
            >
              {phase}
            </span>
          ))}
        </nav>
      </header>

      <main className="wing-content">
        {currentPhase === 'wonder' && <WonderPhase onComplete={advancePhase} />}
        {currentPhase === 'see' && <SeePhase onComplete={advancePhase} />}
        {currentPhase === 'touch' && <TouchPhase onComplete={advancePhase} />}
        {currentPhase === 'understand' && <UnderstandPhase onComplete={advancePhase} />}
        {currentPhase === 'connect' && (
          <ConnectPhase onComplete={advancePhase} onNavigate={onNavigate} />
        )}
        {currentPhase === 'create' && (
          <CreatePhase onComplete={advancePhase} onSaveCreation={onSaveCreation} />
        )}
      </main>

      <footer className="wing-footer">
        {currentPhaseIndex > 0 && (
          <button className="phase-back" onClick={goBack}>
            Back
          </button>
        )}
      </footer>
    </div>
  );
};

/** Aggregated wing metadata for testing/validation */
export const wingMeta = {
  id: WING_ID,
  name: WING_NAME,
  subtitle: WING_SUBTITLE,
  phases: {
    wonder: wonderMeta,
    see: seeMeta,
    touch: touchMeta,
    understand: understandMeta,
    connect: connectMeta,
    create: createMeta,
  },
  totalInteractiveElements:
    wonderMeta.interactiveElements +
    seeMeta.interactiveElements +
    touchMeta.interactiveElements +
    understandMeta.interactiveElements +
    connectMeta.interactiveElements +
    createMeta.interactiveElements,
  touchPhaseInteractiveCount: touchMeta.interactiveElements,
};

export default UnitCircleWing;
