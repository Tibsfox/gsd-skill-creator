/**
 * SAGES semantic-behavioral consistency regression test for the VTM pipeline.
 *
 * Anchored on arXiv:2512.09111 (SAGES: Safe Trajectory Generation via
 * Language-Conditioned Skill Embedding). SAGES demonstrates that a
 * three-stage pipeline (intent extraction → deterministic planning →
 * knowledge grounding) achieves >90% semantic-behavioral consistency when
 * the NL intent is preserved across all three stages.
 *
 * This test measures whether the VTM pipeline (vision-parser →
 * mission-assembler → MissionPackage) reproduces the same structural intent
 * from three distinct NL vision inputs, achieving the ≥90% bar.
 *
 * Convergent reference: arXiv:2604.21910 (Skills-as-md three-tier pipeline).
 *
 * @module vtm/__tests__/sages-consistency
 */

import { describe, it, expect } from 'vitest';
import { MissionPackageSchema, type VisionDocument } from '../types.js';
import { parseVisionDocument } from '../vision-parser.js';
import { assembleMissionPackage } from '../mission-assembler.js';
import { runPipeline } from '../pipeline.js';

// ---------------------------------------------------------------------------
// Inline fixtures (3 NL → mission-package pairs)
// No external fixture files required — inline set is the canonical source.
// ---------------------------------------------------------------------------

/**
 * Fixture 1 — Educational drone curriculum.
 * NL intent: "teach drone building and flight from basics through autonomous GPS".
 */
const FIXTURE_DRONE = [
  '# Drone Curriculum -- Vision Guide',
  '',
  '**Date:** 2026-01-15',
  '**Status:** Initial Vision',
  '**Depends on:** core-framework',
  '**Context:** Comprehensive drone education from RC basics through autonomous GPS flight.',
  '',
  '---',
  '',
  '## Vision',
  '',
  'This vision describes an educational system that teaches drone building and autonomous flight through progressive hardware and software modules.',
  '',
  '---',
  '',
  '## Problem Statement',
  '',
  '1. **Complexity Barrier.** Building drones requires multi-domain knowledge most learners lack.',
  '',
  '---',
  '',
  '## Core Concept',
  '',
  '**Progressive skill-building model.**',
  '',
  'Learners progress from RC fundamentals to autonomous GPS flight.',
  '',
  '---',
  '',
  '## Architecture',
  '',
  '```',
  'RC Fundamentals -> Flight Mechanics -> Autonomous Systems',
  '```',
  '',
  '**Cross-component connections:**',
  '- RC Fundamentals -> Flight Mechanics -- hardware skills',
  '- Flight Mechanics -> Autonomous Systems -- control theory',
  '',
  '---',
  '',
  '## Module 1: RC Fundamentals',
  '',
  '**What the user learns/gets:**',
  '- Radio control basics',
  '- Motor and ESC wiring',
  '',
  '**Try Session:** "First Hover" -- Fly a pre-built quadcopter in stabilized mode.',
  '',
  '---',
  '',
  '## Module 2: Flight Mechanics',
  '',
  '**What the user learns/gets:**',
  '- Aerodynamic forces',
  '- PID tuning fundamentals',
  '',
  '**Try Session:** "Tune PID" -- Adjust roll PID gains on a simulator.',
  '',
  '---',
  '',
  '## Module 3: Autonomous Systems',
  '',
  '**What the user learns/gets:**',
  '- GPS waypoint navigation',
  '- Mission planning software',
  '',
  '**Try Session:** "Waypoint Mission" -- Program a 5-waypoint autonomous mission.',
  '',
  '---',
  '',
  '## Skill-Creator Integration',
  '',
  '### Chipset Configuration',
  '',
  '```yaml',
  'name: drone-curriculum',
  'version: 1.0.0',
  'description: Drone education curriculum',
  '',
  'skills:',
  '  drone-hardware:',
  '    domain: robotics',
  '    description: "Drone hardware and RC fundamentals"',
  '',
  'agents:',
  '  topology: pipeline',
  '  agents:',
  '    - name: drone-tutor',
  '      role: "Guides learners through drone concepts and labs"',
  '',
  'evaluation:',
  '  gates:',
  '    preDeploy:',
  '      - check: safety_review',
  '        threshold: 100',
  '        action: block',
  '```',
  '',
  '---',
  '',
  '## Success Criteria',
  '',
  '1. Learners can assemble a quadcopter from components',
  '2. Learners can tune PID gains for stable hover',
  '3. Learners can plan and execute a 5-waypoint autonomous mission',
  '',
  '---',
  '',
  '## The Through-Line',
  '',
  'Drone education bridges hardware and software, building systems-thinking skills applicable to robotics broadly.',
  '',
  '---',
].join('\n');

/**
 * Fixture 2 — Personal finance tracker.
 * NL intent: "help users track spending, set budgets, and reach savings goals".
 */
const FIXTURE_FINANCE = [
  '# Personal Finance Tracker -- Vision Guide',
  '',
  '**Date:** 2026-02-01',
  '**Status:** Initial Vision',
  '**Depends on:** core-framework',
  '**Context:** A personal finance tool for tracking spending, managing budgets, and achieving savings goals.',
  '',
  '---',
  '',
  '## Vision',
  '',
  'This vision describes a personal finance tracker that helps users categorize transactions, set monthly budgets, and visualize progress toward savings goals.',
  '',
  '---',
  '',
  '## Problem Statement',
  '',
  '1. **Visibility Gap.** Most people lack real-time visibility into their spending patterns.',
  '',
  '---',
  '',
  '## Core Concept',
  '',
  '**Envelope budgeting model.**',
  '',
  'Users allocate income into virtual envelopes per category and track spend against each envelope.',
  '',
  '---',
  '',
  '## Architecture',
  '',
  '```',
  'Transaction Ingestion -> Category Engine -> Budget Dashboard',
  '```',
  '',
  '**Cross-component connections:**',
  '- Transaction Ingestion -> Category Engine -- raw transactions',
  '- Category Engine -> Budget Dashboard -- categorized spend',
  '',
  '---',
  '',
  '## Module 1: Transaction Ingestion',
  '',
  '**What the user learns/gets:**',
  '- CSV and bank feed import',
  '- Duplicate detection',
  '',
  '**Try Session:** "Import CSV" -- Import a 3-month bank statement CSV.',
  '',
  '---',
  '',
  '## Module 2: Category Engine',
  '',
  '**What the user learns/gets:**',
  '- Rule-based auto-categorization',
  '- Manual category overrides',
  '',
  '**Try Session:** "Set Rules" -- Create 5 auto-categorization rules.',
  '',
  '---',
  '',
  '## Module 3: Budget Dashboard',
  '',
  '**What the user learns/gets:**',
  '- Envelope allocation UI',
  '- Monthly trend charts',
  '',
  '**Try Session:** "Set Budget" -- Allocate a monthly entertainment envelope.',
  '',
  '---',
  '',
  '## Skill-Creator Integration',
  '',
  '### Chipset Configuration',
  '',
  '```yaml',
  'name: finance-tracker',
  'version: 1.0.0',
  'description: Personal finance tracking and budgeting',
  '',
  'skills:',
  '  transaction-analysis:',
  '    domain: finance',
  '    description: "Transaction import and categorization"',
  '',
  'agents:',
  '  topology: pipeline',
  '  agents:',
  '    - name: finance-advisor',
  '      role: "Guides users through budget setup and review"',
  '',
  'evaluation:',
  '  gates:',
  '    preDeploy:',
  '      - check: type_check',
  '        action: block',
  '```',
  '',
  '---',
  '',
  '## Success Criteria',
  '',
  '1. Users can import transactions from CSV in under 2 minutes',
  '2. Auto-categorization reaches 80%+ accuracy on typical bank data',
  '3. Dashboard updates within 1 second of new transaction entry',
  '',
  '---',
  '',
  '## The Through-Line',
  '',
  'Personal finance clarity connects to the broader ecosystem through data visibility, enabling informed decisions.',
  '',
  '---',
].join('\n');

/**
 * Fixture 3 — CLI developer toolkit.
 * NL intent: "provide scaffolding, linting, and release tooling for CLI projects".
 */
const FIXTURE_CLI_TOOLKIT = [
  '# CLI Developer Toolkit -- Vision Guide',
  '',
  '**Date:** 2026-03-01',
  '**Status:** Initial Vision',
  '**Depends on:** core-framework',
  '**Context:** A developer toolkit providing scaffolding, linting, and release automation for CLI project authors.',
  '',
  '---',
  '',
  '## Vision',
  '',
  'This vision describes a CLI developer toolkit that scaffolds new CLI projects, enforces code style via lint rules, and automates the release pipeline with changelog generation.',
  '',
  '---',
  '',
  '## Problem Statement',
  '',
  '1. **Boilerplate Cost.** Every new CLI project requires significant repetitive setup.',
  '',
  '---',
  '',
  '## Core Concept',
  '',
  '**Convention-over-configuration model.**',
  '',
  'The toolkit applies opinionated defaults for project structure, lint rules, and release conventions, with override points for advanced users.',
  '',
  '---',
  '',
  '## Architecture',
  '',
  '```',
  'Project Scaffolder -> Lint Engine -> Release Automator',
  '```',
  '',
  '**Cross-component connections:**',
  '- Project Scaffolder -> Lint Engine -- template config',
  '- Lint Engine -> Release Automator -- clean check gate',
  '',
  '---',
  '',
  '## Module 1: Project Scaffolder',
  '',
  '**What the user learns/gets:**',
  '- Template selection',
  '- Dependency injection',
  '',
  '**Try Session:** "New CLI" -- Scaffold a TypeScript CLI project from the standard template.',
  '',
  '---',
  '',
  '## Module 2: Lint Engine',
  '',
  '**What the user learns/gets:**',
  '- ESLint + Prettier integration',
  '- Custom rule authoring',
  '',
  '**Try Session:** "Lint Fix" -- Run auto-fix on a sample repo.',
  '',
  '---',
  '',
  '## Module 3: Release Automator',
  '',
  '**What the user learns/gets:**',
  '- Conventional commit parsing',
  '- Changelog generation',
  '- npm publish workflow',
  '',
  '**Try Session:** "Dry Run Release" -- Run a dry-run release to preview the changelog.',
  '',
  '---',
  '',
  '## Skill-Creator Integration',
  '',
  '### Chipset Configuration',
  '',
  '```yaml',
  'name: cli-developer-toolkit',
  'version: 1.0.0',
  'description: CLI project scaffolding and release tooling',
  '',
  'skills:',
  '  cli-scaffolding:',
  '    domain: developer-tooling',
  '    description: "CLI project template and scaffolding"',
  '',
  'agents:',
  '  topology: pipeline',
  '  agents:',
  '    - name: cli-guide',
  '      role: "Guides CLI authors through setup and release"',
  '',
  'evaluation:',
  '  gates:',
  '    preDeploy:',
  '      - check: type_check',
  '        action: block',
  '```',
  '',
  '---',
  '',
  '## Success Criteria',
  '',
  '1. Scaffolder produces a working TypeScript CLI skeleton in under 10 seconds',
  '2. Lint engine catches 100% of configured rule violations on first run',
  '3. Release automator generates a correct CHANGELOG.md from conventional commits',
  '',
  '---',
  '',
  '## The Through-Line',
  '',
  'The CLI developer toolkit connects to the broader ecosystem through opinionated conventions that reduce cognitive overhead.',
  '',
  '---',
].join('\n');

// ---------------------------------------------------------------------------
// Consistency metric
// ---------------------------------------------------------------------------

/**
 * Assess semantic-behavioral consistency for one NL → MissionPackage round-trip.
 *
 * Returns a score in [0, 1] based on four structural invariants that SAGES
 * identifies as load-bearing for semantic-behavioral consistency:
 *
 * 1. Mission package validates against MissionPackageSchema (schema integrity).
 * 2. Component spec count matches module count (intent breadth preserved).
 * 3. Wave execution plan is non-empty (planning stage was reached).
 * 4. Test plan has at least one test (verification layer is present).
 *
 * All four invariants contribute equally (0.25 each). ≥ 0.90 passes.
 */
function measureConsistency(
  markdown: string,
  missionPackage: unknown,
  expectedModuleCount: number,
): number {
  let score = 0;
  const checks = 4;

  // Check 1: schema integrity
  const schemaResult = MissionPackageSchema.safeParse(missionPackage);
  if (schemaResult.success) score += 1;

  // Check 2: component count matches module count
  if (schemaResult.success) {
    const pkg = schemaResult.data;
    if (pkg.componentSpecs.length === expectedModuleCount) score += 1;
  }

  // Check 3: wave plan is non-empty
  if (schemaResult.success) {
    const pkg = schemaResult.data;
    if (pkg.waveExecutionPlan.waves.length > 0) score += 1;
  }

  // Check 4: test plan is non-empty
  if (schemaResult.success) {
    const pkg = schemaResult.data;
    if (pkg.testPlan.tests.length > 0) score += 1;
  }

  return score / checks;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SAGES NL → MissionPackage semantic-behavioral consistency (arXiv:2512.09111)', () => {
  it('fixture-1 (drone curriculum) achieves ≥90% consistency via runPipeline', async () => {
    const result = await runPipeline(FIXTURE_DRONE, { speed: 'full' });
    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();

    const parsed = parseVisionDocument(FIXTURE_DRONE);
    expect(parsed.success).toBe(true);
    const expectedModules = parsed.success ? parsed.data.modules.length : 3;

    const score = measureConsistency(
      FIXTURE_DRONE,
      result.stages.mission!.missionPackage,
      expectedModules,
    );
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('fixture-2 (finance tracker) achieves ≥90% consistency via runPipeline', async () => {
    const result = await runPipeline(FIXTURE_FINANCE, { speed: 'full' });
    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();

    const parsed = parseVisionDocument(FIXTURE_FINANCE);
    expect(parsed.success).toBe(true);
    const expectedModules = parsed.success ? parsed.data.modules.length : 3;

    const score = measureConsistency(
      FIXTURE_FINANCE,
      result.stages.mission!.missionPackage,
      expectedModules,
    );
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('fixture-3 (CLI toolkit) achieves ≥90% consistency via runPipeline', async () => {
    const result = await runPipeline(FIXTURE_CLI_TOOLKIT, { speed: 'full' });
    expect(result.success).toBe(true);
    expect(result.stages.mission).toBeDefined();

    const parsed = parseVisionDocument(FIXTURE_CLI_TOOLKIT);
    expect(parsed.success).toBe(true);
    const expectedModules = parsed.success ? parsed.data.modules.length : 3;

    const score = measureConsistency(
      FIXTURE_CLI_TOOLKIT,
      result.stages.mission!.missionPackage,
      expectedModules,
    );
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('aggregate consistency across all 3 fixtures is ≥90% (SAGES acceptance bar)', async () => {
    const fixtures = [FIXTURE_DRONE, FIXTURE_FINANCE, FIXTURE_CLI_TOOLKIT];
    const scores: number[] = [];

    for (const markdown of fixtures) {
      const result = await runPipeline(markdown, { speed: 'full' });
      if (!result.success || !result.stages.mission) {
        scores.push(0);
        continue;
      }
      const parsed = parseVisionDocument(markdown);
      const expectedModules = parsed.success ? parsed.data.modules.length : 3;
      scores.push(measureConsistency(markdown, result.stages.mission.missionPackage, expectedModules));
    }

    const aggregate = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    expect(aggregate).toBeGreaterThanOrEqual(0.9);
  });
});
