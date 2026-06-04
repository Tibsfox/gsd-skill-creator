/**
 * ME-2 model-affinity dispatch actuator ↔ AgentGenerator — integration wire (v1.49.969).
 *
 * Ship 1.2 turns the previously-dead `AffinityDecision.escalateTo` advisory into a
 * live actuator at the agent-DEFINITION dispatch boundary: when an agent is
 * generated from a cluster of skills and the ME-2 feature flag is on, the agent's
 * `model:` frontmatter is raised to the strongest escalation among its bundled
 * skills' model-affinity decisions.
 *
 * This test exercises the real composition root — a real `AgentGenerator` over a
 * real `SkillStore` — and proves the two halves of the acceptance criterion:
 *
 *   1. flag-ON, tractability-mismatch decision  → generated `model:` == escalateTo.
 *   2. flag-OFF (default)                        → generated agent is byte-identical
 *      to the pre-ME2 baseline, EVEN WHEN escalating decisions are supplied (CF-ME2-01).
 *
 * Wires `src/model-affinity/actuator.ts` (resolveDispatchModel) into
 * `src/agents/agent-generator.ts`. Leaves the in-context M5 selector untouched.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { AgentGenerator } from '../../src/agents/agent-generator.js';
import type { SkillCluster } from '../../src/agents/cluster-detector.js';
import { SkillStore } from '../../src/storage/skill-store.js';
import type { AffinityDecision } from '../../src/model-affinity/policy.js';
import type { ModelFamily } from '../../src/model-affinity/schema.js';

// ─── Fixtures ──────────────────────────────────────────

function cluster(skills: string[]): SkillCluster {
  return {
    id: 'cluster-me2-wire',
    skills,
    coActivationScore: 0.8,
    stabilityDays: 14,
    suggestedName: 'me2-wire-agent',
    suggestedDescription: 'A test agent for the ME-2 dispatch wire',
  };
}

function escalating(escalateTo: ModelFamily): AffinityDecision {
  return {
    ok: false,
    penalty: 0.5,
    shouldEscalate: true,
    escalateTo,
    reason: `unreliable on base; suggest ${escalateTo}`,
  };
}

/** Extract the `model:` frontmatter line value from generated agent content. */
function modelLine(content: string): string | undefined {
  return content.match(/^model:\s*(.+)$/m)?.[1]?.trim();
}

// ─── Setup ─────────────────────────────────────────────

describe('ME-2 dispatch actuator ↔ AgentGenerator application-boundary wire', () => {
  let tempDir: string;
  let skillStore: SkillStore;
  let agentsDir: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'me2-dispatch-wire-'));
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    agentsDir = path.join(tempDir, 'agents');
    skillStore = new SkillStore(skillsDir);

    for (const name of ['skill-a', 'skill-b']) {
      await skillStore.create(
        name,
        {
          name,
          description: `Test skill ${name}`,
          triggers: { intents: [], files: [], contexts: [], threshold: 0.5 },
          enabled: true,
        },
        `${name} body content`,
      );
    }
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('flag-ON: a tractability-mismatch decision raises the generated model: to escalateTo', async () => {
    const generator = new AgentGenerator(skillStore, {
      agentsDir,
      model: 'sonnet',
      modelAffinity: {
        enabled: true,
        decisions: new Map([['skill-a', escalating('opus')]]),
      },
    });

    const result = await generator.generateContent(cluster(['skill-a', 'skill-b']));

    expect(modelLine(result.content)).toBe('opus');
    expect(result.content).toContain('model: opus');
  });

  it('flag-OFF: generated agent is byte-identical to baseline even with escalating decisions (CF-ME2-01)', async () => {
    // Baseline: no modelAffinity config at all (pre-ME2 behaviour).
    const baseline = await new AgentGenerator(skillStore, {
      agentsDir,
      model: 'sonnet',
    }).generateContent(cluster(['skill-a', 'skill-b']));

    // Flag-off, but WITH an escalating decision present — must be ignored.
    const flagOff = await new AgentGenerator(skillStore, {
      agentsDir,
      model: 'sonnet',
      modelAffinity: {
        enabled: false,
        decisions: new Map([['skill-a', escalating('opus')]]),
      },
    }).generateContent(cluster(['skill-a', 'skill-b']));

    expect(flagOff.content).toBe(baseline.content);
    expect(modelLine(flagOff.content)).toBe('sonnet');
  });

  it('flag-ON but no escalating decision: model: stays at the configured base', async () => {
    const generator = new AgentGenerator(skillStore, {
      agentsDir,
      model: 'sonnet',
      modelAffinity: {
        enabled: true,
        decisions: new Map([['skill-a', null]]),
      },
    });

    const result = await generator.generateContent(cluster(['skill-a', 'skill-b']));
    expect(modelLine(result.content)).toBe('sonnet');
  });

  it("flag-ON with default 'inherit' base: escalation replaces inherit with the escalated model", async () => {
    // Default config.model is 'inherit'.
    const generator = new AgentGenerator(skillStore, {
      agentsDir,
      modelAffinity: {
        enabled: true,
        decisions: new Map([['skill-b', escalating('opus')]]),
      },
    });

    const result = await generator.generateContent(cluster(['skill-a', 'skill-b']));
    expect(modelLine(result.content)).toBe('opus');
  });

  it('flag-ON escalation is reflected in a written-to-disk agent file (create)', async () => {
    const generator = new AgentGenerator(skillStore, {
      agentsDir,
      model: 'haiku',
      modelAffinity: {
        enabled: true,
        decisions: new Map([['skill-a', escalating('opus')]]),
      },
    });

    const agent = await generator.create(cluster(['skill-a', 'skill-b']));
    const onDisk = fs.readFileSync(agent.filePath, 'utf8');
    expect(modelLine(onDisk)).toBe('opus');
  });
});
