import { describe, it, expect, vi } from 'vitest';
import { lookup, REGISTRY } from './dispatch.js';
import { printHelp } from './help.js';

describe('cli/dispatch', () => {
  it('returns undefined when command is undefined or empty', () => {
    expect(lookup(undefined)).toBeUndefined();
    expect(lookup('')).toBeUndefined();
  });

  it('returns undefined for an unregistered command', () => {
    expect(lookup('definitely-not-a-real-command-9c2f')).toBeUndefined();
  });

  it('rejects alias collisions across registry entries', () => {
    const seen = new Set<string>();
    for (const entry of REGISTRY) {
      for (const alias of entry.aliases) {
        expect(seen.has(alias), `duplicate alias "${alias}"`).toBe(false);
        seen.add(alias);
      }
    }
  });

  it('every registered handler is callable (function-typed)', () => {
    for (const entry of REGISTRY) {
      expect(typeof entry.handler).toBe('function');
      expect(entry.aliases.length, `entry has empty aliases array`).toBeGreaterThan(0);
    }
  });

  // CLI-3: registry↔help parity. This is the root-cause guard for the drift
  // that let `activations`/`cadence` fall out of the help text undetected —
  // every registered primary command must have a line in printHelp().
  it('every registered primary command appears in printHelp()', () => {
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.join(' '));
    });
    try {
      printHelp();
    } finally {
      spy.mockRestore();
    }
    const help = logs.join('\n');
    // Help/version machinery — not documented as commands.
    const META = new Set(['help', '-h', '--help', '--version', 'version']);
    const missing: string[] = [];
    for (const entry of REGISTRY) {
      const primary = entry.aliases[0];
      if (!primary || META.has(primary)) continue;
      const escaped = primary.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(`(^|[\\s,])${escaped}([\\s,]|$)`, 'm');
      if (!re.test(help)) missing.push(primary);
    }
    expect(missing, `commands missing a help line: ${missing.join(', ')}`).toEqual([]);
  });
});
