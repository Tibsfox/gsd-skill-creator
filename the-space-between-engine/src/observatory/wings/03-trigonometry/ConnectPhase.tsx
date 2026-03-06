/**
 * Wing 3: Trigonometry — Connect Phase
 *
 * Links to Unit Circle (trig IS the circle in motion)
 * and Information Theory (Fourier analysis).
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
    title: 'Trigonometry IS the Circle in Motion',
    relationship: 'The unit circle is the generator; trigonometry is the output',
    description:
      'A point on the unit circle at angle theta has coordinates (cos(theta), sin(theta)). ' +
      'Let theta increase with time: theta = omega * t. Now cos(omega * t) and sin(omega * t) ' +
      'are the sine and cosine waves. Trigonometry does not just use the circle — it IS the ' +
      'circle, unrolled along the time axis. Every trig function is a shadow cast by rotation.',
  },
  {
    targetFoundation: 'information-theory',
    title: 'Fourier Analysis and Information',
    relationship: 'The frequency content of a signal IS its information',
    description:
      'Claude Shannon showed that the information capacity of a channel depends on its ' +
      'bandwidth — the range of frequencies it can carry. Fourier analysis decomposes ' +
      'signals into frequencies, revealing how much information they contain. A signal ' +
      'with more frequency components carries more information. Compression works by ' +
      'removing frequencies humans cannot perceive. Trigonometry is the bridge between ' +
      'waves and information.',
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
      <h2>Connecting Motion</h2>

      <p className="narrative-intro">
        Trigonometry reaches in two directions: backward to the unit circle that generates
        it, and forward to information theory where its waves carry meaning.
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
          placeholder="Where do you hear or feel waves in your daily life?"
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
  linkedFoundations: ['unit-circle', 'information-theory'] as FoundationId[],
  hasSkillCreatorBridge: false,
};
