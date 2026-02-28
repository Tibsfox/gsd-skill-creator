/**
 * Integration tests for the GSD orchestrator pipeline.
 *
 * Validates the full pipeline (discover -> classify -> lifecycle -> gate)
 * against fixture data. Confirms graceful degradation when gsd-skill-creator
 * is not installed. Verifies extension-aware feature flag behavior.
 *
 * These tests compose real modules against fixture data (not mocks),
 * proving the system works as an integrated whole (DELV-05).
 */

import { describe, it, expect } from 'vitest';
import { getFixturePaths } from '../__fixtures__/fixture-loader.js';
import { GsdDiscoveryService } from '../discovery/discovery-service.js';
import { IntentClassifier } from '../intent/intent-classifier.js';
import { LifecycleCoordinator } from '../lifecycle/lifecycle-coordinator.js';
import { ProjectStateReader } from '../state/state-reader.js';
import { evaluateGate } from '../gates/gate-evaluator.js';
import { filterByVerbosity } from '../verbosity/verbosity-controller.js';
import { detectExtension, createNullCapabilities } from './extension-detector.js';
import type { ExtensionCapabilities } from './types.js';
import type { OutputSection } from '../verbosity/types.js';

// ============================================================================
// E2E Pipeline with Fixtures
// ============================================================================

describe('E2E pipeline with fixtures', () => {
  const { gsdBase, planningDir } = getFixturePaths();

  it('discovers commands, agents, and teams from fixture directory', async () => {
    const discovery = new GsdDiscoveryService(gsdBase);
    const result = await discovery.discover();

    expect(result.commands.length).toBe(27);
    expect(result.agents.length).toBeGreaterThanOrEqual(1);
    expect(result.teams.length).toBeGreaterThanOrEqual(1);
  });

  it('classifies exact /gsd:command from fixture commands', async () => {
    const discovery = new GsdDiscoveryService(gsdBase);
    const discoveryResult = await discovery.discover();

    const classifier = new IntentClassifier();
    await classifier.initialize(discoveryResult, { enableSemantic: false });

    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const result = await classifier.classify('/gsd:plan-phase 3', state);
    expect(result.type).toBe('exact-match');
    expect(result.command).not.toBeNull();
    expect(result.command!.name).toBe('gsd:plan-phase');
    expect(result.confidence).toBe(1.0);
  });

  it('classifies natural language against fixture commands', async () => {
    const discovery = new GsdDiscoveryService(gsdBase);
    const discoveryResult = await discovery.discover();

    const classifier = new IntentClassifier();
    await classifier.initialize(discoveryResult, { enableSemantic: false });

    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const result = await classifier.classify('plan the next phase', state);
    // Bayes result: classified or ambiguous (both valid for NL input)
    expect(['classified', 'ambiguous']).toContain(result.type);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('lifecycle suggests next action from fixture state', async () => {
    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const coordinator = new LifecycleCoordinator(planningDir);
    const suggestion = await coordinator.suggestNextStep(state);

    expect(suggestion.primary).toBeDefined();
    expect(typeof suggestion.stage).toBe('string');
    expect(suggestion.stage.length).toBeGreaterThan(0);
  });

  it('gate evaluates against classified command', async () => {
    const discovery = new GsdDiscoveryService(gsdBase);
    const discoveryResult = await discovery.discover();

    const classifier = new IntentClassifier();
    await classifier.initialize(discoveryResult, { enableSemantic: false });

    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const result = await classifier.classify('/gsd:plan-phase 3', state);
    expect(result.command).not.toBeNull();

    const gate = evaluateGate(result.command!.name, 'yolo', result.confidence);
    expect(['proceed', 'confirm', 'block']).toContain(gate.action);
    expect(['routing', 'destructive', 'low-confidence']).toContain(gate.gateType);
  });

  it('verbosity filtering works with output sections', () => {
    const sections: OutputSection[] = [
      { tag: 'result', content: 'Routed to plan-phase', minLevel: 1 },
      { tag: 'classification', content: 'Bayes match', minLevel: 3 },
      { tag: 'discovery', content: '27 commands found', minLevel: 4 },
      { tag: 'debug', content: 'All scores: ...', minLevel: 5 },
    ];

    const level1 = filterByVerbosity(sections, 1);
    const level5 = filterByVerbosity(sections, 5);

    expect(level1.length).toBeLessThan(level5.length);
    expect(level1.length).toBe(1);
    expect(level5.length).toBe(4);
  });

  it('full pipeline: discover -> classify -> lifecycle -> gate', async () => {
    // Step 1: Discover
    const discovery = new GsdDiscoveryService(gsdBase);
    const discoveryResult = await discovery.discover();
    expect(discoveryResult.commands.length).toBeGreaterThan(0);

    // Step 2: Classify
    const classifier = new IntentClassifier();
    await classifier.initialize(discoveryResult, { enableSemantic: false });

    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const classification = await classifier.classify('/gsd:execute-phase 2', state);
    expect(classification.type).toBe('exact-match');
    expect(classification.command).not.toBeNull();

    // Step 3: Gate
    const gate = evaluateGate(
      classification.command!.name,
      'yolo',
      classification.confidence,
    );
    expect(gate.action).toBeDefined();

    // Step 4: Lifecycle
    const coordinator = new LifecycleCoordinator(planningDir);
    const suggestion = await coordinator.suggestNextStep(state, classification.command!.name);
    expect(suggestion.primary).toBeDefined();
    expect(suggestion.stage).toBeDefined();
  });
});

// ============================================================================
// Graceful Degradation (No Extension)
// ============================================================================

describe('graceful degradation (no extension)', () => {
  const { gsdBase, planningDir } = getFixturePaths();

  it('detectExtension returns null capabilities when not installed', async () => {
    const caps = await detectExtension({
      cliAvailable: false,
      distPath: '/nonexistent/path/xyz',
    });

    expect(caps.detected).toBe(false);
    expect(caps.features.semanticClassification).toBe(false);
    expect(caps.features.enhancedDiscovery).toBe(false);
    expect(caps.features.enhancedLifecycle).toBe(false);
    expect(caps.features.customSkillCreation).toBe(false);
  });

  it('IntentClassifier works without semantic matcher (Layer 1 only)', async () => {
    const discovery = new GsdDiscoveryService(gsdBase);
    const discoveryResult = await discovery.discover();

    const classifier = new IntentClassifier();
    await classifier.initialize(discoveryResult, { enableSemantic: false });

    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const result = await classifier.classify('plan the next phase', state);
    // Should get a result without error
    expect(result).toBeDefined();
    expect(result.type).not.toBe('error');
    // Method should NOT be 'semantic'
    if (result.method) {
      expect(result.method).not.toBe('semantic');
    }
  });

  it('LifecycleCoordinator works independently of extension', async () => {
    const stateReader = new ProjectStateReader(planningDir);
    const state = await stateReader.read();

    const coordinator = new LifecycleCoordinator(planningDir);
    const suggestion = await coordinator.suggestNextStep(state);

    expect(suggestion).toBeDefined();
    expect(suggestion.primary).toBeDefined();
    expect(suggestion.primary.command).toBeDefined();
  });

  it('evaluateGate works without extension', () => {
    const gate = evaluateGate('gsd:plan-phase', 'interactive', 0.8);

    expect(gate).toBeDefined();
    expect(['proceed', 'confirm', 'block']).toContain(gate.action);
    expect(gate.gateType).toBeDefined();
  });

  it('filterByVerbosity works without extension', () => {
    const sections: OutputSection[] = [
      { tag: 'result', content: 'Output', minLevel: 1 },
      { tag: 'details', content: 'More info', minLevel: 3 },
      { tag: 'debug', content: 'Trace data', minLevel: 5 },
    ];

    const filtered = filterByVerbosity(sections, 3);
    expect(filtered.length).toBe(2);
    expect(filtered[0].tag).toBe('result');
    expect(filtered[1].tag).toBe('details');
  });

  it('null capabilities disable all enhanced features', () => {
    const caps = createNullCapabilities();

    expect(caps.detected).toBe(false);
    expect(caps.features.semanticClassification).toBe(false);
    expect(caps.features.enhancedDiscovery).toBe(false);
    expect(caps.features.enhancedLifecycle).toBe(false);
    expect(caps.features.customSkillCreation).toBe(false);
  });
});

// ============================================================================
// Extension-Aware Behavior
// ============================================================================

describe('extension-aware behavior', () => {
  it('detected extension enables all feature flags', async () => {
    const caps = await detectExtension({
      cliAvailable: true,
      cliVersion: '1.7.0',
    });

    expect(caps.detected).toBe(true);
    expect(caps.features.semanticClassification).toBe(true);
    expect(caps.features.enhancedDiscovery).toBe(true);
    expect(caps.features.enhancedLifecycle).toBe(true);
    expect(caps.features.customSkillCreation).toBe(true);
  });

  it('extension capabilities include customSkillCreation for EXTD-02', async () => {
    const caps = await detectExtension({
      cliAvailable: true,
      cliVersion: '1.7.0',
    });

    // EXTD-02: customSkillCreation is the flag the agent uses to
    // mention skill/agent/team creation as available options
    expect(caps.features.customSkillCreation).toBe(true);
  });

  it('detection method preference: CLI binary over dist/ directory', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    const tempDir = await mkdtemp(join(tmpdir(), 'ext-integration-'));
    try {
      const caps = await detectExtension({
        cliAvailable: true,
        cliVersion: '1.7.0',
        distPath: tempDir,
      });

      expect(caps.detectionMethod).toBe('cli-binary');
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});
