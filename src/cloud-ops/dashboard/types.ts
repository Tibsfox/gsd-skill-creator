/**
 * Shared types for the GSD-OS cloud operations dashboard panels.
 *
 * Used by cloud-ops-panel.ts (service health, alerts, mission telemetry)
 * and doc-console.ts (documentation navigation and content rendering).
 *
 * @module cloud-ops/dashboard/types
 */

import type { ServiceStatus, OpenStackServiceName, CommunicationLoopName } from '../../core/types/openstack.js';

// ============================================================================
// Re-export used types for downstream consumers
// ============================================================================

export type { ServiceStatus, OpenStackServiceName, CommunicationLoopName };

// ============================================================================
// Cloud Ops Panel Types
// ============================================================================

/** Health entry for a single OpenStack service. */
export interface ServiceHealthEntry {
  /** Service name (one of the 8 core OpenStack services). */
  name: OpenStackServiceName;
  /** Current operational status of the service. */
  status: ServiceStatus;
  /** ISO 8601 timestamp of the last health check. */
  lastCheck: string;
  /** Optional human-readable status message. */
  message?: string;
}

/** An alert from the health or cloud-ops communication loops. */
export interface AlertEntry {
  /** Alert severity level. */
  severity: 'critical' | 'warning' | 'info';
  /** The communication loop that generated this alert. */
  source: CommunicationLoopName;
  /** Human-readable alert message. */
  message: string;
  /** ISO 8601 timestamp of the alert. */
  timestamp: string;
}

/** Activation status of a crew member. */
export interface CrewStatus {
  /** Crew member name or role identifier. */
  name: string;
  /** Crew profile type determining capabilities. */
  profile: 'scout' | 'patrol' | 'squadron';
  /** Number of currently active roles. */
  activeRoles: number;
  /** Total number of roles in this crew. */
  totalRoles: number;
}

/** Token budget consumption status. */
export interface BudgetStatus {
  /** Tokens consumed in the current session. */
  used: number;
  /** Maximum token ceiling for the session. */
  ceiling: number;
  /** Whether usage has crossed the warning threshold. */
  warning: boolean;
  /** Whether usage has crossed the block threshold (usage suspended). */
  blocked: boolean;
}

/** Health status of a single communication loop. */
export interface LoopHealth {
  /** Communication loop identifier. */
  name: CommunicationLoopName;
  /** Whether the loop is currently operational. */
  operational: boolean;
  /** Optional last message received on this loop. */
  lastMessage?: string;
}

/** Combined mission telemetry for crew, budget, and loop health. */
export interface MissionTelemetry {
  /** Activation status of all crews. */
  crews: CrewStatus[];
  /** Current token budget status. */
  budget: BudgetStatus;
  /** Health status of all communication loops. */
  loops: LoopHealth[];
}

/** Full data for the cloud operations panel. */
export interface CloudOpsPanelData {
  /** null = no config (no panel), false = disabled, true = enabled. */
  enabled: boolean | null;
  /** Health entries for each OpenStack service. */
  services: ServiceHealthEntry[];
  /** Active alerts from health and cloud-ops loops. */
  alerts: AlertEntry[];
  /** Mission telemetry (crews, budget, loops). */
  telemetry: MissionTelemetry;
}

// ============================================================================
// Documentation Console Types
// ============================================================================

/** A navigation entry in the documentation console. */
export interface DocEntry {
  /** Unique document identifier. */
  id: string;
  /** Human-readable document title. */
  title: string;
  /** Document type for grouping in navigation. */
  type: 'chapter' | 'procedure' | 'runbook';
  /** File path or URL for the document. */
  path: string;
  /** Optional NASA SE phase cross-reference (e.g., "Phase E / ORR"). */
  sePhaseRef?: string;
}

/** Rendered document content with cross-references. */
export interface DocContent {
  /** The navigation entry for this document. */
  entry: DocEntry;
  /** Document body (may contain markdown or HTML). */
  body: string;
  /** Cross-reference links to related documents. */
  crossRefs: Array<{ label: string; targetId: string }>;
}

/** Full data for the documentation console panel. */
export interface DocConsoleData {
  /** null = no config (no panel), false = disabled, true = enabled. */
  enabled: boolean | null;
  /** All documentation entries for navigation. */
  entries: DocEntry[];
  /** Currently active document content, if any. */
  activeContent?: DocContent;
}
