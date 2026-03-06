// Wing 5: Set Theory — "Being"
// Container component managing 6-phase progression: wonder -> see -> touch -> understand -> connect -> create
// HIGHEST EMOTIONAL LOAD — existential center of the observatory.
// The compass fox resurfaces here as a persistent pattern — a boundary condition.

import React, { useState, useCallback, useMemo } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';
import { PHASE_ORDER } from '@/types/index';
import { WonderPhase } from './WonderPhase';
import { SeePhase } from './SeePhase';
import { TouchPhase } from './TouchPhase';
import { UnderstandPhase } from './UnderstandPhase';
import { ConnectPhase } from './ConnectPhase';
import { CreatePhase } from './CreatePhase';

interface WingProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onPhaseComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

const PHASE_LABELS: Record<PhaseType, string> = {
  wonder: 'Wonder',
  see: 'See',
  touch: 'Touch',
  understand: 'Understand',
  connect: 'Connect',
  create: 'Create',
};

export default function SetTheoryWing({
  foundationId,
  learnerState,
  onPhaseComplete,
  onCreationSave,
  onNavigateFoundation,
}: WingProps): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<PhaseType>(
    learnerState.currentPhase
  );

  const completedPhases = useMemo(
    () => learnerState.completedPhases[foundationId] ?? [],
    [learnerState.completedPhases, foundationId]
  );

  const handlePhaseComplete = useCallback(
    (phase: PhaseType) => {
      onPhaseComplete(phase);
      const currentIndex = PHASE_ORDER.indexOf(phase);
      if (currentIndex < PHASE_ORDER.length - 1) {
        const nextPhase = PHASE_ORDER[currentIndex + 1];
        if (nextPhase) {
          setActivePhase(nextPhase);
        }
      }
    },
    [onPhaseComplete]
  );

  const handleNavigatePhase = useCallback((phase: PhaseType) => {
    setActivePhase(phase);
  }, []);

  const phaseProps = {
    foundationId,
    learnerState,
    onComplete: handlePhaseComplete,
    onNavigateFoundation,
  };

  return (
    <div className="wing wing--set-theory" data-foundation="set-theory">
      <header className="wing__header">
        <h1 className="wing__title">Set Theory</h1>
        <p className="wing__subtitle">Being</p>
        <nav className="wing__phase-nav" aria-label="Learning phases">
          {PHASE_ORDER.map((phase) => {
            const isCompleted = completedPhases.includes(phase);
            const isActive = phase === activePhase;
            return (
              <button
                key={phase}
                className={[
                  'wing__phase-tab',
                  isActive ? 'wing__phase-tab--active' : '',
                  isCompleted ? 'wing__phase-tab--completed' : '',
                ].join(' ')}
                onClick={() => handleNavigatePhase(phase)}
                aria-current={isActive ? 'step' : undefined}
              >
                {PHASE_LABELS[phase]}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="wing__content">
        {activePhase === 'wonder' && <WonderPhase {...phaseProps} />}
        {activePhase === 'see' && <SeePhase {...phaseProps} />}
        {activePhase === 'touch' && <TouchPhase {...phaseProps} />}
        {activePhase === 'understand' && <UnderstandPhase {...phaseProps} />}
        {activePhase === 'connect' && (
          <ConnectPhase {...phaseProps} />
        )}
        {activePhase === 'create' && (
          <CreatePhase
            {...phaseProps}
            onCreationSave={onCreationSave}
          />
        )}
      </main>
    </div>
  );
}
