import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  generateAgentContent,
  writeTeamAgentFiles,
  type AgentMemberInput,
} from './team-agent-generator.js';
import { LEADER_TOOLS, WORKER_TOOLS } from './templates.js';

describe('generateAgentContent', () => {
  // ==========================================================================
  // Coordinator content
  // ==========================================================================

  describe('coordinator role', () => {
    it('contains frontmatter with name matching agentId', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-lead',
        name: 'Lead',
        agentType: 'coordinator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', LEADER_TOOLS);

      expect(content).toContain('name: dev-lead');
    });

    it('contains description mentioning team name', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-lead',
        name: 'Lead',
        agentType: 'coordinator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', LEADER_TOOLS);

      expect(content).toContain('dev-team');
      expect(content).toContain('Lead coordinator');
    });

    it('includes TeammateTool in tools', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-lead',
        name: 'Lead',
        agentType: 'coordinator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', LEADER_TOOLS);

      expect(content).toContain('TeammateTool');
    });

    it('has color #4A90D9', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-lead',
        name: 'Lead',
        agentType: 'coordinator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', LEADER_TOOLS);

      expect(content).toContain('#4A90D9');
    });

    it('has "lead agent" language in body', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-lead',
        name: 'Lead',
        agentType: 'coordinator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', LEADER_TOOLS);

      expect(content).toContain('lead agent');
    });
  });

  // ==========================================================================
  // Orchestrator content (same as coordinator)
  // ==========================================================================

  describe('orchestrator role', () => {
    it('generates leader-style content for orchestrator agentType', () => {
      const member: AgentMemberInput = {
        agentId: 'pipe-lead',
        name: 'Lead',
        agentType: 'orchestrator',
        tools: LEADER_TOOLS,
      };

      const content = generateAgentContent(member, 'pipe-team', LEADER_TOOLS);

      expect(content).toContain('lead agent');
      expect(content).toContain('#4A90D9');
      expect(content).toContain('TeammateTool');
    });
  });

  // ==========================================================================
  // Worker content
  // ==========================================================================

  describe('worker role', () => {
    it('contains frontmatter with name matching agentId', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-worker-1',
        name: 'Worker 1',
        agentType: 'worker',
        tools: WORKER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', WORKER_TOOLS);

      expect(content).toContain('name: dev-worker-1');
    });

    it('has tools without TeammateTool', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-worker-1',
        name: 'Worker 1',
        agentType: 'worker',
        tools: WORKER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', WORKER_TOOLS);

      // Worker tools don't include TeammateTool
      expect(content).not.toContain('TeammateTool');
    });

    it('has color #50C878', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-worker-1',
        name: 'Worker 1',
        agentType: 'worker',
        tools: WORKER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', WORKER_TOOLS);

      expect(content).toContain('#50C878');
    });

    it('has "execute tasks" language in body', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-worker-1',
        name: 'Worker 1',
        agentType: 'worker',
        tools: WORKER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', WORKER_TOOLS);

      expect(content).toContain('execute tasks');
    });

    it('includes member name in body', () => {
      const member: AgentMemberInput = {
        agentId: 'dev-worker-1',
        name: 'Worker 1',
        agentType: 'worker',
        tools: WORKER_TOOLS,
      };

      const content = generateAgentContent(member, 'dev-team', WORKER_TOOLS);

      expect(content).toContain('Worker 1');
    });
  });
});

// ============================================================================
// writeTeamAgentFiles
// ============================================================================

describe('writeTeamAgentFiles', () => {
  let tempDir: string;
  let agentsDir: string;

  const members: AgentMemberInput[] = [
    { agentId: 'team-lead', name: 'Lead', agentType: 'coordinator', tools: LEADER_TOOLS },
    { agentId: 'team-worker-1', name: 'Worker 1', agentType: 'worker', tools: WORKER_TOOLS },
    { agentId: 'team-worker-2', name: 'Worker 2', agentType: 'worker', tools: WORKER_TOOLS },
  ];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-gen-test-'));
    agentsDir = path.join(tempDir, 'agents');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // Creates new files
  // ==========================================================================

  describe('creates new files', () => {
    it('creates .md files for all members in empty agentsDir', () => {
      const result = writeTeamAgentFiles(members, 'my-team', agentsDir);

      expect(result.created).toEqual(['team-lead', 'team-worker-1', 'team-worker-2']);
      expect(result.skipped).toEqual([]);

      // Verify files exist
      expect(fs.existsSync(path.join(agentsDir, 'team-lead.md'))).toBe(true);
      expect(fs.existsSync(path.join(agentsDir, 'team-worker-1.md'))).toBe(true);
      expect(fs.existsSync(path.join(agentsDir, 'team-worker-2.md'))).toBe(true);
    });

    it('creates agentsDir if it does not exist', () => {
      expect(fs.existsSync(agentsDir)).toBe(false);

      writeTeamAgentFiles(members, 'my-team', agentsDir);

      expect(fs.existsSync(agentsDir)).toBe(true);
    });
  });

  // ==========================================================================
  // Skips existing files
  // ==========================================================================

  describe('skips existing files', () => {
    it('adds pre-existing member to skipped array', () => {
      // Pre-create one agent file
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(path.join(agentsDir, 'team-lead.md'), 'custom content', 'utf-8');

      const result = writeTeamAgentFiles(members, 'my-team', agentsDir);

      expect(result.skipped).toEqual(['team-lead']);
      expect(result.created).toEqual(['team-worker-1', 'team-worker-2']);
    });

    it('never overwrites existing agent file content', () => {
      const customContent = '# My custom agent definition\nDo not replace this.';

      // Pre-create agent file with custom content
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(path.join(agentsDir, 'team-lead.md'), customContent, 'utf-8');

      writeTeamAgentFiles(members, 'my-team', agentsDir);

      // Verify original content is preserved
      const content = fs.readFileSync(path.join(agentsDir, 'team-lead.md'), 'utf-8');
      expect(content).toBe(customContent);
    });
  });

  // ==========================================================================
  // Content verification
  // ==========================================================================

  describe('content verification', () => {
    it('creates coordinator file with leader content', () => {
      writeTeamAgentFiles(members, 'my-team', agentsDir);

      const content = fs.readFileSync(path.join(agentsDir, 'team-lead.md'), 'utf-8');

      expect(content).toContain('name: team-lead');
      expect(content).toContain('my-team');
      expect(content).toContain('#4A90D9');
      expect(content).toContain('lead agent');
    });

    it('creates worker file with worker content', () => {
      writeTeamAgentFiles(members, 'my-team', agentsDir);

      const content = fs.readFileSync(path.join(agentsDir, 'team-worker-1.md'), 'utf-8');

      expect(content).toContain('name: team-worker-1');
      expect(content).toContain('my-team');
      expect(content).toContain('#50C878');
      expect(content).toContain('execute tasks');
    });
  });
});
