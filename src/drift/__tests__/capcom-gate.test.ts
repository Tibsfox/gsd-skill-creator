// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/drift/capcom-gate.mjs');

const mod = await import(scriptPath);
const { checkCiteResolution, checkNumericAttribution, checkQuoteLength, checkQuoteUniqueness, runGate } = mod;

describe('capcom-gate: checkCiteResolution', () => {
  const meta = [{ cite_key: 'spataru2024sd' }, { cite_key: 'abdelnabi2024taskdrift' }];

  it('passes when every cite key resolves', () => {
    const tex = 'Spataru \\cite{spataru2024sd} and Abdelnabi \\cite{abdelnabi2024taskdrift}.';
    const r = checkCiteResolution(tex, meta);
    expect(r.pass).toBe(true);
    expect(r.unresolved).toEqual([]);
    expect(r.cited_count).toBe(2);
  });

  it('fails when a cite key is missing from meta', () => {
    const tex = 'Spataru \\cite{spataru2024sd} vs \\cite{unknown2099key}.';
    const r = checkCiteResolution(tex, meta);
    expect(r.pass).toBe(false);
    expect(r.unresolved).toContain('unknown2099key');
  });

  it('handles \\citedrift macro and comma-separated keys', () => {
    const tex = 'See \\citedrift{spataru2024sd} and \\cite{abdelnabi2024taskdrift, spataru2024sd}.';
    const r = checkCiteResolution(tex, meta);
    expect(r.pass).toBe(true);
    expect(r.cited_count).toBe(2); // unique cite keys
  });
});

describe('capcom-gate: checkNumericAttribution', () => {
  it('passes when every numeric claim has citation within ±50 chars', () => {
    const tex = 'SD score 0.78 \\cite{spataru2024sd} across LLMs. AUROC 0.96 \\citedrift{mir2025lsd}.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(true);
    expect(r.violation_count).toBe(0);
  });

  it('fails on unattributed percentage claim', () => {
    const tex = 'A stunning 85% improvement was observed — no source named.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violation_count).toBeGreaterThan(0);
    expect(r.violations[0].match).toMatch(/85%/);
  });

  it('detects AUROC and pp patterns', () => {
    const tex = 'Drop of 30pp with no citation nearby for this claim.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => /30pp/i.test(v.match))).toBe(true);
  });

  // H-03: bare decimals following metric keywords
  it('fails on unattributed AUROC 0.96 (bare decimal after metric word)', () => {
    const tex = 'They report AUROC 0.96 across the test split — no citation nearby.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => /AUROC\s+0\.96/i.test(v.match))).toBe(true);
  });

  it('fails on unattributed F1 of 0.85 (metric keyword + of + decimal)', () => {
    const tex = 'System achieved F1 of 0.85 on the held-out set without any reference.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => /F1.*0\.85/i.test(v.match))).toBe(true);
  });

  it('fails on unattributed "2.5x speedup" (N.Nx shape)', () => {
    const tex = 'Reported a 2.5x speedup over the baseline with no attribution.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => /2\.5x/i.test(v.match))).toBe(true);
  });

  it('fails on unattributed "SD score 0.78" (bare decimal after metric phrase)', () => {
    const tex = 'Mean SD score 0.78 on LLaMA-70B unreferenced.';
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => /SD\s+score\s+0\.78/i.test(v.match))).toBe(true);
  });

  it('passes the AUROC/F1/Nx shapes when citations are within ±50 chars', () => {
    const tex = [
      'AUROC 0.96 \\cite{mir2025lsd} shows strong detection.',
      'F1 of 0.85 \\citedrift{spataru2024sd} over the test split.',
      'Achieved 2.5x speedup \\cite{spataru2024sd}.',
    ].join('\n');
    const r = checkNumericAttribution(tex);
    expect(r.pass).toBe(true);
    expect(r.violation_count).toBe(0);
  });
});

describe('capcom-gate: checkQuoteLength', () => {
  it('passes when direct quotes are under 15 words', () => {
    const tex = "``semantic drift'' is key \\cite{spataru2024sd}.";
    const r = checkQuoteLength(tex);
    expect(r.pass).toBe(true);
  });

  it('fails when a direct quote exceeds 15 words', () => {
    const longQuote = Array(20).fill('word').join(' ');
    const tex = `The authors write: \`\`${longQuote}'' in their introduction.`;
    const r = checkQuoteLength(tex);
    expect(r.pass).toBe(false);
    expect(r.violation_count).toBe(1);
    expect(r.violations[0].words).toBe(20);
  });
});

describe('capcom-gate: checkQuoteUniqueness', () => {
  it('passes when each source quoted at most once', () => {
    const tex = [
      "Spataru: ``SD score is high'' \\cite{spataru2024sd}.",
      '',
      "Abdelnabi: ``activation delta'' \\cite{abdelnabi2024taskdrift}.",
    ].join('\n');
    const r = checkQuoteUniqueness(tex);
    expect(r.pass).toBe(true);
  });

  it('paragraph-level grouping detects same-cite multi-quote', () => {
    const tex = [
      "First: ``quote one here'' and ``quote two here'' \\cite{spataru2024sd}.",
    ].join('\n');
    const r = checkQuoteUniqueness(tex);
    // Two quotes in a paragraph that pins to the same cite -> count=2 -> violation.
    expect(r.pass).toBe(false);
    expect(r.violation_count).toBeGreaterThan(0);
  });
});

describe('capcom-gate: runGate integration', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'capcom-test-'));
    fs.mkdirSync(path.join(tmpDir, 'sources'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'modules'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'tables'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'gates'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('W0 passes with 29 meta entries', async () => {
    const entries = Array.from({ length: 29 }, (_, i) => ({ cite_key: `k${i}`, tier: i < 15 ? 'primary' : 'supporting' }));
    fs.writeFileSync(path.join(tmpDir, 'sources', 'meta.json'), JSON.stringify({ entries }));
    const silentStdout = { log: () => {} };
    const result = await runGate({ wave: 'W0', missionDir: tmpDir, stdout: silentStdout });
    expect(result.severity).toBe('PASS');
    expect(result.effectiveExit).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, 'gates', 'W0_gate.md'))).toBe(true);
  });

  it('W0 fails with insufficient meta entries', async () => {
    fs.writeFileSync(path.join(tmpDir, 'sources', 'meta.json'), JSON.stringify({ entries: [] }));
    const silentStdout = { log: () => {} };
    const result = await runGate({ wave: 'W0', missionDir: tmpDir, stdout: silentStdout });
    expect(result.severity).toBe('WARN');
    expect(result.exitCode).toBe(1);
  });

  it('W3 BLOCKs (no --force override) on citation failure', async () => {
    fs.writeFileSync(path.join(tmpDir, 'sources', 'meta.json'), JSON.stringify({ entries: [{ cite_key: 'known' }] }));
    fs.writeFileSync(path.join(tmpDir, 'modules', 'module_a.tex'), 'Unattributed numeric 85% claim here.');
    const silentStdout = { log: () => {} };
    const result = await runGate({ wave: 'W3', missionDir: tmpDir, force: true, stdout: silentStdout });
    expect(result.severity).toBe('BLOCK');
    expect(result.effectiveExit).toBe(2);
    expect(result.forced).toBe(false);  // force ignored on publication wave
  });

  it('W1A mid-wave --force downgrades WARN to effective-pass (report still records WARN)', async () => {
    fs.writeFileSync(path.join(tmpDir, 'sources', 'meta.json'), JSON.stringify({ entries: [{ cite_key: 'known' }] }));
    fs.writeFileSync(path.join(tmpDir, 'modules', 'module_a.tex'), 'Unattributed 85% claim.');
    const silentStdout = { log: () => {} };
    const result = await runGate({ wave: 'W1A', missionDir: tmpDir, force: true, stdout: silentStdout });
    expect(result.severity).toBe('WARN');
    expect(result.exitCode).toBe(1);
    expect(result.effectiveExit).toBe(0);
    expect(result.forced).toBe(true);
  });

  it('emits a well-formed frontmatter report', async () => {
    fs.writeFileSync(path.join(tmpDir, 'sources', 'meta.json'), JSON.stringify({ entries: Array.from({ length: 29 }, (_, i) => ({ cite_key: `k${i}` })) }));
    const silentStdout = { log: () => {} };
    await runGate({ wave: 'W0', missionDir: tmpDir, stdout: silentStdout, now: () => '2026-04-23T00:00:00Z' });
    const report = fs.readFileSync(path.join(tmpDir, 'gates', 'W0_gate.md'), 'utf8');
    expect(report).toMatch(/^---\n/);
    expect(report).toMatch(/wave: W0/);
    expect(report).toMatch(/severity: PASS/);
    expect(report).toMatch(/exit_code: 0/);
    expect(report).toMatch(/timestamp: 2026-04-23T00:00:00Z/);
  });

  it('rejects unknown waves', async () => {
    await expect(runGate({ wave: 'W99', missionDir: tmpDir, stdout: { log: () => {} } })).rejects.toThrow(/unknown wave/);
  });
});
