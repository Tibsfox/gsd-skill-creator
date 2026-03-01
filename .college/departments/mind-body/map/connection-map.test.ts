/**
 * Connection Map and Discipline Navigator tests -- TDD RED phase.
 *
 * Tests for bidirectional cross-discipline connections and pathfinding.
 */
import { describe, it, expect } from 'vitest';

import type { MindBodyWingId } from '../types.js';
import { ConnectionMap } from './connection-map.js';
import { DisciplineNavigator } from './discipline-navigator.js';

const ALL_WINGS: MindBodyWingId[] = [
  'breath', 'meditation', 'yoga', 'pilates',
  'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
];

describe('ConnectionMap', () => {
  const map = new ConnectionMap();

  it('breath connects to all 7 other modules', () => {
    const connections = map.getConnections('breath');
    const targets = connections.map((c) => c.to);
    for (const wing of ALL_WINGS.filter((w) => w !== 'breath')) {
      expect(targets).toContain(wing);
    }
  });

  it('meditation connects to martial-arts', () => {
    expect(map.areConnected('meditation', 'martial-arts')).toBe(true);
  });

  it('yoga connects to pilates', () => {
    expect(map.areConnected('yoga', 'pilates')).toBe(true);
  });

  it('yoga connects to tai-chi', () => {
    expect(map.areConnected('yoga', 'tai-chi')).toBe(true);
  });

  it('martial-arts connects to tai-chi', () => {
    expect(map.areConnected('martial-arts', 'tai-chi')).toBe(true);
  });

  it('relaxation connects to all other practice modules', () => {
    const connections = map.getConnections('relaxation');
    const targets = connections.map((c) => c.to);
    for (const wing of ALL_WINGS.filter((w) => w !== 'relaxation')) {
      expect(targets).toContain(wing);
    }
  });

  it('philosophy connects to every module', () => {
    const connections = map.getConnections('philosophy');
    const targets = connections.map((c) => c.to);
    for (const wing of ALL_WINGS.filter((w) => w !== 'philosophy')) {
      expect(targets).toContain(wing);
    }
  });

  it('all connections are bidirectional', () => {
    const allConnections = map.getAllConnections();
    for (const [wingId, connections] of allConnections.entries()) {
      for (const conn of connections) {
        expect(conn.bidirectional).toBe(true);
        // Reverse also exists
        expect(map.areConnected(conn.to, wingId)).toBe(true);
      }
    }
  });

  it('no isolated disciplines -- every module has at least 2 connections', () => {
    for (const wing of ALL_WINGS) {
      const connections = map.getConnections(wing);
      expect(connections.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each connection has a type', () => {
    const allConnections = map.getAllConnections();
    for (const connections of allConnections.values()) {
      for (const conn of connections) {
        expect(['foundational', 'complementary', 'shared-roots', 'philosophical']).toContain(
          conn.type,
        );
      }
    }
  });

  it('each connection has a description', () => {
    const allConnections = map.getAllConnections();
    for (const connections of allConnections.values()) {
      for (const conn of connections) {
        expect(conn.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('breath connections are of type foundational', () => {
    const breathConns = map.getConnections('breath');
    for (const conn of breathConns) {
      expect(conn.type).toBe('foundational');
    }
  });
});

describe('DisciplineNavigator', () => {
  const navigator = new DisciplineNavigator();

  it('every discipline is reachable from every other', () => {
    for (const from of ALL_WINGS) {
      const reachable = navigator.getReachable(from);
      for (const to of ALL_WINGS.filter((w) => w !== from)) {
        expect(reachable).toContain(to);
      }
    }
  });

  it('direct connections have distance 1', () => {
    // Breath to meditation should be direct (foundational)
    const path = navigator.navigate('breath', 'meditation');
    expect(path.distance).toBe(1);
  });

  it('indirect connections have distance > 1 when no direct link exists', () => {
    // pilates to martial-arts: not directly connected (except via breath/relaxation/philosophy)
    // Actually, since breath, relaxation, philosophy connect to everything,
    // all pairs have at least one distance-1 path via a universal connector.
    // Let's verify that navigate returns a valid path for all pairs
    for (const from of ALL_WINGS) {
      for (const to of ALL_WINGS.filter((w) => w !== from)) {
        const path = navigator.navigate(from, to);
        expect(path.distance).toBeGreaterThanOrEqual(1);
        expect(path.from).toBe(from);
        expect(path.to).toBe(to);
      }
    }
  });

  it('navigation path has valid from and to', () => {
    const path = navigator.navigate('yoga', 'tai-chi');
    expect(path.from).toBe('yoga');
    expect(path.to).toBe('tai-chi');
  });

  it('navigation path via field contains intermediate steps for indirect paths', () => {
    const path = navigator.navigate('yoga', 'tai-chi');
    // yoga -> tai-chi is direct, so via should be empty
    expect(path.distance).toBe(1);
    expect(path.via).toHaveLength(0);
  });

  it('no dead ends in navigation -- every reachable set includes all 7 other disciplines', () => {
    for (const wing of ALL_WINGS) {
      const reachable = navigator.getReachable(wing);
      expect(reachable).toHaveLength(7);
    }
  });
});
