# Killer App Strategy — Strengthening gsd-skill-creator's Position

**Date:** 2026-03-31

## What Makes a Killer App

A killer app doesn't just use a platform — it's the reason people come to the platform. VisiCalc sold Apple IIs. Lotus 1-2-3 sold PCs. Halo sold Xboxes. The killer app demonstrates what the platform can do at a level that surprises even the platform's creators.

gsd-skill-creator is already one of the most sophisticated projects built on Claude Code. The question is how to go from "impressive power user" to "the project people point to when they want to understand what Claude Code can really do."

## Current Strengths

| Asset | Scale | Why It Matters |
|-------|-------|---------------|
| **34 skills** | Largest skill library in any single project | Proves the agentskills.io spec scales |
| **57 commands** | Most comprehensive command set | Shows GSD workflow depth |
| **21,298 tests** | Professional-grade test suite | Demonstrates engineering rigor |
| **190+ research projects** | Unprecedented research output | Proves AI-assisted research at scale |
| **360-degree engine** | 57 autonomous releases and counting | Proves continuous autonomous operation |
| **Multi-agent orchestration** | GUPP, DACP, Gastown convoy, sling-dispatch | Beyond what the platform ships |
| **HEL research** | 91K words, 28 docs, 3 formats | Real-world research with real impact potential |
| **Trust system** | Earned trust between agents | Novel contribution to agent safety |

## The Gaps

### 1. Discoverability
Nobody knows this exists unless they find the GitHub repo or tibsfox.com. The Skills-and-Agents project helps, but it's a tutorial — not a showcase.

**Action:** The research series IS the showcase. 190+ projects on tibsfox.com demonstrate the output. The HEL research with its PDFs and HTML versions is shareable. People can see what AI-assisted research looks like when it's taken seriously.

### 2. Reproducibility
Someone finding gsd-skill-creator today can't easily replicate the setup. The skill system, hooks, agents, and commands are deeply intertwined.

**Action:** The GSD upstream framework (v1.30.0) is the entry point. gsd-skill-creator is the reference implementation. Document the path from `npm install get-shit-done` to a working project with skills and agents.

### 3. The Engineering Story
The codebase tells a story — from v1.0 through v1.49.194, every decision built on the last. That history IS the value. But it's hidden in git log and release notes.

**Action:** The milestone summaries, release notes (435+ markdown files), and chain scores document the journey. Make this navigable — a timeline visualization showing the evolution from simple skill loader to multi-agent orchestration platform.

### 4. Community
One developer (you) pushing the boundaries is impressive but not a movement.

**Action:** Skills-and-Agents GitHub project is the community on-ramp. The OPEN research problems give people something to collaborate on. The HEL research gives people something to talk about that isn't code.

## Five Moves to Killer App Status

### Move 1: Ship the Research Pipeline as a Reusable Pattern

The 360 engine (degree → research → release notes → commit → tag → merge → push → GitHub release → FTP sync) is a proven autonomous pipeline that produced 57 releases. The HEL engine (topic → research agents → markdown → HTML/PDF → publish) produced 28 professional documents in one session.

**Make these patterns extractable.** A skill or command that says "here's a topic, produce a research project with HTML/PDF output, publish it" would be immediately valuable to anyone doing AI-assisted research.

### Move 2: Prove the Multi-Agent Patterns at Scale

GUPP, DACP, Gastown convoy, sling-dispatch, mayor-coordinator — these are genuinely novel. But they exist as skills and docs, not as demonstrated benchmarks.

**Run a public benchmark.** Take a well-defined task (e.g., "produce 10 research projects in parallel"), run it with and without the orchestration patterns, and publish the results. Time, quality, failure rate, recovery. Hard numbers.

### Move 3: Build the Fox Companies Integration Layer

The HEL research demonstrated that AI-assisted research can produce publication-quality output on real-world problems (helium supply chain, semiconductor infrastructure, cooperative formation). This is not a toy demo.

**Extend this to each Fox Company domain:** FoxFiber (broadband infrastructure research), SolarFox (renewable energy analysis), FoxMaglev (transportation engineering), FoxCompute (edge compute architecture). Each becomes a research project demonstrating AI + human collaboration on real infrastructure problems.

### Move 4: Open the OPEN Problems

The 12 unsolved problems on tibsfox.com/Research/OPEN are perfect collaboration targets. Collatz, Chromatic Number, Komlos — these are problems anyone can work on.

**Create a contribution model:** Each problem gets a dedicated research page (the agent building these now). Contributors can submit findings via PR to the Skills-and-Agents repo. AI-assisted mathematical exploration becomes a community activity.

### Move 5: Document the Human-AI Collaboration Model

This is the thing that makes gsd-skill-creator unique. It's not just "AI writes code" — it's a specific model of collaboration where:
- The human provides creative direction, domain expertise, and quality standards ("my hi-fi, my tuner car")
- The AI provides research depth, parallel execution, format conversion, and tireless iteration
- The tooling (GSD, skills, hooks, agents) provides the structure that makes the collaboration reproducible
- The output (research, code, documentation) is greater than either could produce alone

**This model itself is the killer app.** Not the code. Not the skills. The way of working. Document it explicitly so others can adopt it.

## The Competitive Landscape

Other Claude Code power users exist. But none we're aware of have:
- A 50-milestone version chain with scored reviews
- A multi-agent orchestration layer with named patterns
- A 190+ project research output published on a live website
- A trust system for agent relationships
- A continuous release engine that runs autonomously
- A professional research series with LaTeX PDFs

The position to defend is not "most code" — it's "most thoughtful integration of AI into human creative and engineering work." That's harder to copy because it requires the same kind of creative systems thinking that produced it.

## What the Code Release Changes

The Claude Code source visibility means other developers can now see the same internal patterns we discovered through binary analysis and extensive usage. The advantage of deep platform knowledge erodes.

But the advantage of **having already built 34 skills, 57 commands, and 190+ research projects** does not erode. The code shows how the engine works. Our work shows what the engine can produce when someone takes it seriously. That's the difference between knowing how a guitar is made and being able to play it.

Keep playing.
