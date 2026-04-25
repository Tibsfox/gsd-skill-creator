/**
 * OOPS-GSD v1.49.576 — C6 / OGA-064 (runtime HAL registry)
 *
 * Verifies the runtime registry exposes the 14 upstream runtimes plus
 * Pi (15 total). Adapter implementations beyond `claude-code` are
 * explicitly out of scope for C6 — the test asserts registration only.
 *
 *   CF-MED-064a — exactly 15 runtimes registered
 *   CF-MED-064b — every upstream runtime name is present
 *   CF-MED-064c — Pi is registered (the +1)
 *   CF-MED-064d — claude-code is the only `implemented` adapter
 *   CF-MED-064e — isSupportedRuntime() narrows correctly
 *
 * @module __tests__/vendoring-inventory/runtime-hal-registry
 */

import { describe, expect, it } from 'vitest';
import {
  RUNTIME_STATUS,
  SUPPORTED_RUNTIMES,
  getRuntimeCount,
  isSupportedRuntime,
} from '../../runtime-hal/runtimes';

const UPSTREAM_14 = [
  'claude-code',
  'opencode',
  'gemini-cli',
  'kilo',
  'codex',
  'copilot',
  'cursor',
  'windsurf',
  'antigravity',
  'augment',
  'trae',
  'qwen-code',
  'cline',
  'codebuddy',
];

describe('OGA-064 — runtime HAL registry (14 upstream + Pi)', () => {
  it('CF-MED-064a — exactly 15 runtimes registered', () => {
    expect(getRuntimeCount()).toBe(15);
    expect(SUPPORTED_RUNTIMES.length).toBe(15);
  });

  it('CF-MED-064b — every upstream runtime name is present', () => {
    for (const name of UPSTREAM_14) {
      expect(
        (SUPPORTED_RUNTIMES as readonly string[]).includes(name),
        `missing upstream runtime: ${name}`,
      ).toBe(true);
    }
  });

  it('CF-MED-064c — Pi (+1) is registered', () => {
    expect((SUPPORTED_RUNTIMES as readonly string[]).includes('pi')).toBe(true);
  });

  it('CF-MED-064d — claude-code is the only implemented adapter', () => {
    const implemented = Object.entries(RUNTIME_STATUS)
      .filter(([, status]) => status === 'implemented')
      .map(([name]) => name);
    expect(implemented).toEqual(['claude-code']);
  });

  it('CF-MED-064e — isSupportedRuntime narrows correctly', () => {
    expect(isSupportedRuntime('claude-code')).toBe(true);
    expect(isSupportedRuntime('pi')).toBe(true);
    expect(isSupportedRuntime('not-a-runtime')).toBe(false);
  });
});
