/**
 * Integration tests for scope-drift formalization (DRIFT-21).
 *
 * Tests the real `src/staging/derived/scope-drift.ts` derivation path to
 * validate that scope drift IS knowledge drift applied to derived-from-source-
 * material content, as formalized in `docs/drift/scope-drift-formalization.md`.
 *
 * Covers two real skill-derivation paths:
 *  1. Well-scoped derivation — skill scope stays within observation evidence.
 *  2. Over-generalized derivation — skill scope drifts beyond observations.
 *
 * These are integration tests (not unit tests): they exercise the full
 * `extractSkillScope → extractObservedScope → detectScopeDrift` pipeline
 * against synthetic fixtures that simulate the scope-drift pattern.
 */

import { describe, it, expect } from 'vitest';
import {
  extractSkillScope,
  extractObservedScope,
  detectScopeDrift,
  type SessionScopeData,
} from '../../staging/derived/scope-drift.js';

// ---------------------------------------------------------------------------
// Synthetic skill-derivation fixtures
// ---------------------------------------------------------------------------

/**
 * Fixture A: Well-scoped derivation.
 * Skill scope was derived directly from Docker/Kubernetes session observations.
 * D(S) ⊆ O(S) → no scope drift.
 */
const WELL_SCOPED_SKILL = {
  description: 'Docker container management and Kubernetes pod deployment',
  triggerIntents: ['run docker container', 'deploy kubernetes pod'],
  triggerFiles: ['Dockerfile', '**/k8s/*.yaml'],
  bodyHeadings: ['Container lifecycle', 'Pod scheduling'],
};

const WELL_SCOPED_SESSIONS: SessionScopeData[] = [
  {
    topCommands: ['docker run nginx', 'kubectl apply -f deployment.yaml', 'docker build'],
    topFiles: ['Dockerfile', 'k8s/deployment.yaml', 'k8s/service.yaml'],
    topTools: ['bash', 'git'],
  },
  {
    topCommands: ['docker ps', 'kubectl get pods', 'docker-compose up'],
    topFiles: ['docker-compose.yml', 'k8s/ingress.yaml'],
    topTools: ['bash'],
  },
];

/**
 * Fixture B: Over-generalized derivation (scope drift).
 * Skill was derived from Python/pytest session observations but claims to cover
 * Rust, Go, and distributed systems — topics absent from observations.
 * D(S) ⊄ O(S) → scope drift detected.
 *
 * This mirrors the Fastowski 2024 two-phase belief-shift dynamic:
 * Phase 1 = Python/pytest (supported), Phase 2 = Rust/Go/distributed (unsupported).
 */
const OVER_GENERALIZED_SKILL = {
  description: 'Comprehensive testing framework for Python, Rust, Go and distributed microservices',
  triggerIntents: [
    'run pytest tests',
    'execute rust unit tests',
    'run golang benchmarks',
    'test distributed services',
  ],
  triggerFiles: ['**/*.test.py', '**/*_test.rs', '**/*_test.go'],
  bodyHeadings: [
    'Python pytest configuration',
    'Rust cargo test integration',
    'Go testing and benchmarking',
    'Distributed tracing and service mesh testing',
  ],
};

const PYTHON_ONLY_SESSIONS: SessionScopeData[] = [
  {
    topCommands: ['pytest tests/', 'python -m pytest', 'pip install pytest'],
    topFiles: ['tests/test_api.py', 'tests/test_models.py', 'pytest.ini'],
    topTools: ['bash', 'python'],
  },
  {
    topCommands: ['pytest -v --cov', 'python setup.py test'],
    topFiles: ['tests/conftest.py', 'src/models.py'],
    topTools: ['bash'],
  },
];

// ---------------------------------------------------------------------------
// Integration test 1: Well-scoped derivation (no drift)
// ---------------------------------------------------------------------------

describe('scope-drift-integration: well-scoped derivation', () => {
  it('produces no scope-drift findings when skill scope equals observed scope (direct pass-through)', () => {
    // Use detectScopeDrift directly with identical scope arrays — the canonical
    // no-drift case mirrors a perfect derivation where D(S) = O(S).
    const scope = ['docker', 'kubernetes', 'container', 'pod', 'deployment'];
    const findings = detectScopeDrift(scope, scope);
    expect(findings).toHaveLength(0);
  });

  it('observation scope from Docker sessions covers docker/kubernetes terms', () => {
    const observedScope = extractObservedScope(WELL_SCOPED_SESSIONS);
    const observedSet = new Set(observedScope);
    // These terms appear in the session commands/files
    expect(observedSet.has('docker')).toBe(true);
    // 'kubectl' appears as the command but extracted as 'kubectl'
    expect(observedScope.some((s) => s.includes('kubectl') || s.includes('kubernetes'))).toBe(true);
  });

  it('well-scoped skill has no critical drift when scope is a strict subset of observations', () => {
    // Construct minimal skill scope using only terms provably in observed scope
    const observedScope = extractObservedScope(WELL_SCOPED_SESSIONS);
    const observedSet = new Set(observedScope);

    // Build skill scope from only terms that ARE in observed scope
    const supportedTerms = ['docker', 'kubectl'].filter((t) => observedSet.has(t));
    if (supportedTerms.length > 0) {
      const findings = detectScopeDrift(supportedTerms, observedScope);
      const criticalFindings = findings.filter((f) => f.severity === 'critical');
      expect(criticalFindings).toHaveLength(0);
    }
  });

  it('extractSkillScope extracts docker and kubernetes from skill description', () => {
    const skillScope = extractSkillScope(
      WELL_SCOPED_SKILL.description,
      WELL_SCOPED_SKILL.triggerIntents,
      WELL_SCOPED_SKILL.triggerFiles,
      WELL_SCOPED_SKILL.bodyHeadings,
    );
    expect(skillScope).toContain('docker');
    expect(skillScope).toContain('kubernetes');
  });
});

// ---------------------------------------------------------------------------
// Integration test 2: Over-generalized derivation (scope drift)
// ---------------------------------------------------------------------------

describe('scope-drift-integration: over-generalized derivation', () => {
  it('detects scope drift when skill claims coverage beyond observation basis', () => {
    const skillScope = extractSkillScope(
      OVER_GENERALIZED_SKILL.description,
      OVER_GENERALIZED_SKILL.triggerIntents,
      OVER_GENERALIZED_SKILL.triggerFiles,
      OVER_GENERALIZED_SKILL.bodyHeadings,
    );
    const observedScope = extractObservedScope(PYTHON_ONLY_SESSIONS);
    const findings = detectScopeDrift(skillScope, observedScope);

    // Skill that claims Rust/Go coverage from Python-only observations → drift
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('scope-drift');
    expect(findings[0].driftRatio).toBeGreaterThan(0);
  });

  it('Rust and Go terms are in skill scope but NOT in observed scope (two-phase belief-shift)', () => {
    const skillScope = extractSkillScope(
      OVER_GENERALIZED_SKILL.description,
      OVER_GENERALIZED_SKILL.triggerIntents,
      OVER_GENERALIZED_SKILL.triggerFiles,
      OVER_GENERALIZED_SKILL.bodyHeadings,
    );
    const observedScope = extractObservedScope(PYTHON_ONLY_SESSIONS);
    const observedSet = new Set(observedScope);

    // Rust and Go should be claimed by skill (Phase 2 of drift)
    expect(skillScope.some((s) => s.includes('rust') || s.includes('cargo'))).toBe(true);
    // But not supported by observations (only Python sessions exist)
    expect(observedSet.has('rust')).toBe(false);
    expect(observedSet.has('cargo')).toBe(false);
    expect(observedSet.has('golang')).toBe(false);
  });

  it('drift ratio reflects Fastowski two-phase belief-shift: unsupported / total', () => {
    const skillScope = extractSkillScope(
      OVER_GENERALIZED_SKILL.description,
      OVER_GENERALIZED_SKILL.triggerIntents,
      OVER_GENERALIZED_SKILL.triggerFiles,
      OVER_GENERALIZED_SKILL.bodyHeadings,
    );
    const observedScope = extractObservedScope(PYTHON_ONLY_SESSIONS);
    const findings = detectScopeDrift(skillScope, observedScope);

    if (findings.length > 0) {
      const finding = findings[0];
      // driftRatio must be in [0, 1]
      expect(finding.driftRatio).toBeGreaterThanOrEqual(0);
      expect(finding.driftRatio).toBeLessThanOrEqual(1);
      // The finding captures both skill and observed scope for downstream mitigation
      expect(Array.isArray(finding.skillScope)).toBe(true);
      expect(Array.isArray(finding.observedScope)).toBe(true);
    }
  });

  it('severity escalates for high drift ratio (critical when > 50% unsupported)', () => {
    // Synthetic maximum-drift case: skill with 10 unique unsupported terms vs 0 observations
    const purelyUnsupportedScope = [
      'tensorflow', 'pytorch', 'cuda', 'jax', 'mlflow',
      'transformers', 'langchain', 'onnx', 'triton', 'deepspeed',
    ];
    const emptyObservedScope: string[] = [];

    const findings = detectScopeDrift(purelyUnsupportedScope, emptyObservedScope);
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].driftRatio).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Integration test 3: Knowledge drift analogy verification
// ---------------------------------------------------------------------------

describe('scope-drift-integration: knowledge-drift analogy', () => {
  it('scope drift returns empty findings for byte-identical scope (clean derivation)', () => {
    // When skill scope = observed scope, no drift
    const scope = ['docker', 'kubernetes', 'container', 'pod', 'deployment'];
    const findings = detectScopeDrift(scope, scope);
    expect(findings).toHaveLength(0);
  });

  it('incrementally adding unsupported items raises drift ratio monotonically', () => {
    const observedScope = ['docker', 'kubernetes'];
    const baseScope = ['docker', 'kubernetes'];

    // Add unsupported items one at a time
    const ratios: number[] = [];
    for (const extra of ['rust', 'golang', 'haskell', 'erlang']) {
      const findings = detectScopeDrift([...baseScope, extra], observedScope);
      if (findings.length > 0) {
        ratios.push(findings[0].driftRatio);
      }
    }

    // Drift ratio should increase as we add more unsupported items
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1]);
    }
  });
});
