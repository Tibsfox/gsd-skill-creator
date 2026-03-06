// The Space Between Engine — Shared Types
// All components depend on these types. This is the root of the type system.

// ─── Foundation Identity ───────────────────────────────
export type FoundationId =
  | 'unit-circle'
  | 'pythagorean'
  | 'trigonometry'
  | 'vector-calculus'
  | 'set-theory'
  | 'category-theory'
  | 'information-theory'
  | 'l-systems';

export type PhaseType = 'wonder' | 'see' | 'touch' | 'understand' | 'connect' | 'create';

export const PHASE_ORDER: PhaseType[] = ['wonder', 'see', 'touch', 'understand', 'connect', 'create'];

export const FOUNDATION_ORDER: FoundationId[] = [
  'unit-circle', 'pythagorean', 'trigonometry', 'vector-calculus',
  'set-theory', 'category-theory', 'information-theory', 'l-systems'
];

// ─── Foundation Definition ─────────────────────────────
export interface Foundation {
  id: FoundationId;
  name: string;
  subtitle: string;
  order: number; // 1-8
  description: string;
  wonderConnections: WonderConnection[];
  skillCreatorAnalog: SkillCreatorMapping;
  phases: Map<PhaseType, FoundationPhase>;
  connections: FoundationConnectionRef[];
  color: string; // CSS color for visual identity
  icon: string;  // Emoji or icon identifier
}

export interface FoundationPhase {
  type: PhaseType;
  title: string;
  narrativeIntro: string;
  content: PhaseContent;
  visualization?: VisualizationConfig;
  interactiveElements: InteractiveElement[];
  completionCriteria: CompletionCriterion[];
}

export interface PhaseContent {
  text: string;           // Markdown content
  mathNotation?: string;  // LaTeX notation (only in 'understand' phase or later)
  codeExamples?: CodeExample[];
}

export interface CodeExample {
  language: string;
  code: string;
  description: string;
}

// ─── Wonder & Nature ───────────────────────────────────
export interface WonderConnection {
  id: string;
  phenomenon: string;
  description: string;
  foundationMapping: string;
  simulationId?: string;
  imagePrompt?: string;
  audioDescription?: string;
}

// ─── Skill-Creator Bridge ──────────────────────────────
export interface SkillCreatorMapping {
  mathConcept: string;
  skillCreatorFunction: string;
  explanation: string;
  complexPlanePosition?: { theta: number; r: number };
  codeParallel?: string;
}

// ─── Visualization ─────────────────────────────────────
export type VizType = 'canvas-2d' | 'webgl-3d' | 'svg' | 'audio' | 'composite';

export interface VisualizationConfig {
  type: VizType;
  componentId: string;
  interactiveParams: InteractiveParam[];
  minFps: number; // default 30
  responsive: boolean;
}

export interface InteractiveParam {
  name: string;
  label: string;
  type: 'slider' | 'drag-point' | 'toggle' | 'select' | 'color';
  min?: number;
  max?: number;
  step?: number;
  default: number | string | boolean;
  unit?: string;
  description: string;
}

export interface InteractiveElement {
  id: string;
  type: 'drag-point' | 'slider' | 'toggle' | 'select' | 'color' | 'button' | 'text-input' | 'canvas-paint';
  config: InteractiveParam;
  affectsVisualization: boolean;
}

// ─── Completion & Progression ──────────────────────────
export interface CompletionCriterion {
  id: string;
  description: string;
  type: 'interaction-count' | 'time-spent' | 'creation-made' | 'insight-recorded' | 'manual';
  threshold?: number;
}

export interface LearnerState {
  currentFoundation: FoundationId;
  currentPhase: PhaseType;
  completedPhases: Record<FoundationId, PhaseType[]>;
  creations: Creation[];
  journalEntries: JournalEntry[];
  unitCircleMoments: UnitCircleMoment[];
  timeSpent: Record<FoundationId, number>; // milliseconds
  bypasses: Record<FoundationId, PhaseType[]>; // phases bypassed per foundation
  firstVisit: string; // ISO datetime
  lastVisit: string;  // ISO datetime
}

export interface Creation {
  id: string;
  foundationId: FoundationId;
  type: 'generative-art' | 'algorithmic-music' | 'l-system' | 'visualization' | 'code' | 'journal';
  title: string;
  data: string; // serialized creation data
  createdAt: string;
  shared: boolean;
}

export interface JournalEntry {
  id: string;
  foundationId?: FoundationId;
  text: string;
  createdAt: string;
  prompt?: string; // the reflection prompt that inspired this
}

export interface UnitCircleMoment {
  id: string;
  foundations: FoundationId[]; // which foundations connected
  insight: string;
  createdAt: string;
}

// ─── Connection Graph ──────────────────────────────────
export interface FoundationConnection {
  from: FoundationId;
  to: FoundationId;
  relationship: string;
  strength: number; // 0-1
  bridgeConcept: string;
  bidirectional: boolean;
  connectionType: 'isomorphism' | 'analogy';
}

export interface FoundationConnectionRef {
  targetId: FoundationId;
  connectionId: string;
}

// ─── Cross-Domain Nodes ──────────────────────────────
export interface CrossDomainNode {
  name: string; // e.g., "birdsong", "compass-fox"
  foundations: FoundationId[];
  description: string;
}

// ─── Wonder Warden ─────────────────────────────────────
export type WardenMode = 'annotate' | 'gate' | 'redirect' | 'shelter';

export interface WardenMessage {
  id: string;
  decision: WardenDecision;
  foundation: FoundationId;
  phase: PhaseType;
  dismissed: boolean;
  timestamp: string; // ISO datetime
}

export interface WardenDecision {
  allowed: boolean;
  mode: WardenMode;
  reason: string;
  suggestion?: string; // for redirect mode
}

export interface ShelterOption {
  type: 'alternative-wonder' | 'simpler-interactive' | 'connection-from-familiar' | 'journal-prompt';
  description: string;
  targetFoundation?: FoundationId;
}

// ─── Narrative Content ────────────────────────────────
export interface WonderStory {
  foundationId: FoundationId;
  title: string;
  body: string; // Markdown, no math notation
  voiceTone: string;
  keyImage: string;
  literaryVoice: string; // Hundred Voices aesthetic mode — felt in prose rhythm, NEVER named in text
}

export interface HundredVoicesBridge {
  foundationId: FoundationId;
  literaryVoice: string;
  connectionType: string;
  description: string;
  // NO quoted text — conceptual connections only
}

export interface ReflectionPrompt {
  id: string;
  foundationId?: FoundationId; // undefined for cross-foundation prompts
  prompt: string;
  followUp?: string;
}

// ─── Graph Layout ─────────────────────────────────────
export interface GraphNode {
  id: FoundationId;
  label: string;
  x: number;
  y: number;
  color: string;
}

export interface GraphEdge {
  from: FoundationId;
  to: FoundationId;
  strength: number;
  bidirectional: boolean;
}

// ─── Garden Presets ───────────────────────────────────
export interface ArtPreset {
  id: string;
  name: string;
  foundationId: FoundationId;
  params: Record<string, number>;
  description: string;
}

export interface LSystemPreset {
  id: string;
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
  description: string;
}

// ─── Observatory Navigation ────────────────────────────
export type ObservatoryView = 'wing' | 'telescope' | 'garden' | 'journal';

export interface NavigationState {
  view: ObservatoryView;
  activeFoundation?: FoundationId;
  activePhase?: PhaseType;
  telescopeChain?: 'math' | 'nature' | 'skill-creator' | 'hundred-voices';
  gardenTool?: 'art' | 'music' | 'lsystem' | 'journal';
}
