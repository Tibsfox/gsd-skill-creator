/**
 * Integration tests for the complete intake flow pipeline.
 *
 * These tests exercise the full end-to-end intake flow using the
 * real filesystem (temp directories). No mocks -- validates that
 * all components work together: stageDocument, runIntakeFlow,
 * confirmIntake, resumeIntakeFlow, and barrel exports.
 *
 * @module staging/intake-flow/integration.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  stageDocument,
  runIntakeFlow,
  confirmIntake,
  resumeIntakeFlow,
  readFlowState,
  assessClarity,
  recordStep,
  getResumePoint,
  CLARITY_ROUTES,
  INTAKE_FLOW_STEPS,
} from '../index.js';

// ---------------------------------------------------------------------------
// Test document constants
// ---------------------------------------------------------------------------

/** Well-structured document with 3+ headings, 200+ words, specificity signals. */
const CLEAR_DOC = `# Build a REST API for User Management

## Goals and Objectives

The goal of this project is to build a production-ready REST API for managing
user accounts. We need to support CRUD operations, authentication via JWT tokens
with a 15min expiry, and role-based access control for admin and regular users.
The API must handle at least 1000 concurrent requests with response times under 200ms.

## Technical Approach

We will use Node.js 20 with TypeScript 5.x and Express.js as the HTTP framework.
Database layer will use PostgreSQL 16 with Prisma ORM for type-safe queries.
Authentication uses jose library for JWT operations. Rate limiting via
express-rate-limit at 100 req/min per IP.

\`\`\`typescript
// Example endpoint structure
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  return res.json(user);
});
\`\`\`

## Deliverables and Success Criteria

- REST API with 5 endpoints: list, get, create, update, delete
- JWT authentication with refresh token rotation
- Role-based access control (admin, user roles)
- OpenAPI 3.0 specification document
- Integration test suite with 90% coverage target
- Docker Compose setup for local development

## Constraints and Requirements

- Must run on Node.js 20 LTS
- PostgreSQL 16 required (no SQLite fallback)
- All responses must follow JSON:API specification
- Maximum 50MB memory footprint per container
- Deployment target: AWS ECS with Fargate
`;

/** Document with structure but missing content (gaps). */
const GAPS_DOC = `# Migration Plan

## Overview

We need to migrate the legacy system to the new platform. The current system
handles about 500 users and has been running for 3 years.

## Timeline

TBD -- need to discuss with stakeholders

## Data Migration Steps

TODO: define the actual migration steps

## Rollback Plan

`;

/** Confused document -- too minimal, no structure. */
const CONFUSED_DOC = `fix bugs`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDirs: string[] = [];

async function createTmpDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'intake-flow-integration-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tmpDirs) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  tmpDirs = [];
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('intake flow integration', () => {
  it('routes a clear document end-to-end: stage -> flow -> confirm -> ready', async () => {
    const basePath = await createTmpDir();
    const filename = 'clear-doc.md';

    // Stage the document
    const staged = await stageDocument({
      basePath,
      filename,
      content: CLEAR_DOC,
      source: 'integration-test',
    });
    expect(staged.documentPath).toContain(filename);
    expect(staged.metadataPath).toContain(`${filename}.meta.json`);

    // Run intake flow
    const result = await runIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    expect(result.route).toBe('clear');
    expect(result.needsConfirmation).toBe(true);
    expect(result.step).toBe('assessed');
    expect(result.message).toContain('clear and ready');

    // Verify document moved to checking
    const checkingDocPath = join(basePath, '.planning/staging/checking', filename);
    const checkingContent = await readFile(checkingDocPath, 'utf-8');
    expect(checkingContent).toBe(CLEAR_DOC);

    // Verify metadata has steps recorded
    const checkingMetaPath = join(basePath, '.planning/staging/checking', `${filename}.meta.json`);
    const flowState = await readFlowState(checkingMetaPath);
    expect(flowState.completedSteps).toContain('hygiene');
    expect(flowState.completedSteps).toContain('assessed');
    expect(flowState.assessment).toBeDefined();

    // Confirm the document
    const confirmed = await confirmIntake({
      basePath,
      filename,
    });

    expect(confirmed.route).toBe('clear');
    expect(confirmed.step).toBe('confirmed');
    expect(confirmed.needsConfirmation).toBe(false);

    // Verify document moved to ready
    const readyDocPath = join(basePath, '.planning/staging/ready', filename);
    const readyContent = await readFile(readyDocPath, 'utf-8');
    expect(readyContent).toBe(CLEAR_DOC);
  });

  it('routes a gaps document end-to-end: stage -> flow -> gaps with questions', async () => {
    const basePath = await createTmpDir();
    const filename = 'gaps-doc.md';

    // Stage the document
    await stageDocument({
      basePath,
      filename,
      content: GAPS_DOC,
      source: 'integration-test',
    });

    // Run intake flow
    const result = await runIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    expect(result.route).toBe('gaps');
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.needsConfirmation).toBe(false);
    expect(result.message).toContain('gaps');

    // Document should be in checking state (awaiting user input)
    const checkingDocPath = join(basePath, '.planning/staging/checking', filename);
    const checkingContent = await readFile(checkingDocPath, 'utf-8');
    expect(checkingContent).toBe(GAPS_DOC);
  });

  it('routes a confused document end-to-end: stage -> flow -> restatement needed', async () => {
    const basePath = await createTmpDir();
    const filename = 'confused-doc.md';

    // Stage the document
    await stageDocument({
      basePath,
      filename,
      content: CONFUSED_DOC,
      source: 'integration-test',
    });

    // Run intake flow
    const result = await runIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    expect(result.route).toBe('confused');
    expect(result.message).toContain('restatement');
    expect(result.needsConfirmation).toBe(false);
    expect(result.questions).toEqual([]);
  });

  it('recovers from crash: stage -> flow -> simulate crash -> resume -> complete', async () => {
    const basePath = await createTmpDir();
    const filename = 'crash-doc.md';

    // Stage the document
    await stageDocument({
      basePath,
      filename,
      content: CLEAR_DOC,
      source: 'integration-test',
    });

    // Run full intake flow (completes through hygiene and assessment)
    const firstResult = await runIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    expect(firstResult.route).toBe('clear');
    expect(firstResult.step).toBe('assessed');

    // Verify flow state shows 'assessed' as last completed step
    const checkingMetaPath = join(basePath, '.planning/staging/checking', `${filename}.meta.json`);
    const flowState = await readFlowState(checkingMetaPath);
    expect(flowState.currentStep).toBe('assessed');
    expect(flowState.completedSteps).toContain('assessed');

    // Simulate crash: create a fresh context (no in-memory state)
    // The only state is on the filesystem in the metadata
    const resumeResult = await resumeIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    // Resume should pick up from the correct step (confirmed is next after assessed)
    expect(resumeResult).not.toBeNull();
    expect(resumeResult!.route).toBe('clear');
    // The resume detects we need confirmation next
    expect(resumeResult!.step).toBe('assessed');
  });

  it('confirms with additional context and persists it in metadata', async () => {
    const basePath = await createTmpDir();
    const filename = 'context-doc.md';

    // Stage and run through flow
    await stageDocument({
      basePath,
      filename,
      content: CLEAR_DOC,
      source: 'integration-test',
    });

    await runIntakeFlow({
      basePath,
      filename,
      source: 'integration-test',
    });

    // Confirm with additional context
    const confirmed = await confirmIntake({
      basePath,
      filename,
      additionalContext: 'also handle error cases',
    });

    expect(confirmed.step).toBe('confirmed');

    // Verify additionalContext persisted in metadata (now in ready/)
    const readyMetaPath = join(basePath, '.planning/staging/ready', `${filename}.meta.json`);
    const rawMeta = await readFile(readyMetaPath, 'utf-8');
    const meta = JSON.parse(rawMeta);
    expect(meta.intake_flow.additionalContext).toBe('also handle error cases');
    expect(meta.intake_flow.userConfirmed).toBe(true);
  });

  it('barrel exports are all importable and functional', () => {
    // Value exports: functions must be callable
    expect(typeof assessClarity).toBe('function');
    expect(typeof recordStep).toBe('function');
    expect(typeof getResumePoint).toBe('function');
    expect(typeof readFlowState).toBe('function');
    expect(typeof runIntakeFlow).toBe('function');
    expect(typeof confirmIntake).toBe('function');
    expect(typeof resumeIntakeFlow).toBe('function');

    // Constant exports: arrays must exist
    expect(CLARITY_ROUTES).toEqual(['clear', 'gaps', 'confused']);
    expect(INTAKE_FLOW_STEPS).toEqual(['staged', 'hygiene', 'assessed', 'confirmed', 'queued']);
  });
});
