import { describe, it, expect } from 'vitest';
import {
  SafetyMode,
  generateSafetyMessage,
  detectProfessionalContext,
  type ProfessionalSignal,
} from '../safety/warden';
import {
  getAssessment,
  AssessmentTracker,
  type ModuleAssessment,
} from '../safety/safety-assessments/assessments';

// ---------------------------------------------------------------------------
// Prohibited words — must NEVER appear in any safety message (SAFE-05)
// ---------------------------------------------------------------------------
const PROHIBITED_WORDS = [
  "don't",
  'never',
  'dangerous',
  'prohibited',
  'forbidden',
  'cannot',
  'warning',
  'caution',
];

function containsProhibited(message: string): string[] {
  const lower = message.toLowerCase();
  return PROHIBITED_WORDS.filter((w) => lower.includes(w));
}

// ---------------------------------------------------------------------------
// 1. generateSafetyMessage — positive framing (SAFE-05)
// ---------------------------------------------------------------------------
describe('generateSafetyMessage — positive framing', () => {
  it('annotate message contains positive language', () => {
    const msg = generateSafetyMessage(SafetyMode.Annotate, '01-the-circuit', false);
    const hasPositive = /safely|here's how|you can|exploration/i.test(msg);
    expect(hasPositive).toBe(true);
  });

  it('annotate message does NOT contain prohibited words', () => {
    const msg = generateSafetyMessage(SafetyMode.Annotate, '01-the-circuit', false);
    expect(containsProhibited(msg)).toEqual([]);
  });

  it('gate message contains positive guidance language', () => {
    const msg = generateSafetyMessage(SafetyMode.Gate, '04-diodes', false);
    const hasPositive = /safely|guidelines|proceed|following/i.test(msg);
    expect(hasPositive).toBe(true);
  });

  it('gate message does NOT contain prohibited words', () => {
    const msg = generateSafetyMessage(SafetyMode.Gate, '04-diodes', false);
    expect(containsProhibited(msg)).toEqual([]);
  });

  it('redirect message contains positive framing for highest-risk content', () => {
    const msg = generateSafetyMessage(SafetyMode.Redirect, '13-plc', false);
    const hasPositive = /safely|foundation|unlock|knowledge|complete/i.test(msg);
    expect(hasPositive).toBe(true);
  });

  it('redirect message does NOT contain scare tactics or prohibitions', () => {
    const msg = generateSafetyMessage(SafetyMode.Redirect, '13-plc', false);
    expect(containsProhibited(msg)).toEqual([]);
  });

  it('all messages are substantive (length > 20 characters)', () => {
    const annotate = generateSafetyMessage(SafetyMode.Annotate, '01-the-circuit', false);
    const gate = generateSafetyMessage(SafetyMode.Gate, '05-transistors', false);
    const redirect = generateSafetyMessage(SafetyMode.Redirect, '14-off-grid-power', false);

    expect(annotate.length).toBeGreaterThan(20);
    expect(gate.length).toBeGreaterThan(20);
    expect(redirect.length).toBeGreaterThan(20);
  });

  it('professional context appends additional note', () => {
    const nonPro = generateSafetyMessage(SafetyMode.Gate, '04-diodes', false);
    const pro = generateSafetyMessage(SafetyMode.Gate, '04-diodes', true);
    expect(pro.length).toBeGreaterThan(nonPro.length);
    expect(pro.toLowerCase()).toMatch(/professional/);
  });

  it('professional redirect message does NOT contain prohibited words', () => {
    const msg = generateSafetyMessage(SafetyMode.Redirect, '13-plc', true);
    expect(containsProhibited(msg)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. detectProfessionalContext — signal pattern detection (SAFE-06)
// ---------------------------------------------------------------------------
describe('detectProfessionalContext — signal pattern detection', () => {
  it('detects equipment signal for oscilloscope', () => {
    const signals = detectProfessionalContext('I have an oscilloscope on my bench');
    expect(signals.some((s) => s.type === 'equipment' && s.matched === 'oscilloscope')).toBe(true);
  });

  it('detects equipment signal for bench power supply', () => {
    const signals = detectProfessionalContext('Using a bench power supply for testing');
    expect(signals.some((s) => s.type === 'equipment' && s.matched === 'bench power supply')).toBe(true);
  });

  it('detects equipment signal for multimeter', () => {
    const signals = detectProfessionalContext('Measuring with my multimeter');
    expect(signals.some((s) => s.type === 'equipment')).toBe(true);
  });

  it('detects workplace signal for lab', () => {
    const signals = detectProfessionalContext('I work in an electronics lab');
    expect(signals.some((s) => s.type === 'workplace' && s.matched === 'lab')).toBe(true);
  });

  it('detects workplace signal for workshop', () => {
    const signals = detectProfessionalContext('My workshop has proper ESD protection');
    expect(signals.some((s) => s.type === 'workplace' && s.matched === 'workshop')).toBe(true);
  });

  it('detects compliance signal for NEC', () => {
    const signals = detectProfessionalContext('Following NEC code for this install');
    expect(signals.some((s) => s.type === 'compliance' && s.matched === 'NEC')).toBe(true);
  });

  it('detects compliance signal for IEC', () => {
    const signals = detectProfessionalContext('This must comply with IEC standards');
    expect(signals.some((s) => s.type === 'compliance' && s.matched === 'IEC')).toBe(true);
  });

  it('detects compliance signal for UL', () => {
    const signals = detectProfessionalContext('Need UL certification for this product');
    expect(signals.some((s) => s.type === 'compliance')).toBe(true);
  });

  it('detects compliance signal for CE marking', () => {
    const signals = detectProfessionalContext('Applying CE marking to the enclosure');
    expect(signals.some((s) => s.type === 'compliance' && s.matched === 'CE marking')).toBe(true);
  });

  it('detects compliance signal for OSHA', () => {
    const signals = detectProfessionalContext('OSHA requires proper lockout procedures');
    expect(signals.some((s) => s.type === 'compliance' && s.matched === 'OSHA')).toBe(true);
  });

  it('detects ratings signal for "rated for"', () => {
    const signals = detectProfessionalContext('This component is rated for 600V');
    expect(signals.some((s) => s.type === 'ratings' && s.matched === 'rated for')).toBe(true);
  });

  it('detects ratings signal for "voltage rating"', () => {
    const signals = detectProfessionalContext('Check the voltage rating first');
    expect(signals.some((s) => s.type === 'ratings' && s.matched === 'voltage rating')).toBe(true);
  });

  it('detects ratings signal for "current capacity"', () => {
    const signals = detectProfessionalContext('The wire current capacity is 20A');
    expect(signals.some((s) => s.type === 'ratings')).toBe(true);
  });

  it('detects ratings signal for "power dissipation"', () => {
    const signals = detectProfessionalContext('Calculate the power dissipation');
    expect(signals.some((s) => s.type === 'ratings' && s.matched === 'power dissipation')).toBe(true);
  });

  it('returns ProfessionalSignal array with type and matched term', () => {
    const signals = detectProfessionalContext('Using oscilloscope in my lab');
    expect(signals.length).toBeGreaterThanOrEqual(2);
    for (const s of signals) {
      expect(s).toHaveProperty('type');
      expect(s).toHaveProperty('matched');
      expect(['equipment', 'workplace', 'compliance', 'ratings']).toContain(s.type);
    }
  });

  it('returns empty array for generic hobby input', () => {
    const signals = detectProfessionalContext('I want to learn about resistors');
    expect(signals).toEqual([]);
  });

  it('performs case-insensitive matching', () => {
    const lower = detectProfessionalContext('following nec code');
    const upper = detectProfessionalContext('following NEC code');
    expect(lower.length).toBeGreaterThan(0);
    expect(upper.length).toBeGreaterThan(0);
    expect(lower[0].type).toBe(upper[0].type);
  });

  it('0 signals means not professional context', () => {
    const signals = detectProfessionalContext('just a student learning');
    expect(signals.length).toBe(0);
  });

  it('2+ signals means professional context detected', () => {
    const signals = detectProfessionalContext('Using oscilloscope in my lab with NEC compliance');
    expect(signals.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 3. ModuleAssessment and AssessmentTracker (SAFE-07)
// ---------------------------------------------------------------------------
describe('ModuleAssessment and AssessmentTracker', () => {
  describe('getAssessment — assessment definitions', () => {
    const gateModules = [
      '04-diodes',
      '05-transistors',
      '06-op-amps',
      '07-power-supplies',
      '09-data-conversion',
      '10-dsp',
      '11-microcontrollers',
      '12-sensors-actuators',
      '15-pcb-design',
    ];

    const redirectModules = ['13-plc', '14-off-grid-power'];

    const annotateModules = ['01-the-circuit'];

    it.each(gateModules)('returns assessment for Gate module %s', (moduleId) => {
      const assessment = getAssessment(moduleId);
      expect(assessment).not.toBeNull();
      expect(assessment!.moduleId).toBe(moduleId);
    });

    it.each(redirectModules)('returns assessment for Redirect module %s', (moduleId) => {
      const assessment = getAssessment(moduleId);
      expect(assessment).not.toBeNull();
      expect(assessment!.moduleId).toBe(moduleId);
    });

    it.each(annotateModules)('returns null for Annotate module %s', (moduleId) => {
      const assessment = getAssessment(moduleId);
      expect(assessment).toBeNull();
    });

    it('each assessment has title, questions (3+), and passingScore', () => {
      for (const moduleId of [...gateModules, ...redirectModules]) {
        const a = getAssessment(moduleId);
        expect(a).not.toBeNull();
        expect(a!.title).toBeTruthy();
        expect(a!.questions.length).toBeGreaterThanOrEqual(3);
        expect(a!.passingScore).toBeGreaterThan(0);
        expect(a!.passingScore).toBeLessThanOrEqual(1);
      }
    });

    it('each question has id, text, 4 options, and correctIndex', () => {
      for (const moduleId of [...gateModules, ...redirectModules]) {
        const a = getAssessment(moduleId)!;
        for (const q of a.questions) {
          expect(q.id).toBeTruthy();
          expect(q.text).toBeTruthy();
          expect(q.options).toHaveLength(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(4);
        }
      }
    });

    it('gate modules have passingScore of 0.7', () => {
      for (const moduleId of gateModules) {
        const a = getAssessment(moduleId)!;
        expect(a.passingScore).toBe(0.7);
      }
    });

    it('redirect modules have passingScore of 0.8', () => {
      for (const moduleId of redirectModules) {
        const a = getAssessment(moduleId)!;
        expect(a.passingScore).toBe(0.8);
      }
    });
  });

  describe('AssessmentTracker — completion tracking', () => {
    it('submit returns SafetyAssessment with pass/fail, score, timestamp', () => {
      const tracker = new AssessmentTracker();
      const a = getAssessment('04-diodes')!;
      // Answer all correctly
      const correctAnswers = a.questions.map((q) => q.correctIndex);
      const result = tracker.submit('04-diodes', correctAnswers);

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('moduleId');
      expect(result.moduleId).toBe('04-diodes');
    });

    it('passing submission marks module as completed', () => {
      const tracker = new AssessmentTracker();
      const a = getAssessment('04-diodes')!;
      const correctAnswers = a.questions.map((q) => q.correctIndex);
      tracker.submit('04-diodes', correctAnswers);

      expect(tracker.isCompleted('04-diodes')).toBe(true);
    });

    it('failing submission does NOT mark module as completed', () => {
      const tracker = new AssessmentTracker();
      const a = getAssessment('04-diodes')!;
      // Answer all incorrectly
      const wrongAnswers = a.questions.map((q) => (q.correctIndex + 1) % 4);
      tracker.submit('04-diodes', wrongAnswers);

      expect(tracker.isCompleted('04-diodes')).toBe(false);
    });

    it('isCompleted returns false for module never submitted', () => {
      const tracker = new AssessmentTracker();
      expect(tracker.isCompleted('04-diodes')).toBe(false);
    });

    it('getCompletions returns all completed modules', () => {
      const tracker = new AssessmentTracker();

      // Complete two modules
      const a4 = getAssessment('04-diodes')!;
      tracker.submit('04-diodes', a4.questions.map((q) => q.correctIndex));

      const a5 = getAssessment('05-transistors')!;
      tracker.submit('05-transistors', a5.questions.map((q) => q.correctIndex));

      const completions = tracker.getCompletions();
      expect(completions.length).toBe(2);
      expect(completions.some((c) => c.moduleId === '04-diodes')).toBe(true);
      expect(completions.some((c) => c.moduleId === '05-transistors')).toBe(true);
    });

    it('submit calculates score as fraction of correct answers', () => {
      const tracker = new AssessmentTracker();
      const a = getAssessment('04-diodes')!;
      // Answer first correct, rest wrong
      const answers = a.questions.map((q, i) => (i === 0 ? q.correctIndex : (q.correctIndex + 1) % 4));
      const result = tracker.submit('04-diodes', answers);
      const expectedScore = 1 / a.questions.length;
      expect(result.score).toBeCloseTo(expectedScore, 2);
    });

    it('submit records number of questions and correct count', () => {
      const tracker = new AssessmentTracker();
      const a = getAssessment('05-transistors')!;
      const correctAnswers = a.questions.map((q) => q.correctIndex);
      const result = tracker.submit('05-transistors', correctAnswers);

      expect(result.questions).toBe(a.questions.length);
      expect(result.correct).toBe(a.questions.length);
    });
  });
});
