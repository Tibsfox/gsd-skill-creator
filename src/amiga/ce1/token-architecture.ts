/**
 * CE-1 token architecture specification.
 *
 * Machine-readable, schema-validated specification documenting the complete
 * AMIGA commons token system. This is a specification document, not an
 * implementation -- the token system is designed but not executed.
 *
 * Token types:
 * - Contribution tokens: earned via contribution, 12-month hold, linear decay
 * - Governance tokens: non-purchasable, earned via contribution, equal voting
 * - Infrastructure bonds: long-term commitment for sustained contributors
 *
 * Dividend model:
 * - Proportional attachment with three distribution tiers
 * - Direct contributors, infrastructure commons, universal base dividend
 *
 * The specification is frozen at module load time and validated against its
 * own Zod schema. It can be exported to YAML for documentation consumption.
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const LifecycleStageSchema = z.object({
  name: z.string().min(1),
  duration_description: z.string().min(1),
  description: z.string().min(1),
});

const ContributionTokenSpecSchema = z.object({
  hold_period_months: z.number().int().positive(),
  decay_model: z.enum(['linear', 'exponential']),
  decay_description: z.string().min(1),
  transferable: z.literal(false),
  purchasable: z.literal(false),
  earned_via: z.literal('contribution'),
  lifecycle_stages: z.array(LifecycleStageSchema).min(3),
});

const GovernanceTokenSpecSchema = z.object({
  purchasable: z.literal(false),
  earned_via: z.literal('contribution'),
  transferable: z.literal(false),
  voting_weight: z.string().min(1),
  description: z.string().min(1),
  revocation_conditions: z.array(z.string().min(1)).min(1),
});

const InfrastructureBondSpecSchema = z.object({
  description: z.string().min(1),
  min_commitment_months: z.number().int().positive(),
  benefits: z.array(z.string().min(1)).min(1),
  earned_via: z.literal('sustained_contribution'),
});

const DistributionTierSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const DividendSpecSchema = z.object({
  attachment: z.literal('proportional'),
  distribution_tiers: z.array(DistributionTierSchema).length(3),
  payment_execution: z.literal(false),
});

export const TokenArchitectureSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(1),
  contribution_token: ContributionTokenSpecSchema,
  governance_token: GovernanceTokenSpecSchema,
  infrastructure_bond: InfrastructureBondSpecSchema,
  dividend: DividendSpecSchema,
});

// ============================================================================
// Exported Types
// ============================================================================

export type ContributionTokenSpec = z.infer<typeof ContributionTokenSpecSchema>;
export type GovernanceTokenSpec = z.infer<typeof GovernanceTokenSpecSchema>;
export type InfrastructureBondSpec = z.infer<typeof InfrastructureBondSpecSchema>;
export type DividendSpec = z.infer<typeof DividendSpecSchema>;

// ============================================================================
// TOKEN_ARCHITECTURE Specification
// ============================================================================

/**
 * The complete AMIGA commons token architecture specification.
 *
 * Frozen and schema-validated at module load time.
 */
export const TOKEN_ARCHITECTURE = Object.freeze(
  TokenArchitectureSchema.parse({
    version: '1.0.0',
    name: 'AMIGA Commons Token Architecture',

    contribution_token: {
      hold_period_months: 12,
      decay_model: 'linear',
      decay_description:
        'Contribution tokens decay linearly over time after the maturity period, reducing weight at a constant rate until fully decayed',
      transferable: false,
      purchasable: false,
      earned_via: 'contribution',
      lifecycle_stages: [
        {
          name: 'active',
          duration_description: 'Immediate upon contribution',
          description:
            'Token is earned and immediately active with full weight in attribution calculations',
        },
        {
          name: 'vesting',
          duration_description: '12-month hold period',
          description:
            'Token is in the hold period; weight is maintained at full value but cannot be redeemed',
        },
        {
          name: 'matured',
          duration_description: 'After hold period completion',
          description:
            'Token has completed the hold period and is eligible for full dividend distribution',
        },
        {
          name: 'decaying',
          duration_description: 'Post-maturity linear reduction',
          description:
            'Token weight reduces linearly over time, decreasing dividend share proportionally',
        },
      ],
    },

    governance_token: {
      purchasable: false,
      earned_via: 'contribution',
      transferable: false,
      voting_weight: 'equal',
      description:
        'Governance tokens grant voting rights in commons decisions. They are earned exclusively through contribution and cannot be purchased, sold, or transferred. Each contributor holds equal voting weight regardless of contribution volume.',
      revocation_conditions: [
        'Sustained inactivity exceeding 6 months without prior notice',
        'Violation of the AMIGA commons charter or governance principles',
      ],
    },

    infrastructure_bond: {
      description:
        'Infrastructure bonds represent long-term commitment to the commons. They are earned through sustained contribution over an extended period and confer additional benefits to committed participants.',
      min_commitment_months: 12,
      benefits: [
        'Priority in dispute resolution processes',
        'Eligibility for infrastructure commons distribution tier',
        'Advisory role in governance token revocation reviews',
      ],
      earned_via: 'sustained_contribution',
    },

    dividend: {
      attachment: 'proportional',
      distribution_tiers: [
        {
          name: 'direct_contributors',
          description:
            'Weighted share of mission revenue distributed proportionally to contribution token holders based on attribution weight',
        },
        {
          name: 'infrastructure_commons',
          description:
            'Shared pool for infrastructure bond holders who maintain the commons platform and tooling',
        },
        {
          name: 'universal_base_dividend',
          description:
            'Minimum share distributed to all registered contributors regardless of contribution size, ensuring baseline participation incentive',
        },
      ],
      payment_execution: false,
    },
  }),
);

// ============================================================================
// YAML Export
// ============================================================================

/**
 * Serialize an object to YAML format.
 *
 * Lightweight serializer for the known token architecture structure.
 * Handles strings, numbers, booleans, arrays, and nested objects.
 *
 * @param obj - The object to serialize
 * @param indent - Current indentation level (default 0)
 * @returns YAML string representation
 */
export function toYaml(obj: Record<string, unknown>, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${prefix}${key}: null`);
    } else if (typeof value === 'string') {
      lines.push(`${prefix}${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${prefix}${key}: ${value}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${prefix}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`);
      for (const item of value) {
        if (typeof item === 'string') {
          lines.push(`${prefix}  - ${item}`);
        } else if (typeof item === 'object' && item !== null) {
          const entries = Object.entries(item as Record<string, unknown>);
          if (entries.length > 0) {
            const [firstKey, firstVal] = entries[0];
            lines.push(`${prefix}  - ${firstKey}: ${firstVal}`);
            for (let i = 1; i < entries.length; i++) {
              const [k, v] = entries[i];
              lines.push(`${prefix}    ${k}: ${v}`);
            }
          }
        } else {
          lines.push(`${prefix}  - ${String(item)}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${prefix}${key}:`);
      lines.push(toYaml(value as Record<string, unknown>, indent + 1));
    }
  }

  return lines.join('\n');
}
