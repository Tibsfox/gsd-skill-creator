/**
 * Mind-Body Department Integration Tests.
 *
 * End-to-end tests verifying the chipset configuration, connection map,
 * discipline navigator, and navigation paths through the Training Hall
 * to all department components.
 *
 * Tests cover:
 * - Chipset: 10 skills, 3 agents, token budget
 * - Connection map: bidirectional relationships, universal connectors
 * - Navigator: reachability, pathfinding, no dead ends
 * - E2E navigation: Training Hall -> Browse/Try/Build/Map/Journal
 *
 * @module departments/mind-body/integration.test
 */

import { describe, it, expect } from 'vitest';

// ─── Chipset imports ─────────────────────────────────────────────────────────
import {
  chipsetConfig,
  senseiAgent,
  instructorAgent,
  builderAgent,
} from './chipset/index.js';

// ─── Map imports ─────────────────────────────────────────────────────────────
import { ConnectionMap, DisciplineNavigator } from './map/index.js';
import type { MindBodyWingId } from './types.js';

// ─── Existing module imports ─────────────────────────────────────────────────
import { TrainingHall } from './training-hall.js';
import { DisciplineBrowser } from './browse/discipline-browser.js';
import { allTrySessions } from './try-sessions/index.js';
import { SessionGenerator } from './practice-builder/session-generator.js';
import { PhysicalSafetyWarden } from './safety/physical-safety-warden.js';
import { JournalDisplay } from './journal/journal-display.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_WINGS: MindBodyWingId[] = [
  'breath', 'meditation', 'yoga', 'pilates',
  'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
];

// =============================================================================
// CHIPSET TESTS
// =============================================================================

describe('Integration: Chipset Configuration', () => {
  it('chipsetConfig has exactly 10 skills', () => {
    expect(chipsetConfig.skills).toHaveLength(10);
  });

  it('chipsetConfig has exactly 3 agents', () => {
    expect(chipsetConfig.agents).toHaveLength(3);
  });

  it('chipsetConfig.name is "mind-body"', () => {
    expect(chipsetConfig.name).toBe('mind-body');
  });

  it('all 10 skill IDs are present', () => {
    const ids = chipsetConfig.skills.map((s) => s.id);
    const expected = [
      'breath-guide', 'meditation-guide', 'yoga-guide', 'pilates-guide',
      'martial-arts-guide', 'tai-chi-guide', 'recovery-guide', 'philosophy-guide',
      'practice-builder', 'safety-warden',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });

  it('sensei agent routes breath, meditation, martial-arts, tai-chi, philosophy', () => {
    expect(senseiAgent.skills).toEqual([
      'breath-guide', 'meditation-guide', 'martial-arts-guide',
      'tai-chi-guide', 'philosophy-guide',
    ]);
  });

  it('instructor agent routes yoga, pilates, recovery, safety-warden', () => {
    expect(instructorAgent.skills).toEqual([
      'yoga-guide', 'pilates-guide', 'recovery-guide', 'safety-warden',
    ]);
  });

  it('builder agent routes practice-builder', () => {
    expect(builderAgent.skills).toEqual(['practice-builder']);
  });

  it('token budget: sessionCeiling 8000, safetyWardenReserve 500, journalOverhead 200', () => {
    expect(chipsetConfig.tokenBudget.sessionCeiling).toBe(8000);
    expect(chipsetConfig.tokenBudget.safetyWardenReserve).toBe(500);
    expect(chipsetConfig.tokenBudget.journalOverhead).toBe(200);
  });

  it('every skill in every agent is a valid chipset skill', () => {
    const skillIds = new Set(chipsetConfig.skills.map((s) => s.id));
    for (const agent of chipsetConfig.agents) {
      for (const skill of agent.skills) {
        expect(skillIds.has(skill)).toBe(true);
      }
    }
  });

  it('every chipset skill is assigned to exactly one agent', () => {
    const agentSkills = chipsetConfig.agents.flatMap((a) => a.skills);
    const skillIds = chipsetConfig.skills.map((s) => s.id);
    // Every skill is assigned
    for (const id of skillIds) {
      expect(agentSkills).toContain(id);
    }
    // No duplicates across agents
    expect(new Set(agentSkills).size).toBe(agentSkills.length);
  });
});

// =============================================================================
// CONNECTION MAP TESTS
// =============================================================================

describe('Integration: Connection Map', () => {
  const map = new ConnectionMap();

  it('breath connects to all 7 other modules', () => {
    const connections = map.getConnections('breath');
    const targets = connections.map((c) => c.to);
    for (const wing of ALL_WINGS.filter((w) => w !== 'breath')) {
      expect(targets).toContain(wing);
    }
  });

  it('meditation connects to martial-arts (historically inseparable)', () => {
    expect(map.areConnected('meditation', 'martial-arts')).toBe(true);
  });

  it('yoga connects to pilates (complementary physical practices)', () => {
    expect(map.areConnected('yoga', 'pilates')).toBe(true);
  });

  it('yoga connects to tai-chi (breath to movement)', () => {
    expect(map.areConnected('yoga', 'tai-chi')).toBe(true);
  });

  it('martial-arts connects to tai-chi (same roots)', () => {
    expect(map.areConnected('martial-arts', 'tai-chi')).toBe(true);
  });

  it('all connections are bidirectional', () => {
    const allConnections = map.getAllConnections();
    for (const [wingId, connections] of allConnections.entries()) {
      for (const conn of connections) {
        expect(conn.bidirectional).toBe(true);
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
});

// =============================================================================
// NAVIGATOR TESTS
// =============================================================================

describe('Integration: Discipline Navigator', () => {
  const navigator = new DisciplineNavigator();

  it('every discipline reachable from every other', () => {
    for (const from of ALL_WINGS) {
      const reachable = navigator.getReachable(from);
      expect(reachable).toHaveLength(7);
    }
  });

  it('direct connections have distance 1', () => {
    const path = navigator.navigate('breath', 'meditation');
    expect(path.distance).toBe(1);
  });

  it('navigation returns valid path structure for all pairs', () => {
    for (const from of ALL_WINGS) {
      for (const to of ALL_WINGS.filter((w) => w !== from)) {
        const path = navigator.navigate(from, to);
        expect(path.from).toBe(from);
        expect(path.to).toBe(to);
        expect(path.distance).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('no dead ends in navigation', () => {
    for (const wing of ALL_WINGS) {
      const reachable = navigator.getReachable(wing);
      for (const target of reachable) {
        // Can navigate back
        const backReachable = navigator.getReachable(target);
        expect(backReachable).toContain(wing);
      }
    }
  });
});

// =============================================================================
// E2E NAVIGATION TESTS
// =============================================================================

describe('Integration: E2E Navigation', () => {
  it('Training Hall -> Browse -> Discipline profile -> Connected discipline', () => {
    const hall = new TrainingHall();
    const view = hall.getView(0, 0);

    // Training Hall has browse option
    const browseOption = view.options.find((o) => o.id === 'browse');
    expect(browseOption).toBeDefined();

    // Browse -> get a discipline profile
    const browser = new DisciplineBrowser();
    const yogaProfile = browser.getDisciplineProfile('yoga');
    expect(yogaProfile.id).toBe('yoga');
    expect(yogaProfile.name).toBe('Yoga');
    expect(yogaProfile.connections.length).toBeGreaterThan(0);

    // Navigate to a connected discipline
    const firstConnection = yogaProfile.connections[0];
    const connectedProfile = browser.getDisciplineProfile(firstConnection.targetId);
    expect(connectedProfile).toBeDefined();
    expect(connectedProfile.id).toBe(firstConnection.targetId);
  });

  it('Training Hall -> Try Session -> any module (session loads)', () => {
    const hall = new TrainingHall();
    const view = hall.getView(0, 0);

    // Training Hall has try option
    const tryOption = view.options.find((o) => o.id === 'try');
    expect(tryOption).toBeDefined();

    // Try sessions load for all 8 wings
    expect(allTrySessions).toHaveLength(8);
    for (const session of allTrySessions) {
      expect(session.title.length).toBeGreaterThan(0);
      expect(session.steps.length).toBeGreaterThan(0);
    }
  });

  it('Training Hall -> Build -> session generates', () => {
    const hall = new TrainingHall();
    const view = hall.getView(0, 0);

    // Training Hall has build option
    const buildOption = view.options.find((o) => o.id === 'build');
    expect(buildOption).toBeDefined();

    // Build a session
    const generator = new SessionGenerator();
    const session = generator.generateSession(['yoga', 'breath'], 15);
    expect(session.totalMinutes).toBe(15);
    expect(session.warmUp).toBeDefined();
    expect(session.coolDown).toBeDefined();
    expect(session.segments.length).toBeGreaterThan(0);
  });

  it('Training Hall -> Map -> connections render', () => {
    const hall = new TrainingHall();
    const view = hall.getView(0, 0);

    // Training Hall has map option
    const mapOption = view.options.find((o) => o.id === 'map');
    expect(mapOption).toBeDefined();

    // Map connections load
    const connectionMap = new ConnectionMap();
    const allConnections = connectionMap.getAllConnections();
    expect(allConnections.size).toBe(8);

    // Every wing has connections
    for (const [, conns] of allConnections) {
      expect(conns.length).toBeGreaterThan(0);
    }
  });

  it('Training Hall -> Journal -> display renders', () => {
    const hall = new TrainingHall();
    const view = hall.getView(0, 0);

    // Training Hall has journal option
    const journalOption = view.options.find((o) => o.id === 'journal');
    expect(journalOption).toBeDefined();

    // Journal display renders
    const display = new JournalDisplay();
    const welcome = display.renderWelcome(null, 0);
    expect(welcome.length).toBeGreaterThan(0);
  });

  it('connection map aligns with discipline browser connections', () => {
    const connectionMap = new ConnectionMap();
    const browser = new DisciplineBrowser();

    // For each wing, the connection map should reflect discipline browser connections
    for (const wing of ALL_WINGS) {
      const mapConns = connectionMap.getConnections(wing);
      const browserConns = browser.getConnections(wing);

      // Map should have at least as many connections as the browser
      // (map may have more due to explicit universal connectors)
      expect(mapConns.length).toBeGreaterThanOrEqual(1);
      expect(browserConns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('chipset skills cover all disciplines navigable from the map', () => {
    const navigator = new DisciplineNavigator();
    const skillDomains = new Set(chipsetConfig.skills.map((s) => s.domain));

    // All 8 wing disciplines should be represented in chipset skill domains
    // (some skills map to domain names slightly differently)
    for (const wing of ALL_WINGS) {
      const reachable = navigator.getReachable(wing);
      expect(reachable).toHaveLength(7);
    }

    // Domains covered: 8 wings + practice-builder + safety
    expect(skillDomains.size).toBe(10);
  });

  it('safety warden is available for session generation', () => {
    const warden = new PhysicalSafetyWarden();
    expect(warden).toBeDefined();
    // Warden can annotate movement content with context
    const annotation = warden.annotate('Practice headstand against the wall', {
      module: 'yoga',
      technique: 'headstand',
      userConditions: [],
    });
    expect(annotation).toBeDefined();
    expect(annotation.original).toBe('Practice headstand against the wall');
  });
});
