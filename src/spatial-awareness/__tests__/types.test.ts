import { describe, it, expect } from 'vitest';
import {
  ThreatLevelSchema,
  ThreatClassificationSchema,
  FrogPhaseSchema,
  CommTierSchema,
  AmbientSignalTypeSchema,
  AmbientSignalSchema,
  ThreatEventSchema,
  CoordinationMessageSchema,
  ResourceDimensionSchema,
  SpatialModelSchema,
  OutputMappingSchema,
  UsbDeviceSchema,
  LaserInterlockStatusSchema,
} from '../types.js';

describe('Spatial Awareness — Types & Schemas (0A)', () => {
  describe('ThreatLevelSchema', () => {
    it('accepts valid threat levels', () => {
      expect(ThreatLevelSchema.parse('NOMINAL')).toBe('NOMINAL');
      expect(ThreatLevelSchema.parse('ELEVATED')).toBe('ELEVATED');
      expect(ThreatLevelSchema.parse('HIGH')).toBe('HIGH');
      expect(ThreatLevelSchema.parse('BLOCK')).toBe('BLOCK');
    });

    it('rejects invalid threat levels', () => {
      expect(() => ThreatLevelSchema.parse('LOW')).toThrow();
      expect(() => ThreatLevelSchema.parse('')).toThrow();
    });
  });

  describe('FrogPhaseSchema', () => {
    it('accepts all 6 phases', () => {
      const phases = ['BASELINE', 'SILENCE', 'ASSESS', 'PROBE', 'CLASSIFY', 'RESUME'];
      for (const phase of phases) {
        expect(FrogPhaseSchema.parse(phase)).toBe(phase);
      }
    });
  });

  describe('CommTierSchema', () => {
    it('accepts all 3 tiers', () => {
      expect(CommTierSchema.parse('COVERT')).toBe('COVERT');
      expect(CommTierSchema.parse('DIRECTED')).toBe('DIRECTED');
      expect(CommTierSchema.parse('BROADCAST')).toBe('BROADCAST');
    });
  });

  describe('AmbientSignalSchema', () => {
    it('validates a computational signal', () => {
      const signal = AmbientSignalSchema.parse({
        id: 'sig-1',
        type: 'context_fill',
        source: 'agent-0',
        value: 62.5,
        unit: 'percent',
        timestamp: Date.now(),
      });
      expect(signal.type).toBe('context_fill');
      expect(signal.confidence).toBe(1); // default
    });

    it('validates a physical sensor signal', () => {
      const signal = AmbientSignalSchema.parse({
        id: 'sig-2',
        type: 'usb_audio',
        source: 'usb-mic-0',
        value: -32.5,
        unit: 'dBFS',
        timestamp: Date.now(),
        confidence: 0.95,
      });
      expect(signal.type).toBe('usb_audio');
      expect(signal.confidence).toBe(0.95);
    });

    it('supports all signal types including USB and physical', () => {
      const physicalTypes = [
        'usb_audio', 'usb_serial', 'usb_bulk',
        'accelerometer', 'gyroscope', 'magnetometer',
        'barometer', 'gps', 'wifi_rssi', 'bluetooth_rssi',
        'uwb_range', 'temperature', 'light_level', 'rf_spectrum',
      ];
      for (const type of physicalTypes) {
        expect(() => AmbientSignalTypeSchema.parse(type)).not.toThrow();
      }
    });

    it('allows passthrough of extra fields', () => {
      const signal = AmbientSignalSchema.parse({
        id: 'sig-3',
        type: 'temperature',
        source: 'esp32-0',
        value: 22.5,
        timestamp: Date.now(),
        customField: 'preserved',
      });
      expect((signal as Record<string, unknown>).customField).toBe('preserved');
    });
  });

  describe('ThreatEventSchema', () => {
    it('validates a threat event with defaults', () => {
      const event = ThreatEventSchema.parse({
        id: 'threat-1',
        type: 'dependency_failure',
        level: 'HIGH',
        sources: ['agent-2'],
        description: 'npm install failed',
        timestamp: Date.now(),
      });
      expect(event.classification).toBe('UNKNOWN');
      expect(event.probeResults).toEqual([]);
      expect(event.resolved).toBe(false);
    });

    it('validates a threat with probe results', () => {
      const event = ThreatEventSchema.parse({
        id: 'threat-2',
        type: 'agent_silence',
        level: 'ELEVATED',
        sources: ['agent-0', 'agent-1'],
        description: 'Two agents stopped producing output',
        timestamp: Date.now(),
        correlationId: 'corr-1',
        probeResults: [
          { probeId: 'probe-1', result: 'safe', timestamp: Date.now() },
        ],
      });
      expect(event.probeResults).toHaveLength(1);
    });
  });

  describe('CoordinationMessageSchema', () => {
    it('validates a broadcast message', () => {
      const msg = CoordinationMessageSchema.parse({
        id: 'msg-1',
        tier: 'BROADCAST',
        sender: 'flight',
        phase: 'SILENCE',
        timestamp: Date.now(),
      });
      expect(msg.recipients).toEqual([]);
      expect(msg.ttl).toBe(30_000);
    });

    it('validates a directed message', () => {
      const msg = CoordinationMessageSchema.parse({
        id: 'msg-2',
        tier: 'DIRECTED',
        sender: 'topo',
        recipients: ['agent-0'],
        phase: 'PROBE',
        payload: { probeTarget: 'dependency-x' },
        timestamp: Date.now(),
        ttl: 5_000,
      });
      expect(msg.recipients).toEqual(['agent-0']);
    });
  });

  describe('SpatialModelSchema', () => {
    it('validates a full spatial model', () => {
      const model = SpatialModelSchema.parse({
        agentId: 'agent-0',
        timestamp: Date.now(),
        dimensions: [
          { name: 'context_window', current: 62, maximum: 100, unit: 'percent', fillPercent: 62, rateOfChange: 0.1 },
          { name: 'token_budget', current: 34, maximum: 100, unit: 'percent', fillPercent: 66, rateOfChange: -0.5 },
        ],
        peerCount: 4,
        peersActive: 3,
        peersIdle: 1,
      });
      expect(model.threatLevel).toBe('NOMINAL');
      expect(model.activePhase).toBe('BASELINE');
      expect(model.dimensions).toHaveLength(2);
    });
  });

  describe('OutputMappingSchema', () => {
    it('validates a sensor-to-output mapping', () => {
      const mapping = OutputMappingSchema.parse({
        id: 'map-1',
        source: 'accelerometer',
        target: 'led_color',
        range: [0, 255],
      });
      expect(mapping.enabled).toBe(true);
    });
  });

  describe('UsbDeviceSchema', () => {
    it('validates an input device', () => {
      const device = UsbDeviceSchema.parse({
        id: 'usb-mic-0',
        name: 'USB Microphone',
        deviceClass: 'audio',
        direction: 'input',
        path: '/dev/snd/pcmC1D0c',
        sampleRate: 48000,
      });
      expect(device.connected).toBe(false);
    });

    it('validates an output device', () => {
      const device = UsbDeviceSchema.parse({
        id: 'dmx-0',
        name: 'ENTTEC Open DMX',
        deviceClass: 'serial',
        direction: 'output',
        path: '/dev/ttyUSB0',
        baudRate: 250000,
      });
      expect(device.deviceClass).toBe('serial');
    });
  });

  describe('LaserInterlockStatusSchema', () => {
    it('accepts all interlock states', () => {
      const states = ['ENGAGED', 'DISENGAGED', 'FAULT', 'UNKNOWN'];
      for (const state of states) {
        expect(LaserInterlockStatusSchema.parse(state)).toBe(state);
      }
    });
  });

  describe('ThreatClassificationSchema', () => {
    it('includes OPPORTUNITY for positive reclassification', () => {
      expect(ThreatClassificationSchema.parse('OPPORTUNITY')).toBe('OPPORTUNITY');
    });
  });
});
