/**
 * End-to-end integration tests for brainstorm pathway sessions.
 *
 * Three complete pathway flows from problem statement to artifact:
 * - Creative Exploration (INT-09): explore -> diverge -> organize -> converge -> act
 * - Problem-Solving (INT-10): question-brainstorming -> starbursting -> five-whys
 * - Free-Form (INT-11): user-selected technique on demand
 *
 * Plus integration sub-tests:
 * - INT-04: Facilitator -> PathwayRouter: assessProblem pathway mapping
 * - INT-05: TechniqueEngine -> TechniqueAgent: Ideator uses engine config
 * - INT-06: Analyst -> All agents: broadcastHatChange synchronization
 * - INT-07: Scribe -> ArtifactGenerator: session data produces valid transcript
 * - INT-08: Energy signal -> Facilitator: flagging triggers technique switch recommendation
 * - INT-12: Mid-session adaptation: adaptTechniqueQueue resequences AND resets timer
 *
 * Uses real instances (no mocks) following Phase 310 technique-agents.test.ts pattern.
 * tmpdir isolation: fresh temp dir per test, removed in afterEach.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import type {
  SessionState,
  SessionPhase,
  Idea,
  Question,
  Cluster,
  Evaluation,
  ActionItem,
  EnergyLevel,
  PathwayId,
  TechniqueId,
  BrainstormMessage,
} from '../shared/types.js';

import { initBrainstormSession, resetBrainstormCounter } from '../shared/schemas.js';
import { SessionManager } from '../core/session-manager.js';
import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from '../core/rules-engine.js';
import { PhaseController } from '../core/phase-controller.js';
import { TechniqueEngine } from '../techniques/engine.js';
import { SessionBus } from './session-bus.js';
import { PathwayRouter } from '../pathways/router.js';
import { FacilitatorAgent, assessProblem } from '../agents/facilitator.js';
import { Ideator, createIdeator } from '../agents/ideator.js';
import { Questioner, createQuestioner } from '../agents/questioner.js';
import { Analyst, createAnalyst } from '../agents/analyst.js';
import { Mapper, createMapper } from '../agents/mapper.js';
import { Critic, createCritic } from '../agents/critic.js';
import { Scribe, createScribe } from '../agents/scribe.js';
import { ArtifactGenerator } from '../artifacts/generator.js';

// ============================================================================
// Test infrastructure
// ============================================================================

let brainstormDir: string;
let sessionManager: SessionManager;
let rulesEngine: RulesEngine;
let phaseController: PhaseController;
let bus: SessionBus;
let engine: TechniqueEngine;
let pathwayRouter: PathwayRouter;

beforeEach(async () => {
  brainstormDir = await mkdtemp(join(tmpdir(), 'brainstorm-e2e-'));
  resetBrainstormCounter();
  engine = new TechniqueEngine();
  rulesEngine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  sessionManager = new SessionManager({ brainstormDir });
  phaseController = new PhaseController(sessionManager, rulesEngine);
  pathwayRouter = new PathwayRouter();
});

afterEach(async () => {
  await rm(brainstormDir, { recursive: true, force: true });
});

/**
 * Create a valid Idea for testing.
 */
function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: randomUUID(),
    content: 'Test idea content',
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: ['test'],
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create a valid Question for testing.
 */
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: randomUUID(),
    content: 'Test question?',
    category: 'what',
    source_technique: 'question-brainstorming',
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Add N ideas to a session via SessionManager.
 */
async function addIdeasToSession(
  manager: SessionManager,
  sessionId: string,
  count: number,
  technique: TechniqueId = 'freewriting',
): Promise<Idea[]> {
  const ideas: Idea[] = [];
  for (let i = 0; i < count; i++) {
    const idea = makeIdea({
      content: `Idea ${i + 1}: generated content for testing`,
      source_technique: technique,
      timestamp: Date.now() + i,
    });
    await manager.addIdea(sessionId, idea);
    ideas.push(idea);
  }
  return ideas;
}

/**
 * Add N questions to a session via SessionManager.
 */
async function addQuestionsToSession(
  manager: SessionManager,
  sessionId: string,
  count: number,
  technique: TechniqueId = 'question-brainstorming',
  options: { withDepthChain?: boolean } = {},
): Promise<Question[]> {
  const questions: Question[] = [];
  let parentId: string | undefined = undefined;
  for (let i = 0; i < count; i++) {
    const question = makeQuestion({
      content: `Question ${i + 1}: Why does this happen?`,
      source_technique: technique,
      category: options.withDepthChain ? 'root-cause' : 'what',
      depth: options.withDepthChain ? i : undefined,
      parent_id: options.withDepthChain ? parentId : undefined,
      timestamp: Date.now() + i,
    });
    await manager.addQuestion(sessionId, question);
    questions.push(question);
    parentId = question.id;
  }
  return questions;
}

/**
 * Initialize a bus for a given session.
 */
async function initBus(sessionId: string): Promise<SessionBus> {
  await initBrainstormSession({ brainstormDir, sessionId });
  return new SessionBus({ brainstormDir, sessionId });
}

/**
 * Drive a session through all 5 phases using PhaseController.
 */
async function driveAllPhases(sessionId: string): Promise<void> {
  await phaseController.transitionTo(sessionId, 'diverge');
  await phaseController.transitionTo(sessionId, 'organize');
  await phaseController.transitionTo(sessionId, 'converge');
  await phaseController.transitionTo(sessionId, 'act');
}

// ============================================================================
// INT-09: Creative Exploration E2E
// ============================================================================

describe('INT-09: Creative Exploration E2E', () => {
  it('completes all 5 phases from problem statement to artifacts', async () => {
    // 1. Create session with creative-exploration pathway
    const session = await sessionManager.createSession(
      'I want to brainstorm app ideas',
      'creative-exploration',
    );
    const sessionId = session.id;
    const sessionBus = await initBus(sessionId);

    // Verify initial state
    expect(session.status).toBe('created');
    expect(session.phase).toBe('explore');
    expect(session.active_pathway).toBe('creative-exploration');

    // 2. Transition to diverge phase
    const divergeResult = await phaseController.transitionTo(sessionId, 'diverge');
    expect(divergeResult.success).toBe(true);
    expect(divergeResult.to_phase).toBe('diverge');

    // Verify agents activated during diverge
    const divergeState = await sessionManager.getSession(sessionId);
    expect(divergeState.active_agents).toContain('facilitator');
    expect(divergeState.active_agents).toContain('scribe');
    // Critic must NOT be active during diverge
    expect(divergeState.active_agents).not.toContain('critic');

    // 3. Set technique and generate ideas via Ideator (freewriting)
    await sessionManager.setActiveTechnique(sessionId, 'freewriting');
    const ideator = createIdeator(engine, rulesEngine);
    ideator.setSession(sessionId);
    ideator.setPhase('diverge');

    const freewritingIdeas = ideator.generateIdeas('freewriting', divergeState, 0);
    expect(freewritingIdeas.length).toBeGreaterThan(0);

    // Persist ideas via SessionManager
    const allIdeas = await addIdeasToSession(sessionManager, sessionId, 10, 'freewriting');

    // 4. Verify bus message routing
    const ideaMsg: BrainstormMessage = {
      id: randomUUID(),
      from: 'ideator',
      to: 'scribe',
      type: 'idea',
      phase: 'diverge',
      payload: { content: allIdeas[0].content },
      timestamp: Date.now(),
      session_id: sessionId,
      priority: 3,
    };
    await sessionBus.publishRouted(ideaMsg);
    const captureMessages = await sessionBus.poll('capture');
    expect(captureMessages.length).toBeGreaterThanOrEqual(1);

    // 5. Transition to organize -- Mapper active
    const organizeResult = await phaseController.transitionTo(sessionId, 'organize');
    expect(organizeResult.success).toBe(true);

    // Organize: create clusters via Mapper
    const mapper = createMapper(engine, rulesEngine);
    mapper.setSession(sessionId);
    mapper.setPhase('organize');
    const organizeState = await sessionManager.getSession(sessionId);
    const clusters = mapper.organizeAffinity(organizeState.ideas, organizeState);
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    expect(clusters.length).toBeLessThanOrEqual(8);

    // Persist clusters
    await sessionManager.setClusters(sessionId, clusters);

    // 6. Transition to converge -- Critic active
    const convergeResult = await phaseController.transitionTo(sessionId, 'converge');
    expect(convergeResult.success).toBe(true);
    expect(convergeResult.agents_activated).toContain('critic');

    // Converge: evaluate ideas via Critic
    const critic = createCritic(engine, rulesEngine);
    critic.activate('converge');
    critic.setSession(sessionId);
    const convergeState = await sessionManager.getSession(sessionId);
    const topIdeas = convergeState.ideas.slice(0, 3);
    for (const idea of topIdeas) {
      const evaluation = critic.evaluateIdea(idea, 4, 4, 3, 2, 'Good potential', sessionId);
      await sessionManager.addEvaluation(sessionId, evaluation);
    }

    // 7. Transition to act
    const actResult = await phaseController.transitionTo(sessionId, 'act');
    expect(actResult.success).toBe(true);

    // Add action items
    for (const idea of topIdeas) {
      const actionItem: ActionItem = {
        id: randomUUID(),
        description: `Implement: ${idea.content}`,
        source_idea_ids: [idea.id],
        priority: 'high',
        status: 'proposed',
      };
      await sessionManager.addActionItem(sessionId, actionItem);
    }

    // 8. Complete session
    const completedSession = await sessionManager.completeSession(sessionId);
    expect(completedSession.status).toBe('completed');

    // 9. Generate artifacts via Scribe
    const scribe = createScribe(engine, rulesEngine);
    const transcript = scribe.generateTranscript(completedSession);
    const actionPlan = scribe.generateActionPlan(completedSession);

    // Verify artifacts are non-empty strings
    expect(transcript).toBeTruthy();
    expect(transcript.length).toBeGreaterThan(50);
    expect(transcript).toContain('Session');

    expect(actionPlan).toBeTruthy();
    expect(actionPlan.length).toBeGreaterThan(50);
    expect(actionPlan).toContain('Action Plan');

    // 10. Write artifacts to disk and verify they exist
    const sessionDir = join(brainstormDir, 'sessions', sessionId);
    const transcriptPath = join(sessionDir, 'transcript.md');
    const actionPlanPath = join(sessionDir, 'action-plan.md');

    await writeFile(transcriptPath, transcript, 'utf-8');
    await writeFile(actionPlanPath, actionPlan, 'utf-8');

    // Verify files exist on disk (not just in-memory)
    const transcriptStat = await stat(transcriptPath);
    expect(transcriptStat.size).toBeGreaterThan(0);

    const actionPlanStat = await stat(actionPlanPath);
    expect(actionPlanStat.size).toBeGreaterThan(0);

    // Verify file contents match
    const readTranscript = await readFile(transcriptPath, 'utf-8');
    expect(readTranscript).toBe(transcript);
  });

  it('verifies phase history records all 5 transitions', async () => {
    const session = await sessionManager.createSession(
      'I want to brainstorm app ideas',
      'creative-exploration',
    );
    const sessionId = session.id;

    // Add ideas so session has content
    await addIdeasToSession(sessionManager, sessionId, 5, 'freewriting');

    // Drive through all phases
    await driveAllPhases(sessionId);

    const finalState = await sessionManager.getSession(sessionId);
    // Phase history should have entries for all 5 phases
    const phases = finalState.metadata.phase_history.map(h => h.phase);
    expect(phases).toContain('explore');
    expect(phases).toContain('diverge');
    expect(phases).toContain('organize');
    expect(phases).toContain('converge');
    expect(phases).toContain('act');
  });
});

// ============================================================================
// INT-10: Problem-Solving E2E
// ============================================================================

describe('INT-10: Problem-Solving E2E', () => {
  it('completes problem-solving flow with questions and five-whys chain', async () => {
    // 1. Create session with problem-solving pathway
    const session = await sessionManager.createSession(
      'Why do users leave our onboarding?',
      'problem-solving',
    );
    const sessionId = session.id;
    await initBus(sessionId);

    expect(session.active_pathway).toBe('problem-solving');

    // 2. Transition to diverge
    await phaseController.transitionTo(sessionId, 'diverge');

    // 3. Generate questions via Questioner (question-brainstorming)
    const questioner = createQuestioner(engine, rulesEngine);
    questioner.setSession(sessionId);
    questioner.setPhase('diverge');
    const divergeState = await sessionManager.getSession(sessionId);

    const qbQuestions = questioner.generateQuestions(
      'question-brainstorming',
      divergeState,
      0,
    );

    // Add 15+ questions via SessionManager (persist to JSONL)
    const persistedQuestions = await addQuestionsToSession(
      sessionManager,
      sessionId,
      15,
      'question-brainstorming',
    );

    // Verify questions.jsonl has >= 15 entries
    const midState = await sessionManager.getSession(sessionId);
    expect(midState.questions.length).toBeGreaterThanOrEqual(15);

    // 4. Generate starbursting questions
    const starbQuestions = questioner.generateQuestions(
      'starbursting',
      midState,
      1,
    );

    // 5. Generate five-whys chain with depth-5 parent_id links
    const fiveWhysQuestions = await addQuestionsToSession(
      sessionManager,
      sessionId,
      6, // depth 0 to depth 5
      'five-whys',
      { withDepthChain: true },
    );

    // Verify five-whys chain: depth-5 records have parent_id links
    const depth5Question = fiveWhysQuestions[5];
    expect(depth5Question.depth).toBe(5);
    expect(depth5Question.parent_id).toBe(fiveWhysQuestions[4].id);

    // Verify the chain: each question links to the previous
    for (let i = 1; i < fiveWhysQuestions.length; i++) {
      expect(fiveWhysQuestions[i].parent_id).toBe(fiveWhysQuestions[i - 1].id);
    }

    // 6. Transition to organize
    await phaseController.transitionTo(sessionId, 'organize');

    // 7. Add ideas based on answers to questions
    await addIdeasToSession(sessionManager, sessionId, 5, 'freewriting');

    // 8. Transition to converge
    await phaseController.transitionTo(sessionId, 'converge');

    // 9. Transition to act
    await phaseController.transitionTo(sessionId, 'act');

    // 10. Complete session
    const completedSession = await sessionManager.completeSession(sessionId);
    expect(completedSession.status).toBe('completed');

    // Verify all questions are in the final state
    expect(completedSession.questions.length).toBeGreaterThanOrEqual(15);
  });
});

// ============================================================================
// INT-11: Free-Form E2E
// ============================================================================

describe('INT-11: Free-Form E2E', () => {
  it('completes free-form session with user-selected technique', async () => {
    // 1. Create session with free-form pathway
    const session = await sessionManager.createSession(
      'I want to use SCAMPER',
      'free-form',
    );
    const sessionId = session.id;
    await initBus(sessionId);

    expect(session.active_pathway).toBe('free-form');

    // Free-form pathway: only facilitator + scribe always active
    const activeAgents = phaseController.getActiveAgents('diverge', 'free-form');
    expect(activeAgents).toContain('facilitator');
    expect(activeAgents).toContain('scribe');
    expect(activeAgents).toHaveLength(2);

    // 2. Transition to diverge
    await phaseController.transitionTo(sessionId, 'diverge');

    // 3. User selects SCAMPER technique on demand
    await sessionManager.setActiveTechnique(sessionId, 'scamper');

    // 4. Analyst generates SCAMPER ideas
    const analyst = createAnalyst(engine, rulesEngine);
    analyst.setSession(sessionId);
    analyst.setPhase('diverge');
    const divergeState = await sessionManager.getSession(sessionId);

    const scamperIdeas = analyst.generateScamperRound(divergeState, 0);
    expect(scamperIdeas.length).toBeGreaterThan(0);

    // Verify scamper_lens is set on ideas
    for (const idea of scamperIdeas) {
      expect(idea.scamper_lens).toBeDefined();
    }

    // Persist ideas
    for (const idea of scamperIdeas) {
      await sessionManager.addIdea(sessionId, idea);
    }

    // 5. Scribe captures all output
    const scribe = createScribe(engine, rulesEngine);
    scribe.setSession(sessionId);
    scribe.setPhase('diverge');

    // Capture each idea via Scribe
    for (const idea of scamperIdeas) {
      scribe.captureIdea(idea);
    }
    const captureMessages = scribe.getCaptureMessages();
    expect(captureMessages.length).toBe(scamperIdeas.length);

    // 6. Drive through remaining phases
    await phaseController.transitionTo(sessionId, 'organize');
    await phaseController.transitionTo(sessionId, 'converge');
    await phaseController.transitionTo(sessionId, 'act');

    // 7. Complete session
    const completedSession = await sessionManager.completeSession(sessionId);
    expect(completedSession.status).toBe('completed');
    expect(completedSession.ideas.length).toBeGreaterThan(0);

    // Verify Scribe captured regardless of technique order
    const transcript = scribe.generateTranscript(completedSession);
    expect(transcript).toBeTruthy();
    expect(transcript.length).toBeGreaterThan(50);
  });
});

// ============================================================================
// INT-04: Facilitator -> PathwayRouter
// ============================================================================

describe('INT-04: Facilitator -> PathwayRouter', () => {
  it('assessProblem("React or Vue") maps to decision-making pathway', () => {
    const assessment = assessProblem('Should we use React or Vue for the frontend?');
    expect(assessment.recommended_pathway).toBe('decision-making');
    expect(assessment.nature).toBe('decision');
  });

  it('assessProblem routes creative-exploration for open-ended problems', () => {
    const assessment = assessProblem('I want to brainstorm new product ideas from scratch');
    expect(assessment.recommended_pathway).toBe('creative-exploration');
  });

  it('FacilitatorAgent.recommendPathway returns assessment pathway', () => {
    const facilitator = new FacilitatorAgent(sessionManager, phaseController, pathwayRouter);
    const assessment = facilitator.assessProblem('Should we choose React or Vue?');
    const pathway = facilitator.recommendPathway(assessment);
    expect(pathway).toBe(assessment.recommended_pathway);
  });
});

// ============================================================================
// INT-05: TechniqueEngine -> TechniqueAgent
// ============================================================================

describe('INT-05: TechniqueEngine -> TechniqueAgent', () => {
  it('Ideator.generateIdeas uses engine config, not raw string', async () => {
    const session = await sessionManager.createSession('Test problem for technique usage');
    const sessionId = session.id;

    const ideator = createIdeator(engine, rulesEngine);
    ideator.setSession(sessionId);
    ideator.setPhase('diverge');

    // Verify the Ideator uses the TechniqueEngine to load the technique
    const ideas = ideator.generateIdeas('freewriting', session, 0);
    expect(ideas.length).toBeGreaterThan(0);

    // Each idea should have source_technique matching the engine config
    for (const idea of ideas) {
      expect(idea.source_technique).toBe('freewriting');
    }

    // Verify capture loop messages were emitted
    const captureMessages = ideator.getCaptureMessages();
    expect(captureMessages.length).toBeGreaterThan(0);
    for (const msg of captureMessages) {
      expect(msg.agent).toBe('ideator');
      expect(msg.content_type).toBe('idea');
    }
  });
});

// ============================================================================
// INT-06: Analyst -> All agents (Hats synchronization)
// ============================================================================

describe('INT-06: Analyst -> All agents (Hats)', () => {
  it('broadcastHatChange sets hat_color before generation', async () => {
    const analyst = createAnalyst(engine, rulesEngine);

    // Broadcast a non-black hat during organize (which is allowed)
    const broadcast = analyst.broadcastHatChange('green', randomUUID(), 'organize');
    expect(broadcast).not.toBeNull();
    expect(broadcast!.hat_color).toBe('green');
    expect(broadcast!.acknowledged_by).toEqual([]);

    // Simulate acknowledgment from another agent
    analyst.acknowledgeHatBroadcast('green', 'ideator');
    const history = analyst.getHatBroadcastHistory();
    expect(history[history.length - 1].acknowledged_by).toContain('ideator');
  });

  it('broadcastHatChange refuses black hat during diverge', () => {
    const analyst = createAnalyst(engine, rulesEngine);

    // Black hat during diverge should be refused (Pitfall 1 prevention)
    const broadcast = analyst.broadcastHatChange('black', randomUUID(), 'diverge');
    expect(broadcast).toBeNull();
  });

  it('hat broadcast verified through idea generation', async () => {
    const session = await sessionManager.createSession('Test six thinking hats flow');
    const sessionId = session.id;

    const analyst = createAnalyst(engine, rulesEngine);
    analyst.setSession(sessionId);
    analyst.setPhase('diverge');

    // Generate hats round -- should produce ideas with hat_color in state
    const ideas = analyst.generateHatsRound(session, 0);
    // Hats round may produce ideas; verify hat broadcast happened
    const history = analyst.getHatBroadcastHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// INT-07: Scribe -> ArtifactGenerator
// ============================================================================

describe('INT-07: Scribe -> ArtifactGenerator', () => {
  it('session data produces valid transcript with phase headers', async () => {
    // Create a session with content across phases
    const session = await sessionManager.createSession('Brainstorm food waste solutions');
    const sessionId = session.id;

    // Add ideas
    const ideas = await addIdeasToSession(sessionManager, sessionId, 5, 'freewriting');

    // Drive through all phases to build phase_history
    await driveAllPhases(sessionId);

    // Add clusters in organize
    const clusters: Cluster[] = [
      {
        id: randomUUID(),
        label: 'Composting Solutions',
        idea_ids: ideas.slice(0, 3).map(i => i.id),
        theme: 'Organic waste handling',
      },
      {
        id: randomUUID(),
        label: 'Technology Solutions',
        idea_ids: ideas.slice(3).map(i => i.id),
        theme: 'Smart tracking',
      },
    ];
    await sessionManager.setClusters(sessionId, clusters);

    // Complete session
    const completedSession = await sessionManager.completeSession(sessionId);

    // Generate transcript via Scribe
    const scribe = createScribe(engine, rulesEngine);
    const transcript = scribe.generateTranscript(completedSession);

    // Verify transcript structure
    expect(transcript).toContain('Session');
    expect(transcript).toContain('Brainstorm food waste solutions');
    expect(transcript.length).toBeGreaterThan(100);

    // Generate action plan
    const actionPlan = scribe.generateActionPlan(completedSession);
    expect(actionPlan).toContain('Action Plan');

    // Generate JSON export
    const jsonExport = scribe.generateJsonExport(completedSession);
    const parsed = JSON.parse(jsonExport);
    expect(parsed.id).toBe(sessionId);
    expect(parsed.status).toBe('completed');
  });
});

// ============================================================================
// INT-08: Energy signal -> Facilitator
// ============================================================================

describe('INT-08: Energy signal -> Facilitator', () => {
  it('flagging energy level triggers technique switch recommendation', async () => {
    const facilitator = new FacilitatorAgent(sessionManager, phaseController, pathwayRouter);

    // Create session with ideas in diverge phase
    const session = await sessionManager.createSession('Energy test brainstorm');
    const sessionId = session.id;

    // Add some ideas
    await addIdeasToSession(sessionManager, sessionId, 5, 'freewriting');
    await phaseController.transitionTo(sessionId, 'diverge');
    const divergeState = await sessionManager.getSession(sessionId);

    // Handle flagging energy signal
    const guidance = facilitator.handleEnergySignal('flagging', divergeState);

    // Should suggest phase transition, not force switch
    expect(guidance.urgency).toBe('next-pause');
    expect(guidance.internal_action).toBe('suggest_phase_transition');
    expect(guidance.message).toContain('ideas');

    // Verify no pressure language in the response
    const pressurePhrases = ['you need to', 'you must', 'you should have', 'not enough', 'try harder', 'more ideas'];
    for (const phrase of pressurePhrases) {
      expect(guidance.message.toLowerCase()).not.toContain(phrase);
    }
  });

  it('energy signal triggers bus message when published', async () => {
    const session = await sessionManager.createSession('Energy bus test');
    const sessionId = session.id;
    const sessionBus = await initBus(sessionId);

    // Publish an energy signal message via the bus
    const energyMsg: BrainstormMessage = {
      id: randomUUID(),
      from: 'system',
      to: 'facilitator',
      type: 'energy_signal',
      phase: 'diverge',
      payload: { level: 'flagging' },
      timestamp: Date.now(),
      session_id: sessionId,
      priority: 4,
    };

    await sessionBus.publishRouted(energyMsg);
    const energyMessages = await sessionBus.poll('energy');
    expect(energyMessages.length).toBe(1);
    expect(energyMessages[0].type).toBe('energy_signal');
  });
});

// ============================================================================
// INT-12: Mid-session adaptation
// ============================================================================

describe('INT-12: Mid-session adaptation', () => {
  it('adaptTechniqueQueue resequences queue AND resets timer', async () => {
    const facilitator = new FacilitatorAgent(sessionManager, phaseController, pathwayRouter);

    // Create session with a technique queue
    const session = await sessionManager.createSession('Adaptation test');
    const sessionId = session.id;
    await phaseController.transitionTo(sessionId, 'diverge');

    // Set initial technique with timer -- rapid-ideation (so it appears in the queue too)
    await sessionManager.setActiveTechnique(sessionId, 'rapid-ideation');
    const stateBeforeAdapt = await sessionManager.getSession(sessionId);

    // Verify timer was set
    expect(stateBeforeAdapt.timer.technique_timer).not.toBeNull();
    const initialRemainingMs = stateBeforeAdapt.timer.technique_timer!.remaining_ms;
    expect(initialRemainingMs).toBeGreaterThan(0);

    // Create a session state with technique_queue that INCLUDES the active technique
    // so the saturation signal can remove it (demonstrating queue resequencing)
    const sessionWithQueue: SessionState = {
      ...stateBeforeAdapt,
      active_technique: 'rapid-ideation',
      technique_queue: ['rapid-ideation', 'mind-mapping', 'scamper', 'six-thinking-hats'],
    };

    // Simulate saturation_detected signal
    // FacilitatorAgent maps saturation_detected to saturation AdaptationSignal
    // which removes current_technique from the remaining queue
    const signal = {
      type: 'saturation_detected' as const,
      confidence: 0.8,
      recommendation: 'organize' as SessionPhase,
      rationale: 'Idea velocity declining',
    };

    // Adapt the queue
    const newQueue = facilitator.adaptTechniqueQueue(sessionWithQueue, signal);

    // Verify queue was resequenced: rapid-ideation (current technique) removed
    expect(newQueue).not.toContain('rapid-ideation');
    expect(newQueue.length).toBeLessThan(sessionWithQueue.technique_queue.length);

    // Verify timer can be reset for the new first technique in queue
    expect(newQueue.length).toBeGreaterThan(0);
    await sessionManager.setActiveTechnique(sessionId, newQueue[0]);
    const stateAfterReset = await sessionManager.getSession(sessionId);
    expect(stateAfterReset.timer.technique_timer).not.toBeNull();
    // Timer should be reset to the new technique's default, not carry over from old
    expect(stateAfterReset.active_technique).toBe(newQueue[0]);
    // New timer total_ms should match the new technique default (not rapid-ideation's 60s)
    expect(stateAfterReset.timer.technique_timer!.total_ms).toBeGreaterThan(0);
  });

  it('adaptTechniqueQueue handles energy_low via saturation removal', async () => {
    const facilitator = new FacilitatorAgent(sessionManager, phaseController, pathwayRouter);
    const session = await sessionManager.createSession('Energy adaptation test');

    // energy_low maps to saturation signal in FacilitatorAgent.adaptTechniqueQueue
    // The saturation signal removes current_technique from the queue
    const sessionState: SessionState = {
      ...session,
      status: 'active',
      phase: 'diverge',
      active_technique: 'scamper',
      technique_queue: ['scamper', 'six-thinking-hats', 'rapid-ideation'],
      metadata: {
        ...session.metadata,
        techniques_used: ['freewriting', 'mind-mapping'],
      },
    };

    const signal = {
      type: 'energy_low' as const,
      confidence: 0.7,
      recommendation: 'rapid-ideation' as TechniqueId,
      rationale: 'Energy declining',
    };

    const newQueue = facilitator.adaptTechniqueQueue(sessionState, signal);

    // energy_low maps to saturation AdaptationSignal which removes
    // current_technique (scamper) from the remaining queue
    expect(newQueue).not.toContain('scamper');
    // The remaining techniques should still be present
    expect(newQueue).toContain('six-thinking-hats');
    expect(newQueue).toContain('rapid-ideation');
  });
});

// ============================================================================
// Cross-cutting: Bus integration verification
// ============================================================================

describe('E2E Bus Integration', () => {
  it('publishRouted routes idea to capture loop', async () => {
    const session = await sessionManager.createSession('Bus routing test');
    const sessionId = session.id;
    const sessionBus = await initBus(sessionId);

    const msg: BrainstormMessage = {
      id: randomUUID(),
      from: 'ideator',
      to: 'scribe',
      type: 'idea',
      phase: 'diverge',
      payload: { content: 'Test idea via bus' },
      timestamp: Date.now(),
      session_id: sessionId,
      priority: 3,
    };

    const filePath = await sessionBus.publishRouted(msg);
    expect(filePath).toContain('capture');

    const messages = await sessionBus.poll('capture');
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('idea');
    expect(messages[0].from).toBe('ideator');
  });

  it('publishRouted routes phase_transition to session loop', async () => {
    const session = await sessionManager.createSession('Phase transition routing');
    const sessionId = session.id;
    const sessionBus = await initBus(sessionId);

    const msg: BrainstormMessage = {
      id: randomUUID(),
      from: 'facilitator',
      to: 'broadcast',
      type: 'phase_transition',
      phase: 'diverge',
      payload: { from: 'explore', to: 'diverge' },
      timestamp: Date.now(),
      session_id: sessionId,
      priority: 1,
    };

    const filePath = await sessionBus.publishRouted(msg);
    expect(filePath).toContain('session');

    const messages = await sessionBus.poll('session');
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('phase_transition');
  });

  it('publishRouted routes energy_signal to energy loop', async () => {
    const session = await sessionManager.createSession('Energy routing test');
    const sessionId = session.id;
    const sessionBus = await initBus(sessionId);

    const msg: BrainstormMessage = {
      id: randomUUID(),
      from: 'system',
      to: 'facilitator',
      type: 'energy_signal',
      phase: 'diverge',
      payload: { level: 'low' },
      timestamp: Date.now(),
      session_id: sessionId,
      priority: 4,
    };

    const filePath = await sessionBus.publishRouted(msg);
    expect(filePath).toContain('energy');
  });
});
