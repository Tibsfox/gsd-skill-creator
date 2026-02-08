/**
 * Tests for the GSD discovery service.
 *
 * Uses temporary directory fixtures to test:
 * - Full discovery of commands, agents, and teams
 * - Agent filtering by gsd-* prefix
 * - VERSION file-based cache invalidation
 * - Cache hit performance (< 50ms)
 * - Malformed file handling with warnings
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { GsdDiscoveryService } from './discovery-service.js';

// ============================================================================
// Fixture helpers
// ============================================================================

const COMMAND_PLAN_PHASE = [
  '---',
  'name: gsd:plan-phase',
  'description: Create detailed execution plan for a phase',
  'argument-hint: "[phase] [--research]"',
  'allowed-tools:',
  '  - Read',
  '  - Write',
  '  - Bash',
  'agent: gsd-planner',
  '---',
  '',
  '<objective>',
  'Create a detailed, executable plan for the specified phase.',
  '</objective>',
].join('\n');

const COMMAND_EXECUTE_PHASE = [
  '---',
  'name: gsd:execute-phase',
  'description: Execute plans for a phase',
  'argument-hint: "[phase]"',
  'agent: gsd-executor',
  '---',
  '',
  '<objective>',
  'Execute all plans for the specified phase.',
  '</objective>',
].join('\n');

const AGENT_EXECUTOR = [
  '---',
  'name: gsd-executor',
  'description: Executes plans autonomously with atomic commits',
  'tools: "Read, Write, Bash, Glob, Grep"',
  'model: opus',
  'color: green',
  '---',
  '',
  'You are a GSD plan executor.',
].join('\n');

const AGENT_PLANNER = [
  '---',
  'name: gsd-planner',
  'description: Creates detailed execution plans',
  'tools: "Read, Write"',
  'model: sonnet',
  '---',
  '',
  'You are a GSD planner agent.',
].join('\n');

const AGENT_NON_GSD = [
  '---',
  'name: capacity-planner',
  'description: Plans infrastructure capacity',
  'tools: "Read, Bash"',
  '---',
  '',
  'You are a capacity planning agent.',
].join('\n');

const TEAM_CONFIG = JSON.stringify({
  name: 'gsd-research-team',
  description: 'Research team for ecosystem analysis',
  topology: 'leader-worker',
  leadAgentId: 'gsd-researcher',
  members: [
    { agentId: 'gsd-researcher', role: 'leader' },
    { agentId: 'gsd-analyst', role: 'worker' },
  ],
}, null, 2);

// ============================================================================
// Tests
// ============================================================================

describe('GsdDiscoveryService', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-discovery-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    // Create directory structure
    await mkdir(join(testDir, 'commands', 'gsd'), { recursive: true });
    await mkdir(join(testDir, 'agents'), { recursive: true });
    await mkdir(join(testDir, 'teams', 'research-team'), { recursive: true });
    await mkdir(join(testDir, 'get-shit-done'), { recursive: true });

    // Write fixture files
    await writeFile(join(testDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);
    await writeFile(join(testDir, 'commands', 'gsd', 'execute-phase.md'), COMMAND_EXECUTE_PHASE);
    await writeFile(join(testDir, 'agents', 'gsd-executor.md'), AGENT_EXECUTOR);
    await writeFile(join(testDir, 'agents', 'gsd-planner.md'), AGENT_PLANNER);
    await writeFile(join(testDir, 'agents', 'capacity-planner.md'), AGENT_NON_GSD);
    await writeFile(join(testDir, 'teams', 'research-team', 'config.json'), TEAM_CONFIG);
    await writeFile(join(testDir, 'get-shit-done', 'VERSION'), '1.12.1');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('discovers commands from commands/gsd/ directory', async () => {
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.commands).toHaveLength(2);
    const names = result.commands.map((c) => c.name).sort();
    expect(names).toEqual(['gsd:execute-phase', 'gsd:plan-phase']);
  });

  it('discovers agents with gsd-* prefix only', async () => {
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.agents).toHaveLength(2);
    const names = result.agents.map((a) => a.name).sort();
    expect(names).toEqual(['gsd-executor', 'gsd-planner']);
    // capacity-planner should be excluded
    expect(result.agents.find((a) => a.name === 'capacity-planner')).toBeUndefined();
  });

  it('discovers teams from teams/ subdirectories', async () => {
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe('gsd-research-team');
    expect(result.teams[0].memberCount).toBe(2);
  });

  it('returns basePath in result', async () => {
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.basePath).toBe(testDir);
  });

  it('returns version from VERSION file', async () => {
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.version).toBe('1.12.1');
  });

  it('returns discoveredAt timestamp', async () => {
    const before = Date.now();
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();
    const after = Date.now();

    expect(result.discoveredAt).toBeGreaterThanOrEqual(before);
    expect(result.discoveredAt).toBeLessThanOrEqual(after);
  });

  it('cache hit on second call completes in under 50ms', async () => {
    const service = new GsdDiscoveryService(testDir);

    // First call -- populates cache
    const result1 = await service.discover();

    // Second call -- should be cache hit
    const start = performance.now();
    const result2 = await service.discover();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    // Results should be structurally equal
    expect(result2.commands).toEqual(result1.commands);
    expect(result2.agents).toEqual(result1.agents);
    expect(result2.teams).toEqual(result1.teams);
    expect(result2.version).toEqual(result1.version);
  });

  it('cache invalidates on VERSION mtime change', async () => {
    const service = new GsdDiscoveryService(testDir);

    // First discover
    const result1 = await service.discover();
    expect(result1.commands).toHaveLength(2);

    // Add a new command file
    const newCommand = [
      '---',
      'name: gsd:progress',
      'description: Show current project progress',
      '---',
      '',
      '<objective>Show progress</objective>',
    ].join('\n');
    await writeFile(join(testDir, 'commands', 'gsd', 'progress.md'), newCommand);

    // Overwrite VERSION file to change mtime (wait briefly to ensure mtime differs)
    await new Promise((resolve) => setTimeout(resolve, 50));
    await writeFile(join(testDir, 'get-shit-done', 'VERSION'), '1.12.2');

    // Second discover -- cache should be invalidated
    const result2 = await service.discover();
    expect(result2.commands).toHaveLength(3);
    expect(result2.commands.find((c) => c.name === 'gsd:progress')).toBeDefined();
  });

  it('skips malformed command files', async () => {
    // Add a malformed command file (no frontmatter)
    await writeFile(
      join(testDir, 'commands', 'gsd', 'malformed.md'),
      'This is just plain text with no frontmatter at all.'
    );

    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    // Valid commands still returned, malformed one skipped
    expect(result.commands).toHaveLength(2);
    const names = result.commands.map((c) => c.name).sort();
    expect(names).toEqual(['gsd:execute-phase', 'gsd:plan-phase']);
  });

  it('returns warnings for parse errors', async () => {
    // Add a malformed command file
    await writeFile(
      join(testDir, 'commands', 'gsd', 'malformed.md'),
      'Plain text with no frontmatter.'
    );

    const service = new GsdDiscoveryService(testDir);
    await service.discover();

    expect(service.warnings.length).toBeGreaterThanOrEqual(1);
    const warning = service.warnings.find((w) => w.path.includes('malformed.md'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('parse-error');
  });
});
