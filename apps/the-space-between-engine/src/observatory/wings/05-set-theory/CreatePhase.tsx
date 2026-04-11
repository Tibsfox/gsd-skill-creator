/**
 * Wing 5: Set Theory — Create Phase
 * "Being"
 *
 * "Define Your Boundary" — learner creates a set definition
 * for something they care about.
 */

import React, { useState, useCallback } from 'react';
import type { FoundationPhase } from '../../../types/index.js';
import { generateId, nowISO } from '../../../types/index.js';

export interface CreatePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
  onSaveCreation?: (creation: {
    foundationId: 'set-theory';
    type: 'journal';
    title: string;
    data: string;
    shared: boolean;
  }) => void;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ phase, onComplete, onSaveCreation }) => {
  const [setName, setSetName] = useState('');
  const [membershipRule, setMembershipRule] = useState('');
  const [examples, setExamples] = useState<string[]>(['', '', '']);
  const [counterExamples, setCounterExamples] = useState<string[]>(['', '']);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  const updateExample = useCallback((index: number, value: string) => {
    setExamples(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const updateCounterExample = useCallback((index: number, value: string) => {
    setCounterExamples(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const canSave = setName.trim().length > 0
    && membershipRule.trim().length > 0
    && examples.filter(e => e.trim().length > 0).length >= 2;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const creationData = JSON.stringify({
      setName: setName.trim(),
      membershipRule: membershipRule.trim(),
      examples: examples.filter(e => e.trim()),
      counterExamples: counterExamples.filter(e => e.trim()),
      reflection: reflection.trim(),
      notation: `${setName.trim()} = { x | ${membershipRule.trim()} }`,
      createdAt: nowISO(),
    });

    onSaveCreation?.({
      foundationId: 'set-theory',
      type: 'journal',
      title: `My Set: ${setName.trim()}`,
      data: creationData,
      shared: false,
    });

    setSaved(true);
  }, [canSave, setName, membershipRule, examples, counterExamples, reflection, onSaveCreation]);

  return (
    <div className="wing-phase create-phase set-theory-create">
      <h2>{phase.title}</h2>

      <div className="create-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="create-workspace">
        <div className="creation-form">
          <h3>Define Your Boundary</h3>
          <p>
            Choose something you care about and define it as a set. What belongs?
            What does not? Where is the boundary?
          </p>

          <div className="form-field">
            <label htmlFor="set-name">Name your set:</label>
            <input
              id="set-name"
              type="text"
              value={setName}
              onChange={e => setSetName(e.target.value)}
              placeholder="e.g., Things That Make a House a Home"
            />
          </div>

          <div className="form-field">
            <label htmlFor="membership-rule">Membership rule (what decides belonging?):</label>
            <textarea
              id="membership-rule"
              value={membershipRule}
              onChange={e => setMembershipRule(e.target.value)}
              placeholder="e.g., x belongs if removing x would make the space feel less like yours"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label>Members (things that belong):</label>
            {examples.map((ex, i) => (
              <input
                key={`member-${i}`}
                type="text"
                value={ex}
                onChange={e => updateExample(i, e.target.value)}
                placeholder={
                  i === 0 ? 'e.g., the worn spot on the couch'
                  : i === 1 ? 'e.g., the smell of morning coffee'
                  : 'e.g., the sound of the front door'
                }
              />
            ))}
          </div>

          <div className="form-field">
            <label>Non-members (things that do not belong):</label>
            {counterExamples.map((ex, i) => (
              <input
                key={`counter-${i}`}
                type="text"
                value={ex}
                onChange={e => updateCounterExample(i, e.target.value)}
                placeholder={
                  i === 0 ? 'e.g., a hotel room'
                  : 'e.g., a furniture showroom'
                }
              />
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="reflection">Reflection — what did defining this boundary reveal?</label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="What did you learn about the thing you defined by drawing its boundary?"
              rows={4}
            />
          </div>
        </div>

        {canSave && (
          <div className="creation-preview">
            <h3>Your Set Definition</h3>
            <div className="set-notation-preview">
              <code>{setName} = {'{'} x | {membershipRule} {'}'}</code>
            </div>
            <div className="members-preview">
              <strong>Members:</strong> {examples.filter(e => e.trim()).join(', ')}
            </div>
            {counterExamples.filter(e => e.trim()).length > 0 && (
              <div className="non-members-preview">
                <strong>Non-members:</strong> {counterExamples.filter(e => e.trim()).join(', ')}
              </div>
            )}
          </div>
        )}

        {phase.content.mathNotation && (
          <div className="formal-reference">
            <h4>Formal Reference</h4>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </div>
        )}
      </div>

      <div className="create-actions">
        {!saved ? (
          <button
            className="save-creation"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save My Set Definition
          </button>
        ) : (
          <div className="save-confirmation">
            <p>Your boundary has been drawn. Your set exists.</p>
            <button className="phase-continue" onClick={onComplete}>
              Continue to the next wing...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePhase;
