/**
 * SkillInjector service.
 *
 * Resolves plan capability declarations (use/adapt verbs) into loadable
 * skill/agent content with budget-aware priority assignment. Bridges
 * capability declarations from Phase 55 with actual disk content.
 *
 * - use/adapt verbs: loaded into executor context
 * - create/after verbs: filtered out (not injected)
 * - team refs: filtered out (teams are not injectable as context)
 * - All injected skills receive 'critical' tier (declared = critical)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { SkillStore } from '../storage/skill-store.js';
import type { CapabilityRef, CapabilityType, CapabilityVerb } from './types.js';
import type { BudgetProfile, PriorityTier } from '../types/application.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Request to inject capabilities into an executor context.
 */
export interface InjectionRequest {
  capabilities: CapabilityRef[];
  budgetProfile?: BudgetProfile;
}

/**
 * A single resolved skill/agent with content and priority metadata.
 */
export interface InjectedSkill {
  name: string;
  type: CapabilityType;
  content: string;
  tier: PriorityTier;
  sourcePath: string;
  estimatedTokens: number;
}

/**
 * Result of injection: resolved skills, unresolvable refs, and token totals.
 */
export interface InjectionResult {
  injected: InjectedSkill[];
  notFound: CapabilityRef[];
  totalEstimatedTokens: number;
}

// ============================================================================
// Loadable verbs
// ============================================================================

/** Verbs that require loading content into the executor context. */
const LOADABLE_VERBS = new Set<CapabilityVerb>(['use', 'adapt']);

/** Type sort order: skills first, then agents. */
const TYPE_ORDER: Record<CapabilityType, number> = {
  skill: 0,
  agent: 1,
  team: 2,
};

// ============================================================================
// SkillInjector
// ============================================================================

/**
 * Resolves capability references to disk content for executor injection.
 *
 * Constructor accepts explicit stores/directories matching the
 * CapabilityDiscovery pattern for consistency and testability.
 */
export class SkillInjector {
  constructor(
    private skillStores: { scope: 'user' | 'project'; store: SkillStore }[],
    private agentDirs: { scope: 'user' | 'project'; dir: string }[],
  ) {}

  /**
   * Resolve capability references to loadable content.
   *
   * 1. Filter to use/adapt verbs only (create/after are not loaded)
   * 2. Filter out team refs (teams are not injectable as context)
   * 3. Resolve each ref against stores/directories
   * 4. Assign critical tier to all resolved skills
   * 5. Sort by type (skills first, then agents)
   */
  async inject(request: InjectionRequest): Promise<InjectionResult> {
    const injected: InjectedSkill[] = [];
    const notFound: CapabilityRef[] = [];

    // Filter to loadable verbs and injectable types
    const loadable = request.capabilities.filter(
      (ref) => LOADABLE_VERBS.has(ref.verb) && ref.type !== 'team'
    );

    for (const ref of loadable) {
      const resolved = await this.resolve(ref);
      if (resolved) {
        injected.push(resolved);
      } else {
        notFound.push(ref);
      }
    }

    // Sort by type (skills first, then agents) for deterministic ordering
    injected.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);

    const totalEstimatedTokens = injected.reduce(
      (sum, s) => sum + s.estimatedTokens,
      0
    );

    return { injected, notFound, totalEstimatedTokens };
  }

  /**
   * Resolve plan-level capabilities with phase inheritance.
   *
   * If planCapabilities is defined and non-empty, convert to CapabilityRef[].
   * If undefined/null/empty, return phaseCapabilities (inherit all from phase).
   */
  static resolveCapabilities(
    planCapabilities: Record<string, string[]> | undefined | null,
    phaseCapabilities: CapabilityRef[],
  ): CapabilityRef[] {
    // Inherit from phase when plan has no capability declarations
    if (!planCapabilities || Object.keys(planCapabilities).length === 0) {
      return phaseCapabilities;
    }

    // Convert plan capability map to CapabilityRef[]
    const refs: CapabilityRef[] = [];

    for (const [verb, entries] of Object.entries(planCapabilities)) {
      for (const entry of entries) {
        // Parse "type/name" format
        const slashIndex = entry.indexOf('/');
        if (slashIndex === -1) continue;

        const type = entry.slice(0, slashIndex) as CapabilityType;
        const name = entry.slice(slashIndex + 1);

        refs.push({
          verb: verb as CapabilityVerb,
          type,
          name,
        });
      }
    }

    return refs;
  }

  // --------------------------------------------------------------------------
  // Resolution
  // --------------------------------------------------------------------------

  /**
   * Attempt to resolve a single capability reference to disk content.
   * Returns null if the capability cannot be found.
   */
  private async resolve(ref: CapabilityRef): Promise<InjectedSkill | null> {
    switch (ref.type) {
      case 'skill':
        return this.resolveSkill(ref);
      case 'agent':
        return this.resolveAgent(ref);
      default:
        return null;
    }
  }

  /**
   * Resolve a skill ref by iterating stores and reading skill content.
   */
  private async resolveSkill(ref: CapabilityRef): Promise<InjectedSkill | null> {
    for (const { store } of this.skillStores) {
      try {
        const skill = await store.read(ref.name);
        const content = skill.body;
        return {
          name: ref.name,
          type: 'skill',
          content,
          tier: 'critical',
          sourcePath: skill.path,
          estimatedTokens: Math.ceil(content.length / 4),
        };
      } catch {
        // Skill not found in this store, try next
      }
    }
    return null;
  }

  /**
   * Resolve an agent ref by iterating directories and reading the .md file.
   */
  private async resolveAgent(ref: CapabilityRef): Promise<InjectedSkill | null> {
    for (const { dir } of this.agentDirs) {
      try {
        const filePath = join(dir, ref.name + '.md');
        const content = await readFile(filePath, 'utf-8');
        return {
          name: ref.name,
          type: 'agent',
          content,
          tier: 'critical',
          sourcePath: filePath,
          estimatedTokens: Math.ceil(content.length / 4),
        };
      } catch {
        // Agent not found in this directory, try next
      }
    }
    return null;
  }
}
