/**
 * TDD tests for pattern fidelity checker.
 *
 * Validates that checkPatternFidelity detects phantom content --
 * skill sections not backed by observation evidence -- with correct
 * severity scaling and case-insensitive/fuzzy matching.
 *
 * @module staging/derived/pattern-fidelity.test
 */

import { describe, it, expect } from 'vitest';
import { checkPatternFidelity } from './pattern-fidelity.js';
import type { ObservationEvidence } from './pattern-fidelity.js';
import type { PhantomFinding } from './types.js';

describe('checkPatternFidelity', () => {
  it('returns empty array when skill body is fully supported', () => {
    const skillBody = `## Testing Guidelines

Run \`npm test\` to execute the test suite. Use \`vitest\` for
watch mode during development.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npx vitest'],
      observedFiles: [],
      observedTools: [],
      observedPatterns: ['testing', 'test suite', 'development'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings).toEqual([]);
  });

  it('flags phantom content when skill mentions unseen commands', () => {
    const skillBody = `## Deployment Guidelines

Run \`docker compose up\` to start the service. Configure the
\`docker-compose.yml\` file for production settings.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npm run build'],
      observedFiles: ['src/index.ts', 'package.json'],
      observedTools: [],
      observedPatterns: [],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('phantom');
    expect(findings[0].contentSnippet).toMatch(/docker/i);
    expect(findings[0].observedPatterns.length).toBeGreaterThan(0);
  });

  it('flags phantom content when skill mentions unseen files', () => {
    const skillBody = `## OAuth Configuration

Edit \`src/auth/oauth.ts\` for OAuth configuration. Update the
\`src/auth/providers.ts\` for new OAuth providers.
`;

    const evidence: ObservationEvidence = {
      observedCommands: [],
      observedFiles: ['src/index.ts', 'src/utils/helpers.ts'],
      observedTools: [],
      observedPatterns: [],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('phantom');
    expect(findings[0].contentSnippet).toMatch(/auth/i);
  });

  it('detects multiple phantom findings in one skill', () => {
    const skillBody = `## Observed Patterns

Use \`npm test\` for running tests. The test suite validates
all key functionality.

## Infrastructure Setup

Configure \`Terraform\` resources for cloud deployment. Use
\`terraform plan\` to preview changes.

## Database Migration

Edit \`prisma/schema.prisma\` for database model changes.
Run \`prisma migrate\` to apply migrations.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npm run build'],
      observedFiles: ['src/index.ts'],
      observedTools: [],
      observedPatterns: ['testing', 'test suite', 'functionality'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(2);
    expect(findings.every(f => f.type === 'phantom')).toBe(true);
  });

  it('severity is critical when >50% of sections are phantom', () => {
    const skillBody = `## Observed Section

Use \`npm test\` to run tests.

## Phantom Section One

Deploy with \`kubernetes apply\` to the production cluster.

## Phantom Section Two

Configure \`ansible\` playbooks for server provisioning.

## Phantom Section Three

Set up \`jenkins\` pipelines for continuous integration.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test'],
      observedFiles: [],
      observedTools: [],
      observedPatterns: ['testing', 'run tests'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(3);
    expect(findings.every(f => f.severity === 'critical')).toBe(true);
  });

  it('severity is warning when 20-50% of sections are phantom', () => {
    const skillBody = `## Section One

Run \`npm test\` to validate changes.

## Section Two

Use \`vitest\` for watch mode.

## Section Three

Check \`package.json\` for scripts.

## Section Four

Review \`src/index.ts\` for the entry point.

## Phantom Section

Deploy with \`helm chart\` to kubernetes cluster.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npx vitest'],
      observedFiles: ['package.json', 'src/index.ts'],
      observedTools: [],
      observedPatterns: ['validate', 'watch mode', 'scripts', 'entry point', 'review'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('warning');
  });

  it('severity is info when <20% of sections are phantom', () => {
    const skillBody = `## Section 1

Run \`npm test\` to validate.

## Section 2

Use \`vitest\` for watch mode.

## Section 3

Check \`package.json\` for scripts.

## Section 4

Review \`tsconfig.json\` configuration.

## Section 5

Edit \`src/index.ts\` for entry.

## Section 6

Run \`npm run build\` for production.

## Section 7

Check \`eslint.config.js\` for linting.

## Section 8

Use \`prettier\` for formatting.

## Section 9

Review \`README.md\` for documentation.

## Phantom Section

Deploy with \`pulumi up\` to cloud infrastructure.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npx vitest', 'npm run build'],
      observedFiles: [
        'package.json', 'tsconfig.json', 'src/index.ts',
        'eslint.config.js', 'README.md',
      ],
      observedTools: ['prettier'],
      observedPatterns: [
        'validate', 'watch mode', 'scripts', 'configuration',
        'entry', 'production', 'linting', 'formatting', 'documentation',
      ],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('info');
  });

  it('empty observation evidence flags all content as phantom', () => {
    const skillBody = `## Setup Instructions

Run \`npm install\` to install dependencies.

## Testing

Execute \`npm test\` to run the test suite.
`;

    const evidence: ObservationEvidence = {
      observedCommands: [],
      observedFiles: [],
      observedTools: [],
      observedPatterns: [],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings.length).toBe(2);
    expect(findings.every(f => f.type === 'phantom')).toBe(true);
    expect(findings.every(f => f.severity === 'critical')).toBe(true);
  });

  it('pattern matching is case-insensitive', () => {
    const skillBody = `## Testing Commands

Run \`NPM TEST\` to execute the test suite. Use \`VITEST\`
for development mode.
`;

    const evidence: ObservationEvidence = {
      observedCommands: ['npm test', 'npx vitest'],
      observedFiles: [],
      observedTools: [],
      observedPatterns: ['testing', 'test suite', 'development'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings).toEqual([]);
  });

  it('observedPatterns provides fuzzy backing', () => {
    const skillBody = `## Linting Configuration

Configure the linting rules for ESLint. Set up the
\`.eslintrc\` file with project-specific rules.
`;

    const evidence: ObservationEvidence = {
      observedCommands: [],
      observedFiles: [],
      observedTools: [],
      observedPatterns: ['eslint configuration', 'lint setup'],
    };

    const findings = checkPatternFidelity(skillBody, evidence);
    expect(findings).toEqual([]);
  });
});
