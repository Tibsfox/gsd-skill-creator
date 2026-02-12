// Stub -- will be implemented in GREEN phase
export const GSD_LIFECYCLE_EVENTS = [] as const;
export type GsdLifecycleEvent = string;
export const ACTIVATION_MODES = [] as const;
export type ActivationMode = string;
export const MOVE_TARGET_TYPES = [] as const;
export type MoveTargetType = string;
export const SKIP_OPERATORS = [] as const;
export type SkipOperator = string;
export type WaitInstruction = { type: 'wait'; event: string };
export type MoveInstruction = { type: 'move'; target: string; name: string; mode: string };
export type SkipInstruction = { type: 'skip'; condition: unknown };
export type CopperInstruction = WaitInstruction | MoveInstruction | SkipInstruction;
export type CopperMetadata = Record<string, unknown>;
export type CopperList = { metadata: CopperMetadata; instructions: CopperInstruction[] };
