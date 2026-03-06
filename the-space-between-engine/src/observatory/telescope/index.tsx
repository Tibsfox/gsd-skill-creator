/**
 * Telescope — Unified View
 *
 * Shows all 8 foundations in a circular layout (echoing the unit
 * circle) with 4 parallel chains: Math, Nature, Skill-Creator,
 * and Hundred Voices. Cross-connections visible as arcs,
 * learner progress overlaid, and "Begin Again" loop detection.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  AppAction,
  LearnerState,
  FoundationId,
  TelescopeChain,
} from '../../types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../types/index.js';
import { getFoundation } from '../../core/registry.js';
import { getGraphLayout, isLoopClosed } from '../../core/connections.js';
import { telescopeChains, CHAIN_LABELS, CHAIN_ORDER } from './TelescopeChainData.js';

export interface TelescopeProps {
  learnerState: LearnerState;
  dispatch: React.Dispatch<AppAction>;
  initialChain?: TelescopeChain;
}

// ─── Layout Constants ────────────────────────────────

const VIEW_SIZE = 600;
const CENTER = VIEW_SIZE / 2;
const RADIUS = 220;
const NODE_RADIUS = 36;

function nodePosition(index: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / FOUNDATION_ORDER.length - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

// ─── Component ───────────────────────────────────────

export const Telescope: React.FC<TelescopeProps> = ({
  learnerState,
  dispatch,
  initialChain = 'math',
}) => {
  const [activeChain, setActiveChain] = useState<TelescopeChain>(initialChain);
  const [highlightedFoundation, setHighlightedFoundation] = useState<FoundationId | null>(null);

  const graph = useMemo(() => getGraphLayout(), []);
  const loopClosed = useMemo(() => isLoopClosed(learnerState), [learnerState]);
  const chainNodes = telescopeChains[activeChain];

  const getNodeState = useCallback(
    (id: FoundationId): 'complete' | 'current' | 'incomplete' => {
      const completed = learnerState.completedPhases[id] ?? [];
      if (completed.length >= PHASE_ORDER.length) return 'complete';
      if (learnerState.currentFoundation === id) return 'current';
      return 'incomplete';
    },
    [learnerState],
  );

  const handleNodeClick = useCallback(
    (id: FoundationId) => {
      dispatch({ type: 'NAVIGATE_WING', foundation: id });
    },
    [dispatch],
  );

  return (
    <div className="telescope-view" data-testid="telescope-view" style={{ padding: 24 }}>
      {/* Chain tabs */}
      <nav className="telescope-chains" data-testid="telescope-chains" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {CHAIN_ORDER.map((chain) => (
          <button
            key={chain}
            className={`chain-tab ${activeChain === chain ? 'active' : ''}`}
            data-testid={`chain-tab-${chain}`}
            onClick={() => setActiveChain(chain)}
            style={{
              padding: '8px 16px',
              border: activeChain === chain ? '1px solid #4488cc' : '1px solid #2a2a44',
              borderRadius: 4,
              background: activeChain === chain ? '#1c1c3a' : 'transparent',
              color: activeChain === chain ? '#e8e8f0' : '#8888a0',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {CHAIN_LABELS[chain]}
          </button>
        ))}
      </nav>

      {/* Circular diagram */}
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        data-testid="telescope-diagram"
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* Cross-connection arcs */}
        {graph.edges
          .filter((e) => e.from !== FOUNDATION_ORDER[FOUNDATION_ORDER.indexOf(e.to) - 1]) // skip sequential
          .map((edge) => {
            const fromIdx = FOUNDATION_ORDER.indexOf(edge.from);
            const toIdx = FOUNDATION_ORDER.indexOf(edge.to);
            const from = nodePosition(fromIdx);
            const to = nodePosition(toIdx);
            const isHighlighted =
              highlightedFoundation === edge.from || highlightedFoundation === edge.to;

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#4488cc' : '#2a2a44'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={edge.bidirectional ? 'none' : '4,4'}
                opacity={edge.strength * (isHighlighted ? 1 : 0.5)}
              />
            );
          })}

        {/* Sequential path */}
        {FOUNDATION_ORDER.slice(0, -1).map((id, i) => {
          const from = nodePosition(i);
          const to = nodePosition(i + 1);
          return (
            <line
              key={`seq-${id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#2a2a44"
              strokeWidth={2}
            />
          );
        })}

        {/* Begin Again arc (L-Systems → Unit Circle) */}
        {loopClosed && (() => {
          const from = nodePosition(FOUNDATION_ORDER.length - 1);
          const to = nodePosition(0);
          return (
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#2da55a"
              strokeWidth={3}
              opacity={0.8}
              data-testid="begin-again-arc"
            >
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          );
        })()}

        {/* Foundation nodes */}
        {FOUNDATION_ORDER.map((id, i) => {
          const pos = nodePosition(i);
          const foundation = getFoundation(id);
          const node = chainNodes.find((n) => n.foundationId === id)!;
          const state = getNodeState(id);
          const isHighlighted = highlightedFoundation === id;
          const color = foundation.color;

          const fillOpacity =
            state === 'complete' ? 0.9 :
            state === 'current' ? 0.6 :
            0.2;

          return (
            <g
              key={id}
              data-testid={`telescope-node-${id}`}
              onClick={() => handleNodeClick(id)}
              onMouseEnter={() => setHighlightedFoundation(id)}
              onMouseLeave={() => setHighlightedFoundation(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={isHighlighted ? '#e8e8f0' : color}
                strokeWidth={isHighlighted ? 2 : 1}
              >
                {state === 'current' && (
                  <animate
                    attributeName="fill-opacity"
                    values="0.4;0.8;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <text
                x={pos.x}
                y={pos.y - 4}
                textAnchor="middle"
                fill="#e8e8f0"
                fontSize="10"
                fontWeight="500"
              >
                {node.label.length > 14 ? node.label.slice(0, 12) + '...' : node.label}
              </text>
              <text
                x={pos.x}
                y={pos.y + 10}
                textAnchor="middle"
                fill="#8888a0"
                fontSize="7"
              >
                {state === 'complete' ? '\u25CF' : state === 'current' ? '\u25D0' : '\u25CB'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected node detail */}
      {highlightedFoundation && (
        <div
          className="telescope-detail"
          data-testid="telescope-detail"
          style={{
            textAlign: 'center',
            marginTop: 16,
            padding: 16,
            backgroundColor: '#141428',
            borderRadius: 4,
            border: '1px solid #2a2a44',
          }}
        >
          {CHAIN_ORDER.map((chain) => {
            const node = telescopeChains[chain].find(
              (n) => n.foundationId === highlightedFoundation,
            )!;
            return (
              <div
                key={chain}
                data-testid={`detail-${chain}`}
                style={{
                  marginBottom: 8,
                  opacity: chain === activeChain ? 1 : 0.5,
                }}
              >
                <span style={{ color: '#8888a0', fontSize: '0.75rem' }}>
                  {CHAIN_LABELS[chain]}:
                </span>{' '}
                <span style={{ color: '#e8e8f0', fontSize: '0.875rem' }}>
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Begin Again notice */}
      {loopClosed && (
        <div
          data-testid="begin-again-notice"
          style={{
            textAlign: 'center',
            marginTop: 16,
            color: '#2da55a',
            fontSize: '0.875rem',
            fontStyle: 'italic',
          }}
        >
          The loop is closed. L-Systems connects back to Unit Circle. Begin again.
        </div>
      )}
    </div>
  );
};

export { telescopeChains, CHAIN_LABELS, CHAIN_ORDER } from './TelescopeChainData.js';
export { getNodesForFoundation, validateChains } from './TelescopeChainData.js';
export default Telescope;
