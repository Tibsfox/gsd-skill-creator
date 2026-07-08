import { describe, it, expect, vi } from 'vitest';
import { runDoctor, doctorCommand, type Check } from './doctor.js';

const ok: Check = async () => ({ id: 'a', level: 'ok', label: 'A', detail: '', data: {} });
const warn: Check = async () => ({ id: 'b', level: 'warn', label: 'B', detail: '', data: {} });
const fail: Check = async () => ({ id: 'c', level: 'fail', label: 'C', detail: '', data: {} });
const boom: Check = async () => {
  throw new Error('boom');
};

describe('runDoctor', () => {
  it('ok=true when no check fails (warns are allowed)', async () => {
    const r = await runDoctor([ok, warn]);
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(2);
  });

  it('ok=false when any check fails', async () => {
    const r = await runDoctor([ok, warn, fail]);
    expect(r.ok).toBe(false);
  });

  it('a throwing probe degrades to warn rather than crashing the run', async () => {
    const r = await runDoctor([ok, boom]);
    expect(r.ok).toBe(true);
    expect(r.checks[1].level).toBe('warn');
    expect(r.checks[1].detail).toContain('boom');
  });

  it('report is JSON-serializable with the documented shape', async () => {
    const parsed = JSON.parse(JSON.stringify(await runDoctor([ok, warn])));
    expect(parsed).toHaveProperty('ok');
    expect(typeof parsed.generatedAt).toBe('string');
    expect(Array.isArray(parsed.checks)).toBe(true);
    for (const c of parsed.checks) {
      expect(typeof c.id).toBe('string');
      expect(['ok', 'warn', 'fail']).toContain(c.level);
      expect(typeof c.label).toBe('string');
    }
  });
});

describe('doctorCommand', () => {
  it('--help / -h returns 0 without running probes', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await doctorCommand(['--help'])).toBe(0);
    expect(await doctorCommand(['-h'])).toBe(0);
    spy.mockRestore();
  });
});
