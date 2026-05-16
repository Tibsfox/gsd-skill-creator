// Aggregate-mode driver for sc:learn's higher-order generators.
//
// sc:learn invokes generateLearnedSkill/generateAgent/generateTeam per-paper.
// Each paper produces ~17 primitives across ~1 domain (when --domain is set),
// well below the 30-primitives-per-domain threshold. Across a batch of N
// papers, primitives are never aggregated before invocation, so generators
// never fire.
//
// This module accumulates primitives across calls and exposes a one-shot
// aggregate run that groups by domain, invokes the generators on the
// aggregated set, and (optionally) writes artifacts to disk.

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MathematicalPrimitive, PlanePosition } from '../types/mfe-types.js';
import type { Changeset } from '../learn/changeset-manager.js';
import {
  generateLearnedSkill,
  type LearnedSkillResult,
} from '../learn/generators/skill-generator.js';
import {
  generateAgent,
  type AgentGeneratorResult,
} from '../learn/generators/agent-generator.js';
import {
  generateTeam,
  type TeamGeneratorResult,
} from '../learn/generators/team-generator.js';

export interface AggregateRunReport {
  totalPrimitives: number;
  domains: Array<{
    name: string;
    primitiveCount: number;
    skill: LearnedSkillResult;
    agent: AgentGeneratorResult;
    team: TeamGeneratorResult;
    writtenFiles: string[];
  }>;
}

/**
 * Harvest primitives that were *added* in a sc:learn changeset.
 * Skips `update` and `remove` entries — those reference primitives already
 * in the registry and aren't new contributions.
 */
export function harvestAddedPrimitives(
  changeset: Changeset | null,
): MathematicalPrimitive[] {
  if (!changeset) return [];
  const added: MathematicalPrimitive[] = [];
  for (const entry of changeset.entries) {
    if (entry.type === 'add' && entry.after) {
      added.push(entry.after);
    }
  }
  return added;
}

/**
 * Group primitives by their `domain` field.
 */
export function groupByDomain(
  primitives: MathematicalPrimitive[],
): Map<string, MathematicalPrimitive[]> {
  const groups = new Map<string, MathematicalPrimitive[]>();
  for (const p of primitives) {
    const key = p.domain;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(p);
    } else {
      groups.set(key, [p]);
    }
  }
  return groups;
}

/**
 * Mean of plane positions across a primitive set.
 * Returns null on empty input — callers should guard.
 */
export function computeDomainCenter(
  primitives: MathematicalPrimitive[],
): PlanePosition | null {
  if (primitives.length === 0) return null;
  const sum = primitives.reduce(
    (acc, p) => ({
      real: acc.real + p.planePosition.real,
      imaginary: acc.imaginary + p.planePosition.imaginary,
    }),
    { real: 0, imaginary: 0 },
  );
  return {
    real: sum.real / primitives.length,
    imaginary: sum.imaginary / primitives.length,
  };
}

/**
 * Group primitives by domain, then invoke the three generators on each
 * group. When outputDir is provided, write generated SKILL.md / AGENT.md /
 * TEAM.md files to `${outputDir}/{skills,agents,teams}/`.
 *
 * Each domain's agent gets the centers of OTHER domains as
 * `existingDomainCenters`, so the agent generator's distance check
 * compares novel-domain candidates against the rest of the aggregate.
 */
export function runAggregateGenerators(args: {
  primitives: MathematicalPrimitive[];
  outputDir?: string;
}): AggregateRunReport {
  const { primitives, outputDir } = args;
  const groups = groupByDomain(primitives);

  const domainCenters = new Map<string, PlanePosition>();
  for (const [name, group] of groups) {
    const center = computeDomainCenter(group);
    if (center) domainCenters.set(name, center);
  }

  const report: AggregateRunReport = {
    totalPrimitives: primitives.length,
    domains: [],
  };

  for (const [domainName, group] of groups) {
    const otherCenters: PlanePosition[] = [];
    for (const [otherName, otherCenter] of domainCenters) {
      if (otherName !== domainName) otherCenters.push(otherCenter);
    }

    const skill = generateLearnedSkill(domainName, group);
    const agent = generateAgent(domainName, group, otherCenters);
    const team = generateTeam(domainName, group);

    const writtenFiles: string[] = [];

    if (outputDir) {
      if (skill.generated && skill.skill) {
        const file = path.join(outputDir, 'skills', `learn-${slugify(domainName)}`, 'SKILL.md');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, skill.skill.content, 'utf-8');
        writtenFiles.push(file);
      }
      if (agent.generated && agent.agent) {
        const file = path.join(outputDir, 'agents', `learn-${slugify(domainName)}-agent`, 'AGENT.md');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, agent.agent.content, 'utf-8');
        writtenFiles.push(file);
      }
      if (team.generated && team.team) {
        const file = path.join(outputDir, 'teams', `learn-${slugify(domainName)}-team`, 'TEAM.md');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, team.team.content, 'utf-8');
        writtenFiles.push(file);
      }
    }

    report.domains.push({
      name: domainName,
      primitiveCount: group.length,
      skill,
      agent,
      team,
      writtenFiles,
    });
  }

  return report;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
