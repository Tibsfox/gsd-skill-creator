# Congestion Control

> **Domain:** Internet Protocol Suite
> **Module:** 3 -- Slow Start, CUBIC, BBR & Congestion Dynamics
> **Through-line:** *Congestion control is TCP's conscience. Without it, every sender would transmit at line rate, routers would overflow, and the network would collapse. The algorithms that prevent this are essentially differential equations running in every kernel on earth, a distributed optimization problem solved cooperatively by billions of endpoints that have never exchanged a single coordination message.*

---

## Table of Contents

1. [The Congestion Problem](#1-the-congestion-problem)
2. [Van Jacobson's Framework](#2-van-jacobsons-framework)
3. [Slow Start](#3-slow-start)
4. [Congestion Avoidance: AIMD](#4-congestion-avoidance-aimd)
5. [Fast Retransmit and Fast Recovery](#5-fast-retransmit-and-fast-recovery)
6. [Retransmission Timeout Computation](#6-retransmission-timeout-computation)
7. [Reno and NewReno](#7-reno-and-newreno)
8. [CUBIC](#8-cubic)
9. [BBR: Bottleneck Bandwidth and Round-trip Propagation Time](#9-bbr-bottleneck-bandwidth-and-round-trip-propagation-time)
10. [SACK: Selective Acknowledgment](#10-sack-selective-acknowledgment)
11. [ECN: Explicit Congestion Notification](#11-ecn-explicit-congestion-notification)
12. [Fairness Analysis](#12-fairness-analysis)
13. [Mesh Relevance](#13-mesh-relevance)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Congestion Problem

Network congestion occurs when aggregate traffic exceeds link capacity, causing router buffers to overflow and packets to be dropped. In October 1986, the early Internet experienced a series of "congestion collapses" where throughput dropped to a small fraction of capacity due to uncontrolled retransmission. This directly motivated Van Jacobson's 1988 congestion control work [1].

TCP congestion control is cooperative: each sender independently infers network conditions from packet loss and delay signals, then adjusts its transmission rate accordingly. There is no centralized controller. The effective send window at any moment is `min(rwnd, cwnd)` where `rwnd` is the receiver-advertised window (flow control) and `cwnd` is the congestion window (congestion control) [2].

```
CONGESTION CONTROL VARIABLES
================================================================

  cwnd          Congestion window (bytes) -- sender's estimate of
                safe transmission rate. Maintained by sender.

  ssthresh      Slow-start threshold (bytes). Below ssthresh,
                cwnd grows exponentially (slow start). Above
                ssthresh, cwnd grows linearly (congestion avoidance).

  rwnd          Receiver window (bytes) -- receiver's available
                buffer. Advertised in every ACK.

  Effective window = min(cwnd, rwnd)

  BDP = Bandwidth × RTT
      = The amount of data "in flight" when the pipe is full
      = The optimal cwnd for full utilization without queuing
```

---

## 2. Van Jacobson's Framework

Van Jacobson's 1988 paper "Congestion Avoidance and Control" introduced four algorithms that remain the foundation of TCP congestion control [1]:

1. **Slow Start** -- exponential cwnd growth from 1 MSS
2. **Congestion Avoidance** -- linear cwnd growth above ssthresh
3. **Fast Retransmit** -- retransmit on 3 duplicate ACKs without waiting for timeout
4. **Fast Recovery** -- maintain half the cwnd after fast retransmit instead of resetting to 1

These algorithms are formalized in RFC 5681 (September 2009), which is the current standard for TCP congestion control [2].

---

## 3. Slow Start

On connection establishment and after a retransmission timeout (RTO), the sender begins with `cwnd` = Initial Window (IW). RFC 5681 specifies IW = min(10 x MSS, max(2 x MSS, 4380)) -- typically 10 MSS on modern systems (changed from 1-4 MSS by RFC 6928) [2][3].

### Algorithm

```
On connection start or after RTO:
  cwnd = IW  (typically 10 * MSS)
  ssthresh = arbitrarily high (e.g., 65535 or receiver window)

For each ACK received during slow start:
  cwnd = cwnd + MSS
  (this doubles cwnd each RTT: exponential growth)

Exit slow start when:
  cwnd >= ssthresh  -->  enter congestion avoidance
  packet loss detected  -->  set ssthresh, reduce cwnd
```

### Growth Rate

Slow start doubles the cwnd every RTT. Starting from IW = 10 MSS with MSS = 1460 bytes:

| RTT | cwnd (segments) | cwnd (bytes) | Data in flight |
|---|---|---|---|
| 0 | 10 | 14,600 | 14.6 KB |
| 1 | 20 | 29,200 | 29.2 KB |
| 2 | 40 | 58,400 | 58.4 KB |
| 3 | 80 | 116,800 | 116.8 KB |
| 4 | 160 | 233,600 | 233.6 KB |
| 5 | 320 | 467,200 | 467.2 KB |

A connection on a 100ms RTT path reaches 467 KB in flight after 500ms -- enough to saturate a 7.5 Mbps link [2].

---

## 4. Congestion Avoidance: AIMD

When `cwnd >= ssthresh`, TCP enters congestion avoidance and uses Additive Increase / Multiplicative Decrease (AIMD) [2].

### Additive Increase

For each ACK received:

```
cwnd = cwnd + (MSS * MSS) / cwnd
```

This increases cwnd by approximately 1 MSS per RTT (linear growth). The formula ensures that the increase is distributed across all ACKs within a window, not applied per-ACK.

### Multiplicative Decrease

On packet loss detected by triple duplicate ACK:

```
ssthresh = cwnd / 2
cwnd = ssthresh  (fast recovery)
```

On retransmission timeout:

```
ssthresh = cwnd / 2
cwnd = 1 MSS  (back to slow start)
```

### AIMD Convergence

AIMD has a proven convergence property: when multiple flows share a bottleneck, AIMD drives all flows toward equal bandwidth allocation. The multiplicative decrease penalizes larger flows more heavily (in absolute terms), while the additive increase gives equal absolute increases. This produces the characteristic TCP sawtooth pattern in cwnd over time [4].

```
TCP SAWTOOTH -- cwnd OVER TIME
================================================================

  cwnd
   ^
   |        /\          /\          /\
   |       /  \        /  \        /  \
   |      /    \      /    \      /    \
   |     /      \    /      \    /      \
   |    /        \  /        \  /        \
   |   /          \/          \/          \
   +---------------------------------------------> time
        ssthresh = cwnd/2 at each loss event
        Linear increase, multiplicative decrease
```

---

## 5. Fast Retransmit and Fast Recovery

### Fast Retransmit

When the sender receives three duplicate ACKs (four total ACKs for the same sequence number), it infers that a segment has been lost and retransmits it immediately without waiting for the RTO timer [2].

### Fast Recovery (RFC 5681)

After fast retransmit:

```
1. ssthresh = cwnd / 2
2. cwnd = ssthresh + 3 * MSS  (inflate for 3 dup ACKs already in flight)
3. For each additional duplicate ACK: cwnd = cwnd + MSS
4. When new data is ACKed: cwnd = ssthresh  (deflate, enter congestion avoidance)
```

Fast recovery avoids resetting cwnd to 1 MSS after a single loss event, maintaining higher throughput than the original slow-start-on-loss behavior [2].

---

## 6. Retransmission Timeout Computation

The RTO timer determines how long the sender waits before concluding a segment is lost (when no duplicate ACKs arrive). RFC 6298 specifies the computation [5]:

### Algorithm

```
First RTT measurement:
  SRTT = R                   (Smoothed RTT)
  RTTVAR = R / 2             (RTT Variance)
  RTO = SRTT + max(G, 4 * RTTVAR)

Subsequent measurements:
  RTTVAR = (1 - beta) * RTTVAR + beta * |SRTT - R|    (beta = 1/4)
  SRTT = (1 - alpha) * SRTT + alpha * R                (alpha = 1/8)
  RTO = SRTT + max(G, 4 * RTTVAR)

Where:
  R = measured round-trip time (from segment send to ACK receipt)
  G = clock granularity
  Minimum RTO = 1 second (RFC 6298 requirement)
```

### Exponential Backoff

After each consecutive retransmission timeout (without intervening ACK), the RTO is doubled: `RTO = RTO * 2`. This exponential backoff prevents a misbehaving sender from continuously retransmitting into a congested network. The backoff resets after a successful ACK [5].

### Karn's Algorithm

RTT samples must not be taken from retransmitted segments, because it is ambiguous whether the ACK corresponds to the original or retransmitted segment. This is Karn's algorithm (1987) [6].

---

## 7. Reno and NewReno

### TCP Reno

Reno combines slow start, congestion avoidance, fast retransmit, and fast recovery as described above. It was the dominant TCP variant from the early 1990s through the mid-2000s. Its primary weakness: after fast retransmit, if multiple segments were lost in the same window, Reno enters slow start for each subsequent loss (it exits fast recovery after the first new ACK, then detects additional losses via timeout) [7].

### TCP NewReno (RFC 6582)

NewReno improves fast recovery to handle multiple losses within a single window. Instead of exiting fast recovery on the first new ACK, NewReno tracks whether all segments up to the recovery point have been acknowledged. If a "partial ACK" arrives (acknowledging some but not all segments sent before recovery), NewReno retransmits the next unacknowledged segment and stays in fast recovery [7].

---

## 8. CUBIC

CUBIC (RFC 8312) is the default congestion control algorithm in Linux (since kernel 2.6.19, 2006) and Android. It replaces Reno's linear window growth with a cubic function of elapsed time since the last congestion event [8].

### The Cubic Window Function

```
W(t) = C * (t - K)^3 + W_max

Where:
  W(t) = window size at time t after last loss
  C = scaling factor (0.4 in Linux implementation)
  K = cubic root of (W_max * beta / C)
  W_max = window size at which last loss occurred
  beta = multiplicative decrease factor (0.7 for CUBIC, vs 0.5 for Reno)
  t = elapsed time since last congestion event
```

### Growth Profile

| Phase | t relative to K | Growth rate | Behavior |
|---|---|---|---|
| Convex region | t << K | Fast growth | Rapidly probing away from W_max |
| Plateau | t near K | Slow growth | Cautiously approaching previous W_max |
| Concave region | t > K | Accelerating | Probing for new capacity beyond W_max |

### Key Properties

- **Window-independent growth:** CUBIC's growth depends on wall-clock time since the last loss, not on RTT. This makes it fairer to flows with different RTTs compared to Reno.
- **TCP-friendliness mode:** When the CUBIC window is below what Reno would achieve under the same conditions, CUBIC uses Reno's linear increase instead. This ensures CUBIC is never less aggressive than Reno.
- **Multiplicative decrease:** beta = 0.7 (retains 70% of cwnd after loss, versus Reno's 50%). This is more conservative on high-BDP paths.

### CUBIC vs Reno on High-BDP Paths

On a 1 Gbps link with 100ms RTT (BDP = 12.5 MB), Reno requires approximately 12,500 RTTs (20+ minutes) to fill the pipe after a loss event. CUBIC fills it in a fraction of that time because its cubic growth function is independent of RTT [8].

---

## 9. BBR: Bottleneck Bandwidth and Round-trip Propagation Time

BBR is a model-based congestion control algorithm developed at Google, available in Linux since kernel 4.9 (December 2016). Unlike loss-based algorithms (Reno, CUBIC), BBR continuously estimates two network parameters and paces traffic accordingly [9].

### Core Model

```
BtlBw = max(delivery_rate) over sliding 10-RTT window
         (bottleneck bandwidth -- the maximum observed delivery rate)

RTprop = min(RTT) over sliding 10-second window
          (propagation delay -- the minimum observed RTT, excluding queuing)

Pacing rate = BtlBw
Congestion window = 2 * BtlBw * RTprop  (2 BDP)
```

### Four Phases

| Phase | Duration | Pacing Gain | cwnd | Purpose |
|---|---|---|---|---|
| Startup | Until BtlBw plateaus | 2/ln(2) (~2.89) | 2 * estimated BDP | Exponential probing for bandwidth (like slow start) |
| Drain | ~1 RTT | 1/2.89 (~0.35) | 2 * BDP | Drain the queue built during Startup |
| ProbeBW | 8-RTT cycle | Cycles: 1.25, 0.75, 1, 1, 1, 1, 1, 1 | 2 * BDP | Probe for bandwidth gains; 1 RTT at 1.25x, 1 at 0.75x, 6 at 1x |
| ProbeRTT | 200ms | 1 | 4 packets | Reduce cwnd to measure minimum RTT; entered when 10s without new RTprop |

### Performance Evidence

Published performance data from Google (ACM Queue, 2017) [9]:

- **100 Mbps, 100ms, 1% random loss:** BBR achieves ~9,100 Mbps aggregate goodput vs CUBIC's ~3.3 Mbps -- a 2,700x improvement. CUBIC interprets random loss as congestion signal; BBR does not.
- **YouTube deployment:** 4% average throughput improvement globally, up to 14% in some countries, with 33% reduction in average RTT.
- **Google B4 WAN:** BBR increased throughput on Google's internal WAN by 2,500x for some paths by filling the pipe without creating queue buildup.

### BBRv2

BBRv1 has known fairness issues when competing with CUBIC flows -- BBR tends to dominate the shared bottleneck. BBRv2 (still experimental as of 2025) adds:

- Loss sensitivity: BBR responds to packet loss with cwnd reduction
- Inflight cap: limits inflight data to avoid excessive queuing
- Better fairness with CUBIC flows at the cost of some throughput [10].

---

## 10. SACK: Selective Acknowledgment

TCP's basic cumulative ACK mechanism requires the sender to retransmit all segments from the loss point forward, even if later segments were received successfully. SACK (RFC 2018) allows the receiver to report which segments it has received out of order [11].

### SACK Block Format

The SACK option (Kind 5) contains 1-4 block pairs, each pair specifying a contiguous range of received bytes:

```
SACK OPTION FORMAT
================================================================

  +--------+--------+
  | Kind=5 | Length |
  +--------+--------+
  | Left Edge Block 1 (32 bits) |
  +-----------------------------+
  | Right Edge Block 1 (32 bits) |
  +-----------------------------+
  | Left Edge Block 2 (32 bits) |  (optional, up to 4 blocks)
  +-----------------------------+
  | Right Edge Block 2 (32 bits) |
  +-----------------------------+
```

Each block represents a contiguous sequence of bytes that the receiver has received. Left Edge is the first sequence number of the block; Right Edge is the sequence number immediately following the last byte. Up to 4 blocks fit in a single TCP segment (when Timestamps option is also present, only 3 blocks fit) [11].

### FACK: Forward Acknowledgment

FACK extends SACK by estimating the total amount of data outstanding in the network. The "forward most" SACK block edge represents the furthest point of delivery. The number of bytes between `SND.UNA` and the forward-most SACK edge, minus the bytes reported as received by SACK, estimates the bytes still in transit. This enables more precise retransmission decisions [12].

### SACK Negotiation

SACK capability is negotiated during the handshake via the SACK-Permitted option (Kind 4) in SYN and SYN-ACK. Both endpoints must advertise SACK-Permitted for SACK to be used. As of 2025, SACK is supported by virtually all TCP implementations and is enabled by default [11].

---

## 11. ECN: Explicit Congestion Notification

ECN (RFC 3168) allows routers to signal congestion to endpoints without dropping packets. This is preferable to packet loss as a congestion signal because it avoids the performance penalty of retransmission [13].

### IP Layer: ECN Field

The 2-bit ECN field in the IP header (bits 6-7 of the Traffic Class / ToS byte):

| Codepoint | Meaning |
|---|---|
| 00 (Not-ECT) | Sender does not support ECN |
| 01 (ECT(1)) | ECN-capable transport |
| 10 (ECT(0)) | ECN-capable transport |
| 11 (CE) | Congestion Experienced -- set by router |

### TCP Layer: ECN Flags

ECN requires cooperation between IP and TCP layers:

1. **Negotiation:** Sender sets ECE and CWR in SYN; receiver sets ECE in SYN-ACK to confirm ECN capability
2. **Congestion signal:** When a TCP receiver detects a CE-marked packet, it sets the ECE flag in the next ACK
3. **Sender response:** When the sender receives an ACK with ECE set, it reduces cwnd (as if a loss occurred) and sets CWR in the next data segment to acknowledge the congestion signal
4. The receiver stops setting ECE after seeing CWR [13]

### ECN Benefits

- Avoids retransmission overhead on congested paths
- Provides earlier congestion signals (before buffer overflow)
- Particularly valuable for time-sensitive applications where retransmission latency is costly
- Required for DCTCP (Data Center TCP), which uses ECN marking rate to proportionally reduce cwnd

### Deployment Status

ECN negotiation succeeds on approximately 56% of web servers as of 2020. Many middleboxes historically dropped ECN-capable SYN packets, but this has improved significantly. Apple enabled ECN by default in iOS 9 and macOS 10.11. Linux enables ECN negotiation for outgoing connections since kernel 4.1 [13][14].

---

## 12. Fairness Analysis

### Jain's Fairness Index

Fairness between competing flows is measured by Jain's index:

```
f(x_1, x_2, ..., x_n) = (sum(x_i))^2 / (n * sum(x_i^2))
```

Where `x_i` is the throughput of flow i. Perfect fairness = 1.0; complete unfairness (one flow gets everything) = 1/n [15].

### CUBIC vs CUBIC

Two CUBIC flows sharing a bottleneck converge to approximately equal throughput regardless of RTT differences, because CUBIC's growth is time-based rather than RTT-based. Jain's index typically exceeds 0.95 [8].

### BBR vs CUBIC

BBRv1 competing with CUBIC on a shared bottleneck is unfair: BBR flows can capture 40-80% of bandwidth when competing against an equal number of CUBIC flows. This occurs because BBR paces traffic to fill the pipe and does not reduce its rate in response to loss (which CUBIC interprets as congestion). BBRv2 addresses this with loss sensitivity and inflight caps [9][10].

### BBR vs BBR

Multiple BBRv1 flows sharing a bottleneck generally achieve fair bandwidth allocation. The ProbeBW phase's periodic probing cycles interleave across flows, and the shared RTprop estimation provides a common baseline [9].

### Long Flows vs Short Flows

Short flows (typical web requests) never exit slow start, so congestion control fairness primarily affects long-lived flows (bulk transfer, streaming). The initial window (IW = 10 MSS, per RFC 6928) determines short-flow performance more than any congestion control algorithm [3].

---

## 13. Mesh Relevance

Congestion control understanding is critical for GSD Mesh transport design:

- **Algorithm selection:** Mesh nodes operating over heterogeneous links (Wi-Fi, cellular, Ethernet) face varying loss rates and RTTs. BBR's model-based approach may be more suitable than CUBIC for links with non-congestion loss (e.g., wireless).
- **Fairness on shared links:** Mesh nodes sharing a bottleneck with non-mesh traffic must be fair. CUBIC provides better inter-flow fairness than BBRv1.
- **Pacing:** BBR's pacing approach (spacing packets evenly in time rather than bursting) reduces buffer bloat at mesh hop points.
- **ECN in mesh:** If mesh nodes can deploy ECN-aware queuing (e.g., CoDel/fq_codel), ECN provides earlier congestion signals than loss-based detection.
- **DACP parallels:** DACP's deterministic communication model can adopt congestion-aware backpressure similar to TCP's cwnd mechanism, scaling agent message rate to available processing capacity.

---

## 14. Cross-References

> **Related:** [TCP Core](02-tcp-core.md) -- cwnd interacts with the receive window (rwnd) for effective send window. [Companion Protocols](04-companion-protocols.md) -- ICMP Source Quench (deprecated) was an early congestion signal. [Transport Evolution](05-transport-evolution.md) -- QUIC implements its own congestion control (RFC 9002) with pluggable algorithm support.

**Series cross-references:**
- **CMH (Comp. Mesh):** Mesh transport layer congestion control directly informed by this module
- **GRD (Gradient Engine):** Gradient descent optimization parallels AIMD convergence dynamics
- **WPH (Weekly Phone):** Real-time voice/video affected by congestion-induced latency and jitter
- **MCF (Multi-Cluster Fed.):** Cross-cluster traffic competes with other flows; fairness matters
- **RFC (RFC Archive):** RFC 5681 (congestion control), RFC 8312 (CUBIC), RFC 6298 (RTO)
- **SYS (Systems Admin):** `sysctl` tuning of congestion control parameters on Linux

---

## 15. Sources

1. Jacobson, V. "Congestion Avoidance and Control." Proceedings of ACM SIGCOMM '88, pp. 314-329, 1988.
2. Allman, M., Paxson, V., and Blanton, E. "TCP Congestion Control." RFC 5681, IETF, September 2009. Status: Draft Standard.
3. Chu, J., Dukkipati, N., Cheng, Y., and Mathis, M. "Increasing TCP's Initial Window." RFC 6928, IETF, April 2013. Status: Experimental.
4. Chiu, D.-M. and Jain, R. "Analysis of the Increase and Decrease Algorithms for Congestion Avoidance in Computer Networks." Computer Networks and ISDN Systems, vol. 17, pp. 1-14, 1989.
5. Paxson, V., Allman, M., Chu, J., and Sargent, M. "Computing TCP's Retransmission Timer." RFC 6298, IETF, June 2011.
6. Karn, P. and Partridge, C. "Improving Round-Trip Time Estimates in Reliable Transport Protocols." Proceedings of ACM SIGCOMM '87, pp. 2-7, 1987.
7. Henderson, T., Floyd, S., Gurtov, A., and Nishida, Y. "The NewReno Modification to TCP's Fast Recovery Algorithm." RFC 6582, IETF, April 2012.
8. Ha, S., Rhee, I., and Xu, L. "CUBIC for Fast Long-Distance Networks." RFC 8312, IETF, February 2018. Status: Informational.
9. Cardwell, N., Cheng, Y., Gunn, C.S., Yeganeh, S.H., and Jacobson, V. "BBR: Congestion-Based Congestion Control." ACM Queue, vol. 14, no. 5, pp. 20-53, 2016.
10. Cardwell, N., Cheng, Y., Yeganeh, S.H., Swett, I., and Jacobson, V. "BBR v2: A Model-based Congestion Control." IETF 104 presentation, March 2019.
11. Mathis, M., Mahdavi, J., Floyd, S., and Romanow, A. "TCP Selective Acknowledgment Options." RFC 2018, IETF, October 1996.
12. Mathis, M. and Mahdavi, J. "Forward Acknowledgement: Refining TCP Congestion Control." Proceedings of ACM SIGCOMM '96, pp. 281-291, 1996.
13. Ramakrishnan, K., Floyd, S., and Black, D. "The Addition of Explicit Congestion Notification (ECN) to IP." RFC 3168, IETF, September 2001.
14. Trammell, B., Kuehlewind, M., Boppart, D., Learmonth, I., Fairhurst, G., and Scheffenegger, R. "Enabling Internet-Wide Deployment of Explicit Congestion Notification." Proceedings of PAM '15, 2015.
15. Jain, R., Chiu, D.-M., and Hawe, W. "A Quantitative Measure of Fairness and Discrimination for Resource Allocation in Shared Computer Systems." DEC Technical Report TR-301, September 1984.
16. Ha, S., Rhee, I., and Xu, L. "CUBIC: a new TCP-friendly high-speed TCP variant." ACM SIGOPS Operating Systems Review, vol. 42, no. 5, pp. 64-74, 2008.
17. Tierney, B. et al. "Exploring the BBRv2 Congestion Control Algorithm for Data Transfer Nodes." ESnet / Internet2 TechEx, 2022.

---

*TCP/IP Protocol -- Module 3: Congestion Control. The distributed conscience of the Internet, running unsupervised in every kernel on earth.*
