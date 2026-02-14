/**
 * Budget-silicon data collector for the GSD Dashboard.
 *
 * Bridges the gap between raw budget validation data and the dashboard
 * renderers (renderBudgetGauge, renderSiliconPanel). Exports two pure
 * transformation functions and one async top-level collector that does I/O.
 *
 * @module dashboard/budget-silicon-collector
 */

import type { BudgetGaugeData, BudgetSegment } from './budget-gauge.js';
import type { SiliconPanelData } from './silicon-panel.js';
import type { CumulativeBudgetResult, SkillBudgetInfo } from '../validation/budget-validation.js';
import { BudgetValidator } from '../validation/budget-validation.js';
import { readIntegrationConfig } from '../integration/config/reader.js';
import type { IntegrationConfig } from '../integration/config/types.js';
import type { BudgetProfile } from '../types/application.js';
import { inferDomain } from '../identifiers/generator.js';
import type { DomainName } from '../identifiers/types.js';

// ============================================================================
// Constants
// ============================================================================

/** Domain-to-CSS-color mapping with custom property and hex fallback. */
const DOMAIN_COLOR_MAP: Record<DomainName, string> = {
  frontend: 'var(--domain-frontend, #58a6ff)',
  backend: 'var(--domain-backend, #3fb950)',
  testing: 'var(--domain-testing, #d29922)',
  infrastructure: 'var(--domain-infrastructure, #bc8cff)',
  observation: 'var(--domain-observation, #39d2c0)',
  silicon: 'var(--domain-silicon, #f778ba)',
};

/** Default color for skills with no domain match. */
const DEFAULT_COLOR = 'var(--text-muted, #8b949e)';

// ============================================================================
// Pure transformation: Budget Gauge
// ============================================================================

/**
 * Transform a CumulativeBudgetResult into BudgetGaugeData.
 *
 * Maps each skill into a domain-colored segment. Domain is inferred
 * from the skill name using keyword scoring via `inferDomain()`.
 *
 * @param result - Cumulative budget check result from BudgetValidator
 * @returns Data shape expected by renderBudgetGauge()
 */
export function toBudgetGaugeData(result: CumulativeBudgetResult): BudgetGaugeData {
  const segments: BudgetSegment[] = result.skills.map((skill: SkillBudgetInfo) => {
    const percentage = (skill.totalChars / result.budget) * 100;
    const domain = inferDomainFromSkill(skill.name);
    const color = domain !== null ? DOMAIN_COLOR_MAP[domain] : DEFAULT_COLOR;

    return {
      domain: skill.name,
      percentage: Math.round(percentage * 100) / 100,
      color,
    };
  });

  return {
    segments,
    totalUsed: result.usagePercent,
    label: 'Token Budget',
    overBudget: result.usagePercent > 100,
    deferredSkills: result.projection?.deferred.map((s) => s.name) ?? [],
  };
}

// ============================================================================
// Pure transformation: Silicon Panel
// ============================================================================

/**
 * Transform an IntegrationConfig (or null) into SiliconPanelData.
 *
 * When config is null (no file found), returns enabled=null so the
 * silicon panel renders nothing. When config exists, enabled reflects
 * the auto_load_skills toggle. Adapters and VRAM are always empty
 * until a silicon config section is added to IntegrationConfig.
 *
 * @param config - Integration config or null if no config file exists
 * @returns Data shape expected by renderSiliconPanel()
 */
export function toSiliconPanelData(config: IntegrationConfig | null): SiliconPanelData {
  if (config === null) {
    return {
      enabled: null,
      adapters: [],
      vram: { segments: [], totalUsed: 0 },
    };
  }

  return {
    enabled: config.integration.auto_load_skills,
    adapters: [],
    vram: { segments: [], totalUsed: 0 },
  };
}

// ============================================================================
// Async collector (I/O)
// ============================================================================

/** Options for the top-level collector. */
export interface CollectBudgetSiliconOptions {
  /** Path to skills directory (default: '.claude/commands'). */
  skillsDir?: string;
  /** Path to integration config file (default: '.planning/skill-creator.json'). */
  configPath?: string;
  /** Budget profile for loading projection. */
  profile?: BudgetProfile;
}

/**
 * Collect budget and silicon data from the filesystem.
 *
 * Reads skill files via BudgetValidator and integration config via
 * readIntegrationConfig, then transforms both through the pure functions.
 *
 * @param options - Optional paths and profile overrides
 * @returns Combined gauge and silicon data for dashboard rendering
 */
export async function collectBudgetSiliconData(
  options: CollectBudgetSiliconOptions = {},
): Promise<{ gauge: BudgetGaugeData; silicon: SiliconPanelData }> {
  const {
    skillsDir = '.claude/commands',
    configPath = '.planning/skill-creator.json',
    profile,
  } = options;

  // Load budget data
  const validator = BudgetValidator.load();
  const budgetResult = await validator.checkCumulative(skillsDir, profile);

  // Load integration config (null on error)
  let config: IntegrationConfig | null;
  try {
    config = await readIntegrationConfig(configPath);
  } catch {
    config = null;
  }

  return {
    gauge: toBudgetGaugeData(budgetResult),
    silicon: toSiliconPanelData(config),
  };
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Infer domain from a skill name using keyword scoring.
 *
 * Uses inferDomain() from identifiers/generator which defaults to
 * 'infrastructure' when no keywords match. We return that domain
 * since every domain has a color mapping.
 *
 * @param name - Skill name (e.g. "api-server", "test-runner")
 * @returns Domain name, or null if the skill name has no meaningful keywords
 */
function inferDomainFromSkill(name: string): DomainName | null {
  // Split skill name on hyphens/underscores to get individual words
  const text = name.replace(/[-_]/g, ' ');
  return inferDomain(text);
}
