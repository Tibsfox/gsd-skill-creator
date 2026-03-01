import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  appendTeamEvent,
  readTeamEvents,
  TEAM_EVENTS_FILENAME,
} from './team-event-log.js';
import type { TeamLifecycleEvent } from './team-event-log.js';

// ============================================================================
// Helper
// ============================================================================

function createEvent(overrides?: Partial<TeamLifecycleEvent>): TeamLifecycleEvent {
  return {
    timestamp: '2026-03-01T00:00:00Z',
    event: 'created',
    trigger: 'test',
    managedBy: 'manual',
    ...overrides,
  };
}

// ============================================================================
// appendTeamEvent
// ============================================================================

describe('appendTeamEvent', () => {
  let tempDir: string;
  let teamsDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-event-log-test-'));
    teamsDir = path.join(tempDir, 'teams');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create events.jsonl in {teamsDir}/{teamName}/ directory', async () => {
    await appendTeamEvent(teamsDir, 'my-team', createEvent());
    const logPath = path.join(teamsDir, 'my-team', TEAM_EVENTS_FILENAME);
    expect(fs.existsSync(logPath)).toBe(true);
  });

  it('should append one JSON line per call', async () => {
    await appendTeamEvent(teamsDir, 'my-team', createEvent());
    const logPath = path.join(teamsDir, 'my-team', TEAM_EVENTS_FILENAME);
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.event).toBe('created');
    expect(parsed.trigger).toBe('test');
  });

  it('should create directory if it does not exist', async () => {
    const teamDir = path.join(teamsDir, 'new-team');
    expect(fs.existsSync(teamDir)).toBe(false);
    await appendTeamEvent(teamsDir, 'new-team', createEvent());
    expect(fs.existsSync(teamDir)).toBe(true);
  });

  it('should produce multiple lines for multiple appends in correct order', async () => {
    await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: 'created' }));
    await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: 'activated' }));
    await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: 'dissolving' }));

    const logPath = path.join(teamsDir, 'my-team', TEAM_EVENTS_FILENAME);
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]).event).toBe('created');
    expect(JSON.parse(lines[1]).event).toBe('activated');
    expect(JSON.parse(lines[2]).event).toBe('dissolving');
  });

  it('should include all TeamLifecycleEvent fields in output', async () => {
    const event = createEvent({
      timestamp: '2026-03-01T12:00:00Z',
      event: 'dissolved',
      trigger: 'cli:dissolve',
      managedBy: 'auto',
      metadata: { reason: 'milestone complete' },
    });
    await appendTeamEvent(teamsDir, 'my-team', event);

    const logPath = path.join(teamsDir, 'my-team', TEAM_EVENTS_FILENAME);
    const content = fs.readFileSync(logPath, 'utf-8');
    const parsed = JSON.parse(content.trim());
    expect(parsed.timestamp).toBe('2026-03-01T12:00:00Z');
    expect(parsed.event).toBe('dissolved');
    expect(parsed.trigger).toBe('cli:dissolve');
    expect(parsed.managedBy).toBe('auto');
    expect(parsed.metadata).toEqual({ reason: 'milestone complete' });
  });
});

// ============================================================================
// readTeamEvents
// ============================================================================

describe('readTeamEvents', () => {
  let tempDir: string;
  let teamsDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-event-log-read-'));
    teamsDir = path.join(tempDir, 'teams');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return empty array when file does not exist', async () => {
    const events = await readTeamEvents(teamsDir, 'nonexistent');
    expect(events).toEqual([]);
  });

  it('should return parsed events from JSONL file', async () => {
    await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: 'created' }));
    await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: 'activated' }));

    const events = await readTeamEvents(teamsDir, 'my-team');
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('created');
    expect(events[1].event).toBe('activated');
  });

  it('should skip corrupted lines gracefully', async () => {
    // Write a valid event, then a corrupted line, then another valid event
    const teamDir = path.join(teamsDir, 'corrupt-team');
    fs.mkdirSync(teamDir, { recursive: true });
    const logPath = path.join(teamDir, TEAM_EVENTS_FILENAME);
    const validEvent = JSON.stringify(createEvent({ event: 'created' }));
    const content = validEvent + '\n' + 'NOT-VALID-JSON\n' + validEvent + '\n';
    fs.writeFileSync(logPath, content, 'utf-8');

    const events = await readTeamEvents(teamsDir, 'corrupt-team');
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('created');
    expect(events[1].event).toBe('created');
  });

  it('should return events in correct order after multiple appends', async () => {
    const eventTypes: TeamLifecycleEvent['event'][] = [
      'created',
      'activated',
      'dissolving',
      'dissolved',
    ];
    for (const eventType of eventTypes) {
      await appendTeamEvent(teamsDir, 'my-team', createEvent({ event: eventType }));
    }

    const events = await readTeamEvents(teamsDir, 'my-team');
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.event)).toEqual(eventTypes);
  });
});
