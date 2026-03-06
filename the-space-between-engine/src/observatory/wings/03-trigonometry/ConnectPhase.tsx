// Wing 3 — Connect Phase: Cross-foundation links
// Isomorphisms to unit circle, information theory, and skill-creator.
// Completion: view >= 1 link.

import React, { useState, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';
import { getBridge } from '@/narrative/index';
import { getFoundation } from '@/core/registry';

interface ConnectPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface ConnectionCard {
  id: string;
  title: string;
  type: 'isomorphism' | 'analogy';
  targetFoundation?: FoundationId;
  body: string;
  revelation: string;
}

const CONNECTIONS: ConnectionCard[] = [
  {
    id: 'tr-to-uc',
    title: 'Trigonometry IS the Unit Circle',
    type: 'isomorphism',
    targetFoundation: 'unit-circle',
    body:
      'This is not a connection between two separate things. Trigonometry IS the unit circle in motion. The sine function is the height of a point on the unit circle as the angle changes over time. The cosine function is its horizontal position. When you watched the wave unroll from the circle, you were watching trigonometry emerge from the unit circle. They are the same mathematics.',
    revelation:
      'There is no gap to bridge. Trigonometry and the unit circle are one object described in two ways: one static (all angles at once), one dynamic (angle changing over time).',
  },
  {
    id: 'tr-to-info',
    title: 'Waves Carry Information',
    type: 'isomorphism',
    targetFoundation: 'information-theory',
    body:
      'Fourier decomposition — breaking a signal into sine waves — is the foundation of signal processing. Every phone call, every digital audio file, every image compression algorithm uses this. The signals in a wire are sine waves. The information in a radio broadcast is encoded as changes in frequency and amplitude of sine waves. Trigonometry IS signal theory.',
    revelation:
      'Fourier analysis is not an application of trigonometry to information theory. It is the isomorphism between them. The sine wave is the atom of both oscillation and information.',
  },
  {
    id: 'tr-to-skillcreator',
    title: 'The Oscillation in the Machine',
    type: 'analogy',
    body:
      'In the skill-creator system, learning does not proceed in a straight line. It oscillates. You advance, then consolidate. You reach for abstraction, then ground it in practice. This oscillation has a frequency (how often you cycle between theory and practice), an amplitude (how far you reach in each direction), and a phase (where you are in the cycle right now). The learning cycle this engine uses — wonder, see, touch, understand, connect, create — is itself a wave: from sensory input to formal understanding and back to creative output.',
    revelation:
      'The 6-phase learning cycle is a sine wave of abstraction. You rise from wonder (concrete) to understand (abstract) and descend back to create (concrete again). The wave IS the pedagogy.',
  },
];

export function ConnectPhase({
  onComplete,
  onNavigateFoundation,
}: ConnectPhaseProps): React.JSX.Element {
  const [viewedLinks, setViewedLinks] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const bridge = getBridge('trigonometry');

  const handleExpandCard = useCallback(
    (cardId: string) => {
      setExpandedCard((prev) => (prev === cardId ? null : cardId));
      setViewedLinks((prev) => {
        const next = new Set(prev);
        next.add(cardId);
        if (!completed && next.size >= 1) {
          setCompleted(true);
        }
        return next;
      });
    },
    [completed]
  );

  const handleNavigate = useCallback(
    (id: FoundationId) => {
      onNavigateFoundation(id);
    },
    [onNavigateFoundation]
  );

  const handleContinue = useCallback(() => {
    onComplete('connect');
  }, [onComplete]);

  return (
    <div className="phase phase--connect">
      <div className="connect__intro">
        <h2>Connections</h2>
        <p>
          Trigonometry is not a branch of mathematics that happens to relate to
          circles and waves. It IS circles and waves. And it is the language
          of signals, sound, and oscillation everywhere.
        </p>
      </div>

      <div className="connect__literary-voice">
        <p className="connect__voice-label">
          Literary resonance: {bridge.connectionType}
        </p>
        <p className="connect__voice-description">{bridge.description}</p>
      </div>

      <div className="connect__cards">
        {CONNECTIONS.map((card) => (
          <div
            key={card.id}
            className={[
              'connect__card',
              expandedCard === card.id ? 'connect__card--expanded' : '',
              viewedLinks.has(card.id) ? 'connect__card--viewed' : '',
            ].join(' ')}
          >
            <button
              className="connect__card-header"
              onClick={() => handleExpandCard(card.id)}
              aria-expanded={expandedCard === card.id}
            >
              <span className="connect__card-type">
                {card.type === 'isomorphism' ? 'Same structure' : 'Similar pattern'}
              </span>
              <h3 className="connect__card-title">{card.title}</h3>
            </button>

            {expandedCard === card.id && (
              <div className="connect__card-body">
                <p>{card.body}</p>
                <div className="connect__revelation">
                  <p>{card.revelation}</p>
                </div>
                {card.targetFoundation && (
                  <button
                    className="connect__navigate-btn"
                    onClick={() => handleNavigate(card.targetFoundation!)}
                  >
                    Explore {getFoundation(card.targetFoundation).name}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {completed && (
        <div className="connect__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
