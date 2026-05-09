/**
 * Foundational chipset composer.
 *
 * Reads the 5 member cartridge manifests (markup-lineage, svg-substrate,
 * code-svg-hdl-bridge, dashboard-lod-rendering, retrieval-provenance) and
 * assembles the foundational chipset manifest + composition DAG conforming
 * to {@link CartridgeManifest} and {@link CompositionGraph}.
 *
 * The foundational chipset is THIN — it just declares the categorical sum
 * of its members. Member cartridges remain authoritative for their content
 * (substrate respect).
 *
 * @module scribe/cartridge-composition/compose-chipset
 */

import type {
  CartridgeManifest,
  CompositionGraph,
  CompositionNode,
  CompositionEdge,
} from '../types/cartridge-manifest.js';
import { CartridgeCompositionError } from '../types/errors.js';

/**
 * Member-cartridge declarations consumed by the composer. Each entry mirrors
 * the source-of-truth in `examples/cartridges/*` — track marker, name,
 * version, and the (possibly empty) `composes_with` list extracted from each
 * cartridge's own manifest.
 *
 * Substrate decision: T2 ships without a top-level `manifest.json` (only
 * sub-component validators / animations / latex-to-svg / primitives). Its
 * canonical version is taken from the sibling pattern (T1 = 1.0.0, T3 = 1.0.0,
 * T5 = 1.0.0); T4's manifest declares 0.1.0. We preserve those substrate
 * decisions verbatim — the composer does NOT invent versions for cartridges
 * that lack manifests; it pins T2 at 1.0.0 to match the convoy convention.
 */
export interface ComposeChipsetInput {
  readonly chipsetName: string;
  readonly mission: string;
  readonly milestone: string;
  readonly chipsetVersion: string;
  readonly members: ReadonlyArray<MemberDeclaration>;
  readonly summary: string;
  readonly license: string;
  readonly scribeNamespace: string;
}

export interface MemberDeclaration {
  readonly name: string;
  readonly track: string;
  readonly version: string;
  /** composes_with from the member's own manifest. */
  readonly composesWith: ReadonlyArray<string>;
}

export interface ComposeChipsetResult {
  readonly manifest: CartridgeManifest;
  readonly graph: CompositionGraph;
}

/**
 * Compose the foundational chipset.
 *
 * @throws {CartridgeCompositionError} when a `composes_with` edge points to a
 *   non-member, when a duplicate cartridge name appears, or when the
 *   resulting DAG would contain a cycle.
 */
export function composeFoundationalChipset(
  input: ComposeChipsetInput,
): ComposeChipsetResult {
  const members = [...input.members];
  const memberNames = new Set<string>();
  for (const m of members) {
    if (memberNames.has(m.name)) {
      throw new CartridgeCompositionError(
        `Duplicate member cartridge: ${m.name}`,
        'duplicate-name',
        { cartridge: m.name },
      );
    }
    memberNames.add(m.name);
  }

  // Build composition graph nodes (sorted by name for idempotency).
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
  const nodes: CompositionNode[] = sortedMembers.map((m) => ({
    name: m.name,
    track: m.track,
    version: m.version,
  }));

  // Build edges from composes_with declarations (sorted by from/to for idempotency).
  const edges: CompositionEdge[] = [];
  for (const m of sortedMembers) {
    for (const target of [...m.composesWith].sort()) {
      if (!memberNames.has(target)) {
        throw new CartridgeCompositionError(
          `Member cartridge ${m.name} composes_with non-member ${target}`,
          'missing-member',
          { from: m.name, to: target },
        );
      }
      edges.push({ from: m.name, to: target });
    }
  }

  // Cycle check via DFS (recursion-stack colouring).
  detectCycle(memberNames, edges);

  const manifest: CartridgeManifest = {
    name: input.chipsetName,
    version: input.chipsetVersion,
    kind: 'chipset',
    mission: input.mission,
    milestone: input.milestone,
    summary: input.summary,
    license: input.license,
    scribe_namespace: input.scribeNamespace,
    role: 'foundational',
    composes: sortedMembers.map((m) => m.name),
  };

  const graph: CompositionGraph = {
    version: '1.0.0',
    chipset: input.chipsetName,
    milestone: input.milestone,
    algebra: 'sum',
    nodes,
    edges,
  };

  return { manifest, graph };
}

/**
 * Throw `CartridgeCompositionError('cycle-detected')` if any directed cycle
 * exists. Iterative DFS using WHITE/GREY/BLACK colouring.
 */
function detectCycle(
  nodes: ReadonlySet<string>,
  edges: ReadonlyArray<CompositionEdge>,
): void {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n, []);
  for (const e of edges) adj.get(e.from)!.push(e.to);

  const WHITE = 0,
    GREY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const n of nodes) color.set(n, WHITE);

  function visit(start: string): void {
    const stack: Array<{ node: string; iter: Iterator<string> }> = [];
    color.set(start, GREY);
    stack.push({ node: start, iter: adj.get(start)![Symbol.iterator]() });
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const next = top.iter.next();
      if (next.done) {
        color.set(top.node, BLACK);
        stack.pop();
        continue;
      }
      const child = next.value;
      const c = color.get(child) ?? WHITE;
      if (c === GREY) {
        throw new CartridgeCompositionError(
          `Cycle detected in cartridge composition: ${top.node} -> ${child}`,
          'cycle-detected',
          { from: top.node, to: child },
        );
      }
      if (c === WHITE) {
        color.set(child, GREY);
        stack.push({ node: child, iter: adj.get(child)![Symbol.iterator]() });
      }
    }
  }

  for (const n of nodes) {
    if (color.get(n) === WHITE) visit(n);
  }
}
