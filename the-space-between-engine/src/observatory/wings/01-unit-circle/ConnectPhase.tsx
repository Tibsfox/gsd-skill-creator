/**
 * Wing 1: Unit Circle — Connect Phase
 *
 * Links to Pythagorean (the right triangle inside the circle)
 * and Trigonometry (the unit circle set in motion).
 * Skill-creator bridge: theta as abstract-to-concrete position.
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
    targetFoundation: 'pythagorean',
    title: 'The Right Triangle Inside',
    relationship: 'The unit circle contains the Pythagorean theorem',
    description:
      'Draw a line from the center of the unit circle to any point on it, then drop ' +
      'a vertical line to the x-axis. You have a right triangle with hypotenuse 1, ' +
      'horizontal leg cos(theta), and vertical leg sin(theta). The Pythagorean theorem ' +
      'says cos^2(theta) + sin^2(theta) = 1 — which is exactly the equation of the ' +
      'circle. The identity IS the theorem, wearing a different name.',
  },
  {
    targetFoundation: 'trigonometry',
    title: 'The Circle Set in Motion',
    relationship: 'Trigonometry is the unit circle unfolding over time',
    description:
      'Let the angle theta increase steadily with time. The point on the circle moves ' +
      'at a constant rate. Its x-coordinate traces out the cosine wave, its y-coordinate ' +
      'traces the sine wave. Trigonometry is not a separate subject — it is what happens ' +
      'when you let the unit circle spin.',
  },
];

const skillCreatorBridge = {
  title: 'theta as Position on the Complex Plane',
  description:
    'In the skill-creator system, every concept occupies a position parameterized by ' +
    'theta — the same angle from the unit circle. Small theta values place a concept ' +
    'close to the concrete (the x-axis, where cosine dominates). Large theta values ' +
    'push toward the abstract (the y-axis, where sine dominates). The unit circle is ' +
    'the map between what you can touch and what you can only think.',
};

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
      <h2>Connecting the Circle</h2>

      <p className="narrative-intro">
        The unit circle does not live in isolation. It is a crossroads — a place where
        different mathematical ideas meet and recognize each other. Let us follow the threads.
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

        <div
          className={`connection-card bridge ${explored.has('skill-creator') ? 'explored' : ''}`}
          style={{
            padding: '16px',
            margin: '12px 0',
            background: explored.has('skill-creator') ? '#2a1a0a' : '#0a0a2a',
            borderRadius: '8px',
            border: `1px solid ${explored.has('skill-creator') ? '#7a5a2a' : '#2a4a7a'}`,
            cursor: 'pointer',
          }}
          onClick={() => toggleExplored('skill-creator')}
        >
          <h3>{skillCreatorBridge.title}</h3>
          <p style={{ fontStyle: 'italic', color: '#cca' }}>Skill-Creator Bridge</p>
          <p>{skillCreatorBridge.description}</p>
        </div>
      </div>

      <div className="journal" style={{ margin: '20px 0' }}>
        <h3>Your Connection</h3>
        <p>Write about a connection you discovered or one that surprised you:</p>
        <textarea
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          placeholder="What connections do you see?"
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
        {canAdvance ? 'Continue' : 'Explore at least 2 connections and write a reflection...'}
      </button>
    </div>
  );
};

export const connectMeta = {
  containsMath: true,
  interactiveElements: 0,
  linkedFoundations: ['pythagorean', 'trigonometry'] as FoundationId[],
  hasSkillCreatorBridge: true,
};
