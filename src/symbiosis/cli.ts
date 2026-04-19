/**
 * M8 Symbiosis — CLI subcommands
 *
 * Provides three entry points:
 *   skill-creator teach             — append a teaching entry (structured editor)
 *   skill-creator co-evolution      — run co-evolution pass + report
 *   skill-creator quintessence      — show Quintessence narrative report
 *
 * All output is plain text or JSONL; no dashboards.
 *
 * @module symbiosis/cli
 */

import {
  appendTeachEntry,
  readTeachEntries,
  TEACH_CATEGORIES,
  type AppendTeachOptions,
} from './teaching.js';
import {
  runCoEvolutionPass,
  readOfferings,
  type SessionRecord,
  type CoEvolutionSettings,
  CO_EVOLUTION_LEDGER_DEFAULT,
} from './coEvolution.js';
import {
  computeQuintessenceSnapshot,
  narrativeReport,
  MockCommunitySource,
  MockTensionSource,
  MockEnergySource,
  MockStabilitySource,
  MockFatefulSource,
} from './quintessence.js';
import type { TeachCategory } from '../types/symbiosis.js';

export type Logger = (line: string) => void;

const noop: Logger = () => { /* intentionally empty */ };
const stdlog: Logger = (line) => { console.log(line); };

// ─── teach ───────────────────────────────────────────────────────────────────

export interface TeachCliOptions {
  /** Teaching category (required). */
  category?: string;
  /** Free-text content (required). */
  content?: string;
  /** Space-separated M3 trace IDs or skill IDs to attach. */
  refs?: string[];
  /** Override ledger path. */
  ledgerPath?: string;
  /** Override timestamp (testing). */
  now?: number;
  /** JSON output mode. */
  json?: boolean;
  logger?: Logger;
}

const TEACH_HELP = `skill-creator teach — append a developer-to-system teaching entry

Usage:
  skill-creator teach --category=<type> --content=<text> [--refs=<id,...>] [--json]

Categories:
  correction     Override incorrect system behaviour
  clarification  Define repo-local terminology
  constraint     Declare something to never do
  pattern        Encode a repeated check
  preference     Express a stylistic lean

Options:
  --category=<type>    Required. One of the five categories above.
  --content=<text>     Required. Free-text explanation (max 10 KiB).
  --refs=<id,...>      Comma-separated M3 trace IDs or skill IDs to attach.
  --json               Output result as JSON.

Examples:
  skill-creator teach --category=constraint --content="Never import from desktop/ in src/"
  skill-creator teach --category=correction --content="M6 should not fire on test files" --refs=trace-001
  skill-creator teach --category=preference --content="Prefer explicit error types over unknown"
  skill-creator teach --category=clarification --content="'skill' means a markdown file in .claude/skills/"
  skill-creator teach --category=pattern --content="Always run npx tsc --noEmit before committing"
`;

export async function teachCliCommand(
  args: string[],
  opts: TeachCliOptions = {},
): Promise<number> {
  const log = opts.logger ?? stdlog;

  if (args.includes('--help') || args.includes('-h')) {
    log(TEACH_HELP);
    return 0;
  }

  // Parse flags from args if not directly provided in opts
  const category = opts.category ?? parseFlag(args, '--category');
  const content = opts.content ?? parseFlag(args, '--content');
  const refsFlag = parseFlag(args, '--refs');
  const refs = opts.refs ?? (refsFlag ? refsFlag.split(',').map((r) => r.trim()).filter(Boolean) : []);
  const json = opts.json ?? args.includes('--json');

  if (!category) {
    log('Error: --category is required');
    log(`Valid categories: ${[...TEACH_CATEGORIES].join(', ')}`);
    return 1;
  }

  if (!TEACH_CATEGORIES.has(category as TeachCategory)) {
    log(`Error: unknown category "${category}"`);
    log(`Valid categories: ${[...TEACH_CATEGORIES].join(', ')}`);
    return 1;
  }

  if (!content) {
    log('Error: --content is required');
    return 1;
  }

  const appendOpts: AppendTeachOptions = {};
  if (opts.ledgerPath) appendOpts.ledgerPath = opts.ledgerPath;
  if (opts.now !== undefined) appendOpts.now = opts.now;

  const result = appendTeachEntry(category as TeachCategory, content, refs, appendOpts);

  if (!result.ok) {
    if (json) {
      log(JSON.stringify({ ok: false, error: result.error }));
    } else {
      log(`Error: ${result.error}`);
    }
    return 1;
  }

  if (json) {
    log(JSON.stringify({ ok: true, id: result.id, category, refs }));
  } else {
    log(`Teaching entry recorded [${result.id}]`);
    log(`  category: ${category}`);
    if (refs.length > 0) log(`  refs:     ${refs.join(', ')}`);
  }

  return 0;
}

// ─── co-evolution ────────────────────────────────────────────────────────────

export interface CoEvolutionCliOptions {
  /** Fixture of session records (injected for testing). */
  sessions?: SessionRecord[];
  /** Override settings. */
  settings?: Partial<CoEvolutionSettings>;
  /** Override ledger path. */
  ledgerPath?: string;
  /** Show last N offerings from ledger instead of running a pass. */
  listLast?: number;
  /** JSON output. */
  json?: boolean;
  logger?: Logger;
}

const CO_EVOLUTION_HELP = `skill-creator co-evolution — run M8 co-evolution pass

Usage:
  skill-creator co-evolution [--enabled] [--cadence=N] [--json] [--list]

Options:
  --enabled           Opt-in gate. Without this, zero offerings are emitted (SC-CONSENT).
  --cadence=N         Override session cadence (default: 20).
  --list              Print the last 10 offerings from the ledger; do not run a scan.
  --json              Machine-readable JSON output.

Examples:
  skill-creator co-evolution --enabled
  skill-creator co-evolution --enabled --cadence=10
  skill-creator co-evolution --list
  skill-creator co-evolution --list --json
  skill-creator co-evolution --enabled --json
`;

export async function coEvolutionCliCommand(
  args: string[],
  opts: CoEvolutionCliOptions = {},
): Promise<number> {
  const log = opts.logger ?? stdlog;

  if (args.includes('--help') || args.includes('-h')) {
    log(CO_EVOLUTION_HELP);
    return 0;
  }

  const json = opts.json ?? args.includes('--json');
  const list = args.includes('--list');
  const ledgerPath = opts.ledgerPath ?? CO_EVOLUTION_LEDGER_DEFAULT;

  if (list) {
    const offerings = readOfferings(ledgerPath).slice(-10);
    if (json) {
      log(JSON.stringify(offerings, null, 2));
    } else {
      if (offerings.length === 0) {
        log('No co-evolution offerings on record.');
      } else {
        log(`Last ${offerings.length} co-evolution offering(s):`);
        for (const o of offerings) {
          log(`  [${o.kind}] ${o.content}`);
          log(`    sources: ${o.sourcePointers.join(', ')}`);
        }
      }
    }
    return 0;
  }

  const enabled = opts.settings?.enabled ?? args.includes('--enabled');
  const cadenceFlag = parseFlag(args, '--cadence');
  const cadence = cadenceFlag ? parseInt(cadenceFlag, 10) : (opts.settings?.cadenceSessionCount ?? 20);

  const settings: Partial<CoEvolutionSettings> = { ...opts.settings, enabled, cadenceSessionCount: cadence };

  const sessions: SessionRecord[] = opts.sessions ?? [];

  const newOfferings = runCoEvolutionPass(sessions, settings, ledgerPath);

  if (json) {
    log(JSON.stringify({ enabled, offeringsEmitted: newOfferings.length, offerings: newOfferings }, null, 2));
  } else {
    if (!enabled) {
      log('Co-evolution pass disabled (use --enabled to opt in). Zero offerings emitted.');
    } else if (newOfferings.length === 0) {
      log('Co-evolution pass complete. No new offerings generated.');
    } else {
      log(`Co-evolution pass complete. ${newOfferings.length} new offering(s) appended to ledger:`);
      for (const o of newOfferings) {
        log(`  [${o.kind}] ${o.content}`);
      }
    }
  }

  return 0;
}

// ─── quintessence ────────────────────────────────────────────────────────────

export interface QuintessenceCliOptions {
  /** JSON output. */
  json?: boolean;
  /** Override timestamp (testing). */
  now?: number;
  logger?: Logger;
}

const QUINTESSENCE_HELP = `skill-creator quintessence — display 5-axis Quintessence metric report

Usage:
  skill-creator quintessence [--json]

Options:
  --json    Machine-readable JSON output.

Axes (Lanzara & Kuperstein 1991, adapted):
  1. Self-vs-Non-Self        Fraction of project-unique M1 community memberships
  2. Essential Tensions      Override-ratio + 20%-bound-hit ratio (homeostatic tension)
  3. Growth-and-Energy-Flow  Rolling tokens per productive outcome (negentropy proxy)
  4. Stability-vs-Novelty    Trunk-preserved / branch-committed session ratio
  5. Fateful Encounters      Count of M3 decisions with high retrospective impact

Examples:
  skill-creator quintessence
  skill-creator quintessence --json
`;

export async function quintessenceCliCommand(
  args: string[],
  opts: QuintessenceCliOptions = {},
): Promise<number> {
  const log = opts.logger ?? stdlog;

  if (args.includes('--help') || args.includes('-h')) {
    log(QUINTESSENCE_HELP);
    return 0;
  }

  const json = opts.json ?? args.includes('--json');
  const now = opts.now;

  // Wire mock sources for this phase; real M1–M7 data wired in a later milestone
  const snapshot = computeQuintessenceSnapshot(
    {
      community: new MockCommunitySource(),
      tension: new MockTensionSource(),
      energy: new MockEnergySource(),
      stability: new MockStabilitySource(),
      fateful: new MockFatefulSource(),
    },
    { now },
  );

  if (json) {
    log(JSON.stringify(snapshot, null, 2));
  } else {
    log(narrativeReport(snapshot));
  }

  return 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFlag(args: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const eq = args.find((a) => a.startsWith(prefix));
  if (eq) {
    const v = eq.slice(prefix.length);
    return v || undefined;
  }
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) {
    const v = args[idx + 1];
    if (v && !v.startsWith('-')) return v;
  }
  return undefined;
}

export { noop };
