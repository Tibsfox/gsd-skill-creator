import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { nonInteractiveCreate } from './team-wizard.js';
import type { WizardOptions, CreatePaths } from './team-wizard.js';

describe('nonInteractiveCreate', () => {
  let tempDir: string;
  let teamsDir: string;
  let agentsDir: string;
  let paths: CreatePaths;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-test-'));
    teamsDir = path.join(tempDir, 'teams');
    agentsDir = path.join(tempDir, 'agents');
    paths = { teamsDir, agentsDir };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // Leader/Worker pattern
  // ==========================================================================

  describe('leader-worker pattern', () => {
    it('creates team with correct config structure', async () => {
      await nonInteractiveCreate(
        { name: 'my-team', pattern: 'leader-worker' },
        paths
      );

      const configPath = path.join(teamsDir, 'my-team', 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.name).toBe('my-team');
      expect(config.topology).toBe('leader-worker');
      expect(config.leadAgentId).toBe('my-team-lead');
      // Default 3 workers + 1 lead = 4 members
      expect(config.members).toHaveLength(4);
      expect(config.members[0].agentType).toBe('coordinator');
      expect(config.members[1].agentType).toBe('worker');
    });
  });

  // ==========================================================================
  // Pipeline pattern
  // ==========================================================================

  describe('pipeline pattern', () => {
    it('creates pipeline team with sequential stage members', async () => {
      await nonInteractiveCreate(
        { name: 'data-pipe', pattern: 'pipeline' },
        paths
      );

      const configPath = path.join(teamsDir, 'data-pipe', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config.topology).toBe('pipeline');
      expect(config.leadAgentId).toBe('data-pipe-lead');
      // Default 3 stages + 1 lead = 4
      expect(config.members).toHaveLength(4);
      expect(config.members[0].agentType).toBe('orchestrator');
      expect(config.members[1].agentId).toBe('data-pipe-stage-1');
    });
  });

  // ==========================================================================
  // Swarm pattern
  // ==========================================================================

  describe('swarm pattern', () => {
    it('creates swarm team', async () => {
      await nonInteractiveCreate(
        { name: 'research-swarm', pattern: 'swarm' },
        paths
      );

      const configPath = path.join(teamsDir, 'research-swarm', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config.topology).toBe('swarm');
      expect(config.leadAgentId).toBe('research-swarm-lead');
      expect(config.members).toHaveLength(4);
    });
  });

  // ==========================================================================
  // Defaults
  // ==========================================================================

  describe('defaults', () => {
    it('defaults to project scope', async () => {
      await nonInteractiveCreate(
        { name: 'scoped-team', pattern: 'leader-worker' },
        paths
      );

      // Config was saved to the provided teamsDir (paths override),
      // but we verify it exists there (project scope behavior)
      const configPath = path.join(teamsDir, 'scoped-team', 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('defaults to 3 workers when members not specified', async () => {
      await nonInteractiveCreate(
        { name: 'default-team', pattern: 'leader-worker' },
        paths
      );

      const configPath = path.join(teamsDir, 'default-team', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // 1 lead + 3 workers = 4
      expect(config.members).toHaveLength(4);
    });
  });

  // ==========================================================================
  // Custom worker count
  // ==========================================================================

  describe('custom worker count', () => {
    it('respects members option for worker count', async () => {
      await nonInteractiveCreate(
        { name: 'big-team', pattern: 'leader-worker', members: '5' },
        paths
      );

      const configPath = path.join(teamsDir, 'big-team', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // 1 lead + 5 workers = 6
      expect(config.members).toHaveLength(6);
    });
  });

  // ==========================================================================
  // Validation errors
  // ==========================================================================

  describe('validation', () => {
    it('rejects missing name', async () => {
      await expect(
        nonInteractiveCreate({ pattern: 'leader-worker' }, paths)
      ).rejects.toThrow('Team name is required');
    });

    it('rejects missing pattern', async () => {
      await expect(
        nonInteractiveCreate({ name: 'my-team' }, paths)
      ).rejects.toThrow('Team pattern is required');
    });

    it('rejects invalid pattern', async () => {
      await expect(
        nonInteractiveCreate({ name: 'my-team', pattern: 'invalid' }, paths)
      ).rejects.toThrow('Invalid pattern "invalid"');
    });

    it('rejects invalid name format', async () => {
      await expect(
        nonInteractiveCreate({ name: 'MY_TEAM', pattern: 'leader-worker' }, paths)
      ).rejects.toThrow('Invalid team name');
    });

    it('rejects invalid members count', async () => {
      await expect(
        nonInteractiveCreate(
          { name: 'my-team', pattern: 'leader-worker', members: 'abc' },
          paths
        )
      ).rejects.toThrow('Members must be a number between 1 and 10');
    });
  });

  // ==========================================================================
  // Name conflicts
  // ==========================================================================

  describe('name conflicts', () => {
    it('rejects existing team name', async () => {
      // Create team first
      await nonInteractiveCreate(
        { name: 'taken-team', pattern: 'leader-worker' },
        paths
      );

      // Try to create again
      await expect(
        nonInteractiveCreate(
          { name: 'taken-team', pattern: 'leader-worker' },
          paths
        )
      ).rejects.toThrow('already exists');
    });
  });

  // ==========================================================================
  // Agent file generation
  // ==========================================================================

  describe('agent file generation', () => {
    it('generates agent files for all members', async () => {
      await nonInteractiveCreate(
        { name: 'agent-team', pattern: 'leader-worker', members: '2' },
        paths
      );

      // 1 lead + 2 workers = 3 agent files
      expect(fs.existsSync(path.join(agentsDir, 'agent-team-lead.md'))).toBe(true);
      expect(fs.existsSync(path.join(agentsDir, 'agent-team-worker-1.md'))).toBe(true);
      expect(fs.existsSync(path.join(agentsDir, 'agent-team-worker-2.md'))).toBe(true);
    });

    it('generates leader content for lead agent file', async () => {
      await nonInteractiveCreate(
        { name: 'content-team', pattern: 'leader-worker', members: '1' },
        paths
      );

      const leadContent = fs.readFileSync(
        path.join(agentsDir, 'content-team-lead.md'),
        'utf-8'
      );

      expect(leadContent).toContain('name: content-team-lead');
      expect(leadContent).toContain('lead agent');
      expect(leadContent).toContain('content-team');
    });

    it('generates worker content for worker agent files', async () => {
      await nonInteractiveCreate(
        { name: 'content-team', pattern: 'leader-worker', members: '1' },
        paths
      );

      const workerContent = fs.readFileSync(
        path.join(agentsDir, 'content-team-worker-1.md'),
        'utf-8'
      );

      expect(workerContent).toContain('name: content-team-worker-1');
      expect(workerContent).toContain('execute tasks');
    });

    it('skips existing agent files without overwriting', async () => {
      // Pre-create an agent file
      fs.mkdirSync(agentsDir, { recursive: true });
      const customContent = '# Custom agent definition\nDo not overwrite.';
      fs.writeFileSync(
        path.join(agentsDir, 'skip-team-lead.md'),
        customContent,
        'utf-8'
      );

      await nonInteractiveCreate(
        { name: 'skip-team', pattern: 'leader-worker', members: '1' },
        paths
      );

      // Lead file should be preserved
      const leadContent = fs.readFileSync(
        path.join(agentsDir, 'skip-team-lead.md'),
        'utf-8'
      );
      expect(leadContent).toBe(customContent);

      // Worker file should be newly created
      expect(fs.existsSync(path.join(agentsDir, 'skip-team-worker-1.md'))).toBe(true);
    });
  });

  // ==========================================================================
  // Description option
  // ==========================================================================

  describe('description option', () => {
    it('passes custom description to config', async () => {
      await nonInteractiveCreate(
        {
          name: 'desc-team',
          pattern: 'leader-worker',
          description: 'My custom team description',
        },
        paths
      );

      const configPath = path.join(teamsDir, 'desc-team', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config.description).toBe('My custom team description');
    });
  });
});
