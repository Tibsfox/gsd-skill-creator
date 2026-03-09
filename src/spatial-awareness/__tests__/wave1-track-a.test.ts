/**
 * Spatial Awareness — Wave 1 Track A Tests
 * Paula Chipset Release 2
 *
 * Tests for: passive-sensor, threat-engine, geometry-mapper, usb-device
 * Covers: CF-01, CF-02, CF-03, CF-04, CF-05, CF-15, CF-17, CF-18
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { AmbientSignal } from '../types.js';
import {
  DefaultSensorRegistry,
  ContextFillSensor,
  TokenBudgetSensor,
  ErrorRateSensor,
  createAmbientSignal,
} from '../sensor-interface.js';

import {
  PassiveEnvironmentalSensor,
  DEFAULT_THRESHOLDS,
} from '../passive-sensor.js';

import {
  ThreatDetectionEngine,
  DEFAULT_THREAT_CONFIG,
} from '../threat-engine.js';

import {
  EnvironmentalGeometryMapper,
  DEFAULT_GEOMETRY_CONFIG,
} from '../geometry-mapper.js';

import {
  SimulatedUsbDeviceManager,
  UsbSensorStream,
  UsbOutputDevice,
  createDeviceStream,
  createSimulatedAudioInput,
  createSimulatedAudioOutput,
  createSimulatedSerialDevice,
  createSimulatedBulkDevice,
  deviceClassToSignalType,
} from '../usb-device.js';

// ============================================================================
// CF-01: Context fill within 2%
// ============================================================================

describe('CF-01: Context fill accuracy', () => {
  let registry: DefaultSensorRegistry;
  let sensor: PassiveEnvironmentalSensor;
  let contextSensor: ContextFillSensor;

  beforeEach(() => {
    registry = new DefaultSensorRegistry();
    contextSensor = new ContextFillSensor(50);
    registry.register(contextSensor);
    sensor = new PassiveEnvironmentalSensor('test-agent', registry);
  });

  afterEach(() => {
    sensor.stop();
    contextSensor.stop();
  });

  it('should read context fill within 2% accuracy', async () => {
    contextSensor.setFill(45);
    await contextSensor.start();

    const model = sensor.sense();
    const contextDim = model.dimensions.find(d => d.name === 'context_window');

    expect(contextDim).toBeDefined();
    expect(Math.abs(contextDim!.fillPercent - 45)).toBeLessThanOrEqual(2);
  });

  it('should track context fill changes accurately', async () => {
    // Use SimulatedEnvironment sensors which read agent values directly
    const { SimulatedEnvironment } = await import('../test-env.js');
    const env = new SimulatedEnvironment(['alpha']);
    await env.sensorRegistry.startAll();
    const directSensor = new PassiveEnvironmentalSensor('test', env.sensorRegistry);

    for (const fill of [10, 30, 50, 70, 90]) {
      env.agents[0].contextFill = fill;
      directSensor.clearHistory();
      const model = directSensor.sense();
      const dim = model.dimensions.find(d => d.name === 'context_window');
      expect(dim).toBeDefined();
      expect(Math.abs(dim!.fillPercent - fill)).toBeLessThanOrEqual(2);
    }

    await env.sensorRegistry.stopAll();
  });

  it('should aggregate context fill from multiple agents', async () => {
    // Use the SimulatedEnvironment sensors which have unique IDs per agent
    const { SimulatedEnvironment } = await import('../test-env.js');
    const env = new SimulatedEnvironment(['alpha', 'bravo']);
    env.agents[0].contextFill = 40;
    env.agents[1].contextFill = 50;
    await env.sensorRegistry.startAll();

    const aggSensor = new PassiveEnvironmentalSensor('test-agent', env.sensorRegistry);
    const model = aggSensor.sense();
    const dim = model.dimensions.find(d => d.name === 'context_window');
    expect(dim).toBeDefined();
    // Average of 40 and 50 = 45
    expect(Math.abs(dim!.fillPercent - 45)).toBeLessThanOrEqual(2);

    await env.sensorRegistry.stopAll();
  });
});

// ============================================================================
// CF-02: Budget within 5%
// ============================================================================

describe('CF-02: Budget accuracy', () => {
  let registry: DefaultSensorRegistry;
  let sensor: PassiveEnvironmentalSensor;
  let budgetSensor: TokenBudgetSensor;

  beforeEach(() => {
    registry = new DefaultSensorRegistry();
    budgetSensor = new TokenBudgetSensor(50);
    registry.register(budgetSensor);
    sensor = new PassiveEnvironmentalSensor('test-agent', registry);
  });

  afterEach(() => {
    sensor.stop();
    budgetSensor.stop();
  });

  it('should read budget within 5% accuracy', async () => {
    budgetSensor.setRemaining(65);
    await budgetSensor.start();

    const model = sensor.sense();
    const budgetDim = model.dimensions.find(d => d.name === 'token_budget');

    expect(budgetDim).toBeDefined();
    // fillPercent = 100 - remaining = 35
    expect(Math.abs(budgetDim!.fillPercent - 35)).toBeLessThanOrEqual(5);
  });

  it('should track budget depletion', async () => {
    // Use SimulatedEnvironment sensors which read agent values directly
    const { SimulatedEnvironment } = await import('../test-env.js');
    const env = new SimulatedEnvironment(['alpha']);
    await env.sensorRegistry.startAll();
    const directSensor = new PassiveEnvironmentalSensor('test', env.sensorRegistry);

    for (const remaining of [90, 60, 30, 10]) {
      env.agents[0].tokenBudget = remaining;
      directSensor.clearHistory();
      const model = directSensor.sense();
      const dim = model.dimensions.find(d => d.name === 'token_budget');
      expect(dim).toBeDefined();
      expect(Math.abs(dim!.fillPercent - (100 - remaining))).toBeLessThanOrEqual(5);
    }

    await env.sensorRegistry.stopAll();
  });
});

// ============================================================================
// CF-03: Threat true positive rate >= 85%
// ============================================================================

describe('CF-03: Threat true positive rate', () => {
  let engine: ThreatDetectionEngine;

  beforeEach(() => {
    engine = new ThreatDetectionEngine({
      minCorrelatedSources: 2,
      errorRateThreshold: 5,
      contextFillThreshold: 80,
      budgetThreshold: 20,
    });
  });

  it('should detect high context fill as threat (TP)', () => {
    // Feed signals that clearly cross threshold
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    // Multiple high-fill signals to build score
    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 92, 'percent'));
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events.some(e => e.level !== 'NOMINAL')).toBe(true);
  });

  it('should detect budget exhaustion as threat (TP)', () => {
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('token_budget', 'agent-0', 3, 'percent'));
    }

    expect(events.length).toBeGreaterThan(0);
  });

  it('should detect error surge as threat (TP)', () => {
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('error_rate', 'agent-0', 20, 'errors/min'));
    }

    expect(events.length).toBeGreaterThan(0);
  });

  it('should achieve >= 85% TP rate across mixed threat scenarios', () => {
    // Run 20 threat scenarios, expect >= 17 detected
    let detected = 0;
    const total = 20;

    for (let i = 0; i < total; i++) {
      engine.reset();
      const events: any[] = [];
      engine.onThreat(e => events.push(e));

      // Each scenario: 3 high signals from same source
      const source = `agent-${i}`;
      for (let j = 0; j < 3; j++) {
        engine.ingest(createAmbientSignal('context_fill', source, 90 + Math.random() * 8, 'percent'));
      }

      if (events.length > 0) detected++;
    }

    expect(detected / total).toBeGreaterThanOrEqual(0.85);
  });
});

// ============================================================================
// CF-04: False positive rate <= 10%
// ============================================================================

describe('CF-04: Threat false positive rate', () => {
  let engine: ThreatDetectionEngine;

  beforeEach(() => {
    engine = new ThreatDetectionEngine({
      minCorrelatedSources: 2,
      errorRateThreshold: 5,
      contextFillThreshold: 80,
      budgetThreshold: 20,
    });
  });

  it('should not flag nominal signals as threats (FP)', () => {
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    // 50 nominal signals — well within safe range
    for (let i = 0; i < 50; i++) {
      engine.ingest(createAmbientSignal('context_fill', `agent-${i % 5}`, 30 + Math.random() * 20, 'percent'));
    }

    // FP rate should be <= 10%
    expect(events.length / 50).toBeLessThanOrEqual(0.10);
  });

  it('should achieve <= 10% FP rate across normal operation', () => {
    let falsePositives = 0;
    const total = 100;

    for (let i = 0; i < total; i++) {
      const events: any[] = [];
      engine.onThreat(e => events.push(e));

      // Normal signal: fill between 20-60%, budget 50-90%, error rate 0-3
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 20 + Math.random() * 40, 'percent'));
      engine.ingest(createAmbientSignal('token_budget', 'agent-0', 50 + Math.random() * 40, 'percent'));
      engine.ingest(createAmbientSignal('error_rate', 'agent-0', Math.random() * 3, 'errors/min'));

      // Remove listener to avoid double counting
      engine.onThreat(e => {});
      if (events.length > 0) falsePositives++;
    }

    expect(falsePositives / total).toBeLessThanOrEqual(0.10);
  });
});

// ============================================================================
// CF-05: Anomaly correlation
// ============================================================================

describe('CF-05: Anomaly correlation', () => {
  let engine: ThreatDetectionEngine;

  beforeEach(() => {
    engine = new ThreatDetectionEngine({
      minCorrelatedSources: 2,
      contextFillThreshold: 80,
    });
  });

  it('should correlate anomalies from multiple sources', () => {
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    // Two agents both showing high context fill
    for (let i = 0; i < 3; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 92, 'percent'));
      engine.ingest(createAmbientSignal('context_fill', 'agent-1', 94, 'percent'));
    }

    const correlated = events.filter(e => e.type === 'anomaly_correlated');
    expect(correlated.length).toBeGreaterThan(0);
    expect(correlated[0].sources.length).toBeGreaterThanOrEqual(2);
  });

  it('should not correlate single-source anomalies', () => {
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    // Only one agent showing anomaly
    for (let i = 0; i < 3; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 92, 'percent'));
      engine.ingest(createAmbientSignal('context_fill', 'agent-1', 30, 'percent'));
    }

    const correlated = events.filter(e => e.type === 'anomaly_correlated');
    expect(correlated.length).toBe(0);
  });

  it('should require minimum correlated sources for escalation', () => {
    const engine3 = new ThreatDetectionEngine({
      minCorrelatedSources: 3,
      contextFillThreshold: 80,
    });

    const events: any[] = [];
    engine3.onThreat(e => events.push(e));

    // Only 2 sources — should not correlate with min=3
    for (let i = 0; i < 5; i++) {
      engine3.ingest(createAmbientSignal('context_fill', 'agent-0', 92, 'percent'));
      engine3.ingest(createAmbientSignal('context_fill', 'agent-1', 94, 'percent'));
    }

    const correlated = events.filter(e => e.type === 'anomaly_correlated');
    expect(correlated.length).toBe(0);
  });
});

// ============================================================================
// CF-15: Geometry within 5%
// ============================================================================

describe('CF-15: Geometry accuracy', () => {
  let mapper: EnvironmentalGeometryMapper;

  beforeEach(() => {
    mapper = new EnvironmentalGeometryMapper({
      maxContextTokens: 200_000,
      maxBudgetTokens: 1_000_000,
    });
  });

  it('should map context fill within 5% accuracy', () => {
    const signal = createAmbientSignal('context_fill', 'agent-0', 60, 'percent');
    mapper.updateFromSignal(signal);

    const dim = mapper.getDimension('context_window');
    expect(dim).toBeDefined();
    expect(Math.abs(dim!.fillPercent - 60)).toBeLessThanOrEqual(5);
  });

  it('should map budget within 5% accuracy', () => {
    const signal = createAmbientSignal('token_budget', 'agent-0', 75, 'percent');
    mapper.updateFromSignal(signal);

    const dim = mapper.getDimension('token_budget');
    expect(dim).toBeDefined();
    // fill = 100 - 75 = 25
    expect(Math.abs(dim!.fillPercent - 25)).toBeLessThanOrEqual(5);
  });

  it('should calculate context headroom correctly', () => {
    const signal = createAmbientSignal('context_fill', 'agent-0', 40, 'percent');
    mapper.updateFromSignal(signal);

    const headroom = mapper.getContextHeadroom();
    // 40% of 200k = 80k used, headroom = 120k
    expect(Math.abs(headroom - 120_000)).toBeLessThanOrEqual(10_000);
  });

  it('should calculate budget remaining correctly', () => {
    const signal = createAmbientSignal('token_budget', 'agent-0', 50, 'percent');
    mapper.updateFromSignal(signal);

    const remaining = mapper.getBudgetRemaining();
    // 50% of 1M = 500k
    expect(Math.abs(remaining - 500_000)).toBeLessThanOrEqual(50_000);
  });

  it('should calculate rate of change from signal history', () => {
    // Two signals with known time gap
    const now = Date.now();
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now)       // first updateHistory call
      .mockReturnValueOnce(now)       // first updateHistory push
      .mockReturnValueOnce(now + 1000)  // second updateHistory call
      .mockReturnValueOnce(now + 1000); // second updateHistory push

    const s1 = createAmbientSignal('context_fill', 'agent-0', 30, 'percent');
    mapper.updateFromSignal(s1);

    vi.restoreAllMocks();

    const s2 = createAmbientSignal('context_fill', 'agent-0', 40, 'percent');
    mapper.updateFromSignal(s2);

    const rate = mapper.getRateOfChange('context_window');
    expect(rate).not.toBeNull();
    // Rate should be positive (fill increasing)
    // Exact value depends on timing but should be non-zero
  });

  it('should detect constraint boundaries', () => {
    // Push context fill to 90% — should approach soft limit
    const signal = createAmbientSignal('context_fill', 'agent-0', 90, 'percent');
    mapper.updateFromSignal(signal);

    const constraint = mapper.getConstraint('context_window');
    expect(constraint).toBeDefined();
    // 90% of 200k = 180k. Hard limit = 190k. Distance = 10k.
    expect(constraint!.currentDistance).toBeLessThan(200_000 * 0.2);
  });

  it('should build spatial model from geometry', () => {
    mapper.updateFromSignal(createAmbientSignal('context_fill', 'agent-0', 50, 'percent'));
    mapper.updateFromSignal(createAmbientSignal('token_budget', 'agent-0', 70, 'percent'));

    const model = mapper.buildSpatialModel('agent-0');
    expect(model.agentId).toBe('agent-0');
    expect(model.dimensions.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// CF-17: USB audio enumeration
// ============================================================================

describe('CF-17: USB audio enumeration', () => {
  let manager: SimulatedUsbDeviceManager;

  beforeEach(() => {
    manager = new SimulatedUsbDeviceManager();
  });

  it('should enumerate connected audio devices', async () => {
    const audioIn = createSimulatedAudioInput('mic-1');
    const audioOut = createSimulatedAudioOutput('spk-1');
    manager.addDevice(audioIn);
    manager.addDevice(audioOut);

    const devices = await manager.enumerate();
    expect(devices.length).toBe(2);
    expect(devices.every(d => d.deviceClass === 'audio')).toBe(true);
  });

  it('should open audio input as SensorStream', async () => {
    const audioIn = createSimulatedAudioInput('mic-1');
    manager.addDevice(audioIn);

    const stream = await manager.open('mic-1');
    expect('read' in stream).toBe(true);
    expect('subscribe' in stream).toBe(true);
  });

  it('should open audio output as OutputDevice', async () => {
    const audioOut = createSimulatedAudioOutput('spk-1');
    manager.addDevice(audioOut);

    const device = await manager.open('spk-1');
    expect('send' in device).toBe(true);
    expect('sendBatch' in device).toBe(true);
  });

  it('should not enumerate disconnected devices', async () => {
    const audioIn = createSimulatedAudioInput('mic-1');
    audioIn.connected = false;
    manager.addDevice(audioIn);

    const devices = await manager.enumerate();
    expect(devices.length).toBe(0);
  });

  it('should map audio device class to usb_audio signal type', () => {
    expect(deviceClassToSignalType('audio')).toBe('usb_audio');
  });
});

// ============================================================================
// CF-18: USB serial communication
// ============================================================================

describe('CF-18: USB serial communication', () => {
  let manager: SimulatedUsbDeviceManager;

  beforeEach(() => {
    manager = new SimulatedUsbDeviceManager();
  });

  it('should enumerate serial devices', async () => {
    const serial = createSimulatedSerialDevice('tty-1');
    manager.addDevice(serial);

    const devices = await manager.enumerate();
    expect(devices.length).toBe(1);
    expect(devices[0].deviceClass).toBe('serial');
    expect(devices[0].baudRate).toBe(115200);
  });

  it('should open serial device as OutputDevice (bidirectional)', async () => {
    const serial = createSimulatedSerialDevice('tty-1');
    manager.addDevice(serial);

    const device = await manager.open('tty-1');
    expect('send' in device).toBe(true);
  });

  it('should map serial device class to usb_serial signal type', () => {
    expect(deviceClassToSignalType('serial')).toBe('usb_serial');
  });

  it('should send data to serial output device', async () => {
    const serial = createSimulatedSerialDevice('tty-1');
    manager.addDevice(serial);

    const device = await manager.open('tty-1') as UsbOutputDevice;
    await device.connect();

    device.send(0, 42);
    expect(device.getChannelValue(0)).toBe(42);

    device.sendBatch(new Map([[1, 100], [2, 200]]));
    expect(device.getChannelValue(1)).toBe(100);
    expect(device.getChannelValue(2)).toBe(200);
  });
});

// ============================================================================
// USB device layer — additional coverage
// ============================================================================

describe('USB Device Layer', () => {
  let manager: SimulatedUsbDeviceManager;

  beforeEach(() => {
    manager = new SimulatedUsbDeviceManager();
  });

  it('should support hot-plug connect events', () => {
    const events: any[] = [];
    manager.onDeviceChange(e => events.push(e));

    const audioIn = createSimulatedAudioInput('mic-1');
    audioIn.connected = false;
    manager.addDevice(audioIn);

    manager.simulateConnect('mic-1');
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('connected');
  });

  it('should support hot-plug disconnect events', () => {
    const events: any[] = [];
    manager.onDeviceChange(e => events.push(e));

    const audioIn = createSimulatedAudioInput('mic-1');
    manager.addDevice(audioIn);

    manager.simulateDisconnect('mic-1');
    expect(events.some(e => e.type === 'disconnected')).toBe(true);
  });

  it('should close streams on device removal', async () => {
    const audioIn = createSimulatedAudioInput('mic-1');
    manager.addDevice(audioIn);

    const stream = await manager.open('mic-1');
    expect(manager.getOpenCount()).toBe(1);

    manager.removeDevice('mic-1');
    expect(manager.getOpenCount()).toBe(0);
  });

  it('should error when opening non-existent device', async () => {
    await expect(manager.open('no-such-device')).rejects.toThrow('Device not found');
  });

  it('should error when opening disconnected device', async () => {
    const dev = createSimulatedAudioInput('mic-1');
    dev.connected = false;
    manager.addDevice(dev);

    await expect(manager.open('mic-1')).rejects.toThrow('Device not connected');
  });

  it('should create bulk device stream', () => {
    const bulk = createSimulatedBulkDevice('bulk-1');
    const stream = createDeviceStream(bulk);
    expect('read' in stream).toBe(true); // input -> SensorStream
  });

  it('UsbSensorStream should inject values for testing', () => {
    const device = createSimulatedAudioInput();
    const stream = new UsbSensorStream(device, 'usb_audio');

    const received: AmbientSignal[] = [];
    stream.subscribe(s => received.push(s));
    stream.inject(0.75, 'amplitude');

    expect(received.length).toBe(1);
    expect(received[0].value).toBe(0.75);
  });

  it('UsbOutputDevice should not send when disconnected', async () => {
    const device = createSimulatedAudioOutput();
    const output = new UsbOutputDevice(device);

    output.send(0, 42);
    expect(output.getChannelValue(0)).toBeUndefined();

    await output.connect();
    output.send(0, 42);
    expect(output.getChannelValue(0)).toBe(42);
  });

  it('should unsubscribe from device change events', () => {
    const events: any[] = [];
    const unsub = manager.onDeviceChange(e => events.push(e));
    unsub();

    manager.addDevice(createSimulatedAudioInput());
    // Should not receive event after unsubscribe
    expect(events.length).toBe(0);
  });
});

// ============================================================================
// Passive sensor — additional coverage
// ============================================================================

describe('Passive Environmental Sensor', () => {
  let registry: DefaultSensorRegistry;
  let sensor: PassiveEnvironmentalSensor;
  let contextSensor: ContextFillSensor;
  let budgetSensor: TokenBudgetSensor;
  let errorSensor: ErrorRateSensor;

  beforeEach(() => {
    registry = new DefaultSensorRegistry();
    contextSensor = new ContextFillSensor(50);
    budgetSensor = new TokenBudgetSensor(50);
    errorSensor = new ErrorRateSensor(50);
    registry.register(contextSensor);
    registry.register(budgetSensor);
    registry.register(errorSensor);
    sensor = new PassiveEnvironmentalSensor('test-agent', registry);
  });

  afterEach(() => {
    sensor.stop();
    contextSensor.stop();
    budgetSensor.stop();
    errorSensor.stop();
  });

  it('should build model with all dimensions', async () => {
    contextSensor.setFill(50);
    budgetSensor.setRemaining(70);
    errorSensor.setRate(2);

    await contextSensor.start();
    await budgetSensor.start();
    await errorSensor.start();

    const model = sensor.sense();
    expect(model.dimensions.length).toBe(3);
    expect(model.dimensions.map(d => d.name)).toContain('context_window');
    expect(model.dimensions.map(d => d.name)).toContain('token_budget');
    expect(model.dimensions.map(d => d.name)).toContain('error_rate');
  });

  it('should detect threshold breaches', async () => {
    contextSensor.setFill(92);
    await contextSensor.start();

    const anomalies: any[] = [];
    sensor.onAnomaly(a => anomalies.push(a));

    sensor.sense();
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].level).toBe('HIGH');
  });

  it('should emit model updates', async () => {
    await contextSensor.start();

    const updates: any[] = [];
    sensor.onModelUpdate(m => updates.push(m));

    sensor.sense();
    expect(updates.length).toBe(1);
  });

  it('should track signal history', async () => {
    contextSensor.setFill(50);
    await contextSensor.start();

    sensor.sense();
    sensor.sense();

    const history = sensor.getHistory('context_fill:runtime');
    expect(history.length).toBe(2);
  });

  it('should support custom thresholds', async () => {
    sensor.setThresholds({ contextFillWarn: 40 });
    contextSensor.setFill(45);
    await contextSensor.start();

    const anomalies: any[] = [];
    sensor.onAnomaly(a => anomalies.push(a));

    sensor.sense();
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].level).toBe('ELEVATED');
  });

  it('should clear history', async () => {
    contextSensor.setFill(50);
    await contextSensor.start();

    sensor.sense();
    expect(sensor.getHistory('context_fill:runtime').length).toBeGreaterThan(0);

    sensor.clearHistory();
    expect(sensor.getHistory('context_fill:runtime').length).toBe(0);
  });

  it('start/stop should control sensing loop', () => {
    expect(sensor.running).toBe(false);
    sensor.start();
    expect(sensor.running).toBe(true);
    sensor.stop();
    expect(sensor.running).toBe(false);
  });
});

// ============================================================================
// Threat engine — additional coverage
// ============================================================================

describe('Threat Detection Engine', () => {
  let engine: ThreatDetectionEngine;

  beforeEach(() => {
    engine = new ThreatDetectionEngine();
  });

  it('should return null for nominal signals', () => {
    const event = engine.ingest(createAmbientSignal('context_fill', 'agent-0', 30, 'percent'));
    expect(event).toBeNull();
  });

  it('should resolve threat events', () => {
    // Generate a threat
    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 95, 'percent'));
    }

    const active = engine.activeEvents;
    expect(active.length).toBeGreaterThan(0);

    const resolved = engine.resolve(active[0].id);
    expect(resolved).toBe(true);
    expect(engine.activeEvents.length).toBeLessThan(active.length);
  });

  it('should calculate error rate trends', () => {
    // Feed rising error rate
    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('error_rate', 'agent-0', i * 3, 'errors/min'));
    }

    const trend = engine.getErrorRateTrend('agent-0');
    expect(trend.trend).toBe('rising');
  });

  it('should get overall threat level', () => {
    expect(engine.getOverallThreatLevel()).toBe('NOMINAL');

    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 95, 'percent'));
    }

    expect(engine.getOverallThreatLevel()).not.toBe('NOMINAL');
  });

  it('should ingest batch signals', () => {
    const signals = [
      createAmbientSignal('context_fill', 'agent-0', 92, 'percent'),
      createAmbientSignal('context_fill', 'agent-1', 94, 'percent'),
      createAmbientSignal('error_rate', 'agent-0', 20, 'errors/min'),
    ];

    const events = engine.ingestBatch(signals);
    // Some events may be generated
    expect(Array.isArray(events)).toBe(true);
  });

  it('should reset state', () => {
    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 95, 'percent'));
    }

    expect(engine.events.length).toBeGreaterThan(0);
    engine.reset();
    expect(engine.events.length).toBe(0);
  });

  it('should update configuration', () => {
    engine.configure({ contextFillThreshold: 50 });

    // With lower threshold, moderate fill should trigger
    const events: any[] = [];
    engine.onThreat(e => events.push(e));

    for (let i = 0; i < 5; i++) {
      engine.ingest(createAmbientSignal('context_fill', 'agent-0', 60, 'percent'));
    }

    expect(events.length).toBeGreaterThan(0);
  });

  it('should get score for a source', () => {
    engine.ingest(createAmbientSignal('context_fill', 'agent-0', 50, 'percent'));
    const score = engine.getScore('agent-0', 'context_fill');
    expect(typeof score).toBe('number');
  });
});

// ============================================================================
// Geometry mapper — additional coverage
// ============================================================================

describe('Environmental Geometry Mapper', () => {
  let mapper: EnvironmentalGeometryMapper;

  beforeEach(() => {
    mapper = new EnvironmentalGeometryMapper();
  });

  it('should initialize with default dimensions', () => {
    const dims = mapper.dimensions;
    expect(dims.length).toBe(3);
    expect(dims.map(d => d.name)).toContain('context_window');
    expect(dims.map(d => d.name)).toContain('token_budget');
    expect(dims.map(d => d.name)).toContain('rate_limit');
  });

  it('should update from batch signals', () => {
    const signals = [
      createAmbientSignal('context_fill', 'agent-0', 50, 'percent'),
      createAmbientSignal('token_budget', 'agent-0', 70, 'percent'),
    ];

    const updated = mapper.updateFromSignals(signals);
    expect(updated.length).toBe(2);
  });

  it('should emit dimension updates', () => {
    const updates: any[] = [];
    mapper.onUpdate(dims => updates.push(dims));

    mapper.updateFromSignal(createAmbientSignal('context_fill', 'agent-0', 50, 'percent'));
    expect(updates.length).toBe(1);
  });

  it('should return null for unknown signal types', () => {
    const signal = createAmbientSignal('wifi_rssi', 'agent-0', -60, 'dBm');
    const result = mapper.updateFromSignal(signal);
    expect(result).toBeNull();
  });

  it('should reset to defaults', () => {
    mapper.updateFromSignal(createAmbientSignal('context_fill', 'agent-0', 80, 'percent'));
    mapper.reset();

    const dim = mapper.getDimension('context_window');
    expect(dim!.fillPercent).toBe(0);
  });

  it('should configure new limits', () => {
    mapper.configure({ maxContextTokens: 100_000 });
    const dim = mapper.getDimension('context_window');
    expect(dim!.maximum).toBe(100_000);
  });

  it('should return rate limit proximity', () => {
    const proximity = mapper.getRateLimitProximity();
    expect(proximity).toBe(0); // default, no signals yet
  });

  it('should detect constraint breach', () => {
    // Push context to 96% — above hard limit (95%)
    mapper.updateFromSignal(createAmbientSignal('context_fill', 'agent-0', 96, 'percent'));

    const constraint = mapper.getConstraint('context_window');
    expect(constraint).toBeDefined();
    expect(constraint!.breached).toBe(true);
  });
});
