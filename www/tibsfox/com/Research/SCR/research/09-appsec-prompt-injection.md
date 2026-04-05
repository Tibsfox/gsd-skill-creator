# Application Security Programs and Indirect Prompt Injection

> **Domain:** Security Engineering & AI Agent Safety
> **Module:** 9 -- AppSec Program Maturity + Indirect Prompt Injection Architectures
> **Through-line:** *An application security program isn't a project. It's a living program that requires ongoing work, especially in terms of culture. Culture is executing the same things without your supervision. And in the AI era, the risk lies mostly in the tools.*
> **Source:** OWASP Global AppSec Conference, 2 talks (~85 minutes total)
> **Rosetta Clusters:** Infrastructure (primary), AI & Computation

---

## Table of Contents

1. [AppSec Program Maturity: 8 Years in a Bank](#1-appsec-program-maturity)
2. [Five Lessons Learned](#2-five-lessons-learned)
3. [Culture vs. Knowledge](#3-culture-vs-knowledge)
4. [Indirect Prompt Injection Architecture](#4-indirect-prompt-injection-architecture)
5. [Tool Enumeration Methodology](#5-tool-enumeration-methodology)
6. [Approval Level Attack Matrix](#6-approval-level-attack-matrix)
7. [Numbers](#7-numbers)
8. [Study Topics](#8-study-topics)
9. [DIY Sessions](#9-diy-sessions)
10. [Cross-Cluster Connections](#10-cross-cluster-connections)
11. [Sources](#11-sources)

---

## 1. AppSec Program Maturity

Max Alejandro (CEO/Founder of Latangs, 10+ years AppSec in Latin American financial sector) traces an 8-year journey deploying application security at one of Latin America's largest banks: 220+ applications, 300+ dev teams, 3,000+ people trained.

### Program Lifecycle

| Phase | Scale | What Happened |
|-------|-------|--------------|
| **Guerrilla** | 5 apps, 10 teams | Bypassed CISO approval; proved value with one willing department |
| **Expansion** | 10 apps, 20 teams | With proof of value, gained authorization |
| **Massive** | 220 apps, 300+ teams | Organization-wide authorization |
| **Decay** | 70 apps retained, 150 dropped | Culture failure -- 70% of teams stopped following the program |
| **Recovery** | 180 apps, 250+ teams | Retrained, re-engaged, rebuilt from the mess |

> "Dream big, start small."

---

## 2. Five Lessons Learned

1. **The "no" is about sustainability, not the idea.** When leadership says no, they question how the idea can be sustained at scale -- not the concept. Three questions must be answered: How do you deploy it? How do you guarantee adoption? How do you measure results?

2. **Business alignment is non-negotiable.** A cybersecurity strategy separate from the business strategy will not be adopted. Security must enable business objectives, not constrain them.

3. **Battle by battle, one at a time.** Scale door-to-door, team by team.

4. **Show the value of adoption, not execution.** Demonstrate risk reduction, cost savings, maturity increase via OWASP SAMM -- not just running security tasks.

5. **"We finished the job" is the most dangerous belief.** After deploying documentation, methodologies, tools, and standards, they assumed the job was done. They stopped measuring continuous implementation, stopped supporting teams, and forgot the most important part: strengthening security culture.

---

## 3. Culture vs. Knowledge

> "The culture means that all of those people that you gave this kind of knowledge are executing the same things without your supervision."

**Knowledge** is knowing what to do. **Culture** is doing it without supervision. 70% of teams stopped following the program because culture was not built -- only knowledge was transferred. 150 of 220 applications dropped out of continuous execution.

### Four Monitoring Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| **Training Coverage** | % of teams that completed security training |
| **Deployment Status** | % of teams with tools/processes deployed |
| **Adoption Rate** | % of teams actively using deployed practices |
| **Continuous Execution** | % of teams still executing after 90 days without supervision |

**Culture health metric:** Continuous Execution / Training Coverage. Values below 0.5 indicate knowledge without culture.

---

## 4. Indirect Prompt Injection Architecture

Will (Security Engineer, AI Assurance Team at Trail of Bits) presents the definitive architectural testing methodology for AI agent security.

### Three Components of Indirect Prompt Injection

All three must be present:
1. **An external adversary** who cannot directly interact with the AI system
2. **Untrusted data** that crosses a trust boundary and enters the context
3. **The data contains instructions** that the model treats as commands

### The Risk Lies in the Tools

Citing Nvidia's red team blog post ("Agentic Autonomy Levels and Security"):

> "The risk associated with these agentic systems lies mostly in the tools or plugins available to those systems. In the absence of a tool or a plugin, it can fall to misinformation as being one of the core risks."

### Most Core Issues Are AppSec Issues

SQL injection in tool backends, missing authorization on API endpoints, broken access control -- standard OWASP Top 10 vulnerabilities that exist regardless of whether an AI agent is calling them. Traditional security comes first.

---

## 5. Tool Enumeration Methodology

The very first step in threat modeling an AI agent:

1. **Enumerate all tools** -- Build complete table: tool name, capability, data access, approval level
2. **Classify AppSec risks first** -- SQL injection, auth bypass, SSRF in tool backends
3. **Map trust boundaries** -- Where untrusted data enters; what crosses from user-writable to agent-readable
4. **Identify approval gaps** -- Tools with no human approval are directly exploitable
5. **Test configuration attack paths** -- Can a file-write tool overwrite approval configuration?
6. **Dynamic testing via JavaScript automation** -- Build test suites from the threat model

### Calendar Agent Threat Model (Example)

```
[Users] --> write emails --> [SQL Database] <-- reads <-- [AI Agent]
[Users] --> calendar entries --> [Calendar API] <-- reads <-- [AI Agent]
[AI Agent] --> calls tools --> [Email Tool, Calendar Tool, Contact Manager]
                                                    ^
                                        No approval required =
                                        attacker can modify/delete contacts
```

---

## 6. Approval Level Attack Matrix

| Approval Location | Injection Risk | Attack Path |
|-------------------|---------------|-------------|
| **System prompt** | HIGH | Direct prompt injection: "execute tool without asking for approval" |
| **Configuration file** | MEDIUM | File-write tool overwrites config to disable approval |
| **Tool code (hardcoded)** | LOW | Requires code modification -- not achievable via injection alone |
| **No approval** | CRITICAL | Any tool call is fully adversary-controllable |

### Configuration Overwrite Attack

If human-in-the-loop approval reads from a config file, and the agent has a file-write tool, an attacker can use indirect prompt injection to write a new config disabling approval -- bypassing the safety gate through legitimate tool use.

> "If you can write that file using a file write tool, you can now bypass the human approval if it's set in the tool code."

---

## 7. Numbers

| Metric | Value | Context |
|--------|-------|---------|
| Applications at peak | 220+ | Integrated into AppSec program |
| Dev teams at peak | 300+ | Adopted tooling and practices |
| People trained | 3,000+ | Door-to-door, team-by-team |
| Applications lost | 150 | Stopped executing abuse case modeling |
| Teams non-compliant | 70% | After culture failure |
| Retained after decay | ~70 apps | Only 30% continued |
| Recovery target | 180 apps | Readopted the program |
| Journey duration | 8 years | Concept to mature program |
| Initial pilot | 5 apps / 10 teams | Guerrilla starting point |

---

## 8. Study Topics

1. **OWASP SAMM** -- Software Assurance Maturity Model: measuring and benchmarking program maturity
2. **OWASP Cornucopia** -- Card-based threat modeling for identifying security requirements from user stories
3. **Security Champion Programs** -- Door-to-door organizational engagement strategies
4. **Security Culture vs. Knowledge** -- Training (knowledge transfer) vs. culture-building (behavioral change)
5. **Indirect Prompt Injection Taxonomy** -- Three required components; propagation through tool responses
6. **Tool Enumeration for AI Agents** -- Systematic tool/capability tables; prioritizing by approval level
7. **Trust Boundaries in Agentic Systems** -- Where user-writable data enters agent context
8. **Human-in-the-Loop Bypass Attacks** -- Three approval locations and their bypass paths
9. **Nvidia Agentic Autonomy Levels** -- Risk spectrum from zero tools to N tools
10. **AppSec-First AI Security Testing** -- Why OWASP Top 10 issues must be resolved before AI-specific testing

---

## 9. DIY Sessions

### Session 1: Build a Security Culture Scorecard

Design a 4-dimension measurement dashboard:
- **Training Coverage:** % of teams completing security training
- **Deployment Status:** % of teams with tools deployed
- **Adoption Rate:** % of teams actively using practices
- **Continuous Execution:** % still executing after 90 days without supervision

Calculate culture health as: Continuous Execution / Training Coverage. Track weekly.

### Session 2: Enumerate Your Agent's Tool Surface

Take any AI agent you use (Claude Code, Cursor, a custom MCP-based agent) and build:

| Tool Name | Capabilities | Approval Level |
|-----------|-------------|---------------|
| Bash | Execute shell commands | Human approval required |
| Read | Read any file on disk | Automatic |
| Write | Write/overwrite files | Human approval required |
| Edit | Modify file contents | Human approval required |
| MCP Server X | [list each tool] | [check config] |

For each tool with "automatic" approval: what could an adversary do if they controlled the input through indirect prompt injection?

### Session 3: Test Configuration Attack Paths

If your AI agent uses configuration files for approval settings:
1. Identify where approval rules are stored
2. Check: Does the agent have a file-write tool that can reach this path?
3. If yes: Can an injection payload instruct the agent to modify the config?
4. Document the chain and propose mitigation (file permissions, path blocklist, read-only mount)

---

## 10. Cross-Cluster Connections

### Mapping to Harness Integrity Invariants

| Invariant | AppSec Connection | Injection Connection |
|-----------|-------------------|---------------------|
| **HI-1: Hooks executable** | Deployment integrity | Tampered hook = bypassed safety gate |
| **HI-3: No verification bypasses** | 70% dropout = teams bypassing verification | `--no-verify` and `--force` as code equivalents |
| **HI-6: No .env tracked** | Credential hygiene | Credentials in tool context = exfiltration target |
| **HI-8: Agent tool constraints** | Teams without constraints caused dropout | Tool enumeration is Will's core thesis |
| **HI-10: No injection patterns** | Cornucopia identifies injection threats | Skills containing eval/exec = unsanitized SQL |
| **HI-11: MCP tool description hashes** | N/A | Tool poisoning via modified docstrings; hashing detects tampering |
| **HI-14: Subagent tool constraints** | Sub-teams needed explicit scope | Unrestricted subagents = "70% dropout" of agent security |
| **HI-15: RAG sanitization** | Data quality = maturity | Unsanitized embeddings = persistent injection vectors |

### College Mappings

| College | Relevance | Key Thread |
|---------|-----------|------------|
| Mind-Body | HIGH | Culture vs. knowledge; behavioral change sustainability |
| ECO (Ecology) | HIGH | Program as ecosystem; deployment-adoption-culture cycle |
| Electronics | HIGH | Tool enumeration; circuit-level data flow thinking |

---

## 11. Sources

- Max Alejandro, OWASP Global AppSec: "Connecting the Dots: 5 Lessons Learned from an 8-Year AppSec Journey" (~44 min)
- Will, Trail of Bits, OWASP Global AppSec: "Indirect Prompt Injection: Architectural Testing Approaches" (~41 min)
- Nvidia Red Team: "Agentic Autonomy Levels and Security" (Rich Herang et al.)
- OWASP SAMM v2 (Software Assurance Maturity Model)
- OWASP Cornucopia (threat modeling card game)

---

*Artemis II Research Division -- AppSec and Prompt Injection analysis, Session 8. v1.49 PNW Research Series.*
