// === Agent Generator ===
//
// Generates agent definitions when a learned domain has 30+ primitives
// AND its plane position is distant (>0.5) from all existing domain centers.
// This ensures agents are only created for genuinely novel domain coverage.
//
// Uses planeDistance from dedup-prefilter for distance calculation.

import type { MathematicalPrimitive, PlanePosition } from '../../types/mfe-types.js';
import { planeDistance } from '../dedup-prefilter.js';

// === Exported Types ===

export interface AgentGeneratorConfig {
  minPrimitives: number;
  minPlaneDistance: number;
  outputDir: string;
}

export interface GeneratedAgent {
  agentName: string;
  fileName: string;
  content: string;
  reason: string;
}

export interface AgentGeneratorResult {
  generated: boolean;
  reason: string;
  agent: GeneratedAgent | null;
}

// === Defaults ===

const DEFAULT_CONFIG: AgentGeneratorConfig = {
  minPrimitives: 30,
  minPlaneDistance: 0.5,
  outputDir: 'agents/learn',
};

// === Helpers ===

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function importanceScore(p: MathematicalPrimitive): number {
  return (p.enables?.length ?? 0) + (p.compositionRules?.length ?? 0);
}

function escapeYaml(s: string): string {
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function computeCenter(primitives: MathematicalPrimitive[]): PlanePosition {
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

// === Section Generators ===

function generateFrontmatter(slug: string, domainName: string): string {
  const today = new Date().toISOString().split('T')[0];
  return [
    '---',
    `name: learn-${slug}-agent`,
    `description: ${escapeYaml(`Agent specializing in ${domainName} domain reasoning`)}`,
    'metadata:',
    '  extensions:',
    '    gsd-skill-creator:',
    '      version: 1',
    `      createdAt: ${escapeYaml(today)}`,
    '      type: agent',
    '---',
  ].join('\n');
}

function generateRole(domainName: string): string {
  return [
    '## Role',
    '',
    `Domain expert for the **${domainName}** learned domain.`,
    'Applies specialized mathematical reasoning using learned primitives',
    'and composition patterns unique to this domain region.',
  ].join('\n');
}

function generateExpertise(primitives: MathematicalPrimitive[]): string {
  const topPrimitives = [...primitives]
    .sort((a, b) => importanceScore(b) - importanceScore(a))
    .slice(0, 10);

  const primEntries = topPrimitives.map(
    p => `- **${p.name}** (${p.type}): ${p.formalStatement}`,
  );

  // Collect composition rules
  const rules: string[] = [];
  for (const p of topPrimitives) {
    for (const rule of p.compositionRules ?? []) {
      rules.push(`- ${p.name} + ${rule.with} -> ${rule.yields} (${rule.type})`);
    }
  }
  const ruleSection = rules.length > 0
    ? ['', '**Composition Rules:**', ...rules.slice(0, 10)]
    : [];

  return [
    '## Expertise',
    '',
    '**Key Primitives:**',
    ...primEntries,
    ...ruleSection,
  ].join('\n');
}

function generateReasoningPatterns(primitives: MathematicalPrimitive[]): string {
  // Collect composition types
  const compositionTypes = new Set<string>();
  for (const p of primitives) {
    for (const rule of p.compositionRules ?? []) {
      compositionTypes.add(rule.type);
    }
  }

  const typeList = compositionTypes.size > 0
    ? [...compositionTypes].map(t => `- ${t}`).join('\n')
    : '- None defined';

  // Longest dependency chains (top enables)
  const topEnablers = [...primitives]
    .filter(p => p.enables.length > 0)
    .sort((a, b) => b.enables.length - a.enables.length)
    .slice(0, 5)
    .map(p => `- ${p.name} enables: ${p.enables.join(', ')}`);

  const chainSection = topEnablers.length > 0
    ? ['', '**Dependency Chains:**', ...topEnablers]
    : [];

  return [
    '## Reasoning Patterns',
    '',
    '**Composition Types Available:**',
    typeList,
    ...chainSection,
  ].join('\n');
}

function generateActivation(primitives: MathematicalPrimitive[]): string {
  const kwFreq = new Map<string, number>();
  for (const p of primitives) {
    for (const kw of p.keywords ?? []) {
      const lower = kw.toLowerCase();
      kwFreq.set(lower, (kwFreq.get(lower) ?? 0) + 1);
    }
  }

  const topKeywords = [...kwFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([kw]) => `- ${kw}`);

  // Collect applicability patterns
  const patterns = new Set<string>();
  for (const p of primitives) {
    for (const ap of p.applicabilityPatterns ?? []) {
      patterns.add(ap);
    }
  }
  const patternList = [...patterns].slice(0, 10).map(p => `- ${p}`);

  return [
    '## Activation',
    '',
    '**Keywords:**',
    ...topKeywords,
    '',
    '**Patterns:**',
    ...patternList,
  ].join('\n');
}

// === Main Function ===

export function generateAgent(
  domainName: string,
  primitives: MathematicalPrimitive[],
  existingDomainCenters: PlanePosition[],
  config?: Partial<AgentGeneratorConfig>,
): AgentGeneratorResult {
  const cfg: AgentGeneratorConfig = { ...DEFAULT_CONFIG, ...config };

  // Threshold check
  if (primitives.length < cfg.minPrimitives) {
    return {
      generated: false,
      reason: `Insufficient primitives (${primitives.length} < ${cfg.minPrimitives})`,
      agent: null,
    };
  }

  // Distance check
  const center = computeCenter(primitives);

  if (existingDomainCenters.length > 0) {
    const allClose = existingDomainCenters.every(
      ec => planeDistance(center, ec) < cfg.minPlaneDistance,
    );
    if (allClose) {
      return {
        generated: false,
        reason: 'Too close to existing domains',
        agent: null,
      };
    }
  }

  // Generate content
  const slug = slugify(domainName);
  const frontmatter = generateFrontmatter(slug, domainName);
  const role = generateRole(domainName);
  const expertise = generateExpertise(primitives);
  const reasoning = generateReasoningPatterns(primitives);
  const activation = generateActivation(primitives);

  const content = [
    frontmatter,
    '',
    `# ${domainName} Agent`,
    '',
    role,
    '',
    expertise,
    '',
    reasoning,
    '',
    activation,
    '',
  ].join('\n');

  const agentName = `learn-${slug}-agent`;
  const reason = `Generated agent for ${domainName} (${primitives.length} primitives, distant from existing domains)`;

  return {
    generated: true,
    reason,
    agent: {
      agentName,
      fileName: `${cfg.outputDir}/${agentName}/AGENT.md`,
      content,
      reason,
    },
  };
}
