/**
 * Spatial Awareness — The Chorus Protocol
 * Paula Chipset Release 2
 *
 * Passive Sensing, Threat Assessment, and Coordinated Signaling
 * for Agent Systems.
 */

// Types and schemas
export {
  ThreatLevelSchema,
  ThreatClassificationSchema,
  FrogPhaseSchema,
  CommTierSchema,
  AmbientSignalTypeSchema,
  AmbientSignalSchema,
  ThreatEventTypeSchema,
  ThreatEventSchema,
  CoordinationMessageSchema,
  ResourceDimensionSchema,
  SpatialModelSchema,
  OutputTargetTypeSchema,
  OutputMappingSchema,
  UsbDeviceClassSchema,
  UsbDeviceDirectionSchema,
  UsbDeviceSchema,
  SpatialModuleSchema,
  LaserInterlockStatusSchema,
} from './types.js';

export type {
  ThreatLevel,
  ThreatClassification,
  FrogPhase,
  CommTier,
  AmbientSignalType,
  AmbientSignal,
  ThreatEventType,
  ThreatEvent,
  CoordinationMessage,
  ResourceDimension,
  SpatialModel,
  OutputTargetType,
  OutputMapping,
  UsbDeviceClass,
  UsbDeviceDirection,
  UsbDevice,
  SpatialModule,
  LaserInterlockStatus,
} from './types.js';

// Sensor interface
export {
  createAmbientSignal,
  ComputationalSensor,
  ContextFillSensor,
  TokenBudgetSensor,
  ErrorRateSensor,
  DefaultSensorRegistry,
  DefaultOutputRegistry,
} from './sensor-interface.js';

export type {
  SensorStream,
  SensorListener,
  OutputDevice,
  SensorRegistry,
  OutputRegistry,
  UsbDeviceManager,
  UsbDeviceEvent,
} from './sensor-interface.js';

// Test environment
export {
  SimulatedEnvironment,
  SCENARIOS,
  createMockAgent,
  DEFAULT_NOISE,
  LOW_NOISE,
  HIGH_NOISE,
} from './test-env.js';

export type {
  MockAgent,
  AnomalyConfig,
  InjectedAnomaly,
  NoiseConfig,
  SimEnvironmentEvent,
} from './test-env.js';
