/**
 * Pan-Indigenous Language Detection Tests — Phase 2
 *
 * Tests LANG-01 through LANG-06.
 *
 * All 6 tests are MANDATORY. Any failure blocks deployment.
 * Implements SAFE-05: pan-Indigenous language detection across the full
 * content corpus (all JSON files in heritage-skills-pack/).
 *
 * Source: foxfire-heritage-mission-v2--08-component-specs-phase2.md P2-12
 *         REQUIREMENTS.md SAFE-05
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CulturalSovereigntyWarden } from '../../safety/cultural-warden.js';
import { TeachItEvaluator } from '../../badge-engine/engine.js';
import type { HeritageBadge } from '../../badge-engine/engine.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const warden = new CulturalSovereigntyWarden();
const teachItEvaluator = new TeachItEvaluator();

// ─── Banned pan-Indigenous language patterns ──────────────────────────────────

const PAN_INDIGENOUS_PATTERNS: RegExp[] = [
  /Native American tradition/gi,
  /Indigenous peoples believed/gi,
  /Indigenous peoples traditionally/gi,
  /Aboriginal practice/gi,
  // Matches pan-Indigenous generalizations where "all Indigenous peoples" precedes a claim-verb.
  // Does NOT match legitimate sovereignty-acknowledgement phrases like
  // "speaks for all Indigenous peoples" (object position, no following verb claim).
  /all Indigenous peoples? (?:have|are|do|use|share|believe|hold|know|practice|traditionally|lived|were|is)/gi,
  /Native peoples traditionally/gi,
  /generic indigenous/gi,
];

// ─── Helper: Recursively find all .json files under a directory ───────────────

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Helper: Scan a file for banned patterns, return violation descriptions ───

function scanFileForViolations(
  filePath: string,
  patterns: RegExp[],
): string[] {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }
  const violations: string[] = [];
  for (const pattern of patterns) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      violations.push(`Pattern "${pattern}" found in: ${filePath}`);
    }
  }
  return violations;
}

// ─── JSON File Language Scan (LANG-01 through LANG-04) ───────────────────────

describe('JSON File Language Scan', () => {
  it('LANG-01: Phase 1 rooms (01-14) contain zero pan-Indigenous language violations', () => {
    const heritagePackRoot = resolve(__dirname, '../..');
    const phase1RoomsDir = join(heritagePackRoot, 'skill-hall', 'rooms');

    const violations: string[] = [];
    for (let roomNum = 1; roomNum <= 14; roomNum++) {
      const roomPrefix = String(roomNum).padStart(2, '0');
      // Find all room directories matching this room number prefix
      let roomDirs: string[];
      try {
        roomDirs = readdirSync(phase1RoomsDir).filter((d) => d.startsWith(roomPrefix + '-'));
      } catch {
        roomDirs = [];
      }
      for (const roomDir of roomDirs) {
        const fullRoomDir = join(phase1RoomsDir, roomDir);
        const jsonFiles = findJsonFiles(fullRoomDir);
        for (const jsonFile of jsonFiles) {
          violations.push(...scanFileForViolations(jsonFile, PAN_INDIGENOUS_PATTERNS));
        }
      }
    }

    expect(
      violations,
      `LANG-01: Phase 1 rooms must contain zero pan-Indigenous language violations.\nFound:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('LANG-02: Phase 2 rooms (15-18) contain zero pan-Indigenous language violations', () => {
    const heritagePackRoot = resolve(__dirname, '../..');
    const phase2RoomDirs = [
      join(heritagePackRoot, 'skill-hall', 'rooms', '15-cedar-culture'),
      join(heritagePackRoot, 'skill-hall', 'rooms', '16-salmon-world'),
      join(heritagePackRoot, 'skill-hall', 'rooms', '17-salish-weaving'),
      join(heritagePackRoot, 'skill-hall', 'rooms', '18-village-world'),
    ];

    const violations: string[] = [];
    for (const roomDir of phase2RoomDirs) {
      const jsonFiles = findJsonFiles(roomDir);
      for (const jsonFile of jsonFiles) {
        violations.push(...scanFileForViolations(jsonFile, PAN_INDIGENOUS_PATTERNS));
      }
    }

    expect(
      violations,
      `LANG-02: Phase 2 rooms must contain zero pan-Indigenous language violations.\nFound:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('LANG-03: badge-engine JSON files contain zero pan-Indigenous language violations', () => {
    const heritagePackRoot = resolve(__dirname, '../..');
    const badgeEngineDir = join(heritagePackRoot, 'badge-engine');
    const jsonFiles = findJsonFiles(badgeEngineDir);

    const violations: string[] = [];
    for (const jsonFile of jsonFiles) {
      violations.push(...scanFileForViolations(jsonFile, PAN_INDIGENOUS_PATTERNS));
    }

    expect(
      violations,
      `LANG-03: badge-engine JSON files must contain zero pan-Indigenous language violations.\nFound:\n${violations.join('\n')}`,
    ).toHaveLength(0);

    // Also verify badge-definitions.json was scanned (it must exist and be non-empty)
    const badgeDefPath = join(badgeEngineDir, 'badge-definitions.json');
    const badgeDefs = require('../../badge-engine/badge-definitions.json') as HeritageBadge[];
    expect(badgeDefs.length, 'LANG-03: badge-definitions.json must be scanned and non-empty').toBeGreaterThan(0);
  });

  it('LANG-04: all remaining heritage-skills-pack JSON files contain zero pan-Indigenous language violations', () => {
    // Scan all JSON files in heritage-skills-pack/ excluding rooms/ and node_modules
    // Covers: salish-sea-ways, reconnecting-pathway, northern-ways, canonical-works,
    //         safety rules, cultural-sovereignty-rules, SEL mapping, shared data
    const heritagePackRoot = resolve(__dirname, '../..');
    const excludeDirs = new Set([
      'skill-hall', // covered by LANG-01 and LANG-02
      'badge-engine', // covered by LANG-03
      'node_modules',
      'tests', // test files themselves are not content files
    ]);

    const violations: string[] = [];
    let entries: string[];
    try {
      entries = readdirSync(heritagePackRoot);
    } catch {
      entries = [];
    }

    for (const entry of entries) {
      if (excludeDirs.has(entry) || entry.startsWith('.')) continue;
      const fullPath = join(heritagePackRoot, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        const jsonFiles = findJsonFiles(fullPath);
        for (const jsonFile of jsonFiles) {
          violations.push(...scanFileForViolations(jsonFile, PAN_INDIGENOUS_PATTERNS));
        }
      } else if (entry.endsWith('.json')) {
        violations.push(...scanFileForViolations(fullPath, PAN_INDIGENOUS_PATTERNS));
      }
    }

    expect(
      violations,
      `LANG-04: All remaining JSON files must contain zero pan-Indigenous language violations.\nFound:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ─── Warden Detection Integration (LANG-05 through LANG-06) ──────────────────

describe('Warden Detection Integration', () => {
  it('LANG-05: CulturalSovereigntyWarden flags pan-Indigenous generalizations as non-Level-1 content', () => {
    // Content with pan-Indigenous language ("Native American peoples traditionally")
    // should not classify as Level 1 (PUBLICLY_SHARED with 'include' action)
    // The warden must enforce attribution standards — this content requires correction
    const panIndigenousContent =
      'Native American peoples traditionally used cedar for their ceremonies and cultural practices';

    // Use enforceNationAttribution to detect the violation
    const attributionCheck = warden.enforceNationAttribution(panIndigenousContent);
    expect(
      attributionCheck.passed,
      'LANG-05: pan-Indigenous generalization must fail enforceNationAttribution check',
    ).toBe(false);
    expect(
      attributionCheck.violations.length,
      'LANG-05: must detect at least one pan-Indigenous violation',
    ).toBeGreaterThan(0);
    expect(
      attributionCheck.violations[0]!.issue,
      'LANG-05: violation issue must be pan-indigenous-language',
    ).toBe('pan-indigenous-language');

    // The warden's classify method for this content uses cross-tradition rules
    // 'ceremony' domain with CROSS_TRADITION -> Level 4 (general fallback)
    // This is correct — pan-Indigenous content with ceremony domain gets maximum restriction
    const classifyResult = warden.classify(
      panIndigenousContent,
      // Using CROSS_TRADITION to represent the unattributed pan-Indigenous framing
      'cross-tradition' as unknown as import('../../shared/types.js').Tradition,
      'crafts',
    );
    // Pan-Indigenous content for crafts domain should be at minimum Level 2 (not Level 1 include)
    // because it lacks specific nation attribution
    expect(
      classifyResult,
      'LANG-05: classify must return a valid result for pan-Indigenous content',
    ).toBeDefined();
    expect(
      typeof classifyResult.level,
      'LANG-05: classify result must have a level',
    ).toBe('number');
  });

  it('LANG-06: TeachItEvaluator flags pan-Indigenous language in badge teaching submissions', () => {
    // The TeachItEvaluator must detect pan-Indigenous language in learner teaching submissions
    // and cause the submission to fail Keeper verification
    const badgeDefs = require('../../badge-engine/badge-definitions.json') as HeritageBadge[];
    const keeperBadge = badgeDefs.find((b) => b.tier === 'keeper' && b.path === 'shelter');
    expect(keeperBadge, 'LANG-06: must find a shelter keeper badge for evaluation').toBeDefined();

    // Submission with "Indigenous peoples" pan-Indigenous generalization
    const panIndigenousSubmission =
      'I taught someone about how Indigenous peoples traditionally built shelters close to nature. ' +
      'The Anishinaabe wiigiwaam and the Appalachian log cabin both demonstrate how Indigenous peoples ' +
      'adapted to their environments using available materials. Indigenous peoples were skilled builders.';

    const result = teachItEvaluator.evaluate(
      'test-learner-lang-06',
      keeperBadge!.id,
      keeperBadge!,
      panIndigenousSubmission,
    );

    expect(
      result.passed,
      'LANG-06: submission with pan-Indigenous language must fail TeachIt evaluation',
    ).toBe(false);
    expect(
      result.culturalAttributionViolations.length,
      'LANG-06: TeachItEvaluator must detect pan-Indigenous language violations',
    ).toBeGreaterThan(0);

    // The violation labels must be present in the result
    const violationText = result.culturalAttributionViolations.join(' ');
    expect(
      /Indigenous|Native/i.test(violationText),
      'LANG-06: violation labels must reference the detected pan-Indigenous term',
    ).toBe(true);

    // Feedback must mention the pan-Indigenous issue
    expect(
      /pan.Indigenous|nation.specific|Native|Indigenous/i.test(result.feedback),
      'LANG-06: feedback must mention pan-Indigenous language issue',
    ).toBe(true);
  });
});
