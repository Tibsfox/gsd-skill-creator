import { describe, it, expect, vi, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  parseResearchArgs,
  formatGapReport,
  formatClaimSupportReport,
  researchCommand,
} from './research.js';
import type { GapReport } from '../../vtm/gap-radar.js';
import type { ClaimSupportReport } from '../../citations/verify/index.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseResearchArgs', () => {
  it('parses subcommand, flags, and comma-separated subtopics', () => {
    const parsed = parseResearchArgs([
      'gaps',
      '--json',
      '--topic',
      'multi-agent systems',
      '--subtopics',
      'tool use, planning ,code repair',
    ]);
    expect(parsed.subcommand).toBe('gaps');
    expect(parsed.json).toBe(true);
    expect(parsed.topic).toBe('multi-agent systems');
    expect(parsed.subtopics).toEqual(['tool use', 'planning', 'code repair']);
  });

  it('accepts --flag=value forms', () => {
    const parsed = parseResearchArgs(['gaps', '--topic=x', '--seen-ids=/tmp/s.json']);
    expect(parsed.topic).toBe('x');
    expect(parsed.seenIds).toBe('/tmp/s.json');
  });

  it('captures positional args after the subcommand for verify', () => {
    const parsed = parseResearchArgs(['verify', 'draft.md', '--json']);
    expect(parsed.subcommand).toBe('verify');
    expect(parsed.positional).toEqual(['draft.md']);
    expect(parsed.json).toBe(true);
  });
});

describe('formatClaimSupportReport', () => {
  it('renders per-claim verdicts and a summary line', () => {
    const report: ClaimSupportReport = {
      document: 'draft.md',
      claims: [
        {
          claim: { text: 'Speedup of 2x (Smith, 2020).', lineNumber: 3, marker: '(Smith, 2020)', method: 'inline-apa', hasCitation: true },
          verdict: 'unresolved',
          citation: null,
          confidence: null,
          reason: 'citation marker present but no source resolved',
        },
      ],
      stats: { total: 1, supported: 0, unsupported: 0, unresolved: 1 },
    };
    const out = formatClaimSupportReport(report);
    expect(out).toContain('draft.md');
    expect(out).toContain('1 unresolved');
    expect(out).toContain('UNRESOLVED');
    expect(out).toContain('L3');
  });
});

describe('formatGapReport', () => {
  it('renders ranked subtopics and re-weighted domains', () => {
    const report: GapReport = {
      topic: 'demo',
      subtopics: [
        {
          subtopic: 'code generation',
          terms: ['code', 'generation'],
          coverage: 0,
          coverageRatio: 0,
          gapScore: 1,
          domain: 'code-gen',
        },
      ],
      reweightedDomainWeights: {
        'agent-orchestration': 0.3,
        'skill-design': 0.2,
        'code-gen': 0.3,
        'memory-retrieval': 0.2,
      },
      workCount: 5,
      arxivSeenCount: 10,
      confidence: 0.43,
    };
    const out = formatGapReport(report);
    expect(out).toContain('code generation');
    expect(out).toContain('gap 1.00');
    expect(out).toContain('code-gen: 0.300');
  });
});

describe('researchCommand', () => {
  it('runs gaps against an empty corpus and prints JSON', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'research-cmd-'));
    const code = await researchCommand([
      'gaps',
      '--json',
      '--citations-db',
      path.join(tmp, 'db'),
      '--seen-ids',
      path.join(tmp, 'seen.json'),
    ]);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalledOnce();
    const printed = JSON.parse(logSpy.mock.calls[0]![0] as string) as GapReport;
    expect(printed.subtopics).toHaveLength(4);
    expect(printed.workCount).toBe(0);
  });

  it('returns 0 and prints help for no subcommand', async () => {
    const code = await researchCommand([]);
    expect(code).toBe(0);
  });

  it('returns 1 for an unknown subcommand', async () => {
    const code = await researchCommand(['bogus']);
    expect(code).toBe(1);
  });

  it('verify returns 1 when no document path is given', async () => {
    const code = await researchCommand(['verify']);
    expect(code).toBe(1);
  });

  it('verify returns 1 when the document cannot be read', async () => {
    const code = await researchCommand(['verify', '/nonexistent/does-not-exist.md']);
    expect(code).toBe(1);
  });

  it('verify resolves an uncited draft offline without network calls', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'research-verify-'));
    const doc = path.join(tmp, 'draft.md');
    // No citation markers => no resolver calls => fully offline.
    await fs.writeFile(doc, 'The approach outperforms the prior baseline across all benchmarks.\n');
    const code = await researchCommand(['verify', doc, '--json']);
    expect(code).toBe(0);
    const printed = JSON.parse(logSpy.mock.calls[0]![0] as string) as ClaimSupportReport;
    expect(printed.stats.total).toBe(1);
    expect(printed.stats.unsupported).toBe(1);
    expect(printed.claims[0]!.verdict).toBe('unsupported');
  });
});
