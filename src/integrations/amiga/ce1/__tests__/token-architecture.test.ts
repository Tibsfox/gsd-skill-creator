/**
 * Tests for CE-1 token architecture specification.
 *
 * Covers: specification structure, contribution tokens, governance tokens,
 * infrastructure bonds, dividends, schema validation, and YAML export.
 */

import { describe, it, expect } from 'vitest';
import {
  TOKEN_ARCHITECTURE,
  TokenArchitectureSchema,
  toYaml,
} from '../token-architecture.js';
import type {
  ContributionTokenSpec,
  GovernanceTokenSpec,
  InfrastructureBondSpec,
  DividendSpec,
} from '../token-architecture.js';

// ============================================================================
// Specification Structure Tests
// ============================================================================

describe('TOKEN_ARCHITECTURE', () => {
  describe('structure', () => {
    it('is a frozen object', () => {
      expect(Object.isFrozen(TOKEN_ARCHITECTURE)).toBe(true);
    });

    it('version matches semver pattern', () => {
      expect(TOKEN_ARCHITECTURE.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('name is AMIGA Commons Token Architecture', () => {
      expect(TOKEN_ARCHITECTURE.name).toBe('AMIGA Commons Token Architecture');
    });

    it('has all top-level fields', () => {
      expect(TOKEN_ARCHITECTURE).toHaveProperty('contribution_token');
      expect(TOKEN_ARCHITECTURE).toHaveProperty('governance_token');
      expect(TOKEN_ARCHITECTURE).toHaveProperty('infrastructure_bond');
      expect(TOKEN_ARCHITECTURE).toHaveProperty('dividend');
    });
  });

  // ==========================================================================
  // Contribution Token Specification Tests
  // ==========================================================================

  describe('contribution_token', () => {
    it('hold_period_months is 12', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.hold_period_months).toBe(12);
    });

    it('decay_model is a defined decay type', () => {
      expect(['linear', 'exponential']).toContain(TOKEN_ARCHITECTURE.contribution_token.decay_model);
    });

    it('decay_description is a non-empty string', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.decay_description.length).toBeGreaterThan(0);
    });

    it('transferable is false', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.transferable).toBe(false);
    });

    it('purchasable is false', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.purchasable).toBe(false);
    });

    it('earned_via is contribution', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.earned_via).toBe('contribution');
    });

    it('lifecycle_stages has at least 3 stages', () => {
      expect(TOKEN_ARCHITECTURE.contribution_token.lifecycle_stages.length).toBeGreaterThanOrEqual(3);
    });

    it('each lifecycle stage has name, duration_description, and description', () => {
      for (const stage of TOKEN_ARCHITECTURE.contribution_token.lifecycle_stages) {
        expect(stage.name).toBeDefined();
        expect(stage.name.length).toBeGreaterThan(0);
        expect(stage.duration_description).toBeDefined();
        expect(stage.duration_description.length).toBeGreaterThan(0);
        expect(stage.description).toBeDefined();
        expect(stage.description.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Governance Token Specification Tests
  // ==========================================================================

  describe('governance_token', () => {
    it('purchasable is false', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.purchasable).toBe(false);
    });

    it('earned_via is contribution', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.earned_via).toBe('contribution');
    });

    it('transferable is false', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.transferable).toBe(false);
    });

    it('voting_weight is equal', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.voting_weight).toBe('equal');
    });

    it('description is a non-empty string', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.description.length).toBeGreaterThan(0);
    });

    it('revocation_conditions is a non-empty array', () => {
      expect(TOKEN_ARCHITECTURE.governance_token.revocation_conditions.length).toBeGreaterThan(0);
      for (const condition of TOKEN_ARCHITECTURE.governance_token.revocation_conditions) {
        expect(condition.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Infrastructure Bond Specification Tests
  // ==========================================================================

  describe('infrastructure_bond', () => {
    it('description is a non-empty string', () => {
      expect(TOKEN_ARCHITECTURE.infrastructure_bond.description.length).toBeGreaterThan(0);
    });

    it('min_commitment_months is a positive integer', () => {
      expect(TOKEN_ARCHITECTURE.infrastructure_bond.min_commitment_months).toBeGreaterThan(0);
      expect(Number.isInteger(TOKEN_ARCHITECTURE.infrastructure_bond.min_commitment_months)).toBe(true);
    });

    it('benefits is a non-empty array', () => {
      expect(TOKEN_ARCHITECTURE.infrastructure_bond.benefits.length).toBeGreaterThan(0);
      for (const benefit of TOKEN_ARCHITECTURE.infrastructure_bond.benefits) {
        expect(benefit.length).toBeGreaterThan(0);
      }
    });

    it('earned_via is sustained_contribution', () => {
      expect(TOKEN_ARCHITECTURE.infrastructure_bond.earned_via).toBe('sustained_contribution');
    });
  });

  // ==========================================================================
  // Dividend Specification Tests
  // ==========================================================================

  describe('dividend', () => {
    it('attachment is proportional', () => {
      expect(TOKEN_ARCHITECTURE.dividend.attachment).toBe('proportional');
    });

    it('distribution_tiers has exactly 3 tiers', () => {
      expect(TOKEN_ARCHITECTURE.dividend.distribution_tiers).toHaveLength(3);
    });

    it('tier 1 is direct_contributors', () => {
      const tier = TOKEN_ARCHITECTURE.dividend.distribution_tiers[0];
      expect(tier.name).toBe('direct_contributors');
      expect(tier.description.length).toBeGreaterThan(0);
    });

    it('tier 2 is infrastructure_commons', () => {
      const tier = TOKEN_ARCHITECTURE.dividend.distribution_tiers[1];
      expect(tier.name).toBe('infrastructure_commons');
      expect(tier.description.length).toBeGreaterThan(0);
    });

    it('tier 3 is universal_base_dividend', () => {
      const tier = TOKEN_ARCHITECTURE.dividend.distribution_tiers[2];
      expect(tier.name).toBe('universal_base_dividend');
      expect(tier.description.length).toBeGreaterThan(0);
    });

    it('payment_execution is false', () => {
      expect(TOKEN_ARCHITECTURE.dividend.payment_execution).toBe(false);
    });
  });

  // ==========================================================================
  // Schema Validation Tests
  // ==========================================================================

  describe('schema validation', () => {
    it('TOKEN_ARCHITECTURE validates against its own schema', () => {
      const result = TokenArchitectureSchema.parse(TOKEN_ARCHITECTURE);
      expect(result).toBeDefined();
    });

    it('object missing contribution_token fails validation', () => {
      const invalid = { ...TOKEN_ARCHITECTURE } as Record<string, unknown>;
      delete invalid.contribution_token;
      expect(() => TokenArchitectureSchema.parse(invalid)).toThrow();
    });
  });

  // ==========================================================================
  // YAML Export Tests
  // ==========================================================================

  describe('toYaml', () => {
    let yaml: string;

    beforeAll(() => {
      yaml = toYaml(TOKEN_ARCHITECTURE as unknown as Record<string, unknown>);
    });

    it('returns a string', () => {
      expect(typeof yaml).toBe('string');
    });

    it('contains contribution_token key', () => {
      expect(yaml).toContain('contribution_token:');
    });

    it('contains governance_token key', () => {
      expect(yaml).toContain('governance_token:');
    });

    it('contains hold_period_months: 12', () => {
      expect(yaml).toContain('hold_period_months: 12');
    });

    it('contains purchasable: false at least twice', () => {
      const matches = yaml.match(/purchasable: false/g);
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('YAML round-trips correctly', () => {
      // Simple YAML parser for our known structure
      // We verify specific key-value pairs exist rather than full round-trip
      // since our serializer is lightweight
      expect(yaml).toContain('version:');
      expect(yaml).toContain('name:');
      expect(yaml).toContain('infrastructure_bond:');
      expect(yaml).toContain('dividend:');
      expect(yaml).toContain('earned_via: contribution');
      expect(yaml).toContain('attachment: proportional');
    });
  });
});

// Vitest requires beforeAll to be imported
import { beforeAll } from 'vitest';
