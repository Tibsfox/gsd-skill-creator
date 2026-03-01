/**
 * Training Hall -- the entry point for the Mind-Body Department.
 *
 * The Training Hall is the main navigation interface for the mind-body
 * department, providing 5 paths: Browse the Arts, Try a Session,
 * Build a Practice, The Map, and Journal.
 *
 * @module departments/mind-body/training-hall
 */

import type { TrainingHallView, TrainingHallOption } from './types.js';

// ─── Navigation Options ─────────────────────────────────────────────────────

const TRAINING_HALL_OPTIONS: TrainingHallOption[] = [
  {
    id: 'browse',
    label: 'Browse the Arts',
    description:
      'Explore any discipline through its history, philosophy, key concepts, and connections',
    icon: '\u262F', // ☯
  },
  {
    id: 'try',
    label: 'Try a Session',
    description: 'Guided beginner experiences lasting 5-15 minutes',
    icon: '\u25C9', // ◉
  },
  {
    id: 'build',
    label: 'Build a Practice',
    description:
      'Structured progressive curricula that build skill over weeks and months',
    icon: '\u2B21', // ⬡
  },
  {
    id: 'map',
    label: 'The Map',
    description:
      'How all these disciplines relate, reinforce, and inform each other',
    icon: '\u25C8', // ◈
  },
  {
    id: 'journal',
    label: 'Journal',
    description:
      'Your practice journal -- sessions, observations, and growth',
    icon: '\uD83D\uDCD6', // 📖
  },
];

// ─── TrainingHall Class ─────────────────────────────────────────────────────

/**
 * The Training Hall -- main entry point for the Mind-Body department.
 *
 * Provides contextual greetings based on practice history and
 * navigation to all 5 department areas.
 */
export class TrainingHall {
  /**
   * Get the full Training Hall view for display.
   */
  getView(streakDays: number, totalSessions: number): TrainingHallView {
    return {
      greeting: this.getGreeting(streakDays, totalSessions),
      options: this.getOptions(),
      currentStreak: streakDays,
      totalSessions,
    };
  }

  /**
   * Get all 5 navigation options.
   */
  getOptions(): TrainingHallOption[] {
    return [...TRAINING_HALL_OPTIONS];
  }

  /**
   * Get a contextual greeting based on practice history.
   *
   * - 0 sessions: The Matrix moment -- "I know kung fu." / "Show me."
   * - After absence (streak = 0 but has sessions): "Welcome back."
   * - Active streak: "Day [N]. The practice continues."
   */
  getGreeting(streakDays: number, totalSessions: number = 0): string {
    if (totalSessions === 0) {
      return '"I know kung fu." -- "Show me."';
    }

    if (streakDays === 0) {
      return 'Welcome back.';
    }

    return `Day ${streakDays}. The practice continues.`;
  }
}

// ─── Render Function ────────────────────────────────────────────────────────

/**
 * Render the Training Hall as an ASCII layout.
 *
 * Produces a formatted text display with the greeting and all
 * navigation options, matching the vision document format.
 */
export function renderTrainingHall(view: TrainingHallView): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════╗');
  lines.push('  ║          THE TRAINING HALL               ║');
  lines.push('  ╚══════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  ${view.greeting}`);
  lines.push('');

  if (view.totalSessions > 0) {
    lines.push(`  Streak: ${view.currentStreak} days  |  Sessions: ${view.totalSessions}`);
    lines.push('');
  }

  lines.push('  ┌──────────────────────────────────────────┐');

  for (const option of view.options) {
    lines.push(`  │  ${option.icon}  ${option.label}`);
    lines.push(`  │     ${option.description}`);
    lines.push('  │');
  }

  lines.push('  └──────────────────────────────────────────┘');
  lines.push('');

  return lines.join('\n');
}
