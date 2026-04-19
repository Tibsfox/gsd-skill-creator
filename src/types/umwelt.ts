/**
 * Living Sensoria M7 types — Markov blanket + variational free energy.
 *
 * Wave 0.1 of the Living Sensoria milestone (v1.49.561). Types only;
 * the minimiser, prediction channel, and action policy land in Phase 640
 * (Wave 1 Track B).
 *
 * Sources: Friston 2010 "The free-energy principle: a unified brain theory?"
 * (Nat Rev Neurosci); Friston et al. 2013 "The anatomy of choice: active
 * inference and agency" (Front Hum Neurosci); Kirchhoff et al. 2018
 * "The Markov blankets of life" (J R Soc Interface 15:20170792).
 *
 * @module types/umwelt
 */

/**
 * Branded-type helper: tags a structural type with a nominal brand so the
 * TypeScript compiler rejects cross-category assignments. Used to enforce the
 * Markov-blanket partition {S, A, I, E} at compile time per Kirchhoff 2018.
 */
type Brand<T, B> = T & { readonly __brand: B };

/**
 * Sensory states — influenced by External but not by Internal. How the world
 * impinges on the skill-creator: commands executed, files touched, corrections
 * issued by the developer.
 */
export type SensoryState = Brand<
  { observations: string[]; ts: number },
  'Sensory'
>;

/**
 * Active states — influenced by Internal but not by External. How the
 * skill-creator acts on the world: suggestions, auto-activations, branch
 * forks, refinement proposals.
 */
export type ActiveState = Brand<
  { actions: string[]; ts: number },
  'Active'
>;

/**
 * Internal states — the generative model. Encodes a probabilistic model of
 * External (developer intent) given Sensory (session observations).
 */
export type InternalState = Brand<
  { intentDist: Record<string, number> },
  'Internal'
>;

/**
 * External-observation proxy — stand-in for the unobservable developer mind
 * and workflow intent. Can only be referenced indirectly through Sensory
 * and Active states.
 */
export type ExternalObservationProxy = Brand<
  { proxyOf: string },
  'External'
>;

/**
 * Small categorical generative model over intent classes × observation
 * types. Populated online from observation history with priors from M1
 * community structure (Phase 640.2).
 */
export interface GenerativeModel {
  intentClasses: string[];
  /** condProbTable[i][j] = p(observation_j | intent_i). Rows sum to 1. */
  condProbTable: number[][];
  priors: number[];
}

/**
 * Variational free-energy evaluation result. F = epistemic + pragmatic,
 * where epistemic measures model fit to Sensory and pragmatic measures
 * expected fit of future Active to the model.
 */
export interface FreeEnergyResult {
  F: number;
  epistemic: number;
  pragmatic: number;
  converged: boolean;
  iters: number;
}

/**
 * Single surprise-channel entry. KL-divergence between predicted and
 * actual observation distribution. Triggered flag set when sigma exceeds
 * configurable threshold (default 3σ).
 */
export interface SurpriseEntry {
  ts: number;
  klDivergence: number;
  sigma: number;
  triggered: boolean;
}
