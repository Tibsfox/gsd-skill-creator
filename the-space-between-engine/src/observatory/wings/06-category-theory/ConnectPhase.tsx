// Wing 6 — Connect Phase: "The Same Pattern Everywhere"
// Cross-foundation links. Must produce a MOMENT OF RECOGNITION.
// Isomorphisms vs analogies. Skill-creator analog as discovery/revelation.
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
    id: 'ct-st',
    target: 'set-theory',
    title: 'Sets and Functions Form a Category',
    type: 'isomorphism',
    body: 'Take every set you explored in Wing 5. Now consider every function between them. Sets become objects. Functions become morphisms. Composition is function composition. This is not an analogy — this is literally a category, called Set. Category theory was born by looking at sets and functions and asking: what else has this same shape?',
    revelation: 'Set theory is not just a foundation for mathematics. It is the first example of a category. The boundaries you drew in Wing 5 were objects. The sorting you did was morphisms. You were doing category theory the whole time.',
  },
  {
    id: 'ct-it',
    target: 'information-theory',
    title: 'Channels Are Morphisms',
    type: 'analogy',
    body: 'An information channel takes input symbols and produces output symbols. The channel IS a morphism — a transformation from one type of information to another. Composing two channels (sending a message through one, then through another) is morphism composition. Channel capacity is a constraint on which morphisms exist.',
    revelation: 'When you build a communication channel in Wing 7, you will be building a morphism in a category of information types. The functor you built here — the faithful translation — is the same structure that governs whether a message arrives intact.',
  },
  {
    id: 'ct-uc',
    target: 'unit-circle',
    title: 'The Circle of Fifths Is a Category',
    type: 'analogy',
    body: 'Musical keys form a category: each key is an object, and transposition (moving up by an interval) is a morphism. The circle of fifths is a loop of morphisms that composes back to the identity. The unit circle from Wing 1 and the circle of fifths are the same categorical structure — a cyclic group acting on itself.',
    revelation: 'The unit circle and the circle of fifths are both examples of the same category. When you traced the unit circle, you were traversing the same structure that musicians use to navigate key signatures. Category theory reveals they are literally identical in structure.',
  },
  {
    id: 'ct-ls',
    target: 'l-systems',
    title: 'Grammars Are Endofunctors',
    type: 'analogy',
    body: 'An L-System production rule takes a string and produces a longer string. The same rule, applied again, produces an even longer string. This is an endofunctor — a functor from a category to itself. Each iteration is composition of the functor with itself. Growth IS iterated functorial mapping.',
    revelation: 'When you grow a plant in Wing 8, each iteration of the rule is a functor applied again. The tree does not know about functors, but the structure of its growth is functorial. Category theory and L-Systems are the same mathematics in different clothing.',
  },
];

const SKILL_CREATOR_REVELATION = {
  title: 'The Rosetta Core IS a Functor',
  body: 'In the skill-creator, the Rosetta Core maps concepts between domains while preserving their relationships. A design pattern in software maps to a pattern in electronics maps to a pattern in mathematics. These mappings preserve structure — if pattern A leads to pattern B in software, the corresponding concepts in electronics have the same relationship.',
  moment: 'The Rosetta Core is not like a functor. It IS a functor. Every cross-domain mapping in the skill-creator is a structure-preserving map between categories of knowledge. You built this exact thing when you dragged arrows from Cooking to Chemistry.',
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
      <h2 className="connect__title">The Same Pattern Everywhere</h2>
      <p className="connect__intro">
        Category theory is the mathematics of pattern recognition across domains.
        Every foundation you have visited is a category. Every connection between
        foundations is a functor. The observatory itself is a category of categories.
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
                    Visit {conn.target === 'set-theory' ? 'Set Theory' :
                           conn.target === 'information-theory' ? 'Information Theory' :
                           conn.target === 'unit-circle' ? 'Unit Circle' :
                           'L-Systems'}
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
