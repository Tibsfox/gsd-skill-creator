/**
 * Telemetry consumer event router for the MC-1 Control Surface.
 *
 * Bridges ME-1 telemetry sources to the Dashboard and AlertRenderer by
 * routing ICD-01 events to the correct consumers based on event type:
 *
 * - TELEMETRY_UPDATE -> Dashboard + AlertRenderer
 * - ALERT_SURFACE -> Dashboard + AlertRenderer
 * - GATE_SIGNAL -> AlertRenderer only
 * - Other types -> tracked in stats but not routed
 *
 * Provides pull-based consumption (consume one event or drain all) and
 * diagnostic stats for monitoring event flow.
 *
 * This is a routing layer, not a processing layer. It decides WHO gets
 * each event, not WHAT to do with it.
 */

import type { EventEnvelope } from '../message-envelope.js';
import type { Dashboard } from './dashboard.js';
import type { AlertRenderer } from './alert-renderer.js';

// ============================================================================
// Types
// ============================================================================

/** Diagnostic statistics for event consumption. */
export interface TelemetryStats {
  /** Total number of events consumed. */
  total: number;
  /** Event count broken down by event type. */
  by_type: Record<string, number>;
}

/** Configuration for a TelemetryConsumer instance. */
export interface TelemetryConsumerConfig {
  /** Dashboard instance to route telemetry and alert events to. */
  dashboard: Dashboard;
  /** AlertRenderer instance to route alert and gate events to. */
  alertRenderer: AlertRenderer;
}

// ============================================================================
// TelemetryConsumer Class
// ============================================================================

/**
 * Event router that bridges ME-1 telemetry sources to Dashboard and AlertRenderer.
 *
 * Maintains diagnostic stats and preserves event ordering during processing.
 */
export class TelemetryConsumer {
  private readonly dashboard: Dashboard;
  private readonly alertRenderer: AlertRenderer;
  private stats: TelemetryStats;

  constructor(config: TelemetryConsumerConfig) {
    this.dashboard = config.dashboard;
    this.alertRenderer = config.alertRenderer;
    this.stats = { total: 0, by_type: {} };
  }

  /**
   * Consume a single event and route it to the appropriate consumers.
   *
   * Null/undefined events are silently skipped (defensive).
   */
  consume(event: EventEnvelope): void {
    if (!event) return;

    // Update stats
    this.stats.total++;
    this.stats.by_type[event.type] = (this.stats.by_type[event.type] ?? 0) + 1;

    // Route by event type
    switch (event.type) {
      case 'TELEMETRY_UPDATE':
        this.dashboard.processEvent(event);
        this.alertRenderer.processEvent(event);
        break;

      case 'ALERT_SURFACE':
        this.dashboard.processEvent(event);
        this.alertRenderer.processEvent(event);
        break;

      case 'GATE_SIGNAL':
        // Gates go only to AlertRenderer -- dashboard doesn't consume them
        this.alertRenderer.processEvent(event);
        break;

      default:
        // Unknown event types: tracked in stats but not routed
        break;
    }
  }

  /**
   * Drain all events from an array, processing each in order.
   */
  drainAll(events: EventEnvelope[]): void {
    for (const event of events) {
      this.consume(event);
    }
  }

  /**
   * Get a copy of the current diagnostic stats.
   *
   * Returns a copy to prevent external mutation.
   */
  getStats(): TelemetryStats {
    return {
      total: this.stats.total,
      by_type: { ...this.stats.by_type },
    };
  }

  /**
   * Reset diagnostic stats to zero.
   */
  resetStats(): void {
    this.stats = { total: 0, by_type: {} };
  }
}
