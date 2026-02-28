/**
 * Tests for the GSD team config parser.
 *
 * Covers:
 * - parseTeamConfig: JSON-based team config parsing
 * - GSD-native teams (with agentId members and leadAgentId)
 * - Example teams (with role/description/tools/model members)
 * - Error handling for malformed input
 */

import { describe, it, expect } from 'vitest';
import { parseTeamConfig } from './team-parser.js';

describe('parseTeamConfig', () => {
  it('parses GSD-native team config', () => {
    const config = JSON.stringify({
      name: 'gsd-research-team',
      description: 'Research team',
      topology: 'leader-worker',
      leadAgentId: 'gsd-researcher',
      members: [
        { agentId: 'gsd-researcher', role: 'leader' },
        { agentId: 'gsd-worker', role: 'worker' },
      ],
    });

    const result = parseTeamConfig(config, '/home/user/.claude/teams/research-team/config.json');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd-research-team');
    expect(result!.description).toBe('Research team');
    expect(result!.topology).toBe('leader-worker');
    expect(result!.memberCount).toBe(2);
    expect(result!.leadAgentId).toBe('gsd-researcher');
  });

  it('parses example team config (different schema)', () => {
    const config = JSON.stringify({
      name: 'devops-pipeline-team',
      description: 'CI/CD audit',
      topology: 'leader-worker',
      members: [
        {
          name: 'coordinator',
          role: 'leader',
          description: 'Leads the team',
          tools: ['Read'],
          model: 'sonnet',
        },
      ],
    });

    const result = parseTeamConfig(config, '/home/user/.claude/teams/devops-pipeline/config.json');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('devops-pipeline-team');
    expect(result!.description).toBe('CI/CD audit');
    expect(result!.topology).toBe('leader-worker');
    expect(result!.memberCount).toBe(1);
    expect(result!.leadAgentId).toBeUndefined();
  });

  it('returns null for invalid JSON', () => {
    expect(parseTeamConfig('{invalid', '/path/to/config.json')).toBeNull();
  });

  it('returns null when name is missing', () => {
    const config = JSON.stringify({
      description: 'A team without a name',
      topology: 'leader-worker',
    });

    expect(parseTeamConfig(config, '/path/to/config.json')).toBeNull();
  });

  it('handles missing members array', () => {
    const config = JSON.stringify({
      name: 'minimal-team',
      description: 'A team with no members defined',
    });

    const result = parseTeamConfig(config, '/path/to/config.json');
    expect(result).not.toBeNull();
    expect(result!.memberCount).toBe(0);
  });

  it('handles empty members array', () => {
    const config = JSON.stringify({
      name: 'empty-team',
      description: 'A team with empty members',
      members: [],
    });

    const result = parseTeamConfig(config, '/path/to/config.json');
    expect(result).not.toBeNull();
    expect(result!.memberCount).toBe(0);
  });

  it('includes filePath in result', () => {
    const config = JSON.stringify({
      name: 'test-team',
      description: 'Test',
    });

    const filePath = '/home/user/.claude/teams/test-team/config.json';
    const result = parseTeamConfig(config, filePath);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(filePath);
  });
});
