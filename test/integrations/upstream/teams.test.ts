import { describe, it, expect, vi } from 'vitest';
import yaml from 'js-yaml';
import { loadTeamConfig, type TeamYaml } from '../../../src/integrations/upstream/teams/index';

/* ------------------------------------------------------------------ */
/*  Inline YAML for test isolation                                     */
/* ------------------------------------------------------------------ */

const UPSTREAM_WATCH_YAML = `
name: upstream-watch
topology: pipeline
description: >
  Monitors Anthropic public channels for content changes, then classifies
  detected diffs by type, severity, and affected domains. The SENTINEL
  fetches and hashes; the ANALYST classifies and scores.
members:
  - sentinel
  - analyst
flow: sentinel -> analyst
`;

const IMPACT_RESPONSE_YAML = `
name: impact-response
topology: router
description: >
  Routes classified change events based on patchability. Patchable changes
  flow to PATCHER for automated remediation; non-patchable changes flow
  to HERALD for human briefing and escalation.
members:
  - patcher
  - herald
routes:
  patchable: patcher
  non-patchable: herald
`;

const FULL_CYCLE_YAML = `
name: full-cycle
topology: leader-worker
description: >
  End-to-end upstream intelligence pipeline led by HERALD. Orchestrates
  all five agents from channel monitoring through impact tracing, patch
  application, and briefing delivery.
leader: herald
members:
  - sentinel
  - analyst
  - tracer
  - patcher
  - herald
workers:
  - sentinel
  - analyst
  - tracer
  - patcher
`;

/* ------------------------------------------------------------------ */
/*  upstream-watch team                                                 */
/* ------------------------------------------------------------------ */

describe('upstream-watch pipeline team', () => {
  it('YAML is valid and parseable', () => {
    const readFile = vi.fn().mockReturnValue(UPSTREAM_WATCH_YAML);
    const config = loadTeamConfig('upstream-watch', readFile);
    expect(config).toBeDefined();
    expect(config.name).toBe('upstream-watch');
  });

  it('has SENTINEL → ANALYST pipeline order', () => {
    const readFile = vi.fn().mockReturnValue(UPSTREAM_WATCH_YAML);
    const config = loadTeamConfig('upstream-watch', readFile);
    expect(config.topology).toBe('pipeline');
    expect(config.members).toEqual(['sentinel', 'analyst']);
    expect(config.flow).toBe('sentinel -> analyst');
  });
});

/* ------------------------------------------------------------------ */
/*  impact-response team                                               */
/* ------------------------------------------------------------------ */

describe('impact-response router team', () => {
  it('YAML is valid and parseable', () => {
    const readFile = vi.fn().mockReturnValue(IMPACT_RESPONSE_YAML);
    const config = loadTeamConfig('impact-response', readFile);
    expect(config).toBeDefined();
    expect(config.name).toBe('impact-response');
  });

  it('routes to PATCHER (patchable) or HERALD (non-patchable)', () => {
    const readFile = vi.fn().mockReturnValue(IMPACT_RESPONSE_YAML);
    const config = loadTeamConfig('impact-response', readFile);
    expect(config.topology).toBe('router');
    expect(config.routes).toEqual({
      patchable: 'patcher',
      'non-patchable': 'herald',
    });
  });
});

/* ------------------------------------------------------------------ */
/*  full-cycle team                                                    */
/* ------------------------------------------------------------------ */

describe('full-cycle leader-worker team', () => {
  it('YAML is valid and parseable', () => {
    const readFile = vi.fn().mockReturnValue(FULL_CYCLE_YAML);
    const config = loadTeamConfig('full-cycle', readFile);
    expect(config).toBeDefined();
    expect(config.name).toBe('full-cycle');
  });

  it('includes all 5 agents with HERALD as leader', () => {
    const readFile = vi.fn().mockReturnValue(FULL_CYCLE_YAML);
    const config = loadTeamConfig('full-cycle', readFile);
    expect(config.topology).toBe('leader-worker');
    expect(config.leader).toBe('herald');
    expect(config.members).toEqual([
      'sentinel',
      'analyst',
      'tracer',
      'patcher',
      'herald',
    ]);
    expect(config.workers).toEqual(['sentinel', 'analyst', 'tracer', 'patcher']);
  });
});

/* ------------------------------------------------------------------ */
/*  Cross-team validation                                              */
/* ------------------------------------------------------------------ */

describe('Team YAML validation', () => {
  it('all teams have description fields', () => {
    const teams = [
      { name: 'upstream-watch', yaml: UPSTREAM_WATCH_YAML },
      { name: 'impact-response', yaml: IMPACT_RESPONSE_YAML },
      { name: 'full-cycle', yaml: FULL_CYCLE_YAML },
    ];

    for (const team of teams) {
      const readFile = vi.fn().mockReturnValue(team.yaml);
      const config = loadTeamConfig(team.name, readFile);
      expect(config.description).toBeTruthy();
      expect(typeof config.description).toBe('string');
    }
  });

  it('team descriptions match their operational purpose', () => {
    const readWatch = vi.fn().mockReturnValue(UPSTREAM_WATCH_YAML);
    const watch = loadTeamConfig('upstream-watch', readWatch);
    expect(watch.description).toMatch(/monitor/i);

    const readResponse = vi.fn().mockReturnValue(IMPACT_RESPONSE_YAML);
    const response = loadTeamConfig('impact-response', readResponse);
    expect(response.description).toMatch(/route/i);

    const readFull = vi.fn().mockReturnValue(FULL_CYCLE_YAML);
    const full = loadTeamConfig('full-cycle', readFull);
    expect(full.description).toMatch(/end.to.end|pipeline/i);
  });
});
