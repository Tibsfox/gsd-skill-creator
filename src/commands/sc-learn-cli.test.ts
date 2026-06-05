// === sc-learn CLI main() arg-parse contract (Ship 3.3) ===
//
// Pins the `skill-creator learn` CLI shell's argument handling on the paths
// that return BEFORE the pipeline runs (help / bad args), so no learn/* module
// needs mocking. The full pipeline is covered by sc-learn.test.ts.

import { describe, it, expect, vi } from 'vitest';
import { main } from './sc-learn.js';

describe('sc-learn CLI main() — argument contract', () => {
  it('prints help and exits 0 on --help', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await main(['--help'])).toBe(0);
    log.mockRestore();
  });

  it('exits 2 when <source> is missing', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main([])).toBe(2);
    err.mockRestore();
  });

  it('exits 2 on an invalid --depth value', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main(['src.md', '--depth', 'wrong'])).toBe(2);
    err.mockRestore();
  });

  it('exits 2 on an unknown flag', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main(['--bogus'])).toBe(2);
    err.mockRestore();
  });
});
