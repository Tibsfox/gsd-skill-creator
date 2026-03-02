/**
 * Tests for curl educational labs.
 *
 * Validates lab structure, verify() functions, and educational content
 * covering HTTP request anatomy, authentication patterns, and SSRF security.
 */

import { describe, it, expect } from 'vitest';
import { labs } from '../labs.js';
import type { CurlLab, CurlLabStep } from '../labs.js';

describe('curl educational labs (CURL-05)', () => {
  describe('structure validation', () => {
    it('has at least 3 lab entries', () => {
      expect(labs.length).toBeGreaterThanOrEqual(3);
    });

    it('each lab has id, title, steps, and verify function', () => {
      for (const lab of labs) {
        expect(lab.id).toBeDefined();
        expect(typeof lab.id).toBe('string');
        expect(lab.title).toBeDefined();
        expect(typeof lab.title).toBe('string');
        expect(lab.steps).toBeDefined();
        expect(Array.isArray(lab.steps)).toBe(true);
        expect(lab.steps.length).toBeGreaterThan(0);
        expect(typeof lab.verify).toBe('function');
      }
    });

    it('each lab step has instruction, expected_observation, and learn_note', () => {
      for (const lab of labs) {
        for (const step of lab.steps) {
          expect(typeof step.instruction).toBe('string');
          expect(step.instruction.length).toBeGreaterThan(0);
          expect(typeof step.expected_observation).toBe('string');
          expect(step.expected_observation.length).toBeGreaterThan(0);
          expect(typeof step.learn_note).toBe('string');
          expect(step.learn_note.length).toBeGreaterThan(0);
        }
      }
    });

    it('lab IDs follow curl-lab-NN pattern', () => {
      for (const lab of labs) {
        expect(lab.id).toMatch(/^curl-lab-\d{2}$/);
      }
    });
  });

  describe('verify() functions', () => {
    it('all verify() functions return boolean', () => {
      for (const lab of labs) {
        const result = lab.verify();
        expect(typeof result).toBe('boolean');
      }
    });

    it('Lab 1 (HTTP request anatomy) verify returns true', () => {
      const lab1 = labs.find(l => l.id === 'curl-lab-01');
      expect(lab1).toBeDefined();
      expect(lab1!.verify()).toBe(true);
    });

    it('Lab 2 (authentication patterns) verify returns true', () => {
      const lab2 = labs.find(l => l.id === 'curl-lab-02');
      expect(lab2).toBeDefined();
      expect(lab2!.verify()).toBe(true);
    });

    it('Lab 3 (SSRF security) verify returns true', () => {
      const lab3 = labs.find(l => l.id === 'curl-lab-03');
      expect(lab3).toBeDefined();
      expect(lab3!.verify()).toBe(true);
    });
  });

  describe('educational content coverage', () => {
    it('Lab 1 covers HTTP request fundamentals', () => {
      const lab1 = labs.find(l => l.id === 'curl-lab-01');
      expect(lab1).toBeDefined();
      expect(lab1!.title.toLowerCase()).toContain('http');
      // Steps should mention methods, headers, or request structure
      const allText = lab1!.steps.map(s => `${s.instruction} ${s.learn_note}`).join(' ').toLowerCase();
      expect(allText).toContain('get');
    });

    it('Lab 2 covers authentication patterns', () => {
      const lab2 = labs.find(l => l.id === 'curl-lab-02');
      expect(lab2).toBeDefined();
      const allText = lab2!.steps.map(s => `${s.instruction} ${s.learn_note}`).join(' ').toLowerCase();
      expect(allText).toContain('auth');
    });

    it('Lab 3 covers SSRF security', () => {
      const lab3 = labs.find(l => l.id === 'curl-lab-03');
      expect(lab3).toBeDefined();
      const allText = lab3!.steps.map(s => `${s.instruction} ${s.learn_note}`).join(' ').toLowerCase();
      expect(allText).toContain('ssrf');
    });
  });
});
