/**
 * Integration bridge to skill-creator observation pipeline.
 * Phase 407: learn-to-observe, dogfood-report
 */
export { bridgeToObservations, LearnToObserveBridge } from "./learn-to-observe.js";
export type {
  LearnedObservation,
  LearnedObservationType,
  ProvenanceChain,
  BridgeResult,
  BridgeOptions,
} from "./types.js";
