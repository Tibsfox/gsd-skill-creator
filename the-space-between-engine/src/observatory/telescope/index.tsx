// Telescope — Unified View Component
//
// The climactic view where all 8 mathematical foundations are revealed
// as one continuous progression across 4 parallel chains.
//
// Layout: Circular (echoing the unit circle) with 8 foundation nodes
// arranged in a circle. The 4 chains are concentric rings that can be
// toggled. Cross-chain connections highlight when clicking a foundation.
//
// The meta-unit-circle moment: these 4 chains ARE the same chain
// viewed from different angles.

import React, { useState, useMemo, useCallback } from 'react';
import type { FoundationId, PhaseType } from '@/types/index';
import { FOUNDATION_ORDER, PHASE_ORDER } from '@/types/index';
import { getFoundation } from '@/core/registry';
import { ConnectionGraph, createDefaultGraph } from '@/core/connections';
import { getBridge } from '@/narrative/index';
import { SkillCreatorBridge } from '@/integration/index';

import type {
  TelescopeProps,
  ChainId,
  ChainDefinition,
  ChainRingLayout,
  FoundationProgress,
  CrossChainLinkData,
  BeginAgainState,
} from './types';
import { CHAIN_ORDER } from './types';

import { ChainView } from './ChainView';
import { ChainSelector } from './ChainSelector';
import { CrossChainLink } from './CrossChainLink';
import { ProgressOverlay } from './ProgressOverlay';
import { BeginAgain } from './BeginAgain';
import { CompassFox } from './CompassFox';

// ─── Constants ────────────────────────────────────────────

const SVG_SIZE = 800;
const CENTER = SVG_SIZE / 2;

// Concentric ring radii: outermost is the active chain, others nest inside
const RING_RADII: Record<ChainId, number> = {
  'math': 320,
  'nature': 260,
  'skill-creator': 200,
  'hundred-voices': 140,
};

// ─── Chain Definitions ────────────────────────────────────

const MATH_CHAIN: ChainDefinition = {
  id: 'math',
  name: 'Mathematics',
  subtitle: 'The formal path',
  color: '#60a5fa',
  nodes: [
    { foundationId: 'unit-circle', label: 'Unit Circle', description: 'Separate things resolve into one' },
    { foundationId: 'pythagorean', label: 'Pythagorean', description: 'Right triangles and distance' },
    { foundationId: 'trigonometry', label: 'Trigonometry', description: 'Circular motion becomes waves' },
    { foundationId: 'vector-calculus', label: 'Vector Calculus', description: 'Fields of magnitude and direction' },
    { foundationId: 'set-theory', label: 'Set Theory', description: 'Boundaries and membership' },
    { foundationId: 'category-theory', label: 'Category Theory', description: 'Structure-preserving maps' },
    { foundationId: 'information-theory', label: 'Info Theory', description: 'Messages across noisy channels' },
    { foundationId: 'l-systems', label: 'L-Systems', description: 'Recursive growth rules' },
  ],
};

const NATURE_CHAIN: ChainDefinition = {
  id: 'nature',
  name: 'Nature',
  subtitle: 'The world teaches',
  color: '#4ade80',
  nodes: [
    { foundationId: 'unit-circle', label: 'Earth rotation', description: 'Day and night are one continuous sweep' },
    { foundationId: 'pythagorean', label: 'Spider webs', description: 'Structural tension in perfect proportion' },
    { foundationId: 'trigonometry', label: 'Tides', description: 'Moon pulls ocean in sine waves' },
    { foundationId: 'vector-calculus', label: 'Wind', description: 'Invisible fields that carry seeds' },
    { foundationId: 'set-theory', label: 'Identity', description: 'What makes a species a species' },
    { foundationId: 'category-theory', label: 'Metamorphosis', description: 'Caterpillar to butterfly preserving pattern' },
    { foundationId: 'information-theory', label: 'Birdsong', description: 'Territory encoded over a noisy channel' },
    { foundationId: 'l-systems', label: 'Growth', description: 'Branching follows recursive rules' },
  ],
};

function buildSkillCreatorChain(): ChainDefinition {
  const bridge = new SkillCreatorBridge();
  const nodes = FOUNDATION_ORDER.map((id) => {
    const mapping = bridge.getMapping(id);
    return {
      foundationId: id,
      label: mapping.skillCreatorFunction.split(' ')[0] ?? mapping.skillCreatorFunction,
      description: mapping.explanation.slice(0, 60),
    };
  });

  // Override labels for clarity — the auto-generated ones from skillCreatorFunction
  // are too long. Use the concise names from the task spec.
  const labels: Record<FoundationId, string> = {
    'unit-circle': '\u03b8 position',
    'pythagorean': 'Activation |z|',
    'trigonometry': 'Angular velocity',
    'vector-calculus': 'Gradient descent',
    'set-theory': 'Membership fn',
    'category-theory': 'Functors',
    'information-theory': 'Channel capacity',
    'l-systems': 'Promotion pipeline',
  };

  return {
    id: 'skill-creator',
    name: 'Skill Creator',
    subtitle: 'The builder\u2019s map',
    color: '#c084fc',
    nodes: nodes.map((n) => ({
      ...n,
      label: labels[n.foundationId],
    })),
  };
}

function buildHundredVoicesChain(): ChainDefinition {
  const nodes = FOUNDATION_ORDER.map((id) => {
    const bridge = getBridge(id);
    return {
      foundationId: id,
      label: `${bridge.literaryVoice}`,
      description: bridge.connectionType,
    };
  });

  return {
    id: 'hundred-voices',
    name: 'Hundred Voices',
    subtitle: 'Literature speaks math',
    color: '#fb923c',
    nodes,
  };
}

// ─── Layout Computation ───────────────────────────────────

function computeRingLayout(chainId: ChainId, radius: number): ChainRingLayout {
  const nodes = FOUNDATION_ORDER.map((id, index) => {
    const angle = (2 * Math.PI * index) / FOUNDATION_ORDER.length - Math.PI / 2;
    return {
      foundationId: id,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle,
    };
  });

  return { chainId, radius, nodes };
}

// ─── Progress Computation ─────────────────────────────────

function computeProgress(
  learnerState: TelescopeProps['learnerState']
): Map<FoundationId, FoundationProgress> {
  const map = new Map<FoundationId, FoundationProgress>();
  const totalPhases = PHASE_ORDER.length;

  for (const id of FOUNDATION_ORDER) {
    const completed = learnerState.completedPhases[id] ?? [];
    const count = completed.length;
    map.set(id, {
      foundationId: id,
      completedPhases: completed,
      totalPhases,
      isComplete: PHASE_ORDER.every((p) => completed.includes(p)),
      percentage: (count / totalPhases) * 100,
    });
  }

  return map;
}

function computeTotalPercentage(progress: Map<FoundationId, FoundationProgress>): number {
  let sum = 0;
  for (const p of progress.values()) {
    sum += p.percentage;
  }
  return sum / FOUNDATION_ORDER.length;
}

// ─── Cross-Chain Link Computation ─────────────────────────

function computeCrossChainLinks(
  layouts: Map<ChainId, ChainRingLayout>
): Map<FoundationId, CrossChainLinkData> {
  const links = new Map<FoundationId, CrossChainLinkData>();

  for (const id of FOUNDATION_ORDER) {
    const positions: CrossChainLinkData['positions'] = [];

    for (const [chainId, layout] of layouts) {
      const node = layout.nodes.find((n) => n.foundationId === id);
      if (node) {
        positions.push({ chainId, x: node.x, y: node.y });
      }
    }

    links.set(id, { foundationId: id, chains: CHAIN_ORDER, positions });
  }

  return links;
}

// ─── Begin Again State ────────────────────────────────────

function computeBeginAgainState(
  learnerState: TelescopeProps['learnerState'],
  graph: ConnectionGraph,
  progress: Map<FoundationId, FoundationProgress>
): BeginAgainState {
  // Full journey: all 8 complete
  const allComplete = FOUNDATION_ORDER.every((id) => progress.get(id)?.isComplete);
  if (allComplete) return 'full-journey';

  // Loop closed: Wings 1 and 8 complete
  if (graph.isLoopClosed(learnerState)) return 'loop-closed';

  return 'hidden';
}

// ─── Telescope Component ──────────────────────────────────

export default function Telescope({
  learnerState,
  activeChain: initialChain,
  onNavigateFoundation,
  onClose,
}: TelescopeProps): React.JSX.Element {
  const [activeChain, setActiveChain] = useState<ChainId>(initialChain ?? 'math');
  const [selectedFoundation, setSelectedFoundation] = useState<FoundationId | null>(null);

  // Build chain definitions (memoized — they don't change)
  const chains = useMemo<ChainDefinition[]>(() => [
    MATH_CHAIN,
    NATURE_CHAIN,
    buildSkillCreatorChain(),
    buildHundredVoicesChain(),
  ], []);

  // Build the connection graph
  const graph = useMemo(() => createDefaultGraph(), []);

  // Compute layouts: active chain gets outermost ring, others nest inside
  const layouts = useMemo(() => {
    const map = new Map<ChainId, ChainRingLayout>();

    // Sort chains: active first (outermost), then others in stable order
    const sortedChains = [...CHAIN_ORDER].sort((a, b) => {
      if (a === activeChain) return -1;
      if (b === activeChain) return 1;
      return CHAIN_ORDER.indexOf(a) - CHAIN_ORDER.indexOf(b);
    });

    const radii = [320, 260, 200, 140];
    sortedChains.forEach((chainId, index) => {
      map.set(chainId, computeRingLayout(chainId, radii[index]!));
    });

    return map;
  }, [activeChain]);

  // Compute learner progress
  const progress = useMemo(() => computeProgress(learnerState), [learnerState]);
  const totalPercentage = useMemo(() => computeTotalPercentage(progress), [progress]);

  // Cross-chain links
  const crossChainLinks = useMemo(() => computeCrossChainLinks(layouts), [layouts]);

  // Begin Again state
  const beginAgainState = useMemo(
    () => computeBeginAgainState(learnerState, graph, progress),
    [learnerState, graph, progress]
  );

  // Event handlers
  const handleSelectFoundation = useCallback((id: FoundationId) => {
    setSelectedFoundation((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectChain = useCallback((id: ChainId) => {
    setActiveChain(id);
  }, []);

  const handleBeginAgain = useCallback(() => {
    onNavigateFoundation('unit-circle');
  }, [onNavigateFoundation]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  // Selected foundation detail panel
  const selectedDetail = useMemo(() => {
    if (!selectedFoundation) return null;
    const foundation = getFoundation(selectedFoundation);
    const activeChainDef = chains.find((c) => c.id === activeChain);
    const chainNode = activeChainDef?.nodes.find((n) => n.foundationId === selectedFoundation);
    return {
      name: foundation.name,
      chainLabel: chainNode?.label ?? foundation.name,
      chainDescription: chainNode?.description ?? foundation.description,
      color: foundation.color,
    };
  }, [selectedFoundation, activeChain, chains]);

  return (
    <div
      className="telescope"
      role="dialog"
      aria-label="Telescope — unified view of all foundations"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 70%)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close button */}
      <button
        className="telescope__close"
        onClick={handleClose}
        aria-label="Close telescope"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 8,
          color: '#94a3b8',
          padding: '8px 16px',
          fontSize: 13,
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        Close
      </button>

      {/* Progress overlay */}
      <ProgressOverlay progress={progress} totalPercentage={totalPercentage} />

      {/* SVG canvas — the main telescope visualization */}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width="100%"
        height="100%"
        style={{
          maxWidth: SVG_SIZE,
          maxHeight: SVG_SIZE,
        }}
      >
        <g transform={`translate(${CENTER}, ${CENTER})`}>
          {/* Background: connection between L-Systems and Unit Circle (loop) */}
          {beginAgainState !== 'hidden' && (
            <LoopArc
              layouts={layouts}
              activeChain={activeChain}
              beginAgainState={beginAgainState}
            />
          )}

          {/* Cross-chain links (under the nodes) */}
          {selectedFoundation && (
            <CrossChainLink
              link={crossChainLinks.get(selectedFoundation)!}
              isHighlighted={true}
            />
          )}

          {/* Chain rings */}
          {CHAIN_ORDER.map((chainId) => {
            const chainDef = chains.find((c) => c.id === chainId);
            const layout = layouts.get(chainId);
            if (!chainDef || !layout) return null;

            return (
              <ChainView
                key={chainId}
                chain={chainDef}
                layout={layout}
                isActive={chainId === activeChain}
                selectedFoundation={selectedFoundation}
                progress={progress}
                onSelectFoundation={handleSelectFoundation}
              />
            );
          })}

          {/* Compass Fox at the center */}
          <CompassFox
            centerX={0}
            centerY={0}
            selectedFoundation={selectedFoundation}
            beginAgainState={beginAgainState}
          />
        </g>
      </svg>

      {/* Selected foundation detail panel */}
      {selectedDetail && (
        <div
          className="telescope__detail-panel"
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 12,
            padding: '12px 24px',
            maxWidth: 400,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>
            {selectedDetail.chainLabel}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 8px' }}>
            {selectedDetail.chainDescription}
          </p>
          <button
            onClick={() => onNavigateFoundation(selectedFoundation!)}
            style={{
              background: selectedDetail.color,
              border: 'none',
              borderRadius: 6,
              color: '#e2e8f0',
              padding: '6px 16px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Open {selectedDetail.name}
          </button>
        </div>
      )}

      {/* Begin Again */}
      <BeginAgain state={beginAgainState} onBeginAgain={handleBeginAgain} />

      {/* Chain selector */}
      <ChainSelector
        chains={chains}
        activeChain={activeChain}
        onSelectChain={handleSelectChain}
      />

      {/* CSS animations via style tag */}
      <style>{TELESCOPE_CSS}</style>
    </div>
  );
}

// ─── Loop Arc ─────────────────────────────────────────────
// Draws a subtle arc between L-Systems (position 7) and Unit Circle (position 0)
// on the active chain ring, visible only when the loop is closed.

interface LoopArcProps {
  layouts: Map<ChainId, ChainRingLayout>;
  activeChain: ChainId;
  beginAgainState: BeginAgainState;
}

function LoopArc({ layouts, activeChain, beginAgainState }: LoopArcProps): React.JSX.Element | null {
  const layout = layouts.get(activeChain);
  if (!layout) return null;

  const ucNode = layout.nodes.find((n) => n.foundationId === 'unit-circle');
  const lsNode = layout.nodes.find((n) => n.foundationId === 'l-systems');
  if (!ucNode || !lsNode) return null;

  // Bezier control point: push outward from the center for a gentle arc
  const midX = (ucNode.x + lsNode.x) / 2;
  const midY = (ucNode.y + lsNode.y) / 2;
  const dist = Math.sqrt(midX * midX + midY * midY);
  const normX = dist > 0 ? midX / dist : 0;
  const normY = dist > 0 ? midY / dist : -1;
  const bulge = layout.radius * 0.3;
  const ctrlX = midX + normX * bulge;
  const ctrlY = midY + normY * bulge;

  const opacity = beginAgainState === 'full-journey' ? 0.5 : 0.25;
  const color = beginAgainState === 'full-journey' ? '#fbbf24' : '#94a3b8';

  return (
    <path
      d={`M ${ucNode.x} ${ucNode.y} Q ${ctrlX} ${ctrlY} ${lsNode.x} ${lsNode.y}`}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray="8 6"
      opacity={opacity}
      style={{
        transition: 'opacity 2s ease, stroke 2s ease',
      }}
    />
  );
}

// ─── CSS ──────────────────────────────────────────────────

const TELESCOPE_CSS = `
@keyframes telescope-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.05); }
}

@keyframes telescope-link-draw {
  from { stroke-dashoffset: 100; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 0.6; }
}

@keyframes telescope-fox-glow {
  0%, 100% { opacity: 0.3; r: 36; }
  50% { opacity: 0.7; r: 42; }
}

.telescope:focus {
  outline: none;
}

.telescope__close:hover {
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.4);
}

.telescope__chain-button:hover:not(.telescope__chain-button--active) {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.1);
}

.telescope__foundation-node:hover {
  filter: brightness(1.2);
}
`;
