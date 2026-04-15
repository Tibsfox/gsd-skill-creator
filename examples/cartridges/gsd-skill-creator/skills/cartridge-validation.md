# cartridge-validation

Run and interpret the four forge gates — validate (schema), eval (pre-deploy gates declared in evaluation.yaml), dedup (no cross-chipset collisions), and metrics (shape report). Handles validation debt via --allow-validation-debt and KNOWN-VALIDATION-DEBT.md tracking. Gate results drive ship/no-ship.

**Triggers:** `validate cartridge`, `cartridge eval gate`, `dedup cartridge`, `cartridge metrics`, `forge gate failed`, `validation debt`, `pre-deploy gate`

**Affinity:** `cartridge-smith`
