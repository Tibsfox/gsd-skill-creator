#!/usr/bin/env npx tsx
// Generate all 10 MFE domain skill files from domain data.
// Run: npx tsx scripts/generate-mfe-skills.ts

import { createRequire } from 'node:module';
import { DomainSkillGenerator } from '../src/integration/domain-skill-generator.js';
import type { DomainId, DomainDefinition, MathematicalPrimitive } from '../src/types/mfe-types.js';

const require = createRequire(import.meta.url);

// Load domain index
const domainIndex: { domains: DomainDefinition[] } = require('../data/domain-index.json');

// Map domain IDs to file numbers
const domainFileMap: Record<string, string> = {
  perception: '01',
  waves: '02',
  change: '03',
  structure: '04',
  reality: '05',
  foundations: '06',
  mapping: '07',
  unification: '08',
  emergence: '09',
  synthesis: '10',
};

// Data provider reads from data/domains/*.json
function loadDomainData(domainId: DomainId): MathematicalPrimitive[] {
  const num = domainFileMap[domainId];
  if (!num) {
    console.warn(`No file mapping for domain: ${domainId}`);
    return [];
  }
  try {
    const data = require(`../data/domains/${num}-${domainId}.json`);
    return data.primitives || [];
  } catch (err) {
    console.warn(`Failed to load domain data for ${domainId}:`, err);
    return [];
  }
}

async function main(): Promise<void> {
  const generator = new DomainSkillGenerator();
  const skills = generator.generateAll(domainIndex, loadDomainData);

  console.log(`Generated ${skills.length} domain skill files:`);
  for (const skill of skills) {
    console.log(`  ${skill.domainId}: ${skill.primitiveCount} primitives -> ${skill.fileName}`);
  }

  const paths = await generator.writeAll(skills);
  console.log(`\nWritten ${paths.length} files to disk.`);
}

main().catch(console.error);
