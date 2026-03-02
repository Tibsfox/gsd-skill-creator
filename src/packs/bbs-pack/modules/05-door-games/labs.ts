/**
 * Module 05: Door Games interactive labs.
 *
 * Lab 1: DOOR.SYS parser — parses the 52-line positional drop file format
 * used by BBS door games for session handoff.
 *
 * Lab 2: Game turn calculator — models per-day-turn resource allocation
 * mimicking LORD/BRE game mechanics.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import type { BbsLab } from '../../shared/types.js';

/**
 * Parse a DOOR.SYS drop file (52-line positional text format).
 * Returns a record with named fields extracted from specific line positions.
 *
 * Line numbering (1-based in docs, 0-based array index):
 * - Line 1 (idx 0): COM port
 * - Line 2 (idx 1): baud rate
 * - Line 7 (idx 6): user name
 * - Line 12 (idx 11): security level
 * - Line 18 (idx 17): time remaining (minutes)
 * - Line 23 (idx 22): ANSI mode (GR = graphics)
 */
function parseDoorSys(content: string): Record<string, string> {
  const lines = content.split('\n');
  return {
    comPort: (lines[0] || '').trim(),
    baudRate: (lines[1] || '').trim(),
    userName: (lines[6] || '').trim(),
    securityLevel: (lines[11] || '').trim(),
    timeRemaining: (lines[17] || '').trim(),
    ansiMode: (lines[22] || '').trim(),
  };
}

const lab01: BbsLab = {
  id: 'bbs-m5-lab-01',
  title: 'DOOR.SYS Parser',
  steps: [
    {
      instruction:
        'Parse a 52-line DOOR.SYS drop file. The format uses fixed line positions — ' +
        'line 1 is the COM port, line 2 is the baud rate, line 7 is the user name, ' +
        'line 12 is the security level, line 18 is time remaining, and line 23 is ANSI mode. ' +
        'Construct a test file with known values at these positions and verify extraction.',
      expected_observation:
        'COM port=COM1, baud rate=9600, user name=SysOp, security level=100, ' +
        'time remaining=60, ANSI mode=GR (graphics). All 6 fields match their line positions.',
      learn_note:
        'DOOR.SYS is a positional drop file format — the BBS writes session data to a text file ' +
        'before launching a door game. The door reads DOOR.SYS to learn the user name, security level, ' +
        'time remaining, and terminal capabilities. This handoff mechanism was necessary because BBS ' +
        'door games ran as separate DOS executables sharing a COM port. The 52-line format became a ' +
        'de facto standard across GAP, Wildcat, and PCBoard BBS software.',
    },
  ],
  verify(): boolean {
    // Build a 52-line DOOR.SYS with known values at required positions
    const lines: string[] = new Array(52).fill('');
    lines[0] = 'COM1';     // Line 1: COM port
    lines[1] = '9600';     // Line 2: baud rate
    lines[6] = 'SysOp';    // Line 7: user name
    lines[11] = '100';     // Line 12: security level
    lines[17] = '60';      // Line 18: time remaining
    lines[22] = 'GR';      // Line 23: ANSI mode

    const content = lines.join('\n');
    const result = parseDoorSys(content);

    if (result.comPort !== 'COM1') return false;
    if (result.baudRate !== '9600') return false;
    if (result.userName !== 'SysOp') return false;
    if (result.securityLevel !== '100') return false;
    if (result.timeRemaining !== '60') return false;
    if (result.ansiMode !== 'GR') return false;

    return true;
  },
};

const lab02: BbsLab = {
  id: 'bbs-m5-lab-02',
  title: 'Game Turn Calculator',
  steps: [
    {
      instruction:
        'Calculate per-day-turn resource allocation mimicking LORD (Legend of the Red Dragon) ' +
        'and BRE (Barren Realms Elite) game mechanics. Given turnsPerDay=10, forestFights=3, ' +
        'goldPerFight=50, and healCost=25, compute totalGold and netGold after healing.',
      expected_observation:
        'totalGold = turnsPerDay * forestFights * goldPerFight = 10 * 3 * 50 = 1500. ' +
        'netGold after 2 heals = 1500 - (2 * 25) = 1450.',
      learn_note:
        'BBS door games used daily turn limits because modem time was expensive — each user got a ' +
        'fixed number of turns per day to keep the game fair and limit phone line usage. Games like ' +
        'Legend of the Red Dragon (LORD) allocated forest fights per turn, with gold rewards that fed ' +
        'into an equipment economy. The turn-based resource model created strategic depth: do you spend ' +
        'turns on gold farming, healing, or PvP? This economic design pattern persists in modern mobile ' +
        'games (energy systems, daily limits).',
    },
  ],
  verify(): boolean {
    const turnsPerDay = 10;
    const forestFights = 3;
    const goldPerFight = 50;
    const healCost = 25;
    const heals = 2;

    const totalGold = turnsPerDay * forestFights * goldPerFight;
    const netGold = totalGold - (heals * healCost);

    if (totalGold !== 1500) return false;
    if (netGold !== 1450) return false;

    return true;
  },
};

export const labs: BbsLab[] = [lab01, lab02];
