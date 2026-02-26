/**
 * Terminal Rendering for the Complex Plane Status Dashboard.
 *
 * Three exported rendering functions:
 * - renderPlaneStatus: full dashboard with bar charts, warnings, chords
 * - renderSkillDetail: detailed single-skill view with tangent properties
 * - renderSkillSummary: one-line per-skill summary with stability indicator
 *
 * Uses ASCII/Unicode block characters for bar charts. No external rendering
 * dependencies -- produces plain strings suitable for console.log().
 *
 * Imports: types.ts (PlaneMetrics, SkillPosition, TangentContext),
 *          arithmetic.ts (classifyByVersine, getPromotionLevel, requiredEvidence)
 */

import type { PlaneMetrics, SkillPosition, TangentContext } from './types.js';
import { MAX_ANGULAR_VELOCITY } from './types.js';
import { classifyByVersine, getPromotionLevel, requiredEvidence } from './arithmetic.js';

// ============================================================================
// Internal helpers
// ============================================================================

/** Full block character for filled portion of bar. */
const BLOCK_FULL = '\u2588';

/** Light shade character for empty portion of bar. */
const BLOCK_EMPTY = '\u2591';

/**
 * Render a horizontal bar chart segment.
 *
 * @param value - Current value
 * @param max - Maximum value (determines full bar width)
 * @param width - Character width of the bar (default 20)
 * @returns String of filled + empty block characters
 */
function renderBar(value: number, max: number, width = 20): string {
  if (max === 0) return BLOCK_EMPTY.repeat(width);
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return BLOCK_FULL.repeat(filled) + BLOCK_EMPTY.repeat(empty);
}

/**
 * Compute percentage, returning 0 for zero total.
 */
function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Determine stability label from angular velocity magnitude.
 *
 * - |vel| < 0.05: "stable"
 * - |vel| < MAX_ANGULAR_VELOCITY / 2: "moderate"
 * - else: "volatile"
 */
function stabilityLabel(angularVelocity: number): string {
  const absVel = Math.abs(angularVelocity);
  if (absVel < 0.05) return 'stable';
  if (absVel < MAX_ANGULAR_VELOCITY / 2) return 'moderate';
  return 'volatile';
}

/**
 * Stability indicator character.
 *
 * - stable: filled circle
 * - moderate/shifting: half circle
 * - volatile: empty circle
 */
function stabilityIndicator(angularVelocity: number): string {
  const absVel = Math.abs(angularVelocity);
  if (absVel < 0.05) return '\u25CF';            // ●
  if (absVel < MAX_ANGULAR_VELOCITY / 2) return '\u25D0'; // ◐
  return '\u25CB';                                 // ○
}

// ============================================================================
// renderPlaneStatus
// ============================================================================

/**
 * Render the full plane status dashboard as a terminal-friendly string.
 *
 * Includes: skill count, versine distribution bar chart, average exsecant,
 * angular velocity warnings, and chord candidates.
 *
 * Handles empty state gracefully with a "no skills" message.
 */
export function renderPlaneStatus(metrics: PlaneMetrics): string {
  if (metrics.totalSkills === 0) {
    return [
      '=== COMPLEX PLANE STATUS ===',
      '',
      'No skills positioned on the complex plane yet.',
    ].join('\n');
  }

  const { totalSkills, versineDistribution: dist, avgExsecant, angularVelocityWarnings, chordCandidates } = metrics;
  const maxBucket = Math.max(dist.grounded, dist.working, dist.frontier);

  const lines: string[] = [
    '=== COMPLEX PLANE STATUS ===',
    '',
    `Skills: ${totalSkills} total`,
    '',
    'Versine Distribution:',
    `  ${renderBar(dist.grounded, maxBucket)} Grounded: ${dist.grounded} (${pct(dist.grounded, totalSkills)}%)`,
    `  ${renderBar(dist.working, maxBucket)} Working:  ${dist.working} (${pct(dist.working, totalSkills)}%)`,
    `  ${renderBar(dist.frontier, maxBucket)} Frontier: ${dist.frontier} (${pct(dist.frontier, totalSkills)}%)`,
    '',
    `Avg Exsecant (external reach): ${avgExsecant.toFixed(3)}`,
  ];

  // Warnings section
  if (angularVelocityWarnings.length === 0) {
    lines.push('', 'Angular Velocity Warnings: none');
  } else {
    lines.push('', `Angular Velocity Warnings: ${angularVelocityWarnings.length}`);
    for (const w of angularVelocityWarnings) {
      lines.push(`  ! ${w}`);
    }
  }

  // Chords section
  if (chordCandidates.length === 0) {
    lines.push('', 'Chord Candidates: none');
  } else {
    lines.push('', `Chord Candidates: ${chordCandidates.length}`);
    for (const c of chordCandidates) {
      lines.push(`  -> ${c.fromId} <-> ${c.toId} (savings: ${c.savings.toFixed(2)})`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// renderSkillDetail
// ============================================================================

/**
 * Render a detailed view for a single skill on the complex plane.
 *
 * Shows position (theta in radians and degrees), zone classification,
 * promotion level, tangent properties (slope, reach, versine, exsecant),
 * angular velocity with stability label, and required evidence count.
 */
export function renderSkillDetail(
  skillId: string,
  position: SkillPosition,
  tangent: TangentContext,
): string {
  const degrees = position.theta * 180 / Math.PI;
  const zone = classifyByVersine(position);
  const level = getPromotionLevel(position);
  const stability = stabilityLabel(position.angularVelocity);
  const evidence = requiredEvidence(position);

  const lines: string[] = [
    `Skill: ${skillId}`,
    `+-- Position:  theta = ${position.theta.toFixed(3)} rad (${degrees.toFixed(1)} deg)  r = ${position.radius.toFixed(3)}`,
    `+-- Zone:      ${zone.charAt(0).toUpperCase() + zone.slice(1)}`,
    `+-- Level:     ${level}`,
    `+-- Tangent:   slope = ${tangent.slope.toFixed(3)}  reach = ${tangent.reach.toFixed(3)}`,
    `+-- Versine:   ${tangent.versine.toFixed(3)}`,
    `+-- Exsecant:  ${tangent.exsecant.toFixed(3)}`,
    `+-- Velocity:  ${position.angularVelocity.toFixed(3)} rad/cycle (${stability})`,
    `+-- Evidence:  ${evidence} needed for next promotion`,
  ];

  return lines.join('\n');
}

// ============================================================================
// renderSkillSummary
// ============================================================================

/**
 * Render a one-line summary for a skill on the complex plane.
 *
 * Format: "{id padded}  theta={t}  r={r}  [{ZONE}]  vel={v}  {indicator}"
 *
 * Stability indicators:
 * - stable (|vel| < 0.05): filled circle
 * - shifting (|vel| < threshold): half circle
 * - volatile (else): empty circle
 */
export function renderSkillSummary(
  skillId: string,
  position: SkillPosition,
): string {
  const zone = classifyByVersine(position).toUpperCase();
  const indicator = stabilityIndicator(position.angularVelocity);
  const padded = skillId.padEnd(20);

  return `${padded}  theta=${position.theta.toFixed(2)}  r=${position.radius.toFixed(2)}  [${zone}]  vel=${position.angularVelocity.toFixed(3)}  ${indicator}`;
}
