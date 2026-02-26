// === Learned Skill Generator ===
//
// Generates skill files from learned primitives when a domain exceeds
// the primitives threshold (default 30). Follows the same progressive
// disclosure format as domain-skill-generator.ts: YAML frontmatter,
// summary, key primitives, composition patterns, activation patterns.
//
// Consumed by the sc:learn CLI (Plan 03) and the report generator (Plan 02).

import type { MathematicalPrimitive } from '../../types/mfe-types.js';

// === Exported Types ===

export interface LearnedSkillConfig {
  outputDir: string;
  minPrimitives: number;
  maxPrimitivesPerSkill: number;
  maxCompositionRules: number;
}

export interface GeneratedSkillFile {
  domainName: string;
  fileName: string;
  content: string;
  primitiveCount: number;
}

export interface LearnedSkillResult {
  generated: boolean;
  reason: string;
  skill: GeneratedSkillFile | null;
}

// === Defaults ===

const DEFAULT_CONFIG: LearnedSkillConfig = {
  outputDir: 'skills/learn',
  minPrimitives: 30,
  maxPrimitivesPerSkill: 10,
  maxCompositionRules: 10,
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

// === Section Generators ===

function generateFrontmatter(
  domainName: string,
  slug: string,
  primitives: MathematicalPrimitive[],
): string {
  const today = new Date().toISOString().split('T')[0];

  // Collect top keywords by frequency
  const kwFreq = new Map<string, number>();
  for (const p of primitives) {
    for (const kw of p.keywords ?? []) {
      const lower = kw.toLowerCase();
      kwFreq.set(lower, (kwFreq.get(lower) ?? 0) + 1);
    }
  }
  const topKeywords = [...kwFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);

  const intents = topKeywords
    .map(kw => `          - ${escapeYaml(kw)}`)
    .join('\n');

  return [
    '---',
    `name: learn-${slug}`,
    `description: ${escapeYaml(`Learned skill for ${domainName} domain`)}`,
    'user-invocable: false',
    'allowed-tools: Read Grep Glob',
    'metadata:',
    '  extensions:',
    '    gsd-skill-creator:',
    '      version: 1',
    `      createdAt: ${escapeYaml(today)}`,
    '      triggers:',
    '        intents:',
    intents,
    '        contexts:',
    '          - "mathematical problem solving"',
    '          - "math reasoning"',
    '---',
  ].join('\n');
}

function generateSummary(
  domainName: string,
  primitives: MathematicalPrimitive[],
): string {
  // Average plane position
  const center = {
    real: primitives.reduce((s, p) => s + p.planePosition.real, 0) / primitives.length,
    imaginary: primitives.reduce((s, p) => s + p.planePosition.imaginary, 0) / primitives.length,
  };

  // Top 5 by importance
  const topConcepts = [...primitives]
    .sort((a, b) => importanceScore(b) - importanceScore(a))
    .slice(0, 5)
    .map(p => p.name);

  const conceptList = topConcepts.length > 0 ? topConcepts.join(', ') : 'None';

  return [
    '## Summary',
    '',
    `**${domainName}**`,
    `Primitives: ${primitives.length}`,
    `Plane Position Center: (${center.real.toFixed(2)}, ${center.imaginary.toFixed(2)})`,
    '',
    `**Top Concepts:** ${conceptList}`,
  ].join('\n');
}

function generateKeyPrimitives(
  primitives: MathematicalPrimitive[],
  maxCount: number,
): string {
  const sorted = [...primitives]
    .sort((a, b) => importanceScore(b) - importanceScore(a))
    .slice(0, maxCount);

  if (sorted.length === 0) {
    return [
      '## Key Primitives',
      '',
      'No primitives available.',
    ].join('\n');
  }

  const entries = sorted.map(p => {
    const patterns = p.applicabilityPatterns?.length > 0
      ? p.applicabilityPatterns.map(ap => `  - ${ap}`).join('\n')
      : '';
    return [
      `**${p.name}** (${p.type}): ${p.formalStatement}`,
      patterns,
    ].filter(Boolean).join('\n');
  });

  return [
    '## Key Primitives',
    '',
    ...entries,
  ].join('\n\n');
}

function generateCompositionPatterns(
  primitives: MathematicalPrimitive[],
  maxCount: number,
): string {
  const allRules: { sourceName: string; with_: string; yields: string; type: string }[] = [];

  for (const p of primitives) {
    if (!p.compositionRules) continue;
    for (const rule of p.compositionRules) {
      allRules.push({
        sourceName: p.name,
        with_: rule.with,
        yields: rule.yields,
        type: rule.type,
      });
    }
  }

  const rules = allRules.slice(0, maxCount);

  if (rules.length === 0) {
    return [
      '## Composition Patterns',
      '',
      'No composition rules defined.',
    ].join('\n');
  }

  const entries = rules.map(
    r => `- ${r.sourceName} + ${r.with_} -> ${r.yields} (${r.type})`,
  );

  return [
    '## Composition Patterns',
    '',
    ...entries,
  ].join('\n');
}

function generateActivationPatterns(
  primitives: MathematicalPrimitive[],
): string {
  // Deduplicate keywords by frequency
  const kwFreq = new Map<string, number>();
  for (const p of primitives) {
    for (const kw of p.keywords ?? []) {
      const lower = kw.toLowerCase();
      kwFreq.set(lower, (kwFreq.get(lower) ?? 0) + 1);
    }
  }

  const sorted = [...kwFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => `- ${kw}`);

  return [
    '## Activation Patterns',
    '',
    ...sorted,
  ].join('\n');
}

// === Main Function ===

export function generateLearnedSkill(
  domainName: string,
  primitives: MathematicalPrimitive[],
  config?: Partial<LearnedSkillConfig>,
): LearnedSkillResult {
  const cfg: LearnedSkillConfig = { ...DEFAULT_CONFIG, ...config };

  if (primitives.length < cfg.minPrimitives) {
    return {
      generated: false,
      reason: `Insufficient primitives (${primitives.length} < ${cfg.minPrimitives})`,
      skill: null,
    };
  }

  const slug = slugify(domainName);
  const frontmatter = generateFrontmatter(domainName, slug, primitives);
  const summary = generateSummary(domainName, primitives);
  const keyPrimitives = generateKeyPrimitives(primitives, cfg.maxPrimitivesPerSkill);
  const compositionPatterns = generateCompositionPatterns(primitives, cfg.maxCompositionRules);
  const activationPatterns = generateActivationPatterns(primitives);

  const content = [
    frontmatter,
    '',
    `# ${domainName}`,
    '',
    summary,
    '',
    keyPrimitives,
    '',
    compositionPatterns,
    '',
    activationPatterns,
    '',
  ].join('\n');

  return {
    generated: true,
    reason: `Generated skill with ${primitives.length} primitives`,
    skill: {
      domainName,
      fileName: `${cfg.outputDir}/learn-${slug}/SKILL.md`,
      content,
      primitiveCount: primitives.length,
    },
  };
}
