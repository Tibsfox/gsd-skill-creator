# Lessons — v1.15

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Promise.allSettled over Promise.all for independent service startup prevents one failure from cascading.**
   The dashboard and terminal are independent -- a terminal spawn failure shouldn't prevent the dashboard from loading.
   _⚙ Status: `investigate` · lesson #81_

2. **A unified launcher with single start/stop/status API hides multi-service complexity.**
   Users interact with one command; the launcher manages two processes. This is the facade pattern applied to dev environment management.
---
   _⚙ Status: `investigate` · lesson #82_

3. **Themed iframe embedding for the terminal panel couples the dashboard's CSS to Wetty's rendering.**
   If Wetty changes its DOM structure or styling, the theme integration may break.
   _🤖 Status: `investigate` · lesson #83 · needs review_
   > LLM reasoning: v1.16 Dashboard Console snippet doesn't show Wetty decoupling or theme isolation work.
