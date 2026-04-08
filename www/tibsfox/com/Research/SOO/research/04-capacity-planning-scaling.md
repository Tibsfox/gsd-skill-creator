---
id: SOO-04-capacity-planning-scaling
title: "Module 04: Capacity Planning & Scaling"
type: reference
series: Systems Operations (SysOps)
project_code: SOO
lifecycle_state: Published
review_cadence: Annual
audience: [sre, platform_engineer, devops_engineer, engineering_manager, cloud_architect]
scope: "Demand forecasting, scaling strategies, autoscaling patterns, load testing, resource right-sizing, queueing theory, headroom planning, and cloud-specific capacity management"
purpose: "Provide a rigorous, formula-grounded framework for planning system capacity — from forecasting demand through scaling infrastructure to validating that the plan holds under load"
version: "1.0"
last_reviewed: "2026-04-08"
next_review: "2027-04-08"
---

# Capacity Planning & Scaling

## Table of Contents

1. [Introduction](#1-introduction)
2. [Demand Forecasting](#2-demand-forecasting)
3. [Horizontal vs Vertical Scaling](#3-horizontal-vs-vertical-scaling)
4. [Autoscaling Patterns](#4-autoscaling-patterns)
5. [Load Testing for Capacity](#5-load-testing-for-capacity)
6. [Resource Right-Sizing](#6-resource-right-sizing)
7. [Queue Theory for Operations](#7-queue-theory-for-operations)
8. [Headroom Planning](#8-headroom-planning)
9. [Cloud-Specific Capacity](#9-cloud-specific-capacity)
10. [Case Studies: Scaling Under Pressure](#10-case-studies-scaling-under-pressure)
11. [Source Index and Citations](#11-source-index-and-citations)

---

## 1. Introduction

Every production outage has a root cause, but the majority share a common precondition: the system was closer to its limits than anyone realized. Capacity planning is the discipline of making those limits visible, measurable, and actionable before they manifest as customer-facing incidents. It bridges the gap between the infrastructure you have today and the load your systems will face tomorrow.

Capacity planning is not a one-time exercise performed at launch. It is a continuous feedback loop — forecast demand, provision resources, validate under load, measure actual usage, adjust the forecast, repeat. Organizations that treat capacity as a static number discover their error during their highest-traffic event of the year. Organizations that treat it as a living process absorb those events without their customers ever noticing.

This module covers the full lifecycle: from forecasting the demand your systems will face, through choosing the right scaling strategy to meet that demand, to validating your plan with load testing and queueing theory. It is grounded in mathematics where mathematics applies (Little's Law, utilization curves, Holt-Winters smoothing) and in operational experience where formulas fall short (cooldown tuning, right-sizing cadences, the politics of headroom budgets).

**Who should read this module:**

- Site reliability engineers responsible for system availability under variable load
- Platform engineers designing autoscaling infrastructure
- Cloud architects making reserved capacity and instance family decisions
- Engineering managers who need to translate capacity plans into budget requests
- DevOps engineers building load testing pipelines

**What this module does not cover:**

- Application-level performance optimization (query tuning, algorithm complexity)
- Cost optimization as a primary goal (covered where it intersects capacity)
- Specific vendor pricing calculators or quota request procedures

---

## 2. Demand Forecasting

Capacity planning begins with a question: how much load will this system carry, and when? The answer is never a single number. It is a time series — a curve that rises and falls with user behavior, seasonal patterns, business events, and organic growth. Forecasting that curve is the foundation on which every other decision in this module rests.

### 2.1 Historical Trend Analysis

The simplest forecasting method is extrapolation from historical data. Collect time-series metrics (requests per second, active connections, CPU utilization, storage consumption) over a meaningful window — at minimum 12 months to capture annual seasonality — and fit a trend line.

**Linear regression** works when growth is steady and predictable. If your service has added 50,000 daily active users per month for the past year, linear extrapolation gives you a defensible 6-month projection. The formula is straightforward:

```
y(t) = a + bt
```

Where `a` is the intercept (baseline load), `b` is the slope (growth rate), and `t` is time. The weakness of linear regression is that it assumes constant growth. Viral products, successful marketing campaigns, and network effects all produce superlinear growth that linear models systematically underestimate.

**Exponential smoothing** addresses this by weighting recent observations more heavily than older ones. The simplest form (Simple Exponential Smoothing) updates its forecast with each new observation:

```
F(t+1) = alpha * Y(t) + (1 - alpha) * F(t)
```

Where `alpha` (0 < alpha < 1) controls how quickly the model adapts. Higher alpha values react faster to recent changes but are more sensitive to noise.

### 2.2 Seasonal Patterns

Most production systems exhibit multiple overlapping seasonal patterns: daily (traffic peaks in business hours), weekly (lower weekend traffic for B2B; higher for B2C), and annual (holiday shopping, tax season, back-to-school). A forecasting model that ignores seasonality will systematically over-provision during troughs and under-provision during peaks.

**Holt-Winters Exponential Smoothing** extends simple exponential smoothing with explicit trend and seasonal components. It uses three smoothing equations:

```
Level:    L(t) = alpha * (Y(t) / S(t-m)) + (1 - alpha) * (L(t-1) + T(t-1))
Trend:    T(t) = beta  * (L(t) - L(t-1))  + (1 - beta)  * T(t-1)
Season:   S(t) = gamma * (Y(t) / L(t))     + (1 - gamma) * S(t-m)
Forecast: F(t+h) = (L(t) + h * T(t)) * S(t - m + h mod m)
```

Where `m` is the seasonal period (e.g., 24 for hourly data with daily seasonality, 168 for hourly data with weekly seasonality), and `alpha`, `beta`, `gamma` are smoothing parameters for level, trend, and season respectively.

The multiplicative variant shown above handles seasonal amplitude that scales with the level — which is the common case in production systems. As your baseline grows, your peaks grow proportionally. The additive variant (replacing multiplication with addition) is appropriate when seasonal swings are constant regardless of level.

Recent research (2024-2025) has extended Holt-Winters to handle multiple seasonal periods simultaneously — daily and weekly patterns overlaid — which is directly applicable to cloud capacity forecasting where both patterns are present.

### 2.3 Event-Driven Demand

Seasonal models capture recurring patterns but not one-time events: product launches, marketing campaigns, Black Friday, the Super Bowl halftime show, a viral social media post. These require a different approach.

**Known events** (product launches, holidays, sales) should be modeled as multiplicative factors applied to the baseline forecast. If last year's Black Friday produced 4.2x normal traffic, plan for 5x this year (the extra margin accounts for growth and the possibility that this year's event outperforms last year's).

**Unknown events** (viral moments, breaking news, DDoS attacks) cannot be forecast. They are handled through headroom (Section 8) and autoscaling (Section 4). The capacity plan's job is not to predict the unpredictable but to ensure the system can absorb reasonable shocks while autoscaling catches up.

### 2.4 The Predict-vs-React Spectrum

Forecasting approaches exist on a spectrum:

| Approach | Latency | Cost Efficiency | Risk | Best For |
|----------|---------|-----------------|------|----------|
| Pure prediction (pre-provision) | Zero — capacity is already there | Low — you pay for idle resources during troughs | Over-provisioning waste | Latency-critical systems, databases, stateful services |
| Predictive + reactive | Low — pre-provisioned base with autoscale buffer | Medium — base is pre-provisioned, burst is elastic | Moderate — burst capacity has spin-up lag | Most production web services |
| Pure reactive (autoscale only) | High — cold-start penalty during ramp | High — pay only for what you use | Under-provisioning during ramp | Batch processing, async workloads, dev/staging |

Most production systems operate in the middle: a pre-provisioned baseline sized from the forecast, supplemented by autoscaling for demand that exceeds the baseline. The forecast determines the baseline; the autoscaler handles the variance.

### 2.5 Machine Learning Approaches

For systems with complex, multi-signal demand patterns, machine learning models (LSTM networks, Prophet, DeepAR) can capture nonlinear relationships that statistical methods miss. AWS Forecast (DeepAR) and Facebook Prophet are commonly deployed for infrastructure capacity forecasting.

The trade-off is interpretability. A Holt-Winters model tells you exactly why it predicted a spike (seasonal component peaked). A neural network gives you a number. For capacity planning — where the consequence of a wrong forecast is an outage — interpretability matters. Use ML models as a second opinion, not a replacement for models you can reason about.

---

## 3. Horizontal vs Vertical Scaling

Once you know how much capacity you need, the next question is how to provide it. The two fundamental strategies — scaling up (vertical) and scaling out (horizontal) — have different cost curves, failure modes, and operational requirements.

### 3.1 Trade-offs Table

| Dimension | Vertical Scaling (Scale Up) | Horizontal Scaling (Scale Out) |
|-----------|---------------------------|-------------------------------|
| **Mechanism** | Larger instance (more CPU, RAM, disk) | More instances of the same size |
| **Complexity** | Low — same architecture, bigger box | High — requires load balancing, state management, data partitioning |
| **Downtime** | Usually requires restart (live resize limited) | Zero — add nodes behind load balancer |
| **Ceiling** | Hard — largest available instance type | Soft — add nodes until network/coordination limits |
| **Cost curve** | Superlinear — 2x CPU costs >2x price | Linear to sublinear — bulk pricing, spot instances |
| **Failure blast radius** | Large — one big machine fails, everything fails | Small — one node fails, N-1 remain |
| **State handling** | Trivial — single machine, no distribution | Complex — requires shared state, sticky sessions, or stateless design |
| **Database suitability** | Good — databases love large memory and fast disks | Complex — requires replication, sharding, consensus protocols |

### 3.2 The "Scale Up First" Heuristic

A common and defensible heuristic: **scale up until you cannot, then scale out**. Vertical scaling preserves architectural simplicity. A single large instance running PostgreSQL is operationally simpler than a sharded cluster — fewer failure modes, simpler backups, no distributed transaction coordination, no cross-shard query planning.

The practical ceiling for vertical scaling in major clouds (as of 2026):

| Cloud | Instance Family | vCPUs | RAM | Use Case |
|-------|----------------|-------|-----|----------|
| AWS | u-24tb1.112xlarge | 448 | 24 TB | In-memory databases |
| AWS | m7i.48xlarge | 192 | 768 GB | General-purpose workloads |
| GCP | m3-megamem-128 | 128 | 1,952 GB | Memory-intensive analytics |
| Azure | M416ms_v2 | 416 | 11,400 GB | SAP HANA, large databases |

These are large machines. Many organizations reach their growth plateau before exhausting vertical headroom. The decision to scale out should be driven by actual need (hitting the ceiling, requiring fault tolerance across zones, needing geo-distribution) rather than premature architectural anxiety.

### 3.3 Stateful vs Stateless Scaling

The critical variable in horizontal scaling is state. Stateless services (API gateways, compute workers, web frontends) scale horizontally with near-zero coordination cost — add a node, register it with the load balancer, done. Each request can land on any node because no node holds unique data.

Stateful services (databases, caches, message brokers, session stores) require explicit strategies:

**Read replicas** — The simplest form of database horizontal scaling. Write traffic goes to a primary; read traffic is distributed across replicas. Effective when read-to-write ratio is high (10:1 or more). Does not help with write-heavy workloads.

**Sharding** — Partitioning data across multiple independent database instances, each holding a subset of the total dataset. The partition key (user ID, tenant ID, geographic region) determines which shard holds a given record. Eliminates the single-writer bottleneck but introduces cross-shard query complexity and rebalancing challenges.

**Vitess** — A CNCF-graduated project that adds a transparent sharding layer to MySQL. It handles query routing, connection pooling, and online resharding. Vitess powers some of the largest MySQL deployments in the world, including YouTube and Slack. Its key value proposition: you can start with a single unsharded MySQL database and add sharding later without rewriting application code, because Vitess sits between your application and the database, intercepting and routing queries. Resharding (splitting or merging shards) operates with near-zero downtime through an atomic cutover step.

**CockroachDB and TiDB** — NewSQL databases that provide horizontal scaling with ACID transactions natively, without an external sharding layer. They trade single-node performance for distributed consistency. Appropriate when you need both horizontal scale and strong consistency without managing a sharding layer yourself.

---

## 4. Autoscaling Patterns

Autoscaling is the operational implementation of elastic capacity. Rather than pre-provisioning for peak, you define rules that add or remove capacity in response to demand signals. The devil, as always, is in the configuration details.

### 4.1 Reactive Autoscaling (Threshold-Based)

The simplest and most widely deployed pattern. Define a metric, a target threshold, and scaling actions:

```
IF average_cpu_utilization > 70% for 3 minutes THEN add 2 instances
IF average_cpu_utilization < 30% for 10 minutes THEN remove 1 instance
```

**AWS Auto Scaling Groups** implement this with target tracking policies (maintain a metric at a target value) and step scaling policies (take specific actions at specific thresholds). Target tracking is preferred for most workloads because it automatically adjusts the scaling magnitude based on how far the metric deviates from the target.

**Kubernetes Horizontal Pod Autoscaler (HPA)** scales pod replicas based on CPU utilization, memory utilization, or custom metrics. The HPA controller checks metrics every 15 seconds by default, calculates the desired replica count, and adjusts:

```
desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))
```

### 4.2 Predictive Autoscaling

Reactive scaling has an inherent lag: the system must become overloaded before new capacity is provisioned, and provisioning itself takes time (seconds for containers, minutes for VMs). Predictive scaling eliminates this lag by analyzing historical patterns and pre-provisioning capacity before the predicted load arrives.

**AWS Predictive Scaling** analyzes 14 days of CloudWatch metric history to detect daily and weekly patterns, then generates 48-hour capacity forecasts. It requires at minimum 24 hours of metric history before generating its first forecast. Best practice: run in forecast-only mode initially to validate predictions against actual load before enabling automatic scaling.

**Kubernetes KEDA (Kubernetes Event-Driven Autoscaling)** extends HPA with event-driven scaling from external sources. Where HPA polls metrics on a fixed interval, KEDA can scale based on message queue depth (Kafka, RabbitMQ, SQS), database query results, Prometheus metrics, cron schedules, and dozens of other event sources via its scaler architecture.

KEDA's distinguishing capability is **scale-to-zero**: unlike standard HPA (which has a minimum of 1 replica), KEDA can scale workloads to zero pods when no events are pending, then spin up from zero when events arrive. This is particularly valuable for event-driven microservices and batch processors that should not consume resources when idle.

### 4.3 Custom Metric Scaling

CPU and memory are poor proxies for many workloads. A video transcoding service may be CPU-bound; an API gateway may be limited by concurrent connections; a message consumer may be bound by queue depth. Scaling on the wrong metric produces capacity that does not address the actual bottleneck.

Custom metrics to consider:

| Workload Type | Effective Scaling Metric | Why |
|---------------|------------------------|-----|
| API service | Request latency (p99) | Latency rises before CPU saturates |
| Message consumer | Queue depth / consumer lag | Direct measure of backlog |
| WebSocket server | Active connections | Connection count drives memory, not CPU |
| ML inference | GPU utilization / inference queue depth | CPU is irrelevant for GPU-bound work |
| Database proxy | Active connection count | Connection exhaustion crashes the proxy |

KEDA's integration with OpenTelemetry (documented in early 2026) enables scaling based on any metric your application exports via OTLP, routed through Prometheus. This eliminates the need for the Prometheus Adapter that HPA requires for custom metrics.

### 4.4 Vertical Pod Autoscaler (VPA)

Where HPA adjusts the number of replicas, VPA adjusts the resource requests and limits of individual pods. It observes actual CPU and memory consumption over time and recommends (or automatically applies) updated resource requests.

VPA operates in three modes:

| Mode | Behavior | Production Safety |
|------|----------|-------------------|
| **Off** | Generates recommendations only (visible via `kubectl describe vpa`) | Safe — no changes applied |
| **Initial** | Sets resources on pod creation only, does not evict running pods | Safe — no disruption |
| **Auto** | Evicts and recreates pods with updated resources | Risky — causes restarts |

**Critical warning:** Do not run VPA in Auto mode alongside HPA when both are scaling on CPU or memory. VPA will resize pods (reducing their resource requests), which causes HPA to add more replicas (because the smaller pods are now at higher utilization), creating an oscillation loop. Run VPA in recommendation mode and use its output to inform periodic manual adjustments.

### 4.5 Autoscaling Anti-Patterns

**Thrashing (flapping).** The autoscaler adds capacity, load drops (because the new capacity absorbed it), the autoscaler removes capacity, load rises again. Fix: implement asymmetric scaling — scale up aggressively (short evaluation period, add multiple instances) and scale down conservatively (longer evaluation period, remove one instance at a time). AWS calls this the "cooldown period." Kubernetes achieves it through the `--horizontal-pod-autoscaler-downscale-stabilization` flag (default: 5 minutes).

**Scaling on the wrong metric.** Scaling on CPU for an I/O-bound workload adds CPU that sits idle while the actual bottleneck (disk, network, database connections) remains unchanged. Always identify the binding constraint before choosing a scaling metric.

**Scaling into a bottleneck.** Adding more web servers when the database is the bottleneck just moves the queuing from the load balancer to the database connection pool. Autoscaling must be configured at every layer in the stack, or the slowest layer becomes the ceiling regardless of how much capacity the other layers have.

**Ignoring cold-start cost.** A Java service that takes 45 seconds to warm up is not ready to serve traffic when the autoscaler says it is ready. Use readiness probes, warm-up periods, and pre-warmed pools to ensure new instances are genuinely ready before receiving traffic.

---

## 5. Load Testing for Capacity

A capacity plan is a hypothesis. Load testing is the experiment that validates or refutes it. Without load testing, you are operating on faith — faith that your forecasts are accurate, that your autoscaling rules trigger correctly, that your database can handle the projected connection count. Faith is not an engineering strategy.

### 5.1 Load Testing Tools

| Tool | Language | Protocol Support | Scripting | Distribution | Best For |
|------|----------|-----------------|-----------|-------------|----------|
| **k6** | Go (JS/TS scripts) | HTTP, WebSocket, gRPC, Browser | JavaScript / TypeScript | Native distributed | Developer-first teams, CI/CD integration |
| **Locust** | Python | HTTP (extensible) | Python | Native distributed | Python teams, custom protocol testing |
| **Gatling** | Scala/Java | HTTP, WebSocket, JMS | Scala DSL | Native distributed | High-volume HTTP, JVM shops |
| **JMeter** | Java | HTTP, JDBC, LDAP, FTP, JMS | GUI + XML | Plugin-based | Multi-protocol, legacy systems |

**k6** reached v1.0 in May 2025, graduating its browser, gRPC, and crypto modules from experimental to stable. It is now the most widely adopted open-source load testing tool by community metrics (29,900+ GitHub stars as of early 2026). Its native TypeScript support (without transpilation) and Grafana Cloud integration make it the default choice for teams that are not already invested in another tool.

**Locust** excels when test scenarios require complex, stateful user behavior that is easier to express in Python than in JavaScript. Its distributed mode allows scaling to millions of simulated users across multiple machines.

**Gatling** uses an event-driven engine that generates massive user loads efficiently from a single machine — important when load generation infrastructure is a constraint. Its Scala DSL produces readable test scenarios but requires JVM familiarity.

**JMeter** remains the most flexible in protocol support but suffers from GUI-centric design that hinders version control and CI/CD integration. Its thread-per-user model is less efficient than the event-driven approaches used by k6 and Gatling.

### 5.2 Load Test Design Patterns

A single load test run tells you nothing. Capacity validation requires multiple test types, each answering a different question:

**Ramp-up test.** Gradually increase load from zero to target over 10-30 minutes. Answers: at what load level do latency percentiles begin to degrade? This identifies the system's linear scaling region and the point where queueing effects begin.

**Steady-state test.** Hold constant load at the expected peak for an extended period (30-60 minutes minimum). Answers: does the system remain stable under sustained load, or do resource leaks, connection pool exhaustion, or garbage collection pauses cause progressive degradation?

**Spike test.** Instantly jump from baseline to 3-5x normal load, hold for 5-10 minutes, then drop back. Answers: can the autoscaler respond quickly enough? Does the system recover gracefully, or does the spike trigger cascading failures (connection timeouts, retry storms, queue buildup)?

**Soak test.** Run at moderate load (50-70% of peak capacity) for 8-24 hours. Answers: are there slow resource leaks (memory, file descriptors, database connections) that only manifest over extended periods? Soak tests catch the bugs that ramp-up and spike tests miss.

### 5.3 Interpreting Results

Three points on the load-latency curve matter:

```
Latency
  |
  |                                    * Breaking point
  |                               *
  |                          *
  |                     *  <-- Saturation point
  |                *
  |           *
  |       *  <-- Knee of the curve
  |   * *
  | * *
  +--*--*---*---*---*---*---*---*---*--> Load
```

**Knee of the curve.** The load level where latency begins to rise noticeably above baseline. Below the knee, adding load has minimal impact on response time. Above the knee, each additional request contributes disproportionately to latency because queueing effects dominate. This is your efficient operating range.

**Saturation point.** The load level where throughput plateaus — adding more requests does not increase the rate of completed requests. The system is fully utilized; all additional requests queue.

**Breaking point.** The load level where the system fails — errors spike, connections are refused, processes crash, or cascading timeouts propagate. The gap between the saturation point and the breaking point is your safety margin.

A well-designed capacity plan operates at or below the knee, with autoscaling to handle transients up to the saturation point, and headroom between saturation and breaking point to absorb the unexpected.

### 5.4 Load Testing in Production

Staging environments lie. They have different hardware, different data volumes, different network topologies, and different cache hit rates. The most accurate load test is one that runs against production infrastructure.

**Shadow traffic (dark traffic).** Mirror a copy of production traffic to a shadow deployment that processes the requests but discards the responses. The shadow deployment receives realistic traffic patterns without affecting real users. Works well for read-heavy services; complex for write operations (you must ensure shadow writes do not mutate production data).

**Canary load testing.** Route a small percentage of production traffic to a canary deployment running under artificial additional load. Compare canary latency and error rates against the baseline deployment.

**Synthetic injection.** Generate synthetic requests alongside real traffic, tagged so they can be filtered from business metrics. The synthetic requests exercise specific code paths (heavy queries, large payloads, edge cases) at controlled rates.

---

## 6. Resource Right-Sizing

Over-provisioning wastes money. Under-provisioning causes outages. Right-sizing is the continuous process of matching resource allocation to actual resource consumption — not at a point in time, but across the full demand cycle.

### 6.1 The Right-Sizing Problem

Most container workloads are over-provisioned. Engineers set resource requests and limits based on guesses, copy-paste from templates, or worst-case estimates from a load test they ran once. Over time, these values drift further from reality as code changes, traffic patterns shift, and the original engineer who set the values leaves the team.

The cost of over-provisioning is real: Kubernetes schedules pods based on resource requests. If a pod requests 2 CPU cores but consistently uses 0.3, the remaining 1.7 cores are reserved but wasted — no other pod can use them. Multiply by hundreds of pods and the waste is substantial.

The cost of under-provisioning is worse: OOM kills, CPU throttling, degraded latency, and in the worst case, cascading failures as unhealthy pods are restarted and then immediately OOM-killed again.

### 6.2 Right-Sizing Tools

**Kubernetes VPA (Vertical Pod Autoscaler)** in recommendation mode observes actual pod resource consumption over time and generates target, lower-bound, and upper-bound recommendations for CPU and memory requests. Run it in `Off` mode to collect data without making changes.

**Goldilocks** (Fairwinds) wraps VPA in a user-friendly dashboard. It creates VPA objects for every deployment in labeled namespaces, collects recommendations, and presents them in a web UI organized by namespace and deployment. It provides recommendations for both Guaranteed QoS (set requests = limits = target) and Burstable QoS (set requests = lower bound, limits = upper bound). Organizations implementing Goldilocks typically report 30-50% cost reduction on previously over-provisioned workloads.

**Cloud provider advisor tools:**

| Provider | Tool | Coverage |
|----------|------|----------|
| AWS | Compute Optimizer | EC2, EBS, Lambda, ECS on Fargate |
| AWS | Cost Explorer Right Sizing | EC2 instances |
| GCP | Recommender | Compute Engine, GKE |
| Azure | Advisor | VMs, App Service, AKS |

### 6.3 Container Requests vs Limits

Understanding the Kubernetes resource model is essential for right-sizing:

**Requests** define the guaranteed minimum resources a pod receives. The scheduler uses requests to decide which node a pod fits on. If a pod requests 500m CPU and 256Mi memory, it is guaranteed at least that much, and the scheduler will not place it on a node that cannot provide it.

**Limits** define the maximum resources a pod is allowed to use. CPU limits cause throttling (the pod is slowed down). Memory limits cause OOM kills (the pod is terminated).

**The right-sizing strategy:**

```
Requests = P50 of actual usage + 20% buffer
Limits   = P99 of actual usage + 30% buffer (memory)
Limits   = No limit or generous limit (CPU — throttling is usually worse than sharing)
```

Setting CPU limits is controversial. Google's internal guidance and many SRE teams recommend no CPU limits at all — only CPU requests. The reasoning: CPU is a compressible resource. If a pod exceeds its CPU request, it borrows idle CPU from other pods on the same node. If the node is fully loaded, all pods are throttled proportionally to their requests. CPU limits, by contrast, throttle a pod even when the node has idle CPU available, which is pure waste.

Memory limits should always be set. Memory is incompressible — you cannot borrow memory and give it back. An unbounded pod that leaks memory will eventually OOM-kill other pods on the same node.

### 6.4 Right-Sizing Cadence

Right-sizing is not a one-time project. Establish a cadence:

| Frequency | Action |
|-----------|--------|
| Continuously | VPA in recommendation mode collects data |
| Weekly | Review Goldilocks dashboard for large deviations (>2x over-provisioned) |
| Monthly | Apply right-sizing changes to non-critical workloads |
| Quarterly | Right-size all workloads; update resource templates for new deployments |
| After major releases | Re-evaluate — code changes may alter resource profiles significantly |

---

## 7. Queue Theory for Operations

Queueing theory provides the mathematical foundation for understanding why systems degrade non-linearly under load. The formulas are simple. The intuition they provide is worth more than any monitoring dashboard.

### 7.1 Little's Law

Published by MIT professor John Little in 1961, Little's Law is the most broadly applicable result in queueing theory. It holds for any stable system, regardless of the arrival distribution, service distribution, or number of servers:

```
L = lambda * W
```

Where:
- **L** = average number of items in the system (in-flight requests, jobs in queue, WIP)
- **lambda** = average arrival rate (requests per second, jobs per minute)
- **W** = average time an item spends in the system (latency, cycle time)

The law's power is that any two of the three variables determine the third:

| Known | Unknown | Formula | Application |
|-------|---------|---------|-------------|
| lambda, W | L | L = lambda * W | How many connections does your database connection pool need? |
| L, W | lambda | lambda = L / W | What throughput can your system sustain with current concurrency? |
| L, lambda | W | W = L / lambda | What latency should you expect at current concurrency and throughput? |

**Example: Database connection pool sizing.**
Your API processes 500 requests/second (lambda = 500). Each database query takes an average of 20ms (W = 0.02s). By Little's Law, L = 500 * 0.02 = 10 connections needed on average. Size your pool to 10 connections for average load, with headroom for variance — a pool of 20-30 handles bursts without exhaustion.

**Example: Kubernetes pod count estimation.**
Your service handles 2,000 requests/second. Each request takes 100ms to process. Each pod can handle 50 concurrent requests. L = 2000 * 0.1 = 200 concurrent requests. You need 200 / 50 = 4 pods minimum. Add headroom: 6-8 pods for production.

### 7.2 Utilization vs Latency: The Hockey Stick Curve

The most important graph in capacity planning is the utilization-latency curve. For an M/M/1 queue (Poisson arrivals, exponential service times, single server), the average response time is:

```
W = 1 / (mu - lambda)
```

Where `mu` is the service rate. Expressed in terms of utilization (rho = lambda / mu):

```
W = (1 / mu) * (1 / (1 - rho))
```

The term `1 / (1 - rho)` is the amplification factor. As utilization approaches 100%, response time approaches infinity:

| Utilization (rho) | Amplification Factor | Effect |
|--------------------|---------------------|--------|
| 10% | 1.11x | Negligible queueing |
| 30% | 1.43x | Minimal queueing |
| 50% | 2.0x | Latency doubled vs unloaded |
| 70% | 3.33x | Noticeable degradation |
| 80% | 5.0x | Significant queueing |
| 90% | 10.0x | Severe degradation |
| 95% | 20.0x | System is drowning |
| 99% | 100.0x | Effectively unusable |

This is the "hockey stick curve." Latency is relatively flat up to about 60-70% utilization, then rises sharply. By 85%, latency is climbing fast enough that users notice. By 95%, the system is effectively saturated.

### 7.3 Why 70% Is the Practical Limit

The 70% heuristic is not arbitrary. Mathematical optimization of the M/M/1 queue — balancing the cost of idle resources against the cost of queueing delay — yields an optimal utilization of approximately 71.5%. In practice:

- **Below 70%:** The system absorbs traffic spikes, failover events (losing one of N servers increases load on the remaining N-1), and retry storms without latency degradation.
- **70-85%:** Manageable but fragile. A 20% traffic spike pushes you past 90%, where the hockey stick curve bites.
- **Above 85%:** You are one bad deploy, one retry storm, or one node failure away from cascading latency degradation.

The 70% number applies to the binding constraint — whatever resource saturates first. For a CPU-bound service, keep CPU at 70%. For a memory-bound service, keep memory at 70%. For a database, keep connection utilization at 70%. Monitoring the wrong resource at 70% while the actual bottleneck runs at 95% gives you a false sense of security.

### 7.4 Applying Queue Theory in Practice

**API gateways.** Model each gateway instance as a queue. lambda = inbound request rate. mu = maximum request processing rate (determined by load testing). Keep rho below 70%. If rho exceeds the threshold, autoscaling should add gateway instances.

**Message queues (Kafka, RabbitMQ, SQS).** Monitor consumer lag — the growing gap between produced and consumed messages. By Little's Law, if the queue depth (L) is growing while consumer processing time (W) is constant, then the effective arrival rate (lambda) exceeds consumer throughput. Add consumers.

**Database connection pools.** Size the pool using Little's Law (Section 7.1). Monitor pool utilization. If connection wait time appears in your latency percentiles, the pool is undersized relative to demand. But do not blindly increase pool size — each connection consumes database server memory and CPU for context switching. The database itself is a queue with its own utilization curve.

---

## 8. Headroom Planning

Headroom is the intentional gap between your current capacity and the maximum your infrastructure can deliver. It is insurance against the forecast being wrong, the autoscaler being slow, or the unexpected happening. The question is never whether to have headroom — it is how much, and where.

### 8.1 Safety Margins

A safety margin accounts for forecast error, measurement uncertainty, and the time required for corrective action (spinning up new instances, failover to a secondary region, emergency capacity procurement).

**Recommended baseline margins:**

| System Type | Minimum Headroom | Rationale |
|-------------|-----------------|-----------|
| Stateless web services | 30% above forecast peak | Autoscaling can compensate; margin covers ramp lag |
| Databases (primary) | 50% above forecast peak | Cannot autoscale quickly; vertical scaling requires restart |
| Message queues (brokers) | 40% above forecast peak | Broker failure causes data loss without sufficient replicas |
| Storage | 25% above projected growth + 6 months runway | Storage cannot be reclaimed quickly; growth is monotonic |
| Network bandwidth | 40% above peak measured | Network congestion degrades everything simultaneously |

### 8.2 Peak-to-Average Ratios

The peak-to-average ratio (PAR) of your traffic determines how much headroom you need above average utilization. A service with a PAR of 2.0 sees peak traffic at 2x the daily average. If you provision for average, peaks will saturate the system.

```
Required capacity = Average load * PAR * (1 + safety margin)
```

Example: Average load is 10,000 RPS. PAR is 2.5 (lunchtime peak). Safety margin is 30%. Required capacity = 10,000 * 2.5 * 1.3 = 32,500 RPS.

Typical PARs by domain:

| Domain | Typical PAR | Driver |
|--------|-------------|--------|
| B2B SaaS | 1.5-2.5 | Business hours concentration |
| E-commerce | 2.0-4.0 (normal), 8.0-15.0 (Black Friday) | Shopping patterns, sales events |
| Social media | 2.0-3.0 (normal), 5.0-10.0 (viral events) | Time-of-day, breaking news |
| Gaming | 3.0-5.0 | Evening hours, content drops |
| Financial services | 2.0-4.0 | Market open, settlement windows |

### 8.3 N+1 and N+2 Redundancy

Headroom is not only about traffic. It is about failure resilience. The N+M model defines how many component failures your system can absorb without degradation:

**N+0:** No redundancy. Every component is necessary. Any single failure causes an outage. Unacceptable for production.

**N+1:** One spare. The system can lose any single component and continue operating at full capacity. The standard minimum for production services. If you run 4 instances to handle peak load, you deploy 5 — the fifth absorbs the traffic if any one of the other four fails.

**N+2:** Two spares. The system survives two simultaneous failures — such as an instance failure during a rolling deployment (where one instance is already out of rotation). Standard for critical services. If you need 4 instances for peak, deploy 6.

**2N:** Full duplication. Every component has a dedicated standby. Common for power and network infrastructure (dual power supplies, dual network paths), less common for compute (cost is double).

The choice depends on the blast radius and recovery time:

| Recovery Time | Recommended Model | Reason |
|---------------|-------------------|--------|
| Seconds (autoscaling/container restart) | N+1 | Fast recovery limits exposure |
| Minutes (VM provisioning) | N+2 | Need buffer during longer recovery |
| Hours (hardware replacement) | 2N or N+2 with geographic distribution | Extended exposure demands more margin |

### 8.4 Regional Capacity Distribution

For globally distributed systems, headroom must be planned regionally. A common failure mode: three regions each running at 50% utilization. One region fails. The remaining two regions must absorb 50% more traffic each, pushing them to 75%. If one of the remaining regions then experiences partial degradation, the last healthy region goes to 100% and the hockey stick curve (Section 7.2) destroys latency.

**The rule:** If you operate in N regions, each region must be able to handle at least 1/(N-1) of total traffic, not 1/N. For three regions, each must handle 50% of total traffic (not 33%). For two regions, each must handle 100%.

---

## 9. Cloud-Specific Capacity

Cloud providers offer financial instruments that trade commitment for discount. These instruments are capacity planning decisions with billing consequences.

### 9.1 Commitment Models

| Provider | Instrument | Discount | Commitment | Flexibility |
|----------|-----------|----------|------------|-------------|
| AWS | Savings Plans (Compute) | Up to 72% | 1 or 3 year | Any instance family, size, OS, region |
| AWS | Reserved Instances | Up to 72% | 1 or 3 year | Specific instance type and region |
| AWS | Capacity Reservations | 0% (pay on-demand rate) | None | Guarantees capacity in a specific AZ |
| GCP | Committed Use Discounts (CUD) | Up to 57% | 1 or 3 year | Specific machine family and region |
| GCP | Flex CUDs | Up to 46% | 1 year | Can cancel after 1 year |
| Azure | Reserved Instances | Up to 72% | 1 or 3 year | Specific VM series and region |
| Azure | Savings Plans | Up to 65% | 1 or 3 year | Any VM family, size, region |

**Strategy:** Cover your baseline (the minimum capacity you will always need) with commitments. Cover your peak-minus-baseline with on-demand and spot/preemptible instances. This minimizes cost while maintaining the flexibility to scale.

### 9.2 Spot and Preemptible Instances

Spot instances (AWS), preemptible VMs (GCP), and spot VMs (Azure) offer 60-90% discounts in exchange for the cloud provider's right to reclaim them with minimal notice (2 minutes on AWS, 30 seconds on GCP).

**Appropriate for:**
- Stateless compute workers that can be interrupted and restarted
- Batch processing jobs with checkpointing
- CI/CD build agents
- Load testing infrastructure
- Non-critical data processing pipelines

**Not appropriate for:**
- Databases or any stateful service
- User-facing services where a 2-minute interruption causes errors
- Single-instance deployments with no redundancy

**AWS Spot best practices (2025-2026):**
- Use capacity-optimized allocation strategy, which launches into pools least likely to be interrupted
- Diversify across multiple instance types and availability zones
- Implement graceful shutdown handlers that checkpoint work within the 2-minute reclamation notice
- Mix spot with on-demand in Auto Scaling Groups using mixed instance policies

### 9.3 Multi-Cloud Capacity Arbitrage

Running workloads across multiple cloud providers to exploit pricing differences is theoretically attractive and operationally expensive. The networking costs, operational complexity, and engineering overhead of maintaining deployments across AWS, GCP, and Azure typically exceed the savings from price arbitrage.

Where multi-cloud does provide capacity value:
- **Burst capacity during cloud-specific shortages.** GPU instances on AWS are frequently unavailable; GCP may have capacity, and vice versa.
- **Geographic coverage.** AWS has more regions than GCP; GCP has better pricing in some regions.
- **Vendor risk mitigation.** A single cloud provider outage should not take down your entire service — but this requires genuine multi-cloud architecture, not just accounts on multiple providers.

---

## 10. Case Studies: Scaling Under Pressure

### 10.1 Twitter: The Fail Whale

Between 2007 and 2010, Twitter's "Fail Whale" error page became an internet symbol of scaling failure. The root cause was architectural: Twitter's monolithic Ruby on Rails application used a fan-out-on-write model where each tweet was pushed to every follower's timeline in real time. A celebrity tweet (Oprah, with millions of followers) triggered millions of write operations simultaneously, overwhelming the system.

**Lessons applied:**
- Twitter migrated from Ruby to JVM languages (Scala, Java) for throughput
- Decomposed the monolith into services: timeline service, tweet storage, user graph
- Implemented tiered service degradation — during peak events, non-core services automatically forfeit capacity to ensure the core timeline experience
- Built custom infrastructure (Manhattan distributed database, Finagle RPC framework) when off-the-shelf tools did not scale

The capacity planning lesson: **fan-out amplification turns one request into N**. If N is unbounded (follower counts vary by six orders of magnitude), you cannot capacity plan for the worst case with a fixed pool. You need either rate limiting on the write path or async fan-out that decouples the write from the delivery.

### 10.2 Discord: From Billions to Trillions

Discord's message storage grew from billions to trillions between 2017 and 2023. Their original Cassandra cluster grew from 12 to 177 nodes, with escalating operational pain: unpredictable latency from GC pauses, falling behind on compactions (requiring a manual "gossip dance" — taking nodes out of rotation to compact without traffic), and hot partition problems in channels with millions of messages.

In 2023, Discord migrated trillions of messages from Cassandra to ScyllaDB (a C++ rewrite of Cassandra that eliminates JVM GC pauses). The migration achieved:
- 177 Cassandra nodes reduced to 72 ScyllaDB nodes
- p99 read latency reduced from 40-125ms to 15ms
- p99 write latency stabilized at 5ms (down from 5-70ms on Cassandra)
- Migration throughput of 3.2 million messages per second, completing in 9 days

They also introduced a Rust-based data services layer that absorbs hot-partition traffic, routing requests through gRPC.

The capacity planning lesson: **choose your database for your scale trajectory, not your current scale.** Discord's Cassandra cluster worked at billions of messages. The operational overhead of maintaining it at trillions was unsustainable. The migration cost was high, but the alternative was an indefinite operational tax that grew with every message stored.

### 10.3 Slack: Cellular Architecture

Slack's architectural evolution from 2023-2024 demonstrates capacity planning for reliability, not just throughput. Their migration from a monolithic to cell-based architecture was triggered by gray failures — partial networking outages in a single availability zone that were difficult to detect and mitigate.

The cellular architecture isolates failure domains. Each cell is a self-contained deployment that handles a subset of workspaces. A failure in one cell affects only the workspaces assigned to that cell. Traffic can be drained from an affected cell within 5 minutes, limiting blast radius.

The capacity planning lesson: **capacity is not just about total throughput — it is about failure isolation.** A 1000-RPS system in a single cell has different failure properties than ten 100-RPS cells, even though total capacity is identical. The cellular model requires more total capacity (each cell needs its own headroom) but delivers better availability because failures are contained.

---

## 11. Source Index and Citations

### Primary Sources

1. Little, J.D.C. "A Proof for the Queuing Formula: L = lambda W." *Operations Research*, 9(3), 1961.
2. Hyndman, R.J. and Athanasopoulos, G. "Forecasting: Principles and Practice," 2nd edition. Section 7.3: Holt-Winters' seasonal method.
3. Discord Engineering. "How Discord Stores Trillions of Messages." Discord Blog, 2023.
4. Slack Engineering. "Slack's Migration to a Cellular Architecture." Slack Engineering Blog, 2024.
5. AWS Documentation. "Predictive scaling for Amazon EC2 Auto Scaling." Amazon Web Services, 2025.
6. KEDA Project. "Kubernetes Event-Driven Autoscaling." keda.sh, CNCF, 2025-2026.
7. Grafana Labs. "k6 v1.0 Release." k6.io, May 2025.
8. Fairwinds. "Goldilocks: Resource Recommendations for Kubernetes." GitHub/fairwinds-ops.
9. Vitess Project. "Vitess: Scalable MySQL-compatible Database." vitess.io, CNCF Graduated.
10. X Engineering (formerly Twitter). "The Infrastructure Behind Twitter: Efficiency and Optimization." engineering.twitter.com, 2016.
11. Plenz, C. "How to trade off server utilization and tail latency." SREcon 2019, USENIX.
12. Slack Engineering. "Unified Grid: How We Re-Architected Slack for Our Largest Customers." Slack Engineering Blog, 2023.
