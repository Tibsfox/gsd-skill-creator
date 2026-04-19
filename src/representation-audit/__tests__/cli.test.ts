/**
 * Tests for src/representation-audit/cli.ts
 *
 * Coverage:
 *   - representationAuditHelp: non-empty, mentions key terms
 *   - --help flag exits 0 with usage text
 *   - Default invocation (no enable) → DISABLED, exit 0
 *   - --enable flag activates audit
 *   - --json flag emits JSON
 *   - CRITICAL → exit 1
 *   - OK → exit 0
 *   - --threshold override
 */

import { describe, it, expect } from 'vitest';
import {
  representationAuditCommand,
  representationAuditHelp,
} from '../cli.js';

// ─── Help ─────────────────────────────────────────────────────────────────────

describe('representationAuditHelp', () => {
  it('returns a non-empty string', () => {
    const h = representationAuditHelp();
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });

  it('mentions command aliases', () => {
    const h = representationAuditHelp();
    expect(h).toContain('representation-audit');
    expect(h).toContain('rep-audit');
  });

  it('mentions --json flag', () => {
    expect(representationAuditHelp()).toContain('--json');
  });

  it('mentions --enable flag', () => {
    expect(representationAuditHelp()).toContain('--enable');
  });

  it('mentions status levels', () => {
    const h = representationAuditHelp();
    expect(h).toContain('OK');
    expect(h).toContain('CRITICAL');
    expect(h).toContain('DISABLED');
    expect(h).toContain('WARNING');
  });

  it('cites Huh 2023', () => {
    expect(representationAuditHelp()).toContain('Huh');
  });
});

// ─── --help flag ──────────────────────────────────────────────────────────────

describe('representationAuditCommand — --help', () => {
  it('exits 0 and prints help', async () => {
    const lines: string[] = [];
    const code = await representationAuditCommand(['--help'], { logger: (l) => lines.push(l) });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('representation-audit');
  });

  it('-h alias also works', async () => {
    const lines: string[] = [];
    const code = await representationAuditCommand(['-h'], { logger: (l) => lines.push(l) });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('rep-audit');
  });
});

// ─── SC-MD6-01: disabled by default ──────────────────────────────────────────

describe('representationAuditCommand — disabled by default (SC-MD6-01)', () => {
  it('exits 0 when no --enable flag', async () => {
    const lines: string[] = [];
    const code = await representationAuditCommand([], { logger: (l) => lines.push(l) });
    expect(code).toBe(0);
  });

  it('output mentions DISABLED status', async () => {
    const lines: string[] = [];
    await representationAuditCommand([], { logger: (l) => lines.push(l) });
    expect(lines.join('\n')).toContain('DISABLED');
  });

  it('output does not mention CRITICAL when disabled', async () => {
    const lines: string[] = [];
    // Even with a collapsed fixture, disabled means no CRITICAL output.
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    await representationAuditCommand([], {
      logger: (l) => lines.push(l),
      detectorInput: { matrix: collapsedMatrix, communities: null },
      // no enable → DISABLED
    });
    expect(lines.join('\n')).toContain('DISABLED');
    expect(lines.join('\n')).not.toContain('CRITICAL');
  });
});

// ─── --enable flag ────────────────────────────────────────────────────────────

describe('representationAuditCommand — --enable', () => {
  it('exits 0 with OK for healthy fixture when --enable', async () => {
    const lines: string[] = [];
    const healthyMatrix = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    const code = await representationAuditCommand(['--enable'], {
      logger: (l) => lines.push(l),
      detectorInput: { matrix: healthyMatrix, communities: null },
    });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('OK');
  });

  it('exits 1 with CRITICAL for collapsed fixture when --enable (LS-39)', async () => {
    const lines: string[] = [];
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    const code = await representationAuditCommand(['--enable'], {
      logger: (l) => lines.push(l),
      detectorInput: { matrix: collapsedMatrix, communities: null },
    });
    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('CRITICAL');
  });
});

// ─── --json flag ──────────────────────────────────────────────────────────────

describe('representationAuditCommand — --json', () => {
  it('emits valid JSON with status field', async () => {
    const lines: string[] = [];
    await representationAuditCommand(['--json'], {
      logger: (l) => lines.push(l),
    });
    const json = JSON.parse(lines.join('\n'));
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('summary');
  });

  it('JSON status is DISABLED when not enabled', async () => {
    const lines: string[] = [];
    await representationAuditCommand(['--json'], {
      logger: (l) => lines.push(l),
    });
    const json = JSON.parse(lines.join('\n'));
    expect(json.status).toBe('DISABLED');
  });

  it('JSON status is CRITICAL for collapsed fixture with --enable --json', async () => {
    const lines: string[] = [];
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    await representationAuditCommand(['--enable', '--json'], {
      logger: (l) => lines.push(l),
      detectorInput: { matrix: collapsedMatrix, communities: null },
    });
    const json = JSON.parse(lines.join('\n'));
    expect(json.status).toBe('CRITICAL');
    expect(json.criticalReasons.length).toBeGreaterThan(0);
  });
});

// ─── --threshold override ─────────────────────────────────────────────────────

describe('representationAuditCommand — --threshold override', () => {
  it('respects --threshold when passed as CLI arg', async () => {
    const lines: string[] = [];
    // Collapsed matrix has ratio ≈ 0.1; set threshold to 0.05 → should be OK.
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    await representationAuditCommand(['--enable', '--threshold=0.05'], {
      logger: (l) => lines.push(l),
      detectorInput: { matrix: collapsedMatrix, communities: null },
    });
    const output = lines.join('\n');
    expect(output).not.toContain('CRITICAL');
    expect(output).toContain('OK');
  });

  it('uses options.effectiveRankThreshold when supplied directly', async () => {
    const lines: string[] = [];
    const collapsedMatrix = Array.from({ length: 10 }, () => {
      const row = new Array<number>(10).fill(0);
      row[0] = 1;
      return row;
    });
    const code = await representationAuditCommand(['--enable'], {
      logger: (l) => lines.push(l),
      effectiveRankThreshold: 0.05, // very low → no flag
      detectorInput: { matrix: collapsedMatrix, communities: null },
    });
    expect(code).toBe(0);
  });
});
