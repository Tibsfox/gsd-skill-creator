/**
 * Connection Map barrel export for the Mind-Body department.
 *
 * Exports the cross-discipline connection map and discipline navigator
 * for pathfinding between the 8 Mind-Body wings.
 *
 * @module departments/mind-body/map
 */

// Connection Map
export { ConnectionMap } from './connection-map.js';
export type { Connection, ConnectionType } from './connection-map.js';

// Discipline Navigator
export { DisciplineNavigator } from './discipline-navigator.js';
export type { NavigationPath } from './discipline-navigator.js';
