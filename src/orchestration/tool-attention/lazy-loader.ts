/**
 * HB-01 — Two-phase lazy schema loader.
 *
 * Phase 1: emit a compact pool of (name + 1-line description) for *all*
 * known tools. This is what the model always sees.
 *
 * Phase 2: fetch full JSON schemas only for the gated top-k tools, via the
 * caller-supplied `loadFullSchema` callback. The callback is the integration
 * seam to whatever tool registry the planning-bridge MCP currently uses; the
 * substrate makes no assumption about that surface.
 *
 * Default-OFF: returns the disabled-result sentinel when the flag is off.
 *
 * @module orchestration/tool-attention/lazy-loader
 */

import { isToolAttentionEnabled } from './settings.js';
import type {
  CompactToolEntry,
  FullToolEntry,
  LazyLoadOutput,
  LazyLoadDisabled,
  GateOutput,
  GateDisabled,
} from './types.js';

const DISABLED_RESULT: LazyLoadDisabled = Object.freeze({
  compactPool: [] as never[],
  fullSchemas: [] as never[],
  totalTokens: 0 as 0,
  disabled: true,
});

export type SchemaResolver = (
  name: string,
) => Record<string, unknown> | null | undefined;

/**
 * Run the lazy load.
 *
 * @param compactCorpus All known tools in compact form.
 * @param gate Output of `applyStateGate`.
 * @param resolveFullSchema Callback that returns a full JSON schema by name.
 *        Returning `null`/`undefined` means "schema not available" and the
 *        tool is silently dropped from the full-schemas list (still appears
 *        in the compact pool).
 * @param settingsPath Optional config override.
 */
export function lazyLoadSchemas(
  compactCorpus: readonly CompactToolEntry[],
  gate: GateOutput | GateDisabled,
  resolveFullSchema: SchemaResolver,
  settingsPath?: string,
): LazyLoadOutput | LazyLoadDisabled {
  if (!isToolAttentionEnabled(settingsPath)) return DISABLED_RESULT;
  if ('disabled' in gate && gate.disabled === true) return DISABLED_RESULT;

  const compactPool: CompactToolEntry[] = compactCorpus.map((c) => ({
    name: c.name,
    shortDescription: truncateDescription(c.shortDescription),
    fullSchemaTokens: c.fullSchemaTokens,
    compactTokens: c.compactTokens,
  }));

  const byName = new Map<string, CompactToolEntry>();
  for (const c of compactPool) byName.set(c.name, c);

  const fullSchemas: FullToolEntry[] = [];
  const seen = new Set<string>();
  for (const name of (gate as GateOutput).selected) {
    if (seen.has(name)) continue;
    seen.add(name);
    const compact = byName.get(name);
    if (!compact) continue;
    const schema = resolveFullSchema(name);
    if (!schema || typeof schema !== 'object') continue;
    fullSchemas.push({
      ...compact,
      schema,
    });
  }

  const compactTotal = compactPool.reduce((s, c) => s + c.compactTokens, 0);
  const fullTotal = fullSchemas.reduce((s, f) => s + f.fullSchemaTokens, 0);

  return {
    compactPool,
    fullSchemas,
    totalTokens: compactTotal + fullTotal,
  };
}

/**
 * Truncate descriptions to a stable upper bound (one-line discipline). The
 * 80-char floor keeps the compact pool small and stable across model turns.
 */
export function truncateDescription(d: string, max: number = 80): string {
  if (typeof d !== 'string') return '';
  if (d.length <= max) return d;
  return d.slice(0, max - 1) + '…';
}
