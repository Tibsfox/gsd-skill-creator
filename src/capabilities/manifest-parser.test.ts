/**
 * Tests for the manifest parser (inverse of renderManifest).
 *
 * Uses renderManifest() to generate test fixtures, ensuring roundtrip fidelity:
 * render -> parse should reconstruct the original manifest data.
 */

import { describe, it, expect } from 'vitest';
import { parseManifest } from './manifest-parser.js';
import { renderManifest } from './manifest-renderer.js';
import type {
  CapabilityManifest,
  SkillCapability,
  AgentCapability,
  TeamCapability,
} from './types.js';

describe('parseManifest', () => {
  // --------------------------------------------------------------------------
  // Test 1: Roundtrip skills
  // --------------------------------------------------------------------------

  it('roundtrips skills through render and parse', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'skills_hash_0001',
      skills: [
        {
          name: 'git-commit',
          description: 'Generates conventional commits',
          scope: 'project',
          contentHash: '1111111111111111',
        },
        {
          name: 'beautiful-commits',
          description: 'Enhanced commit messages',
          scope: 'user',
          contentHash: '2222222222222222',
        },
      ],
      agents: [],
      teams: [],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.skills).toHaveLength(2);
    expect(parsed.skills[0]).toEqual<SkillCapability>({
      name: 'git-commit',
      description: 'Generates conventional commits',
      scope: 'project',
      contentHash: '1111111111111111',
    });
    expect(parsed.skills[1]).toEqual<SkillCapability>({
      name: 'beautiful-commits',
      description: 'Enhanced commit messages',
      scope: 'user',
      contentHash: '2222222222222222',
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: Roundtrip agents (with and without optional fields)
  // --------------------------------------------------------------------------

  it('roundtrips agents with optional tools and model', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'agents_hash_001',
      skills: [],
      agents: [
        {
          name: 'gsd-executor',
          description: 'Executes GSD plans autonomously',
          scope: 'project',
          tools: 'Read, Write, Bash',
          model: 'opus',
          contentHash: '3333333333333333',
        },
        {
          name: 'simple-agent',
          description: 'A minimal agent',
          scope: 'user',
          contentHash: '4444444444444444',
        },
      ],
      teams: [],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.agents).toHaveLength(2);
    expect(parsed.agents[0]).toEqual<AgentCapability>({
      name: 'gsd-executor',
      description: 'Executes GSD plans autonomously',
      scope: 'project',
      tools: 'Read, Write, Bash',
      model: 'opus',
      contentHash: '3333333333333333',
    });
    expect(parsed.agents[1]).toEqual<AgentCapability>({
      name: 'simple-agent',
      description: 'A minimal agent',
      scope: 'user',
      contentHash: '4444444444444444',
    });
    // Optional fields should be undefined when not set
    expect(parsed.agents[1].tools).toBeUndefined();
    expect(parsed.agents[1].model).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Test 3: Roundtrip teams
  // --------------------------------------------------------------------------

  it('roundtrips teams with topology and member count', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'teams_hash_0001',
      skills: [],
      agents: [],
      teams: [
        {
          name: 'research-team',
          description: 'Research and analysis',
          scope: 'project',
          topology: 'leader-worker',
          memberCount: 3,
          contentHash: '5555555555555555',
        },
      ],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.teams).toHaveLength(1);
    expect(parsed.teams[0]).toEqual<TeamCapability>({
      name: 'research-team',
      description: 'Research and analysis',
      scope: 'project',
      topology: 'leader-worker',
      memberCount: 3,
      contentHash: '5555555555555555',
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: Roundtrip full manifest (all three sections + frontmatter)
  // --------------------------------------------------------------------------

  it('roundtrips a full manifest with all sections', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'full_hash_00001',
      skills: [
        {
          name: 'code-review',
          description: 'Reviews code for quality',
          scope: 'project',
          contentHash: 'aaaaaaaaaaaaaaaa',
        },
      ],
      agents: [
        {
          name: 'planner',
          description: 'Plans work phases',
          scope: 'user',
          tools: 'Read, Glob',
          model: 'sonnet',
          contentHash: 'bbbbbbbbbbbbbbbb',
        },
      ],
      teams: [
        {
          name: 'deploy-team',
          description: 'Handles deployments',
          scope: 'project',
          topology: 'pipeline',
          memberCount: 4,
          contentHash: 'cccccccccccccccc',
        },
      ],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.version).toBe(1);
    expect(parsed.generatedAt).toBe('2026-02-08T12:00:00Z');
    expect(parsed.contentHash).toBe('full_hash_00001');
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.agents).toHaveLength(1);
    expect(parsed.teams).toHaveLength(1);
    expect(parsed.skills[0].name).toBe('code-review');
    expect(parsed.agents[0].name).toBe('planner');
    expect(parsed.teams[0].name).toBe('deploy-team');
  });

  // --------------------------------------------------------------------------
  // Test 5: Empty sections return empty arrays
  // --------------------------------------------------------------------------

  it('returns empty arrays for empty sections', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'empty_hash_0001',
      skills: [],
      agents: [],
      teams: [],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.skills).toEqual([]);
    expect(parsed.agents).toEqual([]);
    expect(parsed.teams).toEqual([]);
    // Must be arrays, not null/undefined
    expect(Array.isArray(parsed.skills)).toBe(true);
    expect(Array.isArray(parsed.agents)).toBe(true);
    expect(Array.isArray(parsed.teams)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 6: Frontmatter extraction
  // --------------------------------------------------------------------------

  it('extracts frontmatter fields correctly', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T14:30:00Z',
      contentHash: 'front_hash_0001',
      skills: [],
      agents: [],
      teams: [],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    expect(parsed.version).toBe(1);
    expect(parsed.generatedAt).toBe('2026-02-08T14:30:00Z');
    expect(parsed.contentHash).toBe('front_hash_0001');
  });

  // --------------------------------------------------------------------------
  // Test 7: Markdown escaping roundtrip (pipe in description)
  // --------------------------------------------------------------------------

  it('handles pipe characters in descriptions via roundtrip', () => {
    const manifest: CapabilityManifest = {
      version: 1,
      generatedAt: '2026-02-08T12:00:00Z',
      contentHash: 'pipe_hash_00001',
      skills: [
        {
          name: 'pipe-skill',
          description: 'Uses | pipe | in description',
          scope: 'project',
          contentHash: '7777777777777777',
        },
      ],
      agents: [],
      teams: [],
    };

    const rendered = renderManifest(manifest);
    const parsed = parseManifest(rendered);

    // After roundtrip, pipe characters should be restored
    expect(parsed.skills[0].description).toBe(
      'Uses | pipe | in description'
    );
    expect(parsed.skills[0].name).toBe('pipe-skill');
  });
});
