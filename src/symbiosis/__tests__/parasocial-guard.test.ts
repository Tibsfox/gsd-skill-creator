/**
 * Parasocial guard tests
 *
 * SC-PARASOC  100 generated offerings use zero prohibited registers
 *             + each register category tested explicitly
 */

import { describe, it, expect } from 'vitest';
import { validateOffering, isOfferingClean } from '../parasocial-guard.js';

// ─── Helper: 100 clean engineering-observational offerings ───────────────────

/** Corpus of 100 clean offering strings that must pass the guard */
function generateCleanOfferings(): string[] {
  return [
    // trajectory offerings
    'Test-first commit ratio: 30% across the last 20 sessions (below 50% threshold).',
    'Test coverage dropped from 87% to 71% over the past 15 sessions.',
    'Build-success rate: 62% in the last 20 sessions.',
    'Static analysis warning count increased 40% over 10 sessions.',
    'Deployment frequency: 3 per 20 sessions (below 5-per-20 baseline).',
    'Lint error rate rose from 2 to 18 per session over 8 sessions.',
    'Average PR cycle time extended from 2h to 6h over 12 sessions.',
    'Test-execution time increased 2.3x over the past 6 sessions.',
    'Code churn rate: 890 lines per session (up 35% from prior period).',
    'Branch merge rate dropped from 1.2 to 0.4 per session.',

    // consistency offerings
    '3 non-trunk branches active in the last 20 sessions: feature/a, feature/b, feature/c.',
    'Two branches have divergent import conventions: feature/auth uses alias, main uses relative.',
    'Error-handling style differs between src/api/ (throw) and src/cli/ (return code).',
    'Log format inconsistency: 4 branches use JSON, 2 use plaintext.',
    'Branch feature/db has 14 merge conflicts pending against trunk.',
    'Test framework inconsistency: 3 branches use Vitest, 1 uses Jest.',
    'Config key naming diverges: camelCase in main, snake_case in feature/settings.',
    'ESLint config differs across 4 active branches.',
    'Dependency versions diverge: feature/upgrade pins Node 22, trunk pins Node 20.',
    'TypeScript strict mode disabled on 2 of 5 branches.',

    // pattern offerings
    '7 sessions recorded on Mondays across the last 20 sessions.',
    '5 sessions recorded on Fridays across the last 20 sessions.',
    'Refactoring commits occur in 80% of sessions following a deploy.',
    'Test additions cluster in the first 3 sessions of each sprint cycle.',
    'Configuration changes occur in 90% of sessions after dependency updates.',
    'Documentation commits: 6 of the last 20 sessions.',
    'Hotfix branches created on Thursdays in 4 of the last 10 weeks.',
    'Schema migrations cluster on Tuesdays in 5 of the last 8 weeks.',
    'CI pipeline failures spike on the day before release in 7 of 10 sprints.',
    'Code review cycle peaks on Wednesdays across the last 20 sessions.',

    // opportunity offerings
    'Task pattern "deploy staging environment" detected 8 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "update package-lock.json" detected 12 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "run database migration" detected 6 times in 15 sessions. Candidate for skill extraction.',
    'Task pattern "regenerate OpenAPI spec" detected 5 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "sync translations" detected 7 times in 18 sessions. Candidate for skill extraction.',
    'Task pattern "bump version in package.json" detected 9 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "copy .env.example to .env" detected 11 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "run seed script" detected 6 times in 20 sessions. Candidate for skill extraction.',
    'Task pattern "clear dist/ directory" detected 8 times in 15 sessions. Candidate for skill extraction.',
    'Task pattern "update CHANGELOG.md" detected 10 times in 20 sessions. Candidate for skill extraction.',

    // additional engineering-observational phrases
    'Refactoring rate: 2.4 commits per session in the last 10 sessions.',
    'Average file edit span: 87 lines per session.',
    'Dependency update frequency: 1.2 per 20 sessions.',
    'Test-to-production ratio: 0.83 lines per tested line.',
    'Error rate in production: 0.4% over the last 30 sessions.',
    'Skill activation count: 340 activations across 20 sessions.',
    'Average token consumption: 1,450 per session.',
    'Session duration variance: ±22 minutes from median.',
    'Module coupling index: 0.34 (stable from prior period).',
    'Cyclomatic complexity average: 4.2 per function (up from 3.8).',

    'Build artifact size increased 12% over 8 sessions.',
    'Cache hit rate: 58% in the last 20 sessions.',
    'Disk write rate during builds: 230 MB per session.',
    'Memory peak during tests: 1.2 GB (up from 900 MB).',
    'TypeScript compile time: 8.3 seconds median.',
    'Vitest run time: 42 seconds (down from 61 seconds).',
    'Node process startup: 340ms median.',
    'HTTP request latency p95: 120ms in staging.',
    'Database query count per session: 84 (up 20%).',
    'Index size on disk: 2.3 GB.',

    'Trunk commit frequency: 1.8 per session.',
    'Feature branch lifespan median: 4.2 sessions.',
    'PR open-to-merge duration: 18 hours median.',
    'Review comment count per PR: 6.4 average.',
    'Files changed per commit: 3.2 median.',
    'Lines added per commit: 47 median.',
    'Lines deleted per commit: 31 median.',
    'Commit message length: 52 characters median.',
    'Code duplication index: 4.7% of total lines.',
    'Unused export count: 23 (up from 17).',

    'Skill-creator activation ratio: 0.87 per session.',
    'M6 net-shift receptor count: 14 active receptors.',
    'M2 reflection pass duration: 340ms median.',
    'M3 trace count: 892 traces across 20 sessions.',
    'M1 community membership count: 47 unique communities.',
    'M4 branch fork count: 8 across 20 sessions.',
    'M5 cache hit rate: 61%.',
    'Grove import count: 299 resources.',
    'Cartridge build duration: 2.1 seconds median.',
    'JSONL ledger size: 4.2 MB.',

    'Quintessence axis 1 (Self-vs-Non-Self): 0.72.',
    'Quintessence axis 2 (Essential Tensions): 0.28.',
    'Quintessence axis 3 (Growth-and-Energy-Flow): 1,140 tokens/outcome.',
    'Quintessence axis 4 (Stability-vs-Novelty): 0.65.',
    'Quintessence axis 5 (Fateful Encounters): 2 decisions.',
    'Snapshot timestamp: 2025-04-18T00:00:00Z.',
    'Ledger entry count: 47 teaching entries.',
    'Offering rejection count by guard: 0.',
    'Session fixture: 200 records spanning 200 days.',
    'Co-evolution cadence: 20 sessions per pass.',

    'Module boundary violation count: 0.',
    'Circular dependency count: 0.',
    'Dead code ratio: 2.1%.',
    'API surface change rate: 0.3 breaking changes per 10 sessions.',
    'Schema migration count: 2 per 20 sessions.',
    'Integration test count: 87 (up from 72).',
    'Unit test count: 21,298.',
    'Snapshot test count: 14.',
    'End-to-end test count: 6.',
    'Test pass rate: 100% on last run.',
  ];
}

// ─── SC-PARASOC ───────────────────────────────────────────────────────────────

describe('SC-PARASOC: 100 generated offerings use zero prohibited registers', () => {
  const offerings = generateCleanOfferings();

  it('generates exactly 100 test offerings', () => {
    expect(offerings).toHaveLength(100);
  });

  it('all 100 offerings pass the parasocial guard', () => {
    const failures: string[] = [];
    for (const o of offerings) {
      const result = validateOffering(o);
      if (!result.ok) {
        failures.push(`FAILED: "${o.slice(0, 80)}..." → ${result.rejected?.join('; ')}`);
      }
    }
    if (failures.length > 0) {
      throw new Error(`${failures.length} offerings failed guard:\n${failures.join('\n')}`);
    }
  });

  it('isOfferingClean is consistent with validateOffering for all 100', () => {
    for (const o of offerings) {
      expect(isOfferingClean(o)).toBe(validateOffering(o).ok);
    }
  });
});

// ─── Register category tests (explicit) ──────────────────────────────────────

describe('Parasocial guard: first-person plural register', () => {
  it('rejects "we" in offering', () => {
    const result = validateOffering('We detected a drift in the metrics.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('we'))).toBe(true);
  });

  it('rejects "our" in offering', () => {
    const result = validateOffering('Our analysis shows a 30% drop.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('our'))).toBe(true);
  });

  it('rejects "us" in offering', () => {
    const result = validateOffering('This pattern is relevant to us.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('us'))).toBe(true);
  });

  it('rejects "let\'s" in offering', () => {
    const result = validateOffering("Let's review the metrics together.");
    expect(result.ok).toBe(false);
  });
});

describe('Parasocial guard: emotional framing register', () => {
  it('rejects "feel" in offering', () => {
    const result = validateOffering('The system feels this pattern is significant.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('feel'))).toBe(true);
  });

  it('rejects "excited" in offering', () => {
    const result = validateOffering('This finding is exciting progress.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('excited'))).toBe(true);
  });

  it('rejects "hope" in offering', () => {
    const result = validateOffering('It is hoped this pattern will improve.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('hope'))).toBe(true);
  });

  it('rejects "happy" in offering', () => {
    const result = validateOffering('Happy to report a 10% improvement.');
    expect(result.ok).toBe(false);
  });
});

describe('Parasocial guard: relational framing register', () => {
  it('rejects "together" in offering', () => {
    const result = validateOffering('Together these metrics paint a picture.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('together'))).toBe(true);
  });

  it('rejects "partnership" in offering', () => {
    const result = validateOffering('This reflects a productive partnership.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('partnership'))).toBe(true);
  });

  it('rejects "bond" in offering', () => {
    const result = validateOffering('The bond between developer and system is evident.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('bond'))).toBe(true);
  });

  it('rejects "journey" in offering', () => {
    const result = validateOffering('This is part of the journey toward improvement.');
    expect(result.ok).toBe(false);
  });
});

describe('Parasocial guard: personification register', () => {
  it('rejects "I think" in offering', () => {
    const result = validateOffering('I think the trend is significant.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('I think'))).toBe(true);
  });

  it('rejects "I prefer" in offering', () => {
    const result = validateOffering('I prefer the test-first approach.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('I prefer'))).toBe(true);
  });

  it('rejects "I believe" in offering', () => {
    const result = validateOffering('I believe this pattern will recur.');
    expect(result.ok).toBe(false);
  });

  it('rejects "I notice" in offering', () => {
    const result = validateOffering('I notice the commit frequency dropped.');
    expect(result.ok).toBe(false);
  });

  it('rejects "I\'ve" in offering', () => {
    const result = validateOffering("I've observed a consistent pattern.");
    expect(result.ok).toBe(false);
  });
});

describe('Parasocial guard: metaphysical / scope-creep register', () => {
  it('rejects "alive" in offering', () => {
    const result = validateOffering('The system is alive to these patterns.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('alive'))).toBe(true);
  });

  it('rejects "conscious" in offering', () => {
    const result = validateOffering('The system is conscious of the drift.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('conscious'))).toBe(true);
  });

  it('rejects "understands" in offering', () => {
    const result = validateOffering('The system understands your preferences.');
    expect(result.ok).toBe(false);
    expect(result.rejected?.some((r) => r.includes('understands'))).toBe(true);
  });
});

describe('Parasocial guard: clean content passes', () => {
  it('accepts purely metric-based content', () => {
    expect(validateOffering('Test-first ratio: 30% over 20 sessions.').ok).toBe(true);
  });

  it('accepts engineering-style content with numbers', () => {
    expect(validateOffering('Build time increased 18% over 10 sessions.').ok).toBe(true);
  });

  it('accepts offering with code/technical terms', () => {
    expect(validateOffering('Task pattern "npm install" detected 6 times. Candidate for skill extraction.').ok).toBe(true);
  });

  it('rejects content with multiple prohibited registers', () => {
    const result = validateOffering('We feel this is a bond-strengthening pattern together.');
    expect(result.ok).toBe(false);
    expect(result.rejected!.length).toBeGreaterThan(1);
  });
});
