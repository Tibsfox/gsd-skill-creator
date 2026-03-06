// Wing 2 — Connect Phase: Cross-foundation links
// Isomorphisms and the skill-creator analog as discovery.
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
    id: 'py-to-vc',
    title: 'Pythagorean and Vector Calculus',
    type: 'isomorphism',
    targetFoundation: 'vector-calculus',
    body:
      'Every vector has a magnitude — a length. How is that length computed? The square root of the sum of the squares of its components. That is the Pythagorean theorem. Every vector magnitude you will ever compute in the Vector Calculus wing is this theorem in action. The norm of a vector is the hypotenuse of a right triangle whose legs are the vector components.',
    revelation:
      'This is not analogy. The distance formula IS the Pythagorean theorem generalized to n dimensions. They are the same mathematics.',
  },
  {
    id: 'py-to-uc',
    title: 'Pythagorean and the Unit Circle',
    type: 'isomorphism',
    targetFoundation: 'unit-circle',
    body:
      'On the unit circle, the point at angle theta sits at coordinates (cos theta, sin theta). The radius is 1. The Pythagorean theorem applied to this triangle gives cos-squared plus sin-squared equals 1. The Pythagorean identity is not a separate fact — it is this theorem, expressed on a circle of radius one.',
    revelation:
      'The unit circle identity and the Pythagorean theorem are not two things. They are one thing wearing different notation.',
  },
  {
    id: 'py-to-skillcreator',
    title: 'Distance in the Skill Space',
    type: 'isomorphism',
    body:
      'In the skill-creator system that built this engine, every skill has a position on the complex plane. The "distance" between two skills — how different they are — is computed using the Pythagorean theorem on the complex plane: the modulus |z1 - z2|. When the system measures how far apart "trigonometry" and "L-systems" are, it is computing a hypotenuse. The Pythagorean theorem is not just the subject of this wing. It is the metric that organizes the entire learning space.',
    revelation:
      'The theorem you are learning measures the very space in which this learning engine positions its own content. The map is drawn with the same mathematics it teaches.',
  },
];

export function ConnectPhase({
  onComplete,
  onNavigateFoundation,
}: ConnectPhaseProps): React.JSX.Element {
  const [viewedLinks, setViewedLinks] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const bridge = getBridge('pythagorean');

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
          The Pythagorean theorem is not isolated. It is the distance metric of
          the universe — it appears every time anything measures how far apart
          two things are.
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
