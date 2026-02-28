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
import {
  GsdDiscoveryService,
  detectGsdInstallation,
  createDiscoveryService,
} from './discovery-service.js';

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

// ============================================================================
// Auto-detection tests (36-03)
// ============================================================================

describe('detectGsdInstallation()', () => {
  let tempGlobalDir: string;
  let tempLocalDir: string;

  beforeEach(async () => {
    const base = join(
      tmpdir(),
      `gsd-detect-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    tempGlobalDir = join(base, 'global-claude');
    tempLocalDir = join(base, 'local-claude');
  });

  afterEach(async () => {
    // Clean up both possible dirs
    const base = join(tempGlobalDir, '..');
    await rm(base, { recursive: true, force: true });
  });

  it('detects global installation when VERSION file exists', async () => {
    await mkdir(join(tempGlobalDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(tempGlobalDir, 'get-shit-done', 'VERSION'), '1.12.1');

    const result = await detectGsdInstallation({
      globalBase: tempGlobalDir,
      localBase: '/nonexistent/path',
    });

    expect(result).not.toBeNull();
    expect(result!.location).toBe('global');
    expect(result!.basePath).toBe(tempGlobalDir);
  });

  it('detects local installation when global not present', async () => {
    await mkdir(join(tempLocalDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(tempLocalDir, 'get-shit-done', 'VERSION'), '1.12.0');

    const result = await detectGsdInstallation({
      globalBase: '/nonexistent/global',
      localBase: tempLocalDir,
    });

    expect(result).not.toBeNull();
    expect(result!.location).toBe('local');
    expect(result!.basePath).toBe(tempLocalDir);
  });

  it('returns null when neither global nor local exists', async () => {
    const result = await detectGsdInstallation({
      globalBase: '/nonexistent/global',
      localBase: '/nonexistent/local',
    });

    expect(result).toBeNull();
  });

  it('prefers global over local when both exist', async () => {
    // Create both installations
    await mkdir(join(tempGlobalDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(tempGlobalDir, 'get-shit-done', 'VERSION'), '1.12.1');

    await mkdir(join(tempLocalDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(tempLocalDir, 'get-shit-done', 'VERSION'), '1.11.0');

    const result = await detectGsdInstallation({
      globalBase: tempGlobalDir,
      localBase: tempLocalDir,
    });

    expect(result).not.toBeNull();
    expect(result!.location).toBe('global');
    expect(result!.basePath).toBe(tempGlobalDir);
  });
});

// ============================================================================
// Factory function tests (36-03)
// ============================================================================

describe('createDiscoveryService()', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(
      tmpdir(),
      `gsd-factory-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(join(tempDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(tempDir, 'get-shit-done', 'VERSION'), '1.12.1');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates service from detected installation', async () => {
    const service = await createDiscoveryService({
      globalBase: tempDir,
      localBase: '/nonexistent/local',
    });

    expect(service).not.toBeNull();
    expect(service).toBeInstanceOf(GsdDiscoveryService);

    // Verify the service works by calling discover()
    const result = await service!.discover();
    expect(result.basePath).toBe(tempDir);
    expect(result.location).toBe('global');
    expect(result.version).toBe('1.12.1');
  });

  it('returns null when no GSD installation found', async () => {
    const service = await createDiscoveryService({
      globalBase: '/nonexistent/global',
      localBase: '/nonexistent/local',
    });

    expect(service).toBeNull();
  });
});

// ============================================================================
// Error tolerance tests (36-03)
// ============================================================================

describe('error tolerance', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-tolerance-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(join(testDir, 'get-shit-done'), { recursive: true });
    await writeFile(join(testDir, 'get-shit-done', 'VERSION'), '1.12.1');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('tolerates missing commands/gsd/ directory', async () => {
    // No commands/, agents/, or teams/ directories -- only VERSION
    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.commands).toEqual([]);
    expect(result.agents).toEqual([]);
    expect(result.teams).toEqual([]);
    expect(result.version).toBe('1.12.1');
  });

  it('tolerates missing agents/ directory', async () => {
    // Create commands but no agents/
    await mkdir(join(testDir, 'commands', 'gsd'), { recursive: true });
    await writeFile(join(testDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);

    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.commands).toHaveLength(1);
    expect(result.agents).toEqual([]);
    expect(result.teams).toEqual([]);
  });

  it('tolerates missing teams/ directory', async () => {
    // Create commands and agents but no teams/
    await mkdir(join(testDir, 'commands', 'gsd'), { recursive: true });
    await mkdir(join(testDir, 'agents'), { recursive: true });
    await writeFile(join(testDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);
    await writeFile(join(testDir, 'agents', 'gsd-executor.md'), AGENT_EXECUTOR);

    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    expect(result.commands).toHaveLength(1);
    expect(result.agents).toHaveLength(1);
    expect(result.teams).toEqual([]);
  });

  it('tolerates team directory without config.json', async () => {
    // Create team dir with no config.json inside
    await mkdir(join(testDir, 'teams', 'broken-team'), { recursive: true });
    // Add a valid team too
    await mkdir(join(testDir, 'teams', 'good-team'), { recursive: true });
    await writeFile(
      join(testDir, 'teams', 'good-team', 'config.json'),
      TEAM_CONFIG,
    );

    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    // broken-team skipped, good-team parsed
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe('gsd-research-team');

    // Warning generated for broken team
    expect(service.warnings.length).toBeGreaterThanOrEqual(1);
    const warning = service.warnings.find((w) => w.path.includes('broken-team'));
    expect(warning).toBeDefined();
  });

  it('tolerates command file with empty frontmatter', async () => {
    // Create a file with empty frontmatter (---\n---\n)
    await mkdir(join(testDir, 'commands', 'gsd'), { recursive: true });
    await writeFile(
      join(testDir, 'commands', 'gsd', 'empty-fm.md'),
      '---\n---\nJust body, no fields.',
    );
    // Also add a valid command
    await writeFile(join(testDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);

    const service = new GsdDiscoveryService(testDir);
    const result = await service.discover();

    // Valid command parsed, empty frontmatter skipped
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0].name).toBe('gsd:plan-phase');

    // Warning for the empty frontmatter file
    expect(service.warnings.length).toBeGreaterThanOrEqual(1);
    const warning = service.warnings.find((w) => w.path.includes('empty-fm.md'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('parse-error');
  });
});

// ============================================================================
// Integration tests (36-03)
// ============================================================================

describe('integration', () => {
  let fixtureDir: string;

  const COMMAND_DEBUG = [
    '---',
    'name: gsd:debug',
    'description: Systematic debugging with persistent state',
    'argument-hint: "[description]"',
    'agent: gsd-debugger',
    '---',
    '',
    '<objective>',
    'Systematically debug the reported issue.',
    '</objective>',
    '',
    '<process>',
    'The subagent should:',
    '<objective>',
    'This inner objective should NOT be extracted.',
    '</objective>',
    '</process>',
  ].join('\n');

  const TEAM_PIPELINE = JSON.stringify({
    name: 'gsd-pipeline-team',
    description: 'Pipeline team for sequential workflows',
    topology: 'pipeline',
    members: [
      { name: 'analyzer', role: 'worker', description: 'Analyzes input', tools: 'Read, Grep', model: 'sonnet' },
      { name: 'builder', role: 'worker', description: 'Builds output', tools: 'Write, Bash', model: 'opus' },
      { name: 'reviewer', role: 'worker', description: 'Reviews result', tools: 'Read', model: 'haiku' },
    ],
  }, null, 2);

  beforeEach(async () => {
    fixtureDir = join(
      tmpdir(),
      `gsd-integration-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    // Build realistic directory structure
    await mkdir(join(fixtureDir, 'commands', 'gsd'), { recursive: true });
    await mkdir(join(fixtureDir, 'agents'), { recursive: true });
    await mkdir(join(fixtureDir, 'teams', 'research-team'), { recursive: true });
    await mkdir(join(fixtureDir, 'teams', 'pipeline-team'), { recursive: true });
    await mkdir(join(fixtureDir, 'get-shit-done'), { recursive: true });

    // Commands
    await writeFile(join(fixtureDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);
    await writeFile(join(fixtureDir, 'commands', 'gsd', 'execute-phase.md'), COMMAND_EXECUTE_PHASE);
    await writeFile(join(fixtureDir, 'commands', 'gsd', 'debug.md'), COMMAND_DEBUG);

    // Agents (2 gsd-*, 1 non-gsd)
    await writeFile(join(fixtureDir, 'agents', 'gsd-executor.md'), AGENT_EXECUTOR);
    await writeFile(join(fixtureDir, 'agents', 'gsd-planner.md'), AGENT_PLANNER);
    await writeFile(join(fixtureDir, 'agents', 'not-gsd-agent.md'), AGENT_NON_GSD);

    // Teams (GSD-native + example format)
    await writeFile(join(fixtureDir, 'teams', 'research-team', 'config.json'), TEAM_CONFIG);
    await writeFile(join(fixtureDir, 'teams', 'pipeline-team', 'config.json'), TEAM_PIPELINE);

    // VERSION
    await writeFile(join(fixtureDir, 'get-shit-done', 'VERSION'), '1.12.1');
  });

  afterEach(async () => {
    await rm(fixtureDir, { recursive: true, force: true });
  });

  it('full discovery against realistic fixture', async () => {
    const service = new GsdDiscoveryService(fixtureDir, 'global');
    const result = await service.discover();

    // Commands: plan-phase, execute-phase, debug
    expect(result.commands).toHaveLength(3);
    const commandNames = result.commands.map((c) => c.name).sort();
    expect(commandNames).toEqual(['gsd:debug', 'gsd:execute-phase', 'gsd:plan-phase']);

    // Agents: gsd-executor, gsd-planner (not-gsd-agent excluded)
    expect(result.agents).toHaveLength(2);
    const agentNames = result.agents.map((a) => a.name).sort();
    expect(agentNames).toEqual(['gsd-executor', 'gsd-planner']);

    // Teams: research-team (GSD-native), pipeline-team (example format)
    expect(result.teams).toHaveLength(2);
    const teamNames = result.teams.map((t) => t.name).sort();
    expect(teamNames).toEqual(['gsd-pipeline-team', 'gsd-research-team']);

    // debug.md extracts FIRST objective only (not the inner one)
    const debugCmd = result.commands.find((c) => c.name === 'gsd:debug');
    expect(debugCmd).toBeDefined();
    expect(debugCmd!.objective).toBe('Systematically debug the reported issue.');
    expect(debugCmd!.objective).not.toContain('inner objective');

    // Version
    expect(result.version).toBe('1.12.1');

    // Location and basePath
    expect(result.location).toBe('global');
    expect(result.basePath).toBe(fixtureDir);

    // No warnings for valid fixture
    expect(service.warnings).toHaveLength(0);

    // Pipeline team has 3 members (example format)
    const pipelineTeam = result.teams.find((t) => t.name === 'gsd-pipeline-team');
    expect(pipelineTeam).toBeDefined();
    expect(pipelineTeam!.memberCount).toBe(3);

    // Research team has 2 members (GSD-native format)
    const researchTeam = result.teams.find((t) => t.name === 'gsd-research-team');
    expect(researchTeam).toBeDefined();
    expect(researchTeam!.memberCount).toBe(2);
  });
});
