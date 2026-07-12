import { describe, it, expect, vi, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  parseResearchArgs,
  formatGapReport,
  researchCommand,
} from './research.js';
import type { GapReport } from '../../vtm/gap-radar.js';

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
});
