// Wing 6 — Create Phase: "Build a Translator"
// Map between two personal domains (cooking<->chemistry, musical keys<->colors).
// System validates structure preservation.
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

interface DomainEntry {
  name: string;
}

interface MappingEntry {
  sourceIdx: number;
  targetIdx: number;
}

interface RelationEntry {
  fromIdx: number;
  toIdx: number;
  label: string;
  domain: 'source' | 'target';
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [sourceName, setSourceName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [sourceItems, setSourceItems] = useState<DomainEntry[]>([]);
  const [targetItems, setTargetItems] = useState<DomainEntry[]>([]);
  const [mappings, setMappings] = useState<MappingEntry[]>([]);
  const [relations, setRelations] = useState<RelationEntry[]>([]);
  const [newSourceItem, setNewSourceItem] = useState('');
  const [newTargetItem, setNewTargetItem] = useState('');
  const [completed, setCompleted] = useState(false);
  const [title, setTitle] = useState('');

  const addSourceItem = useCallback(() => {
    if (newSourceItem.trim()) {
      setSourceItems((prev) => [...prev, { name: newSourceItem.trim() }]);
      setNewSourceItem('');
    }
  }, [newSourceItem]);

  const addTargetItem = useCallback(() => {
    if (newTargetItem.trim()) {
      setTargetItems((prev) => [...prev, { name: newTargetItem.trim() }]);
      setNewTargetItem('');
    }
  }, [newTargetItem]);

  const addMapping = useCallback((sourceIdx: number, targetIdx: number) => {
    setMappings((prev) => {
      const filtered = prev.filter(m => m.sourceIdx !== sourceIdx);
      return [...filtered, { sourceIdx, targetIdx }];
    });
  }, []);

  const addRelation = useCallback((domain: 'source' | 'target', fromIdx: number, toIdx: number, label: string) => {
    setRelations((prev) => [...prev, { fromIdx, toIdx, label, domain }]);
  }, []);

  const checkPreservation = useCallback((): { preserved: boolean; details: string } => {
    if (mappings.length === 0 || relations.length === 0) {
      return { preserved: false, details: 'Add objects, relations, and mappings to check.' };
    }

    const mapLookup = new Map<number, number>();
    for (const m of mappings) {
      mapLookup.set(m.sourceIdx, m.targetIdx);
    }

    const sourceRels = relations.filter(r => r.domain === 'source');
    const targetRels = relations.filter(r => r.domain === 'target');

    let preserved = true;
    let broken = '';
    for (const rel of sourceRels) {
      const mappedFrom = mapLookup.get(rel.fromIdx);
      const mappedTo = mapLookup.get(rel.toIdx);
      if (mappedFrom === undefined || mappedTo === undefined) continue;

      const hasCorresponding = targetRels.some(
        tr => tr.fromIdx === mappedFrom && tr.toIdx === mappedTo
      );
      if (!hasCorresponding) {
        preserved = false;
        const fromName = sourceItems[rel.fromIdx]?.name ?? '?';
        const toName = sourceItems[rel.toIdx]?.name ?? '?';
        broken = `"${fromName} -> ${toName}" has no corresponding relation in ${targetName}`;
        break;
      }
    }

    return {
      preserved,
      details: preserved
        ? 'Your mapping preserves structure. It is a functor.'
        : `Structure broken: ${broken}`,
    };
  }, [mappings, relations, sourceItems, targetName]);

  const handleSave = useCallback(() => {
    const { preserved } = checkPreservation();
    const creation: Creation = {
      id: `category-theory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      foundationId: 'category-theory',
      type: 'visualization',
      title: title || `${sourceName} <-> ${targetName}`,
      data: JSON.stringify({
        sourceName,
        targetName,
        sourceItems: sourceItems.map(i => i.name),
        targetItems: targetItems.map(i => i.name),
        mappings,
        relations,
        structurePreserved: preserved,
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setCompleted(true);
  }, [sourceName, targetName, sourceItems, targetItems, mappings, relations, title, checkPreservation, onCreationSave]);

  const handleSkip = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  const preservation = checkPreservation();

  return (
    <div className="phase phase--create">
      <h2 className="create__title">Build a Translator</h2>
      <p className="create__prompt">
        Choose two domains you know well. Build objects and relationships in each.
        Then map between them. If your mapping preserves the relationships, you have
        built a functor — a faithful translation between worlds.
      </p>

      <div className="create__domains">
        <div className="create__domain">
          <input
            className="create__domain-name"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Source domain (e.g., Cooking)"
            aria-label="Source domain name"
          />
          <div className="create__items">
            {sourceItems.map((item, i) => (
              <span key={i} className="create__item create__item--source">
                {item.name}
              </span>
            ))}
          </div>
          <div className="create__add-item">
            <input
              value={newSourceItem}
              onChange={(e) => setNewSourceItem(e.target.value)}
              placeholder="Add object..."
              aria-label="Add source object"
              onKeyDown={(e) => { if (e.key === 'Enter') addSourceItem(); }}
            />
            <button onClick={addSourceItem}>Add</button>
          </div>

          {sourceItems.length >= 2 && (
            <div className="create__relations">
              <p className="create__relations-label">Add source relations:</p>
              {sourceItems.map((from, fi) =>
                sourceItems.map((to, ti) => {
                  if (fi === ti) return null;
                  const exists = relations.some(r => r.domain === 'source' && r.fromIdx === fi && r.toIdx === ti);
                  if (exists) return null;
                  return (
                    <button
                      key={`${fi}-${ti}`}
                      className="create__relation-btn"
                      onClick={() => addRelation('source', fi, ti, 'relates')}
                    >
                      {from.name} &rarr; {to.name}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="create__mapping-zone">
          <h3>Mapping</h3>
          {sourceItems.length > 0 && targetItems.length > 0 && (
            <div className="create__mapping-controls">
              {sourceItems.map((src, si) => (
                <div key={si} className="create__mapping-row">
                  <span>{src.name}</span>
                  <select
                    value={mappings.find(m => m.sourceIdx === si)?.targetIdx ?? ''}
                    onChange={(e) => {
                      const ti = parseInt(e.target.value, 10);
                      if (!isNaN(ti)) addMapping(si, ti);
                    }}
                    aria-label={`Map ${src.name} to...`}
                  >
                    <option value="">-- map to --</option>
                    {targetItems.map((tgt, ti) => (
                      <option key={ti} value={ti}>{tgt.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <p className={`create__preservation ${preservation.preserved ? 'create__preservation--yes' : ''}`}>
            {preservation.details}
          </p>
        </div>

        <div className="create__domain">
          <input
            className="create__domain-name"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="Target domain (e.g., Chemistry)"
            aria-label="Target domain name"
          />
          <div className="create__items">
            {targetItems.map((item, i) => (
              <span key={i} className="create__item create__item--target">
                {item.name}
              </span>
            ))}
          </div>
          <div className="create__add-item">
            <input
              value={newTargetItem}
              onChange={(e) => setNewTargetItem(e.target.value)}
              placeholder="Add object..."
              aria-label="Add target object"
              onKeyDown={(e) => { if (e.key === 'Enter') addTargetItem(); }}
            />
            <button onClick={addTargetItem}>Add</button>
          </div>

          {targetItems.length >= 2 && (
            <div className="create__relations">
              <p className="create__relations-label">Add target relations:</p>
              {targetItems.map((from, fi) =>
                targetItems.map((to, ti) => {
                  if (fi === ti) return null;
                  const exists = relations.some(r => r.domain === 'target' && r.fromIdx === fi && r.toIdx === ti);
                  if (exists) return null;
                  return (
                    <button
                      key={`${fi}-${ti}`}
                      className="create__relation-btn"
                      onClick={() => addRelation('target', fi, ti, 'relates')}
                    >
                      {from.name} &rarr; {to.name}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {!completed && (
        <div className="create__save-area">
          <input
            className="create__title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your translator a name..."
            aria-label="Creation title"
          />
          <div className="create__save-buttons">
            <button
              className="create__save-btn"
              onClick={handleSave}
              disabled={sourceItems.length === 0 || targetItems.length === 0}
            >
              Save translator
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
