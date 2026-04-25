/**
 * Predictive Skill Loader — shared types (UIP-18 / Phase 770 / CAPCOM Gate G12).
 *
 * Maps the College-of-Knowledge concept graph onto the social-learning-network
 * abstraction from Spatiotemporal Link Formation Prediction in Social Learning
 * Networks (Mohammadiasl et al., arXiv:2604.18888, EDM 2026):
 *
 *   - Network nodes = College skills/concepts (= "learners" in 2604.18888).
 *   - Edges = co-activation links (= "social-learning links").
 *   - Link-formation prediction = which skill is likely to fire next given
 *     the current activation pattern (= which learner-pair will form a link
 *     in the next time-step in the source paper).
 *
 * @module predictive-skill-loader/types
 */

/**
 * Context passed to the predictor at predict-time. Captures the "spatial"
 * (current-skill / department) and "temporal" (recent activations) state of
 * the learning-network slice the operator is currently exercising.
 */
export interface LoadContext {
  /** Recently activated skill ids (newest first). May be empty. */
  recentSkills?: ReadonlyArray<string>;
  /** Time-of-context in epoch-ms. Defaults to caller-supplied or now. */
  ts?: number;
  /** Optional department / domain hint for spatial gating. */
  domain?: string;
  /** Caller-supplied override of the prewarm `top-k`. Default uses settings. */
  topK?: number;
}

/**
 * A single predicted link-formation result. `score` is a unitless ranking
 * value in [0, 1] derived from the GNN message-passing layer. `via` records
 * which channel produced the score so the cache pre-warmer (and tests) can
 * reason about the chain that fired.
 */
export interface SkillPrediction {
  /** Predicted next-skill id (the would-be link endpoint). */
  skillId: string;
  /** Score in [0, 1]. Higher = stronger predicted link formation. */
  score: number;
  /** Multi-hop depth at which this candidate appeared (1 = direct neighbor). */
  hopDepth: number;
  /** Channel that produced the score: 'gnn' or 'disabled'. */
  via: 'gnn' | 'disabled';
}

/**
 * The College-of-Knowledge graph used by the predictor. Built once from the
 * concept .ts files under `.college/departments/*` (read-only).
 */
export interface CollegeGraph {
  /** All node ids, deterministically sorted. */
  nodes: ReadonlyArray<string>;
  /** Adjacency: nodeId -> [neighborId, edgeWeight]. */
  adjacency: ReadonlyMap<string, ReadonlyArray<readonly [string, number]>>;
  /** Map from nodeId -> domain (department) string. */
  domains: ReadonlyMap<string, string>;
}

/**
 * Link-formation model state. Persisted (in memory) between calls to
 * `predictNextSkills` so message-passing isn't repeated for cold contexts.
 */
export interface LinkFormationModel {
  /** The graph the model is bound to. */
  graph: CollegeGraph;
  /** Per-node bias weights (initial activation strength). */
  bias: ReadonlyMap<string, number>;
  /** Hops the message-passing layer iterates over. */
  hops: number;
  /** Decay applied to messages each hop. */
  decay: number;
}

/**
 * Pre-warm hook bridge. The predictive-skill-loader composes via the existing
 * `cache.Preloader` API; this interface declares the structural contract we
 * depend on without importing the concrete class (keeps orchestration
 * untouched and makes tests trivial).
 */
export interface PreWarmHook {
  /** Issue a non-blocking pre-warm request for the given skill ids. */
  preload(skillIds: ReadonlyArray<string>): void;
  /** Whether the underlying cache is enabled (passthrough → no-op when off). */
  isEnabled(): boolean;
}
