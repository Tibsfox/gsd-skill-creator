/**
 * Runbook Interface Extension for the Cloud Systems Department.
 *
 * Provides the typed entry point for cloud-systems try-sessions, using the
 * full OpenStackServiceName and VerificationMethod types from src/types/openstack.ts.
 * Try-sessions import this file rather than importing openstack.ts directly.
 *
 * @module departments/cloud-systems/extensions/runbook-interface
 */

import type { OpenStackServiceName, VerificationMethod } from '../../../../src/core/types/openstack.js';

/** A simplified procedure step for educational try-sessions. */
export interface TrySessionStep {
  /** Service being interacted with */
  service: OpenStackServiceName;
  /** Action description in plain language */
  action: string;
  /** Verification method used to confirm success */
  verification: VerificationMethod;
  /** Expected terminal output or UI state after action */
  expectedOutcome: string;
  /** Concept IDs from cloud-systems department explored in this step */
  conceptsExplored: string[];
}

/** Configuration for a guided cloud-systems try-session runbook. */
export interface RunbookSessionConfig {
  /** Wing context */
  wing: 'identity-networking' | 'compute-storage' | 'orchestration' | 'nasa-se-lifecycle' | 'runbook-operations';
  /** Runbook title */
  title: string;
  /** Services involved in this session */
  services: OpenStackServiceName[];
  /** Estimated session duration in minutes */
  estimatedMinutes: number;
  /** Prerequisites (e.g., running OpenStack environment) */
  prerequisites: string[];
  /** Ordered procedure steps */
  steps: TrySessionStep[];
}

/**
 * Creates a runbook-based cloud systems try-session.
 *
 * @param config - Runbook session configuration
 * @returns RunbookSessionConfig validated for use in a try-session
 */
export function createRunbookSession(config: RunbookSessionConfig): RunbookSessionConfig {
  return config;
}
