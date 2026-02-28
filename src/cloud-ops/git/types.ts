/**
 * Types for structured deployment commit messages.
 *
 * Deployment commits follow conventional commit format with the `deploy` type,
 * embedding NASA SE phase references, service names, change rationale, and
 * risk level into every git commit that modifies the running cloud platform.
 *
 * @module cloud-ops/git/types
 */

import type { OpenStackServiceName, SEPhaseId } from '../../core/types/openstack.js';

// ============================================================================
// Deployment Change Types
// ============================================================================

/** The type of deployment change being committed. */
export type DeploymentChangeType =
  | 'config'
  | 'deploy'
  | 'reconfigure'
  | 'upgrade'
  | 'rollback'
  | 'verify'
  | 'certificate'
  | 'network';

// ============================================================================
// Commit Metadata
// ============================================================================

/** Structured metadata for a deployment commit message. */
export interface DeploymentCommitInfo {
  /** What type of deployment change this is. */
  changeType: DeploymentChangeType;
  /** OpenStack services affected by this change. */
  services: OpenStackServiceName[];
  /** NASA SE phase this change corresponds to. */
  sePhase: SEPhaseId;
  /** One-line summary of the change. */
  summary: string;
  /** Why this change was made (decision rationale). */
  rationale: string;
  /** Configuration files modified (optional). */
  configFiles?: string[];
  /** Risk level of this change (defaults to 'low'). */
  riskLevel?: 'low' | 'medium' | 'high';
}

/** A deployment commit parsed back from a git log message. */
export interface ParsedDeploymentCommit extends DeploymentCommitInfo {
  /** The original raw commit message. */
  rawMessage: string;
  /** ISO 8601 timestamp from the commit, if available. */
  timestamp?: string;
}
