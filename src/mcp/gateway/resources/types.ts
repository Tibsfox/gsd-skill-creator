/**
 * Resource provider interfaces for dependency injection.
 *
 * Each provider function returns data for a specific MCP resource.
 * Using interfaces (instead of concrete implementations) allows
 * tests to inject mock providers.
 */

// ============================================================================
// Provider Interfaces
// ============================================================================

/** Project configuration data returned by the project config provider. */
export interface ProjectConfigData {
  name: string;
  status: string;
  phaseCount: number;
  lastActivity: string;
  config: Record<string, unknown>;
}

/** Skill registry entry returned by the skill registry provider. */
export interface SkillRegistryEntry {
  name: string;
  domain: string;
  version: string;
  activations: number;
  lastActivated: string;
}

/** Agent telemetry data returned by the agent telemetry provider. */
export interface AgentTelemetryData {
  agentId: string;
  role: string;
  tokenUsage: number;
  taskCount: number;
  lastActivity: string;
  status: string;
}

// ============================================================================
// Provider Function Types
// ============================================================================

/** Retrieves project configuration by project name. Returns null if not found. */
export type ProjectConfigProvider = (name: string) => Promise<ProjectConfigData | null>;

/** Retrieves the full skill registry. */
export type SkillRegistryProvider = () => Promise<SkillRegistryEntry[]>;

/** Retrieves agent telemetry by agent ID. Returns null if not found. */
export type AgentTelemetryProvider = (agentId: string) => Promise<AgentTelemetryData | null>;

/** Retrieves the current chipset state as a YAML string. */
export type ChipsetStateProvider = () => string;

// ============================================================================
// Aggregate Provider Config
// ============================================================================

/** All resource providers bundled for dependency injection. */
export interface ResourceProviders {
  projectConfig: ProjectConfigProvider;
  skillRegistry: SkillRegistryProvider;
  agentTelemetry: AgentTelemetryProvider;
  chipsetState: ChipsetStateProvider;
}
