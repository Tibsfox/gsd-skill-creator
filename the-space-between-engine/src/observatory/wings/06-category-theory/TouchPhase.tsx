/**
 * Wing 6: Category Theory — Touch Phase
 * "Arrows"
 *
 * Build functors between two categories. See structure preservation.
 * At least 2 interactive elements.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface TouchPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

// ─── Category types ─────────────────────────────────────

interface CategoryObject {
  id: string;
  label: string;
  color: string;
}

interface Morphism {
  from: string;
  to: string;
}

interface FunctorMapping {
  [sourceId: string]: string; // sourceId -> targetId
}

// ─── Preset categories ─────────────────────────────────

const CATEGORY_PRESETS = {
  shapes: {
    name: 'Shapes',
    objects: [
      { id: 'circle', label: 'Circle', color: '#4a90d9' },
      { id: 'triangle', label: 'Triangle', color: '#d94a4a' },
      { id: 'square', label: 'Square', color: '#4ad94a' },
    ],
    morphisms: [
      { from: 'circle', to: 'triangle' },
      { from: 'triangle', to: 'square' },
      { from: 'circle', to: 'square' },
    ],
  },
  colors: {
    name: 'Colors',
    objects: [
      { id: 'red', label: 'Red', color: '#e74c3c' },
      { id: 'green', label: 'Green', color: '#2ecc71' },
      { id: 'blue', label: 'Blue', color: '#3498db' },
    ],
    morphisms: [
      { from: 'red', to: 'green' },
      { from: 'green', to: 'blue' },
      { from: 'red', to: 'blue' },
    ],
  },
  notes: {
    name: 'Musical Notes',
    objects: [
      { id: 'do', label: 'Do', color: '#e67e22' },
      { id: 'mi', label: 'Mi', color: '#9b59b6' },
      { id: 'sol', label: 'Sol', color: '#1abc9c' },
    ],
    morphisms: [
      { from: 'do', to: 'mi' },
      { from: 'mi', to: 'sol' },
      { from: 'do', to: 'sol' },
    ],
  },
  sizes: {
    name: 'Sizes',
    objects: [
      { id: 'small', label: 'Small', color: '#bdc3c7' },
      { id: 'medium', label: 'Medium', color: '#95a5a6' },
      { id: 'large', label: 'Large', color: '#7f8c8d' },
    ],
    morphisms: [
      { from: 'small', to: 'medium' },
      { from: 'medium', to: 'large' },
      { from: 'small', to: 'large' },
    ],
  },
} as const;

type PresetKey = keyof typeof CATEGORY_PRESETS;

export const TouchPhase: React.FC<TouchPhaseProps> = ({ phase, onComplete }) => {
  // ─── Interactive Element 1: Category selector ─────────
  const [sourceCategory, setSourceCategory] = useState<PresetKey>('shapes');
  const [targetCategory, setTargetCategory] = useState<PresetKey>('colors');

  // ─── Interactive Element 2: Functor mapping builder ───
  const [mapping, setMapping] = useState<FunctorMapping>({});

  const [interactionCount, setInteractionCount] = useState(0);

  const source = CATEGORY_PRESETS[sourceCategory];
  const target = CATEGORY_PRESETS[targetCategory];

  const handleInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
  }, []);

  const handleMappingChange = useCallback((sourceId: string, targetId: string) => {
    setMapping(prev => ({ ...prev, [sourceId]: targetId }));
    handleInteraction();
  }, [handleInteraction]);

  const handleSourceChange = useCallback((key: PresetKey) => {
    setSourceCategory(key);
    setMapping({});
    handleInteraction();
  }, [handleInteraction]);

  const handleTargetChange = useCallback((key: PresetKey) => {
    setTargetCategory(key);
    setMapping({});
    handleInteraction();
  }, [handleInteraction]);

  // ─── Check if functor preserves structure ─────────────
  const isFunctorValid = useMemo(() => {
    // All source objects must be mapped
    const allMapped = source.objects.every(obj => mapping[obj.id] !== undefined);
    if (!allMapped) return null; // incomplete, not invalid

    // Check morphism preservation: for every morphism f: A -> B in source,
    // there must be a morphism F(f): F(A) -> F(B) in target
    const targetMorphismSet = new Set(
      target.morphisms.map(m => `${m.from}->${m.to}`)
    );

    const preserved = source.morphisms.every(m => {
      const mappedFrom = mapping[m.from];
      const mappedTo = mapping[m.to];
      if (!mappedFrom || !mappedTo) return false;
      return targetMorphismSet.has(`${mappedFrom}->${mappedTo}`);
    });

    return preserved;
  }, [mapping, source, target]);

  return (
    <div className="wing-phase touch-phase category-theory-touch">
      <h2>{phase.title}</h2>

      <div className="touch-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="touch-interactive-area">
        {/* ─── Interactive Element 1: Category Selector ─────── */}
        <div className="interactive-element category-selector" data-interactive="category-select">
          <h3>Choose Two Worlds</h3>
          <p>Select the source and target categories to build a functor between.</p>

          <div className="selector-row">
            <div className="selector-group">
              <label>Source category:</label>
              <select
                value={sourceCategory}
                onChange={e => handleSourceChange(e.target.value as PresetKey)}
              >
                {Object.entries(CATEGORY_PRESETS).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
              <div className="category-preview">
                <div className="objects-list">
                  {source.objects.map(obj => (
                    <span key={obj.id} className="category-object" style={{ borderColor: obj.color }}>
                      {obj.label}
                    </span>
                  ))}
                </div>
                <div className="morphisms-list">
                  {source.morphisms.map((m, i) => (
                    <span key={i} className="morphism-arrow">
                      {source.objects.find(o => o.id === m.from)?.label} {'->'}
                      {' '}{source.objects.find(o => o.id === m.to)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="functor-arrow">{'==>'}</div>

            <div className="selector-group">
              <label>Target category:</label>
              <select
                value={targetCategory}
                onChange={e => handleTargetChange(e.target.value as PresetKey)}
              >
                {Object.entries(CATEGORY_PRESETS).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
              <div className="category-preview">
                <div className="objects-list">
                  {target.objects.map(obj => (
                    <span key={obj.id} className="category-object" style={{ borderColor: obj.color }}>
                      {obj.label}
                    </span>
                  ))}
                </div>
                <div className="morphisms-list">
                  {target.morphisms.map((m, i) => (
                    <span key={i} className="morphism-arrow">
                      {target.objects.find(o => o.id === m.from)?.label} {'->'}
                      {' '}{target.objects.find(o => o.id === m.to)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Interactive Element 2: Functor Builder ────────── */}
        <div className="interactive-element functor-builder" data-interactive="functor-map">
          <h3>Build the Functor</h3>
          <p>
            Map each object in the source to an object in the target.
            A valid functor must preserve all arrows — if A goes to B in the source,
            then F(A) must go to F(B) in the target.
          </p>

          <div className="mapping-controls">
            {source.objects.map(obj => (
              <div key={obj.id} className="mapping-row">
                <span className="source-object" style={{ borderColor: obj.color }}>
                  {obj.label}
                </span>
                <span className="maps-to">{'|->'}</span>
                <select
                  value={mapping[obj.id] || ''}
                  onChange={e => handleMappingChange(obj.id, e.target.value)}
                >
                  <option value="">-- choose --</option>
                  {target.objects.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="functor-validation">
            {isFunctorValid === null && (
              <p className="validation-pending">Complete all mappings to check structure preservation...</p>
            )}
            {isFunctorValid === true && (
              <div className="validation-success">
                <p>This is a valid functor! Every arrow in the source has a matching arrow in the target.</p>
                <div className="preserved-morphisms">
                  {source.morphisms.map((m, i) => (
                    <div key={i} className="preserved-arrow">
                      {source.objects.find(o => o.id === m.from)?.label}
                      {' -> '}
                      {source.objects.find(o => o.id === m.to)?.label}
                      {'  ==>  '}
                      {target.objects.find(o => o.id === mapping[m.from])?.label}
                      {' -> '}
                      {target.objects.find(o => o.id === mapping[m.to])?.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isFunctorValid === false && (
              <div className="validation-failure">
                <p>
                  This mapping breaks structure! Some arrows in the source do not have
                  matching arrows in the target. Try a different mapping.
                </p>
              </div>
            )}
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
        I can build translators...
      </button>
    </div>
  );
};

export default TouchPhase;
