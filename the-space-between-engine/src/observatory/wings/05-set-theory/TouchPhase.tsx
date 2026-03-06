/**
 * Wing 5: Set Theory — Touch Phase
 * "Being"
 *
 * Define membership functions. Venn operations. Interactive exploration.
 * At least 2 interactive elements.
 */

import React, { useState, useCallback } from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface TouchPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

// ─── Element types for the interactive set builder ──────

interface SetElement {
  id: string;
  label: string;
  value: number;
}

type SetOperation = 'union' | 'intersection' | 'difference' | 'complement';

const UNIVERSE_ELEMENTS: SetElement[] = [
  { id: 'e1', label: 'apple', value: 1 },
  { id: 'e2', label: 'river', value: 2 },
  { id: 'e3', label: 'seven', value: 7 },
  { id: 'e4', label: 'blue', value: 4 },
  { id: 'e5', label: 'fox', value: 5 },
  { id: 'e6', label: 'song', value: 6 },
  { id: 'e7', label: 'three', value: 3 },
  { id: 'e8', label: 'stone', value: 8 },
  { id: 'e9', label: 'dream', value: 9 },
  { id: 'e10', label: 'oak', value: 10 },
  { id: 'e11', label: 'twelve', value: 12 },
  { id: 'e12', label: 'wind', value: 11 },
];

export const TouchPhase: React.FC<TouchPhaseProps> = ({ phase, onComplete }) => {
  // ─── Interactive Element 1: Membership function builder ──
  const [membershipRule, setMembershipRule] = useState<'numeric' | 'nature' | 'short'>('numeric');
  const [threshold, setThreshold] = useState(5);

  // ─── Interactive Element 2: Venn operation selector ──────
  const [operation, setOperation] = useState<SetOperation>('union');

  // ─── Derived sets ────────────────────────────────────────
  const membershipFn = useCallback((el: SetElement): boolean => {
    switch (membershipRule) {
      case 'numeric': return el.value <= threshold;
      case 'nature': return ['river', 'fox', 'oak', 'wind', 'stone'].includes(el.label);
      case 'short': return el.label.length <= 4;
    }
  }, [membershipRule, threshold]);

  const setA = UNIVERSE_ELEMENTS.filter(membershipFn);
  const setB = UNIVERSE_ELEMENTS.filter(el => el.value % 2 === 1); // odd values

  const computeResult = useCallback((): SetElement[] => {
    const aIds = new Set(setA.map(e => e.id));
    const bIds = new Set(setB.map(e => e.id));

    switch (operation) {
      case 'union':
        return UNIVERSE_ELEMENTS.filter(e => aIds.has(e.id) || bIds.has(e.id));
      case 'intersection':
        return UNIVERSE_ELEMENTS.filter(e => aIds.has(e.id) && bIds.has(e.id));
      case 'difference':
        return UNIVERSE_ELEMENTS.filter(e => aIds.has(e.id) && !bIds.has(e.id));
      case 'complement':
        return UNIVERSE_ELEMENTS.filter(e => !aIds.has(e.id));
    }
  }, [setA, setB, operation]);

  const result = computeResult();

  const [interactionCount, setInteractionCount] = useState(0);

  const handleInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
  }, []);

  return (
    <div className="wing-phase touch-phase set-theory-touch">
      <h2>{phase.title}</h2>

      <div className="touch-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="touch-interactive-area">
        {/* ─── Interactive Element 1: Membership Rule Builder ─── */}
        <div className="interactive-element membership-builder" data-interactive="membership-rule">
          <h3>Define Your Membership Rule</h3>
          <p>What decides whether something belongs?</p>

          <div className="rule-selector">
            <label>
              <input
                type="radio"
                name="membership"
                value="numeric"
                checked={membershipRule === 'numeric'}
                onChange={() => { setMembershipRule('numeric'); handleInteraction(); }}
              />
              Values up to a threshold
            </label>
            <label>
              <input
                type="radio"
                name="membership"
                value="nature"
                checked={membershipRule === 'nature'}
                onChange={() => { setMembershipRule('nature'); handleInteraction(); }}
              />
              Things found in nature
            </label>
            <label>
              <input
                type="radio"
                name="membership"
                value="short"
                checked={membershipRule === 'short'}
                onChange={() => { setMembershipRule('short'); handleInteraction(); }}
              />
              Short names (4 letters or fewer)
            </label>
          </div>

          {membershipRule === 'numeric' && (
            <div className="threshold-slider">
              <label>
                Threshold: {threshold}
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={threshold}
                  onChange={e => { setThreshold(Number(e.target.value)); handleInteraction(); }}
                />
              </label>
            </div>
          )}

          <div className="set-display">
            <h4>Set A (your rule):</h4>
            <div className="element-chips">
              {setA.length === 0
                ? <span className="empty-set">empty set</span>
                : setA.map(el => (
                    <span key={el.id} className="chip in-set">{el.label}</span>
                  ))
              }
            </div>
          </div>

          <div className="set-display">
            <h4>Set B (odd values):</h4>
            <div className="element-chips">
              {setB.map(el => (
                <span key={el.id} className="chip in-set-b">{el.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Interactive Element 2: Venn Operation Selector ─── */}
        <div className="interactive-element venn-operations" data-interactive="venn-ops">
          <h3>Combine the Sets</h3>
          <p>Choose an operation and watch which elements survive.</p>

          <div className="operation-buttons">
            {(['union', 'intersection', 'difference', 'complement'] as SetOperation[]).map(op => (
              <button
                key={op}
                className={`op-button ${operation === op ? 'active' : ''}`}
                onClick={() => { setOperation(op); handleInteraction(); }}
              >
                {op === 'union' && 'A or B (Union)'}
                {op === 'intersection' && 'A and B (Intersection)'}
                {op === 'difference' && 'A but not B (Difference)'}
                {op === 'complement' && 'Not A (Complement)'}
              </button>
            ))}
          </div>

          <div className="result-display">
            <h4>Result:</h4>
            <div className="element-chips">
              {result.length === 0
                ? <span className="empty-set">empty set</span>
                : result.map(el => (
                    <span key={el.id} className="chip in-result">{el.label}</span>
                  ))
              }
            </div>
            <p className="result-count">{result.length} of {UNIVERSE_ELEMENTS.length} elements</p>
          </div>
        </div>

        {/* ─── Interactive Element 3: Element Toggler ─── */}
        <div className="interactive-element universe-view" data-interactive="element-toggle">
          <h3>The Universe</h3>
          <p>Every element, showing where it belongs.</p>
          <div className="universe-grid">
            {UNIVERSE_ELEMENTS.map(el => {
              const inA = setA.some(a => a.id === el.id);
              const inB = setB.some(b => b.id === el.id);
              const inResult = result.some(r => r.id === el.id);
              return (
                <div
                  key={el.id}
                  className={[
                    'universe-element',
                    inA ? 'in-a' : '',
                    inB ? 'in-b' : '',
                    inResult ? 'in-result' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="element-label">{el.label}</span>
                  <span className="element-membership">
                    {inA && inB ? 'A, B' : inA ? 'A' : inB ? 'B' : '--'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="touch-content">
        <p>{phase.content.text}</p>
      </div>

      <div className="interaction-progress">
        <p>Interactions: {interactionCount}</p>
      </div>

      <button
        className="phase-continue"
        onClick={onComplete}
        disabled={interactionCount < 3}
      >
        I understand belonging...
      </button>
    </div>
  );
};

export default TouchPhase;
