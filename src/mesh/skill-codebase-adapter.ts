/**
 * SkillCodebaseAdapter — a thin bridge that adapts the Grove-backed
 * `SkillCodebase` to the `SkillStoreContract` used by
 * `SkillCreatorDeps.skillStore` in `skill-creator-mcp.ts`.
 *
 * This is the one knob production callers flip to make
 * gsd-skill-creator use Grove-backed skills instead of the filesystem.
 * No existing code is modified: callers swap `skillStore` via DI.
 *
 *     // Before: filesystem-backed
 *     deps.skillStore = fileSkillStore;
 *
 *     // After: Grove-backed
 *     const cas = new ContentAddressedStore({ arena });
 *     await cas.loadIndex();
 *     const codebase = new SkillCodebase({ cas });
 *     deps.skillStore = new SkillCodebaseAdapter(codebase);
 *
 * Rollback is a single-line DI change. The arena and Grove chunks stay
 * on disk either way; switching back doesn't lose data.
 *
 * # What this adapter does NOT do
 *
 * - Doesn't reimplement `SkillCreatorDeps.testStore` / `resultStore` /
 *   `lifecycleResolver` — those are separate dependencies with their
 *   own interfaces and will be ported in follow-up adapters.
 * - Doesn't handle skill content body on disk — Grove stores the body
 *   inline in the record. Callers that expected `{ path }` to be a
 *   filesystem path should treat it as an opaque identifier (the
 *   adapter returns `arena://<hex>` URIs).
 *
 * @module mesh/skill-codebase-adapter
 */

import { SkillCodebase } from './skill-codebase.js';
import { hashRefToHex } from '../memory/grove-format.js';
import type { SkillStoreContract } from './arena-skill-store.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import type { GroveStore } from '../memory/grove-store.js';
import { RustArena, type InvokeFn } from '../memory/rust-arena.js';
import { createNodeArenaInvoke } from '../memory/node-arena-shim.js';

/**
 * Adapts `SkillCodebase` to the legacy `SkillStoreContract`.
 * Implements the exact three methods `SkillCreatorDeps.skillStore`
 * expects.
 */
export class SkillCodebaseAdapter implements SkillStoreContract {
  constructor(private readonly codebase: SkillCodebase) {}

  /**
   * Create (or update) a skill record. Delegates to `SkillCodebase.define`
   * which writes the record, binds the name, and auto-links the prior
   * version as a parent. Returns a synthetic `arena://<hex>` path so
   * callers don't need to know about arena chunk ids.
   */
  async create(
    skillName: string,
    metadata: { name: string; description: string },
    body: string,
  ): Promise<{ path: string }> {
    if (!skillName || skillName.trim() === '') {
      throw new Error('SkillCodebaseAdapter: skillName must be non-empty');
    }
    if (metadata.name !== skillName) {
      // The legacy contract takes both a `skillName` and a nested
      // `metadata.name`; they're usually the same but not always.
      // We trust `metadata.name` as the in-record display name and
      // use `skillName` as the binding key.
    }
    const result = await this.codebase.define({
      name: metadata.name,
      description: metadata.description,
      body,
      activationPatterns: [],
      dependencies: [],
    });
    return { path: `arena://${hashRefToHex(result.hash)}` };
  }

  /**
   * List every skill name bound in the current namespace.
   */
  async list(): Promise<string[]> {
    return this.codebase.listNames();
  }

  /**
   * Check whether a skill exists by name.
   */
  async exists(skillName: string): Promise<boolean> {
    const resolved = await this.codebase.resolve(skillName);
    return resolved !== null;
  }

  // ─── Extended helpers ────────────────────────────────────────────────────
  //
  // These aren't part of the legacy contract but are useful for callers
  // that want more than the minimum surface while still using the
  // adapter as their primary skill backend.

  /** Expose the underlying codebase for advanced operations. */
  getCodebase(): SkillCodebase {
    return this.codebase;
  }

  /**
   * Return the body of a skill by name. Convenience for callers that
   * used to read SKILL.md directly from disk.
   */
  async getBody(skillName: string): Promise<string | null> {
    const resolved = await this.codebase.resolve(skillName);
    if (!resolved) return null;
    return resolved.spec.body;
  }

  /**
   * Return metadata for a skill by name (name + description).
   */
  async getMetadata(skillName: string): Promise<{ name: string; description: string } | null> {
    const resolved = await this.codebase.resolve(skillName);
    if (!resolved) return null;
    return { name: resolved.spec.name, description: resolved.spec.description };
  }
}

// ─── Bootstrap helpers ──────────────────────────────────────────────────────

/**
 * Options for `createGroveSkillStore` — the one-call bootstrap that
 * produces a production-ready Grove-backed skillStore.
 */
export interface GroveSkillStoreOptions {
  /**
   * Path to the JSON arena snapshot. If the file exists, its contents
   * are loaded; otherwise a fresh arena is created and will be
   * persisted here on first checkpoint.
   */
  arenaPath: string;
  /**
   * Optional override for the InvokeFn. Use this to plug in a live
   * Tauri `invoke` in the desktop app, a mock in tests, or leave it
   * unset to use the Node JSON-snapshot shim (the default).
   */
  invoke?: InvokeFn;
  /**
   * Number of virtual slots the arena should report. Only used by the
   * Node shim; ignored when `invoke` is supplied.
   */
  numSlots?: number;
}

/**
 * One-call bootstrap for wiring Grove-backed skills into
 * `SkillCreatorDeps.skillStore`. This is "the one DI change" that
 * activates the Grove stack in production.
 *
 * The factory:
 *   1. Builds a `RustArena` — either from the Node snapshot shim
 *      (default) or from a caller-supplied Tauri `invoke`.
 *   2. Initializes the arena and loads its chunk index.
 *   3. Constructs a `ContentAddressedStore`, a `SkillCodebase`, and
 *      a `SkillCodebaseAdapter` on top of it.
 *   4. Returns all four so callers can either use just the adapter
 *      (as `deps.skillStore`) or get direct access to the codebase
 *      and arena for advanced operations.
 *
 * # Usage — production wiring
 *
 * ```ts
 * import { createSkillCreatorMcpServerFromDeps } from './skill-creator-mcp.js';
 * import { createGroveSkillStore } from './skill-codebase-adapter.js';
 *
 * const grove = await createGroveSkillStore({ arenaPath: '.grove/arena.json' });
 *
 * const deps: SkillCreatorDeps = {
 *   registry:        ...,
 *   chipTestRunner:  ...,
 *   grader:          ...,
 *   benchmarkRunner: ...,
 *   skillStore:      grove.adapter,   // ← the only change
 *   testStore:       ...,
 *   resultStore:     ...,
 *   lifecycleResolver: ...,
 *   scope:           ...,
 * };
 *
 * const server = createSkillCreatorMcpServerFromDeps(deps);
 * ```
 *
 * # Usage — Tauri desktop wiring
 *
 * ```ts
 * import { invoke } from '@tauri-apps/api/core';
 * const grove = await createGroveSkillStore({
 *   arenaPath: '/var/lib/gsd/arena',
 *   invoke,
 * });
 * ```
 *
 * # Rollback
 *
 * Replace `grove.adapter` with the original filesystem-backed
 * `SkillStore` in the deps object. The arena chunks stay on disk;
 * you can re-enable Grove later without reimporting.
 *
 * @returns An object containing the adapter (drop-in
 *   `SkillStoreContract`), the codebase (for advanced queries),
 *   the content-addressed store (for cross-view record access),
 *   and the arena (for checkpoint / flush / stats).
 */
export async function createGroveSkillStore(
  options: GroveSkillStoreOptions,
): Promise<{
  adapter: SkillCodebaseAdapter;
  codebase: SkillCodebase;
  cas: GroveStore;
  arena: RustArena;
}> {
  const invoke = options.invoke ?? createNodeArenaInvoke({
    snapshotPath: options.arenaPath,
    numSlots: options.numSlots,
  });
  const arena = new RustArena(invoke);
  await arena.init({
    dir: options.arenaPath + '-dir',
    numSlots: options.numSlots ?? 4096,
  });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });
  const adapter = new SkillCodebaseAdapter(codebase);
  return { adapter, codebase, cas, arena };
}
