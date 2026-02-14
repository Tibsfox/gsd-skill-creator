import { describe, it, expect } from 'vitest';
import {
  buildTopologyData,
  type TopologySource,
} from './topology-data.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptySource(): TopologySource {
  return {
    agents: [],
    skills: [],
    teams: [],
    activeAgentIds: [],
    activeSkillIds: [],
  };
}

// ---------------------------------------------------------------------------
// buildTopologyData -- Empty source
// ---------------------------------------------------------------------------

describe('buildTopologyData', () => {
  describe('empty source', () => {
    it('returns TopologyData with empty nodes and edges', () => {
      const result = buildTopologyData(emptySource());
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('viewBox has default dimensions (800x600)', () => {
      const result = buildTopologyData(emptySource());
      expect(result.viewBox).toEqual({ width: 800, height: 600 });
    });
  });

  // -------------------------------------------------------------------------
  // Agent nodes
  // -------------------------------------------------------------------------

  describe('agent nodes', () => {
    it('each agent becomes a TopologyNode with type agent', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Auth Agent', domain: 'backend', skills: [] }],
      };
      const result = buildTopologyData(source);
      const agentNode = result.nodes.find((n) => n.id === 'a1');
      expect(agentNode).toBeDefined();
      expect(agentNode!.type).toBe('agent');
      expect(agentNode!.label).toBe('Auth Agent');
    });

    it('agent domain maps to node domain', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'frontend', skills: [] }],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].domain).toBe('frontend');
    });

    it('agent active when id in activeAgentIds', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: [] }],
        activeAgentIds: ['a1'],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].active).toBe(true);
    });

    it('agent inactive when id not in activeAgentIds', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: [] }],
        activeAgentIds: [],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].active).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Skill nodes
  // -------------------------------------------------------------------------

  describe('skill nodes', () => {
    it('each skill becomes TopologyNode with type skill', () => {
      const source: TopologySource = {
        ...emptySource(),
        skills: [{ id: 's1', name: 'Lint Skill', domain: 'testing' }],
      };
      const result = buildTopologyData(source);
      const skillNode = result.nodes.find((n) => n.id === 's1');
      expect(skillNode).toBeDefined();
      expect(skillNode!.type).toBe('skill');
      expect(skillNode!.label).toBe('Lint Skill');
    });

    it('skill domain from source', () => {
      const source: TopologySource = {
        ...emptySource(),
        skills: [{ id: 's1', name: 'Skill', domain: 'testing' }],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].domain).toBe('testing');
    });

    it('skill active when id in activeSkillIds', () => {
      const source: TopologySource = {
        ...emptySource(),
        skills: [{ id: 's1', name: 'Skill', domain: 'testing' }],
        activeSkillIds: ['s1'],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].active).toBe(true);
    });

    it('skill inactive when id not in activeSkillIds', () => {
      const source: TopologySource = {
        ...emptySource(),
        skills: [{ id: 's1', name: 'Skill', domain: 'testing' }],
        activeSkillIds: [],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].active).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Team nodes
  // -------------------------------------------------------------------------

  describe('team nodes', () => {
    it('each team becomes TopologyNode with type team', () => {
      const source: TopologySource = {
        ...emptySource(),
        teams: [{ id: 't1', name: 'Core Team', members: [], topology: 'single' }],
      };
      const result = buildTopologyData(source);
      const teamNode = result.nodes.find((n) => n.id === 't1');
      expect(teamNode).toBeDefined();
      expect(teamNode!.type).toBe('team');
      expect(teamNode!.label).toBe('Core Team');
    });

    it('team active when any member agent is active', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [
          { id: 'a1', name: 'Agent 1', domain: 'backend', skills: [] },
          { id: 'a2', name: 'Agent 2', domain: 'backend', skills: [] },
        ],
        teams: [{ id: 't1', name: 'Team', members: ['a1', 'a2'], topology: 'pipeline' }],
        activeAgentIds: ['a2'],
      };
      const result = buildTopologyData(source);
      const teamNode = result.nodes.find((n) => n.id === 't1');
      expect(teamNode!.active).toBe(true);
    });

    it('team inactive when no member agent is active', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [
          { id: 'a1', name: 'Agent 1', domain: 'backend', skills: [] },
        ],
        teams: [{ id: 't1', name: 'Team', members: ['a1'], topology: 'single' }],
        activeAgentIds: [],
      };
      const result = buildTopologyData(source);
      const teamNode = result.nodes.find((n) => n.id === 't1');
      expect(teamNode!.active).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Edge generation
  // -------------------------------------------------------------------------

  describe('edge generation', () => {
    it('agent-to-skill edges created when skill.agentId matches agent.id', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: ['s1'] }],
        skills: [{ id: 's1', name: 'Skill', domain: 'backend', agentId: 'a1' }],
      };
      const result = buildTopologyData(source);
      const edge = result.edges.find((e) => e.from === 'a1' && e.to === 's1');
      expect(edge).toBeDefined();
    });

    it('team-to-agent edges created when agent.id in team.members', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: [] }],
        teams: [{ id: 't1', name: 'Team', members: ['a1'], topology: 'single' }],
      };
      const result = buildTopologyData(source);
      const edge = result.edges.find((e) => e.from === 't1' && e.to === 'a1');
      expect(edge).toBeDefined();
    });

    it('edges active when both endpoints active', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: ['s1'] }],
        skills: [{ id: 's1', name: 'Skill', domain: 'backend', agentId: 'a1' }],
        activeAgentIds: ['a1'],
        activeSkillIds: ['s1'],
      };
      const result = buildTopologyData(source);
      const edge = result.edges.find((e) => e.from === 'a1' && e.to === 's1');
      expect(edge!.active).toBe(true);
    });

    it('edges inactive when either endpoint inactive', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: ['s1'] }],
        skills: [{ id: 's1', name: 'Skill', domain: 'backend', agentId: 'a1' }],
        activeAgentIds: ['a1'],
        activeSkillIds: [],
      };
      const result = buildTopologyData(source);
      const edge = result.edges.find((e) => e.from === 'a1' && e.to === 's1');
      expect(edge!.active).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Position layout
  // -------------------------------------------------------------------------

  describe('position layout', () => {
    it('nodes receive x,y coordinates (0-1 normalized)', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: [] }],
      };
      const result = buildTopologyData(source);
      expect(result.nodes[0].x).toBeGreaterThanOrEqual(0);
      expect(result.nodes[0].x).toBeLessThanOrEqual(1);
      expect(result.nodes[0].y).toBeGreaterThanOrEqual(0);
      expect(result.nodes[0].y).toBeLessThanOrEqual(1);
    });

    it('team nodes positioned left (x < 0.3)', () => {
      const source: TopologySource = {
        ...emptySource(),
        teams: [{ id: 't1', name: 'Team', members: [], topology: 'single' }],
      };
      const result = buildTopologyData(source);
      const teamNode = result.nodes.find((n) => n.id === 't1');
      expect(teamNode!.x).toBeLessThan(0.3);
    });

    it('agent nodes positioned center (0.3 < x < 0.7)', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [{ id: 'a1', name: 'Agent', domain: 'backend', skills: [] }],
      };
      const result = buildTopologyData(source);
      const agentNode = result.nodes.find((n) => n.id === 'a1');
      expect(agentNode!.x).toBeGreaterThan(0.3);
      expect(agentNode!.x).toBeLessThan(0.7);
    });

    it('skill nodes positioned right (x > 0.7)', () => {
      const source: TopologySource = {
        ...emptySource(),
        skills: [{ id: 's1', name: 'Skill', domain: 'testing' }],
      };
      const result = buildTopologyData(source);
      const skillNode = result.nodes.find((n) => n.id === 's1');
      expect(skillNode!.x).toBeGreaterThan(0.7);
    });

    it('nodes within same column spaced vertically', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [
          { id: 'a1', name: 'Agent 1', domain: 'backend', skills: [] },
          { id: 'a2', name: 'Agent 2', domain: 'backend', skills: [] },
          { id: 'a3', name: 'Agent 3', domain: 'backend', skills: [] },
        ],
      };
      const result = buildTopologyData(source);
      const agentNodes = result.nodes.filter((n) => n.type === 'agent');
      const yValues = agentNodes.map((n) => n.y).sort((a, b) => a - b);
      // All y values should be different
      expect(new Set(yValues).size).toBe(3);
      // Spacing should be even
      const gap1 = yValues[1] - yValues[0];
      const gap2 = yValues[2] - yValues[1];
      expect(Math.abs(gap1 - gap2)).toBeLessThan(0.01);
    });
  });

  // -------------------------------------------------------------------------
  // Collapse logic
  // -------------------------------------------------------------------------

  describe('collapse logic', () => {
    it('with 15 agents+skills, result has at most 12 nodes', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: Array.from({ length: 8 }, (_, i) => ({
          id: `a${i}`,
          name: `Agent ${i}`,
          domain: 'backend',
          skills: [],
        })),
        skills: Array.from({ length: 7 }, (_, i) => ({
          id: `s${i}`,
          name: `Skill ${i}`,
          domain: 'testing',
        })),
      };
      const result = buildTopologyData(source);
      expect(result.nodes.length).toBeLessThanOrEqual(12);
    });

    it('active nodes preserved over inactive during collapse', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: Array.from({ length: 10 }, (_, i) => ({
          id: `a${i}`,
          name: `Agent ${i}`,
          domain: 'backend',
          skills: [],
        })),
        skills: Array.from({ length: 5 }, (_, i) => ({
          id: `s${i}`,
          name: `Skill ${i}`,
          domain: 'testing',
        })),
        activeAgentIds: ['a9'],
        activeSkillIds: ['s4'],
      };
      const result = buildTopologyData(source);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('a9');
      expect(ids).toContain('s4');
    });

    it('collapsed nodes become single summary node', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: Array.from({ length: 15 }, (_, i) => ({
          id: `a${i}`,
          name: `Agent ${i}`,
          domain: 'backend',
          skills: [],
        })),
      };
      const result = buildTopologyData(source);
      const summaryNode = result.nodes.find((n) => n.id === 'collapsed-summary');
      expect(summaryNode).toBeDefined();
      expect(summaryNode!.label).toContain('more');
    });
  });

  // -------------------------------------------------------------------------
  // Edge filtering after collapse
  // -------------------------------------------------------------------------

  describe('edge filtering after collapse', () => {
    it('edges referencing collapsed nodes removed from result', () => {
      const agents = Array.from({ length: 14 }, (_, i) => ({
        id: `a${i}`,
        name: `Agent ${i}`,
        domain: 'backend',
        skills: [] as string[],
      }));
      const skills = [{ id: 's0', name: 'Skill 0', domain: 'testing', agentId: 'a13' }];
      const source: TopologySource = {
        ...emptySource(),
        agents,
        skills,
      };
      const result = buildTopologyData(source);
      // If a13 was collapsed, edges referencing it should be gone
      const visibleIds = new Set(result.nodes.map((n) => n.id));
      for (const edge of result.edges) {
        expect(visibleIds.has(edge.from)).toBe(true);
        expect(visibleIds.has(edge.to)).toBe(true);
      }
    });

    it('edges between visible nodes preserved', () => {
      const source: TopologySource = {
        ...emptySource(),
        agents: [
          { id: 'a0', name: 'Agent 0', domain: 'backend', skills: ['s0'] },
        ],
        skills: [
          { id: 's0', name: 'Skill 0', domain: 'testing', agentId: 'a0' },
        ],
        activeAgentIds: ['a0'],
        activeSkillIds: ['s0'],
      };
      const result = buildTopologyData(source);
      const edge = result.edges.find((e) => e.from === 'a0' && e.to === 's0');
      expect(edge).toBeDefined();
    });
  });
});
