/**
 * `skill-creator arxiv` / `scan-arxiv` — safe-default router over the
 * scan-arxiv pipeline command (`src/commands/scan-arxiv.ts` `main()`).
 *
 * The bare `main()` defaults to `judgeBackend:'auto'` + `dryRun:false`, so a
 * no-flag invocation would spend LLM budget (`@anthropic-ai/sdk`) or spawn a
 * `claude -p` subprocess in addition to performing live arxiv egress.
 * Promoting that costly default to a first-class CLI command without a guard
 * is a cost/process foot-gun (Ship 3.3 decision: safe default + egress-guard).
 *
 * This router injects a SAFE default: unless the caller explicitly passes
 * `--judge-backend` or opts into the costly path with `--rank`, it forces
 * `--judge-backend embedding-only` — local cosine ranking against the four
 * domain anchors, with NO LLM cost and NO subprocess spawn. The arxiv network
 * egress is guarded separately by the EgressContext threaded into the fetcher
 * (`src/scan-arxiv/fetcher.ts`).
 *
 * Module-reachability: importing `main` here is the dispatch edge that flips
 * the `commands` and `scan-arxiv` modules (and transitively `learn`, via
 * `scan-arxiv/bridge.ts` → `commands/sc-learn.ts`) to reachableFromProduction
 * in the Ship-3.1 reachability scan (Ship 3.3 WIRE-cluster).
 *
 * @module cli/commands/arxiv
 */

import { main as scanArxivMain } from '../../commands/scan-arxiv.js';

const RANK_FLAG = '--rank';
const BACKEND_FLAG = '--judge-backend';

const ROUTER_NOTE = `skill-creator arxiv — fetch + rank arxiv papers for the sc:learn pipeline

Safe by default: without --rank (or an explicit --judge-backend) this runs the
LOCAL embedding ranker only — no LLM billing, no subprocess. Pass --rank to opt
into the cost-bearing LLM fine-rank (judge backend 'auto').

  skill-creator arxiv [--month YYYY-MM] [--top N] [--rank] [scan-arxiv options...]
`;

/**
 * Route `arxiv`/`scan-arxiv` args to the scan-arxiv pipeline with a
 * cost-safe default backend.
 *
 * @param args - CLI args after the command word (e.g. ['--month','2026-04'])
 * @returns process exit code (0 success, 1 error, 2 bad flags)
 */
export async function arxivCommand(args: string[]): Promise<number> {
  const isHelp = args.includes('--help') || args.includes('-h');
  if (isHelp) {
    console.log(ROUTER_NOTE);
    return scanArxivMain(['--help']);
  }

  const hasExplicitBackend = args.includes(BACKEND_FLAG);
  const wantsRank = args.includes(RANK_FLAG);

  // --rank is a router-only flag; scan-arxiv main() doesn't understand it.
  const passthrough = args.filter((a) => a !== RANK_FLAG);

  // Cost-safe default: no explicit backend → embedding-only (local, free) unless
  // the caller opted into the costly LLM path with --rank (→ 'auto').
  const finalArgs = hasExplicitBackend
    ? passthrough
    : [...passthrough, BACKEND_FLAG, wantsRank ? 'auto' : 'embedding-only'];

  return scanArxivMain(finalArgs);
}
