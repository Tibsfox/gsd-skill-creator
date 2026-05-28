/**
 * Test surface for `src/cli/commands/pic2html.ts` — ProcessContext wire
 * verification (v1.49.872, Track 4 chip #3).
 *
 * The wire is a hoist-at-top before the single Python3 spawn site in
 * `loadImage`. This test exercises the wire by:
 *   1. Creating a fake .png temp file (so existsSync returns true and
 *      the .ppm/.pgm early-return is bypassed).
 *   2. Calling pic2html with a denying ctx; expecting
 *      ProcessContextDenied to throw BEFORE python3 is spawned.
 *
 * The wire check fires synchronously inside loadImage before execSync;
 * the fact that python3 would fail on a non-real PNG never matters
 * because the security throw happens first.
 *
 * @module src/cli/commands/pic2html
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pic2html } from './pic2html.js';
import {
  type ProcessContext,
  ProcessContextDenied,
  NULL_PROCESS_AUDIT_SINK,
} from '../../security/process-context.js';

describe('pic2html ProcessContext wire (v1.49.872)', () => {
  let tmpRoot: string;
  let fakePngPath: string;

  beforeAll(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'pic2html-wire-test-'));
    fakePngPath = join(tmpRoot, 'fake.png');
    // Minimal byte sequence — not a real PNG; the wire check fires
    // before any actual image decoding.
    writeFileSync(fakePngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  afterAll(() => {
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('throws ProcessContextDenied when ctx denies sh exec', async () => {
    const ctx: ProcessContext = {
      allowList: [], // deny all
      audit: NULL_PROCESS_AUDIT_SINK,
    };

    // Stub p.intro/cancel/spinner so prompts don't interfere with the test
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);

    try {
      await expect(
        pic2html(fakePngPath, {
          size: 8,
          grayscale: false,
          levels: 16,
          bg: 'white',
        }, ctx),
      ).rejects.toBeInstanceOf(ProcessContextDenied);
    } finally {
      exitSpy.mockRestore();
    }
  });

  it('records audit event when ctx is threaded and sh is allowed', async () => {
    const events: Array<{ source: string; target: string }> = [];
    const ctx: ProcessContext = {
      allowList: ['sh'],
      audit: {
        record: (e) => events.push({ source: e.source, target: e.target }),
      },
    };

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);

    try {
      // Will throw at python3 (fake PNG can't be opened) but the wire
      // check records the audit event BEFORE the spawn fires.
      await pic2html(fakePngPath, {
        size: 8,
        grayscale: false,
        levels: 16,
        bg: 'white',
      }, ctx).catch(() => {
        // Spawn-time error from python3 (PIL can't decode fake PNG) is expected.
        // The wire test only cares that the audit event was recorded.
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].source).toBe('cli/commands/pic2html');
      expect(events[0].target).toBe('sh');
    } finally {
      exitSpy.mockRestore();
    }
  });
});
