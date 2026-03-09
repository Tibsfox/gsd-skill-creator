/**
 * Spatial Awareness — Sensor Interface
 * Paula Chipset Release 2
 *
 * Unified contract for all sensors — computational and physical.
 * A sensor is anything that produces ambient signals without
 * requiring active queries. The backend implementation varies;
 * the data flow does not.
 */

import type {
  AmbientSignal,
  AmbientSignalType,
  UsbDevice,
  UsbDeviceClass,
  UsbDeviceDirection,
} from './types.js';

// ============================================================================
// Sensor interface — the unified contract
// ============================================================================

export interface SensorStream {
  readonly id: string;
  readonly type: AmbientSignalType;
  readonly source: string;
  readonly active: boolean;

  /** Start producing signals. No-op if already active. */
  start(): Promise<void>;

  /** Stop producing signals. No-op if already stopped. */
  stop(): Promise<void>;

  /** Read the latest signal value without side effects. */
  read(): AmbientSignal | null;

  /** Subscribe to signal updates. Returns unsubscribe function. */
  subscribe(listener: SensorListener): () => void;
}

export type SensorListener = (signal: AmbientSignal) => void;

// ============================================================================
// Output interface — the chorus sings back
// ============================================================================

export interface OutputDevice {
  readonly id: string;
  readonly name: string;
  readonly deviceClass: UsbDeviceClass;
  readonly direction: UsbDeviceDirection;
  readonly connected: boolean;

  /** Connect to the output device. */
  connect(): Promise<void>;

  /** Disconnect from the output device. */
  disconnect(): Promise<void>;

  /** Send a value to the output device. */
  send(channel: number, value: number): void;

  /** Send a batch of values. */
  sendBatch(values: Map<number, number>): void;
}

// ============================================================================
// Sensor registry — manages all sensor streams
// ============================================================================

export interface SensorRegistry {
  /** Register a new sensor stream. */
  register(sensor: SensorStream): void;

  /** Unregister a sensor stream. */
  unregister(id: string): void;

  /** Get a sensor by ID. */
  get(id: string): SensorStream | undefined;

  /** Get all sensors of a given type. */
  getByType(type: AmbientSignalType): SensorStream[];

  /** Get all active sensors. */
  getActive(): SensorStream[];

  /** Get all registered sensors. */
  getAll(): SensorStream[];

  /** Start all sensors. */
  startAll(): Promise<void>;

  /** Stop all sensors. */
  stopAll(): Promise<void>;
}

// ============================================================================
// Output registry — manages all output devices
// ============================================================================

export interface OutputRegistry {
  register(device: OutputDevice): void;
  unregister(id: string): void;
  get(id: string): OutputDevice | undefined;
  getAll(): OutputDevice[];
  getConnected(): OutputDevice[];
  connectAll(): Promise<void>;
  disconnectAll(): Promise<void>;
}

// ============================================================================
// USB device manager interface
// ============================================================================

export interface UsbDeviceManager {
  /** Enumerate connected USB devices. */
  enumerate(): Promise<UsbDevice[]>;

  /** Open a connection to a USB device. */
  open(deviceId: string): Promise<SensorStream | OutputDevice>;

  /** Close a connection to a USB device. */
  close(deviceId: string): Promise<void>;

  /** Subscribe to device connect/disconnect events. */
  onDeviceChange(listener: (event: UsbDeviceEvent) => void): () => void;
}

export interface UsbDeviceEvent {
  type: 'connected' | 'disconnected';
  device: UsbDevice;
  timestamp: number;
}

// ============================================================================
// Default implementations — computational sensors
// ============================================================================

export function createAmbientSignal(
  type: AmbientSignalType,
  source: string,
  value: number,
  unit?: string,
): AmbientSignal {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    source,
    value,
    unit,
    timestamp: Date.now(),
    confidence: 1,
  };
}

/**
 * Base class for computational sensors that poll ambient values.
 */
export abstract class ComputationalSensor implements SensorStream {
  readonly id: string;
  readonly type: AmbientSignalType;
  readonly source: string;
  private _active = false;
  private _latest: AmbientSignal | null = null;
  private _listeners: Set<SensorListener> = new Set();
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _pollMs: number;

  constructor(id: string, type: AmbientSignalType, source: string, pollMs = 1000) {
    this.id = id;
    this.type = type;
    this.source = source;
    this._pollMs = pollMs;
  }

  get active(): boolean { return this._active; }

  async start(): Promise<void> {
    if (this._active) return;
    this._active = true;
    this._interval = setInterval(() => this._poll(), this._pollMs);
    this._poll(); // immediate first read
  }

  async stop(): Promise<void> {
    if (!this._active) return;
    this._active = false;
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  read(): AmbientSignal | null {
    return this._latest;
  }

  subscribe(listener: SensorListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Subclasses implement this to sample the ambient value. */
  protected abstract sample(): number;

  protected unit(): string | undefined { return undefined; }

  private _poll(): void {
    const value = this.sample();
    const signal = createAmbientSignal(this.type, this.source, value, this.unit());
    this._latest = signal;
    for (const listener of this._listeners) {
      listener(signal);
    }
  }
}

// ============================================================================
// Concrete computational sensors
// ============================================================================

/**
 * Context fill sensor — reads context window utilization.
 * In a real system, reads from runtime telemetry.
 * Here, provides the interface contract with a stub.
 */
export class ContextFillSensor extends ComputationalSensor {
  private _fill = 0;

  constructor(pollMs = 1000) {
    super('context-fill', 'context_fill', 'runtime', pollMs);
  }

  /** Set fill level externally (0-100). */
  setFill(percent: number): void {
    this._fill = Math.max(0, Math.min(100, percent));
  }

  protected sample(): number { return this._fill; }
  protected unit(): string { return 'percent'; }
}

/**
 * Token budget sensor — reads remaining token budget.
 */
export class TokenBudgetSensor extends ComputationalSensor {
  private _remaining = 100;

  constructor(pollMs = 1000) {
    super('token-budget', 'token_budget', 'runtime', pollMs);
  }

  setRemaining(percent: number): void {
    this._remaining = Math.max(0, Math.min(100, percent));
  }

  protected sample(): number { return this._remaining; }
  protected unit(): string { return 'percent'; }
}

/**
 * Error rate sensor — reads error rate trend.
 */
export class ErrorRateSensor extends ComputationalSensor {
  private _rate = 0;

  constructor(pollMs = 2000) {
    super('error-rate', 'error_rate', 'runtime', pollMs);
  }

  setRate(errorsPerMinute: number): void {
    this._rate = Math.max(0, errorsPerMinute);
  }

  protected sample(): number { return this._rate; }
  protected unit(): string { return 'errors/min'; }
}

// ============================================================================
// Default sensor registry implementation
// ============================================================================

export class DefaultSensorRegistry implements SensorRegistry {
  private _sensors = new Map<string, SensorStream>();

  register(sensor: SensorStream): void {
    this._sensors.set(sensor.id, sensor);
  }

  unregister(id: string): void {
    const sensor = this._sensors.get(id);
    if (sensor?.active) {
      sensor.stop();
    }
    this._sensors.delete(id);
  }

  get(id: string): SensorStream | undefined {
    return this._sensors.get(id);
  }

  getByType(type: AmbientSignalType): SensorStream[] {
    return [...this._sensors.values()].filter(s => s.type === type);
  }

  getActive(): SensorStream[] {
    return [...this._sensors.values()].filter(s => s.active);
  }

  getAll(): SensorStream[] {
    return [...this._sensors.values()];
  }

  async startAll(): Promise<void> {
    await Promise.all([...this._sensors.values()].map(s => s.start()));
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this._sensors.values()].map(s => s.stop()));
  }
}

// ============================================================================
// Default output registry implementation
// ============================================================================

export class DefaultOutputRegistry implements OutputRegistry {
  private _devices = new Map<string, OutputDevice>();

  register(device: OutputDevice): void {
    this._devices.set(device.id, device);
  }

  unregister(id: string): void {
    const device = this._devices.get(id);
    if (device?.connected) {
      device.disconnect();
    }
    this._devices.delete(id);
  }

  get(id: string): OutputDevice | undefined {
    return this._devices.get(id);
  }

  getAll(): OutputDevice[] {
    return [...this._devices.values()];
  }

  getConnected(): OutputDevice[] {
    return [...this._devices.values()].filter(d => d.connected);
  }

  async connectAll(): Promise<void> {
    await Promise.all([...this._devices.values()].map(d => d.connect()));
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this._devices.values()].map(d => d.disconnect()));
  }
}
