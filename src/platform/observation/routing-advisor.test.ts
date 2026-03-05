import { describe, it, expect } from 'vitest';
import { adviseRouting, formatRoutingAdvice, type CapabilityVector } from './routing-advisor.js';

describe('RoutingAdvisor', () => {
  describe('adviseRouting', () => {
    it('routes high-rigor tasks to Rigor Spine', () => {
      const task: CapabilityVector = {
        rigor: 0.95, creativity: 0.05, observation: 0.60,
        synthesis: 0.30, qualityGating: 0.90, interfaceDesign: 0.10,
      };
      const advice = adviseRouting(task);
      expect(advice.cluster).toBe('rigor-spine');
      expect(advice.confidence).toBeGreaterThan(0.8);
      expect(advice.suggestedAgents).toContain('lex');
    });

    it('routes high-creativity tasks to Creative Nexus', () => {
      const task: CapabilityVector = {
        rigor: 0.10, creativity: 0.90, observation: 0.50,
        synthesis: 0.80, qualityGating: 0.05, interfaceDesign: 0.40,
      };
      const advice = adviseRouting(task);
      expect(advice.cluster).toBe('creative-nexus');
      expect(advice.suggestedAgents[0]).toBe('foxy');
    });

    it('routes interface-heavy tasks to Bridge Zone', () => {
      const task: CapabilityVector = {
        rigor: 0.20, creativity: 0.50, observation: 0.40,
        synthesis: 0.45, qualityGating: 0.15, interfaceDesign: 0.95,
      };
      const advice = adviseRouting(task);
      expect(advice.cluster).toBe('bridge-zone');
      expect(advice.suggestedAgents).toContain('willow');
    });

    it('returns confidence between 0 and 1', () => {
      const task: CapabilityVector = {
        rigor: 0.50, creativity: 0.50, observation: 0.50,
        synthesis: 0.50, qualityGating: 0.50, interfaceDesign: 0.50,
      };
      const advice = adviseRouting(task);
      expect(advice.confidence).toBeGreaterThan(0);
      expect(advice.confidence).toBeLessThanOrEqual(1);
    });

    it('always suggests up to 3 agents', () => {
      const task: CapabilityVector = {
        rigor: 0.50, creativity: 0.50, observation: 0.50,
        synthesis: 0.50, qualityGating: 0.50, interfaceDesign: 0.50,
      };
      const advice = adviseRouting(task);
      expect(advice.suggestedAgents.length).toBeLessThanOrEqual(3);
      expect(advice.suggestedAgents.length).toBeGreaterThan(0);
    });
  });

  describe('formatRoutingAdvice', () => {
    it('formats L0 with just the top agent name', () => {
      const advice = adviseRouting({
        rigor: 0.90, creativity: 0.05, observation: 0.60,
        synthesis: 0.30, qualityGating: 0.85, interfaceDesign: 0.15,
      });
      const formatted = formatRoutingAdvice(advice, 'L0');
      expect(formatted).toContain('good fit');
      expect(formatted.length).toBeLessThan(100);
    });

    it('formats L1 with cluster and confidence', () => {
      const advice = adviseRouting({
        rigor: 0.90, creativity: 0.05, observation: 0.60,
        synthesis: 0.30, qualityGating: 0.85, interfaceDesign: 0.15,
      });
      const formatted = formatRoutingAdvice(advice, 'L1');
      expect(formatted).toContain('Rigor Spine');
      expect(formatted).toMatch(/confidence \d+%/);
    });

    it('formats L2 with full routing detail', () => {
      const advice = adviseRouting({
        rigor: 0.10, creativity: 0.90, observation: 0.50,
        synthesis: 0.80, qualityGating: 0.05, interfaceDesign: 0.40,
      });
      const formatted = formatRoutingAdvice(advice, 'L2');
      expect(formatted).toContain('ROUTING:');
      expect(formatted).toContain('creative-nexus');
      expect(formatted).toContain('creativity');
    });
  });
});
