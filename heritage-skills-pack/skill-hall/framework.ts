/**
 * Skill Hall Framework -- room navigation, Try Session engine, and warden integration hub.
 *
 * This is the user-facing layer of the Heritage Skills Educational Pack. Learners
 * navigate rooms, run Try Sessions with step-by-step safety checks, and experience
 * culturally-appropriate content.
 *
 * The framework integrates the Safety Warden (Plan 01) and Cultural Sovereignty
 * Warden (Plan 02) into every interaction:
 * - Safety Warden is called before each Try Session step
 * - Cultural Sovereignty Warden is called for non-Appalachian tradition content
 * - Level 4 sacred content and REDIRECTED safety evaluations both block progression
 *
 * SUMO browser overlay: getSUMOPath(step) returns the hierarchy path if sumoMapping
 * is present on the step, enabling ontological traceability.
 *
 * @module heritage-skills-pack/skill-hall/framework
 */

import {
  RoomNumber,
  SkillDomain,
  Tradition,
  SafetyDomain,
  SafetyLevel,
  CulturalSovereigntyLevel,
  type TrySession,
  type SessionStep,
} from '../shared/types.js';

import { ROOM_DIRECTORY, TRADITION_TO_ROOMS, type RoomDirectoryEntry } from '../shared/constants.js';
import { SafetyWarden, type SafetyEvaluation, type RoomContext } from '../safety/warden.js';
import { CulturalSovereigntyWarden, type CulturalClassification } from '../safety/cultural-warden.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  SafetyWarden,
  CulturalSovereigntyWarden,
  RoomNumber,
  SkillDomain,
  Tradition,
  SafetyDomain,
  SafetyLevel,
  CulturalSovereigntyLevel,
};

export type { SafetyEvaluation, CulturalClassification, RoomContext };

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Summary of a Try Session for listing within a room.
 */
export interface TrySessionSummary {
  /** Unique session identifier. */
  id: string;
  /** Human-readable session title. */
  title: string;
  /** Cultural tradition this session represents. */
  tradition: Tradition;
  /** Skill difficulty level. */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated completion time in minutes. */
  estimatedMinutes: number;
  /** Safety handling level for this session. */
  safetyLevel: SafetyLevel;
}

/**
 * View of a room for navigation display.
 *
 * Contains all metadata needed to render a room in the Heritage Skills Hall
 * navigation UI, including available Try Sessions filtered for listing.
 */
export interface RoomView {
  /** Numeric room identifier. */
  room: RoomNumber;
  /** Domain string for this room. */
  domain: SkillDomain;
  /** Human-readable room title. */
  title: string;
  /** Description of the room's educational scope. */
  description: string;
  /** Cultural traditions represented in this room. */
  traditions: Tradition[];
  /** Physical safety domains addressed in this room. */
  safetyDomains: SafetyDomain[];
  /** Available Try Sessions for this room. */
  availableSessions: TrySessionSummary[];
  /** Whether this room has critical safety requirements. */
  isCritical: boolean;
}

/**
 * Result of executing a single step in a Try Session.
 *
 * Aggregates safety evaluation from the Safety Warden, cultural classification
 * from the Cultural Sovereignty Warden (for non-Appalachian traditions), and
 * SUMO hierarchy path for the optional ontological browser overlay.
 */
export interface StepResult {
  /** The step that was evaluated. */
  step: SessionStep;
  /** Safety evaluation from the Safety Warden (present when safety domains exist). */
  safetyEvaluation?: SafetyEvaluation;
  /** Cultural classification from the Cultural Sovereignty Warden (non-Appalachian only). */
  culturalClassification?: CulturalClassification;
  /** Whether the learner can proceed past this step. */
  canProceed: boolean;
  /** Aggregated warnings from both wardens. */
  warnings: string[];
  /** Nation attribution for this step, if present. */
  nationAttribution?: string;
  /** SUMO hierarchy path for this step, if sumoMapping is set. */
  sumoPath?: string[];
}

/**
 * Tracks user progress through sessions and rooms.
 *
 * Used by the SkillHallFramework to suggest next difficulty levels and
 * display completion status.
 */
export interface ProgressTracker {
  /** Set of completed session IDs. */
  completedSessions: Set<string>;
  /** Mark a session as completed. */
  markCompleted(sessionId: string): void;
  /** Return all completed session IDs as an array. */
  getCompletedSessions(): string[];
  /** Suggest the next difficulty level for a given room based on completions. */
  suggestNextDifficulty(room: RoomNumber): 'beginner' | 'intermediate' | 'advanced';
}

// ─── Internal Types ───────────────────────────────────────────────────────────

/**
 * Context passed to SessionRunner for room-aware safety evaluation.
 */
export interface RoomRunnerContext {
  /** The room number being navigated. */
  room: RoomNumber;
  /** Safety domains for this room (used in multi-domain evaluation). */
  safetyDomains: SafetyDomain[];
  /** Whether this room has critical safety requirements. */
  isCritical: boolean;
}

// ─── SUMO Hierarchy ───────────────────────────────────────────────────────────

/**
 * Minimal SUMO hierarchy stubs for the browser overlay.
 *
 * A full SUMO hierarchy requires the KIF files from the SUMO knowledge base.
 * This stub provides the generic path for known process classes. In Phase 2,
 * this will be replaced by a proper KIF parser + hierarchy traversal.
 *
 * The path is always from the term up to Entity (SUMO root).
 */
const SUMO_HIERARCHY_STUBS: Record<string, string[]> = {
  // Generic process hierarchy
  'IntentionalProcess': ['IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Making': ['Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Cooking': ['Cooking', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Constructing': ['Constructing', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Weaving': ['Weaving', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Gathering': ['Gathering', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Hunting': ['Hunting', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Fishing': ['Fishing', 'Hunting', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Preserving': ['Preserving', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
  'Carving': ['Carving', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity'],
};

/**
 * Resolve a SUMO term to its hierarchy path.
 * Returns the path if the term is known, otherwise returns a single-element
 * path with the term itself (unknown terms cannot be hierarchically placed
 * without the full KIF file).
 */
function resolveSUMOPath(term: string): string[] {
  return SUMO_HIERARCHY_STUBS[term] ?? [term];
}

// ─── ProgressTrackerImpl ──────────────────────────────────────────────────────

/**
 * Concrete implementation of ProgressTracker.
 *
 * Difficulty suggestion logic:
 * - No completions in the room -> suggest beginner
 * - Has beginner completions but no intermediate -> suggest intermediate
 * - Has intermediate completions -> suggest advanced
 */
class ProgressTrackerImpl implements ProgressTracker {
  completedSessions: Set<string> = new Set();

  /** The session registry is injected by SkillHallFramework for difficulty lookups. */
  private sessionsByRoom: Map<RoomNumber, TrySession[]> = new Map();

  /** Register sessions for a room (called by SkillHallFramework during construction). */
  registerSessions(room: RoomNumber, sessions: TrySession[]): void {
    this.sessionsByRoom.set(room, sessions);
  }

  markCompleted(sessionId: string): void {
    this.completedSessions.add(sessionId);
  }

  getCompletedSessions(): string[] {
    return [...this.completedSessions];
  }

  suggestNextDifficulty(room: RoomNumber): 'beginner' | 'intermediate' | 'advanced' {
    const roomSessions = this.sessionsByRoom.get(room) ?? [];

    // Partition sessions by difficulty
    const beginnerIds = roomSessions
      .filter((s) => s.difficulty === 'beginner')
      .map((s) => s.id);
    const intermediateIds = roomSessions
      .filter((s) => s.difficulty === 'intermediate')
      .map((s) => s.id);

    // Check if any beginner sessions are complete
    const hasBeginnerComplete = beginnerIds.some((id) => this.completedSessions.has(id));

    // Check if any intermediate sessions are complete
    const hasIntermediateComplete = intermediateIds.some((id) =>
      this.completedSessions.has(id),
    );

    if (!hasBeginnerComplete) {
      return 'beginner';
    }

    if (!hasIntermediateComplete) {
      return 'intermediate';
    }

    return 'advanced';
  }
}

// ─── SessionRunner ────────────────────────────────────────────────────────────

/**
 * Executes a Try Session step-by-step with safety and cultural checks.
 *
 * Each call to nextStep():
 * 1. Gets the next step from session.steps (sorted by order)
 * 2. Evaluates the step instruction through the Safety Warden
 * 3. For non-Appalachian traditions, evaluates through the Cultural Sovereignty Warden
 * 4. Builds a StepResult with all evaluations, warnings, and flags
 * 5. Includes nationAttribution from the step if present
 * 6. Includes SUMO path if sumoMapping is present on the step
 * 7. Returns null when all steps are complete
 */
export class SessionRunner {
  private readonly session: TrySession;
  private currentStepIndex: number;
  private readonly sortedSteps: SessionStep[];
  private readonly safetyWarden: SafetyWarden;
  private readonly culturalWarden: CulturalSovereigntyWarden;
  private readonly roomContext: RoomRunnerContext;

  constructor(
    session: TrySession,
    safetyWarden: SafetyWarden,
    culturalWarden: CulturalSovereigntyWarden,
    roomContext: RoomRunnerContext,
  ) {
    this.session = session;
    this.safetyWarden = safetyWarden;
    this.culturalWarden = culturalWarden;
    this.roomContext = roomContext;
    this.currentStepIndex = 0;
    // Sort steps by order field for deterministic execution
    this.sortedSteps = [...session.steps].sort((a, b) => a.order - b.order);
  }

  /**
   * Execute the next step with safety and cultural checks.
   *
   * Returns null when all steps have been executed.
   */
  nextStep(): StepResult | null {
    if (this.currentStepIndex >= this.sortedSteps.length) {
      return null;
    }

    const step = this.sortedSteps[this.currentStepIndex];
    this.currentStepIndex++;

    // Build the content string for warden evaluation
    const contentForEvaluation = [
      step.instruction,
      step.safetyNote,
      step.culturalContext,
    ]
      .filter(Boolean)
      .join(' ');

    // ── Step 1: Safety Warden evaluation ──────────────────────────────────────

    let safetyEvaluation: SafetyEvaluation | undefined;
    let canProceedFromSafety = true;
    const warnings: string[] = [];

    if (this.roomContext.safetyDomains.length > 0) {
      // Use the first (primary) safety domain of the room for step evaluation.
      // The Safety Warden is domain-specific; the primary domain is the most
      // relevant for step-level checks.
      const primaryDomain = this.roomContext.safetyDomains[0];

      const wardenRoomContext: RoomContext = {
        room: this.roomContext.room,
        tradition: this.session.tradition,
        sessionDifficulty: this.session.difficulty,
      };

      safetyEvaluation = this.safetyWarden.evaluate(
        contentForEvaluation,
        primaryDomain,
        this.session.tradition,
      );

      // Collect safety warnings
      for (const annotation of safetyEvaluation.annotations) {
        warnings.push(annotation.message);
      }

      // Safety blocks if: REDIRECTED, GATED, or any CRITICAL annotation
      if (!safetyEvaluation.canProceed) {
        canProceedFromSafety = false;
      }

      // REDIRECTED always blocks (regardless of canProceed flag)
      if (safetyEvaluation.level === SafetyLevel.REDIRECTED) {
        canProceedFromSafety = false;
      }

      // Suppress the unused variable warning from TS strict mode
      void wardenRoomContext;
    }

    // ── Step 2: Cultural Sovereignty Warden evaluation (non-Appalachian) ──────

    let culturalClassification: CulturalClassification | undefined;
    let canProceedFromCultural = true;

    if (this.session.tradition !== Tradition.APPALACHIAN) {
      // Use the room's domain string as the cultural domain key
      const culturalDomain = this.roomContext.room.toString();

      culturalClassification = this.culturalWarden.classify(
        contentForEvaluation,
        this.session.tradition,
        culturalDomain,
      );

      // Cultural Level 4 (SACRED_CEREMONIAL) blocks progression
      if (culturalClassification.level === CulturalSovereigntyLevel.SACRED_CEREMONIAL) {
        canProceedFromCultural = false;
        warnings.push(culturalClassification.explanation);
      }

      // Cultural 'block' action also stops progression
      if (culturalClassification.action === 'block') {
        canProceedFromCultural = false;
        if (!warnings.includes(culturalClassification.explanation)) {
          warnings.push(culturalClassification.explanation);
        }
      }

      // Add cultural explanation as a note for non-blocking levels too
      if (
        culturalClassification.level !== CulturalSovereigntyLevel.PUBLICLY_SHARED &&
        culturalClassification.action !== 'block'
      ) {
        // Level 2 and 3 add informational warnings but don't block
        warnings.push(culturalClassification.explanation);
      }
    }

    // ── Step 3: Build StepResult ───────────────────────────────────────────────

    const canProceed = canProceedFromSafety && canProceedFromCultural;

    // SUMO path from step's sumoMapping
    const sumoPath = step.sumoMapping ? resolveSUMOPath(step.sumoMapping) : undefined;

    const result: StepResult = {
      step,
      canProceed,
      warnings,
    };

    if (safetyEvaluation !== undefined) {
      result.safetyEvaluation = safetyEvaluation;
    }

    if (culturalClassification !== undefined) {
      result.culturalClassification = culturalClassification;
    }

    if (step.nationAttribution !== undefined) {
      result.nationAttribution = step.nationAttribution;
    }

    if (sumoPath !== undefined) {
      result.sumoPath = sumoPath;
    }

    return result;
  }

  /**
   * Return true if all steps in the session have been executed.
   */
  isComplete(): boolean {
    return this.currentStepIndex >= this.sortedSteps.length;
  }

  /**
   * Return the current step number (1-indexed).
   * Returns 0 before any steps have been executed.
   */
  getCurrentStepNumber(): number {
    return this.currentStepIndex;
  }

  /**
   * Return the total number of steps in this session.
   */
  getTotalSteps(): number {
    return this.sortedSteps.length;
  }

  /**
   * Return the SUMO hierarchy path for a given step.
   *
   * Returns undefined if the step has no sumoMapping.
   * This is the entry point for the optional SUMO browser overlay.
   */
  getSUMOPath(step: SessionStep): string[] | undefined {
    return step.sumoMapping ? resolveSUMOPath(step.sumoMapping) : undefined;
  }
}

// ─── SkillHallFramework ───────────────────────────────────────────────────────

/**
 * Main framework class for the Heritage Skills Hall.
 *
 * Provides room navigation, tradition-filtered views, Try Session execution,
 * and progress tracking. Acts as the integration hub that wires the Safety
 * Warden and Cultural Sovereignty Warden into every user-facing interaction.
 *
 * Constructor injection enables full testability: pass mock wardens in tests.
 *
 * @example
 * ```typescript
 * const framework = new SkillHallFramework(new SafetyWarden(), new CulturalSovereigntyWarden());
 * const rooms = framework.getRooms();          // All 14 rooms
 * const room = framework.getRoom(RoomNumber.BUILDING); // One room
 * const runner = framework.startSession(session);       // Run a session
 * const result = runner.nextStep();             // Execute next step
 * ```
 */
export class SkillHallFramework {
  private readonly safetyWarden: SafetyWarden;
  private readonly culturalWarden: CulturalSovereigntyWarden;
  private readonly progress: ProgressTrackerImpl;

  /**
   * Session registry: maps session ID -> session and room number.
   * Populated when sessions are registered via registerSessions().
   */
  private readonly sessionRegistry: Map<string, { session: TrySession; room: RoomNumber }> =
    new Map();

  constructor(safetyWarden: SafetyWarden, culturalWarden: CulturalSovereigntyWarden) {
    this.safetyWarden = safetyWarden;
    this.culturalWarden = culturalWarden;
    this.progress = new ProgressTrackerImpl();
  }

  // ─── Session Registration ────────────────────────────────────────────────────

  /**
   * Register Try Sessions for a room.
   *
   * The framework does not hold SkillModule objects directly -- sessions are
   * registered separately so the framework can be used without loading the
   * full room content graph. This allows lean navigation without pulling in
   * all room content modules and bridges.
   *
   * @param room     - The room number these sessions belong to.
   * @param sessions - The Try Sessions to register.
   */
  registerSessions(room: RoomNumber, sessions: TrySession[]): void {
    for (const session of sessions) {
      this.sessionRegistry.set(session.id, { session, room });
    }
    this.progress.registerSessions(room, sessions);
  }

  // ─── Room Navigation ─────────────────────────────────────────────────────────

  /**
   * Get all 14 rooms as navigation summaries.
   *
   * Returns the complete ROOM_DIRECTORY with registered session summaries
   * attached. Rooms without registered sessions will have empty availableSessions.
   *
   * @returns Array of 14 RoomView objects.
   */
  getRooms(): RoomView[] {
    return ROOM_DIRECTORY.map((entry) => this.buildRoomView(entry));
  }

  /**
   * Get rooms filtered by tradition.
   *
   * Uses TRADITION_TO_ROOMS for the authoritative tradition -> room mapping.
   * Returns only rooms that include content from the specified tradition.
   *
   * @param tradition - The tradition to filter by.
   * @returns Array of RoomView objects for rooms with that tradition's content.
   */
  getRoomsByTradition(tradition: Tradition): RoomView[] {
    const roomNumbers = TRADITION_TO_ROOMS[tradition] ?? [];
    return roomNumbers
      .map((roomNumber) => {
        const entry = ROOM_DIRECTORY.find((e) => e.room === roomNumber);
        return entry ? this.buildRoomView(entry) : undefined;
      })
      .filter((view): view is RoomView => view !== undefined);
  }

  /**
   * Get a specific room with full detail.
   *
   * @param room - The room number to retrieve.
   * @returns RoomView for the requested room, or undefined if not found.
   */
  getRoom(room: RoomNumber): RoomView | undefined {
    const entry = ROOM_DIRECTORY.find((e) => e.room === room);
    if (!entry) return undefined;
    return this.buildRoomView(entry);
  }

  // ─── Session Execution ───────────────────────────────────────────────────────

  /**
   * Start a Try Session, returning a step runner.
   *
   * The runner executes steps one at a time with safety and cultural checks.
   * The room context is resolved from the session registry if the session is
   * registered; otherwise falls back to a generic context.
   *
   * @param session - The TrySession to run.
   * @returns SessionRunner for step-by-step execution.
   */
  startSession(session: TrySession): SessionRunner {
    // Look up room context from registry if available
    const registered = this.sessionRegistry.get(session.id);
    let roomContext: RoomRunnerContext;

    if (registered) {
      const entry = ROOM_DIRECTORY.find((e) => e.room === registered.room);
      roomContext = {
        room: registered.room,
        safetyDomains: entry ? [...entry.safetyDomains] : [],
        isCritical: entry?.isCritical ?? false,
      };
    } else {
      // Unregistered session: use a generic context with no safety domains
      roomContext = {
        room: RoomNumber.COMMUNITY, // Default room (no critical safety domains)
        safetyDomains: [],
        isCritical: false,
      };
    }

    return new SessionRunner(session, this.safetyWarden, this.culturalWarden, roomContext);
  }

  /**
   * Get the progress tracker for this framework instance.
   *
   * @returns The ProgressTracker instance.
   */
  getProgress(): ProgressTracker {
    return this.progress;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Build a RoomView from a RoomDirectoryEntry.
   *
   * Attaches available session summaries from the session registry.
   * The description field uses the room title as a fallback since
   * RoomDirectoryEntry does not carry a description (SkillModule does).
   */
  private buildRoomView(entry: RoomDirectoryEntry): RoomView {
    // Collect sessions registered for this room
    const roomSessions: TrySessionSummary[] = [];
    for (const { session, room } of this.sessionRegistry.values()) {
      if (room === entry.room) {
        roomSessions.push({
          id: session.id,
          title: session.title,
          tradition: session.tradition,
          difficulty: session.difficulty,
          estimatedMinutes: session.estimatedMinutes,
          safetyLevel: session.safetyLevel,
        });
      }
    }

    return {
      room: entry.room,
      domain: entry.domain,
      title: entry.title,
      // RoomDirectoryEntry has no description field; use the title as the
      // base description. Full descriptions live in SkillModule (room-spec.json).
      description: `${entry.title} -- Heritage Skills Room ${entry.room}`,
      traditions: [...entry.traditions],
      safetyDomains: [...entry.safetyDomains],
      availableSessions: roomSessions,
      isCritical: entry.isCritical,
    };
  }
}
