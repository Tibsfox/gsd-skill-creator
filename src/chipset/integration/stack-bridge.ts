/**
 * StackBridge: Converts gsd-stack recording stream.jsonl events into
 * ObservationInput for the Copper Learning Compiler.
 *
 * Parses JSONL lines from stream.jsonl (written by gsd-stack record_event),
 * groups events by recording session (recording_start to recording_stop),
 * aggregates per-session metrics, and produces SessionObservation[] suitable
 * for LearningCompiler.compile().
 *
 * Handles all 9 gsd-stack stream event types: recording_start, recording_stop,
 * terminal, file_change, marker, stack_push, stack_pop, stack_clear, stack_poke.
 */

import { z } from 'zod';
import type { SessionObservation, SessionMetrics } from '../../types/observation.js';
import type { ObservationInput } from '../copper/learning/types.js';

// ============================================================================
// Stream Event Schema (Zod discriminated union)
// ============================================================================

const RecordingStartSchema = z.object({
  type: z.literal('recording_start'),
  ts: z.string(),
  name: z.string(),
  session: z.string().optional(),
});

const RecordingStopSchema = z.object({
  type: z.literal('recording_stop'),
  ts: z.string(),
  name: z.string().optional(),
});

const TerminalSchema = z.object({
  type: z.literal('terminal'),
  ts: z.string(),
  content: z.string().optional(),
  lines: z.number().optional(),
  cols: z.number().optional(),
});

const FileChangeSchema = z.object({
  type: z.literal('file_change'),
  ts: z.string(),
  path: z.string(),
  action: z.string().optional(),
  lines_delta: z.number().optional(),
});

const MarkerSchema = z.object({
  type: z.literal('marker'),
  ts: z.string(),
  label: z.string(),
});

const StackPushSchema = z.object({
  type: z.literal('stack_push'),
  ts: z.string(),
  priority: z.string().optional(),
  message: z.string().optional(),
});

const StackPopSchema = z.object({
  type: z.literal('stack_pop'),
  ts: z.string(),
  priority: z.string().optional(),
  message: z.string().optional(),
});

const StackClearSchema = z.object({
  type: z.literal('stack_clear'),
  ts: z.string(),
  count: z.number().optional(),
});

const StackPokeSchema = z.object({
  type: z.literal('stack_poke'),
  ts: z.string(),
  message: z.string().optional(),
});

const StreamEventSchema = z.discriminatedUnion('type', [
  RecordingStartSchema,
  RecordingStopSchema,
  TerminalSchema,
  FileChangeSchema,
  MarkerSchema,
  StackPushSchema,
  StackPopSchema,
  StackClearSchema,
  StackPokeSchema,
]);

/** Parsed stream event (union of all 9 types). */
export type StreamEvent = z.infer<typeof StreamEventSchema>;

// ============================================================================
// Configuration
// ============================================================================

/** Configuration for StackBridge behavior. */
export interface StackBridgeConfig {
  /** Maximum unique file paths to include per session (default 10). */
  maxFilesPerSession: number;
  /** Maximum commands to extract per session (default 20). */
  maxCommandsPerSession: number;
}

const DEFAULT_CONFIG: StackBridgeConfig = {
  maxFilesPerSession: 10,
  maxCommandsPerSession: 20,
};

// ============================================================================
// Internal: Recording Session Accumulator
// ============================================================================

/** Accumulates events for a single recording session. */
interface RecordingAccumulator {
  name: string;
  startTs: string;
  stopTs: string | null;
  lastEventTs: string;
  files: Set<string>;
  commands: Set<string>;
  stackOps: number;
  fileChangeCount: number;
  markerCount: number;
}

// ============================================================================
// StackBridge
// ============================================================================

/**
 * Bridge between gsd-stack recording events and the Copper learning pipeline.
 *
 * Transforms stream.jsonl content into ObservationInput compatible with
 * LearningCompiler.compile().
 */
export class StackBridge {
  private readonly config: StackBridgeConfig;

  constructor(config?: Partial<StackBridgeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse JSONL lines into typed StreamEvent objects.
   *
   * Invalid JSON lines and lines that fail schema validation are skipped.
   *
   * @param lines - Array of JSONL strings (one event per line)
   * @returns Parsed and validated StreamEvent objects
   */
  parseStream(lines: string[]): StreamEvent[] {
    const events: StreamEvent[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // Invalid JSON -- skip
        continue;
      }

      const result = StreamEventSchema.safeParse(parsed);
      if (result.success) {
        events.push(result.data);
      }
      // Invalid schema -- skip
    }

    return events;
  }

  /**
   * Aggregate parsed stream events into ObservationInput.
   *
   * Groups events by recording session (recording_start to recording_stop),
   * builds a SessionObservation for each group, and returns them wrapped
   * in an ObservationInput ready for LearningCompiler.compile().
   *
   * @param events - Parsed StreamEvent objects from parseStream()
   * @returns ObservationInput with sessions and candidates: undefined
   */
  aggregate(events: StreamEvent[]): ObservationInput {
    if (events.length === 0) {
      return { sessions: [], candidates: undefined };
    }

    // Group events by recording session
    const accumulators: RecordingAccumulator[] = [];
    let current: RecordingAccumulator | null = null;

    for (const event of events) {
      if (event.type === 'recording_start') {
        // Start a new recording session
        current = {
          name: event.name,
          startTs: event.ts,
          stopTs: null,
          lastEventTs: event.ts,
          files: new Set(),
          commands: new Set(),
          stackOps: 0,
          fileChangeCount: 0,
          markerCount: 0,
        };
        accumulators.push(current);
        continue;
      }

      if (event.type === 'recording_stop') {
        if (current) {
          current.stopTs = event.ts;
          current.lastEventTs = event.ts;
          current = null;
        }
        continue;
      }

      // All other events go into the current recording (if one is active)
      if (!current) {
        continue;
      }

      current.lastEventTs = event.ts;

      switch (event.type) {
        case 'terminal':
          if (event.content) {
            // Extract commands from lines starting with "$ "
            const lines = event.content.split('\n');
            for (const line of lines) {
              const match = line.match(/^\$ (.+)/);
              if (match) {
                current.commands.add(match[1]);
              }
            }
          }
          break;

        case 'file_change':
          current.files.add(event.path);
          current.fileChangeCount++;
          break;

        case 'marker':
          current.markerCount++;
          break;

        case 'stack_push':
        case 'stack_pop':
        case 'stack_clear':
        case 'stack_poke':
          current.stackOps++;
          break;
      }
    }

    // Convert accumulators to SessionObservation[]
    const sessions: SessionObservation[] = accumulators.map((acc) =>
      this.accumulatorToObservation(acc),
    );

    return { sessions, candidates: undefined };
  }

  /**
   * Convenience method: split file content into lines, parse, and aggregate.
   *
   * @param content - Raw stream.jsonl file content
   * @returns ObservationInput ready for LearningCompiler.compile()
   */
  fromStreamFile(content: string): ObservationInput {
    if (content.trim().length === 0) {
      return { sessions: [], candidates: undefined };
    }

    const lines = content.split('\n');
    const events = this.parseStream(lines);
    return this.aggregate(events);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Convert a RecordingAccumulator into a SessionObservation.
   */
  private accumulatorToObservation(acc: RecordingAccumulator): SessionObservation {
    const startTime = new Date(acc.startTs).getTime();
    const endTs = acc.stopTs ?? acc.lastEventTs;
    const endTime = new Date(endTs).getTime();
    const durationMinutes = (endTime - startTime) / 60_000;

    const topFiles = [...acc.files].slice(0, this.config.maxFilesPerSession);
    const topCommands = [...acc.commands].slice(0, this.config.maxCommandsPerSession);

    const metrics: SessionMetrics = {
      toolCalls: acc.stackOps + acc.fileChangeCount,
      uniqueFilesRead: 0,
      uniqueFilesWritten: acc.files.size,
      uniqueCommandsRun: acc.commands.size,
      userMessages: 0,
      assistantMessages: 0,
    };

    return {
      sessionId: acc.name,
      startTime,
      endTime,
      durationMinutes,
      source: 'startup',
      reason: 'other',
      metrics,
      topFiles,
      topCommands,
      topTools: ['gsd-stack'],
      activeSkills: [],
    };
  }
}
