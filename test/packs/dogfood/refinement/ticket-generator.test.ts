import { describe, it, expect } from 'vitest';
import type { GapRecord } from '../../../../src/packs/dogfood/verification/types.js';
import type { ImprovementTicket } from '../../../../src/packs/dogfood/refinement/types.js';
import { generateTickets } from '../../../../src/packs/dogfood/refinement/ticket-generator.js';

// --- Factory ---

function makeGapRecordForTicket(overrides: Partial<GapRecord> = {}): GapRecord {
  return {
    id: 'gap-t001',
    type: 'inconsistent',
    severity: 'significant',
    concept: 'Impedance Matching',
    textbookSource: 'Chapter 12, Section 4',
    ecosystemSource: 'skills/impedance/SKILL.md#overview',
    textbookClaim: 'Impedance matching requires conjugate load.',
    ecosystemClaim: 'Impedance matching uses resistive load only.',
    analysis: 'The concept detector missed the conjugate aspect of impedance matching.',
    suggestedResolution: 'Improve concept detection to capture conjugate relationships.',
    affectsComponents: ['concept-detector'],
    ...overrides,
  };
}

describe('ticket-generator', () => {
  describe('ticket generation (REFINE-02)', () => {
    it('generates bug ticket for extraction failures', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-ext1',
        type: 'incomplete',
        analysis: 'PDF extraction failed to capture the mathematical expression in this section.',
        affectsComponents: ['pdf-extraction'],
      });
      const tickets = generateTickets([gap]);

      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const ticket = tickets[0];
      expect(ticket.category).toBe('bug');
      expect(ticket.component).toBe('pdf-extraction');
    });

    it('generates feature ticket for concept detection misses', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-cd1',
        type: 'missing-in-ecosystem',
        severity: 'critical',
        analysis: 'The concept detector did not detect this important concept.',
        affectsComponents: ['concept-detector'],
      });
      const tickets = generateTickets([gap]);

      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const ticket = tickets[0];
      expect(ticket.category).toBe('feature');
      expect(ticket.component).toBe('concept-detector');
    });

    it('generates bug ticket for positioning errors', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-pos1',
        type: 'inconsistent',
        analysis: 'The theta positioning for this concept is incorrect on the complex plane.',
        affectsComponents: ['position-mapper'],
      });
      const tickets = generateTickets([gap]);

      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const ticket = tickets[0];
      expect(ticket.category).toBe('bug');
      expect(ticket.component).toBe('position-mapper');
    });

    it('generates feature ticket for cross-reference failures', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-xr1',
        type: 'missing-in-ecosystem',
        severity: 'significant',
        analysis: 'Cross-reference mapping between chapters 5 and 12 was not detected.',
        affectsComponents: ['cross-referencer'],
      });
      const tickets = generateTickets([gap]);

      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const ticket = tickets[0];
      expect(ticket.category).toBe('feature');
      expect(ticket.component).toBe('cross-referencer');
    });

    it('generates at least 5 tickets from 10+ mixed gap records', () => {
      const gaps: GapRecord[] = [
        makeGapRecordForTicket({ id: 'gap-m01', type: 'inconsistent', severity: 'critical' }),
        makeGapRecordForTicket({ id: 'gap-m02', type: 'missing-in-ecosystem', severity: 'critical' }),
        makeGapRecordForTicket({ id: 'gap-m03', type: 'incomplete', severity: 'significant', analysis: 'Parsing issue during extraction of math expressions.' }),
        makeGapRecordForTicket({ id: 'gap-m04', type: 'inconsistent', severity: 'minor' }),
        makeGapRecordForTicket({ id: 'gap-m05', type: 'differently-expressed', severity: 'informational' }),
        makeGapRecordForTicket({ id: 'gap-m06', type: 'missing-in-ecosystem', severity: 'significant' }),
        makeGapRecordForTicket({ id: 'gap-m07', type: 'incomplete', severity: 'minor', analysis: 'Extraction failed to parse table format.' }),
        makeGapRecordForTicket({ id: 'gap-m08', type: 'inconsistent', severity: 'significant' }),
        makeGapRecordForTicket({ id: 'gap-m09', type: 'missing-in-ecosystem', severity: 'critical' }),
        makeGapRecordForTicket({ id: 'gap-m10', type: 'differently-expressed', severity: 'minor' }),
        makeGapRecordForTicket({ id: 'gap-m11', type: 'inconsistent', severity: 'significant' }),
      ];
      const tickets = generateTickets(gaps);

      expect(tickets.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('ticket completeness', () => {
    it('every ticket has all required non-empty fields', () => {
      const gaps: GapRecord[] = [
        makeGapRecordForTicket({ id: 'gap-comp1', type: 'inconsistent' }),
        makeGapRecordForTicket({ id: 'gap-comp2', type: 'missing-in-ecosystem', severity: 'critical' }),
      ];
      const tickets = generateTickets(gaps);

      for (const ticket of tickets) {
        expect(ticket.title).toBeTruthy();
        expect(ticket.component).toBeTruthy();
        expect(ticket.description).toBeTruthy();
        expect(ticket.reproductionSteps.length).toBeGreaterThanOrEqual(1);
        expect(ticket.expectedBehavior).toBeTruthy();
        expect(ticket.actualBehavior).toBeTruthy();
      }
    });

    it('every ticket has severity assigned', () => {
      const gap = makeGapRecordForTicket();
      const tickets = generateTickets([gap]);

      const validSeverities = ['critical', 'high', 'medium', 'low'];
      for (const ticket of tickets) {
        expect(validSeverities).toContain(ticket.severity);
      }
    });

    it('every ticket has a suggestedFix (at minimum a fallback)', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-fix1',
        suggestedResolution: '',
      });
      const tickets = generateTickets([gap]);

      for (const ticket of tickets) {
        expect(ticket.suggestedFix).toBeTruthy();
      }
    });
  });

  describe('cross-linking (REFINE-05)', () => {
    it('every ticket has non-empty affectedChapters with valid chapter numbers', () => {
      const gap = makeGapRecordForTicket({
        textbookSource: 'Chapter 12, Section 4',
      });
      const tickets = generateTickets([gap]);

      for (const ticket of tickets) {
        expect(ticket.affectedChapters.length).toBeGreaterThanOrEqual(1);
        for (const ch of ticket.affectedChapters) {
          expect(ch).toBeGreaterThanOrEqual(0);
          expect(ch).toBeLessThanOrEqual(33);
        }
      }
    });

    it('every ticket has tokenImpact string', () => {
      const gap = makeGapRecordForTicket();
      const tickets = generateTickets([gap]);

      for (const ticket of tickets) {
        expect(ticket.tokenImpact).toBeTruthy();
        expect(typeof ticket.tokenImpact).toBe('string');
      }
    });
  });

  describe('severity assignment', () => {
    it('critical gaps produce critical or high severity tickets', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-sev1',
        severity: 'critical',
        type: 'inconsistent',
      });
      const tickets = generateTickets([gap]);

      for (const ticket of tickets) {
        expect(['critical', 'high']).toContain(ticket.severity);
      }
    });

    it('informational gaps produce low severity tickets', () => {
      const gap = makeGapRecordForTicket({
        id: 'gap-sev2',
        severity: 'informational',
        type: 'differently-expressed',
      });
      const tickets = generateTickets([gap]);

      for (const ticket of tickets) {
        expect(ticket.severity).toBe('low');
      }
    });
  });
});
