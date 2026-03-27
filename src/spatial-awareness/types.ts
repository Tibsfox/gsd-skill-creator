/**
 * Spatial Awareness — The Chorus Protocol
 * Paula Chipset Release 2
 *
 * Type definitions and signal schemas for passive sensing,
 * threat detection, and coordinated signaling.
 */

import { z } from 'zod';

// ============================================================================
// Signal severity and threat levels
// ============================================================================

export const ThreatLevelSchema = z.enum([
  'NOMINAL',
  'ELEVATED',
  'HIGH',
  'BLOCK',
]);
export type ThreatLevel = z.infer<typeof ThreatLevelSchema>;

export const ThreatClassificationSchema = z.enum([
  'THREAT',
  'NEUTRAL',
  'OPPORTUNITY',
  'UNKNOWN',
]);
export type ThreatClassification = z.infer<typeof ThreatClassificationSchema>;

// ============================================================================
// Frog Protocol phases
// ============================================================================

export const FrogPhaseSchema = z.enum([
  'BASELINE',
  'SILENCE',
  'ASSESS',
  'PROBE',
  'CLASSIFY',
  'RESUME',
]);
export type FrogPhase = z.infer<typeof FrogPhaseSchema>;

// ============================================================================
// Communication tiers
// ============================================================================

export const CommTierSchema = z.enum([
  'COVERT',
  'DIRECTED',
  'BROADCAST',
]);
export type CommTier = z.infer<typeof CommTierSchema>;

// ============================================================================
// Ambient signal types
// ============================================================================

export const AmbientSignalTypeSchema = z.enum([
  'context_fill',
  'token_budget',
  'error_rate',
  'agent_output_rate',
  'filesystem_change',
  'session_age',
  'peer_health',
  'usb_audio',
  'usb_serial',
  'usb_bulk',
  'accelerometer',
  'gyroscope',
  'magnetometer',
  'barometer',
  'gps',
  'wifi_rssi',
  'bluetooth_rssi',
  'uwb_range',
  'temperature',
  'light_level',
  'rf_spectrum',
]);
export type AmbientSignalType = z.infer<typeof AmbientSignalTypeSchema>;

export const AmbientSignalSchema = z.object({
  id: z.string().min(1),
  type: AmbientSignalTypeSchema,
  source: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.number(),
  confidence: z.number().min(0).max(1).default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
export type AmbientSignal = z.infer<typeof AmbientSignalSchema>;

// ============================================================================
// Threat events
// ============================================================================

export const ThreatEventTypeSchema = z.enum([
  'dependency_failure',
  'budget_spike',
  'agent_silence',
  'safety_approach',
  'error_surge',
  'resource_exhaustion',
  'external_signal',
  'environmental_change',
  'anomaly_correlated',
]);
export type ThreatEventType = z.infer<typeof ThreatEventTypeSchema>;

export const ThreatEventSchema = z.object({
  id: z.string().min(1),
  type: ThreatEventTypeSchema,
  level: ThreatLevelSchema,
  classification: ThreatClassificationSchema.default('UNKNOWN'),
  sources: z.array(z.string()).min(1),
  description: z.string().min(1),
  timestamp: z.number(),
  correlationId: z.string().optional(),
  probeResults: z.array(z.object({
    probeId: z.string(),
    result: z.enum(['safe', 'unsafe', 'inconclusive']),
    timestamp: z.number(),
  })).default([]),
  resolved: z.boolean().default(false),
}).passthrough();
export type ThreatEvent = z.infer<typeof ThreatEventSchema>;

// ============================================================================
// Coordination messages
// ============================================================================

export const CoordinationMessageSchema = z.object({
  id: z.string().min(1),
  tier: CommTierSchema,
  sender: z.string().min(1),
  recipients: z.array(z.string()).default([]),
  phase: FrogPhaseSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  timestamp: z.number(),
  ttl: z.number().positive().default(30_000),
}).passthrough();
export type CoordinationMessage = z.infer<typeof CoordinationMessageSchema>;

// ============================================================================
// Spatial model — agent environment geometry
// ============================================================================

export const ResourceDimensionSchema = z.object({
  name: z.string().min(1),
  current: z.number(),
  maximum: z.number(),
  unit: z.string(),
  fillPercent: z.number().min(0).max(100),
  rateOfChange: z.number().default(0),
});
export type ResourceDimension = z.infer<typeof ResourceDimensionSchema>;

export const SpatialModelSchema = z.object({
  agentId: z.string().min(1),
  timestamp: z.number(),
  dimensions: z.array(ResourceDimensionSchema),
  threatLevel: ThreatLevelSchema.default('NOMINAL'),
  activePhase: FrogPhaseSchema.default('BASELINE'),
  peerCount: z.number().int().min(0).default(0),
  peersActive: z.number().int().min(0).default(0),
  peersIdle: z.number().int().min(0).default(0),
  peersBlocked: z.number().int().min(0).default(0),
  lastAnomaly: z.number().nullable().default(null),
}).passthrough();
export type SpatialModel = z.infer<typeof SpatialModelSchema>;

// ============================================================================
// Output synthesis mapping
// ============================================================================

export const OutputTargetTypeSchema = z.enum([
  'audio_oscillator',
  'audio_filter',
  'audio_envelope',
  'audio_spatial',
  'dmx_channel',
  'led_color',
  'led_brightness',
  'led_animation',
  'laser_x',
  'laser_y',
  'laser_color',
  'laser_blanking',
]);
export type OutputTargetType = z.infer<typeof OutputTargetTypeSchema>;

export const OutputMappingSchema = z.object({
  id: z.string().min(1),
  source: AmbientSignalTypeSchema,
  target: OutputTargetTypeSchema,
  range: z.tuple([z.number(), z.number()]),
  enabled: z.boolean().default(true),
}).passthrough();
export type OutputMapping = z.infer<typeof OutputMappingSchema>;

// ============================================================================
// USB device descriptor
// ============================================================================

export const UsbDeviceClassSchema = z.enum([
  'audio',
  'serial',
  'bulk',
  'hid',
]);
export type UsbDeviceClass = z.infer<typeof UsbDeviceClassSchema>;

export const UsbDeviceDirectionSchema = z.enum([
  'input',
  'output',
  'bidirectional',
]);
export type UsbDeviceDirection = z.infer<typeof UsbDeviceDirectionSchema>;

export const UsbDeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  deviceClass: UsbDeviceClassSchema,
  direction: UsbDeviceDirectionSchema,
  path: z.string().min(1),
  connected: z.boolean().default(false),
  sampleRate: z.number().optional(),
  baudRate: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
export type UsbDevice = z.infer<typeof UsbDeviceSchema>;

// ============================================================================
// Module identifiers
// ============================================================================

export const SpatialModuleSchema = z.enum([
  'M1_PASSIVE_SENSOR',
  'M2_THREAT_DETECTION',
  'M3_GEOMETRY_MAPPER',
  'M4_FROG_PROTOCOL',
  'M5_COMM_BUS',
  'M6_CHORUS_COORDINATION',
]);
export type SpatialModule = z.infer<typeof SpatialModuleSchema>;

// ============================================================================
// Laser safety
// ============================================================================

export const LaserInterlockStatusSchema = z.enum([
  'ENGAGED',
  'DISENGAGED',
  'FAULT',
  'UNKNOWN',
]);
export type LaserInterlockStatus = z.infer<typeof LaserInterlockStatusSchema>;
