// Agent composition module exports

export {
  CoActivationTracker,
  DEFAULT_COACTIVATION_CONFIG,
} from './co-activation-tracker.js';

export type {
  SkillCoActivation,
  CoActivationConfig,
} from './co-activation-tracker.js';

export {
  ClusterDetector,
  DEFAULT_CLUSTER_CONFIG,
} from './cluster-detector.js';

export type {
  SkillCluster,
  ClusterConfig,
} from './cluster-detector.js';

export {
  AgentGenerator,
  DEFAULT_AGENT_GENERATOR_CONFIG,
} from './agent-generator.js';

export type {
  GeneratedAgent,
  AgentGeneratorConfig,
} from './agent-generator.js';

export { AgentSuggestionManager } from './agent-suggestion-manager.js';

export type {
  AgentSuggestion,
  AgentSuggestionState,
} from './agent-suggestion-manager.js';
