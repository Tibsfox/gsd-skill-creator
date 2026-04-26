/**
 * OOPS-GSD v1.49.576 — C6 / OGA-064 (runtime HAL registry expansion)
 *
 * Registry of runtimes the GSD agent can be hosted under. The C6 scope
 * is registration only — adapter implementations beyond `claude-code`
 * are explicitly out of scope per the C6 anti-patterns ("NO Pi runtime
 * adapter implementation — registration only").
 *
 * The 14 upstream runtimes are sourced from the upstream M2 inventory
 * surfaced in `.planning/missions/oops-gsd-implementation/components/06-C6-vendoring-inventory-docs.md`
 * §Inputs. Pi (15th) is the open-source Pi agent registered per OGA-064.
 *
 * @module runtime-hal/runtimes
 */

/**
 * The 14 + 1 = 15 supported runtimes.
 *
 * - `claude-code` — Anthropic's official CLI; the only runtime with a
 *   first-class adapter implementation in this repo.
 * - All others are registered slots; adapters are intentionally deferred
 *   per C6 scope-out.
 */
export const SUPPORTED_RUNTIMES = [
  // 14 upstream slots (M2 inventory)
  'claude-code',
  'opencode',
  'gemini-cli',
  'kilo',
  'codex',
  'copilot',
  'cursor',
  'windsurf',
  'antigravity',
  'augment',
  'trae',
  'qwen-code',
  'cline',
  'codebuddy',
  // 15th: open-source Pi agent (OGA-064)
  'pi',
] as const;

/** A runtime name registered in {@link SUPPORTED_RUNTIMES}. */
export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

/**
 * Adapter implementation status per runtime.
 *
 * `'implemented'` runtimes have a first-class adapter wired into the rest
 * of the codebase. `'registered'` runtimes have only a slot in this file —
 * an adapter implementation is a future work item, not part of C6.
 */
export const RUNTIME_STATUS: Record<SupportedRuntime, 'implemented' | 'registered'> = {
  'claude-code': 'implemented',
  opencode: 'registered',
  'gemini-cli': 'registered',
  kilo: 'registered',
  codex: 'registered',
  copilot: 'registered',
  cursor: 'registered',
  windsurf: 'registered',
  antigravity: 'registered',
  augment: 'registered',
  trae: 'registered',
  'qwen-code': 'registered',
  cline: 'registered',
  codebuddy: 'registered',
  pi: 'registered',
};

/** Returns true if `name` is a known runtime slot in the registry. */
export function isSupportedRuntime(name: string): name is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(name);
}

/** Returns the count of registered runtime slots. Stable for drift tests. */
export function getRuntimeCount(): number {
  return SUPPORTED_RUNTIMES.length;
}
