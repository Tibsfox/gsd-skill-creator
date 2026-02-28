/**
 * AGC Curriculum type definitions.
 *
 * Metadata schemas for chapters, exercises, and starter programs.
 * Constant arrays serve as the curriculum's table of contents,
 * listing all 11 chapters, 8 exercises, and 8 programs.
 *
 * Phase 221 -- AGC Curriculum & Exercises.
 */

// ─── Chapter Metadata ────────────────────────────────────────────────────────

/** Chapter metadata embedded in markdown frontmatter. */
export interface ChapterMeta {
  readonly chapter: number;
  readonly title: string;
  readonly slug: string;
  readonly prerequisites: readonly string[];
  readonly learningObjectives: readonly string[];
  readonly estimatedMinutes: number;
  readonly archiveRefs: readonly string[];
  readonly conceptRefs: readonly string[];
}

// ─── Exercise Metadata ───────────────────────────────────────────────────────

/** Exercise metadata. */
export interface ExerciseMeta {
  readonly exercise: number;
  readonly title: string;
  readonly slug: string;
  readonly chapter: number;
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly programSlug: string;
  readonly description: string;
}

// ─── Program Metadata ────────────────────────────────────────────────────────

/** Starter program metadata. */
export interface ProgramMeta {
  readonly program: number;
  readonly title: string;
  readonly slug: string;
  readonly sourceFile: string;
  readonly description: string;
  readonly expectedBehavior: string;
}

// ─── Curriculum Index ────────────────────────────────────────────────────────

/** Complete curriculum index. */
export interface CurriculumIndex {
  readonly chapters: readonly ChapterMeta[];
  readonly exercises: readonly ExerciseMeta[];
  readonly programs: readonly ProgramMeta[];
}

// ─── Constant Arrays ─────────────────────────────────────────────────────────

/** All 11 curriculum chapters. */
export const CHAPTERS: readonly ChapterMeta[] = [
  {
    chapter: 1,
    title: 'Orientation: Meet the AGC',
    slug: 'orientation',
    prerequisites: [],
    learningObjectives: [
      'Understand the AGC\'s role in Apollo missions',
      'Know the key specifications (word size, memory, speed)',
      'Map AGC concepts to modern computing equivalents',
    ],
    estimatedMinutes: 15,
    archiveRefs: ['agc-arch-001', 'agc-arch-002'],
    conceptRefs: ['agc-concept-01', 'agc-concept-05'],
  },
  {
    chapter: 2,
    title: 'Hardware: A Computer from Wire and Core',
    slug: 'hardware',
    prerequisites: ['orientation'],
    learningObjectives: [
      'Describe core rope memory and erasable core memory',
      'Explain bank switching and why it was necessary',
      'Understand the physical construction of the AGC',
    ],
    estimatedMinutes: 25,
    archiveRefs: ['agc-arch-002', 'agc-arch-004', 'agc-arch-005', 'agc-eng-001'],
    conceptRefs: ['agc-concept-07', 'agc-concept-09'],
  },
  {
    chapter: 3,
    title: 'Instruction Set: The AGC\'s Vocabulary',
    slug: 'isa',
    prerequisites: ['hardware'],
    learningObjectives: [
      'Read and understand AGC instruction encoding',
      'Know the 15 basic and 18 extracode instructions',
      'Understand ones\' complement arithmetic',
    ],
    estimatedMinutes: 30,
    archiveRefs: ['agc-soft-001', 'agc-soft-002', 'agc-arch-005'],
    conceptRefs: ['agc-concept-08'],
  },
  {
    chapter: 4,
    title: 'Assembly: Writing AGC Programs',
    slug: 'assembly',
    prerequisites: ['isa'],
    learningObjectives: [
      'Write simple AGC assembly programs',
      'Use labels, directives, and addressing modes',
      'Assemble and run a program on the simulator',
    ],
    estimatedMinutes: 30,
    archiveRefs: ['agc-soft-002', 'agc-soft-003'],
    conceptRefs: [],
  },
  {
    chapter: 5,
    title: 'Executive & Waitlist: The AGC Operating System',
    slug: 'executive-waitlist',
    prerequisites: ['assembly'],
    learningObjectives: [
      'Understand priority-based cooperative scheduling',
      'Know how the Waitlist handles timed tasks',
      'Trace job creation, scheduling, and termination',
    ],
    estimatedMinutes: 35,
    archiveRefs: ['agc-soft-001', 'agc-soft-006', 'agc-soft-008'],
    conceptRefs: ['agc-concept-01', 'agc-concept-02', 'agc-concept-03'],
  },
  {
    chapter: 6,
    title: 'DSKY: The Astronaut\'s Interface',
    slug: 'dsky',
    prerequisites: ['executive-waitlist'],
    learningObjectives: [
      'Understand the DSKY display and keyboard layout',
      'Know the VERB/NOUN command grammar',
      'Write programs that display data on the DSKY',
    ],
    estimatedMinutes: 25,
    archiveRefs: ['agc-arch-003', 'agc-iface-001', 'agc-iface-002'],
    conceptRefs: ['agc-concept-05', 'agc-concept-06'],
  },
  {
    chapter: 7,
    title: 'Interpreter: Double-Precision on Single-Precision Hardware',
    slug: 'interpreter',
    prerequisites: ['dsky'],
    learningObjectives: [
      'Understand why double-precision was needed for navigation',
      'Know how the Interpreter extends the 15-bit AGC to 28-bit precision',
      'Trace an Interpreter instruction through the virtual machine',
    ],
    estimatedMinutes: 30,
    archiveRefs: ['agc-soft-004', 'agc-soft-005', 'agc-soft-008'],
    conceptRefs: ['agc-concept-11', 'agc-concept-08'],
  },
  {
    chapter: 8,
    title: 'Guidance: Navigating to the Moon',
    slug: 'guidance',
    prerequisites: ['interpreter'],
    learningObjectives: [
      'Understand the guidance equation (acceleration = desired - actual)',
      'Know the AGC programs that fly the lunar descent (P63, P64, P66)',
      'Appreciate the real-time constraints of landing guidance',
    ],
    estimatedMinutes: 30,
    archiveRefs: ['agc-soft-008', 'agc-soft-009', 'agc-ops-001'],
    conceptRefs: ['agc-concept-12', 'agc-concept-13'],
  },
  {
    chapter: 9,
    title: 'Failsafe: When Things Go Wrong',
    slug: 'failsafe',
    prerequisites: ['executive-waitlist'],
    learningObjectives: [
      'Understand BAILOUT restart protection and restart groups',
      'Know the three restart groups (CRITICAL, IMPORTANT, DEFERRABLE)',
      'Trace a BAILOUT through job preservation and discard',
    ],
    estimatedMinutes: 30,
    archiveRefs: ['agc-soft-006', 'agc-soft-007', 'agc-ops-003'],
    conceptRefs: ['agc-concept-03', 'agc-concept-04'],
  },
  {
    chapter: 10,
    title: 'Apollo 11: The 1202 Alarm Story',
    slug: 'apollo-11',
    prerequisites: ['failsafe'],
    learningObjectives: [
      'Reconstruct the Apollo 11 1202 alarm sequence minute by minute',
      'Understand the root cause (rendezvous radar stealing cycles)',
      'Appreciate why the software design saved the mission',
    ],
    estimatedMinutes: 35,
    archiveRefs: ['agc-ops-001', 'agc-ops-002', 'agc-ops-003', 'agc-soft-007'],
    conceptRefs: ['agc-concept-01', 'agc-concept-03', 'agc-concept-04'],
  },
  {
    chapter: 11,
    title: 'AGC Patterns in GSD: From Moon to Modern',
    slug: 'agc-to-gsd',
    prerequisites: ['apollo-11'],
    learningObjectives: [
      'Map AGC concepts to modern software engineering patterns',
      'Identify AGC patterns in the GSD-OS architecture',
      'Apply AGC engineering principles to your own work',
    ],
    estimatedMinutes: 25,
    archiveRefs: ['agc-arch-001'],
    conceptRefs: ['agc-concept-01', 'agc-concept-02', 'agc-concept-03', 'agc-concept-04', 'agc-concept-05'],
  },
] as const;

/** All 8 curriculum exercises. */
export const EXERCISES: readonly ExerciseMeta[] = [
  {
    exercise: 1,
    title: 'Your First AGC Program',
    slug: 'hello-dsky',
    chapter: 4,
    difficulty: 'beginner',
    programSlug: 'hello-dsky',
    description: 'Write a display pattern to the DSKY via channel 10',
  },
  {
    exercise: 2,
    title: 'Timing and Display',
    slug: 'countdown',
    chapter: 4,
    difficulty: 'beginner',
    programSlug: 'countdown',
    description: 'Count from 10 down to 0, displaying each value on DSKY R1',
  },
  {
    exercise: 3,
    title: 'Memory and Arithmetic',
    slug: 'calculator',
    chapter: 3,
    difficulty: 'intermediate',
    programSlug: 'calculator',
    description: 'Add two numbers from erasable memory and display the result',
  },
  {
    exercise: 4,
    title: 'Waitlist Timer Tasks',
    slug: 'blinker',
    chapter: 5,
    difficulty: 'intermediate',
    programSlug: 'blinker',
    description: 'Toggle the COMP ACTY annunciator on and off with delay loops',
  },
  {
    exercise: 5,
    title: 'Executive Job Scheduling',
    slug: 'scheduler',
    chapter: 5,
    difficulty: 'intermediate',
    programSlug: 'scheduler',
    description: 'Create 3 Executive jobs at different priorities and observe scheduling order',
  },
  {
    exercise: 6,
    title: 'Priority Preemption',
    slug: 'priority',
    chapter: 5,
    difficulty: 'advanced',
    programSlug: 'priority',
    description: 'Demonstrate high-priority guidance preempting low-priority display',
  },
  {
    exercise: 7,
    title: 'Restart Protection',
    slug: 'restart',
    chapter: 9,
    difficulty: 'advanced',
    programSlug: 'restart',
    description: 'Register restart points, trigger BAILOUT, and observe job preservation',
  },
  {
    exercise: 8,
    title: 'Reproducing the 1202 Alarm',
    slug: 'capstone-1202',
    chapter: 10,
    difficulty: 'advanced',
    programSlug: 'capstone',
    description: 'Reproduce the Apollo 11 1202 alarm: overload, BAILOUT, guidance preserved, recovery',
  },
] as const;

/** All 8 curriculum starter programs. */
export const PROGRAMS: readonly ProgramMeta[] = [
  {
    program: 1,
    title: 'Hello DSKY',
    slug: 'hello-dsky',
    sourceFile: 'programs/hello-dsky.agc',
    description: 'Writes a digit pattern to DSKY R1 display via channel 10',
    expectedBehavior: 'DSKY R1 shows a number pattern, program halts in busy loop',
  },
  {
    program: 2,
    title: 'Countdown',
    slug: 'countdown',
    sourceFile: 'programs/countdown.agc',
    description: 'Counts from 10 down to 0, displaying each value on DSKY R1',
    expectedBehavior: 'Channel 10 receives decreasing values from 10 to 0, then halts',
  },
  {
    program: 3,
    title: 'Calculator',
    slug: 'calculator',
    sourceFile: 'programs/calculator.agc',
    description: 'Adds two numbers from erasable memory and displays the result',
    expectedBehavior: 'Channel 10 receives the sum (25 + 37 = 62), then halts',
  },
  {
    program: 4,
    title: 'Blinker',
    slug: 'blinker',
    sourceFile: 'programs/blinker.agc',
    description: 'Toggles COMP ACTY annunciator on and off using busy-wait delay loops',
    expectedBehavior: 'Channel 11 alternates between on-pattern and off-pattern values',
  },
  {
    program: 5,
    title: 'Scheduler',
    slug: 'scheduler',
    sourceFile: 'programs/scheduler.agc',
    description: 'Three job bodies that identify themselves via I/O channel writes',
    expectedBehavior: 'Channel 10 receives job identifiers (1, 2, 3) in priority order',
  },
  {
    program: 6,
    title: 'Priority',
    slug: 'priority',
    sourceFile: 'programs/priority.agc',
    description: 'High-priority guidance job and low-priority display job demonstrate preemption',
    expectedBehavior: 'Channel 10 (guidance) writes continuously; channel 11 (display) only when guidance sleeps',
  },
  {
    program: 7,
    title: 'Restart',
    slug: 'restart',
    sourceFile: 'programs/restart.agc',
    description: 'Three jobs at CRITICAL/IMPORTANT/DEFERRABLE restart groups demonstrate BAILOUT',
    expectedBehavior: 'After BAILOUT: channels 10 and 11 active (preserved), channel 12 silent (discarded)',
  },
  {
    program: 8,
    title: 'Capstone',
    slug: 'capstone',
    sourceFile: 'programs/capstone.agc',
    description: 'Reproduces the Apollo 11 1202 alarm scenario end-to-end',
    expectedBehavior: 'Executive overflows, BAILOUT triggers, P63 guidance continues on channel 10',
  },
] as const;
