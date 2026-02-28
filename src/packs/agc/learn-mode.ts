/**
 * AGC Block II Learn Mode -- annotation system for educational visualization.
 *
 * Every monitored AGC concept gets an annotation explaining:
 * 1. What it is in the AGC (historical context)
 * 2. What it maps to in modern computing (contemporary relevance)
 * 3. What it maps to in GSD (project management parallel)
 *
 * Annotations are data objects consumed by the desktop visualization layer
 * (Phase 222). Learn mode can be toggled on/off. When off, annotation
 * functions return empty arrays (zero overhead).
 *
 * Phase 218, Plan 03.
 */

import type { MonitorSnapshot } from './executive-monitor.js';
import type { ScenarioEvent } from './alarm-scenario.js';

// ─── Types ───────────────────────────────────────────────────────────────

/** Category classifying the AGC subsystem an annotation belongs to. */
export type AnnotationCategory = 'SCHEDULING' | 'MEMORY' | 'TIMING' | 'FAILSAFE' | 'IO';

/** Modern computing equivalent for an AGC concept. */
interface ModernEquivalent {
  readonly concept: string;
  readonly description: string;
}

/** GSD workflow mapping for an AGC concept. */
interface GsdMapping {
  readonly concept: string;
  readonly description: string;
}

/** A complete annotation for a single AGC concept. */
export interface LearnAnnotation {
  readonly id: string;
  readonly category: AnnotationCategory;
  readonly title: string;
  readonly agcDescription: string;
  readonly modernEquivalent: ModernEquivalent;
  readonly gsdMapping: GsdMapping;
  readonly relatedAnnotations: readonly string[];
}

/** Learn mode toggle state. */
export interface LearnModeState {
  readonly enabled: boolean;
}

// ─── Annotation Registry ─────────────────────────────────────────────────

const annotations: LearnAnnotation[] = [
  {
    id: 'core-set',
    category: 'SCHEDULING',
    title: 'Core Set',
    agcDescription: 'The AGC has 8 fixed core sets (numbered 0-7), each storing the complete execution context for one job: registers, return address, bank selectors, and VAC area pointer. Core set 0 is permanently reserved for the idle job. When a job is created via NOVAC or FINDVAC, it occupies one core set until it completes or is discarded by BAILOUT.',
    modernEquivalent: {
      concept: 'Thread/Process Slot',
      description: 'Like a fixed-size thread pool with 8 slots. Each slot holds a complete thread context (registers, stack pointer, program counter). Unlike modern systems with dynamic thread creation, the AGC has a hard limit -- when all 8 are occupied, the 1202 alarm fires.',
    },
    gsdMapping: {
      concept: 'Parallel Plan Slot',
      description: 'Each GSD plan executes in its own context window, analogous to a core set. The context window holds the plan state, accumulated work, and execution position. Like core sets, there is a practical limit to concurrent plans before quality degrades.',
    },
    relatedAnnotations: ['executive', 'context-switch', 'vac-area'],
  },
  {
    id: 'executive',
    category: 'SCHEDULING',
    title: 'Executive Scheduler',
    agcDescription: 'The Executive is the AGC operating system kernel -- a cooperative priority-based job scheduler. It manages all computational tasks through the 8 core sets, selecting the highest-priority RUNNABLE job to execute next. Priority 0 is highest (guidance), priority 7 is lowest (display updates). The Executive never preempts a running job mid-instruction; instead, jobs voluntarily yield.',
    modernEquivalent: {
      concept: 'OS Process Scheduler',
      description: 'Like Linux CFS or Windows thread scheduler, the Executive decides which computation gets CPU time. However, the AGC uses cooperative scheduling (jobs yield voluntarily) rather than preemptive scheduling (OS forcibly switches). This makes the AGC more predictable but vulnerable to misbehaving jobs.',
    },
    gsdMapping: {
      concept: 'GSD Orchestrator',
      description: 'The orchestrator routes work to executor agents based on wave ordering and dependency chains, much like the Executive routes CPU time to jobs based on priority. Wave 1 plans execute before wave 2, just as priority 1 jobs execute before priority 5.',
    },
    relatedAnnotations: ['core-set', 'priority-level', 'waitlist'],
  },
  {
    id: 'waitlist',
    category: 'TIMING',
    title: 'Waitlist Timer Queue',
    agcDescription: 'The Waitlist is a 9-entry timer-driven task scheduler. Tasks are registered with a delay (in centiseconds) and dispatched when the delay expires via the T3RUPT interrupt. Waitlist tasks are short-lived (under 5ms) and typically spawn Executive jobs for longer work. The Waitlist is the AGC equivalent of setTimeout.',
    modernEquivalent: {
      concept: 'Timer Queue / setTimeout',
      description: 'Like JavaScript event loop timer queue or libuv timers. Tasks are scheduled for future execution at a specific time. The 9-entry limit is analogous to modern systems where too many pending timers degrade performance.',
    },
    gsdMapping: {
      concept: 'Event Queue / Deferred Tasks',
      description: 'GSD defers non-critical work to avoid context bloat, similar to how the Waitlist defers tasks to future time slots. Checkpoint callbacks and verification steps are scheduled for later rather than blocking the current execution flow.',
    },
    relatedAnnotations: ['executive', 'counter-timer', 'interrupt'],
  },
  {
    id: 'bailout',
    category: 'FAILSAFE',
    title: 'BAILOUT Restart Protection',
    agcDescription: 'BAILOUT is the AGC graceful degradation mechanism -- the reason Apollo 11 landed safely despite 1202 alarms. When the Executive runs out of resources, BAILOUT classifies all jobs by restart group, preserves CRITICAL jobs (guidance, navigation), optionally preserves IMPORTANT jobs, and discards DEFERRABLE jobs (display updates, telemetry). The Waitlist is cleared entirely.',
    modernEquivalent: {
      concept: 'Watchdog / OOM Killer',
      description: 'Like Linux OOM killer sacrificing low-priority processes to keep the system alive, or a watchdog timer triggering a controlled restart. BAILOUT selectively kills work based on criticality classification rather than indiscriminately crashing.',
    },
    gsdMapping: {
      concept: 'Session Recovery',
      description: 'When a GSD session hits context limits (the quality degradation curve), it preserves STATE.md (critical state), discards stale conversation context (deferrable), and restarts from the last checkpoint. The BAILOUT pattern is exactly how GSD handles context window exhaustion.',
    },
    relatedAnnotations: ['restart-group', 'alarm-1202', 'executive'],
  },
  {
    id: 'priority-level',
    category: 'SCHEDULING',
    title: 'Priority Level (0-7)',
    agcDescription: 'AGC job priority ranges from 0 (highest) to 7 (lowest). Priority 0 is reserved for critical guidance computations, priority 7 for the idle loop. The Executive always selects the lowest-numbered priority (highest importance) among RUNNABLE jobs. Ties are broken by lowest core set number for determinism.',
    modernEquivalent: {
      concept: 'Thread Priority / Nice Value',
      description: 'Like Unix nice values (lower = higher priority) or Windows thread priority levels. Determines which computation gets CPU time when multiple are ready. The AGC inverted convention (0 = highest) matches nice values.',
    },
    gsdMapping: {
      concept: 'Wave Ordering',
      description: 'GSD wave numbers determine execution order: wave 1 runs before wave 2, wave 2 before wave 3. Within waves, dependency order controls sequencing. Lower wave numbers handle foundation work, higher waves handle dependent features -- mirroring AGC priority levels.',
    },
    relatedAnnotations: ['executive', 'core-set', 'job-state'],
  },
  {
    id: 'interrupt',
    category: 'IO',
    title: 'Hardware Interrupt',
    agcDescription: 'The AGC has 10 priority-ordered hardware interrupt vectors (BOOT, T6RUPT, T5RUPT, T3RUPT, T4RUPT, KEYRUPT1, KEYRUPT2, UPRUPT, DOWNRUPT, RADARRUPT). Interrupts preempt the current job by saving Z and BB registers, jumping to the vector address, and restoring state on RESUME. INHINT/RELINT control interrupt inhibition.',
    modernEquivalent: {
      concept: 'Hardware Interrupt / Signal',
      description: 'Like CPU interrupts (IRQ, NMI) or Unix signals (SIGINT, SIGTERM, SIGALRM). Hardware events trigger immediate attention from the processor, suspending current work. The AGC INHINT instruction is analogous to signal masking (sigprocmask).',
    },
    gsdMapping: {
      concept: 'Checkpoint / Gate',
      description: 'GSD checkpoints pause execution for human input, verification, or decision-making -- analogous to hardware interrupts pausing the CPU for external events. Just as INHINT temporarily blocks interrupts during critical sections, GSD autonomous mode can bypass certain checkpoints.',
    },
    relatedAnnotations: ['executive', 'counter-timer', 'waitlist'],
  },
  {
    id: 'job-state',
    category: 'SCHEDULING',
    title: 'Job State Machine',
    agcDescription: 'AGC jobs transition through 5 states: FREE (core set available), DORMANT (created but not yet activated), RUNNABLE (ready for scheduling), RUNNING (currently executing), SLEEPING (waiting for an event). The Executive scheduler only considers RUNNABLE jobs. BAILOUT forces preserved jobs back to RUNNABLE.',
    modernEquivalent: {
      concept: 'Process State',
      description: 'Like the classic process state diagram: new/ready/running/waiting/terminated. FREE maps to terminated, DORMANT to new, RUNNABLE to ready, RUNNING to running, SLEEPING to waiting. The AGC state machine is simpler than modern OS process states but follows the same fundamental pattern.',
    },
    gsdMapping: {
      concept: 'Plan Status',
      description: 'GSD plans transition through not-started (FREE), in-progress (RUNNING), blocked/waiting (SLEEPING), and complete. The DORMANT state maps to plans that are defined but not yet in their execution wave. BAILOUT forcing RUNNABLE is like GSD recovery restarting blocked plans.',
    },
    relatedAnnotations: ['executive', 'core-set', 'priority-level'],
  },
  {
    id: 'restart-group',
    category: 'FAILSAFE',
    title: 'Restart Group Classification',
    agcDescription: 'Every registered job is classified into one of three restart groups: CRITICAL (always preserved during BAILOUT -- guidance, navigation), IMPORTANT (preserved if fewer than 4 core sets used by CRITICAL -- attitude control, flight dynamics), DEFERRABLE (always discarded -- display updates, telemetry, background tasks). Jobs without a registered restart point are treated as DEFERRABLE.',
    modernEquivalent: {
      concept: 'Process Priority Class',
      description: 'Like systemd service priorities (Type=notify for critical services, Type=simple for deferrable) or Kubernetes pod priority classes. Determines which processes survive resource pressure. CRITICAL services get OOM score adjustment to avoid the OOM killer.',
    },
    gsdMapping: {
      concept: 'Must-Have Truths',
      description: 'GSD must_haves define what is critical (truths = non-negotiable correctness requirements), important (artifacts = required deliverables), and nice-to-have (deferrable enhancements). During scope pressure, truths are preserved first, exactly like BAILOUT preserves CRITICAL jobs.',
    },
    relatedAnnotations: ['bailout', 'alarm-1202', 'executive'],
  },
  {
    id: 'counter-timer',
    category: 'TIMING',
    title: 'Involuntary Counter',
    agcDescription: 'The AGC has 9 involuntary counters: TIME1-TIME6 (hardware clock-driven) and CDUX/Y/Z (IMU-driven). TIME1-TIME5 increment every ~10ms, TIME6 at ~312.5us (digital autopilot). TIME1 overflow cascades to TIME2, forming a 30-bit timer pair. Counter overflow triggers associated interrupts (T3RUPT through T6RUPT).',
    modernEquivalent: {
      concept: 'Hardware Performance Counter / RDTSC',
      description: 'Like CPU cycle counters (RDTSC), hardware performance counters (perf_event), or system timers (HPET, PIT). These are hardware-driven counters that increment independently of software. The TIME1/TIME2 cascade is analogous to a 64-bit timestamp counter built from two 32-bit halves.',
    },
    gsdMapping: {
      concept: 'Execution Time Tracking',
      description: 'GSD tracks context usage percentage and execution duration per plan, similar to how AGC counters track elapsed time. When context usage crosses thresholds (70%, 90%), quality degrades -- just as TIME3 overflow triggers T3RUPT to dispatch pending work.',
    },
    relatedAnnotations: ['interrupt', 'waitlist', 'executive'],
  },
  {
    id: 'vac-area',
    category: 'MEMORY',
    title: 'VAC Area',
    agcDescription: 'A VAC (Vector Accumulator) area is a 44-word block of erasable memory allocated via FINDVAC for jobs needing sustained workspace beyond the core set registers. The AGC has 5 VAC areas. Jobs created with NOVAC (no VAC) are lightweight; FINDVAC jobs get extended workspace. VAC exhaustion triggers alarm 1201.',
    modernEquivalent: {
      concept: 'Thread Stack / Heap Allocation',
      description: 'Like per-thread stack allocation or heap workspace per process. NOVAC jobs are like green threads (minimal state), while FINDVAC jobs are like OS threads (full stack). The 5 VAC area limit is analogous to stack size limits or memory quotas.',
    },
    gsdMapping: {
      concept: 'Context Window Allocation',
      description: 'Each GSD executor agent gets its own context window, analogous to a VAC area. Lightweight plans (like NOVAC jobs) need minimal context, while complex plans (like FINDVAC jobs) need larger allocations. Context exhaustion is the GSD equivalent of VAC overflow.',
    },
    relatedAnnotations: ['core-set', 'executive', 'alarm-1202'],
  },
  {
    id: 'context-switch',
    category: 'SCHEDULING',
    title: 'Context Switch',
    agcDescription: 'When the Executive switches from one job to another, it saves the current job registers into its core set and restores the next job registers from the target core set. This includes the accumulator (A), return address (Q), program counter (Z), and bank selectors (EBANK, FBANK). The switch is deterministic and takes a fixed number of MCTs.',
    modernEquivalent: {
      concept: 'OS Context Switch',
      description: 'Like an OS context switch saving and restoring CPU registers, TLB entries, and stack pointers. The AGC version is simpler (fewer registers, no virtual memory) but follows the same save/restore pattern. Cost is deterministic rather than variable.',
    },
    gsdMapping: {
      concept: '/clear and Session Handoff',
      description: 'GSD /clear discards stale conversation context and starts fresh, while STATE.md preserves the essential state across context boundaries. This is a manual context switch: save critical state to disk (core set), clear the processor (context window), load the next task state.',
    },
    relatedAnnotations: ['core-set', 'executive', 'job-state'],
  },
  {
    id: 'alarm-1202',
    category: 'FAILSAFE',
    title: '1202 Alarm (Executive Overflow)',
    agcDescription: 'Alarm 1202 fires when all 7 available core sets (1-7) are occupied and a new job is requested via NOVAC. This means the Executive has no room for new work. During Apollo 11 lunar descent, rendezvous radar tasks filled all slots, triggering repeated 1202 alarms. The response is BAILOUT: discard low-priority work and recover.',
    modernEquivalent: {
      concept: 'Resource Exhaustion',
      description: 'Like running out of threads (pthread_create failing with EAGAIN), file descriptors (EMFILE), or memory (ENOMEM). The system has hit a hard resource limit. Modern systems typically crash or OOM-kill; the AGC gracefully degrades via BAILOUT.',
    },
    gsdMapping: {
      concept: 'Context Window Full',
      description: 'When a GSD context window fills beyond 70%, the quality degradation curve accelerates. At 100%, no new work can start -- analogous to the 1202 alarm. The response parallels BAILOUT: preserve STATE.md and critical artifacts, discard stale context, restart with a fresh window.',
    },
    relatedAnnotations: ['bailout', 'restart-group', 'core-set'],
  },
];

/** Read-only map of all annotations indexed by ID. */
export const ALL_ANNOTATIONS: ReadonlyMap<string, LearnAnnotation> = new Map(
  annotations.map(a => [a.id, a]),
);

// ─── Public API ──────────────────────────────────────────────────────────

/** Create the initial learn mode state (disabled by default). */
export function createLearnModeState(): LearnModeState {
  return { enabled: false };
}

/** Toggle learn mode on/off. */
export function toggleLearnMode(state: LearnModeState): LearnModeState {
  return { enabled: !state.enabled };
}

/** Look up a single annotation by ID. Returns null if not found. */
export function getAnnotation(id: string): LearnAnnotation | null {
  return ALL_ANNOTATIONS.get(id) ?? null;
}

/**
 * Get annotations relevant to the current monitor snapshot state.
 *
 * Contextually filters based on what is visible in the snapshot:
 * - Always includes: executive, core-set (fundamental to any monitor view)
 * - Active waitlist entries: waitlist
 * - Pending interrupts: interrupt
 * - Sleeping jobs: job-state
 * - BAILOUT history: bailout, restart-group, alarm-1202
 * - High-priority jobs (priority <= 2): priority-level
 */
export function getAnnotationsForSnapshot(
  state: LearnModeState,
  snapshot: MonitorSnapshot,
): readonly LearnAnnotation[] {
  if (!state.enabled) return [];

  const ids = new Set<string>(['executive', 'core-set']);

  // Active waitlist entries
  if (snapshot.waitlistEntries.length > 0) {
    ids.add('waitlist');
  }

  // Pending interrupts
  if (snapshot.interrupts.pendingList.length > 0) {
    ids.add('interrupt');
  }

  // Sleeping jobs
  if (snapshot.coreSets.some(cs => cs.state === 'SLEEPING')) {
    ids.add('job-state');
  }

  // BAILOUT history
  if (snapshot.restart.bailoutCount > 0) {
    ids.add('bailout');
    ids.add('restart-group');
    ids.add('alarm-1202');
  }

  // High-priority jobs (priority <= 2)
  if (snapshot.coreSets.some(cs => cs.state !== 'FREE' && cs.coreSetId !== 0 && cs.priority <= 2)) {
    ids.add('priority-level');
  }

  const result: LearnAnnotation[] = [];
  ids.forEach(id => {
    const ann = ALL_ANNOTATIONS.get(id);
    if (ann) result.push(ann);
  });
  return result;
}

/**
 * Get annotations relevant to a specific scenario event.
 *
 * Maps each event type to the AGC concepts it demonstrates:
 * - JOB_CREATED: core-set, executive, priority-level
 * - JOB_SCHEDULED: executive, priority-level
 * - OVERLOAD_DETECTED: alarm-1202, core-set
 * - BAILOUT_TRIGGERED: bailout, restart-group
 * - JOB_PRESERVED: restart-group, priority-level
 * - JOB_DISCARDED: bailout, restart-group
 * - RECOVERY_COMPLETE: executive, bailout
 * - PREEMPTION: priority-level, executive
 */
export function annotateScenarioEvent(
  state: LearnModeState,
  event: ScenarioEvent,
): readonly LearnAnnotation[] {
  if (!state.enabled) return [];

  let ids: string[];

  switch (event.type) {
    case 'JOB_CREATED':
      ids = ['core-set', 'executive', 'priority-level'];
      break;
    case 'JOB_SCHEDULED':
      ids = ['executive', 'priority-level'];
      break;
    case 'OVERLOAD_DETECTED':
      ids = ['alarm-1202', 'core-set'];
      break;
    case 'BAILOUT_TRIGGERED':
      ids = ['bailout', 'restart-group'];
      break;
    case 'JOB_PRESERVED':
      ids = ['restart-group', 'priority-level'];
      break;
    case 'JOB_DISCARDED':
      ids = ['bailout', 'restart-group'];
      break;
    case 'RECOVERY_COMPLETE':
      ids = ['executive', 'bailout'];
      break;
    case 'PREEMPTION':
      ids = ['priority-level', 'executive'];
      break;
    default:
      ids = [];
  }

  const result: LearnAnnotation[] = [];
  for (const id of ids) {
    const ann = ALL_ANNOTATIONS.get(id);
    if (ann) result.push(ann);
  }
  return result;
}
