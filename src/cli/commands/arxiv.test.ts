// === arxiv router safe-default contract (Ship 3.3) ===
//
// Pins the cost-safety contract for `skill-creator arxiv`: a no-flag invocation
// must NOT reach the LLM judge (embedding-only by default); --rank is the only
// path to the cost-bearing 'auto' backend; an explicit --judge-backend wins.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockMain } = vi.hoisted(() => ({
  mockMain: vi.fn(async (_argv: string[]) => 0),
}));

vi.mock('../../commands/scan-arxiv.js', () => ({ main: mockMain }));

import { arxivCommand } from './arxiv.js';

describe('arxivCommand — safe-default router', () => {
  beforeEach(() => mockMain.mockClear());

  it('injects --judge-backend embedding-only when no backend and no --rank (no LLM cost)', async () => {
    await arxivCommand(['--month', '2026-04']);
    expect(mockMain).toHaveBeenCalledWith([
      '--month',
      '2026-04',
      '--judge-backend',
      'embedding-only',
    ]);
  });

  it('opts into the costly auto backend with --rank, and strips --rank from passthrough', async () => {
    await arxivCommand(['--rank', '--top', '10']);
    const passed = mockMain.mock.calls[0][0];
    expect(passed).not.toContain('--rank');
    expect(passed[passed.indexOf('--judge-backend') + 1]).toBe('auto');
  });

  it('respects an explicit --judge-backend (no injection)', async () => {
    await arxivCommand(['--judge-backend', 'sdk']);
    expect(mockMain).toHaveBeenCalledWith(['--judge-backend', 'sdk']);
  });

  it('forwards the scan-arxiv exit code', async () => {
    mockMain.mockResolvedValueOnce(2);
    expect(await arxivCommand(['--month', 'bad'])).toBe(2);
  });

  it('delegates --help to the underlying command', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await arxivCommand(['--help']);
    expect(mockMain).toHaveBeenCalledWith(['--help']);
    log.mockRestore();
  });
});
