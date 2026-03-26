# Interconnect Topologies

> **Domain:** Network Architecture
> **Module:** 2 -- Interconnect Topologies
> **Through-line:** *The topology is the architecture. Fat-tree, dragonfly, torus -- each is a different answer to the question: how do we connect N nodes so that the communication patterns of our workloads achieve maximum throughput at minimum cost?*

---

## Table of Contents

1. [Why Topology Matters](#1-why-topology-matters)
2. [Fat-Tree (Clos) Networks](#2-fat-tree-clos-networks)
3. [Dragonfly and Dragonfly+](#3-dragonfly-and-dragonfly)
4. [Torus and Mesh](#4-torus-and-mesh)
5. [HyperX and Slim Fly](#5-hyperx-and-slim-fly)
6. [Topology Selection Framework](#6-topology-selection-framework)
7. [Routing Algorithms](#7-routing-algorithms)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. Why Topology Matters

The network topology determines the fundamental performance envelope of a cluster. Two systems with identical compute nodes but different interconnect topologies can differ by 2-5x in application-level throughput for communication-intensive workloads [1][2].

Key topology metrics:
- **Diameter:** Maximum number of hops between any two nodes (affects worst-case latency)
- **Bisection bandwidth:** Aggregate bandwidth between any two equal halves of the network (affects worst-case throughput)
- **Cost:** Number of switches, ports, and cables required
- **Fault tolerance:** How many link/switch failures the network can absorb

---

## 2. Fat-Tree (Clos) Networks

The fat-tree topology, based on Charles Clos's 1953 switching network design, is a hierarchical architecture providing full bisection bandwidth [1][2]:

### 2.1 Architecture

A three-tier fat-tree consists of:
- **Leaf (ToR) switches:** Connect directly to compute nodes
- **Spine switches:** Connect leaf switches within a pod
- **Core switches:** Connect pods together

NVIDIA's DGX SuperPOD reference architecture specifies a three-tier fat-tree using Quantum-2 InfiniBand switches at 400 Gbps per port, connecting up to 32 DGX systems [2].

### 2.2 Strengths

- Full bisection bandwidth -- predictable performance regardless of which node pairs communicate
- Well-understood routing (D-mod-k static routing distributes traffic effectively)
- Mature vendor support and established deployment practices
- Excellent for unpredictable traffic patterns (AI training where communication shifts dynamically)

### 2.3 Weaknesses

- High cost at large scale due to many switches and links at upper tiers
- Cable complexity increases rapidly with scale
- Relatively high power consumption from switch count

---

## 3. Dragonfly and Dragonfly+

The dragonfly topology (Kim et al., 2008) is a two-tier hierarchical network where routers form groups interconnected as a complete graph [3]:

### 3.1 Architecture

Each group provides at least one link to every other group, achieving a network diameter of just three hops while minimizing expensive long-range optical links. The dragonfly effectively leverages high-radix routers to scale to very high node counts [3].

### 3.2 Dragonfly+ Extension

Dragonfly+ uses fat-tree sub-topologies within each group rather than a full mesh, improving scalability and worst-case throughput. HPE's Cray EX systems use 64-port Slingshot switches in two-level dragonfly topologies [3][4].

### 3.3 Real-World Deployment

The three most powerful TOP500 systems (El Capitan, Frontier, Aurora) all use Slingshot-11 interconnect in dragonfly-family topologies. Slingshot powers approximately 71% of aggregate compute capacity among the world's top 10 systems [4].

### 3.4 Challenges

Adversarial traffic patterns can saturate inter-group links, requiring adaptive routing between minimal and non-minimal paths. Research into buffer architectures and congestion detection continues to address fairness and tail-latency [3].

---

## 4. Torus and Mesh

In a k-ary n-cube mesh, each switch connects to its direct neighbors -- four connections in 2D, six in 3D. A torus adds wraparound links at mesh boundaries [5]:

### 4.1 Characteristics

- **Cost:** Lowest of any topology per node (fixed degree regardless of network size)
- **Locality:** Excellent for nearest-neighbor communication patterns (stencil codes, lattice QCD)
- **Blocking:** Limited bisection bandwidth means cross-network traffic suffers
- **Latency:** Diameter grows as O(N^(1/d)), making large torus networks slow for random traffic

### 4.2 Google TPU v4

Google's TPU v4 pods use 3D torus topologies with optical reconfigurability, allowing the torus dimensions to be reshaped for different workload communication patterns [5].

---

## 5. HyperX and Slim Fly

### 5.1 HyperX

HyperX topologies generalize the concept by providing full connectivity within each dimension. Each dimension is a complete graph, minimizing diameter while maintaining cost effectiveness for medium-scale clusters [6].

### 5.2 Slim Fly

Slim Fly (Besta et al., 2014) uses mathematical constructions (Moore graphs, projective planes) to minimize diameter while maintaining cost effectiveness. Achieves diameter 2 with fewer switches than a comparable fat-tree [6].

---

## 6. Topology Selection Framework

| Topology | Diameter | Bisection BW | Cost per Node | Best For |
|----------|----------|-------------|--------------|---------|
| Fat-tree | O(log N) | Full | High | Unpredictable traffic, GPU training |
| Dragonfly | 3 hops | High | Medium | Large scale, mixed workloads |
| Torus | O(N^(1/d)) | Low | Low | Stencil/neighbor communication |
| HyperX | 2-3 hops | Tunable | Medium | Balanced workloads |
| Slim Fly | 2 hops | High | Medium | Latency-sensitive, research |

### 6.1 GSD Cluster Relevance

For a 10-node mesh cluster (the GSD target), the topology decision space is simpler: at this scale, a single Ethernet switch creates a de facto fat-tree with full bisection bandwidth. The topology research becomes relevant for understanding how the cluster's communication patterns would scale, and for making principled decisions about future expansion [2].

---

## 7. Routing Algorithms

### 7.1 Static vs. Adaptive

- **Static routing** (D-mod-k): Deterministic path assignment based on destination. Simple, predictable, no route computation overhead. Works well for fat-trees with uniform traffic
- **Adaptive routing:** Selects paths dynamically based on congestion signals. Essential for dragonfly topologies where adversarial traffic patterns can create hotspots

### 7.2 Minimal vs. Non-Minimal

- **Minimal routing:** Always takes shortest path (fewest hops). Optimal for latency but can create congestion on popular links
- **Non-minimal routing:** May take longer paths to avoid congested links. Essential for dragonfly load balancing but adds latency to uncongested traffic

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Server networking as the leaf-layer of topology; switch configuration, VLAN design |
| [VAV](../VAV/index.html) | Distributed storage traffic patterns inform topology selection; Ceph's CRUSH algorithm maps to network locality |
| [GSD2](../GSD2/index.html) | Orchestration agent topology parallels network topology; model allocation parallels compute allocation |
| [MPC](../MPC/index.html) | Distributed math operations require understanding of collective communication over topology |
| [BRC](../BRC/index.html) | Federation networking; peer-to-peer mesh as a distributed topology |

---

## 9. Sources

1. [Fat-Tree Networks | NVIDIA DGX SuperPOD Architecture](https://www.nvidia.com/)
2. [Clos Network | Charles Clos, Bell System Technical Journal, 1953](https://ieeexplore.ieee.org/)
3. [Dragonfly Topology | Kim et al., ISCA 2008](https://dl.acm.org/)
4. [HPE Slingshot Interconnect](https://www.hpe.com/)
5. [Google TPU v4 Architecture](https://cloud.google.com/tpu/)
6. [Slim Fly | Besta et al., SC 2014](https://dl.acm.org/)
