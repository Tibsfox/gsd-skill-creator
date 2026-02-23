import { describe, it, expect } from 'vitest';
import {
  SafetyMode,
  getModuleMode,
  classifyVoltage,
  checkSafety,
} from '../safety/warden.js';

describe('Safety Warden', () => {
  describe('getModuleMode — module-to-mode mapping', () => {
    describe('Annotate modules', () => {
      const annotateModules = [
        '01-the-circuit',
        '02-passive-components',
        '03-the-signal',
        '07a-logic-gates',
        '08-sequential-logic',
      ];

      it.each(annotateModules)('returns Annotate for %s', (moduleId) => {
        expect(getModuleMode(moduleId)).toBe(SafetyMode.Annotate);
      });
    });

    describe('Gate modules', () => {
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

      it.each(gateModules)('returns Gate for %s', (moduleId) => {
        expect(getModuleMode(moduleId)).toBe(SafetyMode.Gate);
      });
    });

    describe('Redirect modules', () => {
      const redirectModules = ['13-plc', '14-off-grid-power'];

      it.each(redirectModules)('returns Redirect for %s', (moduleId) => {
        expect(getModuleMode(moduleId)).toBe(SafetyMode.Redirect);
      });
    });

    it('throws for unknown module ID', () => {
      expect(() => getModuleMode('99-unknown')).toThrow();
    });
  });

  describe('classifyVoltage — voltage-range lookup', () => {
    it('classifies 5V as Annotate ELV', () => {
      const result = classifyVoltage(5);
      expect(result.mode).toBe(SafetyMode.Annotate);
      expect(result.requiresAssessment).toBe(false);
      expect(result.label).toContain('ELV');
    });

    it('classifies 24V as Gate SELV', () => {
      const result = classifyVoltage(24);
      expect(result.mode).toBe(SafetyMode.Gate);
      expect(result.requiresAssessment).toBe(false);
      expect(result.label).toContain('SELV');
    });

    it('classifies 80V as Gate with assessment', () => {
      const result = classifyVoltage(80);
      expect(result.mode).toBe(SafetyMode.Gate);
      expect(result.requiresAssessment).toBe(true);
      expect(result.label).toContain('Low voltage');
    });

    it('classifies 240V as Redirect Hazardous', () => {
      const result = classifyVoltage(240);
      expect(result.mode).toBe(SafetyMode.Redirect);
      expect(result.requiresAssessment).toBe(true);
      expect(result.label).toContain('Hazardous');
    });

    describe('boundary values', () => {
      it('classifies 0V as Annotate', () => {
        expect(classifyVoltage(0).mode).toBe(SafetyMode.Annotate);
      });

      it('classifies 12V as Gate (boundary inclusive on upper)', () => {
        const result = classifyVoltage(12);
        expect(result.mode).toBe(SafetyMode.Gate);
      });

      it('classifies 48V as Gate with assessment', () => {
        const result = classifyVoltage(48);
        expect(result.mode).toBe(SafetyMode.Gate);
        expect(result.requiresAssessment).toBe(true);
      });

      it('classifies 120V as Redirect', () => {
        const result = classifyVoltage(120);
        expect(result.mode).toBe(SafetyMode.Redirect);
      });
    });

    it('throws for negative voltage', () => {
      expect(() => classifyVoltage(-1)).toThrow();
    });
  });

  describe('checkSafety — combined safety check', () => {
    it('returns allowed + Annotate for module 01 at 5V', () => {
      const result = checkSafety('01-the-circuit', 5);
      expect(result.allowed).toBe(true);
      expect(result.mode).toBe(SafetyMode.Annotate);
      expect(result.assessmentRequired).toBe(false);
    });

    it('returns allowed + Gate for module 04 at 24V', () => {
      const result = checkSafety('04-diodes', 24);
      expect(result.allowed).toBe(true);
      expect(result.mode).toBe(SafetyMode.Gate);
      expect(result.assessmentRequired).toBe(false);
    });

    it('returns not allowed + Redirect for module 13 at 240V', () => {
      const result = checkSafety('13-plc', 240);
      expect(result.allowed).toBe(false);
      expect(result.mode).toBe(SafetyMode.Redirect);
      expect(result.assessmentRequired).toBe(true);
    });

    it('escalates mode when voltage is more dangerous than module default', () => {
      // Module 01 is Annotate by default, but 200V should escalate to Redirect
      const result = checkSafety('01-the-circuit', 200);
      expect(result.mode).toBe(SafetyMode.Redirect);
      expect(result.assessmentRequired).toBe(true);
    });

    it('always includes a non-empty message', () => {
      const r1 = checkSafety('01-the-circuit', 5);
      const r2 = checkSafety('04-diodes', 24);
      const r3 = checkSafety('13-plc', 240);

      expect(r1.message).toBeTruthy();
      expect(r1.message.length).toBeGreaterThan(0);
      expect(r2.message).toBeTruthy();
      expect(r2.message.length).toBeGreaterThan(0);
      expect(r3.message).toBeTruthy();
      expect(r3.message.length).toBeGreaterThan(0);
    });

    it('works with module only (no voltage)', () => {
      const result = checkSafety('01-the-circuit');
      expect(result.allowed).toBe(true);
      expect(result.mode).toBe(SafetyMode.Annotate);
      expect(result.assessmentRequired).toBe(false);
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});
