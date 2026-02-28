// === Domain Skill File Generator ===
//
// Reads domain JSON data and produces 10 loadable skill files in
// progressive disclosure format. Each file follows skill-creator's
// SKILL.md conventions and can be loaded by the existing SkillStore.
//
// Build-time tool: reads from data/, writes to skills/mfe-domains/.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DomainId, DomainDefinition, MathematicalPrimitive } from '../core/types/mfe-types.js';

// === Types ===

export interface GeneratorConfig {
  outputDir: string;
  maxPrimitivesPerSkill: number;
  maxCompositionRules: number;
}

export interface GeneratedSkill {
  domainId: DomainId;
  fileName: string;
  content: string;
  primitiveCount: number;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  outputDir: 'skills/mfe-domains',
  maxPrimitivesPerSkill: 10,
  maxCompositionRules: 10,
};

// === Importance scoring ===

/**
 * Score a primitive by importance: enables.length + compositionRules.length.
 * Higher score = more connected = more important.
 */
function importanceScore(p: MathematicalPrimitive): number {
  return (p.enables?.length ?? 0) + (p.compositionRules?.length ?? 0);
}

// === YAML escaping ===

function escapeYaml(s: string): string {
  // Wrap in double quotes and escape internal double quotes
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// === Frontmatter generation ===

function generateFrontmatter(domain: DomainDefinition): string {
  const today = new Date().toISOString().split('T')[0];
  const intents = domain.activationPatterns
    .map(p => `          - ${escapeYaml(p)}`)
    .join('\n');

  return [
    '---',
    `name: mfe-${domain.id}`,
    `description: ${escapeYaml(domain.description)}`,
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

// === Section generators ===

function generateSummary(
  domain: DomainDefinition,
  primitives: MathematicalPrimitive[],
): string {
  const topConcepts = [...primitives]
    .sort((a, b) => importanceScore(b) - importanceScore(a))
    .slice(0, 5)
    .map(p => p.name);

  const conceptList = topConcepts.length > 0
    ? topConcepts.join(', ')
    : 'None';

  return [
    '## Summary',
    '',
    `**${domain.name}** (${domain.part})`,
    `Chapters: ${domain.chapters.join(', ')}`,
    `Plane Position: (${domain.planeRegion.center.real}, ${domain.planeRegion.center.imaginary}) radius ${domain.planeRegion.radius}`,
    `Primitives: ${primitives.length}`,
    '',
    domain.description,
    '',
    `**Key Concepts:** ${conceptList}`,
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
      'No primitives extracted for this domain.',
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
  // Collect all composition rules from all primitives
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
      'No composition rules defined for this domain.',
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

function generateCrossDomainLinks(domain: DomainDefinition): string {
  if (!domain.compatibleWith || domain.compatibleWith.length === 0) {
    return [
      '## Cross-Domain Links',
      '',
      'No cross-domain connections defined.',
    ].join('\n');
  }

  const links = domain.compatibleWith.map(
    d => `- **${d}**: Compatible domain for composition and cross-referencing`,
  );

  return [
    '## Cross-Domain Links',
    '',
    ...links,
  ].join('\n');
}

function generateActivationPatterns(domain: DomainDefinition): string {
  const patterns = domain.activationPatterns.map(p => `- ${p}`);

  return [
    '## Activation Patterns',
    '',
    ...patterns,
  ].join('\n');
}

// === Main generation functions ===

/**
 * Generate a single domain skill file.
 */
export function generateDomainSkill(
  domain: DomainDefinition,
  primitives: MathematicalPrimitive[],
  config?: Partial<GeneratorConfig>,
): GeneratedSkill {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const frontmatter = generateFrontmatter(domain);
  const summary = generateSummary(domain, primitives);
  const keyPrimitives = generateKeyPrimitives(primitives, cfg.maxPrimitivesPerSkill);
  const compositionPatterns = generateCompositionPatterns(primitives, cfg.maxCompositionRules);
  const crossDomainLinks = generateCrossDomainLinks(domain);
  const activationPatterns = generateActivationPatterns(domain);

  const content = [
    frontmatter,
    '',
    `# ${domain.name}`,
    '',
    summary,
    '',
    keyPrimitives,
    '',
    compositionPatterns,
    '',
    crossDomainLinks,
    '',
    activationPatterns,
    '',
  ].join('\n');

  return {
    domainId: domain.id,
    fileName: `${cfg.outputDir}/${domain.id}/SKILL.md`,
    content,
    primitiveCount: primitives.length,
  };
}

/**
 * Generate all domain skill files from a domain index.
 */
export function generateAllDomainSkills(
  domainIndex: { domains: DomainDefinition[] },
  domainDataProvider: (domainId: DomainId) => MathematicalPrimitive[],
  config?: Partial<GeneratorConfig>,
): GeneratedSkill[] {
  if (!domainIndex.domains || domainIndex.domains.length === 0) {
    return [];
  }

  return domainIndex.domains.map(domain => {
    const primitives = domainDataProvider(domain.id);
    return generateDomainSkill(domain, primitives, config);
  });
}

// === Generator class (convenience wrapper) ===

export class DomainSkillGenerator {
  private readonly config: GeneratorConfig;

  constructor(config?: Partial<GeneratorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  generate(domain: DomainDefinition, primitives: MathematicalPrimitive[]): GeneratedSkill {
    return generateDomainSkill(domain, primitives, this.config);
  }

  generateAll(
    domainIndex: { domains: DomainDefinition[] },
    dataProvider: (domainId: DomainId) => MathematicalPrimitive[],
  ): GeneratedSkill[] {
    return generateAllDomainSkills(domainIndex, dataProvider, this.config);
  }

  async writeAll(skills: GeneratedSkill[]): Promise<string[]> {
    const paths: string[] = [];
    for (const skill of skills) {
      const dir = dirname(skill.fileName);
      await mkdir(dir, { recursive: true });
      await writeFile(skill.fileName, skill.content, 'utf-8');
      paths.push(skill.fileName);
    }
    return paths;
  }
}
