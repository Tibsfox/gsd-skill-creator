import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dacpCommand } from './dacp.js';
import { teamCommand } from './team.js';
import { agentsCommand } from './agents.js';
import { skillCommand } from './skill.js';

// A bare `<cmd>` invocation prints help and exits 0; an unknown subcommand is
// a usage error and exits non-zero. Before CLI-4 all five routers returned 0
// for both, so `<cmd> bogus` silently succeeded. (CLI-4)
describe('unknown-subcommand exit codes (CLI-4)', () => {
  // Silence the help/usage output these routers print to stdout/stderr.
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const noStr = (): string | undefined => undefined;
  const noDir = (): string => '';

  it('dacp: bare → 0, unknown → 1', async () => {
    expect(await dacpCommand(['dacp'])).toBe(0);
    expect(await dacpCommand(['dacp', 'definitely-bogus-xyz'])).toBe(1);
  });

  it('team: bare → 0, unknown → 1', async () => {
    expect(await teamCommand(['team'])).toBe(0);
    expect(await teamCommand(['team', 'definitely-bogus-xyz'])).toBe(1);
  });

  it('agents: bare → 0, unknown → 1', async () => {
    expect(await agentsCommand(['agents'])).toBe(0);
    expect(await agentsCommand(['agents', 'definitely-bogus-xyz'])).toBe(1);
  });

  it('skill: bare → 0, unknown → 1', async () => {
    expect(await skillCommand(['skill'], noDir, noStr)).toBe(0);
    expect(await skillCommand(['skill', 'definitely-bogus-xyz'], noDir, noStr)).toBe(1);
  });
});
