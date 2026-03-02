import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CollegeLoader } from '../../college/college-loader.js';

// Department imports
import { mindBodyDepartment, registerMindBodyDepartment } from './mind-body-department.js';
import { TrainingHall, renderTrainingHall } from './training-hall.js';
import {
  creditTradition,
  renderTerminology,
  checkCulturalBalance,
  CulturalFramework,
  createCoreTraditions,
} from './cultural-framework.js';

// Type imports to verify they compile
import type {
  MindBodyWingId,
  Technique,
  Practice,
  CulturalContext,
  Tradition,
  TrainingHallView,
  TrainingHallOption,
  SessionTemplate,
  JournalEntry,
  SafetyCondition,
} from './types.js';

const DEPARTMENTS_PATH = join(process.cwd(), '.college', 'departments');

describe('Mind-Body Department', () => {

  // ─── Type Compilation ───────────────────────────────────────────────────────

  describe('Type compilation', () => {
    it('all domain types are importable and instantiable', () => {
      // Verify types compile by creating conforming objects
      const wingId: MindBodyWingId = 'breath';
      expect(wingId).toBe('breath');

      const technique: Technique = {
        id: 'test-technique',
        name: 'Test Technique',
        tradition: 'Test Tradition',
        originalTerm: 'Test (test)',
        description: 'A test technique',
        safetyNotes: ['Be careful'],
        modifications: ['Seated variation'],
      };
      expect(technique.id).toBe('test-technique');

      const practice: Practice = {
        id: 'test-practice',
        name: 'Test Practice',
        techniques: [technique],
        estimatedDuration: 15,
        equipmentRequired: [],
        contraindications: [],
      };
      expect(practice.techniques).toHaveLength(1);

      const context: CulturalContext = {
        traditionName: 'Test',
        originRegion: 'Global',
        historicalPeriod: 'Modern',
        originalTerminology: new Map([['test', 'test']]),
        lineage: [],
        respectfulFraming: 'Respectfully presented',
      };
      expect(context.originalTerminology.size).toBe(1);

      const tradition: Tradition = {
        id: 'test',
        name: 'Test',
        region: 'Global',
        period: 'Modern',
        description: 'A test tradition',
        keyTexts: [],
        modernContext: 'Used in testing',
      };
      expect(tradition.id).toBe('test');

      const session: SessionTemplate = {
        id: 'test-session',
        name: 'Test Session',
        durationMinutes: 15,
        modules: ['breath', 'meditation'],
        warmUp: [],
        coolDown: [],
      };
      expect(session.durationMinutes).toBe(15);

      const journal: JournalEntry = {
        date: new Date(),
        durationMinutes: 30,
        modules: ['yoga'],
        energyBefore: 3,
        energyAfter: 4,
        observation: 'Felt great',
      };
      expect(journal.energyAfter).toBe(4);

      const safety: SafetyCondition = {
        id: 'test-condition',
        name: 'Test Condition',
        description: 'A test safety condition',
        contraindicatedMovements: ['headstand'],
        suggestedModifications: ['Use wall support'],
      };
      expect(safety.contraindicatedMovements).toHaveLength(1);
    });

    it('MindBodyWingId includes all 8 wing identifiers', () => {
      const allWingIds: MindBodyWingId[] = [
        'breath', 'meditation', 'yoga', 'pilates',
        'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
      ];
      expect(allWingIds).toHaveLength(8);
    });
  });

  // ─── Department Structure ─────────────────────────────────────────────────

  describe('Department structure', () => {
    it('mindBodyDepartment has 8 wings', () => {
      expect(mindBodyDepartment.wings).toHaveLength(8);
    });

    it('mindBodyDepartment has correct department ID', () => {
      expect(mindBodyDepartment.id).toBe('mind-body');
    });

    it('mindBodyDepartment has correct department name', () => {
      expect(mindBodyDepartment.name).toBe('Mind-Body Arts');
    });

    it('all 8 wing IDs are present and correct', () => {
      const wingIds = mindBodyDepartment.wings.map(w => w.id);
      expect(wingIds).toEqual([
        'breath', 'meditation', 'yoga', 'pilates',
        'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
      ]);
    });

    it('each wing has a non-empty name and description', () => {
      for (const wing of mindBodyDepartment.wings) {
        expect(wing.name.length).toBeGreaterThan(0);
        expect(wing.description.length).toBeGreaterThan(0);
      }
    });

    it('wings have empty concept arrays (stubs for content phases)', () => {
      for (const wing of mindBodyDepartment.wings) {
        expect(wing.concepts).toEqual([]);
      }
    });

    it('trySessions is empty (populated in Phase 16)', () => {
      expect(mindBodyDepartment.trySessions).toEqual([]);
    });

    it('calibrationModels is empty (populated in Phase 19)', () => {
      expect(mindBodyDepartment.calibrationModels).toEqual([]);
    });
  });

  // ─── Token Budget ─────────────────────────────────────────────────────────

  describe('Token budget', () => {
    it('summaryLimit is 3000', () => {
      expect(mindBodyDepartment.tokenBudget.summaryLimit).toBe(3000);
    });

    it('activeLimit is 12000', () => {
      expect(mindBodyDepartment.tokenBudget.activeLimit).toBe(12000);
    });

    it('deepLimit is 50000', () => {
      expect(mindBodyDepartment.tokenBudget.deepLimit).toBe(50000);
    });
  });

  // ─── Department Loading ───────────────────────────────────────────────────

  describe('Department loading', () => {
    let loader: CollegeLoader;

    beforeAll(() => {
      loader = new CollegeLoader(DEPARTMENTS_PATH);
    });

    it('mind-body department is discoverable by CollegeLoader', () => {
      const departments = loader.listDepartments();
      expect(departments).toContain('mind-body');
    });

    it('mind-body loads without breaking culinary-arts', () => {
      const departments = loader.listDepartments();
      expect(departments).toContain('culinary-arts');
      expect(departments).toContain('mind-body');
    });

    it('mind-body summary loads via CollegeLoader', async () => {
      const summary = await loader.loadSummary('mind-body');
      expect(summary.id).toBe('mind-body');
      expect(summary.name).toBe('Mind-Body Arts');
      expect(summary.wings.length).toBe(8);
    });

    it('registerMindBodyDepartment is callable without error', () => {
      expect(() => registerMindBodyDepartment(loader)).not.toThrow();
    });
  });

  // ─── Training Hall ────────────────────────────────────────────────────────

  describe('Training Hall', () => {
    let hall: TrainingHall;

    beforeAll(() => {
      hall = new TrainingHall();
    });

    it('getOptions() returns 5 options', () => {
      const options = hall.getOptions();
      expect(options).toHaveLength(5);
    });

    it('getOptions() has correct IDs', () => {
      const options = hall.getOptions();
      const ids = options.map(o => o.id);
      expect(ids).toEqual(['browse', 'try', 'build', 'map', 'journal']);
    });

    it('getOptions() has correct labels', () => {
      const options = hall.getOptions();
      const labels = options.map(o => o.label);
      expect(labels).toEqual([
        'Browse the Arts',
        'Try a Session',
        'Build a Practice',
        'The Map',
        'Journal',
      ]);
    });

    it('each option has a non-empty description and icon', () => {
      for (const option of hall.getOptions()) {
        expect(option.description.length).toBeGreaterThan(0);
        expect(option.icon.length).toBeGreaterThan(0);
      }
    });

    it('0-session greeting is the Matrix moment', () => {
      const greeting = hall.getGreeting(0, 0);
      expect(greeting).toContain('I know kung fu');
      expect(greeting).toContain('Show me');
    });

    it('absence greeting is "Welcome back."', () => {
      const greeting = hall.getGreeting(0, 5);
      expect(greeting).toBe('Welcome back.');
    });

    it('active streak greeting includes day count', () => {
      const greeting = hall.getGreeting(7, 10);
      expect(greeting).toBe('Day 7. The practice continues.');
    });

    it('getView() returns a complete TrainingHallView', () => {
      const view = hall.getView(3, 15);
      expect(view.greeting).toContain('Day 3');
      expect(view.options).toHaveLength(5);
      expect(view.currentStreak).toBe(3);
      expect(view.totalSessions).toBe(15);
    });

    it('renderTrainingHall produces non-empty string with all 5 options', () => {
      const view = hall.getView(1, 1);
      const rendered = renderTrainingHall(view);

      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered).toContain('Browse the Arts');
      expect(rendered).toContain('Try a Session');
      expect(rendered).toContain('Build a Practice');
      expect(rendered).toContain('The Map');
      expect(rendered).toContain('Journal');
      expect(rendered).toContain('TRAINING HALL');
    });
  });

  // ─── Cultural Framework ───────────────────────────────────────────────────

  describe('Cultural Framework', () => {
    it('creditTradition returns formatted string with all fields', () => {
      const tradition: Tradition = {
        id: 'test-trad',
        name: 'Yoga',
        region: 'India',
        period: 'c. 1500 BCE',
        description: 'Ancient practice system',
        keyTexts: [],
        modernContext: 'Widely practiced',
      };

      const credit = creditTradition(tradition);
      expect(credit).toBe('From Yoga (India, c. 1500 BCE): Ancient practice system');
    });

    it('renderTerminology returns "[term] ([translation])" format', () => {
      const result = renderTerminology('Pranayama', 'breath control');
      expect(result).toBe('Pranayama (breath control)');
    });

    it('renderTerminology appends context when provided', () => {
      const result = renderTerminology('Zazen', 'seated meditation', 'core Zen practice');
      expect(result).toBe('Zazen (seated meditation) -- core Zen practice');
    });

    it('checkCulturalBalance flags "energy flow" without context as mystification', () => {
      const result = checkCulturalBalance('Feel the energy flow through your body');
      expect(result.balanced).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.toLowerCase().includes('energy flow'))).toBe(true);
    });

    it('checkCulturalBalance flags "just exercise" as trivialization', () => {
      const result = checkCulturalBalance('Yoga is just exercise for flexibility');
      expect(result.balanced).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.toLowerCase().includes('just exercise'))).toBe(true);
    });

    it('checkCulturalBalance passes balanced text', () => {
      const balanced = checkCulturalBalance(
        'Diaphragmatic breathing activates the parasympathetic nervous system, ' +
        'reducing cortisol levels and heart rate.',
      );
      expect(balanced.balanced).toBe(true);
      expect(balanced.issues).toHaveLength(0);
    });

    it('CulturalFramework registers and retrieves traditions', () => {
      const framework = new CulturalFramework();
      const tradition: Tradition = {
        id: 'test',
        name: 'Test',
        region: 'Global',
        period: 'Modern',
        description: 'Test',
        keyTexts: [],
        modernContext: 'Test',
      };
      framework.register(tradition);
      expect(framework.has('test')).toBe(true);
      expect(framework.get('test')).toEqual(tradition);
      expect(framework.size).toBe(1);
      expect(framework.getAll()).toHaveLength(1);
    });

    it('createCoreTraditions registers 7 core traditions', () => {
      const framework = createCoreTraditions();
      expect(framework.size).toBe(7);
      expect(framework.has('vedic-yoga')).toBe(true);
      expect(framework.has('chan-zen')).toBe(true);
      expect(framework.has('taoism')).toBe(true);
      expect(framework.has('shaolin')).toBe(true);
      expect(framework.has('bushido')).toBe(true);
      expect(framework.has('pilates-method')).toBe(true);
      expect(framework.has('modern-mindfulness')).toBe(true);
    });
  });

  // ─── Wing Stubs ───────────────────────────────────────────────────────────

  describe('Wing stubs', () => {
    const wingIds = [
      'breath', 'meditation', 'yoga', 'pilates',
      'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
    ];

    for (const wingId of wingIds) {
      it(`${wingId} wing directory exists with index.ts`, () => {
        const wingPath = join(DEPARTMENTS_PATH, 'mind-body', 'concepts', wingId, 'index.ts');
        expect(existsSync(wingPath)).toBe(true);
      });
    }
  });

  // ─── DEPARTMENT.md ────────────────────────────────────────────────────────

  describe('DEPARTMENT.md', () => {
    it('DEPARTMENT.md exists for CollegeLoader discovery', () => {
      const deptMdPath = join(DEPARTMENTS_PATH, 'mind-body', 'DEPARTMENT.md');
      expect(existsSync(deptMdPath)).toBe(true);
    });
  });
});
