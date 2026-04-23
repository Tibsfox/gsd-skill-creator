/**
 * CASCADE three-tier MCP defense — public API.
 *
 * Default-off module shipped by Phase 714 (v1.49.570 Convergent Substrate).
 * Source paper: Abasikelesh Turgut et al. 2026, arXiv:2604.17125,
 * "CASCADE: A Cascaded Hybrid Defense Architecture for Prompt Injection
 * Detection in MCP-Based Systems".
 *
 * Addresses the tool-poisoning threat identified as the #1 client-side
 * vulnerability in Huang et al. 2026 MCP threat model. All exports are
 * pure functions (Tier 2 hook is caller-provided); nothing runs on import.
 *
 * @module mcp-defense/cascade
 */

export type {
  CascadeTier,
  CascadeInput,
  CascadeDecision,
  CascadeConfig,
  TierResult,
  Tier2Hook,
  KnownAttackPattern,
} from './types.js';

export {
  CASCADE_REPORTED_PRECISION,
  CASCADE_REPORTED_FPR,
  DEFAULT_CONFIG,
} from './types.js';

export {
  KNOWN_ATTACK_PATTERNS,
  shannonEntropy,
  tier1Detect,
  tier3Detect,
} from './detectors.js';

export { runCascade, runCascadeSync } from './cascade.js';
