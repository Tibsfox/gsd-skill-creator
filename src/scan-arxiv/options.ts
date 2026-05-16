// === scan-arxiv CLI option parser and resolver ===
//
// Parses raw argv into ScanArxivOptions, resolves defaults,
// and computes the previous completed month for default --month.

import type { ScanArxivOptions, ResolvedScanArxivOptions } from './types.js';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TOP,
  DEFAULT_MIN_SCORE,
  DEFAULT_OUTPUT_DIR,
  isValidMonth,
} from './types.js';

// === Exported Types ===

export interface ParsedArgv {
  options: ScanArxivOptions;
  unknownFlags: string[];
  helpRequested: boolean;
  errors: string[];
}

// === Public API ===

/**
 * Parse raw argv (process.argv.slice(2)) into structured options.
 * Unknown flags are collected in `unknownFlags` rather than thrown.
 * Validation errors are collected in `errors`.
 */
export function parseArgv(argv: string[]): ParsedArgv {
  const options: ScanArxivOptions = {};
  const unknownFlags: string[] = [];
  const errors: string[] = [];
  let helpRequested = false;

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];

    switch (flag) {
      case '--help':
      case '-h':
        helpRequested = true;
        break;

      case '--month': {
        if (!next || next.startsWith('--')) {
          errors.push(`--month requires a value (e.g. --month 2026-05)`);
          break;
        }
        if (!isValidMonth(next)) {
          errors.push(`--month value "${next}" is not a valid YYYY-MM month`);
        }
        options.month = next;
        i++;
        break;
      }

      case '--top': {
        if (!next || next.startsWith('--')) {
          errors.push(`--top requires a value (e.g. --top 30)`);
          break;
        }
        const n = parseInt(next, 10);
        if (isNaN(n) || n < 1) {
          errors.push(`--top value "${next}" must be a positive integer`);
        }
        options.top = n;
        i++;
        break;
      }

      case '--dry-run':
        options.dryRun = true;
        break;

      case '--categories': {
        if (!next || next.startsWith('--')) {
          errors.push(`--categories requires a value (e.g. --categories cs.AI,cs.CL)`);
          break;
        }
        options.categories = next.split(',').map(s => s.trim()).filter(Boolean);
        i++;
        break;
      }

      case '--min-score': {
        if (!next || next.startsWith('--')) {
          errors.push(`--min-score requires a value (e.g. --min-score 0.5)`);
          break;
        }
        const f = parseFloat(next);
        if (isNaN(f) || f < 0 || f > 1) {
          errors.push(`--min-score value "${next}" must be a float between 0 and 1`);
        }
        options.minScore = f;
        i++;
        break;
      }

      case '--no-cache':
        options.noCache = true;
        break;

      case '--output-dir': {
        if (!next || next.startsWith('--')) {
          errors.push(`--output-dir requires a value (e.g. --output-dir .planning/arxiv-may-funnel/runs)`);
          break;
        }
        options.outputDir = next;
        i++;
        break;
      }

      case '--judge-backend': {
        if (!next || next.startsWith('--')) {
          errors.push(`--judge-backend requires a value (sdk|cli|embedding-only|auto)`);
          break;
        }
        if (next !== 'sdk' && next !== 'cli' && next !== 'embedding-only' && next !== 'auto') {
          errors.push(`--judge-backend value "${next}" must be one of: sdk, cli, embedding-only, auto`);
        } else {
          options.judgeBackend = next;
        }
        i++;
        break;
      }

      case '--pre-rank-top': {
        if (!next || next.startsWith('--')) {
          errors.push(`--pre-rank-top requires a value (e.g. 500)`);
          break;
        }
        const n = parseInt(next, 10);
        if (isNaN(n) || n < 1) {
          errors.push(`--pre-rank-top value "${next}" must be a positive integer`);
        } else {
          options.preRankTop = n;
        }
        i++;
        break;
      }

      case '--pre-rank-threshold': {
        if (!next || next.startsWith('--')) {
          errors.push(`--pre-rank-threshold requires a value (e.g. 0.25)`);
          break;
        }
        const f = parseFloat(next);
        if (isNaN(f) || f < 0 || f > 1) {
          errors.push(`--pre-rank-threshold value "${next}" must be a float between 0 and 1`);
        } else {
          options.preRankThreshold = f;
        }
        i++;
        break;
      }

      case '--cli-max-budget-usd': {
        if (!next || next.startsWith('--')) {
          errors.push(`--cli-max-budget-usd requires a value (e.g. 0.20)`);
          break;
        }
        const f = parseFloat(next);
        if (isNaN(f) || f <= 0) {
          errors.push(`--cli-max-budget-usd value "${next}" must be a positive float`);
        } else {
          options.cliMaxBudgetUsd = f;
        }
        i++;
        break;
      }

      default:
        if (flag.startsWith('-')) {
          unknownFlags.push(flag);
        }
        // Positional args are silently ignored (no positional args defined for this command)
        break;
    }
  }

  return { options, unknownFlags, helpRequested, errors };
}

/**
 * Resolve a (possibly partial) ScanArxivOptions into fully-specified
 * ResolvedScanArxivOptions with all defaults filled in.
 */
export function resolveOptions(opts: ScanArxivOptions): ResolvedScanArxivOptions {
  return {
    month: opts.month ?? previousCompletedMonth(new Date()),
    top: opts.top ?? DEFAULT_TOP,
    dryRun: opts.dryRun ?? false,
    categories: opts.categories ?? [...DEFAULT_CATEGORIES],
    minScore: opts.minScore ?? DEFAULT_MIN_SCORE,
    noCache: opts.noCache ?? false,
    outputDir: opts.outputDir ?? DEFAULT_OUTPUT_DIR,
    judgeBackend: opts.judgeBackend ?? 'auto',
    cliMaxBudgetUsd: opts.cliMaxBudgetUsd ?? 0.20,
    preRankTop: opts.preRankTop ?? 100,
    preRankThreshold: opts.preRankThreshold ?? 0.35,
  };
}

/**
 * Returns the most recently completed calendar month as "YYYY-MM".
 * "Completed" means the month has fully ended — the current month is
 * still in progress so we return the one before it.
 *
 * previousCompletedMonth(new Date('2026-05-16')) === '2026-04'
 */
export function previousCompletedMonth(now: Date): string {
  // Use UTC to avoid TZ-dependent day/month shifts.
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed: Jan=0 … Dec=11

  // Previous month: if January → December of prior year.
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;

  const mm = String(prevMonth + 1).padStart(2, '0');
  return `${prevYear}-${mm}`;
}

/**
 * Return help text formatted to match other src/commands/* CLIs.
 */
export function formatHelpText(): string {
  return `
scan-arxiv — fetch and rank arxiv papers for sc:learn ingestion

USAGE
  npx tsx src/commands/scan-arxiv.ts [options]

OPTIONS
  --month <YYYY-MM>       Target month to scan (default: previous completed month)
  --top <N>               Number of top-ranked papers to queue (default: 30)
  --dry-run               Skip LLM fine-ranking; only fetch + embed pre-rank
  --categories <list>     Comma-separated arxiv categories (default: cs.AI,cs.CL,cs.LG,cs.MA,cs.SE)
  --min-score <float>     Drop candidates with aggregate score below this threshold (default: 0.5)
  --no-cache              Bypass arxiv API response cache
  --output-dir <path>     Directory to write run artifacts (default: .planning/arxiv-may-funnel/runs)
  --judge-backend <name>  Judge backend: sdk (uses ANTHROPIC_API_KEY), cli (uses local
                          \`claude\` Code OAuth session), embedding-only (skip LLM; cosine
                          sims to domain anchors as subscores), or auto (default: pick sdk
                          if ANTHROPIC_API_KEY is set, else cli)
  --cli-max-budget-usd <f> Per-call USD cap when --judge-backend=cli (default: 0.20)
  --pre-rank-top <N>      Max papers to fine-rank after embedding pre-rank (default: 100)
  --pre-rank-threshold <f> Min cosine sim to anchor to pass pre-rank (default: 0.35)
  --help, -h              Print this help text

EXAMPLES
  npx tsx src/commands/scan-arxiv.ts --month 2026-04
  npx tsx src/commands/scan-arxiv.ts --top 50 --dry-run
  npx tsx src/commands/scan-arxiv.ts --categories cs.AI,cs.CL --min-score 0.6
  npx tsx src/commands/scan-arxiv.ts --judge-backend cli --top 10
`.trimStart();
}
