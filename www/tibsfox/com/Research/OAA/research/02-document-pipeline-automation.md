# Document Pipeline Automation: Scheduled Generation and Publishing

**Catalog:** OAA-DPA | **Cluster:** Operations & Admin Automation
**Date:** 2026-04-05 | **Source:** GSD Sweep Daemon, Publish-Pipeline, Transcript-Compactor
**College:** Information Systems, Library Science, Technical Communication

## Abstract

Document automation -- the practice of generating, transforming, versioning, and publishing documents on a schedule or trigger -- is the backbone of office administration. The GSD system implements a complete document pipeline: the sweep daemon runs hourly content generation across 35+ pages, the transcript-compactor summarizes verbose output into bounded digests, and the publish-pipeline handles multi-format output with FTP deployment. These are the same patterns that Power Automate, n8n, and Zapier implement for enterprise document workflows. This page maps GSD's document automation to industry tooling, covers the computer science of content pipelines, and explores how scheduled generation solves the "stale documentation" problem that plagues every organization.

## Document Lifecycle Mapping

| Lifecycle Stage | GSD Implementation | Office Equivalent | Industry Tool |
|---|---|---|---|
| Template definition | Markdown templates + HTML renderers | Word templates, form letters | Power Automate templates |
| Content generation | Sweep daemon hourly runs | Mail merge, report generation | n8n workflow nodes |
| Summarization | Transcript-compactor (7 content categories) | Executive summary writing | AI-assisted summarization |
| Version control | Git-friendly sorted JSON, atomic writes | SharePoint versioning, Track Changes | Document management systems |
| Quality gate | Validate-chipset schema checks | Review/approval workflow | Zapier conditional paths |
| Publishing | FTP sync + static HTML deployment | Print, email distribution, portal upload | Zapier publish actions |
| Archival | Compaction checkpoints in `.chipset/state/` | Records retention, archive folders | ECM archival policies |

## The Sweep Daemon: Cron-Driven Content Pipelines

The `sweep.py` daemon is a scheduled content generator that runs on an hourly cycle, updating 35+ live pages with fresh data. In office automation terms, this is a **scheduled report generator** -- the same pattern as:

- A nightly sales report that pulls from CRM and emails to management
- A weekly compliance dashboard that aggregates audit logs
- A monthly newsletter that compiles content from multiple departments

### How the Sweep Works

1. **Schedule trigger** -- Cron fires the sweep daemon at defined intervals
2. **Source collection** -- The daemon reads from configured data sources (weather APIs, research databases, live metrics)
3. **Template rendering** -- Data is merged into HTML templates with client-side markdown rendering
4. **Validation** -- Output is checked against expected structure (page exists, content non-empty)
5. **Publication** -- Generated files are synced to the live site via FTP
6. **Logging** -- Each sweep cycle logs its results for audit and debugging

This is functionally identical to an n8n workflow that triggers on a schedule, reads from multiple data sources, transforms the data, and writes to an output destination.

## Transcript Compactor: Intelligent Document Summarization

The transcript-compactor (`src/chipset/gastown/transcript-compactor.ts`) implements a 7-category content classification system that determines what to preserve and what to discard during summarization. This maps directly to document management concepts:

### Content Categories as Document Triage

| Category | Compactor Role | Office Equivalent |
|---|---|---|
| `instruction` | Always preserved | Policy documents, SOPs, directives |
| `decision` | Always preserved | Meeting minutes, decision logs |
| `result` | Kept up to limit | Final reports, deliverables |
| `error` | Always preserved | Incident reports, exceptions |
| `state` | Always preserved | Status updates, dashboards |
| `intermediate` | Discarded at moderate+ | Draft notes, working papers |
| `repeated` | Discarded at light+ | Duplicate communications, FYI forwards |

### Progressive Compaction as Records Management

The compactor's progressive threshold system mirrors how records management handles information lifecycle:

- **20% (snapshot)** -- Archive a checkpoint but keep everything. Like moving documents to a "completed" folder.
- **35% (light)** -- Remove duplicates only. Like de-duplicating email threads to keep only the final version.
- **50% (moderate)** -- Remove drafts and duplicates. Like purging working papers after the final report is approved.
- **60% (full)** -- Aggressive compression. Like reducing a project folder to the executive summary, key decisions, and final deliverables.

Research shows context quality degrades starting at 25% fill (not 100%), which is why the compactor starts early with lightweight snapshots. This is the same insight that drives tiered storage in enterprise content management: hot data stays accessible, warm data gets compressed, cold data gets archived.

## Industry Comparison

### Microsoft Power Automate

Power Automate creates automated workflows triggered by events or schedules. The sweep daemon is a Power Automate flow that runs on a timer trigger.

- **Power Automate** uses a visual flow designer; **GSD** uses Python scripts with YAML config
- **Power Automate** connects to 400+ SaaS connectors; **GSD** connects to APIs and local data sources
- **Power Automate** has built-in document generation (Word, PDF); **GSD** generates HTML/Markdown
- Both support conditional logic, loops, and error handling
- Both can trigger on schedule or event

### n8n (Open-Source Workflow Automation)

n8n is the closest architectural match to GSD's document pipeline because both are self-hosted, code-extensible, and designed for technical users.

- **n8n** has visual node-based workflows; **GSD** has script-based pipelines
- **n8n** has 300+ integration nodes; **GSD** uses direct API calls and file system operations
- **n8n** supports webhook triggers; **GSD** uses cron and event-log triggers
- Both support custom code execution within workflows
- Both prioritize data sovereignty (self-hosted, no cloud dependency)

### Zapier

Zapier is the most accessible comparison for non-technical audiences. "If this, then that" at document scale.

- **Zapier** has a 5-step free tier; **GSD** has unlimited pipeline complexity
- **Zapier** is cloud-only; **GSD** is local-first
- **Zapier** has Zap templates for common patterns; **GSD** has sweep configurations
- Both support multi-step workflows with conditional branching
- Both handle the "glue" between systems that don't natively integrate

## The Atomic Write Pattern

The transcript-compactor uses an atomic write strategy (`atomicWrite` function) that is critical for document reliability:

1. Write content to a temporary file (`.tmp` suffix)
2. Call `fsync` to ensure data reaches disk
3. Rename the temp file to the final path (atomic on POSIX)

This is the same pattern used by:
- Database write-ahead logs (WAL)
- Package managers (npm writes to `.staging/` then renames)
- Document management systems that guarantee "no partial writes"

In office terms: you never hand someone a half-printed document. The atomic write ensures that a published page is either the complete new version or the complete old version -- never a corrupted mix.

## Git-Friendly Serialization

Both the event-log and transcript-compactor use deterministic JSON serialization with sorted keys. This is a document management decision: when documents are version-controlled, the diff between versions should show only meaningful changes, not random key reordering.

This maps to:
- **Track Changes** in Word -- showing only what the author actually changed
- **Redline comparison** in legal documents -- deterministic diffing of contract versions
- **Audit compliance** -- being able to prove exactly what changed between document versions

## College Mappings

### Information Systems
- ETL (Extract, Transform, Load) pipeline design
- Content management system (CMS) architecture
- API integration patterns for document workflows
- Data quality and validation in automated pipelines

### Library Science
- Information lifecycle management (ILM)
- Records retention schedules and policies
- Metadata schemas for document classification
- Digital preservation strategies

### Technical Communication
- Single-source publishing (one source, multiple outputs)
- Content reuse and modular documentation
- Automated style enforcement
- Documentation-as-code methodology

## Study Guide Topics (13)

1. Document lifecycle: creation, review, approval, publication, archival, disposal
2. Scheduled automation: cron expressions, timer triggers, event-driven triggers
3. Template-based generation: mail merge, report builders, static site generators
4. Content classification: taxonomy design for automated triage
5. Summarization algorithms: extractive vs. abstractive, token-budget-aware compression
6. Atomic writes and crash-safe persistence
7. Version control for documents: git-based vs. CMS-based approaches
8. ETL pipeline design: sources, transformations, sinks, error handling
9. Multi-format output: HTML, PDF, Markdown, structured data
10. FTP/SFTP deployment automation and sync strategies
11. Content freshness: staleness detection, scheduled refresh, cache invalidation
12. Records management: retention policies, legal hold, disposition
13. Single-source publishing: write once, render to many formats

## DIY Try Sessions (3)

1. **Build a scheduled report generator** -- Create a script that runs on a cron schedule, reads from 2-3 data sources (a JSON API, a local file, a database query), merges the data into an HTML template, and writes the output to a web-accessible directory. Add a validation step that checks the output is non-empty and structurally valid before publishing. Compare your implementation to a Zapier or n8n workflow that does the same thing.

2. **Implement a content classifier** -- Write a function that takes a block of text and classifies it into one of 7 categories (instruction, decision, result, error, state, intermediate, repeated) using pattern matching. Feed it sample meeting notes, email threads, and project status updates. Measure classification accuracy and tune your patterns. This is the core of the transcript-compactor's `classifyLine` function.

3. **Design a document retention policy** -- Take an organization you know (your company, your school, a fictional enterprise) and design a 4-tier retention policy: (a) active documents (hot storage), (b) recent archives (warm, 1-3 years), (c) long-term archives (cold, 3-7 years), (d) disposition (delete or permanent preserve). Map each tier to the compactor's progressive levels (snapshot, light, moderate, full). Identify which document categories must be preserved at each tier.
