// === scan-arxiv CLI judge calibration ===
//
// One-off calibration script: fetch a small set of May 2026 cs.MA papers,
// run the CLI judge on 3 of them, report per-call cost and runtime.
// Uses the production buildJudgePrompt so the prompt shape matches the
// real ranker exactly. Cost is read from the CLI envelope's
// `total_cost_usd` field.
//
// Run: npx tsx tools/scan-arxiv-calibrate.mts

import { spawn } from 'node:child_process';
import * as os from 'node:os';
import { createFetcher } from '../src/scan-arxiv/fetcher.js';
import { buildJudgePrompt } from '../src/scan-arxiv/prompts/judge.js';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_BUDGET_USD = '0.25';

interface RunResult {
  arxivId: string;
  title: string;
  exitCode: number | null;
  costUsd: number | null;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheCreate: number | null;
  cacheRead: number | null;
  rationale: string | null;
  rawSnippet: string;
  errorSnippet?: string;
}

async function runJudge(paper: import('../src/scan-arxiv/types.js').ArxivPaper): Promise<RunResult> {
  const prompt = buildJudgePrompt(paper);
  const args = [
    '-p',
    '--output-format', 'json',
    '--model', MODEL,
    '--no-session-persistence',
    '--exclude-dynamic-system-prompt-sections',
    '--max-budget-usd', MAX_BUDGET_USD,
  ];

  const startedAt = Date.now();
  const { stdout, stderr, code } = await new Promise<{
    stdout: string;
    stderr: string;
    code: number | null;
  }>((resolve, reject) => {
    const child = spawn('claude', args, {
      cwd: os.tmpdir(),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 180_000,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { err += d.toString(); });
    child.on('error', reject);
    child.on('close', (c) => resolve({ stdout: out, stderr: err, code: c }));
    child.stdin.write(prompt);
    child.stdin.end();
  });
  const durationMs = Date.now() - startedAt;

  let envelope: Record<string, unknown> = {};
  try {
    envelope = JSON.parse(stdout);
  } catch {
    return {
      arxivId: paper.arxivId,
      title: paper.title,
      exitCode: code,
      costUsd: null,
      durationMs,
      inputTokens: null,
      outputTokens: null,
      cacheCreate: null,
      cacheRead: null,
      rationale: null,
      rawSnippet: stdout.slice(0, 300),
      errorSnippet: stderr.slice(0, 200),
    };
  }

  const usage = (envelope.usage ?? {}) as Record<string, unknown>;
  const result = typeof envelope.result === 'string' ? envelope.result : '';
  // Try to extract rationale from JSON-shaped result (tolerant; same parser as production)
  let rationale: string | null = null;
  try {
    const body = result.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const firstBrace = body.indexOf('{');
    const lastBrace = body.lastIndexOf('}');
    const sliced = firstBrace >= 0 && lastBrace > firstBrace ? body.slice(firstBrace, lastBrace + 1) : body;
    const parsed = JSON.parse(sliced) as { rationale?: string };
    rationale = typeof parsed.rationale === 'string' ? parsed.rationale : null;
  } catch {
    // leave null
  }

  return {
    arxivId: paper.arxivId,
    title: paper.title,
    exitCode: code,
    costUsd: typeof envelope.total_cost_usd === 'number' ? envelope.total_cost_usd : null,
    durationMs,
    inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : null,
    outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : null,
    cacheCreate: typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : null,
    cacheRead: typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : null,
    rationale,
    rawSnippet: result.slice(0, 300),
    errorSnippet: stderr ? stderr.slice(0, 200) : undefined,
  };
}

async function main(): Promise<void> {
  console.log('[calibrate] fetching cs.MA papers for May 2026...');
  const fetcher = createFetcher({ noCache: true });
  const papers = await fetcher.fetchMonth('2026-05', ['cs.MA']);
  console.log(`[calibrate] fetched ${papers.length} papers`);
  if (papers.length < 3) {
    console.error('[calibrate] not enough papers to calibrate (need ≥3)');
    process.exit(1);
  }

  // Pick three semi-evenly-spaced papers so we don't bias to one author/topic
  const indices = [
    0,
    Math.floor(papers.length / 2),
    papers.length - 1,
  ];
  const picked = indices.map((i) => papers[i]);
  console.log(`[calibrate] running CLI judge on 3 papers (indices ${indices.join(', ')})`);

  const results: RunResult[] = [];
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i];
    console.log(`\n[calibrate] [${i + 1}/3] ${p.arxivId} — ${p.title.slice(0, 80)}`);
    const r = await runJudge(p);
    results.push(r);
    console.log(`           exit=${r.exitCode}  cost=$${r.costUsd?.toFixed(4) ?? 'n/a'}  ${r.durationMs}ms`);
    console.log(`           in=${r.inputTokens} out=${r.outputTokens} cacheCreate=${r.cacheCreate} cacheRead=${r.cacheRead}`);
    if (r.rationale) console.log(`           rationale: ${r.rationale.slice(0, 120)}`);
    if (r.errorSnippet) console.log(`           stderr: ${r.errorSnippet}`);
    if (!r.rationale && r.rawSnippet) console.log(`           raw[0:200]: ${r.rawSnippet.slice(0, 200)}`);
  }

  const validCosts = results.filter((r) => r.costUsd !== null).map((r) => r.costUsd as number);
  const totalCost = validCosts.reduce((a, b) => a + b, 0);
  const avgCost = validCosts.length ? totalCost / validCosts.length : 0;
  console.log('\n[calibrate] ── summary ──');
  console.log(`  total cost:    $${totalCost.toFixed(4)}`);
  console.log(`  avg per call:  $${avgCost.toFixed(4)} (over ${validCosts.length} calls)`);
  console.log(`  projection:    --top 30 ≈ $${(avgCost * 30).toFixed(2)} (assuming similar cache profile)`);
  console.log(`  projection:    --top 100 ≈ $${(avgCost * 100).toFixed(2)}`);
}

await main();
