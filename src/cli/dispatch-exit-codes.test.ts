import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The `status` handler must propagate statusCommand's exit code (CLI-6). Mock
// the status command so we can assert the registry handler resolves to its
// return value — the pre-CLI-6 `await statusCommand(...)` with no `return`
// always resolved to undefined, so `skill-creator status` exited 0 even on a
// failing status run.
vi.mock('./commands/status.js', () => ({
  statusCommand: vi.fn(async () => 1),
}));

import { lookup } from './dispatch.js';

describe('dispatch exit codes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('status handler propagates the command exit code (CLI-6)', async () => {
    const handler = lookup('status');
    expect(handler).toBeDefined();
    const result = await handler!({ args: ['status'] } as never);
    expect(result).toBe(1);
  });

  it('config: bare → 0, unknown subcommand → 1 (CLI-4)', async () => {
    const handler = lookup('config');
    expect(handler).toBeDefined();
    expect(await handler!({ args: ['config'] } as never)).toBe(0);
    expect(await handler!({ args: ['config', 'bogus-sub'] } as never)).toBe(1);
  });
});
