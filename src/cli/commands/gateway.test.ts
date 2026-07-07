/**
 * Unit tests for the `gateway` CLI command — the argument-handling paths that
 * return without binding a socket. The server path itself is covered by
 * memory-tools.integration.test.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { gatewayCommand } from './gateway.js';

describe('gatewayCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints help and exits 0 on --help without starting a server', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await gatewayCommand(['--help']);
    expect(code).toBe(0);
    expect(log).toHaveBeenCalled();
    const out = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(out).toContain('skill-creator gateway');
    expect(out).toContain('--no-memory');
  });

  it('exits 0 on -h alias', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await gatewayCommand(['-h'])).toBe(0);
  });

  it('rejects a non-numeric --port with exit 1', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = await gatewayCommand(['--port', 'not-a-number']);
    expect(code).toBe(1);
    expect(err).toHaveBeenCalled();
  });

  it('rejects an out-of-range --port with exit 1', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await gatewayCommand(['--port=70000'])).toBe(1);
  });
});
