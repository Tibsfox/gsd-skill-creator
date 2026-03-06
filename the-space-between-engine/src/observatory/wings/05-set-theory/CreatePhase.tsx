// Wing 5 — Create Phase: "The Sentence About Yourself"
// The learner writes one sentence about what they are.
// System asks: "Is that sentence in the set of true sentences about you?"
// The creation IS the paradox (Russell's paradox).
// Not a boundary definition — the discovery that some boundaries can't be drawn.
// Must produce a saveable Creation object.
// Completion: produce any creation OR skip with acknowledgment.

import React, { useState, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

type ParadoxStage = 'write' | 'question' | 'paradox' | 'reflection';

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [sentence, setSentence] = useState('');
  const [stage, setStage] = useState<ParadoxStage>('write');
  const [answer, setAnswer] = useState<'yes' | 'no' | 'unsure' | null>(null);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleSubmitSentence = useCallback(() => {
    if (sentence.trim().length > 0) {
      setStage('question');
    }
  }, [sentence]);

  const handleAnswer = useCallback((a: 'yes' | 'no' | 'unsure') => {
    setAnswer(a);
    setStage('paradox');
  }, []);

  const handleReflectionSubmit = useCallback(() => {
    setStage('reflection');
  }, []);

  const handleSave = useCallback(() => {
    const creation: Creation = {
      id: `set-theory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      foundationId: 'set-theory',
      type: 'journal',
      title: 'The Sentence About Yourself',
      data: JSON.stringify({
        sentence,
        answer,
        reflection,
        paradoxEncountered: true,
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setCompleted(true);
  }, [sentence, answer, reflection, onCreationSave]);

  const handleSkip = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <h2 className="create__title">The Sentence About Yourself</h2>

      {stage === 'write' && (
        <div className="create__stage create__stage--write">
          <p className="create__prompt">
            Write one sentence about what you are. Not what you do, not what you
            have — what you <em>are</em>. Take your time.
          </p>
          <textarea
            className="create__textarea"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="I am..."
            rows={4}
            aria-label="Write one sentence about what you are"
          />
          <button
            className="create__submit-btn"
            onClick={handleSubmitSentence}
            disabled={sentence.trim().length === 0}
          >
            This is my sentence
          </button>
        </div>
      )}

      {stage === 'question' && (
        <div className="create__stage create__stage--question">
          <div className="create__sentence-display">
            <p className="create__your-sentence">&ldquo;{sentence}&rdquo;</p>
          </div>
          <p className="create__prompt">
            Now consider: is that sentence in the set of true sentences about you?
          </p>
          <div className="create__answer-buttons">
            <button
              className="create__answer-btn"
              onClick={() => handleAnswer('yes')}
            >
              Yes, it is true
            </button>
            <button
              className="create__answer-btn"
              onClick={() => handleAnswer('no')}
            >
              No, it is not quite true
            </button>
            <button
              className="create__answer-btn"
              onClick={() => handleAnswer('unsure')}
            >
              I am not sure
            </button>
          </div>
        </div>
      )}

      {stage === 'paradox' && (
        <div className="create__stage create__stage--paradox">
          <div className="create__sentence-display">
            <p className="create__your-sentence">&ldquo;{sentence}&rdquo;</p>
          </div>

          {answer === 'yes' && (
            <div className="create__paradox-text">
              <p>
                You said it is true. But can a sentence fully capture what you are?
                If you are the kind of person who changes — and you are, because
                everyone is — then the sentence was true when you wrote it, but the
                you who reads it in a year may not recognize it.
              </p>
              <p>
                Is the sentence still in the set of true sentences about you if
                you have changed? The set of true sentences about you is shifting
                under your feet. The boundary will not hold still.
              </p>
            </div>
          )}

          {answer === 'no' && (
            <div className="create__paradox-text">
              <p>
                You said it is not quite true. Which means you know something about
                yourself that the sentence cannot capture. There is a gap between
                the sentence and the thing it describes.
              </p>
              <p>
                Can any sentence about yourself be fully true? If you are the one
                judging its truth, and you are also the subject, then the judge and
                the judged are the same — a loop that cannot close cleanly.
              </p>
            </div>
          )}

          {answer === 'unsure' && (
            <div className="create__paradox-text">
              <p>
                You are not sure. That uncertainty is not a failure — it is the
                most honest answer. It means you have encountered a genuine boundary
                problem.
              </p>
              <p>
                The sentence tries to describe the thing that is doing the describing.
                The set of true sentences about you would have to contain sentences
                about the set itself. This is where set theory found its deepest
                paradox.
              </p>
            </div>
          )}

          <div className="create__russell">
            <h3>The Paradox You Just Found</h3>
            <p>
              Bertrand Russell discovered that the &ldquo;set of all sets that do not contain
              themselves&rdquo; cannot exist without contradiction. Does it contain itself?
              If yes, then by its own rule it should not. If no, then by its own rule
              it should.
            </p>
            <p>
              Your sentence about yourself is a small, personal version of this
              paradox. The describer is the described. The boundary of &ldquo;you&rdquo; includes
              the one drawing the boundary. Some boundaries cannot be drawn — not
              because they are unclear, but because drawing them changes them.
            </p>
          </div>

          <div className="create__reflection-prompt">
            <p>If you want, write a short reflection on what this feels like:</p>
            <textarea
              className="create__textarea"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What does it feel like to discover a boundary that can't be drawn?"
              rows={3}
              aria-label="Optional reflection"
            />
            <button
              className="create__submit-btn"
              onClick={handleReflectionSubmit}
            >
              Save this
            </button>
          </div>
        </div>
      )}

      {stage === 'reflection' && !completed && (
        <div className="create__stage create__stage--save">
          <p className="create__save-prompt">
            Your creation: a sentence, a question, and a paradox. The discovery that
            some boundaries resist being drawn.
          </p>
          <div className="create__save-buttons">
            <button className="create__save-btn" onClick={handleSave}>
              Save to journal
            </button>
            <button className="create__skip-btn" onClick={handleSkip}>
              Continue without saving
            </button>
          </div>
        </div>
      )}

      {completed && (
        <div className="create__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
