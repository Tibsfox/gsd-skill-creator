/**
 * Wing 4: Vector Calculus — Connect Phase
 *
 * Links to Trigonometry (field components are trig functions)
 * and L-Systems (gradient fields produce growth).
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
    targetFoundation: 'trigonometry',
    title: 'Field Components Are Trig Functions',
    relationship: 'Sine and cosine describe how field components vary in space',
    description:
      'Many fundamental fields are expressed using trigonometric functions. An ' +
      'electromagnetic wave has electric and magnetic components that oscillate as ' +
      'sin(kx - omega*t) and cos(kx - omega*t). The velocity field of a vortex uses ' +
      'sin(theta) and cos(theta) to describe direction. When you decompose a field into ' +
      'Fourier components, every component is a sine or cosine. Trigonometry is not just ' +
      'connected to vector calculus — it is the language in which fields are written.',
  },
  {
    targetFoundation: 'l-systems',
    title: 'Gradient Fields Produce Growth',
    relationship: 'Growth follows gradients; form follows fields',
    description:
      'Plants grow toward light — they follow the gradient of light intensity. Roots ' +
      'grow toward water — they follow the gradient of moisture. The branching patterns ' +
      'of L-systems can be understood as responses to gradient fields: at each branching ' +
      'point, growth follows the local gradient of some resource (light, nutrients, ' +
      'space). The forms of nature are shaped by the fields they grow in.',
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
      <h2>Connecting Fields</h2>

      <p className="narrative-intro">
        Vector calculus connects to everything because fields are everywhere. The
        components of fields are trig functions; the growth patterns of nature follow
        gradient fields.
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
          placeholder="What invisible fields have you felt or seen evidence of?"
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
  linkedFoundations: ['trigonometry', 'l-systems'] as FoundationId[],
  hasSkillCreatorBridge: false,
};
