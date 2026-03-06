// Wing 1 — Connect Phase: Cross-foundation links
// Produces a moment of recognition. Shows isomorphisms (not just analogies).
// Surfaces the skill-creator analog as a discovery. Completion: view >= 1 link.

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
    id: 'uc-to-trig',
    title: 'Unit Circle and Trigonometry',
    type: 'isomorphism',
    targetFoundation: 'trigonometry',
    body:
      'The waves you watched in the See phase — the height rising and falling, the side position shifting back and forth — those are not illustrations of trigonometry. They ARE trigonometry. The sine wave is not a separate concept that happens to relate to the circle. It is the circle, unrolled over time. Trigonometry is the unit circle in motion.',
    revelation:
      'This is not a similarity. It is an identity. The unit circle and trigonometric functions are the same mathematical object described in two different ways — one spatial, one temporal.',
  },
  {
    id: 'uc-to-pythagorean',
    title: 'Unit Circle and the Pythagorean Theorem',
    type: 'isomorphism',
    targetFoundation: 'pythagorean',
    body:
      'You felt the Pythagorean identity already: the height squared plus the side position squared always equals 1. That is the Pythagorean theorem applied to a right triangle inside the unit circle. The hypotenuse is always 1 (the radius). The two legs are sine and cosine.',
    revelation:
      'The Pythagorean identity is not a coincidence or a separate fact to memorize. It is the Pythagorean theorem, happening at every angle on the circle, continuously.',
  },
  {
    id: 'uc-to-skillcreator',
    title: 'The Circle Inside the Machine',
    type: 'isomorphism',
    body:
      'In the skill-creator system that built this learning engine, every skill is positioned on a complex plane — which is built on the unit circle. Abstract skills (pure theory) sit at one angle. Concrete skills (running code, building things) sit at the opposite angle. The spectrum from abstract to concrete is not a line. It is a circle. The unit circle you just explored IS the coordinate system that organizes all of the skills that made this engine possible.',
    revelation:
      'The tool you are using to learn the unit circle was itself organized BY the unit circle. The mathematics is not just the subject — it is the structure of the classroom.',
  },
];

export function ConnectPhase({
  onComplete,
  onNavigateFoundation,
}: ConnectPhaseProps): React.JSX.Element {
  const [viewedLinks, setViewedLinks] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const bridge = getBridge('unit-circle');
  const foundation = getFoundation('unit-circle');

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
          The unit circle does not live alone. It connects to almost everything
          in this observatory — and to the system that built it.
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
