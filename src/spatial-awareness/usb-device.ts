/**
 * Spatial Awareness — USB Device Layer
 * Paula Chipset Release 2, Wave 1 Track A (1F)
 *
 * Device enumeration, hot-plug support, and factory functions.
 * Simulated USB devices for testing (no actual hardware access).
 * Implements UsbDeviceManager interface from sensor-interface.ts.
 */

import type {
  AmbientSignal,
  AmbientSignalType,
  UsbDevice,
  UsbDeviceClass,
  UsbDeviceDirection,
} from './types.js';
import type {
  SensorStream,
  SensorListener,
  OutputDevice,
  UsbDeviceManager,
  UsbDeviceEvent,
} from './sensor-interface.js';
import { createAmbientSignal } from './sensor-interface.js';

// ============================================================================
// USB sensor stream — wraps a USB device as a SensorStream
// ============================================================================

export class UsbSensorStream implements SensorStream {
  readonly id: string;
  readonly type: AmbientSignalType;
  readonly source: string;
  private _device: UsbDevice;
  private _active = false;
  private _latest: AmbientSignal | null = null;
  private _listeners = new Set<SensorListener>();
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _pollMs: number;
  private _simulator: (() => number) | null;

  constructor(
    device: UsbDevice,
    signalType: AmbientSignalType,
    pollMs = 100,
    simulator?: () => number,
  ) {
    this._device = device;
    this.id = `usb-${device.id}`;
    this.type = signalType;
    this.source = `usb:${device.path}`;
    this._pollMs = pollMs;
    this._simulator = simulator ?? null;
  }

  get active(): boolean { return this._active; }
  get device(): UsbDevice { return this._device; }

  async start(): Promise<void> {
    if (this._active) return;
    this._active = true;
    this._interval = setInterval(() => this._poll(), this._pollMs);
    this._poll();
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

  /** Inject a signal value (for testing). */
  inject(value: number, unit?: string): void {
    const signal = createAmbientSignal(this.type, this.source, value, unit);
    this._latest = signal;
    for (const listener of this._listeners) {
      listener(signal);
    }
  }

  private _poll(): void {
    const value = this._simulator ? this._simulator() : 0;
    const unit = this._device.deviceClass === 'audio' ? 'amplitude' : 'raw';
    const signal = createAmbientSignal(this.type, this.source, value, unit);
    this._latest = signal;
    for (const listener of this._listeners) {
      listener(signal);
    }
  }
}

// ============================================================================
// USB output device — wraps a USB device as an OutputDevice
// ============================================================================

export class UsbOutputDevice implements OutputDevice {
  readonly id: string;
  readonly name: string;
  readonly deviceClass: UsbDeviceClass;
  readonly direction: UsbDeviceDirection;
  private _connected = false;
  private _device: UsbDevice;
  private _channelValues = new Map<number, number>();

  constructor(device: UsbDevice) {
    this._device = device;
    this.id = `usb-out-${device.id}`;
    this.name = device.name;
    this.deviceClass = device.deviceClass;
    this.direction = device.direction;
  }

  get connected(): boolean { return this._connected; }
  get device(): UsbDevice { return this._device; }

  async connect(): Promise<void> {
    this._connected = true;
    this._device.connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this._device.connected = false;
    this._channelValues.clear();
  }

  send(channel: number, value: number): void {
    if (!this._connected) return;
    this._channelValues.set(channel, value);
  }

  sendBatch(values: Map<number, number>): void {
    if (!this._connected) return;
    for (const [ch, val] of values) {
      this._channelValues.set(ch, val);
    }
  }

  /** Get the last sent value for a channel (for testing). */
  getChannelValue(channel: number): number | undefined {
    return this._channelValues.get(channel);
  }
}

// ============================================================================
// Simulated USB Device Manager
// ============================================================================

export class SimulatedUsbDeviceManager implements UsbDeviceManager {
  private _devices: Map<string, UsbDevice> = new Map();
  private _openStreams: Map<string, SensorStream | OutputDevice> = new Map();
  private _listeners: Set<(event: UsbDeviceEvent) => void> = new Set();

  /** Add a simulated device to the manager. */
  addDevice(device: UsbDevice): void {
    this._devices.set(device.id, device);
    if (device.connected) {
      this._emit({ type: 'connected', device, timestamp: Date.now() });
    }
  }

  /** Remove a simulated device (triggers disconnect event). */
  removeDevice(deviceId: string): void {
    const device = this._devices.get(deviceId);
    if (!device) return;

    // Close any open stream
    const stream = this._openStreams.get(deviceId);
    if (stream) {
      if ('stop' in stream) (stream as SensorStream).stop();
      if ('disconnect' in stream) (stream as OutputDevice).disconnect();
      this._openStreams.delete(deviceId);
    }

    device.connected = false;
    this._emit({ type: 'disconnected', device, timestamp: Date.now() });
    this._devices.delete(deviceId);
  }

  /** Simulate hot-plug: connect a device. */
  simulateConnect(deviceId: string): void {
    const device = this._devices.get(deviceId);
    if (!device) return;
    device.connected = true;
    this._emit({ type: 'connected', device, timestamp: Date.now() });
  }

  /** Simulate hot-plug: disconnect a device. */
  simulateDisconnect(deviceId: string): void {
    const device = this._devices.get(deviceId);
    if (!device) return;
    device.connected = false;

    // Close open stream
    const stream = this._openStreams.get(deviceId);
    if (stream) {
      if ('stop' in stream) (stream as SensorStream).stop();
      if ('disconnect' in stream) (stream as OutputDevice).disconnect();
      this._openStreams.delete(deviceId);
    }

    this._emit({ type: 'disconnected', device, timestamp: Date.now() });
  }

  // UsbDeviceManager interface

  async enumerate(): Promise<UsbDevice[]> {
    return [...this._devices.values()].filter(d => d.connected);
  }

  async open(deviceId: string): Promise<SensorStream | OutputDevice> {
    const device = this._devices.get(deviceId);
    if (!device) throw new Error(`Device not found: ${deviceId}`);
    if (!device.connected) throw new Error(`Device not connected: ${deviceId}`);

    // Check if already open
    const existing = this._openStreams.get(deviceId);
    if (existing) return existing;

    const opened = createDeviceStream(device);
    this._openStreams.set(deviceId, opened);
    return opened;
  }

  async close(deviceId: string): Promise<void> {
    const stream = this._openStreams.get(deviceId);
    if (!stream) return;

    if ('stop' in stream) await (stream as SensorStream).stop();
    if ('disconnect' in stream) await (stream as OutputDevice).disconnect();
    this._openStreams.delete(deviceId);
  }

  onDeviceChange(listener: (event: UsbDeviceEvent) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Get all registered devices (including disconnected). */
  getAllDevices(): UsbDevice[] {
    return [...this._devices.values()];
  }

  /** Get open streams count. */
  getOpenCount(): number {
    return this._openStreams.size;
  }

  private _emit(event: UsbDeviceEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

// ============================================================================
// Factory functions
// ============================================================================

/**
 * Create a SensorStream or OutputDevice from a UsbDevice descriptor.
 * Input devices become SensorStreams, output/bidirectional become OutputDevices.
 */
export function createDeviceStream(device: UsbDevice): SensorStream | OutputDevice {
  if (device.direction === 'input') {
    const signalType = deviceClassToSignalType(device.deviceClass);
    return new UsbSensorStream(device, signalType);
  }
  return new UsbOutputDevice(device);
}

/** Map USB device class to ambient signal type. */
export function deviceClassToSignalType(deviceClass: UsbDeviceClass): AmbientSignalType {
  switch (deviceClass) {
    case 'audio': return 'usb_audio';
    case 'serial': return 'usb_serial';
    case 'bulk': return 'usb_bulk';
    case 'hid': return 'usb_bulk'; // HID treated as bulk for signal purposes
  }
}

// ============================================================================
// Simulated USB device presets
// ============================================================================

export function createSimulatedAudioInput(id = 'audio-in-1'): UsbDevice {
  return {
    id,
    name: 'Simulated Audio Input',
    deviceClass: 'audio',
    direction: 'input',
    path: `/dev/snd/${id}`,
    connected: true,
    sampleRate: 44100,
  };
}

export function createSimulatedAudioOutput(id = 'audio-out-1'): UsbDevice {
  return {
    id,
    name: 'Simulated Audio Output',
    deviceClass: 'audio',
    direction: 'output',
    path: `/dev/snd/${id}`,
    connected: true,
    sampleRate: 44100,
  };
}

export function createSimulatedSerialDevice(id = 'serial-1'): UsbDevice {
  return {
    id,
    name: 'Simulated Serial Device',
    deviceClass: 'serial',
    direction: 'bidirectional',
    path: `/dev/ttyUSB-${id}`,
    connected: true,
    baudRate: 115200,
  };
}

export function createSimulatedBulkDevice(id = 'bulk-1'): UsbDevice {
  return {
    id,
    name: 'Simulated Bulk Device',
    deviceClass: 'bulk',
    direction: 'input',
    path: `/dev/usb/${id}`,
    connected: true,
  };
}
