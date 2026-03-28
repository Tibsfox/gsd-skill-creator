# Agentic Interface -- Designing for the Age of Agents

## Overview

Traditional UX assumes a human user navigating an interface via direct manipulation. Agentic AI systems invert this: the interface must now be legible to both a human supervisor and an autonomous agent executor. This module surveys the emerging field of agentic interface design as of 2025-2026.

## The Agentic Inversion

In classical HCI (Norman, 1988), the interaction cycle is:
1. Human forms intent
2. Human manipulates interface
3. System responds
4. Human evaluates response

In agentic systems, the cycle becomes:
1. Human declares intent (natural language or structured)
2. Agent interprets intent
3. Agent manipulates interface/API on human's behalf
4. Agent reports outcome
5. Human evaluates and corrects

The interface now serves two audiences: the human (who needs visual feedback) and the agent (who needs structured semantics).

## Human-Agent Centered Design (H-ACD)

H-ACD extends user-centered design to include AI agents as first-class interface consumers:

### Core Principles
- **Transparency:** The agent's reasoning and actions must be visible to the human
- **Controllability:** The human can override, pause, or redirect the agent at any time
- **Predictability:** The agent's behavior should be consistent and explainable
- **Graceful degradation:** If the agent fails, the human can continue manually

## Microsoft Agent UX Design Principles (2025)

Microsoft's framework identifies five design principles for agentic interfaces:

1. **Lead with the outcome, not the agent:** Show what was accomplished, not how
2. **Keep the human in control:** Every agent action should be reviewable and reversible
3. **Design for trust calibration:** Users need to learn when to trust the agent
4. **Show work in progress:** Streaming, not batch -- let the human see the agent working
5. **Handle failure gracefully:** Clear error states with human-understandable explanations

## Salesforce Intent-First Architecture

Salesforce's Agentforce platform introduces "intent-first" design:
- The user declares what they want (intent)
- The system decomposes the intent into a plan
- The agent executes the plan, reporting progress
- The UI adapts to show relevant context for the current step

This maps directly to GSD's three-part DACP bundle: intent + data + code.

## Google Generative UI (2025)

Google's research into Generative UI treats the interface itself as a generated artifact:
- The agent generates the optimal UI for the current task
- Layout, components, and information density adapt in real time
- The human sees only what is relevant to their current intent

This is a radical departure from static design systems: the UI is no longer a fixed set of pages but a dynamically composed response to context.

## Design Tokens as Machine-Readable Contracts

Design tokens bridge the human and agent audiences:
- **For humans:** Tokens ensure visual consistency (brand colors, spacing, typography)
- **For agents:** Tokens provide structured semantics (this color means "success," this spacing means "related")

The token is a morphism from semantic intent to visual output, readable by both biological and artificial cognition.

## The Dual-Audience Interface Problem

The central challenge: how do you design an interface that is simultaneously:
- **Visually legible** to humans (gestalt grouping, color contrast, spatial hierarchy)
- **Semantically legible** to agents (structured markup, labeled regions, machine-readable state)

Solutions emerging in 2025-2026:
- ARIA-like semantic markup extended for agent consumption
- Structured action affordances (JSON-described available actions)
- Intent-outcome mapping (every UI state maps to a describable intent)
- Progressive disclosure for agents (agents see the full state tree; humans see a curated view)

## Cross-References

> **Related:** [Chromatic Signal](01-chromatic-signal.md) for the visual channel, [Categorical Structure](03-categorical-structure.md) for composition rules, [Synthesis](06-synthesis.md) for the integrated dual-audience framework.
