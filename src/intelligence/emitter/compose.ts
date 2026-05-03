/**
 * MissionEmitter — composes vision seeds + meta.json + bundle manifest from
 * KB-stored decisions and atomically deposits them to staging.
 *
 * The output of this component is the load-bearing seam between the web tool
 * and the gsd-skill-creator skills (vision-to-mission, research-mission-generator).
 * Format compliance against those skills' input contracts is the CAPCOM gate G1.
 *
 * Phase 825 / C10 (T2 + T3 + T4 + T7 + T8).
 *
 * Decisions honored: D-25-10..19, D-25-36..40.
 */

import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Briefing,
  Bundle,
  BundleId,
  Decision,
  DecisionId,
  Finding,
  Meeting,
  MeetingId,
  Project,
  ProjectId,
  SnapshotId,
  VisionSeedMeta,
} from '../types.js';
import { renderTemplate } from './template-render.js';
import {
  composeBundleManifest,
  type BundleManifestData,
  type ManifestDecisionEntry,
  type ManifestExcludedEntry,
} from './manifest.js';
import { validateMeta } from './meta-validator.js';
import {
  atomicWriteFile,
  cleanupOrphanTransactions,
  emitBundle as fsEmitBundle,
  type EmissionPayload,
} from './staging.js';
import { generateRequestId } from './request-id.js';

// ─── Types ────────────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const VISION_TEMPLATE_PATH = join(here, 'templates', 'vision-doc.md.tmpl');

/** A `Finding` reduced to the fields the vision-doc template needs. */
export interface FindingSummary {
  id: string;
  kind: string;
  severity: string;
  confidence: number;
  rationale: string;
  source_path?: string;
}

/** Per-decision data the emitter pulls from KB before composing. */
export interface ComposeContext {
  decision: Decision;
  project: Project;
  meeting: Meeting;
  briefing: Briefing | null;
  findings: FindingSummary[];
  /** Optional snapshot id; defaults to `meeting.kb_snapshot`. */
  snapshot?: SnapshotId;
}

/** Result of an emission. */
export interface EmissionResult {
  request_id: string;
  vision_doc_path: string;
  meta_path: string;
  bundle_id: BundleId | null;
  /** Snapshot timestamp captured at emission. */
  emitted_at: string;
}

export interface BundleEmissionResult {
  bundle_id: BundleId;
  manifest_path: string;
  emissions: EmissionResult[];
  /** sent_now decisions for this meeting that were excluded from the bundle. */
  excluded_request_ids: string[];
}

/**
 * KB surface the emitter requires. Implementations: real KBStore (Phase 823),
 * test mocks. Mutations are explicit on the surface so the emitter never
 * silently corrupts state.
 */
export interface EmitterKB {
  // Reads
  getProject(id: ProjectId): Promise<Project | null>;
  getMeeting(meetingId: MeetingId): Promise<Meeting | null>;
  getDecision(decisionId: DecisionId): Promise<Decision | null>;
  getBriefing?(briefingId: string): Promise<Briefing | null>;
  getCurrentBriefing(p: ProjectId): Promise<Briefing | null>;
  getBundleForMeeting?(meetingId: MeetingId): Promise<Bundle | null>;
  /** Resolve full Finding rows for the given IDs. */
  getFindingsByIds(ids: string[]): Promise<Finding[]>;
  /** All decisions for a meeting, including bundled + sent_now. */
  listDecisionsForMeeting(meetingId: MeetingId): Promise<Decision[]>;
  // Mutations the emitter performs after successful write
  markEmitted(
    decisionId: DecisionId,
    paths: { vision_doc_path: string; meta_path: string; bundle_id: BundleId | null },
  ): Promise<void>;
  addMissionLink(
    decisionId: DecisionId,
    kind: string,
    ref: string,
  ): Promise<void>;
}

// ─── MissionEmitter ─────────────────────────────────────────────────────────

export interface MissionEmitterOptions {
  kb: EmitterKB;
  /**
   * Repository root. The emitter writes seeds to
   * `<stagingRoot>/staging/inbox/` — `stagingRoot` is conventionally
   * `<repoRoot>/.planning/`.
   */
  stagingRoot: string;
  /** Optional injected `now` function for deterministic tests. */
  now?: () => Date;
}

export class MissionEmitter {
  private readonly kb: EmitterKB;
  private readonly stagingRoot: string;
  private readonly now: () => Date;
  private readonly visionTemplate: string;

  constructor(opts: MissionEmitterOptions) {
    this.kb = opts.kb;
    this.stagingRoot = opts.stagingRoot;
    this.now = opts.now ?? (() => new Date());
    this.visionTemplate = readFileSync(VISION_TEMPLATE_PATH, 'utf8');
  }

  // ─── Composers (also exported for direct use in tests) ──────────────────

  /** Compose the vision-doc markdown for one decision. */
  composeVisionDoc(ctx: ComposeContext, requestId: string): string {
    const { decision, project, meeting, briefing, findings } = ctx;
    const meetingExcerptUrl = this.computeMeetingExcerptUrl(
      meeting.id,
      decision.id,
    );
    const speedHint = this.detectSpeedHint(decision);
    const skill = this.detectSkill(decision);

    const templateContext: Record<string, unknown> = {
      meeting_id: meeting.id,
      meeting_excerpt_url: meetingExcerptUrl,
      decision: {
        ai_draft: decision.ai_draft ?? { title: '(untitled)', body: '' },
      },
      project: {
        name: project.name,
        branch: project.branch ?? '(no branch)',
      },
      meta: {
        skill,
        speed_hint: speedHint,
      },
      developer_modifications: decision.developer_modifications,
      developer_approved_at: decision.approved_at ?? this.now().toISOString(),
      source_findings: findings,
      ai_rank: decision.source_move_rank ?? null,
      ai_confidence: briefing?.confidence ?? null,
      ai_rationale:
        briefing && decision.source_move_rank != null
          ? this.findMoveRationale(briefing, decision.source_move_rank)
          : null,
    };

    // Fold request_id as a comment header for traceability (informational; the
    // skill input parser does not require it but it's useful for forensics).
    const header = `<!-- request_id: ${requestId} -->\n\n`;
    return header + renderTemplate(this.visionTemplate, templateContext);
  }

  /** Compose the meta.json companion for one decision. */
  composeMeta(
    ctx: ComposeContext,
    requestId: string,
    bundleId: BundleId | null,
  ): VisionSeedMeta {
    const { decision, project, meeting, briefing, findings } = ctx;
    const sourceBriefing = briefing?.id ?? null;
    const aiConfidence = briefing?.confidence ?? null;
    const aiRank = decision.source_move_rank ?? null;
    const aiRationale =
      briefing && decision.source_move_rank != null
        ? this.findMoveRationale(briefing, decision.source_move_rank)
        : null;

    const skill = this.detectSkill(decision);
    const speedHint = this.detectSpeedHint(decision);
    const kbSnapshot = ctx.snapshot ?? meeting.kb_snapshot;

    const meta: VisionSeedMeta = {
      request_id: requestId,
      kind: 'mission_seed',
      skill,
      speed_hint: speedHint,
      project: project.id,
      provenance: {
        source_findings: findings.map((f) => f.id) as VisionSeedMeta['provenance']['source_findings'],
        source_briefing: sourceBriefing as VisionSeedMeta['provenance']['source_briefing'],
        ai_confidence: aiConfidence,
        ai_rank: aiRank,
        ai_rationale: aiRationale,
        developer_approved_at: decision.approved_at ?? this.now().toISOString(),
        developer_modifications: decision.developer_modifications,
        meeting_id: meeting.id,
        meeting_excerpt_url: this.computeMeetingExcerptUrl(meeting.id, decision.id),
        kb_snapshot: kbSnapshot,
      },
      constraints: this.deriveConstraints(decision),
      bundle_id: bundleId,
    };
    if (project.branch) {
      meta.branch = project.branch;
    }
    return meta;
  }

  /** Compose the bundle manifest YAML.
   *
   * When `decisions` entries include a `ctx` field, coupling-aware batch_hints
   * are computed. Otherwise falls back to the single-group form.
   */
  composeBundleManifestYaml(args: {
    bundleId: BundleId;
    meetingId: MeetingId;
    project: Project;
    decisions: Array<{
      requestId: string;
      decision: Decision;
      /** Optional: findings context for coupling-aware batch_hints */
      ctx?: ComposeContext;
    }>;
    excluded: Array<{ requestId: string; decision: Decision }>;
    kbSnapshot: SnapshotId;
  }): string {
    // Use coupling-aware batch_hints when ctx is available
    const batchHints = args.decisions.every((d) => d.ctx !== undefined)
      ? this.computeBatchHintsFromDecisions(
          args.decisions.map((d) => ({
            requestId: d.requestId,
            decision: d.decision,
            ctx: d.ctx!,
          })),
        )
      : this.computeBatchHints(args.decisions.map((d) => d.requestId));

    const data: BundleManifestData = {
      bundle_id: args.bundleId,
      meeting_id: args.meetingId,
      emitted_at: this.now().toISOString(),
      project: args.project.id,
      branch: args.project.branch,
      kb_snapshot: args.kbSnapshot,
      decisions: args.decisions.map(
        ({ requestId, decision }): ManifestDecisionEntry => ({
          request_id: requestId,
          skill: this.detectSkillForManifest(decision),
          speed_hint: this.detectSpeedHint(decision),
          title: decision.ai_draft?.title ?? '(untitled)',
        }),
      ),
      batch_hints: batchHints,
      excluded_from_bundle: args.excluded.map(
        ({ requestId, decision }): ManifestExcludedEntry => ({
          request_id: requestId,
          title: decision.ai_draft?.title ?? '(untitled)',
          reason: decision.state === 'sent_now' ? 'sent_now' : 'withdrawn',
          sent_at: decision.emitted_at ?? undefined,
        }),
      ),
    };
    return composeBundleManifest(data);
  }

  // ─── High-level emission entry points ──────────────────────────────────

  /**
   * Emit one decision with `bundle_id: null` (D-25-12).
   *
   * Side effects on success:
   *   1. Two files written atomically: vision_doc.md + meta.json.
   *   2. KB.markEmitted called with the deposited paths.
   *   3. KB.addMissionLink with artifact_kind='vision_seed' (D-25-17).
   */
  async emitSendNow(decisionId: DecisionId): Promise<EmissionResult> {
    const ctx = await this.loadContext(decisionId);
    const requestId = generateRequestId(this.now());

    // Compose
    const visionDoc = this.composeVisionDoc(ctx, requestId);
    const meta = this.composeMeta(ctx, requestId, null);

    // Validate BEFORE write (D-25-14)
    validateMeta(meta);

    // Atomic write
    const stagingInbox = join(this.stagingRoot, 'staging', 'inbox');
    const visionDocPath = join(stagingInbox, `${requestId}.md`);
    const metaPath = join(stagingInbox, `${requestId}.meta.json`);
    atomicWriteFile(visionDocPath, visionDoc);
    atomicWriteFile(metaPath, JSON.stringify(meta, null, 2));

    // Post-write KB updates (D-25-16, D-25-17)
    await this.kb.markEmitted(decisionId, {
      vision_doc_path: visionDocPath,
      meta_path: metaPath,
      bundle_id: null,
    });
    await this.kb.addMissionLink(decisionId, 'vision_seed', visionDocPath);

    return {
      request_id: requestId,
      vision_doc_path: visionDocPath,
      meta_path: metaPath,
      bundle_id: null,
      emitted_at: this.now().toISOString(),
    };
  }

  /**
   * Emit a bundle of all `bundled` decisions for the given meeting (D-25-13).
   *
   * 1. Compose all seeds and the manifest BEFORE any write (validation gate).
   * 2. Atomically deposit via the transaction-directory pattern. Manifest LAST.
   * 3. Per-decision KB updates.
   */
  async emitBundle(meetingId: MeetingId): Promise<BundleEmissionResult> {
    // Load meeting + project
    const meeting = await this.kb.getMeeting(meetingId);
    if (!meeting) {
      throw new Error(`emitBundle: meeting ${meetingId} not found`);
    }
    const project = await this.kb.getProject(meeting.project_id);
    if (!project) {
      throw new Error(
        `emitBundle: project ${meeting.project_id} for meeting ${meetingId} not found`,
      );
    }

    const allDecisions = await this.kb.listDecisionsForMeeting(meetingId);
    const bundled = allDecisions.filter((d) => d.state === 'bundled');
    const excluded = allDecisions.filter((d) => d.state === 'sent_now');

    if (bundled.length === 0) {
      throw new Error(
        `emitBundle: no bundled decisions for meeting ${meetingId} (commit a bundle first)`,
      );
    }

    const bundleId = meetingId as BundleId;
    const briefing = meeting.briefing_at_start
      ? this.kb.getBriefing
        ? await this.kb.getBriefing(meeting.briefing_at_start)
        : await this.kb.getCurrentBriefing(project.id)
      : await this.kb.getCurrentBriefing(project.id);

    // Per-decision compose
    const composed: Array<{
      decision: Decision;
      requestId: string;
      visionDoc: string;
      meta: VisionSeedMeta;
      ctx: ComposeContext;
    }> = [];
    const composedExcluded: Array<{ decision: Decision; requestId: string }> = [];

    for (const d of bundled) {
      const findings = await this.resolveFindings(d.source_findings);
      const ctx: ComposeContext = {
        decision: d,
        project,
        meeting,
        briefing,
        findings,
        snapshot: meeting.kb_snapshot,
      };
      const requestId = generateRequestId(this.now());
      const visionDoc = this.composeVisionDoc(ctx, requestId);
      const meta = this.composeMeta(ctx, requestId, bundleId);
      // Validate ALL meta BEFORE any write (D-25-14, D-25-13).
      validateMeta(meta);
      composed.push({ decision: d, requestId, visionDoc, meta, ctx });
    }

    for (const d of excluded) {
      // Excluded decisions get a request_id for the manifest record but no seed deposit.
      composedExcluded.push({
        decision: d,
        requestId:
          d.emission_path
            ? this.requestIdFromEmissionPath(d.emission_path)
            : generateRequestId(this.now()),
      });
    }

    // Compose manifest YAML (pass ctx for coupling-aware batch_hints)
    const manifestYaml = this.composeBundleManifestYaml({
      bundleId,
      meetingId: meeting.id,
      project,
      decisions: composed.map(({ decision, requestId, ctx }) => ({ requestId, decision, ctx })),
      excluded: composedExcluded,
      kbSnapshot: meeting.kb_snapshot,
    });

    // Atomic deposit (D-25-10/11)
    const emissions: EmissionPayload[] = composed.map((c) => ({
      request_id: c.requestId,
      vision_doc: c.visionDoc,
      meta_json: JSON.stringify(c.meta, null, 2),
    }));
    const result = fsEmitBundle(
      emissions,
      { bundle_id: bundleId, yaml: manifestYaml },
      this.stagingRoot,
    );

    // Per-decision KB updates
    const emissionResults: EmissionResult[] = [];
    for (let i = 0; i < composed.length; i++) {
      const c = composed[i];
      const visionDocPath = result.seedPaths[i];
      const metaPath = visionDocPath.replace(/\.md$/, '.meta.json');
      await this.kb.markEmitted(c.decision.id, {
        vision_doc_path: visionDocPath,
        meta_path: metaPath,
        bundle_id: bundleId,
      });
      await this.kb.addMissionLink(c.decision.id, 'vision_seed', visionDocPath);
      emissionResults.push({
        request_id: c.requestId,
        vision_doc_path: visionDocPath,
        meta_path: metaPath,
        bundle_id: bundleId,
        emitted_at: this.now().toISOString(),
      });
    }

    return {
      bundle_id: bundleId,
      manifest_path: result.manifestPath,
      emissions: emissionResults,
      excluded_request_ids: composedExcluded.map((e) => e.requestId),
    };
  }

  /** Sweep orphan transaction directories (D-25-19). */
  cleanupOrphanTransactions(maxAgeMs?: number): number {
    return cleanupOrphanTransactions(this.stagingRoot, maxAgeMs);
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private async loadContext(decisionId: DecisionId): Promise<ComposeContext> {
    const decision = await this.kb.getDecision(decisionId);
    if (!decision) throw new Error(`emit: decision ${decisionId} not found`);
    const meeting = await this.kb.getMeeting(decision.meeting_id);
    if (!meeting)
      throw new Error(`emit: meeting ${decision.meeting_id} not found`);
    const project = await this.kb.getProject(meeting.project_id);
    if (!project)
      throw new Error(`emit: project ${meeting.project_id} not found`);
    const briefing = meeting.briefing_at_start
      ? this.kb.getBriefing
        ? await this.kb.getBriefing(meeting.briefing_at_start)
        : await this.kb.getCurrentBriefing(project.id)
      : await this.kb.getCurrentBriefing(project.id);
    if (!decision.source_findings || !Array.isArray(decision.source_findings)) {
      throw new Error(
        `emit: decision ${decisionId} missing source_findings (must be array, was ${typeof decision.source_findings})`,
      );
    }
    const findings = await this.resolveFindings(decision.source_findings);
    return {
      decision,
      meeting,
      project,
      briefing,
      findings,
      snapshot: meeting.kb_snapshot,
    };
  }

  private async resolveFindings(ids: string[]): Promise<FindingSummary[]> {
    if (ids.length === 0) return [];
    const findings = await this.kb.getFindingsByIds(ids);
    return findings.map(
      (f): FindingSummary => ({
        id: f.id,
        kind: f.kind,
        severity: f.severity,
        confidence: f.confidence,
        rationale: f.rationale,
        source_path: f.source_path,
      }),
    );
  }

  /** Map decision.kind → skill name. */
  private detectSkill(d: Decision): VisionSeedMeta['skill'] {
    if (d.kind === 'research_mission') return 'research-mission-generator';
    return 'vision-to-mission';
  }

  /**
   * For the manifest (which allows 'analyze' too), broaden the skill enum.
   * The manifest has its own enum distinct from VisionSeedMeta.skill.
   */
  private detectSkillForManifest(
    d: Decision,
  ): ManifestDecisionEntry['skill'] {
    if (d.kind === 'research_mission') return 'research-mission-generator';
    if (d.kind === 'analysis_run') return 'analyze';
    return 'vision-to-mission';
  }

  private detectSpeedHint(d: Decision): VisionSeedMeta['speed_hint'] {
    // Heuristic: research missions default to 'full'; analysis runs to 'fast';
    // vision missions to 'fast'. Future: read explicit hint from decision draft.
    if (d.kind === 'research_mission') return 'full';
    return 'fast';
  }

  private deriveConstraints(d: Decision): VisionSeedMeta['constraints'] {
    const c: VisionSeedMeta['constraints'] = {};
    if (d.kind === 'research_mission') {
      c.max_research_searches = 6;
      c.crew_profile = 'squadron';
      c.output_format = 'three-file-pdf';
    } else if (d.kind === 'vision_mission') {
      c.crew_profile = 'patrol';
      c.output_format = 'markdown-package';
    }
    return c;
  }

  private computeMeetingExcerptUrl(
    meetingId: MeetingId,
    decisionId: DecisionId,
  ): string {
    return `.planning/intelligence/meetings/${meetingId}.md#decision-${decisionId}`;
  }

  private findMoveRationale(briefing: Briefing, rank: number): string | null {
    const move = briefing.suggested_moves.find((m) => m.rank === rank);
    return move?.rationale ?? null;
  }

  private requestIdFromEmissionPath(emissionPath: string): string {
    // Extract `req_..._XXXX` from a path like `.../inbox/req_2026-05-02_1430_a1b2.md`.
    const m = /req_\d{4}-\d{2}-\d{2}_\d{4}_[a-z0-9]+/i.exec(emissionPath);
    return m ? m[0] : generateRequestId(this.now());
  }

  /**
   * Compute coupling-aware batch hints.
   *
   * Decisions whose source_findings include shared coupling_spike findings
   * belong to the same parallel group (they share a coupling context and
   * should be dispatched together). All other decisions get their own group.
   *
   * Algorithm:
   *   1. Collect the coupling_spike finding IDs referenced by each decision.
   *   2. Union-Find over decisions that share at least one coupling_spike.
   *   3. Emit one group per connected component; singletons get their own group.
   *
   * Phase 826 / Carryover 2 (closes 825 batch_hints single-group stub).
   */
  private computeBatchHintsFromDecisions(
    items: Array<{
      requestId: string;
      decision: { source_findings: string[] };
      ctx: { findings: FindingSummary[] };
    }>,
  ): {
    parallelizable: string[][];
    shared_context: string[];
    suggested_order: string[];
  } {
    if (items.length === 0) {
      return { parallelizable: [], shared_context: [], suggested_order: [] };
    }

    const n = items.length;
    // Union-Find
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]]!;
        x = parent[x]!;
      }
      return x;
    };
    const union = (a: number, b: number) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };

    // Map coupling_spike finding ID → set of item indices that reference it
    const couplingMap = new Map<string, number[]>();
    for (let i = 0; i < n; i++) {
      const item = items[i]!;
      const couplingSpikeIds = item.ctx.findings
        .filter((f) => f.kind === 'coupling_spike')
        .map((f) => f.id);
      for (const fid of couplingSpikeIds) {
        const existing = couplingMap.get(fid) ?? [];
        existing.push(i);
        couplingMap.set(fid, existing);
      }
    }

    // Union any items that share a coupling_spike
    for (const indices of couplingMap.values()) {
      for (let k = 1; k < indices.length; k++) {
        union(indices[0]!, indices[k]!);
      }
    }

    // Group request IDs by root component
    const groupMap = new Map<number, string[]>();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      const group = groupMap.get(root) ?? [];
      group.push(items[i]!.requestId);
      groupMap.set(root, group);
    }

    const parallelizable = Array.from(groupMap.values());
    const suggestedOrder = items.map((d) => d.requestId);
    return {
      parallelizable,
      shared_context: [],
      suggested_order: suggestedOrder,
    };
  }

  /**
   * @deprecated Use computeBatchHintsFromDecisions for coupling-aware grouping.
   * Kept for manifest YAML path that only has requestIds (no finding context).
   */
  private computeBatchHints(requestIds: string[]): {
    parallelizable: string[][];
    shared_context: string[];
    suggested_order: string[];
  } {
    // Fallback: single group (all parallelizable).
    return {
      parallelizable: [requestIds.slice()],
      shared_context: [],
      suggested_order: requestIds.slice(),
    };
  }
}
