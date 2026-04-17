# Crew Profiles Reference — Research Mission Generator

Activation profiles scale crew size to mission complexity. Select based on module count and domain sensitivity.

## Profile Selection

| Modules | Sensitivity | Profile | Roles |
|---------|-------------|---------|-------|
| 2–3 | Low | Patrol | 7 |
| 2–3 | High (cultural, safety) | Squadron | 12 |
| 4–5 | Any | Squadron | 12 |
| 6+ | Any | Fleet | Full |

---

## Patrol Profile (7 roles)

For simple research missions with 2–3 modules and no sensitivity concerns.

| Role | Agent | Responsibility |
|------|-------|----------------|
| FLIGHT | Orchestrator | Mission direction; go/no-go gates |
| PLAN | Planner | Wave decomposition; dependency management |
| EXEC | Executor (1–2) | Document production |
| VERIFY | Verification | Source validation; accuracy checking |
| CAPCOM | HITL Interface | Human approval at wave boundaries |
| BUDGET | Resource Manager | Token budget tracking |
| LOG | Chronicle | Commit messages; milestone summaries |

---

## Squadron Profile (12 roles)

Standard profile for 4–5 module research missions or any mission with cultural/safety sensitivity.

| Role | Agent | Responsibility |
|------|-------|----------------|
| FLIGHT | Orchestrator | Overall mission direction; go/no-go gates |
| PLAN | Planner | Wave decomposition; parallel track optimization |
| SCOUT | Research Agent | Source gathering; evidence compilation; web research |
| EXEC | Executor (×2) | Document production — one per parallel track |
| CRAFT-1 | Domain Specialist | Primary domain analysis (e.g., ecological, technical) |
| CRAFT-2 | Domain Specialist | Secondary domain analysis (e.g., geographic, historical) |
| VERIFY | Verification | Source validation; accuracy checking |
| INTEG | Integration Agent | Cross-module relationship validation |
| CAPCOM | HITL Interface | Human approval at wave boundaries |
| BUDGET | Resource Manager | Token budget tracking; session planning |
| SURGEON | Health Monitor | Research quality degradation detection |
| LOG | Chronicle Agent | Audit trail; commit messages |

**CRAFT agent naming:** Name CRAFT agents for their domain. Examples:
- Ecology: CRAFT-ECO, CRAFT-GEO
- Technology: CRAFT-SEC, CRAFT-PERF
- History: CRAFT-CONTEXT, CRAFT-ANALYSIS
- Medical: CRAFT-CLINICAL, CRAFT-EPIDEM

---

## Fleet Profile (Full crew)

For 6+ module missions or enterprise-scale research campaigns.

All Squadron roles plus:

| Role | Agent | Responsibility |
|------|-------|----------------|
| TOPO | Topology Manager | Agent team structure; mid-mission restructuring |
| ARCH | Architecture | Cross-cutting structural decisions |
| SECURE | Security | Safety boundary enforcement |
| ANALYST | Pattern Analyst | Cross-module pattern detection |
| RETRO | Retrospective | Post-wave analysis; lessons learned |

Multiple EXEC and CRAFT instances. Team-of-teams topology with inter-team communication.

---

## Communication Loops

All profiles use the same communication architecture:

| Loop | Participants | Purpose |
|------|-------------|---------|
| Command | FLIGHT ↔ Tier 2/3 | Mission-level directives |
| Execution | PLAN ↔ EXEC ↔ VERIFY | Core build-verify cycle |
| Specialist | CRAFT agents | Domain coordination |
| User | CAPCOM ↔ Human | Only channel crossing human-machine boundary |
| Health | SURGEON ← all agents | Telemetry monitoring |
| Budget | BUDGET ← all agents | Resource consumption tracking |
