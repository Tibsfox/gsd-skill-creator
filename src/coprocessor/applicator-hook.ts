/**
 * Coprocessor applicator hook — pre-warms GPU math chips for loaded skills
 * that declare a `coprocessor:` frontmatter block.
 *
 * Strictly additive and default-off. The global flag
 * `gsd-skill-creator.coprocessor.enabled` in `.claude/settings.json`
 * gates the whole module. When the flag is false, the hook short-circuits
 * and the pipeline is byte-identical to a build that never imported it.
 *
 * When enabled, the stage scans each loaded skill's frontmatter for a
 * `coprocessor:` entry (either an array shorthand of chip names or an
 * explicit spec object), calls `activateCoprocessor()`, and attaches the
 * result to the session report. A failed activation is logged and ignored
 * — it never blocks skill loading.
 *
 * @module coprocessor/applicator-hook
 */

import { readFileSync } from 'node:fs';
import type { PipelineStage, PipelineContext } from '../application/skill-pipeline.js';
import { activateCoprocessor, parseCoprocessorSpec } from './activation.js';
import type { ChipName } from './types.js';

/**
 * Read the global opt-in flag from `.claude/settings.json`. Default false.
 * Missing file, malformed JSON, or missing scope all return false — no
 * throws, no warnings.
 */
export function readCoprocessorEnabledFlag(settingsPath: string): boolean {
  try {
    const raw = readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(raw);
    const scope = settings?.['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return false;
    const coprocessor = (scope as Record<string, unknown>).coprocessor;
    if (!coprocessor || typeof coprocessor !== 'object') return false;
    const enabled = (coprocessor as Record<string, unknown>).enabled;
    return enabled === true;
  } catch {
    return false;
  }
}

/**
 * Extract a YAML-frontmatter block from a skill file's raw text. Matches
 * the format `---\n<yaml>\n---\n...body`. Returns a plain object parsed
 * from the frontmatter, or null if none is present.
 *
 * Only handles the subset we need for `coprocessor:` declarations — array
 * shorthand (`coprocessor: [algebrus, statos]`) or a simple object with
 * `required`, `precision`, `cpu_fallback`. No multi-line scalars, no YAML
 * anchors. Delegates parsing to a local micro-parser so we don't pull in
 * a full YAML dep just for this hook.
 */
export function extractCoprocessorRaw(content: string): unknown {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return undefined;
  const fm = fmMatch[1];
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^coprocessor\s*:\s*(.*)$/);
    if (!match) continue;
    const after = match[1].trim();
    if (after.startsWith('[')) {
      // Inline array
      const end = after.lastIndexOf(']');
      if (end === -1) return undefined;
      const inner = after.slice(1, end);
      return inner
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    if (after === '' || after.startsWith('#')) {
      // Block-style object — scan subsequent indented lines
      const obj: Record<string, unknown> = {};
      for (let j = i + 1; j < lines.length; j++) {
        const indentMatch = lines[j].match(/^ {2,4}(\w+)\s*:\s*(.*)$/);
        if (!indentMatch) break;
        const [, key, rawValue] = indentMatch;
        const value = rawValue.trim();
        if (value.startsWith('[')) {
          const end = value.lastIndexOf(']');
          obj[key] = value
            .slice(1, end)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        } else if (value === 'true' || value === 'false') {
          obj[key] = value === 'true';
        } else {
          obj[key] = value.replace(/^["']|["']$/g, '');
        }
      }
      return obj;
    }
    // Single scalar — not a valid coprocessor spec, ignore
    return undefined;
  }
  return undefined;
}

export interface CoprocessorHookResult {
  skillName: string;
  requested: ChipName[];
  available: ChipName[];
  missing: ChipName[];
  error?: string;
}

export interface CoprocessorStageOptions {
  /**
   * Optional override for resolving skill content by name. When omitted,
   * the stage reads from `context.contentCache`, which is populated by
   * `BudgetStage` before `LoadStage`. Override is useful for tests.
   */
  readSkillContent?: (name: string, context: PipelineContext) => string | undefined;
  /** Collector for per-skill activation results. Optional — useful for telemetry. */
  onResult?: (result: CoprocessorHookResult) => void;
}

/**
 * Create a PipelineStage that processes loaded skills. Add this to the
 * pipeline AFTER `LoadStage` (so `context.loaded` is populated and the
 * content cache is filled).
 */
export function createCoprocessorStage(opts: CoprocessorStageOptions = {}): PipelineStage {
  const reader = opts.readSkillContent ?? ((name, ctx) => ctx.contentCache.get(name));
  return {
    name: 'coprocessor',
    async process(context: PipelineContext): Promise<PipelineContext> {
      if (context.earlyExit) return context;
      for (const skillName of context.loaded) {
        const content = reader(skillName, context);
        if (!content) continue;
        const raw = extractCoprocessorRaw(content);
        const spec = parseCoprocessorSpec(raw);
        if (!spec || !spec.required || spec.required.length === 0) continue;
        try {
          const { available, missing } = await activateCoprocessor(spec);
          opts.onResult?.({
            skillName,
            requested: spec.required,
            available,
            missing,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          opts.onResult?.({
            skillName,
            requested: spec.required,
            available: [],
            missing: spec.required,
            error: message,
          });
        }
      }
      return context;
    },
  };
}
