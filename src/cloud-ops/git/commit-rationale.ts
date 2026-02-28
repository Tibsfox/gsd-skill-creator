/**
 * Deployment commit message formatter and parser.
 *
 * Formats structured deployment metadata into conventional commit messages
 * (type `deploy`) and parses them back. Ensures every deployment decision
 * is searchable in git history by service name, SE phase, change type,
 * and risk level.
 *
 * @module cloud-ops/git/commit-rationale
 */

import { NASA_SE_PHASES } from '../../core/types/openstack.js';
import type { OpenStackServiceName, SEPhaseId } from '../../core/types/openstack.js';
import type {
  DeploymentChangeType,
  DeploymentCommitInfo,
  ParsedDeploymentCommit,
} from './types.js';

// ============================================================================
// Format
// ============================================================================

/**
 * Format a structured deployment commit message.
 *
 * Produces a conventional commit with `deploy` as the type and the affected
 * services as the scope. The body includes SE phase cross-reference, change
 * type, risk level, rationale, and optional config file listing.
 *
 * @example
 * ```ts
 * formatDeploymentCommit({
 *   changeType: 'config',
 *   services: ['keystone', 'nova'],
 *   sePhase: 'c',
 *   summary: 'update endpoint URLs',
 *   rationale: 'migrating to internal DNS',
 * });
 * // => "deploy(keystone,nova): update endpoint URLs\n\nSE Phase: c (Phase C: ...)\n..."
 * ```
 */
export function formatDeploymentCommit(info: DeploymentCommitInfo): string {
  const scope = info.services.join(',');
  const riskLevel = info.riskLevel ?? 'low';

  const phase = NASA_SE_PHASES.find(p => p.phase === info.sePhase);
  const phaseName = phase ? phase.name : info.sePhase;

  const lines: string[] = [
    `deploy(${scope}): ${info.summary}`,
    '',
    `SE Phase: ${info.sePhase} (${phaseName})`,
    `Change Type: ${info.changeType}`,
    `Risk Level: ${riskLevel}`,
    `Services: ${info.services.join(', ')}`,
    '',
    `Rationale: ${info.rationale}`,
  ];

  if (info.configFiles && info.configFiles.length > 0) {
    lines.push('');
    lines.push('Config Files:');
    for (const f of info.configFiles) {
      lines.push(`  - ${f}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Parse
// ============================================================================

/** Regex matching the deploy({scope}): subject line. */
const DEPLOY_SUBJECT_RE = /^deploy\(([^)]+)\):\s*(.+)$/;

/** Regex matching a body field line like "SE Phase: pre-a (Pre-Phase A: ...)". */
const FIELD_RE = /^([A-Za-z ]+):\s*(.+)$/;

/**
 * Parse a deployment commit message back into structured data.
 *
 * Returns `null` if the message does not match the deployment commit format.
 */
export function parseDeploymentCommit(message: string): ParsedDeploymentCommit | null {
  const lines = message.split('\n');

  // First line must match deploy({scope}): subject
  const subjectMatch = lines[0]?.match(DEPLOY_SUBJECT_RE);
  if (!subjectMatch) {
    return null;
  }

  const servicesFromScope = subjectMatch[1].split(',').map(s => s.trim()) as OpenStackServiceName[];
  const summary = subjectMatch[2].trim();

  // Parse body fields
  let sePhase: SEPhaseId | undefined;
  let changeType: DeploymentChangeType | undefined;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let rationale: string | undefined;
  let services: OpenStackServiceName[] = servicesFromScope;
  const configFiles: string[] = [];

  let inConfigFiles = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Config file entries
    if (inConfigFiles) {
      const cfgMatch = line.match(/^\s+-\s+(.+)$/);
      if (cfgMatch) {
        configFiles.push(cfgMatch[1]);
        continue;
      } else if (line.trim() === '') {
        continue;
      } else {
        inConfigFiles = false;
      }
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Check for "Config Files:" header
    if (line.trim() === 'Config Files:') {
      inConfigFiles = true;
      continue;
    }

    // Field lines
    const fieldMatch = line.match(FIELD_RE);
    if (fieldMatch) {
      const key = fieldMatch[1].trim();
      const value = fieldMatch[2].trim();

      switch (key) {
        case 'SE Phase': {
          // Extract phase ID before the parenthetical: "c (Phase C: ...)"
          const phaseIdMatch = value.match(/^([a-z-]+)/);
          if (phaseIdMatch) {
            sePhase = phaseIdMatch[1] as SEPhaseId;
          }
          break;
        }
        case 'Change Type':
          changeType = value as DeploymentChangeType;
          break;
        case 'Risk Level':
          riskLevel = value as 'low' | 'medium' | 'high';
          break;
        case 'Services':
          services = value.split(',').map(s => s.trim()) as OpenStackServiceName[];
          break;
        case 'Rationale':
          rationale = value;
          break;
      }
    }
  }

  // Must have required fields
  if (!sePhase || !changeType || !rationale) {
    return null;
  }

  return {
    changeType,
    services,
    sePhase,
    summary,
    rationale,
    riskLevel,
    configFiles: configFiles.length > 0 ? configFiles : undefined,
    rawMessage: message,
  };
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Quick check whether a commit message is a deployment commit.
 *
 * Returns `true` if the message starts with `deploy(`.
 */
export function isDeploymentCommit(message: string): boolean {
  return message.startsWith('deploy(');
}
