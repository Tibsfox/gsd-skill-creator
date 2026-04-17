# Lessons — v1.49.69

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Kubernetes is infrastructure for infrastructure.**
   K8S doesn't run applications — it runs the system that runs applications. This meta-layer pattern is the same one that GSD implements for development workflows: not the work itself, but the system that orchestrates the work. The architectural parallel is structural.
   _🤖 Status: `investigate` · lesson #560 · needs review_
   > LLM reasoning: No visible connection between the K8s meta-layer lesson and the Blue Infrastructure snippet.

2. **The CNCF ecosystem is the new Linux distribution landscape.**
   Just as Linux distributions package the kernel with different userland choices, CNCF projects package Kubernetes with different networking (Cilium/Calico), storage (Longhorn/Rook), and observability (Prometheus/OpenTelemetry) choices. The distribution decision is really a CNCF stack decision.
---
> *Kubernetes doesn't run your containers. It runs the system that runs your containers. The orchestrator orchestrates the orchestration. And at 3am, when a pod won't schedule because the GPU topology doesn't match the affinity rules, the operator is the one who actually runs everything.*
>
> *The steel and electric blue of infrastructure. The layer that everything else depends on.
   _⚙ Status: `investigate` · lesson #561_

3. **The multi-cluster and federation story is thin.**
   K8S focuses on single-cluster architecture. Multi-cluster federation (Liqo, Admiralty, Clusternet) and the emerging multi-cluster service mesh patterns would strengthen the FoxCompute distributed deployment model.
   _⚙ Status: `investigate` · lesson #562_
