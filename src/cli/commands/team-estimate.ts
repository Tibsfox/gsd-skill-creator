/**
 * CLI command for team cost estimation.
 *
 * Loads a team configuration and displays projected token usage and
 * approximate cost per member and total. Uses CostEstimator with
 * static pricing tables and per-topology token heuristics.
 *
 * Output follows the budget-estimate command style with @clack/prompts
 * and picocolors formatting.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { TeamStore, getTeamsBasePath } from '../../teams/team-store.js';
import { CostEstimator, PRICING_LAST_UPDATED } from '../../teams/cost-estimator.js';
import type { TeamScope } from '../../teams/team-store.js';

/**
 * Format a USD value for display.
 * Shows 2 decimal places for values >= $0.01, otherwise 4.
 */
function formatUsd(value: number): string {
  if (value >= 0.01) {
    return `$${value.toFixed(2)}`;
  }
  return `$${value.toFixed(4)}`;
}

/**
 * Format a token count with locale-aware thousands separators.
 */
function formatTokens(count: number): string {
  return `~${Math.round(count).toLocaleString()}`;
}

/**
 * Team estimate CLI command.
 *
 * Loads a team config by name and displays per-member token estimates,
 * cost ranges (min/expected/max), and total cost.
 *
 * @param args - CLI arguments: [teamName, ...flags]
 * @returns Exit code (0 success, 1 error)
 */
export async function teamEstimateCommand(args: string[]): Promise<number> {
  // Parse scope flag
  const scopeIdx = args.indexOf('--scope');
  const scopeValue = scopeIdx >= 0 ? args[scopeIdx + 1] : undefined;
  const scope: TeamScope = (scopeValue === 'user' || scopeValue === 'project') ? scopeValue : 'project';

  // Extract team name (first positional arg that is not a flag)
  const teamName = args.find(a => !a.startsWith('--'));

  if (!teamName) {
    p.log.error('Usage: skill-creator team estimate <team-name> [--scope user|project]');
    return 1;
  }

  const teamsDir = getTeamsBasePath(scope);
  const store = new TeamStore(teamsDir);

  // Check team exists
  const exists = await store.exists(teamName);
  if (!exists) {
    p.log.error(`Team "${teamName}" not found at ${scope} scope.`);

    // List available teams
    const available = await store.list();
    if (available.length > 0) {
      p.log.message('');
      p.log.message(pc.bold('Available teams:'));
      for (const name of available) {
        p.log.message(`  - ${name}`);
      }
    }
    return 1;
  }

  // Load config
  const config = await store.read(teamName);

  // Estimate costs
  const estimator = new CostEstimator();
  const estimate = estimator.estimate(config);

  // Display formatted output
  p.intro(pc.bgCyan(pc.black(' Team Cost Estimate ')));

  // Header
  p.log.message('');
  p.log.message(
    pc.bold(`Team: ${estimate.teamName}`) +
    ` | Topology: ${estimate.topology}` +
    ` | Members: ${estimate.members.length}`
  );
  p.log.message('');

  // Per-member estimates
  p.log.message(pc.bold('Per-Member Estimates:'));
  for (const member of estimate.members) {
    p.log.message(`  ${pc.cyan(member.agentId)} (${member.model})`);
    p.log.message(`    Tokens: ${formatTokens(member.estimatedInputTokens)} in / ${formatTokens(member.estimatedOutputTokens)} out`);
    p.log.message(`    Cost:   ${formatUsd(member.estimatedCost)} (range: ${formatUsd(member.minCost)} - ${formatUsd(member.maxCost)})`);
    p.log.message('');
  }

  // Totals
  p.log.message(pc.bold(`Total Estimated Cost: ${formatUsd(estimate.totalEstimatedCost)} (range: ${formatUsd(estimate.totalMinCost)} - ${formatUsd(estimate.totalMaxCost)})`));
  p.log.message(pc.bold(`Total Estimated Tokens: ${formatTokens(estimate.totalEstimatedTokens)}`));
  p.log.message('');

  // Pricing date and disclaimer
  p.log.message(pc.dim(`Pricing based on data from ${estimate.pricingDate}.`));
  p.log.message(pc.dim('These are rough estimates. Actual usage depends on task complexity and iterations.'));

  // Staleness warning (90 days)
  const pricingDate = new Date(PRICING_LAST_UPDATED);
  const now = new Date();
  const daysSincePricing = Math.floor((now.getTime() - pricingDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSincePricing > 90) {
    p.log.message('');
    p.log.message(pc.dim('Note: Pricing data is older than 90 days and may be outdated.'));
  }

  p.outro('Done.');
  return 0;
}
