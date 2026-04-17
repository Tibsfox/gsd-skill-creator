# Lessons — v1.39

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A desktop shell becomes a development environment through IPC + services + intake, not through adding features.**
   The 29 event types, 7-service launcher, and staging intake pipeline transform GSD-OS from a display surface into a living system where components communicate, start in order, and process incoming work.
   _🤖 Status: `investigate` · lesson #208 · needs review_
   > LLM reasoning: Gource visualization pack is unrelated to IPC, services, or intake transforming a shell into a dev environment.

2. **Topological sort for service startup is essential, not clever.**
   Dependencies between services are a DAG. Starting them in arbitrary order creates race conditions. Kahn's sort is the correct algorithm for this exact problem.
   _⚙ Status: `investigate` · lesson #209_

3. **Port-based dependency injection (Phase 383) enables integration testing without running real services.**
   The 36 integration tests use injected ports, which means the wiring between subsystems can be tested without spawning actual API clients or service launchers.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #210_

4. **Magic verbosity must be a first-class system, not an afterthought.**
   Building the 5-level visibility map into the IPC foundation from the start means every new event type automatically inherits verbosity behavior. Adding verbosity control later would require retrofitting all 29 event types.
---
   _🤖 Status: `investigate` · lesson #211 · needs review_
   > LLM reasoning: v1.45 static site work is unrelated to IPC verbosity architecture.

5. **517 tests across 9 phases with 8 disparate subsystems.**
   IPC, API client, CLI chat, bootstrap, magic verbosity, service launcher, staging intake, and self-improvement lifecycle are architecturally distinct. The integration wiring (Phase 383, 36 tests) that connects them all is the thinnest phase relative to its importance.
   _🤖 Status: `investigate` · lesson #212 · needs review_
   > LLM reasoning: v1.42 git workflow skill does not address integration wiring across the 8 subsystems.

6. **Rust SSE streaming parser and GNOME Keyring/macOS Keychain integration add platform-specific complexity.**
   The API client's secure key management spanning env vars, OS keychains, and encrypted files creates multiple code paths that need platform-specific testing.
   _🤖 Status: `investigate` · lesson #213 · needs review_
   > LLM reasoning: v1.41 snippet too sparse to confirm platform-specific keychain/SSE hardening.
