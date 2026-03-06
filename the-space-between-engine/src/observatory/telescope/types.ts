// Telescope Types — View-specific types for the unified chain visualization.
// Depends on @/types/index for shared types (FoundationId, LearnerState, etc.)

import type { FoundationId, LearnerState, PhaseType } from '@/types/index';

// ─── Chain Identity ───────────────────────────────────────

export type ChainId = 'math' | 'nature' | 'skill-creator' | 'hundred-voices';

export const CHAIN_ORDER: ChainId[] = [
  'math', 'nature', 'skill-creator', 'hundred-voices',
];

// ─── Chain Data ───────────────────────────────────────────

export interface ChainDefinition {
  id: ChainId;
  name: string;
  subtitle: string;
  color: string;
  nodes: ChainNodeData[];
}

export interface ChainNodeData {
  foundationId: FoundationId;
  label: string;        // What this foundation is called in this chain
  description: string;  // One-line summary for this perspective
}

// ─── Layout ───────────────────────────────────────────────

export interface NodePosition {
  x: number;
  y: number;
  angle: number; // radians, position on the circle
}

export interface ChainRingLayout {
  chainId: ChainId;
  radius: number;
  nodes: Array<NodePosition & { foundationId: FoundationId }>;
}

// ─── Cross-Chain Links ────────────────────────────────────

export interface CrossChainLinkData {
  foundationId: FoundationId;
  chains: ChainId[];
  positions: Array<{ chainId: ChainId; x: number; y: number }>;
}

// ─── Progress ─────────────────────────────────────────────

export interface FoundationProgress {
  foundationId: FoundationId;
  completedPhases: PhaseType[];
  totalPhases: number;
  isComplete: boolean;
  percentage: number;
}

// ─── Begin Again ──────────────────────────────────────────

export type BeginAgainState = 'hidden' | 'loop-closed' | 'full-journey';

// ─── Component Props ──────────────────────────────────────

export interface TelescopeProps {
  learnerState: LearnerState;
  activeChain?: ChainId;
  onNavigateFoundation: (id: FoundationId) => void;
  onClose: () => void;
}

export interface ChainViewProps {
  chain: ChainDefinition;
  layout: ChainRingLayout;
  isActive: boolean;
  selectedFoundation: FoundationId | null;
  progress: Map<FoundationId, FoundationProgress>;
  onSelectFoundation: (id: FoundationId) => void;
}

export interface ChainSelectorProps {
  chains: ChainDefinition[];
  activeChain: ChainId;
  onSelectChain: (id: ChainId) => void;
}

export interface FoundationNodeProps {
  foundationId: FoundationId;
  label: string;
  description: string;
  position: NodePosition;
  isSelected: boolean;
  isActive: boolean;
  progress: FoundationProgress;
  chainColor: string;
  onSelect: (id: FoundationId) => void;
}

export interface CrossChainLinkProps {
  link: CrossChainLinkData;
  isHighlighted: boolean;
}

export interface ProgressOverlayProps {
  progress: Map<FoundationId, FoundationProgress>;
  totalPercentage: number;
}

export interface BeginAgainProps {
  state: BeginAgainState;
  onBeginAgain: () => void;
}

export interface CompassFoxProps {
  centerX: number;
  centerY: number;
  selectedFoundation: FoundationId | null;
  beginAgainState: BeginAgainState;
}
