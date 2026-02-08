import type { SessionObservation } from '../types/observation.js';

/**
 * Squashes multiple ephemeral observations into a single summary observation.
 * Used during promotion to compress accumulated low-signal entries into
 * a single aggregate that can be evaluated for collective significance.
 *
 * Merge strategy:
 * - Metrics: summed across all observations
 * - Timestamps: earliest start, latest end, recalculated duration
 * - Arrays (topCommands, topFiles, topTools, activeSkills): union with deduplication
 * - Identity (sessionId, source, reason): taken from first observation
 * - Metadata: tier set to 'persistent', squashedFrom set to input count
 */
export class ObservationSquasher {
  /**
   * Squash multiple observations into a single summary observation.
   * Returns null for empty input.
   */
  squash(observations: SessionObservation[]): SessionObservation | null {
    if (observations.length === 0) {
      return null;
    }

    if (observations.length === 1) {
      return {
        ...observations[0],
        tier: 'persistent',
        squashedFrom: 1,
      };
    }

    const first = observations[0];
    const startTime = Math.min(...observations.map(o => o.startTime));
    const endTime = Math.max(...observations.map(o => o.endTime));

    return {
      sessionId: first.sessionId,
      startTime,
      endTime,
      durationMinutes: Math.round((endTime - startTime) / 60000),
      source: first.source,
      reason: first.reason,
      metrics: {
        userMessages: observations.reduce((sum, o) => sum + o.metrics.userMessages, 0),
        assistantMessages: observations.reduce((sum, o) => sum + o.metrics.assistantMessages, 0),
        toolCalls: observations.reduce((sum, o) => sum + o.metrics.toolCalls, 0),
        uniqueFilesRead: observations.reduce((sum, o) => sum + o.metrics.uniqueFilesRead, 0),
        uniqueFilesWritten: observations.reduce((sum, o) => sum + o.metrics.uniqueFilesWritten, 0),
        uniqueCommandsRun: observations.reduce((sum, o) => sum + o.metrics.uniqueCommandsRun, 0),
      },
      topCommands: [...new Set(observations.flatMap(o => o.topCommands))],
      topFiles: [...new Set(observations.flatMap(o => o.topFiles))],
      topTools: [...new Set(observations.flatMap(o => o.topTools))],
      activeSkills: [...new Set(observations.flatMap(o => o.activeSkills))],
      tier: 'persistent',
      squashedFrom: observations.length,
    };
  }
}
