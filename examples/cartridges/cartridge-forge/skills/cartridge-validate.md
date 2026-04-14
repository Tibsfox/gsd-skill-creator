---
name: cartridge-validate
description: Schema validation and cross-chipset consistency checks.
---

# cartridge-validate

Use when the user asks to validate, lint, or check a cartridge. Separates
schema errors from cross-chipset semantic errors and surfaces warnings.

Calls `skill-creator cartridge validate <path> [--json]`.
