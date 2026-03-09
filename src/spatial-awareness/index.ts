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

// Communication bus
export {
  CommBus,
  createCommBus,
  SIGNAL_FILES,
} from './comm-bus.js';

export type {
  MessageHandler,
  CommBusSubscription,
  CommBusStats,
  SignalFileType,
  SignalFileEvent,
} from './comm-bus.js';

// Chorus coordination protocol
export {
  ChorusProtocol,
  createChorusProtocol,
} from './chorus-proto.js';

export type {
  ChorusAgentState,
  AgentSnapshot,
  ChorusEvent,
  ChorusEventHandler,
  PauseResult,
  ResumeResult,
} from './chorus-proto.js';

// Output synthesis
export {
  OutputSynthesis,
  createOutputSynthesis,
  createDmxFrame,
  createLedStrip,
  DEFAULT_AUDIO_PARAMS,
  DMX_CHANNELS,
  DMX_OUTPUT_RATE_HZ,
  FROG_PHASE_COLORS,
} from './output-synthesis.js';

export type {
  AudioSynthParams,
  DmxFrame,
  LedPixel,
  LedStripState,
  IldaPoint,
  LaserSafetyState,
  PhaseColorScheme,
} from './output-synthesis.js';

// Passive environmental sensor
export {
  PassiveEnvironmentalSensor,
  DEFAULT_THRESHOLDS,
} from './passive-sensor.js';

export type {
  ThresholdConfig,
  AnomalyRecord,
} from './passive-sensor.js';

// Threat detection engine
export {
  ThreatDetectionEngine,
  DEFAULT_THREAT_CONFIG,
} from './threat-engine.js';

export type {
  ThreatEngineConfig,
} from './threat-engine.js';

// Environmental geometry mapper
export {
  EnvironmentalGeometryMapper,
  DEFAULT_GEOMETRY_CONFIG,
} from './geometry-mapper.js';

export type {
  GeometryConfig,
  ConstraintBoundary,
} from './geometry-mapper.js';

// USB device layer
export {
  UsbSensorStream,
  UsbOutputDevice,
  SimulatedUsbDeviceManager,
  createDeviceStream,
  deviceClassToSignalType,
  createSimulatedAudioInput,
  createSimulatedAudioOutput,
  createSimulatedSerialDevice,
  createSimulatedBulkDevice,
} from './usb-device.js';

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
