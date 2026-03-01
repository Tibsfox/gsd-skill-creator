/**
 * Observation Bridge -- connects Rosetta Core concept exploration/translation
 * to the existing skill-creator SessionObservation pipeline.
 *
 * When a user explores a cooking concept (via DepartmentExplorer.explore())
 * or translates one (via RosettaCore.translate()), the bridge emits a
 * CollegeObservationEvent. These events can be batch-converted into a
 * SessionObservation that the existing pattern detection pipeline consumes.
 *
 * Decoupled design: the bridge produces SessionObservation objects but does
 * NOT import SessionObserver directly. Consumers feed the objects to
 * SessionObserver.onSessionEnd() or PatternStore.append().
 *
 * @module integration/observation-bridge
 */

import type { ExplorationResult } from '../college/types.js';
import type { PanelId } from '../rosetta-core/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * An event emitted when a concept is explored or translated in the College.
 */
export interface CollegeObservationEvent {
  /** Unique event identifier */
  id: string;
  /** Whether this was an exploration or translation */
  type: 'exploration' | 'translation';
  /** The concept that was explored/translated */
  conceptId: string;
  /** Department containing the concept (present for explorations) */
  departmentId?: string;
  /** Exploration path (present for explorations) */
  path?: string;
  /** Panels involved in translation (present for translations) */
  panelIds?: PanelId[];
  /** Translation ID (present for translations) */
  translationId?: string;
  /** Unix timestamp (Date.now()) */
  timestamp: number;
  /** Estimated token cost of the operation (optional) */
  tokenCost?: number;
}

/**
 * Configuration for the ObservationBridge.
 */
export interface ObservationBridgeConfig {
  /** Current session ID */
  sessionId: string;
  /** Skills active during this session (defaults to ['college']) */
  activeSkills?: string[];
}

/**
 * Minimal Translation interface -- only the fields the bridge needs.
 * Avoids importing the full Translation type from the engine module.
 */
interface TranslationLike {
  id: string;
  concept: { id: string };
  panels: { primary: PanelId; secondary?: PanelId[] };
}

/**
 * SessionObservation-compatible shape. Matches src/types/observation.ts
 * without importing from src/ directly.
 */
interface SessionObservationCompat {
  sessionId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  source: 'startup' | 'resume' | 'clear' | 'compact';
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
  metrics: {
    userMessages: number;
    assistantMessages: number;
    toolCalls: number;
    uniqueFilesRead: number;
    uniqueFilesWritten: number;
    uniqueCommandsRun: number;
  };
  topCommands: string[];
  topFiles: string[];
  topTools: string[];
  activeSkills: string[];
  tier?: 'ephemeral' | 'persistent';
}

type Listener = (event: CollegeObservationEvent) => void;

// ─── ObservationBridge ───────────────────────────────────────────────────────

export class ObservationBridge {
  private readonly config: Required<ObservationBridgeConfig>;
  private readonly listeners: Set<Listener> = new Set();
  private buffer: CollegeObservationEvent[] = [];
  private idCounter = 0;

  constructor(config: ObservationBridgeConfig) {
    this.config = {
      sessionId: config.sessionId,
      activeSkills: config.activeSkills ?? ['college'],
    };
  }

  /**
   * Record a concept exploration event.
   *
   * @param result - The ExplorationResult from DepartmentExplorer.explore()
   * @returns The emitted CollegeObservationEvent
   */
  onExploration(result: ExplorationResult): CollegeObservationEvent {
    const event: CollegeObservationEvent = {
      id: this.nextId(),
      type: 'exploration',
      conceptId: result.concept.id,
      departmentId: result.departmentId,
      path: result.path,
      timestamp: Date.now(),
    };

    this.buffer.push(event);
    this.notify(event);
    return event;
  }

  /**
   * Record a concept translation event.
   *
   * @param translation - The Translation from RosettaCore.translate()
   * @returns The emitted CollegeObservationEvent
   */
  onTranslation(translation: TranslationLike): CollegeObservationEvent {
    const panelIds: PanelId[] = [translation.panels.primary];
    // Do not include secondary panels in the event -- only the primary is the "active" panel

    const event: CollegeObservationEvent = {
      id: this.nextId(),
      type: 'translation',
      conceptId: translation.concept.id,
      translationId: translation.id,
      panelIds,
      timestamp: Date.now(),
    };

    this.buffer.push(event);
    this.notify(event);
    return event;
  }

  /**
   * Register a listener for observation events.
   */
  addListener(fn: Listener): void {
    this.listeners.add(fn);
  }

  /**
   * Remove a previously registered listener.
   */
  removeListener(fn: Listener): void {
    this.listeners.delete(fn);
  }

  /**
   * Return and clear all buffered events since the last flush.
   */
  flush(): CollegeObservationEvent[] {
    const events = [...this.buffer];
    this.buffer = [];
    return events;
  }

  /**
   * Convert a batch of CollegeObservationEvents into a single
   * SessionObservation compatible with the existing pipeline.
   *
   * Maps:
   *  - topFiles = unique concept paths from exploration events
   *  - topTools = unique tool types ('college-explorer' for explorations,
   *    'rosetta-core' for translations)
   *  - activeSkills = from config
   *  - metrics.toolCalls = number of events
   *  - durationMinutes = time span of events (first to last timestamp)
   */
  toSessionObservation(events: CollegeObservationEvent[]): SessionObservationCompat {
    if (events.length === 0) {
      return {
        sessionId: this.config.sessionId,
        startTime: Date.now(),
        endTime: Date.now(),
        durationMinutes: 0,
        source: 'compact',
        reason: 'other',
        metrics: {
          userMessages: 0,
          assistantMessages: 0,
          toolCalls: 0,
          uniqueFilesRead: 0,
          uniqueFilesWritten: 0,
          uniqueCommandsRun: 0,
        },
        topCommands: [],
        topFiles: [],
        topTools: [],
        activeSkills: [...this.config.activeSkills],
        tier: 'ephemeral',
      };
    }

    const timestamps = events.map((e) => e.timestamp);
    const startTime = Math.min(...timestamps);
    const endTime = Math.max(...timestamps);
    const durationMs = endTime - startTime;
    const durationMinutes = durationMs / 60_000;

    // Collect unique concept paths
    const pathSet = new Set<string>();
    for (const event of events) {
      if (event.path) pathSet.add(event.path);
    }

    // Collect unique tool types
    const toolSet = new Set<string>();
    for (const event of events) {
      if (event.type === 'exploration') toolSet.add('college-explorer');
      if (event.type === 'translation') toolSet.add('rosetta-core');
    }

    return {
      sessionId: this.config.sessionId,
      startTime,
      endTime,
      durationMinutes,
      source: 'compact',
      reason: 'other',
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: events.length,
        uniqueFilesRead: pathSet.size,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: [],
      topFiles: [...pathSet],
      topTools: [...toolSet],
      activeSkills: [...this.config.activeSkills],
      tier: 'ephemeral',
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private nextId(): string {
    this.idCounter += 1;
    return `college-obs-${Date.now()}-${this.idCounter}`;
  }

  private notify(event: CollegeObservationEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
