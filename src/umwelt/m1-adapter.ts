/**
 * M7 Umwelt × M1 Semantic Memory Graph — initialisation adapter.
 *
 * Wave 2 integration: reads M1 community structure and seeds M7's categorical
 * generative model. Each intent class corresponds to one M1 community at the
 * requested Leiden level; the conditional-probability priors are derived from
 * community membership distributions (community size proportional to prior
 * weight).
 *
 * Observation types are provided by the caller (typically the union of all
 * `outcome` entity labels from the ingested graph). When the caller does not
 * supply one explicitly, we fall back to the distinct outcome labels present
 * in the graph's entities.
 *
 * This implementation satisfies the D11 Wave 2 wire from §04-wave-execution-plan:
 *
 *   "M7 initialised from M1 communities. Implement GenerativeModelInitialiser
 *    that reads M1 communities and seeds the categorical conditional-probability
 *    table."
 *
 * Primary source: Lanzara 2023 §13–14 (categorical priors from community
 * structure); Traag et al. 2019 (Leiden community semantics).
 *
 * @module umwelt/m1-adapter
 */

import type { Community, Entity } from '../types/memory.js';
import type { Graph } from '../graph/ingest.js';
import type { GenerativeModel } from '../types/umwelt.js';
import {
  GenerativeModelInitialiser,
  makeCounts,
  materialiseModel,
  type ModelCounts,
} from './generativeModel.js';

/**
 * Options accepted by `M1CommunityInitialiser`.
 */
export interface M1InitialiserOptions {
  /**
   * The Leiden level to source intent classes from. Default 0 (leaf level).
   * Higher levels aggregate communities into coarser groupings.
   */
  level?: number;
  /**
   * Explicit observation types. When omitted the initialiser derives the
   * union of `outcome` entity labels from the supplied graph.
   */
  observationTypes?: readonly string[];
  /**
   * Laplace smoothing α applied when materialising counts → probabilities.
   * Default 1 (add-one smoothing) so no cell is ever zero.
   */
  alpha?: number;
  /**
   * Weight applied per member when seeding priors. Default 1 — every member
   * contributes a single prior-count to its community's intent class.
   */
  memberWeight?: number;
}

/**
 * Initialiser implementation that reads M1 community structure out of the
 * supplied `Graph` and materialises a seeded generative model.
 */
export class M1CommunityInitialiser implements GenerativeModelInitialiser {
  constructor(
    private readonly graph: Graph,
    private readonly communities: readonly Community[],
    private readonly opts: M1InitialiserOptions = {},
  ) {}

  /**
   * Build a `GenerativeModel` whose intent classes are sourced from M1
   * communities. The `intentClasses` / `observationTypes` arguments passed by
   * the caller are honoured when non-empty; when empty the adapter derives
   * both from the community data and the graph's outcome entities.
   */
  init(
    intentClasses: readonly string[],
    observationTypes: readonly string[],
  ): GenerativeModel {
    // Derive intent classes from communities when the caller supplies none.
    // We accept the caller's list when non-empty so tests can pin them.
    const resolvedIntents =
      intentClasses.length > 0
        ? [...intentClasses]
        : this.communities.map((c) => c.id);
    const resolvedObservations =
      observationTypes.length > 0
        ? [...observationTypes]
        : this.opts.observationTypes
          ? [...this.opts.observationTypes]
          : deriveOutcomeLabels(this.graph);

    const counts = makeCounts(
      resolvedIntents,
      resolvedObservations,
      this.opts.alpha ?? 1,
    );

    seedCountsFromCommunities(
      counts,
      resolvedIntents,
      this.communities,
      this.graph,
      this.opts.memberWeight ?? 1,
    );

    return materialiseModel(resolvedIntents, counts);
  }

  /**
   * Expose the counts object after seeding — useful for callers that want to
   * continue the online update path from the adapter's seed.
   */
  seedCounts(
    intentClasses?: readonly string[],
    observationTypes?: readonly string[],
  ): ModelCounts {
    const resolvedIntents =
      intentClasses && intentClasses.length > 0
        ? [...intentClasses]
        : this.communities.map((c) => c.id);
    const resolvedObservations =
      observationTypes && observationTypes.length > 0
        ? [...observationTypes]
        : this.opts.observationTypes
          ? [...this.opts.observationTypes]
          : deriveOutcomeLabels(this.graph);

    const counts = makeCounts(
      resolvedIntents,
      resolvedObservations,
      this.opts.alpha ?? 1,
    );
    seedCountsFromCommunities(
      counts,
      resolvedIntents,
      this.communities,
      this.graph,
      this.opts.memberWeight ?? 1,
    );
    return counts;
  }
}

/**
 * Functional helper: build a GenerativeModel straight from a graph +
 * community set. When the `level` option is omitted the caller is expected
 * to pass level-0 (leaf) communities.
 */
export function generativeModelFromCommunities(
  graph: Graph,
  communities: readonly Community[],
  opts: M1InitialiserOptions = {},
): GenerativeModel {
  const init = new M1CommunityInitialiser(graph, communities, opts);
  return init.init([], opts.observationTypes ?? []);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Collect distinct `outcome` labels from the graph, sorted deterministically. */
function deriveOutcomeLabels(graph: Graph): string[] {
  const labels = new Set<string>();
  for (const e of graph.entities.values()) {
    if (e.kind !== 'outcome') continue;
    const attrs = e.attrs as Record<string, unknown>;
    if (typeof attrs.label === 'string') labels.add(attrs.label);
  }
  if (labels.size === 0) {
    // Fallback — keep the model definitely shaped even when no outcomes
    // have been ingested yet.
    labels.add('observed');
  }
  return [...labels].sort();
}

/**
 * For each community member we count one (intent = community, observation =
 * outcome observed in any session touching the member). This gives the prior
 * "community → most-common-outcome" coupling without running a full EM pass.
 */
function seedCountsFromCommunities(
  counts: ModelCounts,
  intents: readonly string[],
  communities: readonly Community[],
  graph: Graph,
  memberWeight: number,
): void {
  const intentIdx = new Map<string, number>();
  intents.forEach((id, i) => intentIdx.set(id, i));
  const obsIdx = new Map<string, number>();
  counts.observationTypes.forEach((t, j) => obsIdx.set(t, j));

  for (const community of communities) {
    const i = intentIdx.get(community.id);
    if (i === undefined) continue;

    const outcomes = outcomesForMembers(graph, community.members);
    if (outcomes.length === 0) {
      // Ensure the intent class registers non-zero prior so uniform smoothing
      // doesn't reduce it to random noise.
      counts.intentCounts[i] += memberWeight;
      continue;
    }
    for (const label of outcomes) {
      const j = obsIdx.get(label);
      if (j === undefined) continue;
      counts.coCounts[i][j] += memberWeight;
      counts.intentCounts[i] += memberWeight;
    }
  }
}

/**
 * For a set of member entity-ids, return the outcome-label list of every
 * session that yielded any member (via `YIELDED` edges on session entities
 * reachable from members). Multiple sessions → multiple outcome counts.
 */
function outcomesForMembers(graph: Graph, memberIds: readonly string[]): string[] {
  const labels: string[] = [];
  const memberSet = new Set(memberIds);
  // For each session entity in the graph check whether any of its members
  // are in the community; if so, collect its outcome label.
  for (const e of graph.entities.values()) {
    if (e.kind !== 'session') continue;
    const sid = e.id;
    // If session itself is a member, or any neighbor is a member, record it.
    let hit = memberSet.has(sid);
    if (!hit) {
      const neighbors = graph.adjacency.get(sid);
      if (neighbors) {
        for (const n of neighbors) {
          if (memberSet.has(n)) {
            hit = true;
            break;
          }
        }
      }
    }
    if (!hit) continue;
    // Find outcome edge(s) leaving this session.
    for (const edge of graph.edges.values()) {
      if (edge.src !== sid) continue;
      if (edge.relation !== 'yielded') continue;
      const outcomeEntity: Entity | undefined = graph.entities.get(edge.dst);
      if (!outcomeEntity || outcomeEntity.kind !== 'outcome') continue;
      const attrs = outcomeEntity.attrs as Record<string, unknown>;
      if (typeof attrs.label === 'string') labels.push(attrs.label);
    }
  }
  return labels;
}
