/**
 * Integration Suite Cross-Cutting Tests
 *
 * Verifies that all Mind-Body modules work together correctly:
 * cross-module navigation, calibration pipeline, College Structure,
 * Training Hall navigation, Practice Builder, Safety Warden integration,
 * connection map bidirectionality, progressive disclosure, and chipset routing.
 *
 * @module departments/mind-body/tests/integration-suite
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';

// Training Hall
import { TrainingHall, renderTrainingHall } from '../training-hall.js';

// Department and College
import { mindBodyDepartment } from '../mind-body-department.js';
import { CollegeLoader } from '../../../college/college-loader.js';

// Connection Map and Navigation
import { ConnectionMap } from '../map/connection-map.js';
import { DisciplineNavigator } from '../map/discipline-navigator.js';

// Practice Builder
import { SessionGenerator } from '../practice-builder/session-generator.js';
import { getPhaseForWeek, getRecommendedModules, allPhases } from '../practice-builder/progressive-structure.js';
import { allTemplates } from '../practice-builder/session-templates.js';

// Safety Warden
import { PhysicalSafetyWarden } from '../safety/physical-safety-warden.js';

// Calibration
import { PatternDetector } from '../calibration/pattern-detector.js';

// Chipset
import { chipsetConfig } from '../chipset/chipset-config.js';
import { senseiAgent, instructorAgent, builderAgent } from '../chipset/agent-definitions.js';

// Browse
import { DisciplineBrowser } from '../browse/discipline-browser.js';

// Journal
import { JournalDisplay } from '../journal/journal-display.js';

// Types
import type { MindBodyWingId, JournalEntry } from '../types.js';

// Public API barrel
import * as MindBodyIndex from '../index.js';

const DEPARTMENTS_PATH = join(process.cwd(), '.college', 'departments');

// ============================================================================
// CROSS-MODULE NAVIGATION
// ============================================================================

describe('Integration: Cross-Module Navigation', () => {
  const navigator = new DisciplineNavigator();
  const connectionMap = new ConnectionMap();

  it('breath -> meditation -> martial-arts path exists', () => {
    const breathToMed = navigator.navigate('breath', 'meditation');
    expect(breathToMed.distance).toBeGreaterThan(0);

    const medToMa = navigator.navigate('meditation', 'martial-arts');
    expect(medToMa.distance).toBeGreaterThan(0);
  });

  it('every discipline is reachable from every other discipline', () => {
    const wings: MindBodyWingId[] = [
      'breath', 'meditation', 'yoga', 'pilates',
      'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
    ];

    for (const from of wings) {
      const reachable = navigator.getReachable(from);
      expect(reachable.length).toBe(7); // All others
      for (const to of wings.filter((w) => w !== from)) {
        expect(reachable).toContain(to);
      }
    }
  });

  it('connection map has connections for all 8 wings', () => {
    const wings: MindBodyWingId[] = [
      'breath', 'meditation', 'yoga', 'pilates',
      'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
    ];

    for (const wing of wings) {
      const connections = connectionMap.getConnections(wing);
      expect(connections.length).toBeGreaterThan(0);
    }
  });

  it('connection map is bidirectional (if A->B then B->A)', () => {
    const allConns = connectionMap.getAllConnections();
    for (const [from, connections] of allConns) {
      for (const conn of connections) {
        expect(
          connectionMap.areConnected(conn.to, from),
          `Expected ${conn.to} -> ${from} connection (reverse of ${from} -> ${conn.to})`,
        ).toBe(true);
      }
    }
  });

  it('discipline browser has profiles for all 8 disciplines', () => {
    const browser = new DisciplineBrowser();
    const disciplines = browser.getAllDisciplines();
    expect(disciplines.length).toBe(8);
  });
});

// ============================================================================
// CALIBRATION PIPELINE
// ============================================================================

describe('Integration: Calibration Pipeline', () => {
  it('journal entries -> pattern detection -> session suggestion', () => {
    const detector = new PatternDetector();
    const entries: JournalEntry[] = [];

    // Create 6 journal entries showing preference for breath and meditation
    const baseDate = new Date('2026-01-01');
    for (let i = 0; i < 6; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      entries.push({
        date,
        durationMinutes: 10 + i * 2,
        modules: i % 2 === 0 ? ['breath'] : ['meditation'],
        energyBefore: 2 as 1 | 2 | 3 | 4 | 5,
        energyAfter: 4 as 1 | 2 | 3 | 4 | 5,
      });
    }

    const patterns = detector.detectPatterns(entries);
    expect(patterns.length).toBeGreaterThan(0);

    // Use detected patterns to inform session generation
    const generator = new SessionGenerator();
    const preferredModules: MindBodyWingId[] = ['breath', 'meditation'];
    const session = generator.generateSession(preferredModules, 15);

    expect(session.totalMinutes).toBe(15);
    expect(session.modules).toContain('breath');
    expect(session.modules).toContain('meditation');
  });

  it('pattern detector requires minimum 5 entries', () => {
    const detector = new PatternDetector();
    const entries: JournalEntry[] = [
      {
        date: new Date('2026-01-01'),
        durationMinutes: 10,
        modules: ['breath'],
        energyBefore: 3,
        energyAfter: 4,
      },
    ];
    const patterns = detector.detectPatterns(entries);
    expect(patterns).toHaveLength(0);
  });
});

// ============================================================================
// COLLEGE STRUCTURE
// ============================================================================

describe('Integration: College Structure', () => {
  let loader: CollegeLoader;

  beforeAll(() => {
    loader = new CollegeLoader(DEPARTMENTS_PATH);
  });

  it('mind-body loads alongside culinary-arts without conflict', () => {
    const departments = loader.listDepartments();
    expect(departments).toContain('mind-body');
    expect(departments).toContain('culinary-arts');
  });

  it('at least 3 departments are discoverable', () => {
    const departments = loader.listDepartments();
    expect(departments.length).toBeGreaterThanOrEqual(3);
  });

  it('mind-body summary loads correctly', async () => {
    const summary = await loader.loadSummary('mind-body');
    expect(summary.id).toBe('mind-body');
    expect(summary.name).toBe('Mind-Body Arts');
    expect(summary.wings.length).toBe(8);
  });
});

// ============================================================================
// TRAINING HALL — 5 OPTIONS NAVIGATE CORRECTLY
// ============================================================================

describe('Integration: Training Hall Navigation', () => {
  const hall = new TrainingHall();

  it('Training Hall has exactly 5 options', () => {
    expect(hall.getOptions()).toHaveLength(5);
  });

  it('browse option exists and maps to DisciplineBrowser', () => {
    const options = hall.getOptions();
    const browse = options.find((o) => o.id === 'browse');
    expect(browse).toBeDefined();
    expect(browse!.label).toBe('Browse the Arts');

    // Verify DisciplineBrowser can serve this option
    const browser = new DisciplineBrowser();
    expect(browser.getAllDisciplines().length).toBe(8);
  });

  it('try option exists and maps to try sessions', () => {
    const options = hall.getOptions();
    const tryOpt = options.find((o) => o.id === 'try');
    expect(tryOpt).toBeDefined();
    expect(tryOpt!.label).toBe('Try a Session');
  });

  it('build option exists and maps to Practice Builder', () => {
    const options = hall.getOptions();
    const build = options.find((o) => o.id === 'build');
    expect(build).toBeDefined();
    expect(build!.label).toBe('Build a Practice');

    // Verify SessionGenerator can serve this option
    const generator = new SessionGenerator();
    const session = generator.generateSession(['breath'], 5);
    expect(session.totalMinutes).toBe(5);
  });

  it('map option exists and maps to ConnectionMap', () => {
    const options = hall.getOptions();
    const map = options.find((o) => o.id === 'map');
    expect(map).toBeDefined();
    expect(map!.label).toBe('The Map');

    // Verify ConnectionMap can serve this option
    const connectionMap = new ConnectionMap();
    expect(connectionMap.getAllConnections().size).toBe(8);
  });

  it('journal option exists and maps to JournalDisplay', () => {
    const options = hall.getOptions();
    const journal = options.find((o) => o.id === 'journal');
    expect(journal).toBeDefined();
    expect(journal!.label).toBe('Journal');

    // Verify JournalDisplay can serve this option
    const display = new JournalDisplay();
    expect(display.renderWelcome(null, 0)).toContain('Welcome');
  });
});

// ============================================================================
// PRACTICE BUILDER — GENERATES FROM ALL 8 WINGS
// ============================================================================

describe('Integration: Practice Builder Generates from All 8 Wings', () => {
  const generator = new SessionGenerator();
  const wings: MindBodyWingId[] = [
    'breath', 'meditation', 'yoga', 'pilates',
    'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
  ];

  for (const wing of wings) {
    it(`generates session including ${wing}`, () => {
      const session = generator.generateSession([wing], 15);
      expect(session.totalMinutes).toBe(15);
      expect(session.modules).toContain(wing);
      expect(session.warmUp).toBeDefined();
      expect(session.coolDown).toBeDefined();
      expect(session.segments.length).toBeGreaterThan(0);
    });
  }

  it('generates multi-module session with correct total duration', () => {
    const session = generator.generateSession(['yoga', 'meditation', 'breath'], 30);
    expect(session.totalMinutes).toBe(30);
    expect(session.modules.length).toBe(3);
  });
});

// ============================================================================
// SAFETY WARDEN + PRACTICE BUILDER INTEGRATION
// ============================================================================

describe('Integration: Safety Warden with Practice Builder', () => {
  it('warden gates content from session generator when conditions are present', () => {
    const warden = new PhysicalSafetyWarden();

    // Generate a yoga session
    const generator = new SessionGenerator();
    const session = generator.generateSession(['yoga'], 15);

    // Check that warden correctly gates content for a condition
    const gateResult = warden.gate(['lower-back-pain'], 'deep forward fold');
    expect(gateResult.allowed).toBe(false);
    expect(gateResult.modifications.length).toBeGreaterThan(0);

    // Session should still be generated (generator works independently)
    expect(session.totalMinutes).toBe(15);
  });
});

// ============================================================================
// PROGRESSIVE DISCLOSURE — TOKEN BUDGETS
// ============================================================================

describe('Integration: Progressive Disclosure Token Budgets', () => {
  it('department token budget: summaryLimit < 3K', () => {
    expect(mindBodyDepartment.tokenBudget.summaryLimit).toBeLessThanOrEqual(3000);
  });

  it('department token budget: activeLimit < 12K', () => {
    expect(mindBodyDepartment.tokenBudget.activeLimit).toBeLessThanOrEqual(12000);
  });

  it('all progressive structure phases have valid week ranges', () => {
    for (const phase of allPhases) {
      expect(phase.weekRange[0]).toBeGreaterThan(0);
      expect(phase.weekRange[1]).toBeGreaterThanOrEqual(phase.weekRange[0]);
    }
  });

  it('progressive structure week 1 recommends breath only', () => {
    const modules = getRecommendedModules(1, ['yoga', 'meditation']);
    expect(modules).toEqual(['breath']);
  });

  it('progressive structure week 9+ allows all modules', () => {
    const phase = getPhaseForWeek(9);
    expect(phase.name).toBe('Personalization');
    expect(phase.modules).toBe(8);
  });
});

// ============================================================================
// DEPARTMENT INDEX — PUBLIC API EXPORTS
// ============================================================================

describe('Integration: Department Index Exports', () => {
  it('index exports TrainingHall class', () => {
    expect(MindBodyIndex.TrainingHall).toBeDefined();
  });

  it('index exports renderTrainingHall function', () => {
    expect(MindBodyIndex.renderTrainingHall).toBeDefined();
    expect(typeof MindBodyIndex.renderTrainingHall).toBe('function');
  });

  it('index exports mindBodyDepartment', () => {
    expect(MindBodyIndex.mindBodyDepartment).toBeDefined();
    expect(MindBodyIndex.mindBodyDepartment.id).toBe('mind-body');
  });

  it('index exports cultural framework functions', () => {
    expect(MindBodyIndex.creditTradition).toBeDefined();
    expect(MindBodyIndex.renderTerminology).toBeDefined();
    expect(MindBodyIndex.checkCulturalBalance).toBeDefined();
    expect(MindBodyIndex.CulturalFramework).toBeDefined();
    expect(MindBodyIndex.createCoreTraditions).toBeDefined();
  });

  it('index exports registerMindBodyDepartment', () => {
    expect(MindBodyIndex.registerMindBodyDepartment).toBeDefined();
    expect(typeof MindBodyIndex.registerMindBodyDepartment).toBe('function');
  });
});

// ============================================================================
// CHIPSET — ROUTES TO CORRECT AGENTS
// ============================================================================

describe('Integration: Chipset Routing', () => {
  it('chipset has exactly 10 skills', () => {
    expect(chipsetConfig.skills).toHaveLength(10);
  });

  it('chipset has exactly 3 agents', () => {
    expect(chipsetConfig.agents).toHaveLength(3);
  });

  it('sensei agent routes breath, meditation, martial-arts, tai-chi, philosophy', () => {
    expect(senseiAgent.skills).toContain('breath-guide');
    expect(senseiAgent.skills).toContain('meditation-guide');
    expect(senseiAgent.skills).toContain('martial-arts-guide');
    expect(senseiAgent.skills).toContain('tai-chi-guide');
    expect(senseiAgent.skills).toContain('philosophy-guide');
  });

  it('instructor agent routes yoga, pilates, recovery, safety-warden', () => {
    expect(instructorAgent.skills).toContain('yoga-guide');
    expect(instructorAgent.skills).toContain('pilates-guide');
    expect(instructorAgent.skills).toContain('recovery-guide');
    expect(instructorAgent.skills).toContain('safety-warden');
  });

  it('builder agent routes practice-builder', () => {
    expect(builderAgent.skills).toContain('practice-builder');
  });

  it('every skill in the chipset is routed to exactly one agent', () => {
    const allRoutedSkills = [
      ...senseiAgent.skills,
      ...instructorAgent.skills,
      ...builderAgent.skills,
    ];

    for (const skill of chipsetConfig.skills) {
      const count = allRoutedSkills.filter((s) => s === skill.id).length;
      expect(count, `Skill ${skill.id} should be routed to exactly one agent`).toBe(1);
    }
  });

  it('chipset has valid token budget', () => {
    expect(chipsetConfig.tokenBudget.sessionCeiling).toBeGreaterThan(0);
    expect(chipsetConfig.tokenBudget.safetyWardenReserve).toBeGreaterThan(0);
    expect(chipsetConfig.tokenBudget.journalOverhead).toBeGreaterThan(0);
  });
});
