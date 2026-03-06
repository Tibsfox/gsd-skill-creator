// Wing 5 — Connect Phase: "Sets Are the Foundation"
// Cross-foundation links. Must produce a MOMENT OF RECOGNITION.
// Show isomorphisms vs analogies. Surface skill-creator analog as discovery.
// The compass fox: the fox IS a boundary condition — a persistent pattern.
// Completion: view >= 1 cross-foundation link.

import React, { useState, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface ConnectPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

interface ConnectionCard {
  id: string;
  target: FoundationId;
  title: string;
  type: 'isomorphism' | 'analogy';
  body: string;
  revelation: string;
}

const CONNECTIONS: ConnectionCard[] = [
  {
    id: 'st-uc',
    target: 'unit-circle',
    title: 'The Unit Circle IS a Set',
    type: 'isomorphism',
    body: 'The unit circle is the set of all points (x, y) where the square of x plus the square of y equals exactly one. Every point you dragged around the circle in Wing 1 was an element of this set. The circle is not a shape — it is a membership criterion. A boundary.',
    revelation: 'When you traced the circle, you were tracing a set boundary. Geometry and set theory are not separate subjects. They are the same subject wearing different clothes.',
  },
  {
    id: 'st-ct',
    target: 'category-theory',
    title: 'Sets Become Categories',
    type: 'isomorphism',
    body: 'Take every set you can imagine. Now consider every function between them. Sets are the objects. Functions are the arrows. Together they form a category — the category of sets, called Set. Category theory does not replace set theory. It generalizes it. Every set-theoretic construction has a categorical shadow.',
    revelation: 'The boundaries you drew are objects. The act of sorting — moving elements between sets — is a function, an arrow. You were building a category without knowing it.',
  },
  {
    id: 'st-it',
    target: 'information-theory',
    title: 'Entropy Lives on Sets',
    type: 'isomorphism',
    body: 'Information entropy measures surprise across a set of possible outcomes. Each outcome is an element of a probability set. The entropy formula sums over every element in that set. Without set theory defining "what are the possible outcomes," information theory cannot even state its most basic question.',
    revelation: 'The surprise you will feel in Wing 7 — when a rare message arrives — is defined by a probability measure on a set. Sets are the stage on which information performs.',
  },
  {
    id: 'st-fox',
    target: 'vector-calculus',
    title: 'The Compass Fox Is a Boundary Condition',
    type: 'analogy',
    body: 'Remember the fox from Wing 4? The fox navigates a magnetic field. But here is the deeper truth: the fox itself is a set. A persistent pattern of atoms, a boundary condition that maintains its identity even as the atoms flow through it. The fox does not have a boundary. The fox IS a boundary — between the field and the observer, between pattern and substrate.',
    revelation: 'You are the fox. Your identity is a boundary condition — a set membership rule that persists even as every atom in your body is replaced. "What makes you you" is a set theory question. The fox answered it by existing.',
  },
];

const SKILL_CREATOR_REVELATION = {
  title: 'Sets in the Skill-Creator',
  body: 'In the skill-creator, skills are organized by membership predicates. A skill belongs to the set of "auto-activating skills" if it matches certain criteria. File format filtering is literal set membership: this file is in the set of TypeScript files, that file is not. The Venn diagrams you built are the same diagrams that sort skills into overlapping categories.',
  moment: 'Every time the skill-creator asks "does this file match this pattern?" — it is asking a set membership question. The same question you answered when you dragged "breath" into the overlap.',
};

export function ConnectPhase({
  onComplete,
  onNavigateFoundation,
}: ConnectPhaseProps): React.JSX.Element {
  const [viewedConnections, setViewedConnections] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSkillCreator, setShowSkillCreator] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleExpandConnection = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setViewedConnections((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (!completed && next.size >= 1) {
        setCompleted(true);
      }
      return next;
    });
  }, [completed]);

  const handleContinue = useCallback(() => {
    onComplete('connect');
  }, [onComplete]);

  return (
    <div className="phase phase--connect">
      <h2 className="connect__title">Sets Are the Foundation</h2>
      <p className="connect__intro">
        Everything in mathematics is built on sets. Every foundation you have
        visited rests on this one. The boundaries you drew are not just exercises
        — they are the deepest structure in mathematics.
      </p>

      <div className="connect__cards">
        {CONNECTIONS.map((conn) => {
          const isExpanded = expandedId === conn.id;
          const isViewed = viewedConnections.has(conn.id);

          return (
            <div
              key={conn.id}
              className={[
                'connect__card',
                isExpanded ? 'connect__card--expanded' : '',
                isViewed ? 'connect__card--viewed' : '',
              ].join(' ')}
            >
              <button
                className="connect__card-header"
                onClick={() => handleExpandConnection(conn.id)}
                aria-expanded={isExpanded}
              >
                <span className="connect__card-type">
                  {conn.type === 'isomorphism' ? 'Same structure' : 'Deep analogy'}
                </span>
                <h3 className="connect__card-title">{conn.title}</h3>
              </button>

              {isExpanded && (
                <div className="connect__card-body">
                  <p>{conn.body}</p>
                  <blockquote className="connect__revelation">
                    {conn.revelation}
                  </blockquote>
                  <button
                    className="connect__navigate-btn"
                    onClick={() => onNavigateFoundation(conn.target)}
                  >
                    Visit {conn.target === 'unit-circle' ? 'Unit Circle' :
                           conn.target === 'category-theory' ? 'Category Theory' :
                           conn.target === 'information-theory' ? 'Information Theory' :
                           'Vector Calculus'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className={`connect__card connect__card--skill-creator ${showSkillCreator ? 'connect__card--expanded' : ''}`}>
          <button
            className="connect__card-header"
            onClick={() => {
              setShowSkillCreator(!showSkillCreator);
              handleExpandConnection('skill-creator');
            }}
            aria-expanded={showSkillCreator}
          >
            <span className="connect__card-type">Discovery</span>
            <h3 className="connect__card-title">{SKILL_CREATOR_REVELATION.title}</h3>
          </button>

          {showSkillCreator && (
            <div className="connect__card-body">
              <p>{SKILL_CREATOR_REVELATION.body}</p>
              <blockquote className="connect__revelation">
                {SKILL_CREATOR_REVELATION.moment}
              </blockquote>
            </div>
          )}
        </div>
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
