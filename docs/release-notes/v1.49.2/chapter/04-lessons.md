# Lessons — v1.49.2

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **ESM import extensions should be enforced by lint, not discovered during compilation.**
   A single eslint-plugin-import rule (`import/extensions`) would have prevented 76% of these errors from accumulating.
   _⚙ Status: `investigate` · lesson #269_

2. **Ajv ESM/CJS interop requires the `.default` fallback pattern.**
   This is a recurring cross-ecosystem friction point that should be documented as a project convention.
   _⚙ Status: `investigate` · lesson #270_

3. **Desktop indicator wiring is a good smoke test for Tauri integration.**
   If the indicators respond correctly, the full Rust-TypeScript-PTY pipeline is working.
   _🤖 Status: `applied` (applied in `v1.49.3`) · lesson #271 · needs review_
   > LLM reasoning: Desktop polish patch directly follows up on indicator wiring, validating the smoke-test approach.

4. **167 of 219 errors were missing `.js` extensions.**
   This is a tooling gap -- ESM resolution rules should be enforced by a lint rule at authorship time, not caught as a batch of 167 errors after the fact.
   _⚙ Status: `investigate` · lesson #272_

5. **Holomorphic and upstream modules were the worst offenders.**
   114 relative imports across 34 files in those two directories suggests they were written without the same import discipline as the rest of the codebase.
   _⚙ Status: `investigate` · lesson #273_
