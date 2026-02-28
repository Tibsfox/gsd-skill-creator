/**
 * AGC I/O channel system tests.
 *
 * Covers: channel read/write, bitwise operations (AND, OR, XOR),
 * channel groups, peripheral stubs, configurability.
 */

import { describe, it, expect } from 'vitest';
import {
  createIoChannelState,
  readChannel,
  writeChannel,
  readAnd,
  writeAnd,
  readOr,
  writeOr,
  readXor,
  ChannelGroup,
  getChannelGroup,
  configureDsky,
  configureImu,
  configureRadar,
  getDownlinkLog,
} from '../io-channels.js';

describe('channel state', () => {
  it('createIoChannelState returns state with all channels at 0', () => {
    const state = createIoChannelState();
    expect(readChannel(state, 0)).toBe(0);
    expect(readChannel(state, 0o10)).toBe(0);
    expect(readChannel(state, 511)).toBe(0);
  });

  it('channels are 15-bit values', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o77777);
    expect(readChannel(state, 0o10)).toBe(0o77777);
    // Writing value larger than 15 bits should mask
    state = writeChannel(state, 0o10, 0o177777);
    expect(readChannel(state, 0o10)).toBe(0o77777);
  });
});

describe('basic read/write', () => {
  it('writeChannel sets channel value', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o12345);
    expect(readChannel(state, 0o10)).toBe(0o12345);
  });

  it('readChannel returns value at channel', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o12345);
    expect(readChannel(state, 0o10)).toBe(0o12345);
  });

  it('writing to channel 0 is valid', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0, 0o55555);
    expect(readChannel(state, 0)).toBe(0o55555);
  });

  it('writing to channel 511 is valid', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 511, 0o33333);
    expect(readChannel(state, 511)).toBe(0o33333);
  });

  it('reading unwritten channel returns 0', () => {
    const state = createIoChannelState();
    expect(readChannel(state, 42)).toBe(0);
  });

  it('writeChannel returns new state (immutable)', () => {
    const state = createIoChannelState();
    const newState = writeChannel(state, 0o10, 0o12345);
    expect(newState).not.toBe(state);
    expect(readChannel(state, 0o10)).toBe(0); // original unchanged
    expect(readChannel(newState, 0o10)).toBe(0o12345);
  });

  it('multiple writes to same channel: last write wins', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o11111);
    state = writeChannel(state, 0o10, 0o22222);
    expect(readChannel(state, 0o10)).toBe(0o22222);
  });
});

describe('bitwise channel operations', () => {
  it('readAnd: channel AND accumValue, channel unchanged', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o77777);
    const result = readAnd(state, 0o10, 0o70707);
    expect(result.result).toBe(0o70707);
    // Channel should be unchanged
    expect(readChannel(result.state, 0o10)).toBe(0o77777);
  });

  it('writeAnd: channel AND accumValue, channel updated with result', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o77777);
    const result = writeAnd(state, 0o10, 0o70707);
    expect(result.result).toBe(0o70707);
    // Channel should be updated with result
    expect(readChannel(result.state, 0o10)).toBe(0o70707);
  });

  it('readOr: channel OR accumValue, channel unchanged', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o00707);
    const result = readOr(state, 0o10, 0o70000);
    expect(result.result).toBe(0o70707);
    // Channel unchanged
    expect(readChannel(result.state, 0o10)).toBe(0o00707);
  });

  it('writeOr: channel OR accumValue, channel updated', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o00707);
    const result = writeOr(state, 0o10, 0o70000);
    expect(result.result).toBe(0o70707);
    expect(readChannel(result.state, 0o10)).toBe(0o70707);
  });

  it('readXor: channel XOR accumValue, channel unchanged', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o10, 0o77777);
    const result = readXor(state, 0o10, 0o70707);
    expect(result.result).toBe(0o07070);
    expect(readChannel(result.state, 0o10)).toBe(0o77777);
  });
});

describe('channel groups', () => {
  it('ChannelGroup enum defines all peripheral groups', () => {
    expect(ChannelGroup.DSKY).toBeDefined();
    expect(ChannelGroup.IMU).toBeDefined();
    expect(ChannelGroup.HAND_CONTROLLER).toBeDefined();
    expect(ChannelGroup.ENGINE).toBeDefined();
    expect(ChannelGroup.RADAR).toBeDefined();
    expect(ChannelGroup.DOWNLINK).toBeDefined();
    expect(ChannelGroup.UPLINK).toBeDefined();
    expect(ChannelGroup.UNKNOWN).toBeDefined();
  });

  it('DSKY channels: 10, 11, 12, 13, 15 (octal)', () => {
    expect(getChannelGroup(0o10)).toBe(ChannelGroup.DSKY);
    expect(getChannelGroup(0o11)).toBe(ChannelGroup.DSKY);
    expect(getChannelGroup(0o12)).toBe(ChannelGroup.DSKY);
    expect(getChannelGroup(0o13)).toBe(ChannelGroup.DSKY);
    expect(getChannelGroup(0o15)).toBe(ChannelGroup.DSKY);
  });

  it('IMU channels: 30, 31, 32, 33 (octal)', () => {
    expect(getChannelGroup(0o30)).toBe(ChannelGroup.IMU);
    expect(getChannelGroup(0o31)).toBe(ChannelGroup.IMU);
    expect(getChannelGroup(0o32)).toBe(ChannelGroup.IMU);
    expect(getChannelGroup(0o33)).toBe(ChannelGroup.IMU);
  });

  it('hand controller channels: 34, 35 (octal)', () => {
    expect(getChannelGroup(0o34)).toBe(ChannelGroup.HAND_CONTROLLER);
    expect(getChannelGroup(0o35)).toBe(ChannelGroup.HAND_CONTROLLER);
  });

  it('engine channel: 77 (octal)', () => {
    expect(getChannelGroup(0o77)).toBe(ChannelGroup.ENGINE);
  });

  it('radar channels: 50, 51, 52, 53 (octal)', () => {
    expect(getChannelGroup(0o50)).toBe(ChannelGroup.RADAR);
    expect(getChannelGroup(0o51)).toBe(ChannelGroup.RADAR);
    expect(getChannelGroup(0o52)).toBe(ChannelGroup.RADAR);
    expect(getChannelGroup(0o53)).toBe(ChannelGroup.RADAR);
  });

  it('downlink channels: 44, 45 (octal)', () => {
    expect(getChannelGroup(0o44)).toBe(ChannelGroup.DOWNLINK);
    expect(getChannelGroup(0o45)).toBe(ChannelGroup.DOWNLINK);
  });

  it('uplink channel: 43 (octal)', () => {
    expect(getChannelGroup(0o43)).toBe(ChannelGroup.UPLINK);
  });

  it('unrecognized channel returns UNKNOWN', () => {
    expect(getChannelGroup(0o100)).toBe(ChannelGroup.UNKNOWN);
    expect(getChannelGroup(256)).toBe(ChannelGroup.UNKNOWN);
  });
});

describe('peripheral stubs', () => {
  it('configureDsky sets keyboard key code on channel 15', () => {
    let state = createIoChannelState();
    state = configureDsky(state, 0o31);
    expect(readChannel(state, 0o15)).toBe(0o31);
  });

  it('configureImu sets CDU angle data on channels 30-32', () => {
    let state = createIoChannelState();
    state = configureImu(state, 0o12345, 0o23456, 0o34567);
    expect(readChannel(state, 0o30)).toBe(0o12345);
    expect(readChannel(state, 0o31)).toBe(0o23456);
    expect(readChannel(state, 0o32)).toBe(0o34567);
  });

  it('configureRadar sets altitude/range data on channels 50-51', () => {
    let state = createIoChannelState();
    state = configureRadar(state, 0o50000, 0o25000);
    expect(readChannel(state, 0o50)).toBe(0o50000);
    expect(readChannel(state, 0o51)).toBe(0o25000);
  });

  it('getDownlinkLog returns empty log initially', () => {
    const state = createIoChannelState();
    expect(getDownlinkLog(state)).toEqual([]);
  });

  it('writes to downlink channels are captured in log', () => {
    let state = createIoChannelState();
    state = writeChannel(state, 0o44, 0o12345, 100);
    state = writeChannel(state, 0o45, 0o67012, 200);
    const log = getDownlinkLog(state);
    expect(log).toHaveLength(2);
    expect(log[0]).toEqual({ channel: 0o44, value: 0o12345, timestamp: 100 });
    expect(log[1]).toEqual({ channel: 0o45, value: 0o67012, timestamp: 200 });
  });

  it('stubs are configurable and update read values', () => {
    let state = createIoChannelState();
    // Configure IMU
    state = configureImu(state, 100, 200, 300);
    expect(readChannel(state, 0o30)).toBe(100);
    // Reconfigure
    state = configureImu(state, 400, 500, 600);
    expect(readChannel(state, 0o30)).toBe(400);
  });

  it('peripheral data is separate from raw channel writes', () => {
    let state = createIoChannelState();
    state = configureDsky(state, 0o31);
    // Writing to a display channel (10) is a raw write
    state = writeChannel(state, 0o10, 0o55555);
    // DSKY keyboard (15) reads from peripheral data
    expect(readChannel(state, 0o15)).toBe(0o31);
    // Display channel reads the raw written value
    expect(readChannel(state, 0o10)).toBe(0o55555);
  });
});
