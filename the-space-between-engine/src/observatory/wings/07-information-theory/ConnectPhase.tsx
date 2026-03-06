// Wing 7 — Connect Phase: "Channels Everywhere"
// Cross-foundation links. Must produce a MOMENT OF RECOGNITION.
// Must reference BOTH Birdsong and Compass Fox.
// Birdsong: the thrush's song is a message encoded over a noisy channel.
// Compass Fox: its nervous system IS an information channel.
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
    id: 'it-tr-birdsong',
    target: 'trigonometry',
    title: 'Birdsong: The Channel in the Trees',
    type: 'isomorphism',
    body: 'In Wing 3, the thrush sang in waves — its song decomposed into sine components, each frequency carrying part of the melody. Now you see the same song from the other side: the thrush is an encoder. It chooses frequencies that travel well through foliage. It repeats its phrase — that repetition is error correction. The forest is a noisy channel, and the bird is an information theorist. The same thrush. Two wings. One truth: Fourier analysis and Shannon\'s theorem are the same mathematics applied to the same birdsong.',
    revelation: 'The thrush does not know trigonometry or information theory. But its song obeys both — because they are the same law. The wave IS the channel. The frequency IS the encoding. You already understood this in Wing 3. Now you know its name.',
  },
  {
    id: 'it-vc-fox',
    target: 'vector-calculus',
    title: 'The Compass Fox as Receiver',
    type: 'analogy',
    body: 'In Wing 4, the fox aligned its body to the Earth\'s magnetic field — a vector field it could sense but not see. Now consider: the fox\'s nervous system is a channel. The magnetic field is the signal. Neural noise is the noise. The fox\'s magnetite crystals are the antenna, and the neural pathway from nose to brain is the decoder. The fox is not just navigating a field. It is receiving a message from the Earth and decoding it into a pounce direction.',
    revelation: 'The same fox. Wing 4 saw it as a navigator in a vector field. Wing 5 saw it as a persistent pattern — a boundary condition. Now Wing 7 sees it as a receiver in an information channel. Three wings, one fox. This is a unit-circle moment: separate views of one creature, each true, each incomplete alone.',
  },
  {
    id: 'it-st',
    target: 'set-theory',
    title: 'Entropy Is a Measure on Sets',
    type: 'isomorphism',
    body: 'Entropy sums over a set of possible outcomes. Without set theory defining what the possible outcomes ARE, entropy cannot be computed. The probability distribution is a function from a set to the real numbers. The event space is a set. Every information-theoretic quantity lives on the foundation you built in Wing 5.',
    revelation: 'When you sorted elements into sets, you were building event spaces. The boundaries you drew are the boundaries of probability distributions. Set theory does not just support information theory — it IS the stage on which information theory performs.',
  },
  {
    id: 'it-ct',
    target: 'category-theory',
    title: 'Channels Are Morphisms',
    type: 'analogy',
    body: 'An information channel transforms input distributions into output distributions. This transformation is a morphism in a category of probability spaces. Composing two channels (sending a signal through one, then another) is morphism composition. The functor you built in Wing 6 — a structure-preserving map — is exactly what a good encoding does: it preserves the message structure through the channel.',
    revelation: 'The faithful translation you built in Wing 6 was encoding. The structure preservation check was error detection. Category theory and information theory are two views of the same thing: structure that survives a crossing.',
  },
];

const SKILL_CREATOR_REVELATION = {
  title: 'The Token Window IS a Channel',
  body: 'In the skill-creator, Claude has a context window — a finite number of tokens it can process. This is a channel with fixed capacity. Prompts must be compressed (source coding) to fit. Context management is bandwidth allocation. The DSP error correction hooks (checkpoint assertions, quick-scan) are literally error correction codes. The entire skill-creator pipeline is Shannon\'s sender-channel-receiver architecture.',
  moment: 'When you felt the cliff — the noise level where the message died — you felt what happens when a prompt exceeds the context window. The skill-creator\'s token budget IS a channel capacity. Shannon\'s theorem governs it.',
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
      <h2 className="connect__title">Channels Everywhere</h2>
      <p className="connect__intro">
        Every communication — biological, electronic, mathematical — is constrained
        by the same laws. The bird, the fox, the wire, the gene — all channels.
        All governed by Shannon.
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
                    Visit {conn.target === 'trigonometry' ? 'Trigonometry' :
                           conn.target === 'vector-calculus' ? 'Vector Calculus' :
                           conn.target === 'set-theory' ? 'Set Theory' :
                           'Category Theory'}
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
