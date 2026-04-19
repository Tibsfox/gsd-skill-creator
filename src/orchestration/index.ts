/**
 * M5 — orchestration barrel exports.
 *
 * @module orchestration
 */
export type {
  Candidate,
  SelectorDecision,
  SelectorOptions,
} from './selector.js';
export { ActivationSelector, select } from './selector.js';

export type {
  RetrievalDocument,
  RetrievalOptions,
  TurnResult,
  RetrievalResult,
} from './retrieval-loop.js';
export { retrieve, retrieveSingleTurn } from './retrieval-loop.js';
