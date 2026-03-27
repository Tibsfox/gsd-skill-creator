import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createAmbientSignal,
  ContextFillSensor,
  TokenBudgetSensor,
  ErrorRateSensor,
  DefaultSensorRegistry,
  DefaultOutputRegistry,
  type OutputDevice,
} from '../sensor-interface.js';

describe('Spatial Awareness — Sensor Interface (0B)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAmbientSignal', () => {
    it('creates a signal with unique ID and timestamp', () => {
      const signal = createAmbientSignal('context_fill', 'runtime', 62.5, 'percent');
      expect(signal.id).toMatch(/^context_fill-/);
      expect(signal.type).toBe('context_fill');
      expect(signal.source).toBe('runtime');
      expect(signal.value).toBe(62.5);
      expect(signal.unit).toBe('percent');
      expect(signal.confidence).toBe(1);
      expect(signal.timestamp).toBeGreaterThan(0);
    });

    it('generates different IDs for successive signals', () => {
      const a = createAmbientSignal('error_rate', 'src', 0);
      const b = createAmbientSignal('error_rate', 'src', 0);
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('ContextFillSensor', () => {
    it('starts inactive', () => {
      const sensor = new ContextFillSensor(100);
      expect(sensor.active).toBe(false);
      expect(sensor.read()).toBeNull();
    });

    it('produces signals after start', async () => {
      vi.useFakeTimers();
      const sensor = new ContextFillSensor(100);
      sensor.setFill(42);
      await sensor.start();

      expect(sensor.active).toBe(true);
      const signal = sensor.read();
      expect(signal).not.toBeNull();
      expect(signal!.value).toBe(42);
      expect(signal!.type).toBe('context_fill');

      await sensor.stop();
    });

    it('notifies subscribers on each poll', async () => {
      vi.useFakeTimers();
      const sensor = new ContextFillSensor(100);
      const listener = vi.fn();
      sensor.subscribe(listener);
      sensor.setFill(50);

      await sensor.start();
      expect(listener).toHaveBeenCalledTimes(1); // immediate poll
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ value: 50 }));

      vi.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(2);

      await sensor.stop();
    });

    it('unsubscribe stops notifications', async () => {
      vi.useFakeTimers();
      const sensor = new ContextFillSensor(100);
      const listener = vi.fn();
      const unsub = sensor.subscribe(listener);
      sensor.setFill(50);

      await sensor.start();
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      vi.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(1); // no new calls

      await sensor.stop();
    });

    it('clamps fill to 0-100', async () => {
      vi.useFakeTimers();
      const sensor = new ContextFillSensor(100);

      sensor.setFill(150);
      await sensor.start();
      expect(sensor.read()!.value).toBe(100);

      sensor.setFill(-10);
      vi.advanceTimersByTime(100);
      expect(sensor.read()!.value).toBe(0);

      await sensor.stop();
    });

    it('is idempotent on start/stop', async () => {
      const sensor = new ContextFillSensor(100);
      await sensor.start();
      await sensor.start(); // no-op
      expect(sensor.active).toBe(true);

      await sensor.stop();
      await sensor.stop(); // no-op
      expect(sensor.active).toBe(false);
    });
  });

  describe('TokenBudgetSensor', () => {
    it('reports remaining budget', async () => {
      vi.useFakeTimers();
      const sensor = new TokenBudgetSensor(100);
      sensor.setRemaining(75);
      await sensor.start();

      const signal = sensor.read();
      expect(signal!.value).toBe(75);
      expect(signal!.type).toBe('token_budget');

      await sensor.stop();
    });
  });

  describe('ErrorRateSensor', () => {
    it('reports error rate', async () => {
      vi.useFakeTimers();
      const sensor = new ErrorRateSensor(100);
      sensor.setRate(3.5);
      await sensor.start();

      const signal = sensor.read();
      expect(signal!.value).toBe(3.5);
      expect(signal!.type).toBe('error_rate');
      expect(signal!.unit).toBe('errors/min');

      await sensor.stop();
    });
  });

  describe('DefaultSensorRegistry', () => {
    it('registers and retrieves sensors', () => {
      const registry = new DefaultSensorRegistry();
      const sensor = new ContextFillSensor();
      registry.register(sensor);

      expect(registry.get('context-fill')).toBe(sensor);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('filters by type', () => {
      const registry = new DefaultSensorRegistry();
      registry.register(new ContextFillSensor());
      registry.register(new TokenBudgetSensor());
      registry.register(new ErrorRateSensor());

      expect(registry.getByType('context_fill')).toHaveLength(1);
      expect(registry.getByType('token_budget')).toHaveLength(1);
      expect(registry.getByType('usb_audio')).toHaveLength(0);
    });

    it('tracks active sensors', async () => {
      vi.useFakeTimers();
      const registry = new DefaultSensorRegistry();
      const s1 = new ContextFillSensor(100);
      const s2 = new TokenBudgetSensor(100);
      registry.register(s1);
      registry.register(s2);

      expect(registry.getActive()).toHaveLength(0);
      await s1.start();
      expect(registry.getActive()).toHaveLength(1);

      await s1.stop();
    });

    it('starts and stops all sensors', async () => {
      vi.useFakeTimers();
      const registry = new DefaultSensorRegistry();
      registry.register(new ContextFillSensor(100));
      registry.register(new TokenBudgetSensor(100));

      await registry.startAll();
      expect(registry.getActive()).toHaveLength(2);

      await registry.stopAll();
      expect(registry.getActive()).toHaveLength(0);
    });

    it('unregisters and stops active sensor', async () => {
      vi.useFakeTimers();
      const registry = new DefaultSensorRegistry();
      const sensor = new ContextFillSensor(100);
      registry.register(sensor);
      await sensor.start();

      registry.unregister('context-fill');
      expect(registry.get('context-fill')).toBeUndefined();
      expect(sensor.active).toBe(false);
    });
  });

  describe('DefaultOutputRegistry', () => {
    function mockOutputDevice(id: string): OutputDevice {
      let _connected = false;
      return {
        id,
        name: `Mock ${id}`,
        deviceClass: 'serial',
        direction: 'output',
        get connected() { return _connected; },
        connect: vi.fn(async () => { _connected = true; }),
        disconnect: vi.fn(async () => { _connected = false; }),
        send: vi.fn(),
        sendBatch: vi.fn(),
      };
    }

    it('registers and retrieves output devices', () => {
      const registry = new DefaultOutputRegistry();
      const device = mockOutputDevice('dmx-0');
      registry.register(device);

      expect(registry.get('dmx-0')).toBe(device);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('tracks connected devices', async () => {
      const registry = new DefaultOutputRegistry();
      const d1 = mockOutputDevice('dmx-0');
      const d2 = mockOutputDevice('led-0');
      registry.register(d1);
      registry.register(d2);

      expect(registry.getConnected()).toHaveLength(0);
      await d1.connect();
      expect(registry.getConnected()).toHaveLength(1);

      await d1.disconnect();
    });

    it('connects and disconnects all devices', async () => {
      const registry = new DefaultOutputRegistry();
      registry.register(mockOutputDevice('dmx-0'));
      registry.register(mockOutputDevice('led-0'));

      await registry.connectAll();
      expect(registry.getConnected()).toHaveLength(2);

      await registry.disconnectAll();
      expect(registry.getConnected()).toHaveLength(0);
    });
  });
});
