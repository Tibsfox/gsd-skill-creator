/**
 * End-to-end integration tests for the chipset integration layer.
 *
 * Validates cross-system workflows:
 * 1. Recording -> Learning Pipeline: stream.jsonl -> StackBridge -> LearningCompiler -> Pipelines
 * 2. Session Lifecycle -> Pipeline WAIT Resolution: SessionEventBridge -> LifecycleSync -> PipelineExecutor
 * 3. PopStackAwareness with session lifecycle state
 * 4. Full lifecycle with combined transitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { StackBridge } from '../../../src/chipset/integration/stack-bridge.js';
import { SessionEventBridge } from '../../../src/chipset/integration/session-events.js';
import { PopStackAwareness } from '../../../src/chipset/integration/pop-stack-awareness.js';
import { LearningCompiler } from '../../../src/chipset/copper/learning/compiler.js';
import { LifecycleSync } from '../../../src/chipset/copper/lifecycle-sync.js';
import { PipelineExecutor } from '../../../src/chipset/copper/executor.js';
import type { Pipeline, MoveInstruction } from '../../../src/chipset/copper/types.js';

// ============================================================================
// Test Scenario 1: Recording -> Learning Pipeline
// ============================================================================

describe('End-to-End: Recording -> Learning Pipeline', () => {
  it('should transform stream.jsonl events through StackBridge to LearningCompiler producing Pipelines', () => {
    // Create realistic stream.jsonl content
    const streamContent = [
      JSON.stringify({ type: 'recording_start', ts: '2026-02-12T10:00:00Z', name: 'test-recording', session: 'my-session' }),
      JSON.stringify({ type: 'terminal', ts: '2026-02-12T10:01:00Z', content: '$ vitest run\nTests: 10 passed' }),
      JSON.stringify({ type: 'file_change', ts: '2026-02-12T10:02:00Z', path: 'src/foo.ts', action: 'modified' }),
      JSON.stringify({ type: 'stack_push', ts: '2026-02-12T10:03:00Z', priority: 'normal', message: 'fix tests' }),
      JSON.stringify({ type: 'stack_pop', ts: '2026-02-12T10:04:00Z', priority: 'normal', message: 'fix tests' }),
      JSON.stringify({ type: 'marker', ts: '2026-02-12T10:05:00Z', label: 'tests passing' }),
      JSON.stringify({ type: 'recording_stop', ts: '2026-02-12T10:06:00Z', name: 'test-recording' }),
    ].join('\n');

    // Feed through StackBridge
    const bridge = new StackBridge();
    const observationInput = bridge.fromStreamFile(streamContent);

    // Verify ObservationInput has correct structure
    expect(observationInput.sessions).toHaveLength(1);
    const session = observationInput.sessions[0];
    expect(session.sessionId).toBe('test-recording');
    expect(session.topCommands).toContain('vitest run');
    expect(session.topFiles).toContain('src/foo.ts');
    expect(session.topTools).toContain('gsd-stack');
    expect(session.metrics.toolCalls).toBeGreaterThan(0);

    // Feed into LearningCompiler with minOccurrences: 1 for single-session test
    const compiler = new LearningCompiler({ minOccurrences: 1, minConfidence: 0 });
    const result = compiler.compile(observationInput);

    // Verify CompilationResult
    expect(result.sessionsAnalyzed).toBe(1);
    expect(result.lists.length).toBeGreaterThanOrEqual(1);

    // Verify compiled list has instructions
    const list = result.lists[0];
    expect(list.instructions.length).toBeGreaterThan(0);

    // Should have at least one WAIT instruction (lifecycle event inferred from vitest)
    const waitInstructions = list.instructions.filter((i) => i.type === 'wait');
    expect(waitInstructions.length).toBeGreaterThan(0);

    // Should reference lifecycle events inferred from terminal commands (vitest -> tests-passing)
    const events = waitInstructions.map((i) => (i as { event: string }).event);
    expect(events).toContain('tests-passing');
  });

  it('should handle multiple recording sessions in a single stream', () => {
    const streamContent = [
      // Session 1
      JSON.stringify({ type: 'recording_start', ts: '2026-02-12T10:00:00Z', name: 'session-1' }),
      JSON.stringify({ type: 'terminal', ts: '2026-02-12T10:01:00Z', content: '$ vitest run' }),
      JSON.stringify({ type: 'recording_stop', ts: '2026-02-12T10:02:00Z' }),
      // Session 2
      JSON.stringify({ type: 'recording_start', ts: '2026-02-12T11:00:00Z', name: 'session-2' }),
      JSON.stringify({ type: 'terminal', ts: '2026-02-12T11:01:00Z', content: '$ vitest run' }),
      JSON.stringify({ type: 'recording_stop', ts: '2026-02-12T11:02:00Z' }),
    ].join('\n');

    const bridge = new StackBridge();
    const input = bridge.fromStreamFile(streamContent);

    expect(input.sessions).toHaveLength(2);
    expect(input.sessions[0].sessionId).toBe('session-1');
    expect(input.sessions[1].sessionId).toBe('session-2');

    // With 2 sessions sharing the same fingerprint, minOccurrences: 2 should produce results
    const compiler = new LearningCompiler({ minOccurrences: 2, minConfidence: 0 });
    const result = compiler.compile(input);
    expect(result.sessionsAnalyzed).toBe(2);
    expect(result.lists.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Test Scenario 2: Session Lifecycle -> Pipeline WAIT Resolution
// ============================================================================

describe('End-to-End: Session Lifecycle -> Pipeline WAIT Resolution', () => {
  it('should resolve PipelineExecutor WAIT instructions via SessionEventBridge transitions', async () => {
    // Create system instances
    const lifecycleSync = new LifecycleSync();
    const sessionBridge = new SessionEventBridge(lifecycleSync);

    // Track MOVE activations
    const activations: string[] = [];
    const activationHandler = async (instruction: MoveInstruction): Promise<void> => {
      activations.push(instruction.name);
    };

    const executor = new PipelineExecutor({
      lifecycleSync,
      activationHandler,
    });

    // Create a Pipeline: WAIT 'session-start' -> MOVE skill -> WAIT 'session-pause'
    const pipeline: Pipeline = {
      metadata: {
        name: 'test-lifecycle',
        description: 'Test session lifecycle integration',
      },
      instructions: [
        { type: 'wait', event: 'session-start' },
        { type: 'move', target: 'skill', name: 'test-skill', mode: 'full' },
        { type: 'wait', event: 'session-pause' },
      ],
    };

    // Start executor (it will block on first WAIT 'session-start')
    const executionPromise = executor.run(pipeline);

    // Give the executor a moment to start and register its waiter
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit session-start via bridge (null -> active)
    const startEvent = sessionBridge.onTransition(null, 'active');
    expect(startEvent).toBe('session-start');

    // Give executor time to process MOVE and register next WAIT
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify MOVE was called
    expect(activations).toContain('test-skill');

    // Emit session-pause via bridge (active -> paused)
    const pauseEvent = sessionBridge.onTransition('active', 'paused');
    expect(pauseEvent).toBe('session-pause');

    // Executor should complete
    const result = await executionPromise;
    expect(result.status).toBe('completed');
    expect(result.executed).toBe(3); // 2 WAITs + 1 MOVE
    expect(result.waited).toBe(2);
  });

  it('should handle session-resume resolving a WAIT instruction', async () => {
    const lifecycleSync = new LifecycleSync();
    const sessionBridge = new SessionEventBridge(lifecycleSync);

    const executor = new PipelineExecutor({
      lifecycleSync,
      activationHandler: async () => {},
    });

    const pipeline: Pipeline = {
      metadata: { name: 'test-resume' },
      instructions: [
        { type: 'wait', event: 'session-resume' },
      ],
    };

    const executionPromise = executor.run(pipeline);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // paused -> active emits session-resume
    const event = sessionBridge.onTransition('paused', 'active');
    expect(event).toBe('session-resume');

    const result = await executionPromise;
    expect(result.status).toBe('completed');
    expect(result.waited).toBe(1);
  });
});

// ============================================================================
// Test Scenario 3: PopStackAwareness with Session State
// ============================================================================

describe('End-to-End: PopStackAwareness with session state', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'e2e-pop-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should allow pop when session is active and touch heartbeat', async () => {
    // Create session directory with active status
    const sessionDir = join(tmpDir, 'sessions', 'test-session');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'active', started: '2026-02-12T10:00:00Z' }),
    );

    // Create heartbeat file
    const heartbeatPath = join(sessionDir, 'heartbeat');
    await writeFile(heartbeatPath, '');

    // Get initial mtime
    const { stat } = await import('node:fs/promises');
    const beforeStat = await stat(heartbeatPath);

    // Wait a small amount so mtime can differ
    await new Promise((resolve) => setTimeout(resolve, 50));

    const awareness = new PopStackAwareness({
      stackDir: tmpDir,
      sessionName: 'test-session',
    });

    const result = await awareness.check();

    expect(result.allowed).toBe(true);
    expect(result.heartbeatTouched).toBe(true);

    // Verify heartbeat was touched (mtime updated)
    const afterStat = await stat(heartbeatPath);
    expect(afterStat.mtimeMs).toBeGreaterThanOrEqual(beforeStat.mtimeMs);
  });

  it('should refuse pop when session is paused', async () => {
    const sessionDir = join(tmpDir, 'sessions', 'test-session');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'paused' }),
    );
    await writeFile(join(sessionDir, 'heartbeat'), '');

    const awareness = new PopStackAwareness({
      stackDir: tmpDir,
      sessionName: 'test-session',
    });

    const result = await awareness.check();

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('paused');
    // Heartbeat should still be touched even on refusal
    expect(result.heartbeatTouched).toBe(true);
  });

  it('should handle state transitions affecting pop decisions', async () => {
    const sessionDir = join(tmpDir, 'sessions', 'test-session');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(join(sessionDir, 'heartbeat'), '');

    const awareness = new PopStackAwareness({
      stackDir: tmpDir,
      sessionName: 'test-session',
    });

    // Start with active -> pop allowed
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'active' }),
    );
    const result1 = await awareness.check();
    expect(result1.allowed).toBe(true);

    // Change to paused -> pop refused
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'paused' }),
    );
    const result2 = await awareness.check();
    expect(result2.allowed).toBe(false);
    expect(result2.reason).toContain('paused');
  });
});

// ============================================================================
// Test Scenario 4: Full Lifecycle
// ============================================================================

describe('End-to-End: Full Lifecycle', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'e2e-full-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should coordinate session transitions, pop awareness, and recording markers', async () => {
    const lifecycleSync = new LifecycleSync();
    const sessionBridge = new SessionEventBridge(lifecycleSync);

    // Set up session directory
    const sessionDir = join(tmpDir, 'sessions', 'full-test');
    await mkdir(sessionDir, { recursive: true });
    await writeFile(join(sessionDir, 'heartbeat'), '');

    const awareness = new PopStackAwareness({
      stackDir: tmpDir,
      sessionName: 'full-test',
    });

    // 1. null -> active (session-start emitted)
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'active' }),
    );
    const startEvent = sessionBridge.onTransition(null, 'active');
    expect(startEvent).toBe('session-start');

    // 2. Pop should be allowed when active
    const popResult1 = await awareness.check();
    expect(popResult1.allowed).toBe(true);

    // 3. Set up a recording and write a marker
    const recordingDir = join(tmpDir, 'recordings', 'rec-001');
    await mkdir(recordingDir, { recursive: true });
    await writeFile(
      join(recordingDir, 'meta.json'),
      JSON.stringify({ status: 'recording' }),
    );

    const markerWritten = await awareness.recordPop('testing pop message');
    expect(markerWritten).toBe(true);

    // Verify marker was written to stream.jsonl
    const streamContent = await readFile(join(recordingDir, 'stream.jsonl'), 'utf-8');
    expect(streamContent).toContain('pop-stack:');
    expect(streamContent).toContain('testing pop message');

    // 4. active -> paused (session-pause emitted)
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'paused' }),
    );
    const pauseEvent = sessionBridge.onTransition('active', 'paused');
    expect(pauseEvent).toBe('session-pause');

    // 5. Pop should be refused when paused
    const popResult2 = await awareness.check();
    expect(popResult2.allowed).toBe(false);

    // 6. paused -> active (session-resume emitted)
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'active' }),
    );
    const resumeEvent = sessionBridge.onTransition('paused', 'active');
    expect(resumeEvent).toBe('session-resume');

    // 7. Pop should be allowed again
    const popResult3 = await awareness.check();
    expect(popResult3.allowed).toBe(true);

    // 8. active -> stopped (session-stop emitted)
    await writeFile(
      join(sessionDir, 'meta.json'),
      JSON.stringify({ status: 'stopped' }),
    );
    const stopEvent = sessionBridge.onTransition('active', 'stopped');
    expect(stopEvent).toBe('session-stop');
  });

  it('should demonstrate the complete data flow from recording through compilation', async () => {
    // Simulate a recorded session producing stream events
    const streamContent = [
      JSON.stringify({ type: 'recording_start', ts: '2026-02-12T10:00:00Z', name: 'lifecycle-test' }),
      JSON.stringify({ type: 'terminal', ts: '2026-02-12T10:01:00Z', content: '$ vitest run\nAll tests passed' }),
      JSON.stringify({ type: 'file_change', ts: '2026-02-12T10:02:00Z', path: 'src/integration.ts', action: 'modified' }),
      JSON.stringify({ type: 'marker', ts: '2026-02-12T10:03:00Z', label: 'phase complete' }),
      JSON.stringify({ type: 'recording_stop', ts: '2026-02-12T10:04:00Z' }),
    ].join('\n');

    // StackBridge parses and aggregates
    const bridge = new StackBridge();
    const observationInput = bridge.fromStreamFile(streamContent);
    expect(observationInput.sessions).toHaveLength(1);

    // LearningCompiler produces Pipelines
    const compiler = new LearningCompiler({ minOccurrences: 1, minConfidence: 0 });
    const compilationResult = compiler.compile(observationInput);
    expect(compilationResult.lists.length).toBeGreaterThanOrEqual(1);

    // Each list is a valid Pipeline structure
    for (const list of compilationResult.lists) {
      expect(list.metadata).toBeDefined();
      expect(list.metadata.name).toBeTruthy();
      expect(list.instructions.length).toBeGreaterThan(0);

      // Every instruction should have a valid type
      for (const instr of list.instructions) {
        expect(['wait', 'move', 'skip']).toContain(instr.type);
      }
    }

    // Create an executor and verify the compiled list can be run
    const lifecycleSync = new LifecycleSync();
    const activations: string[] = [];
    const executor = new PipelineExecutor({
      lifecycleSync,
      activationHandler: async (instr: MoveInstruction) => {
        activations.push(instr.name);
      },
    });

    const list = compilationResult.lists[0];
    const executionPromise = executor.run(list);

    // Emit all lifecycle events that the list expects
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit events that the compiler would have inferred
    for (const instr of list.instructions) {
      if (instr.type === 'wait') {
        lifecycleSync.emit((instr as { event: string }).event as any);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    const result = await executionPromise;
    expect(result.status).toBe('completed');
  });
});

// ============================================================================
// Test: Barrel Exports
// ============================================================================

describe('Barrel Exports', () => {
  it('should export all integration module classes and types from integration/index.ts', async () => {
    const integrationModule = await import('../../../src/chipset/integration/index.js');

    // Classes
    expect(integrationModule.StackBridge).toBeDefined();
    expect(integrationModule.SessionEventBridge).toBeDefined();
    expect(integrationModule.PopStackAwareness).toBeDefined();

    // Verify they are constructable
    expect(typeof integrationModule.StackBridge).toBe('function');
    expect(typeof integrationModule.SessionEventBridge).toBe('function');
    expect(typeof integrationModule.PopStackAwareness).toBe('function');
  });

  it('should export all chipset sub-modules from chipset/index.ts as namespaces', async () => {
    const chipsetModule = await import('../../../src/chipset/index.js');

    // All 5 namespaces should exist
    expect(chipsetModule.copper).toBeDefined();
    expect(chipsetModule.blitter).toBeDefined();
    expect(chipsetModule.teams).toBeDefined();
    expect(chipsetModule.exec).toBeDefined();
    expect(chipsetModule.integration).toBeDefined();

    // Spot-check copper namespace has key exports
    expect(chipsetModule.copper.LifecycleSync).toBeDefined();
    expect(chipsetModule.copper.PipelineExecutor).toBeDefined();
    expect(chipsetModule.copper.compilePipeline).toBeDefined();

    // Spot-check blitter namespace
    expect(chipsetModule.blitter.OffloadExecutor).toBeDefined();
    expect(chipsetModule.blitter.SignalBus).toBeDefined();

    // Spot-check teams namespace
    expect(chipsetModule.teams.EngineRegistry).toBeDefined();
    expect(chipsetModule.teams.TeamSignals).toBeDefined();

    // Spot-check exec namespace
    expect(chipsetModule.exec.ExecKernel).toBeDefined();
    expect(chipsetModule.exec.ExecScheduler).toBeDefined();

    // Spot-check integration namespace
    expect(chipsetModule.integration.StackBridge).toBeDefined();
    expect(chipsetModule.integration.SessionEventBridge).toBeDefined();
    expect(chipsetModule.integration.PopStackAwareness).toBeDefined();
  });

  it('should allow importing integration types through the chipset barrel', async () => {
    const { integration } = await import('../../../src/chipset/index.js');

    // Create instances through the namespace
    const bridge = new integration.StackBridge();
    expect(bridge).toBeInstanceOf(integration.StackBridge);

    const awareness = new integration.PopStackAwareness({ stackDir: '/tmp/nonexistent' });
    expect(awareness).toBeInstanceOf(integration.PopStackAwareness);
  });
});
