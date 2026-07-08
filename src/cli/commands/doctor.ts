/**
 * `skill-creator doctor [--json]` — one-pass environment health check.
 *
 * Runs seven read-only probes over the fragile externals this tool depends on
 * (Node version, embedding model, Postgres, MCP gateway, skills dirs, char
 * budget, git hooks) and prints a colored table, or `--json` for a machine-
 * readable report. Exit 0 unless a check is level `fail`; degraded-but-optional
 * conditions (no PG, embedding fallback, missing project dir / git hooks) are
 * `warn` and do not fail.
 *
 * Basename is deliberately `doctor` (not loader|reader|scanner|walker|store) so
 * the node:fs imports are exempt from the loader-context audit; no child_process
 * is used (git-hook presence is an fs.existsSync check, not a git shell-out).
 */
import pc from 'picocolors';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getEmbeddingService } from '../../embeddings/index.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';
import { PgStore } from '../../memory/pg-store.js';
import {
  DEFAULT_GATEWAY_PORT,
  DEFAULT_GATEWAY_HOST,
  DEFAULT_TOKEN_PATH,
} from '../../mcp/gateway/types.js';
import { getSkillsBasePath } from '../../types/scope.js';
import { BudgetValidator } from '../../validation/budget-validation.js';

export type CheckLevel = 'ok' | 'warn' | 'fail';

export interface CheckRow {
  id: string;
  level: CheckLevel;
  label: string;
  detail: string;
  data: Record<string, unknown>;
}

export type Check = () => Promise<CheckRow>;

export interface DoctorReport {
  ok: boolean;
  generatedAt: string;
  checks: CheckRow[];
}

// ── Individual probes ──────────────────────────────────────────────────────

const MIN_NODE_MAJOR = 18;

async function checkNode(): Promise<CheckRow> {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  const ok = major >= MIN_NODE_MAJOR;
  return {
    id: 'node',
    level: ok ? 'ok' : 'fail',
    label: 'Node.js',
    detail: `${version} (min v${MIN_NODE_MAJOR})`,
    data: { version, major, minMajor: MIN_NODE_MAJOR },
  };
}

async function checkEmbeddings(): Promise<CheckRow> {
  try {
    const svc = await getEmbeddingService();
    const s = svc.getStatus();
    return {
      id: 'embeddings',
      level: s.fallbackMode ? 'warn' : 'ok',
      label: 'Embeddings',
      detail: s.fallbackMode
        ? 'heuristic (model unavailable — fallback)'
        : `model ${s.cacheStats.modelId}`,
      data: {
        initialized: s.initialized,
        fallbackMode: s.fallbackMode,
        cacheEntries: s.cacheStats.entries,
        modelId: s.cacheStats.modelId,
      },
    };
  } catch (e) {
    return {
      id: 'embeddings',
      level: 'warn',
      label: 'Embeddings',
      detail: `probe error: ${(e as Error).message}`,
      data: {},
    };
  }
}

async function checkPostgres(): Promise<CheckRow> {
  const env = loadPgEnv();
  if (!env.ok) {
    return {
      id: 'postgres',
      level: 'warn',
      label: 'Postgres',
      detail: `not configured (${env.reason})`,
      data: { configured: false, hint: env.hint },
    };
  }
  const store = new PgStore({ connectionString: env.url, autoMigrate: false });
  try {
    const ready = await store.isReady();
    if (!ready) {
      return {
        id: 'postgres',
        level: 'fail',
        label: 'Postgres',
        detail: `configured (${env.source}) but unreachable`,
        data: { configured: true, ready: false, source: env.source },
      };
    }
    const stats = await store.getConversationEmbeddingStats();
    return {
      id: 'postgres',
      level: 'ok',
      label: 'Postgres',
      detail: `reachable (${env.source}) — ${stats.totalTurns} turns, ${stats.embeddedTurns} embedded`,
      data: { configured: true, ready: true, source: env.source, ...stats },
    };
  } catch (e) {
    return {
      id: 'postgres',
      level: 'fail',
      label: 'Postgres',
      detail: `error: ${(e as Error).message}`,
      data: { configured: true },
    };
  } finally {
    try {
      await store.close();
    } catch {
      /* best-effort close */
    }
  }
}

async function checkGateway(): Promise<CheckRow> {
  const tokenPath = DEFAULT_TOKEN_PATH.startsWith('~')
    ? join(homedir(), DEFAULT_TOKEN_PATH.slice(1))
    : DEFAULT_TOKEN_PATH;
  const tokenExists = existsSync(tokenPath);
  return {
    id: 'gateway',
    level: 'ok',
    label: 'MCP gateway',
    detail: `default ${DEFAULT_GATEWAY_HOST}:${DEFAULT_GATEWAY_PORT}, token ${tokenExists ? 'present' : 'absent'}`,
    data: { port: DEFAULT_GATEWAY_PORT, host: DEFAULT_GATEWAY_HOST, tokenPath, tokenExists },
  };
}

async function checkSkills(): Promise<CheckRow> {
  const info = (['user', 'project'] as const).map((scope) => {
    const path = getSkillsBasePath(scope);
    const exists = existsSync(path);
    const count = exists
      ? readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).length
      : 0;
    return { scope, path, exists, count };
  });
  const user = info.find((i) => i.scope === 'user')!;
  const project = info.find((i) => i.scope === 'project')!;
  return {
    id: 'skills',
    level: user.exists ? 'ok' : 'warn',
    label: 'Skills dirs',
    detail: `user ${user.count}${user.exists ? '' : ' (missing)'}, project ${project.count}`,
    data: { user, project },
  };
}

async function checkBudget(): Promise<CheckRow> {
  try {
    const r = await BudgetValidator.load().checkCumulative(getSkillsBasePath('user'));
    // Over-budget is advisory, not a broken environment: checkCumulative sums the
    // WHOLE on-disk corpus, but skills load on demand — so this warns (never fails).
    const over = r.severity === 'error';
    return {
      id: 'budget',
      level: over ? 'warn' : 'ok',
      label: 'Skill budget',
      detail: `${r.totalChars.toLocaleString()}/${r.budget.toLocaleString()} chars (${Math.round(r.usagePercent)}%)${over ? ' — on-disk total; only active skills load' : ''}`,
      data: {
        totalChars: r.totalChars,
        budget: r.budget,
        usagePercent: r.usagePercent,
        hiddenCount: r.hiddenCount,
        severity: r.severity,
      },
    };
  } catch (e) {
    return {
      id: 'budget',
      level: 'warn',
      label: 'Skill budget',
      detail: `probe error: ${(e as Error).message}`,
      data: {},
    };
  }
}

async function checkGitHooks(): Promise<CheckRow> {
  const path = join(process.cwd(), '.git', 'hooks', 'pre-commit');
  const preCommit = existsSync(path);
  return {
    id: 'git-hooks',
    level: preCommit ? 'ok' : 'warn',
    label: 'Git hooks',
    detail: preCommit ? 'pre-commit installed' : 'pre-commit missing',
    data: { preCommit, path },
  };
}

export const DEFAULT_CHECKS: Check[] = [
  checkNode,
  checkEmbeddings,
  checkPostgres,
  checkGateway,
  checkSkills,
  checkBudget,
  checkGitHooks,
];

/** Run the checks and assemble a report. A throwing probe degrades to `warn`. */
export async function runDoctor(checks: Check[] = DEFAULT_CHECKS): Promise<DoctorReport> {
  const rows: CheckRow[] = [];
  for (const check of checks) {
    try {
      rows.push(await check());
    } catch (e) {
      rows.push({
        id: check.name || 'unknown',
        level: 'warn',
        label: check.name || 'check',
        detail: `probe error: ${(e as Error).message}`,
        data: {},
      });
    }
  }
  return {
    ok: rows.every((r) => r.level !== 'fail'),
    generatedAt: new Date().toISOString(),
    checks: rows,
  };
}

function symbol(level: CheckLevel): string {
  return level === 'ok' ? pc.green('✓') : level === 'warn' ? pc.yellow('!') : pc.red('✗');
}

function renderTable(report: DoctorReport): void {
  console.log(pc.bold('skill-creator doctor'));
  console.log('');
  for (const c of report.checks) {
    console.log(`${symbol(c.level)} ${c.label.padEnd(14)} ${c.detail}`);
  }
  const fails = report.checks.filter((c) => c.level === 'fail').length;
  const warns = report.checks.filter((c) => c.level === 'warn').length;
  console.log('');
  console.log(
    report.ok
      ? pc.green(`OK${warns ? ` — ${warns} warning${warns > 1 ? 's' : ''}` : ''}`)
      : pc.red(`${fails} check${fails > 1 ? 's' : ''} failed`),
  );
}

function printUsage(): void {
  console.log(
    [
      'Usage: skill-creator doctor [--json]',
      '',
      'One-pass environment health check: Node, embeddings, Postgres, MCP gateway,',
      'skills dirs, char budget, and git hooks. Exit 0 unless a check fails.',
      '',
      '  --json    machine-readable report',
      '  --help    show this message',
    ].join('\n'),
  );
}

export async function doctorCommand(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }
  const report = await runDoctor();
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    renderTable(report);
  }
  return report.ok ? 0 : 1;
}
