/**
 * Anytime-valid testing primitives — public API.
 *
 * Provides a martingale-based e-process for sequential hypothesis testing
 * that controls Type-I error under optional stopping (Ville's inequality).
 * Consumed by JP-002 (CAPCOM gate, Wave 1) and JP-029 (A/B harness, Wave 3).
 *
 * Reference: arXiv:2604.21851 — Betting on Bets: Anytime-Valid Tests for
 * Stochastic Dominance.
 *
 * @module anytime-valid
 */

// Types
export type {
  EProcess,
  EProcessConfig,
  EProcessResult,
  Type1Bound,
  OptionalStoppingPolicy,
  CreateEProcess,
} from './types.js';

// Factory + implementation
export { createEProcess } from './e-process.js';
