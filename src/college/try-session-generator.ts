/**
 * Try-session generator for the `.college/` department cluster.
 *
 * Acts on the `try_session_generation` college-chipset flag that
 * `src/cartridge/department-adapter.ts` validates but nothing consumes. Given a
 * department's concepts (each a slice of `RosettaConcept` with relationships),
 * it emits a runnable-but-DRAFT `TrySessionDefinition` — the shape the
 * `.college/college/try-session-runner.ts` runner loads — with one step per
 * concept, ordered so a concept's in-department prerequisites appear before it.
 *
 * Ordering is a stable topological sort (Kahn) over `dependency` relationships
 * whose target is another concept in the same set; `analogy` targets in the set
 * enrich a step's tracked concepts but do not constrain order. Dependency
 * targets that live OUTSIDE the set (typically other departments) surface as
 * the session's `prerequisites`.
 *
 * SCOPE: mechanical ordering + a concrete structural quality bar (valid steps,
 * prereq-respecting order, every step tied to a real concept id) is delivered
 * here. Per-step prose comes from a pluggable {@link TrySessionAuthor}: the
 * default {@link templateStepAuthor} emits a labelled DRAFT for human authoring;
 * an opt-in LLM author ({@link ./llm-try-session-author.js}) synthesizes real
 * pedagogy via {@link generateTrySessionAuthored}. The DRAFT banner and human
 * gate stay until a person clears them.
 *
 * Pure module: no fs, no side effects, deterministic given the same input. The
 * LLM author lives in a SEPARATE file so no model/network import lands here.
 *
 * @module college/try-session-generator
 */

/** Minimal concept slice the generator needs — a slice of RosettaConcept. */
export interface GeneratorConcept {
  /** Canonical concept id (e.g. 'physics-k41-cascade'). */
  id: string;
  /** Human-readable name; falls back to the id when absent. */
  name?: string;
  /** One-line concept description used to seed the draft prompt. */
  description?: string;
  /** Relationships to other concepts by target id. */
  relationships?: ReadonlyArray<{ type: string; targetId: string; description?: string }>;
}

/**
 * A generated try-session step. Mirrors the `.college` `TryStep` interface but
 * is declared locally so `src/` never statically imports across the `.college/`
 * boundary.
 */
export interface GeneratedTryStep {
  instruction: string;
  expectedOutcome: string;
  hint?: string;
  conceptsExplored: string[];
}

/**
 * A generated try-session. Structurally identical to the `.college`
 * `TrySessionDefinition` the runner accepts.
 */
export interface GeneratedTrySession {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  prerequisites: string[];
  steps: GeneratedTryStep[];
}

export interface GenerateTrySessionOptions {
  /** Department id the concepts belong to; seeds the session id + title. */
  departmentId: string;
  /** Optional wing id; narrows the session id + title when a single wing is used. */
  wingId?: string;
  /** Estimated minutes credited per step. Default 5. */
  minutesPerStep?: number;
  /** Optional cap on the number of steps (first N after ordering). */
  maxSteps?: number;
}

/** Result of {@link orderConceptsByPrerequisite}. */
export interface OrderResult {
  /** Concepts in prerequisite-respecting order. */
  ordered: GeneratorConcept[];
  /** Dependency targets referenced but NOT present in the concept set, sorted. */
  externalPrerequisites: string[];
  /** True when a dependency cycle forced a deterministic id-order fallback. */
  hadCycle: boolean;
}

/**
 * Stable topological sort of concepts by in-set `dependency` relationships.
 *
 * A `dependency` edge `A -> B` (concept A declares a dependency on B) means B is
 * a prerequisite of A, so B is ordered before A. Ties are broken by ascending
 * concept id for determinism. A dependency target that is not itself in the set
 * is collected into `externalPrerequisites` rather than ordered. If a cycle
 * makes a full topological order impossible, the remaining concepts are
 * appended in id order and `hadCycle` is set.
 *
 * @param concepts - the concept slice to order (deduplicated by id).
 * @returns ordered concepts, external prerequisites, and a cycle flag.
 */
export function orderConceptsByPrerequisite(
  concepts: ReadonlyArray<GeneratorConcept>,
): OrderResult {
  // Deduplicate by id, keeping first occurrence.
  const byId = new Map<string, GeneratorConcept>();
  for (const c of concepts) {
    if (c.id && c.id.length > 0 && !byId.has(c.id)) byId.set(c.id, c);
  }

  const ids = Array.from(byId.keys());
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // prereqId -> [dependentIds]
  const externalPrereqs = new Set<string>();
  const seenEdge = new Set<string>();
  for (const id of ids) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const id of ids) {
    const concept = byId.get(id)!;
    for (const rel of concept.relationships ?? []) {
      if (rel.type !== 'dependency') continue;
      const target = rel.targetId;
      if (!target || target === id) continue;
      if (!byId.has(target)) {
        externalPrereqs.add(target);
        continue;
      }
      const edgeKey = `${target}\x00${id}`;
      if (seenEdge.has(edgeKey)) continue;
      seenEdge.add(edgeKey);
      dependents.get(target)!.push(id);
      inDegree.set(id, inDegree.get(id)! + 1);
    }
  }

  // Kahn's algorithm with an id-sorted ready set for deterministic output.
  const ready = ids.filter((id) => inDegree.get(id) === 0).sort();
  const ordered: GeneratorConcept[] = [];
  const emitted = new Set<string>();
  while (ready.length > 0) {
    const id = ready.shift()!;
    ordered.push(byId.get(id)!);
    emitted.add(id);
    const freed: string[] = [];
    for (const dep of dependents.get(id)!) {
      const d = inDegree.get(dep)! - 1;
      inDegree.set(dep, d);
      if (d === 0) freed.push(dep);
    }
    if (freed.length > 0) {
      for (const f of freed) ready.push(f);
      ready.sort();
    }
  }

  let hadCycle = false;
  if (emitted.size < ids.length) {
    hadCycle = true;
    for (const id of ids.slice().sort()) {
      if (!emitted.has(id)) ordered.push(byId.get(id)!);
    }
  }

  return {
    ordered,
    externalPrerequisites: Array.from(externalPrereqs).sort(),
    hadCycle,
  };
}

/** The authored prose of one step — what an author (template or LLM) produces. */
export interface AuthoredStep {
  instruction: string;
  expectedOutcome: string;
  hint?: string;
}

/** Structural context handed to an author for one step. */
export interface TrySessionAuthorInput {
  concept: GeneratorConcept;
  index: number;
  /** In-set prerequisite concept ids (ordered before this concept). */
  prereqIds: string[];
  /** In-set analogy concept ids (shared structure, no ordering constraint). */
  analogyIds: string[];
}

/**
 * Pluggable step author. The default {@link templateStepAuthor} emits the
 * DRAFT-banner scaffold; a real (LLM-backed) author — see
 * {@link ./llm-try-session-author.js} — synthesizes pedagogy. Authoring is
 * async and best-effort: {@link generateTrySessionAuthored} falls back to the
 * template on any throw or malformed result.
 */
export interface TrySessionAuthor {
  authorStep(input: TrySessionAuthorInput): Promise<AuthoredStep>;
}

const DRAFT_BANNER = '[DRAFT — generated scaffold, needs pedagogical review]';

function titleize(slug: string): string {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toCamelId(id: string): string {
  const camel = id.replace(/[^a-zA-Z0-9]+(.)?/g, (_m, c: string | undefined) =>
    c ? c.toUpperCase() : '',
  );
  return /^[a-zA-Z]/.test(camel) ? camel : `s${camel}`;
}

/** Concepts in the set that `concept` declares a `dependency` on (real ids). */
function inSetPrereqIds(
  concept: GeneratorConcept,
  inSet: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const rel of concept.relationships ?? []) {
    if (rel.type === 'dependency' && rel.targetId !== concept.id && inSet.has(rel.targetId)) {
      if (!out.includes(rel.targetId)) out.push(rel.targetId);
    }
  }
  return out;
}

/** Concepts in the set this concept is an `analogy` of (real ids). */
function inSetAnalogyIds(
  concept: GeneratorConcept,
  inSet: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const rel of concept.relationships ?? []) {
    if (rel.type === 'analogy' && rel.targetId !== concept.id && inSet.has(rel.targetId)) {
      if (!out.includes(rel.targetId)) out.push(rel.targetId);
    }
  }
  return out;
}

/** The DRAFT-banner scaffold prose for one step (the pre-authoring baseline). */
function buildTemplateStepText(
  concept: GeneratorConcept,
  index: number,
  prereqIds: string[],
  analogyIds: string[],
): AuthoredStep {
  const name = concept.name && concept.name.length > 0 ? concept.name : concept.id;

  const description = concept.description && concept.description.length > 0
    ? concept.description
    : `the ${name} concept`;

  const buildsOn = prereqIds.length > 0
    ? ` It builds on ${prereqIds.join(', ')} — make sure those are solid first.`
    : '';

  const instruction =
    `${DRAFT_BANNER} Step ${index + 1}: work through ${name} (${concept.id}). ` +
    `${capitalize(description)}${buildsOn} Explain it in your own words and give one concrete example.`;

  const expectedOutcome = prereqIds.length > 0
    ? `You can explain ${name} and articulate how it follows from ${prereqIds.join(', ')}.`
    : `You can explain ${name} and give a concrete example of it.`;

  const authored: AuthoredStep = { instruction, expectedOutcome };
  if (prereqIds.length > 0) {
    authored.hint = `Revisit ${prereqIds.join(', ')} before attempting ${name}.`;
  } else if (analogyIds.length > 0) {
    authored.hint = `Compare ${name} against ${analogyIds.join(', ')} — they share structure.`;
  }
  return authored;
}

/** The default author — emits the DRAFT-banner template. Deterministic, no IO. */
export const templateStepAuthor: TrySessionAuthor = {
  async authorStep(input: TrySessionAuthorInput): Promise<AuthoredStep> {
    return buildTemplateStepText(input.concept, input.index, input.prereqIds, input.analogyIds);
  },
};

/** Assemble a full step: structural concept tracking + authored prose. */
function assembleStep(
  concept: GeneratorConcept,
  prereqIds: string[],
  analogyIds: string[],
  prose: AuthoredStep,
): GeneratedTryStep {
  const step: GeneratedTryStep = {
    instruction: prose.instruction,
    expectedOutcome: prose.expectedOutcome,
    conceptsExplored: dedupe([concept.id, ...prereqIds, ...analogyIds]),
  };
  if (prose.hint && prose.hint.length > 0) step.hint = prose.hint;
  return step;
}

function buildStep(
  concept: GeneratorConcept,
  index: number,
  inSet: ReadonlySet<string>,
): GeneratedTryStep {
  const prereqIds = inSetPrereqIds(concept, inSet);
  const analogyIds = inSetAnalogyIds(concept, inSet);
  const prose = buildTemplateStepText(concept, index, prereqIds, analogyIds);
  return assembleStep(concept, prereqIds, analogyIds, prose);
}

/** A prose result is usable only if both required fields are non-empty. */
function isUsableProse(prose: AuthoredStep | null | undefined): prose is AuthoredStep {
  return (
    !!prose &&
    typeof prose.instruction === 'string' &&
    prose.instruction.length > 0 &&
    typeof prose.expectedOutcome === 'string' &&
    prose.expectedOutcome.length > 0
  );
}

/**
 * Generate a runnable-but-DRAFT try-session from a department's concepts.
 *
 * One step is emitted per concept, ordered by {@link orderConceptsByPrerequisite}
 * so in-department prerequisites precede their dependents. Every step is tied to
 * a real concept id via `conceptsExplored`. Cross-department dependency targets
 * become the session `prerequisites`.
 *
 * @param concepts - the department (or wing) concept slice.
 * @param options - department/wing id and step-timing knobs.
 * @returns a structurally valid `GeneratedTrySession`.
 */
export function generateTrySession(
  concepts: ReadonlyArray<GeneratorConcept>,
  options: GenerateTrySessionOptions,
): GeneratedTrySession {
  const { limited, inSet, externalPrerequisites } = prepareOrder(concepts, options);
  const steps = limited.map((c, i) => buildStep(c, i, inSet));
  return buildSessionShell(steps, externalPrerequisites, options);
}

/**
 * Async, opt-in authored variant of {@link generateTrySession}. Runs the SAME
 * ordering, then authors each step's prose through `author` (default: the
 * template). Authoring is best-effort per step: any throw or malformed result
 * falls back to the template scaffold, so the session is always structurally
 * valid and the DRAFT banner / human-gate discipline is preserved.
 */
export async function generateTrySessionAuthored(
  concepts: ReadonlyArray<GeneratorConcept>,
  options: GenerateTrySessionOptions,
  author?: TrySessionAuthor | null,
): Promise<GeneratedTrySession> {
  const { limited, inSet, externalPrerequisites } = prepareOrder(concepts, options);
  const chosen = author ?? templateStepAuthor;

  const steps = await Promise.all(
    limited.map(async (concept, index) => {
      const prereqIds = inSetPrereqIds(concept, inSet);
      const analogyIds = inSetAnalogyIds(concept, inSet);
      let prose: AuthoredStep;
      try {
        const authored = await chosen.authorStep({ concept, index, prereqIds, analogyIds });
        prose = isUsableProse(authored)
          ? authored
          : buildTemplateStepText(concept, index, prereqIds, analogyIds);
      } catch {
        prose = buildTemplateStepText(concept, index, prereqIds, analogyIds);
      }
      return assembleStep(concept, prereqIds, analogyIds, prose);
    }),
  );

  return buildSessionShell(steps, externalPrerequisites, options);
}

/** Shared ordering stage: order, cap, and the in-set id membership. */
function prepareOrder(
  concepts: ReadonlyArray<GeneratorConcept>,
  options: GenerateTrySessionOptions,
): { limited: GeneratorConcept[]; inSet: Set<string>; externalPrerequisites: string[] } {
  const { ordered, externalPrerequisites } = orderConceptsByPrerequisite(concepts);
  const limited =
    options.maxSteps && options.maxSteps > 0 ? ordered.slice(0, options.maxSteps) : ordered;
  const inSet = new Set(limited.map((c) => c.id));
  return { limited, inSet, externalPrerequisites };
}

/** Wrap authored steps in the session shell (id/title/description/timing). */
function buildSessionShell(
  steps: GeneratedTryStep[],
  externalPrerequisites: string[],
  options: GenerateTrySessionOptions,
): GeneratedTrySession {
  const minutesPerStep = options.minutesPerStep ?? 5;
  const scopeSlug = options.wingId
    ? `${options.departmentId}-${options.wingId}`
    : options.departmentId;
  const scopeTitle = options.wingId
    ? `${titleize(options.departmentId)} · ${titleize(options.wingId)}`
    : titleize(options.departmentId);

  return {
    id: `${scopeSlug}-generated-tour`,
    title: `${scopeTitle}: A Generated First Tour`,
    description:
      `${DRAFT_BANNER} An auto-generated first pass through ${steps.length} ` +
      `${scopeTitle} concept${steps.length === 1 ? '' : 's'}, ordered so each concept's ` +
      `in-department prerequisites come first. Replace the draft prompts with authored ` +
      `pedagogy before publishing.`,
    estimatedMinutes: Math.max(minutesPerStep, minutesPerStep * steps.length),
    prerequisites: externalPrerequisites,
    steps,
  };
}

/** Structural quality bar for a generated session. */
export interface SessionValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a generated session against the structural quality bar the runner
 * and the pedagogy contract require: a non-empty id/title, at least one step,
 * and every step with non-empty instruction, expectedOutcome, and at least one
 * tracked concept id.
 */
export function validateGeneratedSession(session: GeneratedTrySession): SessionValidation {
  const errors: string[] = [];
  if (!session.id || session.id.length === 0) errors.push('session id is empty');
  if (!session.title || session.title.length === 0) errors.push('session title is empty');
  if (!Array.isArray(session.prerequisites)) errors.push('prerequisites is not an array');
  if (!(session.estimatedMinutes > 0)) errors.push('estimatedMinutes must be positive');
  if (!Array.isArray(session.steps) || session.steps.length === 0) {
    errors.push('session has no steps');
  } else {
    session.steps.forEach((s, i) => {
      if (!s.instruction || s.instruction.length === 0) {
        errors.push(`step ${i} has an empty instruction`);
      }
      if (!s.expectedOutcome || s.expectedOutcome.length === 0) {
        errors.push(`step ${i} has an empty expectedOutcome`);
      }
      if (!Array.isArray(s.conceptsExplored) || s.conceptsExplored.length === 0) {
        errors.push(`step ${i} is not tied to any concept`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Serialize a generated session to a runnable `.ts` try-session module — the
 * shape the runner's dual-loader accepts and `.college/departments/<dept>/
 * try-sessions/` holds. The body is JSON (a valid TS object literal); a
 * `@generated` marker records provenance.
 */
export function serializeTrySession(session: GeneratedTrySession): string {
  const constName = `${toCamelId(session.id)}Session`;
  const body = JSON.stringify(session, null, 2);
  return (
    `/**\n` +
    ` * ${session.title}\n` +
    ` *\n` +
    ` * @generated by \`college gen-trysession\` — a DRAFT scaffold. Replace the\n` +
    ` * draft prompts with authored pedagogy before publishing.\n` +
    ` */\n` +
    `import type { TrySessionDefinition } from '../../../college/try-session-runner.js';\n` +
    `\n` +
    `export const ${constName}: TrySessionDefinition = ${body};\n`
  );
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    if (it && !seen.has(it)) {
      seen.add(it);
      out.push(it);
    }
  }
  return out;
}
