/**
 * Wing 6: Category Theory — Create Phase
 * "Arrows"
 *
 * "Build a Translator" — map between two personal domains.
 */

import React, { useState, useCallback } from 'react';
import type { FoundationPhase } from '../../../types/index.js';
import { nowISO } from '../../../types/index.js';

export interface CreatePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
  onSaveCreation?: (creation: {
    foundationId: 'category-theory';
    type: 'journal';
    title: string;
    data: string;
    shared: boolean;
  }) => void;
}

interface DomainItem {
  label: string;
}

interface ArrowMapping {
  sourceIndex: number;
  targetIndex: number;
  relationship: string;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ phase, onComplete, onSaveCreation }) => {
  const [sourceDomainName, setSourceDomainName] = useState('');
  const [targetDomainName, setTargetDomainName] = useState('');
  const [sourceItems, setSourceItems] = useState<DomainItem[]>([
    { label: '' }, { label: '' }, { label: '' },
  ]);
  const [targetItems, setTargetItems] = useState<DomainItem[]>([
    { label: '' }, { label: '' }, { label: '' },
  ]);
  const [arrows, setArrows] = useState<ArrowMapping[]>([
    { sourceIndex: 0, targetIndex: 0, relationship: '' },
    { sourceIndex: 1, targetIndex: 1, relationship: '' },
    { sourceIndex: 2, targetIndex: 2, relationship: '' },
  ]);
  const [insight, setInsight] = useState('');
  const [saved, setSaved] = useState(false);

  const updateSourceItem = useCallback((index: number, label: string) => {
    setSourceItems(prev => {
      const next = [...prev];
      next[index] = { label };
      return next;
    });
  }, []);

  const updateTargetItem = useCallback((index: number, label: string) => {
    setTargetItems(prev => {
      const next = [...prev];
      next[index] = { label };
      return next;
    });
  }, []);

  const updateArrow = useCallback((index: number, field: keyof ArrowMapping, value: string | number) => {
    setArrows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const canSave = sourceDomainName.trim().length > 0
    && targetDomainName.trim().length > 0
    && sourceItems.filter(i => i.label.trim()).length >= 2
    && targetItems.filter(i => i.label.trim()).length >= 2
    && arrows.filter(a => a.relationship.trim()).length >= 2;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const creationData = JSON.stringify({
      functor: {
        source: { name: sourceDomainName, objects: sourceItems.filter(i => i.label.trim()) },
        target: { name: targetDomainName, objects: targetItems.filter(i => i.label.trim()) },
        mappings: arrows
          .filter(a => a.relationship.trim())
          .map(a => ({
            from: sourceItems[a.sourceIndex]?.label || `item-${a.sourceIndex}`,
            to: targetItems[a.targetIndex]?.label || `item-${a.targetIndex}`,
            relationship: a.relationship,
          })),
      },
      insight: insight.trim(),
      createdAt: nowISO(),
    });

    onSaveCreation?.({
      foundationId: 'category-theory',
      type: 'journal',
      title: `My Functor: ${sourceDomainName} -> ${targetDomainName}`,
      data: creationData,
      shared: false,
    });

    setSaved(true);
  }, [canSave, sourceDomainName, targetDomainName, sourceItems, targetItems, arrows, insight, onSaveCreation]);

  return (
    <div className="wing-phase create-phase category-theory-create">
      <h2>{phase.title}</h2>

      <div className="create-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="create-workspace">
        <div className="creation-form">
          <h3>Build a Translator Between Two Worlds</h3>
          <p>
            Choose two domains you know well — cooking and chemistry, music and
            mathematics, gardening and parenting — and build a functor between them.
            Map concepts from one world to concepts in the other, preserving
            relationships.
          </p>

          <div className="domain-inputs">
            <div className="domain-column">
              <div className="form-field">
                <label htmlFor="source-domain">Source domain:</label>
                <input
                  id="source-domain"
                  type="text"
                  value={sourceDomainName}
                  onChange={e => setSourceDomainName(e.target.value)}
                  placeholder="e.g., Cooking"
                />
              </div>
              <div className="form-field">
                <label>Objects in {sourceDomainName || 'source'}:</label>
                {sourceItems.map((item, i) => (
                  <input
                    key={`src-${i}`}
                    type="text"
                    value={item.label}
                    onChange={e => updateSourceItem(i, e.target.value)}
                    placeholder={
                      i === 0 ? 'e.g., heat'
                      : i === 1 ? 'e.g., ingredient'
                      : 'e.g., recipe'
                    }
                  />
                ))}
              </div>
            </div>

            <div className="domain-column">
              <div className="form-field">
                <label htmlFor="target-domain">Target domain:</label>
                <input
                  id="target-domain"
                  type="text"
                  value={targetDomainName}
                  onChange={e => setTargetDomainName(e.target.value)}
                  placeholder="e.g., Chemistry"
                />
              </div>
              <div className="form-field">
                <label>Objects in {targetDomainName || 'target'}:</label>
                {targetItems.map((item, i) => (
                  <input
                    key={`tgt-${i}`}
                    type="text"
                    value={item.label}
                    onChange={e => updateTargetItem(i, e.target.value)}
                    placeholder={
                      i === 0 ? 'e.g., energy'
                      : i === 1 ? 'e.g., reagent'
                      : 'e.g., reaction pathway'
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="arrow-mappings">
            <h4>Arrows (How do the objects correspond?)</h4>
            {arrows.map((arrow, i) => (
              <div key={i} className="arrow-row">
                <select
                  value={arrow.sourceIndex}
                  onChange={e => updateArrow(i, 'sourceIndex', Number(e.target.value))}
                >
                  {sourceItems.map((item, si) => (
                    <option key={si} value={si}>{item.label || `Source ${si + 1}`}</option>
                  ))}
                </select>
                <span className="maps-to">{'|->'}</span>
                <select
                  value={arrow.targetIndex}
                  onChange={e => updateArrow(i, 'targetIndex', Number(e.target.value))}
                >
                  {targetItems.map((item, ti) => (
                    <option key={ti} value={ti}>{item.label || `Target ${ti + 1}`}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={arrow.relationship}
                  onChange={e => updateArrow(i, 'relationship', e.target.value)}
                  placeholder="Why does this mapping work?"
                  className="relationship-input"
                />
              </div>
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="functor-insight">
              What surprised you about this translation?
            </label>
            <textarea
              id="functor-insight"
              value={insight}
              onChange={e => setInsight(e.target.value)}
              placeholder="What structure was preserved that you did not expect?"
              rows={4}
            />
          </div>
        </div>

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
            Save My Translator
          </button>
        ) : (
          <div className="save-confirmation">
            <p>Your functor has been built. Two worlds are now connected.</p>
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
