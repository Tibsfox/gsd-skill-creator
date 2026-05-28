/**
 * Test surface for src/drift/cli.ts — ProcessContext wire at v1.49.858.
 *
 * The `driftCommand` CLI wrapper spawns `node scripts/drift/drift-audit.mjs`
 * via spawnSync. v858 chip threaded an optional `ctx?: ProcessContext`
 * parameter through the function and hoisted `ensureProcessAllowed` BEFORE
 * the spawn. No swallowing try/catch around the spawn — ProcessContextDenied
 * propagates naturally to the CLI dispatcher.
 *
 * This test verifies:
 *   1. driftCommand with --help returns 0 without spawning (existing path).
 *   2. driftCommand with an unknown subcommand returns 2 without spawning.
 *   3. driftCommand 'audit' with a restrictive ctx (empty allowList) throws
 *      ProcessContextDenied via the hoisted check before the spawn happens.
 *
 * @module src/drift/__tests__/cli
 */

import { describe, it, expect } from 'vitest';
import { driftCommand } from '../cli.js';
import {
  ProcessContextDenied,
  CapturingProcessAuditSink,
  type ProcessContext,
} from '../../security/process-context.js';

describe('drift CLI — process-context wire (v1.49.858)', () => {
  it('returns 0 on --help without invoking ensureProcessAllowed', async () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [], audit: sink };
    const code = await driftCommand(['--help'], ctx);
    expect(code).toBe(0);
    expect(sink.records).toHaveLength(0);
  });

  it('returns 2 on an unknown subcommand without invoking ensureProcessAllowed', async () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [], audit: sink };
    const code = await driftCommand(['unknown-sub'], ctx);
    expect(code).toBe(2);
    expect(sink.records).toHaveLength(0);
  });

  it('throws ProcessContextDenied on audit subcommand when ctx denies node spawn', async () => {
    // Security wire v1.49.858: hoisted ensureProcessAllowed catches the
    // restrictive ctx (empty allowList rejects process.execPath) and throws
    // ProcessContextDenied BEFORE spawnSync runs. The CLI dispatcher catches
    // the throw at a higher level.
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
    await expect(driftCommand(['audit', '--format=json'], restrictiveCtx)).rejects.toThrow(
      ProcessContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe(process.execPath);
    expect(sink.records[0]?.allowed).toBe(false);
  });
});
