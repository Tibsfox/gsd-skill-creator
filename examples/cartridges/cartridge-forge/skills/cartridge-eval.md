---
name: cartridge-eval
description: Run evaluation chipset gates against a cartridge.
---

# cartridge-eval

Use when the user asks to run pre-deploy gates, evaluate a cartridge for
ship-readiness, or test a cartridge's health. Runs the gate list declared
in the cartridge's evaluation chipset `pre_deploy`.

Calls `skill-creator cartridge eval <path> [--json]`.
