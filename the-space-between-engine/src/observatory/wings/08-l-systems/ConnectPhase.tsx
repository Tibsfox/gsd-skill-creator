// Wing 8 — Connect Phase: "Growth Loops Back"
// Cross-foundation links. Must produce a MOMENT OF RECOGNITION.
// MUST reference Birdsong's triple arc: the same thrush taught
// trigonometry (wave), information theory (channel), and now growth (recursive grammar).
// If the learner notices, this is the deepest unit-circle moment.
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
    id: 'ls-uc',
    target: 'unit-circle',
    title: 'The Loop Closes: Growth Returns to the Circle',
    type: 'analogy',
    body: 'Every branching angle in an L-System is an angle on the unit circle. The turtle\'s heading is a point on the unit circle, rotating with each + or - command. You started this journey tracing a point around a circle. You end it watching a plant trace the same circle with every branch it grows. The seed and the circle are the same shape — small, complete, generative.',
    revelation: 'The journey is a circle. You began with the unit circle and arrived at the seed. Both are small. Both are complete. Both produce more than they contain. The L-System\'s angle IS the unit circle. Growth IS rotation. The loop closes.',
  },
  {
    id: 'ls-birdsong',
    target: 'trigonometry',
    title: 'Birdsong: The Triple Arc Completes',
    type: 'analogy',
    body: 'The same thrush has appeared three times in this observatory. In Wing 3 (Trigonometry), its song was a wave — decomposable into sine components via Fourier analysis. In Wing 7 (Information Theory), its song was a message encoded over a noisy channel. Now, in Wing 8, its song reveals its final face: birdsong is a recursive grammar. Syllables are combined by L-system-like rules — repeat, vary, branch. The thrush iterates its song the way an L-System iterates its string.',
    revelation: 'One bird. Three wings. Three truths. The song is a wave (trigonometry). The song is a message (information theory). The song is a grammar (L-Systems). These are not three different things. They are three views of one phenomenon, just as sine and cosine are two views of one point on the unit circle. If you see this, you have found the deepest connection in the observatory.',
  },
  {
    id: 'ls-vc',
    target: 'vector-calculus',
    title: 'Plants Grow Along Vector Fields',
    type: 'analogy',
    body: 'A tree does not branch randomly. It grows toward light (phototropism) and against gravity (gravitropism). Light and gravity are vector fields. The tree\'s growth is an L-System whose parameters — branching angle, segment length, growth direction — are modulated by the local vector field. The fox navigated the field. The tree grows through it.',
    revelation: 'L-Systems produce the shape. Vector fields determine the direction. The tree is a grammar growing inside a field. The two foundations — vector calculus and L-Systems — are not separate. They are two aspects of the same growth process.',
  },
  {
    id: 'ls-st',
    target: 'set-theory',
    title: 'The Alphabet IS a Set',
    type: 'isomorphism',
    body: 'The alphabet V of an L-System is a set. The axiom is an element of V-star (the set of all strings over V). The production rules are functions from V to V-star. Every L-System is built on set theory. The boundaries you drew in Wing 5 define what symbols are available for growth.',
    revelation: 'Growth requires a vocabulary. The vocabulary is a set. Even the most generative process — one that produces complexity from simplicity — begins with a bounded set of possibilities. Creativity within constraint.',
  },
];

const SKILL_CREATOR_REVELATION = {
  title: 'Skills Grow Like L-Systems',
  body: 'In the skill-creator, a skill starts as a simple observation (the axiom). Through iterative refinement — observe, detect patterns, suggest improvements, apply changes, learn — the skill grows in complexity and capability. Each iteration applies a rule to the current state, producing something more elaborate. The promotion pipeline IS an L-System: observe becomes detect+suggest, suggest becomes apply+learn, and the cycle repeats.',
  moment: 'The fern you grew from one rule is the same process that grows a skill from one observation. The seed is the axiom. The iteration is the learning loop. The complexity that emerges was never in the seed — it was in the repetition. Growth is mathematics made biological, and the skill-creator makes it computational.',
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
      <h2 className="connect__title">Growth Loops Back</h2>
      <p className="connect__intro">
        L-Systems connect to everything. The angles are unit circle angles. The
        growth follows vector fields. The alphabet is a set. The grammar is a
        category-theoretic endofunctor. And the birdsong you have heard across three
        wings reveals its final face.
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
                           conn.target === 'trigonometry' ? 'Trigonometry' :
                           conn.target === 'vector-calculus' ? 'Vector Calculus' :
                           'Set Theory'}
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
