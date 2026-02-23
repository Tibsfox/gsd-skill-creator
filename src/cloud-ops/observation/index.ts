/**
 * Cloud-ops observation module barrel exports.
 *
 * Provides the deployment observation pipeline for capturing kolla-ansible
 * deployment patterns and identifying skill promotion candidates.
 *
 * @module cloud-ops/observation
 */

// Observer class
export { DeploymentObserver } from './deployment-observer.js';

// Types
export type {
  DeploymentAction,
  DeploymentEvent,
  DeploymentPattern,
  PromotionCandidate,
  DeploymentObserverConfig,
} from './types.js';

// Constants
export { DEFAULT_DEPLOYMENT_OBSERVER_CONFIG } from './types.js';
