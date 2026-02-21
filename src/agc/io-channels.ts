/**
 * AGC Block II I/O channel abstraction layer.
 *
 * 512 addressable 15-bit channels connecting the CPU to spacecraft peripherals.
 * Provides read/write, bitwise operations (AND, OR, XOR), channel group mapping,
 * and configurable peripheral stubs (DSKY, IMU, radar, engine, downlink).
 *
 * All functions are pure (no mutation of input state).
 */

import { WORD15_MASK } from './types.js';

// ─── Channel Groups ─────────────────────────────────────────────────────────

/** Peripheral channel groups. */
export enum ChannelGroup {
  DSKY = 'DSKY',
  IMU = 'IMU',
  HAND_CONTROLLER = 'HAND_CONTROLLER',
  ENGINE = 'ENGINE',
  RADAR = 'RADAR',
  DOWNLINK = 'DOWNLINK',
  UPLINK = 'UPLINK',
  UNKNOWN = 'UNKNOWN',
}

/** Channel-to-group mapping sets. */
const CHANNEL_GROUPS: ReadonlyMap<number, ChannelGroup> = new Map([
  // DSKY: channels 10-13, 15 (octal)
  [0o10, ChannelGroup.DSKY],
  [0o11, ChannelGroup.DSKY],
  [0o12, ChannelGroup.DSKY],
  [0o13, ChannelGroup.DSKY],
  [0o15, ChannelGroup.DSKY],
  // IMU: channels 30-33 (octal)
  [0o30, ChannelGroup.IMU],
  [0o31, ChannelGroup.IMU],
  [0o32, ChannelGroup.IMU],
  [0o33, ChannelGroup.IMU],
  // Hand controller: channels 34-35 (octal)
  [0o34, ChannelGroup.HAND_CONTROLLER],
  [0o35, ChannelGroup.HAND_CONTROLLER],
  // Engine: channel 77 (octal)
  [0o77, ChannelGroup.ENGINE],
  // Radar: channels 50-53 (octal)
  [0o50, ChannelGroup.RADAR],
  [0o51, ChannelGroup.RADAR],
  [0o52, ChannelGroup.RADAR],
  [0o53, ChannelGroup.RADAR],
  // Downlink: channels 44-45 (octal)
  [0o44, ChannelGroup.DOWNLINK],
  [0o45, ChannelGroup.DOWNLINK],
  // Uplink: channel 43 (octal)
  [0o43, ChannelGroup.UPLINK],
]);

/** Get the peripheral group for a channel number. */
export function getChannelGroup(channel: number): ChannelGroup {
  return CHANNEL_GROUPS.get(channel) ?? ChannelGroup.UNKNOWN;
}

// ─── Peripheral Read Map ────────────────────────────────────────────────────

/**
 * Maps channel numbers to peripheral data keys.
 * readChannel checks this map first, falling back to raw channel value.
 */
const PERIPHERAL_READ_MAP: Readonly<Record<number, string>> = {
  0o15: 'dsky.key',
  0o30: 'imu.cdux',
  0o31: 'imu.cduy',
  0o32: 'imu.cduz',
  0o33: 'imu.cdut',
  0o50: 'radar.alt',
  0o51: 'radar.range',
  0o52: 'radar.altrate',
  0o53: 'radar.vel',
  0o77: 'engine.state',
  0o43: 'uplink.data',
};

/** Downlink channels that capture writes. */
const DOWNLINK_CHANNELS = new Set([0o44, 0o45]);

// ─── I/O State ──────────────────────────────────────────────────────────────

/** A captured I/O write entry for the downlink log. */
export interface IoWriteEntry {
  readonly channel: number;
  readonly value: number;
  readonly timestamp: number;
}

/** Immutable I/O channel state. */
export interface IoChannelState {
  /** Channel values indexed by channel number. */
  readonly channels: ReadonlyMap<number, number>;
  /** Peripheral stub data (keyed by "peripheral.field" strings). */
  readonly peripheralData: ReadonlyMap<string, number>;
  /** Append-only log of writes to downlink channels. */
  readonly writeLog: readonly IoWriteEntry[];
}

/** Create initial I/O channel state: empty channels, no peripheral data. */
export function createIoChannelState(): IoChannelState {
  return {
    channels: new Map(),
    peripheralData: new Map(),
    writeLog: [],
  };
}

// ─── Read / Write ───────────────────────────────────────────────────────────

/**
 * Read a channel value.
 * Checks peripheral data map first for hardware-sourced values,
 * then falls back to the raw channel register.
 */
export function readChannel(state: IoChannelState, channel: number): number {
  // Check if this channel has a peripheral data source
  const peripheralKey = PERIPHERAL_READ_MAP[channel];
  if (peripheralKey !== undefined) {
    const peripheralValue = state.peripheralData.get(peripheralKey);
    if (peripheralValue !== undefined) {
      return peripheralValue;
    }
  }
  // Fall back to raw channel value
  return state.channels.get(channel) ?? 0;
}

/**
 * Write a value to a channel.
 * Downlink channel writes are captured in the write log.
 */
export function writeChannel(
  state: IoChannelState,
  channel: number,
  value: number,
  mctTimestamp?: number,
): IoChannelState {
  const maskedValue = value & WORD15_MASK;
  const newChannels = new Map(state.channels);
  newChannels.set(channel, maskedValue);

  let writeLog = state.writeLog;
  if (DOWNLINK_CHANNELS.has(channel)) {
    writeLog = [...writeLog, { channel, value: maskedValue, timestamp: mctTimestamp ?? 0 }];
  }

  return {
    channels: newChannels,
    peripheralData: state.peripheralData,
    writeLog,
  };
}

// ─── Bitwise Operations ─────────────────────────────────────────────────────

/** Result of a bitwise channel operation. */
export interface BitwiseResult {
  readonly result: number;
  readonly state: IoChannelState;
}

/**
 * RAND: Read AND. Returns channel AND accumValue.
 * Channel value is NOT updated (read variant).
 */
export function readAnd(state: IoChannelState, channel: number, accumValue: number): BitwiseResult {
  const chVal = readChannel(state, channel);
  return { result: (chVal & accumValue) & WORD15_MASK, state };
}

/**
 * WAND: Write AND. Returns channel AND accumValue.
 * Channel IS updated with the result (write variant).
 */
export function writeAnd(state: IoChannelState, channel: number, accumValue: number): BitwiseResult {
  const chVal = readChannel(state, channel);
  const result = (chVal & accumValue) & WORD15_MASK;
  return { result, state: writeChannel(state, channel, result) };
}

/**
 * ROR: Read OR. Returns channel OR accumValue.
 * Channel value is NOT updated (read variant).
 */
export function readOr(state: IoChannelState, channel: number, accumValue: number): BitwiseResult {
  const chVal = readChannel(state, channel);
  return { result: (chVal | accumValue) & WORD15_MASK, state };
}

/**
 * WOR: Write OR. Returns channel OR accumValue.
 * Channel IS updated with the result (write variant).
 */
export function writeOr(state: IoChannelState, channel: number, accumValue: number): BitwiseResult {
  const chVal = readChannel(state, channel);
  const result = (chVal | accumValue) & WORD15_MASK;
  return { result, state: writeChannel(state, channel, result) };
}

/**
 * RXOR: Read XOR. Returns channel XOR accumValue.
 * Channel value is NOT updated (read variant).
 * Note: RXOR only reads, it does not write back. There is no WXOR instruction.
 */
export function readXor(state: IoChannelState, channel: number, accumValue: number): BitwiseResult {
  const chVal = readChannel(state, channel);
  return { result: (chVal ^ accumValue) & WORD15_MASK, state };
}

// ─── Peripheral Stub Configurators ──────────────────────────────────────────

/** Helper to set peripheral data keys. */
function setPeripheralData(
  state: IoChannelState,
  entries: readonly [string, number][],
): IoChannelState {
  const newData = new Map(state.peripheralData);
  for (const [key, value] of entries) {
    newData.set(key, value & WORD15_MASK);
  }
  return { ...state, peripheralData: newData };
}

/**
 * Configure DSKY keyboard stub.
 * Sets the key code returned when channel 15 is read.
 */
export function configureDsky(state: IoChannelState, keyCode: number): IoChannelState {
  return setPeripheralData(state, [['dsky.key', keyCode]]);
}

/**
 * Configure IMU stub.
 * Sets CDU angle counter values for channels 30-32.
 */
export function configureImu(
  state: IoChannelState,
  cdux: number,
  cduy: number,
  cduz: number,
): IoChannelState {
  return setPeripheralData(state, [
    ['imu.cdux', cdux],
    ['imu.cduy', cduy],
    ['imu.cduz', cduz],
  ]);
}

/**
 * Configure radar stub.
 * Sets altitude and range data for channels 50-51.
 */
export function configureRadar(
  state: IoChannelState,
  altitude: number,
  range: number,
): IoChannelState {
  return setPeripheralData(state, [
    ['radar.alt', altitude],
    ['radar.range', range],
  ]);
}

/**
 * Get the downlink write log.
 * Returns all writes captured on channels 44-45.
 */
export function getDownlinkLog(state: IoChannelState): readonly IoWriteEntry[] {
  return state.writeLog;
}
