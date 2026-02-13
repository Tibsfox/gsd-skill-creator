/**
 * TDD tests for the vision document analyzer.
 *
 * Tests analyzeVision() extraction of domain requirements,
 * complexity signals, ambiguity markers, and external dependencies
 * from raw document text.
 *
 * @module staging/resource/analyzer.test
 */

import { describe, it, expect } from 'vitest';
import { analyzeVision } from './analyzer.js';
import type { VisionAnalysis } from './types.js';

describe('analyzeVision', () => {
  describe('domain requirements extraction', () => {
    it('extracts requirements from structured document with headings and bullet points', () => {
      const content = `# Authentication
- Users must be able to log in with email and password
- Support OAuth2 with Google and GitHub providers

# Data Storage
- Store user profiles in a relational database
- Cache frequently accessed data in Redis
`;
      const result: VisionAnalysis = analyzeVision(content);
      expect(result.requirements.length).toBeGreaterThanOrEqual(4);

      const authReqs = result.requirements.filter(
        (r) => r.category.toLowerCase().includes('authentication'),
      );
      expect(authReqs.length).toBeGreaterThanOrEqual(1);

      const storageReqs = result.requirements.filter(
        (r) => r.category.toLowerCase().includes('data') || r.category.toLowerCase().includes('storage'),
      );
      expect(storageReqs.length).toBeGreaterThanOrEqual(1);

      for (const req of result.requirements) {
        expect(req.id).toBeTruthy();
        expect(req.description).toBeTruthy();
        expect(req.category).toBeTruthy();
        expect(req.confidence).toBeGreaterThanOrEqual(0);
        expect(req.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('complexity signal detection', () => {
    it('detects multi-phase signal when document mentions phases', () => {
      const content = `# Project Plan
Phase 1: Set up infrastructure
Phase 2: Build core features
Phase 3: Polish and deploy
`;
      const result = analyzeVision(content);
      const multiPhase = result.complexity.find(
        (c) => c.signal === 'multi-phase',
      );
      expect(multiPhase).toBeDefined();
      expect(multiPhase!.evidence).toBeTruthy();
    });

    it('detects external-integration signal when APIs or libraries mentioned', () => {
      const content = `# Integration
We need to call the Stripe API for payment processing.
The Twilio SDK will handle SMS notifications.
`;
      const result = analyzeVision(content);
      const extIntegration = result.complexity.find(
        (c) => c.signal === 'external-integration',
      );
      expect(extIntegration).toBeDefined();
      expect(extIntegration!.evidence).toBeTruthy();
    });

    it('detects novel-domain signal when no established patterns referenced', () => {
      const content = `# Research Phase
This is a novel approach to quantum-resistant encryption.
No established patterns exist for this use case.
We need to explore and research new algorithms.
`;
      const result = analyzeVision(content);
      const novel = result.complexity.find(
        (c) => c.signal === 'novel-domain',
      );
      expect(novel).toBeDefined();
      expect(novel!.evidence).toBeTruthy();
    });

    it('sets complexity level on each signal', () => {
      const content = `Phase 1: Research. Phase 2: Build.
We will call the Stripe API. No established patterns exist.`;
      const result = analyzeVision(content);

      for (const signal of result.complexity) {
        expect(['low', 'medium', 'high', 'critical']).toContain(signal.level);
      }
    });
  });

  describe('ambiguity detection', () => {
    it('identifies vague language tokens', () => {
      const content = `# Requirements
- The system should somehow handle user authentication
- Maybe add support for file uploads
- Features TBD based on feedback
- Various performance optimizations etc.
`;
      const result = analyzeVision(content);
      expect(result.ambiguities.length).toBeGreaterThanOrEqual(3);

      for (const ambiguity of result.ambiguities) {
        expect(ambiguity.text).toBeTruthy();
        expect(ambiguity.reason).toBeTruthy();
        expect(ambiguity.location).toBeTruthy();
      }
    });

    it('detects requirements without acceptance criteria', () => {
      const content = `# Goals
- Improve performance
- Better error handling
- Enhanced user experience
`;
      const result = analyzeVision(content);
      // These are vague requirements without measurable criteria
      expect(result.ambiguities.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('external dependency extraction', () => {
    it('extracts library references', () => {
      const content = `# Tech Stack
- Use React for the frontend
- Integrate Stripe for payments
- Use PostgreSQL for data storage
`;
      const result = analyzeVision(content);
      expect(result.dependencies.length).toBeGreaterThanOrEqual(3);

      const react = result.dependencies.find(
        (d) => d.name.toLowerCase().includes('react'),
      );
      expect(react).toBeDefined();

      const stripe = result.dependencies.find(
        (d) => d.name.toLowerCase().includes('stripe'),
      );
      expect(stripe).toBeDefined();

      const pg = result.dependencies.find(
        (d) => d.name.toLowerCase().includes('postgresql') || d.name.toLowerCase().includes('postgres'),
      );
      expect(pg).toBeDefined();

      for (const dep of result.dependencies) {
        expect(dep.name).toBeTruthy();
        expect(['api', 'library', 'service', 'database', 'tool']).toContain(dep.type);
        expect(dep.confidence).toBeGreaterThanOrEqual(0);
        expect(dep.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('extracts API endpoint references', () => {
      const content = `# Integration
Connect to the GitHub API for repository data.
Use the AWS S3 API for file storage.
`;
      const result = analyzeVision(content);
      expect(result.dependencies.length).toBeGreaterThanOrEqual(2);

      const github = result.dependencies.find(
        (d) => d.name.toLowerCase().includes('github'),
      );
      expect(github).toBeDefined();
    });

    it('extracts database names', () => {
      const content = `# Data Layer
Primary data in PostgreSQL.
Session cache in Redis.
Document store in MongoDB.
`;
      const result = analyzeVision(content);
      const dbDeps = result.dependencies.filter((d) => d.type === 'database');
      expect(dbDeps.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('overall complexity', () => {
    it('sets overallComplexity based on highest signal level', () => {
      const content = `Phase 1: Research novel quantum encryption.
Phase 2: Integrate Stripe API and AWS services.
Phase 3: Handle concurrent writes with locking.
No established patterns for this domain.`;
      const result = analyzeVision(content);
      expect(['medium', 'high', 'critical']).toContain(result.overallComplexity);
    });

    it('defaults to low when no signals detected', () => {
      const content = 'Build a simple hello world page.';
      const result = analyzeVision(content);
      expect(result.overallComplexity).toBe('low');
    });
  });

  describe('summary generation', () => {
    it('produces a summary string', () => {
      const content = `# Authentication System
Build user login with OAuth2 support.
Store sessions in Redis.
`;
      const result = analyzeVision(content);
      expect(result.summary).toBeTruthy();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty content gracefully', () => {
      const result = analyzeVision('');
      expect(result.requirements).toEqual([]);
      expect(result.complexity).toEqual([]);
      expect(result.ambiguities).toEqual([]);
      expect(result.dependencies).toEqual([]);
      expect(result.overallComplexity).toBe('low');
      expect(result.summary).toBeTruthy();
    });

    it('handles minimal content gracefully', () => {
      const result = analyzeVision('Hello');
      expect(result.requirements).toEqual([]);
      expect(result.complexity).toEqual([]);
      expect(result.overallComplexity).toBe('low');
      expect(result.summary).toBeTruthy();
    });

    it('handles content with no headings (treats as single block)', () => {
      const content = `Users need to log in with email and password.
The system should integrate with the Stripe API for payments.
Data will be stored in PostgreSQL.`;
      const result = analyzeVision(content);
      // Should still extract requirements even without headings
      expect(result.requirements.length).toBeGreaterThanOrEqual(1);
      expect(result.dependencies.length).toBeGreaterThanOrEqual(1);
    });
  });
});
