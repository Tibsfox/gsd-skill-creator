/**
 * Prioritized round-robin scheduler for the exec kernel.
 *
 * Orders team execution by priority (higher runs first), applies round-robin
 * fairness within equal-priority groups, and suspends sleeping teams until
 * woken. Modeled after the Amiga exec task scheduler where higher-priority
 * tasks preempt lower-priority ones and equal-priority tasks share time.
 *
 * Key behaviors:
 * - schedule() returns an ordered list of team names for the current round
 * - Each call to schedule() auto-rotates the round-robin offset per priority group
 * - sleep()/wake() transition teams between 'sleeping' and 'ready' states
 * - yield() advances the round-robin offset for the team's priority group
 * - add()/remove() support dynamic team membership without corrupting state
 */

// ============================================================================
// Types
// ============================================================================

/** Team scheduling states. */
export type TeamState = 'ready' | 'running' | 'sleeping' | 'removed';

/** A scheduler entry tracking a registered team. */
export interface SchedulerEntry {
  /** Team name. */
  name: string;
  /** Scheduling priority (higher = runs first). */
  priority: number;
  /** Current scheduling state. */
  state: TeamState;
}

// ============================================================================
// ExecScheduler
// ============================================================================

/**
 * Prioritized round-robin scheduler.
 *
 * Maintains a registry of teams with priorities and states. The schedule()
 * method returns an ordered list of ready team names: highest priority first,
 * with round-robin rotation within each priority group.
 */
export class ExecScheduler {
  /** All registered teams keyed by name. */
  private _entries: Map<string, SchedulerEntry> = new Map();

  /**
   * Ordered list of team names per priority level.
   * Maintains insertion order for deterministic round-robin.
   */
  private _priorityGroups: Map<number, string[]> = new Map();

  /**
   * Round-robin rotation offset per priority level.
   * Advances each time schedule() produces a multi-team group.
   */
  private _rotationOffset: Map<number, number> = new Map();

  // --------------------------------------------------------------------------
  // add / remove
  // --------------------------------------------------------------------------

  /**
   * Register a team with the given priority.
   *
   * @param name - Unique team name
   * @param priority - Scheduling priority (higher = runs first)
   * @throws Error if a team with the same name is already registered
   */
  add(name: string, priority: number): void {
    if (this._entries.has(name)) {
      throw new Error(`Team '${name}' is already registered`);
    }

    const entry: SchedulerEntry = { name, priority, state: 'ready' };
    this._entries.set(name, entry);

    // Add to priority group (maintains insertion order)
    let group = this._priorityGroups.get(priority);
    if (!group) {
      group = [];
      this._priorityGroups.set(priority, group);
      this._rotationOffset.set(priority, 0);
    }
    group.push(name);
  }

  /**
   * Remove a team from the scheduler.
   *
   * @param name - Team name to remove
   * @throws Error if the team is not registered
   */
  remove(name: string): void {
    const entry = this._entries.get(name);
    if (!entry) {
      throw new Error(`Team '${name}' is not registered`);
    }

    this._entries.delete(name);

    // Remove from priority group
    const group = this._priorityGroups.get(entry.priority);
    if (group) {
      const idx = group.indexOf(name);
      if (idx !== -1) {
        group.splice(idx, 1);
      }
      // Clean up empty groups
      if (group.length === 0) {
        this._priorityGroups.delete(entry.priority);
        this._rotationOffset.delete(entry.priority);
      } else {
        // Adjust rotation offset if it exceeds group size
        const offset = this._rotationOffset.get(entry.priority) ?? 0;
        if (offset >= group.length) {
          this._rotationOffset.set(entry.priority, offset % group.length);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // sleep / wake
  // --------------------------------------------------------------------------

  /**
   * Put a team to sleep. Sleeping teams are excluded from schedule().
   * Idempotent: sleeping an already-sleeping team is a no-op.
   *
   * @param name - Team name to sleep
   * @throws Error if the team is not registered
   */
  sleep(name: string): void {
    const entry = this._entries.get(name);
    if (!entry) {
      throw new Error(`Team '${name}' is not registered`);
    }
    if (entry.state === 'sleeping') {
      return; // idempotent
    }
    entry.state = 'sleeping';
  }

  /**
   * Wake a sleeping team, returning it to the ready state.
   * Idempotent: waking an already-ready team is a no-op.
   *
   * @param name - Team name to wake
   * @throws Error if the team is not registered
   */
  wake(name: string): void {
    const entry = this._entries.get(name);
    if (!entry) {
      throw new Error(`Team '${name}' is not registered`);
    }
    if (entry.state === 'ready') {
      return; // idempotent
    }
    entry.state = 'ready';
  }

  // --------------------------------------------------------------------------
  // yield
  // --------------------------------------------------------------------------

  /**
   * Yield the team's time slice, advancing the round-robin offset for
   * its priority group. Effectively moves the team to the end of its
   * priority group's rotation.
   *
   * @param name - Team name that yields
   * @throws Error if the team is not registered
   */
  yield(name: string): void {
    const entry = this._entries.get(name);
    if (!entry) {
      throw new Error(`Team '${name}' is not registered`);
    }

    const group = this._priorityGroups.get(entry.priority);
    if (!group || group.length <= 1) {
      return; // no-op for solo groups
    }

    // Filter to ready teams only (same as schedule())
    const ready = group.filter((n) => {
      const e = this._entries.get(n);
      return e !== undefined && e.state === 'ready';
    });
    if (ready.length <= 1) {
      return; // no-op if only one ready team in group
    }

    // Find where this team sits in the group array
    const groupIdx = group.indexOf(name);
    // Set rotation offset to the position AFTER this team in the group,
    // so the next team in the group becomes the leader
    this._rotationOffset.set(entry.priority, (groupIdx + 1) % group.length);
  }

  // --------------------------------------------------------------------------
  // schedule
  // --------------------------------------------------------------------------

  /**
   * Produce an ordered list of team names for this scheduling round.
   *
   * Teams are ordered by descending priority. Within each priority group,
   * ready teams are rotated round-robin (the rotation advances automatically
   * on each call for groups with more than one ready team).
   *
   * Sleeping teams are excluded from the output. An empty scheduler or
   * all-sleeping scheduler returns an empty array.
   *
   * @returns Ordered array of ready team names
   */
  schedule(): string[] {
    // Collect distinct priority levels in descending order
    const priorities = Array.from(this._priorityGroups.keys()).sort((a, b) => b - a);

    const result: string[] = [];

    for (const priority of priorities) {
      const group = this._priorityGroups.get(priority)!;
      const offset = this._rotationOffset.get(priority) ?? 0;

      // Filter to ready teams only, maintaining group order
      const ready = group.filter((name) => {
        const entry = this._entries.get(name);
        return entry !== undefined && entry.state === 'ready';
      });

      if (ready.length === 0) {
        continue;
      }

      // Apply round-robin rotation
      const effectiveOffset = offset % ready.length;
      const rotated = [
        ...ready.slice(effectiveOffset),
        ...ready.slice(0, effectiveOffset),
      ];

      result.push(...rotated);

      // Auto-advance rotation for groups with >1 ready team
      if (ready.length > 1) {
        this._rotationOffset.set(priority, (offset + 1) % group.length);
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // introspection
  // --------------------------------------------------------------------------

  /**
   * Get the current state of a registered team.
   *
   * @param name - Team name
   * @returns The team's current state
   * @throws Error if the team is not registered
   */
  getState(name: string): TeamState {
    const entry = this._entries.get(name);
    if (!entry) {
      throw new Error(`Team '${name}' is not registered`);
    }
    return entry.state;
  }

  /**
   * Return copies of all scheduler entries.
   *
   * @returns Array of SchedulerEntry objects (copies, not references)
   */
  entries(): SchedulerEntry[] {
    return Array.from(this._entries.values()).map((entry) => ({
      name: entry.name,
      priority: entry.priority,
      state: entry.state,
    }));
  }
}
