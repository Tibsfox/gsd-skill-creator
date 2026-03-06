/**
 * Wing 2: Pythagorean Theorem — Connect Phase
 *
 * Links to Unit Circle (the triangle inside) and Vector Calculus (norm of a vector).
 */

import React, { useState } from 'react';
import type { FoundationId } from '../../../types/index.js';

export interface ConnectPhaseProps {
  onComplete: () => void;
  onNavigate?: (foundation: FoundationId) => void;
}

interface Connection {
  targetFoundation: FoundationId;
  title: string;
  relationship: string;
  description: string;
}

const connections: Connection[] = [
  {
    targetFoundation: 'unit-circle',
    title: 'The Triangle Inside the Circle',
    relationship: 'Every point on the unit circle creates a Pythagorean right triangle',
    description:
      'Drop a perpendicular from any point on the unit circle to the x-axis. The ' +
      'horizontal leg is cos(theta), the vertical leg is sin(theta), and the hypotenuse ' +
      'is 1 — the radius. The Pythagorean identity cos^2(theta) + sin^2(theta) = 1 is ' +
      'literally the Pythagorean theorem applied to a triangle inscribed in the unit circle.',
  },
  {
    targetFoundation: 'vector-calculus',
    title: 'The Norm of a Vector',
    relationship: 'Vector magnitude is Pythagoras in higher dimensions',
    description:
      'The length (norm) of a vector v = (v1, v2, ..., vn) is computed as ' +
      'sqrt(v1^2 + v2^2 + ... + vn^2). This is the Pythagorean theorem applied once ' +
      'for each dimension. Every time you normalize a vector, compute a gradient ' +
      'magnitude, or measure the distance between two points in any space, you are ' +
      'using this theorem.',
  },
];

export const ConnectPhase: React.FC<ConnectPhaseProps> = ({ onComplete, onNavigate }) => {
  const [explored, setExplored] = useState<Set<string>>(new Set());
  const [journalEntry, setJournalEntry] = useState('');

  const toggleExplored = (id: string) => {
    setExplored((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canAdvance = explored.size >= 2 && journalEntry.length > 10;

  return (
    <div className="phase connect-phase">
      <h2>Connecting the Theorem</h2>

      <p className="narrative-intro">
        The Pythagorean theorem is not confined to geometry class. It reaches into the
        unit circle, into vector spaces, into every corner of mathematics that measures
        distance.
      </p>

      <div className="connections">
        {connections.map((conn) => (
          <div
            key={conn.targetFoundation}
            className={`connection-card ${explored.has(conn.targetFoundation) ? 'explored' : ''}`}
            style={{
              padding: '16px',
              margin: '12px 0',
              background: explored.has(conn.targetFoundation) ? '#0a2a1a' : '#0a0a2a',
              borderRadius: '8px',
              border: `1px solid ${explored.has(conn.targetFoundation) ? '#2a7a4a' : '#2a4a7a'}`,
              cursor: 'pointer',
            }}
            onClick={() => toggleExplored(conn.targetFoundation)}
          >
            <h3>{conn.title}</h3>
            <p style={{ fontStyle: 'italic', color: '#aaa' }}>{conn.relationship}</p>
            <p>{conn.description}</p>
            {onNavigate && (
              <button
                className="link-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(conn.targetFoundation);
                }}
                style={{ marginTop: 8 }}
              >
                Visit {conn.targetFoundation} wing
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="journal" style={{ margin: '20px 0' }}>
        <h3>Your Connection</h3>
        <textarea
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          placeholder="Where else do you see the Pythagorean relationship?"
          style={{
            width: '100%',
            minHeight: '80px',
            background: '#0a0a2a',
            color: '#ccc',
            border: '1px solid #2a4a7a',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : 'Explore both connections and write a reflection...'}
      </button>
    </div>
  );
};

export const connectMeta = {
  containsMath: true,
  interactiveElements: 0,
  linkedFoundations: ['unit-circle', 'vector-calculus'] as FoundationId[],
  hasSkillCreatorBridge: false,
};
