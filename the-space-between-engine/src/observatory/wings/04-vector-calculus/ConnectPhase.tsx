// Wing 4 — Connect Phase: Cross-foundation links
// Isomorphisms to pythagorean, trigonometry, and skill-creator.
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
    id: 'vc-to-py',
    title: 'Vector Magnitude IS the Pythagorean Theorem',
    type: 'isomorphism',
    targetFoundation: 'pythagorean',
    body:
      'Every time you compute the magnitude of a vector — the length of an arrow — you are applying the Pythagorean theorem. The magnitude of a vector (Fx, Fy) is sqrt(Fx^2 + Fy^2). The distance formula, the vector norm, and the Pythagorean theorem are the same computation. When the particles flow through the field, the speed at each point is the Pythagorean distance of the field components.',
    revelation:
      'Vector magnitude is not "related to" the Pythagorean theorem. It IS the Pythagorean theorem. Every norm computation in every vector field is a right triangle being measured.',
  },
  {
    id: 'vc-to-trig',
    title: 'Rotating Fields and Trigonometry',
    type: 'isomorphism',
    targetFoundation: 'trigonometry',
    body:
      'The vortex field — the one where everything swirls — is built from trigonometric functions. At every point, the field direction is perpendicular to the radius vector: F(x,y) = (-y, x)/r. Writing this in polar coordinates gives F = (0, 1) — constant angular velocity. The curl of the vortex field is constant, and curl IS the angular frequency of local rotation. Trigonometry does not just describe waves. It describes rotational fields.',
    revelation:
      'The vortex field IS a rotating unit circle at every point in space. Curl is the angular velocity of local rotation. Vector calculus and trigonometry meet in the concept of rotation.',
  },
  {
    id: 'vc-to-skillcreator',
    title: 'The Gradient of Learning',
    type: 'analogy',
    body:
      'In the skill-creator system, the connection graph between foundations has a "strength" at every edge — a measure of how strongly two foundations pull toward each other. This IS a gradient field. The learner moves through the space of foundations following the gradient of connection strength, guided toward the next most-connected concept. The ProgressionEngine\'s suggestNextFoundation() function computes a directional derivative: which direction in concept-space leads to the steepest increase in learning coherence? You are a particle in a field. The skill-creator is the field.',
    revelation:
      'The progression algorithm that guides you through this observatory is a vector field computation. You follow the gradient of mathematical connection strength. The field you are learning about is the field you are navigating.',
  },
];

export function ConnectPhase({
  onComplete,
  onNavigateFoundation,
}: ConnectPhaseProps): React.JSX.Element {
  const [viewedLinks, setViewedLinks] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const bridge = getBridge('vector-calculus');

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
          Vector calculus is the mathematics of invisible forces. It connects to
          every other foundation through the language of direction, magnitude,
          and flow.
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
