---
name: cloud-systems-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/cloud-systems-department/README.md
description: >
  Coordinated cloud systems department — seven named agents, six knowledge
  skills, three teams. Tenth instantiation of the department template pattern.
superseded_by: null
---

# Cloud Systems Department

## 1. What is the Cloud Systems Department?

The Cloud Systems Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured cloud-infrastructure expertise across distributed consensus, storage architecture, networking, identity and authentication, service-oriented architecture, and reliability engineering (including the NASA Systems Engineering lifecycle adapted for cloud operations). Incoming requests are classified by a router agent (Lamport), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college cloud-systems concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
cp -r examples/chipsets/cloud-systems-department .claude/chipsets/cloud-systems-department
```

The chipset activates when any of the six skill trigger patterns match an incoming query. Lamport classifies the query domain and dispatches to the appropriate specialist. No explicit activation is needed — skill-integration loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/cloud-systems-department/chipset.yaml', 'utf8')).name)"
# Expected output: cloud-systems-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus, four on Sonnet.

| Name           | Historical Figure     | Role                                                         | Model  | Tools                          |
|----------------|-----------------------|--------------------------------------------------------------|--------|--------------------------------|
| lamport        | Leslie Lamport        | Department chair — classification, routing, consensus theory | opus   | Read, Glob, Grep, Bash, Write  |
| dean           | Jeff Dean             | Scale engineer — tail latency, capacity, production Paxos    | opus   | Read, Grep, Bash               |
| ghemawat       | Sanjay Ghemawat       | Storage architect — GFS/Bigtable/Spanner, replication        | opus   | Read, Grep, Bash               |
| hamilton-cloud | James Hamilton (AWS)  | Infrastructure economics — cost, hardware, IAM at scale      | sonnet | Read, Bash                     |
| vogels         | Werner Vogels         | Service architecture — SOA, API contracts, eventual consistency | sonnet | Read, Grep, Bash           |
| decandia       | Giuseppe DeCandia     | Quorum storage — Dynamo-style KV, consistent hashing         | sonnet | Read, Grep, Bash               |
| gray           | Jim Gray              | Pedagogy & transaction processing — ACID, runbooks, postmortems | sonnet | Read, Write                 |

Lamport is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Lamport.

### Name disambiguation: hamilton vs hamilton-cloud

The project-management department uses `hamilton` for Margaret Hamilton (Apollo on-board software). This department's James Hamilton (AWS infrastructure economics) is named `hamilton-cloud` throughout — directory name, frontmatter, chipset references, team references, and cross-agent callouts — to prevent collision. The two are unrelated historical figures with the same surname. If you fork this department into a project that does not include project-management, you may simplify the name to `hamilton`, but leave the documented disambiguation note so the distinction is not lost.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                         | Domain        | Trigger Patterns                                                       | Agent Affinity                       |
|-------------------------------|---------------|------------------------------------------------------------------------|--------------------------------------|
| distributed-consensus         | cloud-systems | paxos, raft, consensus, logical clock, quorum, replicated log, tla+, split brain | lamport, dean, decandia      |
| service-architecture          | cloud-systems | microservice, service boundary, api versioning, saga, circuit breaker, service mesh, idempotency, backward compat | vogels, dean, hamilton-cloud |
| cloud-identity-and-auth       | cloud-systems | keystone, oauth, oidc, jwt, iam, mtls, token, federation, spiffe       | hamilton-cloud, vogels, lamport      |
| distributed-storage           | cloud-systems | gfs, bigtable, spanner, s3, swift, ceph, replication, erasure coding, cap theorem, snapshot | ghemawat, dean, decandia |
| network-fundamentals-cloud    | cloud-systems | vpc, vxlan, security group, load balancer, floating ip, neutron, sdn, tail latency, incast | hamilton-cloud, vogels, dean |
| reliability-engineering-cloud | cloud-systems | slo, sli, error budget, runbook, postmortem, incident, chaos, ORR, CDR, PDR, TAID | gray, hamilton-cloud, lamport     |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                          | Agents                                                        | Use When                                                    |
|-------------------------------|---------------------------------------------------------------|-------------------------------------------------------------|
| cloud-systems-analysis-team   | lamport, dean, ghemawat, hamilton-cloud, vogels, decandia, gray | Multi-domain, design-level, cross-cutting incident analysis |
| cloud-systems-workshop-team   | lamport, ghemawat, dean, gray                                 | Storage architecture, consensus protocol design, capacity-sensitive work |
| cloud-systems-practice-team   | lamport, decandia, hamilton-cloud, vogels, gray               | Incident response, postmortems, runbook construction, ops readiness |

**cloud-systems-analysis-team** is the full department. Use it for problems that span multiple cloud-systems domains or require the broadest possible expertise.

**cloud-systems-workshop-team** pairs the chair (Lamport) with the storage architect (Ghemawat), the scale evaluator (Dean), and the pedagogy agent (Gray). Use it when the primary goal is architectural review of storage, consensus, or capacity-sensitive systems.

**cloud-systems-practice-team** is the operations pipeline. Lamport triages, specialists analyze, Gray documents. Use it for incidents, postmortems, and runbooks.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `cloud-systems-department` namespace. Five record types are defined:

| Record Type              | Produced By                             | Key Fields                                                       |
|--------------------------|-----------------------------------------|------------------------------------------------------------------|
| CloudSystemsAnalysis     | dean, ghemawat, decandia                | subject, findings, severity, mitigations, confidence             |
| CloudSystemsDesign       | ghemawat, vogels, decandia              | boundaries, coordination, contracts, rationale, risks            |
| CloudSystemsReview       | lamport (synthesis), workshop team      | verdict, strengths, issues, recommendations, operational notes   |
| CloudSystemsExplanation  | gray                                    | topic, target level, explanation body, prerequisites, references |
| CloudSystemsSession      | lamport                                 | session id, queries, dispatches, work product links, timestamps  |

Records are content-addressed and immutable once written. CloudSystemsSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college cloud-systems department concept graph:

- **Concept graph read/write**: Agents read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a CloudSystemsExplanation is produced, the chipset can automatically generate a Try Session based on the explanation content.
- **Learning pathway updates**: Completed analyses, designs, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college cloud-systems department structure:
  1. Identity & Networking
  2. Compute & Storage
  3. Orchestration
  4. NASA SE Lifecycle
  5. Runbook Operations

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/cloud-systems-department examples/chipsets/YOURDOMAIN-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Keep the 3-Opus / 4-Sonnet split if judgment-heavy work is expected.

### Step 3: Replace skills

Swap the six cloud-systems skills for domain equivalents. Each skill needs:

- A `domain` value
- A `description`
- A `triggers` list of natural language patterns
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `CloudSystemsX` record types with domain-appropriate types.

### Step 5: Map to your college department

Update the `college` section — set `department`, define wings, decide whether `concept_graph.write` should be enabled.

### Step 6: Update evaluation gates

Add domain-specific checks. The default gates are generic enough for most departments.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Lamport) as the entry point. This provides classification (which domains are touched), synthesis (for multi-domain queries), and the CAPCOM boundary (the user interacts with exactly one agent).

### Why 3 Opus / 4 Sonnet

Cloud-systems work mixes judgment-heavy architecture decisions with structural operational work. Opus handles Lamport (classification + consensus), Dean (scale reasoning), and Ghemawat (architectural review). Sonnet handles Hamilton-cloud (cost modeling), Vogels (service design), DeCandia (quorum mechanics), and Gray (pedagogy and prose).

### Why these three teams

- **Full analysis team**: all 7 agents, parallel — for problems that genuinely span domains.
- **Workshop team**: 4 agents (Lamport, Ghemawat, Dean, Gray), focused on architecture — for design work where service/cost/quorum are not central.
- **Practice team**: 5 agents (Lamport, DeCandia, Hamilton-cloud, Vogels, Gray), sequential pipeline — for operational work where triage speed and documentation discipline matter more than architectural depth.

This mirrors the math department's three-shape pattern (investigation, workshop, discovery) and the RCA suite's three shapes (deep, triage, postmortem).

### CAPCOM boundary

Only Lamport produces user-facing text. Other agents produce Grove records; Lamport translates and synthesizes. Enforced by `is_capcom: true` on lamport in the chipset.

## 10. Relationship to Other Departments

- **Math Department**: Lamport's TLA+ work intersects with proof-techniques and mathematical-modeling. Cross-department queries are routed by each department's chair.
- **Project-Management Department**: `hamilton` in project-management is Margaret Hamilton (Apollo software). `hamilton-cloud` in cloud-systems is James Hamilton (AWS infrastructure). Disambiguation is documented in both agents' AGENT.md files.
- **Engineering and Coding Departments**: Cloud-systems concepts overlap with engineering practices and codebase patterns. Shared skills (reliability-engineering-cloud, service-architecture) are forkable into those departments with renames as needed.
- **College cloud-systems department**: This chipset is the in-college complement to the reference `.college/departments/cloud-systems/` concept graph.

## 11. What makes this department different

- **NASA SE discipline integrated with cloud ops.** Most cloud-reliability work borrows from SRE; this department explicitly pulls in NASA's Systems Engineering review gates (MCR/SRR/PDR/CDR/ORR) and TAID verification methods, because cloud systems at critical scale increasingly need aerospace-grade discipline.
- **Gray as the transaction-processing lineage holder.** ACID is not treated as legacy — it is treated as the contract-definition tradition that modern reliability thinking inherits from. Gray's pedagogy role ensures this lineage is visible to users.
- **Dean and Ghemawat paired as in reality.** The Dean/Ghemawat collaboration defined cloud-scale systems at Google. The department preserves the pairing as a first-class orchestration pattern.
- **DeCandia as the operational-mechanics specialist.** Dynamo's value is as much in its operational details as in its theory; DeCandia's role covers the mechanics that theoretical consensus papers leave out.
- **James-vs-Margaret Hamilton disambiguation.** The `-cloud` suffix is a worked example of how to handle collisions across forkable departments without renaming underlying figures.
