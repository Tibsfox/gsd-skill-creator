import { describe, it, expect } from 'vitest';
import { assessClarity } from './clarity-assessor.js';
import type { ClarityAssessment } from './types.js';

describe('assessClarity', () => {
  it('routes a well-structured document as clear', () => {
    const content = `# Project Overview

We are building a task management API that allows users to create, update,
and delete tasks. The API will be RESTful and use JSON for request/response
bodies. Authentication will use JWT tokens.

## Goals

- Provide a clean REST API for task CRUD operations
- Support user authentication and authorization
- Enable task assignment to team members
- Track task status through a defined lifecycle

## Technical Stack

We will use Node.js with Express for the server, PostgreSQL for the database,
and Jest for testing. The API will follow OpenAPI 3.0 specification.

## Constraints

- Must support 1000 concurrent users
- Response time under 200ms for all endpoints
- 99.9% uptime SLA requirement
- Data must be encrypted at rest and in transit

## Deliverables

1. REST API with full CRUD for tasks
2. JWT authentication system
3. Database schema and migrations
4. API documentation in OpenAPI format
5. Integration test suite with 80% coverage
`;

    const result = assessClarity(content);

    expect(result.route).toBe('clear');
    expect(result.gaps).toEqual([]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.sections.length).toBeGreaterThanOrEqual(3);
    expect(result.reason).toBeTruthy();
  });

  it('routes a document with missing sections as gaps', () => {
    const content = `# Feature Request

We want to add user notifications to the platform.
Users should receive alerts when certain events happen.

## Description

The notification system should support email and in-app notifications.
We need to handle different event types and user preferences.
`;

    const result = assessClarity(content);

    expect(result.route).toBe('gaps');
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.confidence).toBeLessThanOrEqual(0.7);
    expect(result.reason).toBeTruthy();
  });

  it('routes an incoherent/minimal document as confused', () => {
    const content = 'make it work better somehow';

    const result = assessClarity(content);

    expect(result.route).toBe('confused');
    expect(result.gaps).toEqual([]);
    expect(result.confidence).toBeLessThan(0.3);
    expect(result.reason).toBeTruthy();
  });

  it('detects section headings in sections array', () => {
    const content = `# Introduction

Some intro text here.

## Background

More background information.

## Requirements

The requirements are listed below.

### Sub-requirements

Detail items here.
`;

    const result = assessClarity(content);

    expect(result.sections).toContain('Introduction');
    expect(result.sections).toContain('Background');
    expect(result.sections).toContain('Requirements');
    expect(result.sections).toContain('Sub-requirements');
  });

  it('identifies specific gaps with targeted questions', () => {
    const content = `# Project Plan

We are building a new dashboard for the analytics team.

## Goals

Show real-time metrics and historical trends.
Allow filtering by date range and team.
`;

    const result = assessClarity(content);

    expect(result.route).toBe('gaps');

    // Gaps should have meaningful area and question fields
    for (const gap of result.gaps) {
      expect(gap.area).toBeTruthy();
      expect(gap.question).toBeTruthy();
      expect(gap.area.length).toBeGreaterThan(0);
      expect(gap.question.length).toBeGreaterThan(0);
    }
  });

  it('routes empty content as confused', () => {
    const result = assessClarity('');

    expect(result.route).toBe('confused');
    expect(result.gaps).toEqual([]);
    expect(result.reason).toBeTruthy();
  });

  it('routes a single sentence as confused', () => {
    const result = assessClarity('Build a web application for managing inventory.');

    expect(result.route).toBe('confused');
    expect(result.gaps).toEqual([]);
    expect(result.reason).toBeTruthy();
  });

  it('routes headings with no content as gaps', () => {
    const content = `# Project

## Goals

## Technical Approach

## Timeline
`;

    const result = assessClarity(content);

    expect(result.route).toBe('gaps');
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.reason).toBeTruthy();
  });

  it('routes a rich document with code blocks and lists as clear', () => {
    const content = `# API Authentication Module

Implement JWT-based authentication for the REST API. This module handles
user login, token generation, refresh, and validation.

## Implementation Details

The authentication flow uses RS256 signing with rotating keys:

\`\`\`typescript
interface AuthConfig {
  issuer: string;
  audience: string;
  accessTokenTTL: number;
  refreshTokenTTL: number;
}
\`\`\`

## Endpoints

- POST /auth/login - Authenticate with email/password
- POST /auth/refresh - Refresh an expired access token
- POST /auth/logout - Invalidate refresh token
- GET /auth/me - Get current user profile

## Security Requirements

1. Access tokens expire after 15 minutes
2. Refresh tokens expire after 7 days
3. Passwords hashed with bcrypt (cost factor 12)
4. Rate limiting: 5 attempts per minute per IP
5. CORS restricted to allowed origins

## Error Handling

All auth errors return structured JSON:

\`\`\`json
{
  "error": "invalid_credentials",
  "message": "Email or password is incorrect",
  "status": 401
}
\`\`\`
`;

    const result = assessClarity(content);

    expect(result.route).toBe('clear');
    expect(result.gaps).toEqual([]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('always provides a non-empty reason string', () => {
    const testCases = [
      '', // empty
      'just a sentence', // minimal
      '# Heading\n\n## Sub\n\nSome content', // partial
      '# Full\n\n## Goals\n\nGoal text\n\n## Stack\n\nNode.js\n\n## Plan\n\nStep 1\n\n## Done\n\nCriteria', // full
    ];

    for (const content of testCases) {
      const result = assessClarity(content);
      expect(result.reason).toBeTruthy();
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it('returns valid ClarityAssessment structure for all routes', () => {
    const clearDoc = `# Overview\n\nDetailed overview.\n\n## Goals\n\nGoals here.\n\n## Constraints\n\nConstraints.\n\n## Deliverables\n\nItems.\n\n## Timeline\n\nSchedule.`;
    const gapsDoc = `# Feature\n\nWe need a feature.\n\n## Description\n\nSome description of what it does.`;
    const confusedDoc = 'fix it';

    for (const content of [clearDoc, gapsDoc, confusedDoc]) {
      const result: ClarityAssessment = assessClarity(content);

      expect(['clear', 'gaps', 'confused']).toContain(result.route);
      expect(typeof result.reason).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.sections)).toBe(true);
    }
  });
});
