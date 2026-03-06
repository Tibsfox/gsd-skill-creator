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
  'set-theory', 'category-theory', 'information-theory', 'l-systems',
];

// ─── Foundation Definition ─────────────────────────────
export interface Foundation {
  id: FoundationId;
  name: string;
  subtitle: string;
  order: number;
  description: string;
  wonderConnections: WonderConnection[];
  skillCreatorAnalog: SkillCreatorMapping;
  phases: Map<PhaseType, FoundationPhase>;
  connections: FoundationConnectionRef[];
  color: string;
  icon: string;
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
  text: string;
  mathNotation?: string;
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
  minFps: number;
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
  type: 'draggable-point' | 'slider' | 'button' | 'text-input' | 'canvas-paint';
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
  timeSpent: Record<FoundationId, number>;
  bypasses: Record<string, number>;
  firstVisit: string;
  lastVisit: string;
  stateVersion: number;
}

export interface Creation {
  id: string;
  foundationId: FoundationId;
  type: 'generative-art' | 'algorithmic-music' | 'l-system' | 'visualization' | 'code' | 'journal';
  title: string;
  data: string;
  createdAt: string;
  shared: boolean;
}

export interface JournalEntry {
  id: string;
  foundationId?: FoundationId;
  text: string;
  createdAt: string;
  prompt?: string;
}

export interface UnitCircleMoment {
  id: string;
  foundations: FoundationId[];
  insight: string;
  createdAt: string;
}

// ─── Connection Graph ──────────────────────────────────
export interface FoundationConnection {
  from: FoundationId;
  to: FoundationId;
  relationship: string;
  strength: number;
  bridgeConcept: string;
  bidirectional: boolean;
}

export interface FoundationConnectionRef {
  targetId: FoundationId;
  connectionId: string;
}

export interface GraphNode {
  id: FoundationId;
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface GraphEdge {
  from: FoundationId;
  to: FoundationId;
  strength: number;
  bidirectional: boolean;
}

// ─── Wonder Warden ─────────────────────────────────────
export type WardenMode = 'annotate' | 'gate' | 'redirect';

export interface WardenDecision {
  allowed: boolean;
  mode: WardenMode;
  reason: string;
  suggestion?: string;
}

export interface WardenMessage {
  id: string;
  decision: WardenDecision;
  foundation: FoundationId;
  phase: PhaseType;
  dismissed: boolean;
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

// ─── Application State ─────────────────────────────────
export interface AppState {
  learner: LearnerState;
  navigation: NavigationState;
  wardenMessages: WardenMessage[];
  isFirstVisit: boolean;
}

export type AppAction =
  | { type: 'NAVIGATE_WING'; foundation: FoundationId }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'GO_BACK_PHASE' }
  | { type: 'OPEN_TELESCOPE'; chain?: NavigationState['telescopeChain'] }
  | { type: 'OPEN_GARDEN'; tool?: NavigationState['gardenTool'] }
  | { type: 'SAVE_CREATION'; creation: Omit<Creation, 'id' | 'createdAt'> }
  | { type: 'SAVE_JOURNAL'; entry: Omit<JournalEntry, 'id' | 'createdAt'> }
  | { type: 'RECORD_MOMENT'; foundations: FoundationId[]; insight: string }
  | { type: 'DISMISS_WARDEN'; messageId: string }
  | { type: 'BYPASS_WARDEN'; foundation: FoundationId; phase: PhaseType }
  | { type: 'RECORD_TIME'; foundation: FoundationId; ms: number }
  | { type: 'MARK_PHASE_COMPLETE'; foundation: FoundationId; phase: PhaseType };

// ─── Canvas System ─────────────────────────────────────
export type ParamValue = number | string | boolean;

export interface CanvasRenderer {
  id: string;
  type: VizType;
  init(container: HTMLElement, params: Map<string, ParamValue>): void;
  render(time: number, params: Map<string, ParamValue>): void;
  resize(width: number, height: number): void;
  destroy(): void;
  onPointerDown?(x: number, y: number): void;
  onPointerMove?(x: number, y: number): void;
  onPointerUp?(): void;
  onParamChange?(name: string, value: ParamValue): void;
}

export interface AudioRenderer extends CanvasRenderer {
  type: 'audio';
  getFrequencyData(): Float32Array;
  setFrequency(hz: number): void;
  setWaveform(type: 'sine' | 'square' | 'triangle' | 'sawtooth'): void;
  play(): void;
  stop(): void;
}

// ─── Narrative ─────────────────────────────────────────
export interface WonderStory {
  foundationId: FoundationId;
  title: string;
  body: string;
  voiceTone: string;
  keyImage: string;
}

export interface HundredVoicesBridge {
  foundationId: FoundationId;
  literaryVoice: string;
  connectionType: string;
  description: string;
}

export interface ReflectionPrompt {
  id: string;
  foundationId?: FoundationId;
  prompt: string;
  followUp?: string;
}

// ─── Telescope ─────────────────────────────────────────
export type TelescopeChain = 'math' | 'nature' | 'skill-creator' | 'hundred-voices';

export interface TelescopeNode {
  foundationId: FoundationId;
  chain: TelescopeChain;
  label: string;
  description: string;
}

// ─── Garden ────────────────────────────────────────────
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

// ─── Skill-Creator Bridge ──────────────────────────────
export interface SkillCreatorBridgeConfig {
  foundations: Record<FoundationId, SkillCreatorMapping>;
  complexPlane: {
    computeActivation(theta: number, r: number): number;
    computeConcreteProjection(theta: number): number;
    computeAbstractProjection(theta: number): number;
  };
}

// ─── Utility Types ─────────────────────────────────────
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
