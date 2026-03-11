# Access & Bandwidth

> **Module ID:** SRV-ACCESS
> **Module:** 6 — Stewardship Layer
> **Through-line:** *Infrastructure is a utility. Trust controls access. Waste is the enemy.* The sysadmin is not a gatekeeper selling access -- the sysadmin is a utility engineer keeping the infrastructure honest. You pay for what you use. Nobody injects advertisements into your water supply.

---

## Table of Contents

1. [Infrastructure as Utility](#1-infrastructure-as-utility)
2. [The Admin Pays the Bills](#2-the-admin-pays-the-bills)
3. [Trust-Based Access Control](#3-trust-based-access-control)
4. [Rate Limiting and Traffic Shaping](#4-rate-limiting-and-traffic-shaping)
5. [The Anti-Waste Principle](#5-the-anti-waste-principle)
6. [Rooftop Solar Computing](#6-rooftop-solar-computing)
7. [Mesh Networking](#7-mesh-networking)
8. [Public Compute as Utility](#8-public-compute-as-utility)
9. [Resource Stewardship](#9-resource-stewardship)
10. [Implementation Architecture](#10-implementation-architecture)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Infrastructure as Utility

Power, water, network, compute. Four utilities that share a fundamental property: they are built once, maintained continuously, and serve everyone on the grid. The infrastructure exists. The pipes run to the house. The wires run to the panel. The fiber runs to the neighborhood. We are very good at distributing electricity. We have been doing it for over a century.

### 1.1 The Utility Model

A utility has specific characteristics that distinguish it from a product or a subscription service:

| Characteristic | Utility model | Subscription model |
|---------------|---------------|-------------------|
| **Pricing** | Metered: pay for what you use | Tiered: pay for a package whether you use it or not |
| **Access** | Universal: everyone on the grid gets service | Gatekept: features locked behind tiers |
| **Quality** | Consistent: same voltage, same pressure | Variable: throttled unless you pay more |
| **Transparency** | The meter reads, you verify | The provider decides what you see |
| **Ownership of infrastructure** | Public or regulated private, with oversight | Private, with terms of service |

You do not negotiate your water pressure based on a subscription tier. The meter reads what you use. You pay for what you use. The pipe is the pipe. There is no "premium water" that flows faster because you pay more per month. There is no "basic electricity" that dims your lights during peak hours to upsell you to the next plan. The infrastructure delivers what it delivers, and you pay for what you consume.

This is the model for compute and bandwidth.

### 1.2 What Already Exists

We already have the infrastructure. This is not a future we need to build from scratch -- it is an update to infrastructure that is already in place:

```
Water:       Pipes run from treatment plant to every house on the grid.
             Built over decades. Maintained by utilities. Metered.

Electricity: Wires run from generating stations through substations
             to every house on the grid. Built over a century.
             Maintained by utilities. Metered.

Roads/Rail:  Physical transport networks connecting communities.
             Built over centuries. Maintained by public agencies.
             Funded by taxes and tolls.

Telecom:     Copper, coax, and fiber run from central offices to
             neighborhoods. Built over decades. Maintained by
             carriers. Metered (or should be).

Compute:     The missing utility. The hardware exists. The network
             exists. The model is proven by every other utility.
             We just need to apply the same principles.
```

The infrastructure exists. We are very good at using electricity. The question is not whether we can build compute utilities -- the question is why we are still treating compute and bandwidth as subscription products when every other essential service uses metered utility pricing.

### 1.3 The Meter Is the Contract

In a utility model, the meter is the only contract that matters. It records what was consumed. It does not record what was attempted and blocked. It does not record what could have been consumed if you had paid for a higher tier. The meter reads reality.

```
Water meter:      Gallons consumed this billing cycle.
Electric meter:   Kilowatt-hours consumed this billing cycle.
Bandwidth meter:  Bytes transferred this billing cycle.
Compute meter:    CPU-seconds and GPU-seconds consumed this billing cycle.
```

The meter is transparent. The customer can read it. The provider can read it. Disputes are resolved by the physical record of consumption, not by the provider's interpretation of terms of service. This transparency is fundamental -- it is what makes a utility a utility rather than a product.

---

## 2. The Admin Pays the Bills

The admin pays the carrier access charges. The internet connection that serves the network, the electricity that powers the hardware, the hardware itself -- the admin paid for all of it. This is ownership, not gatekeeping. Same as a house: you pay the mortgage, you decide who comes in.

### 2.1 Ownership and Authority

When you pay the carrier for a 1 Gbps connection, that gigabit is yours. You decide how it is allocated. You decide who uses it. You decide the terms of access. This is not about being selfish with bandwidth -- it is about being intentional with a finite resource that has a real monthly cost.

```
Monthly infrastructure costs (example home server):

Internet:     $80/month   (1 Gbps symmetric fiber)
Electricity:  $40/month   (server + networking gear, ~300W continuous)
Hardware:     $50/month   (amortized cost of server, switch, AP)
Domain/DNS:   $5/month    (domain registration, DNS hosting)
Total:        $175/month

$175/month for the privilege of serving content to anyone who connects.
The admin decides who gets that privilege and how much of it.
```

This is the same principle as hosting a dinner party. You bought the food. You cooked the meal. You decide who sits at the table. Inviting friends to dinner is generosity. Being expected to feed every stranger who walks by is not a social contract -- it is an imposition.

### 2.2 The Admin's Word Is Final

On the admin's infrastructure, the admin's word is final. Not because the admin is authoritarian -- because the admin bears the cost. Every byte served costs electricity. Every connection consumes a file descriptor, a socket, a slice of CPU. Every request the server processes is work the admin paid to make possible.

This means:

- The admin decides who gets bandwidth and how much
- The admin decides what services run on the hardware
- The admin decides the terms of community access
- The admin decides when the infrastructure serves and when it rests

The community benefits because the admin maintains the resource. The admin maintains the resource because it serves the community. This is stewardship, not commerce. The admin is not selling access -- the admin is sharing infrastructure at rates the admin sets.

### 2.3 This Is Not Gatekeeping

Gatekeeping is restricting access to extract payment or maintain power. Stewardship is managing access to ensure the resource serves its purpose. The distinction matters:

| Gatekeeping | Stewardship |
|-------------|-------------|
| Restricts access to increase revenue | Manages access to maintain quality |
| Creates artificial scarcity | Manages real scarcity |
| Benefits the gatekeeper | Benefits the community |
| Opaque rules that serve the provider | Transparent rules that serve everyone |
| "Pay more to get what you need" | "Use what you need, here's how much it costs" |

The admin who rate-limits unknown visitors is not gatekeeping -- the admin is protecting community bandwidth from being consumed by strangers who have not earned trust. The admin who gives friends full bandwidth is not playing favorites -- the admin is sharing resources with people who have demonstrated they will use them respectfully.

---

## 3. Trust-Based Access Control

Authentication asks "who are you?" Authorization asks "what can you do?" But neither asks the deeper question: "Why should you have access, and how much?"

Trust-based access control answers that question. Access is not binary (allowed or denied). Access is graduated: the more trust you have established, the more bandwidth you receive. The trust level is the throttle.

### 3.1 The Trust Ladder

The trust ladder maps relationship depth to bandwidth allocation:

```
Level 5: Owner / Admin
  Bandwidth: Full pipe (1 Gbps)
  Trust basis: Pays for the infrastructure
  Verification: Physical access, root credentials
  Example: Foxy at the console

Level 4: Trusted Community
  Bandwidth: High (100+ Mbps, admin-set ceiling)
  Trust basis: Established relationship, verified through trust system
  Verification: Web of trust, mutual vouching, shared history
  Example: Camp mates, longtime collaborators, known contributors

Level 3: Known Visitors
  Bandwidth: Moderate (10-50 Mbps, admin-set)
  Trust basis: Identified, some interaction history
  Verification: Previous visit, referral from trusted member
  Example: Someone introduced by a friend, returning visitor

Level 2: Identified Strangers
  Bandwidth: Low (1-5 Mbps)
  Trust basis: Provided identity, no history yet
  Verification: Character sheet created, basic authentication
  Example: New visitor who signed in but hasn't earned trust

Level 1: Unknown Visitors
  Bandwidth: 150 baud (150 bytes/sec)
  Trust basis: None — completely unknown
  Verification: None — IP address only
  Example: Random internet connection, bot, crawler
```

150 baud for unknown visitors is not a typo. 150 bytes per second is enough to load a text-only welcome page explaining who runs this infrastructure, what it is for, and how to establish trust. It is not enough to scrape content, run automated attacks, or consume meaningful bandwidth. The unknown visitor gets a door and a doorbell. They do not get the run of the house.

### 3.2 Why 150 Baud

The number is deliberate. 150 baud was approximately the speed of early teletype connections -- enough for text communication, nothing more. At 150 bytes per second:

```
A 1 KB welcome page loads in:       ~7 seconds
A 100 KB image loads in:             ~11 minutes
A 1 MB page loads in:                ~1.8 hours
A 10 MB download is:                 effectively impossible

Compare to Level 4 at 100 Mbps:
A 1 KB page loads in:                <1 millisecond
A 100 KB image loads in:             <1 millisecond
A 1 MB page loads in:                ~80 milliseconds
A 10 MB download takes:              ~0.8 seconds
```

The bandwidth gap between Level 1 and Level 4 is approximately 666,000:1. This is the technical expression of a social reality: a stranger off the street does not get the same access as a trusted friend. The stranger is welcome to introduce themselves. They are not welcome to move in.

### 3.3 Trust Moves in One Direction

Trust is earned, not given. The ladder only moves upward through demonstrated behavior over time. Trust cannot be purchased, demanded, or assumed. The progression:

```
Unknown visitor arrives (Level 1: 150 baud)
    |
    v  Creates character sheet, provides a name and an icon
Identified stranger (Level 2: 1-5 Mbps)
    |
    v  Returns, interacts, referred by trusted member
Known visitor (Level 3: 10-50 Mbps)
    |
    v  Sustained positive interaction, mutual vouching, shared work
Trusted community (Level 4: 100+ Mbps)
    |
    v  This level is not earned -- it is structural
Owner / Admin (Level 5: full pipe)
```

There is no fast path. There is no "premium membership" that buys Level 4 access. Trust is built through relationship, verified through the web of trust, and revocable when violated. The same trust system that governs BRC camp access governs bandwidth allocation. The principle is identical: the resource serves people who have demonstrated they will use it well.

### 3.4 Same Trust System, Different Resource

This bandwidth trust model is the same trust architecture used in the BRC playa mesh, camp access, and federation. The mechanism is the same web of trust -- mutual vouching, earned relationships, time-tested connections. The resource being gated changes:

| Context | Trust gates... | Unknown default | Trusted default |
|---------|---------------|-----------------|-----------------|
| Bandwidth | Bytes per second | 150 baud | Admin-set ceiling |
| Camp access | Physical entry | Welcome area only | Full camp access |
| Federation | Data sync scope | Read-only public | Bidirectional sync |
| Stamp system | Validation weight | No stamps | Stamps carry weight |

The trust level is a single variable that maps to multiple resources. One trust relationship, many access grants. This is efficient -- you do not need separate access control for each resource. You need one trust system that every resource reads.

---

## 4. Rate Limiting and Traffic Shaping

The trust ladder is philosophy. Rate limiting and traffic shaping are the mechanisms that implement it. These are the tools that translate "Level 2 gets 5 Mbps" into enforced reality on the wire.

### 4.1 Linux Traffic Control (tc)

The `tc` command configures the kernel's traffic control framework. It operates on qdiscs (queuing disciplines), classes, and filters:

```
           Network Interface
                 |
           Root Qdisc (HTB)
                 |
        +--------+--------+
        |        |        |
    Class 1:1  Class 1:2  Class 1:3
    (Admin)    (Trusted)  (Unknown)
    1 Gbps     100 Mbps   150 bps
        |        |        |
    Filter:    Filter:    Filter:
    src IP     trust DB   default
```

**HTB (Hierarchical Token Bucket)** is the most common qdisc for bandwidth management. It allows you to define classes with guaranteed rates and maximum ceilings, and to share unused bandwidth between classes:

```bash
# Create the root qdisc
tc qdisc add dev eth0 root handle 1: htb default 30

# Admin class: guaranteed 1 Gbps
tc class add dev eth0 parent 1: classid 1:1 htb \
    rate 1gbit ceil 1gbit prio 0

# Trusted community: guaranteed 100 Mbps, burst to 500 Mbps if available
tc class add dev eth0 parent 1: classid 1:10 htb \
    rate 100mbit ceil 500mbit prio 1

# Known visitors: guaranteed 50 Mbps, ceiling 100 Mbps
tc class add dev eth0 parent 1: classid 1:20 htb \
    rate 50mbit ceil 100mbit prio 2

# Unknown visitors: 150 bytes/sec, no burst
tc class add dev eth0 parent 1: classid 1:30 htb \
    rate 1200bps ceil 1200bps prio 7

# Filter: route traffic to classes based on source IP
# (In practice, this maps to the trust database lookup)
tc filter add dev eth0 parent 1: protocol ip u32 \
    match ip src 192.168.1.100 flowid 1:10
```

The `rate` parameter is the guaranteed minimum. The `ceil` parameter is the maximum if spare bandwidth exists. The `prio` parameter determines which class gets excess bandwidth first. Priority 0 (admin) always gets served first. Priority 7 (unknown) gets scraps.

### 4.2 Token Bucket and Leaky Bucket

Two fundamental algorithms power rate limiting:

**Token bucket:** A bucket fills with tokens at a constant rate. Each packet consumes a token. If the bucket is empty, the packet waits (or is dropped). The bucket has a maximum depth (burst size) -- when full, excess tokens are discarded. This allows short bursts above the average rate.

```
Token bucket for Level 2 (5 Mbps average, 10 Mbps burst):

Bucket capacity: 1.25 MB (10 Mbps * 1 second)
Token rate: 625 KB/sec (5 Mbps)

Time 0.0s: Bucket full (1.25 MB). Client sends 1 MB burst. Allowed.
           Bucket: 0.25 MB remaining.
Time 0.5s: 312.5 KB of tokens added. Bucket: 562.5 KB.
           Client sends 500 KB. Allowed. Bucket: 62.5 KB.
Time 1.0s: 312.5 KB added. Bucket: 375 KB.
           Client tries 1 MB. Only 375 KB of tokens available.
           375 KB allowed, 625 KB queued or dropped.
```

**Leaky bucket:** A bucket with a fixed-size hole in the bottom. Packets enter at the top. They leave at a constant rate through the hole. If the bucket overflows, excess packets are dropped. This produces a smooth, constant output rate -- no bursts.

```
Leaky bucket for Level 1 (150 bps constant):

Bucket capacity: 150 bytes
Drain rate: 150 bytes/sec
Output: constant 150 bps regardless of input pattern

Burst arrives: 1000 bytes in 100ms
Bucket fills to 150 bytes, 850 bytes dropped
Output drains at 150 bytes/sec for 1 second
```

For trust-based bandwidth, token bucket is usually preferred because it allows brief bursts (loading a page requires more bandwidth for a few seconds than the average rate) while maintaining the long-term rate limit.

### 4.3 iptables and nftables Rate Limiting

At the packet level, rate limiting can be applied before traffic reaches the qdisc:

```bash
# iptables: limit new connections from unknown IPs to 10/minute
iptables -A INPUT -m state --state NEW -m limit \
    --limit 10/minute --limit-burst 5 -j ACCEPT
iptables -A INPUT -m state --state NEW -j DROP

# nftables: equivalent rate limiting
nft add rule inet filter input \
    ct state new limit rate 10/minute burst 5 packets accept
nft add rule inet filter input \
    ct state new drop
```

This is the first line of defense: connection rate limiting. Before the trust system even evaluates the visitor, the firewall limits how fast new connections can be established. This prevents SYN floods and connection exhaustion attacks.

### 4.4 nginx Rate Limiting

At the application layer, nginx provides fine-grained rate limiting:

```nginx
# Define rate limiting zones
limit_req_zone $binary_remote_addr zone=unknown:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=known:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=trusted:10m rate=1000r/s;

# Apply to server blocks
server {
    # Default: unknown visitors
    location / {
        limit_req zone=unknown burst=5 nodelay;
        # ...
    }

    # Trusted paths (after trust verification)
    location /community/ {
        limit_req zone=trusted burst=50 nodelay;
        # ...
    }
}
```

The `burst` parameter is the token bucket depth -- how many excess requests are allowed before rate limiting kicks in. `nodelay` means burst requests are processed immediately rather than queued. This gives trusted users a responsive experience while strictly limiting unknown visitors.

### 4.5 QoS Classes

Quality of Service (QoS) classifies traffic into priority levels. Combined with trust-based bandwidth, QoS ensures that even within a trust level, critical traffic is prioritized:

| QoS class | DSCP marking | Traffic type | Priority |
|-----------|-------------|-------------|----------|
| EF (Expedited Forwarding) | 46 | Voice, video, real-time | Highest |
| AF41 (Assured Forwarding) | 34 | Interactive applications | High |
| AF21 | 18 | Bulk data transfer | Medium |
| BE (Best Effort) | 0 | Everything else | Lowest |

```bash
# Mark trusted community traffic as AF41 (high priority)
iptables -t mangle -A OUTPUT -m owner --uid-owner trusted_user \
    -j DSCP --set-dscp-class AF41

# Mark unknown visitor traffic as BE (best effort)
iptables -t mangle -A OUTPUT -d unknown_subnet \
    -j DSCP --set-dscp-class BE
```

QoS gives the admin fine-grained control: a Level 4 user doing a video call gets EF marking and guaranteed low latency. The same Level 4 user doing a bulk download gets AF21 marking and lower priority. Trust level controls the total bandwidth. QoS controls the experience within that bandwidth.

---

## 5. The Anti-Waste Principle

Unsolicited advertising and junk mail waste energy and kill trees. This is not a metaphor. It is a literal accounting of resources consumed for no purpose that the recipient requested.

### 5.1 The Junk Mail Problem

Consider the physical mail system. The mail carrier loads a truck, drives a route, walks to every door. A significant portion of what they carry is unsolicited advertising that the recipient did not ask for, does not want, and will immediately discard. The paper was manufactured (trees felled, water consumed, chemicals processed). The ink was printed. The piece was sorted, transported, and delivered. The recipient carries it to the recycling bin. The recycling truck picks it up, transports it to a facility, processes it back into raw material.

Two services -- the postal service and the recycling service -- feeding into each other in a wasteful cycle. The postal service carries junk to the door. The recycling service carries the same junk away. Each service is doing its job. Together, they are doing unnecessary work because the junk should not be in the pipe in the first place.

### 5.2 The Optimized Route

The mail truck and the recycling truck serve the same houses on the same streets. The mail truck delivers mail and picks up outgoing mail. The recycling truck picks up recyclables. But paper recycling is lightweight -- newspapers, cardboard, junk mail. The mail truck is already there, already has the route, already stops at every door.

The mail truck could pick up paper recycling on its return route. It is already making the trip. The paper is lightweight. The same vehicle, the same driver, the same stops. The recycling truck handles the heavy stuff -- glass, metal, wet waste -- that the mail truck is not built for.

Each service handles what it is built for. The mail truck carries lightweight paper both directions. The recycling truck carries the heavy loads. No additional routes. No additional fuel. No additional labor. Just matching the service to its strength.

### 5.3 The Digital Equivalent

In digital systems, spam is junk mail. It consumes bandwidth, CPU, storage, and electricity at every hop:

```
Spam email lifecycle:

Sender's server:     CPU to generate, bandwidth to transmit
Transit network:     Bandwidth at every router hop
Recipient's MX:      CPU to receive, bandwidth to accept
Spam filter:         CPU to classify, memory to hold
Storage:             Disk to store (even in spam folder)
User:                Attention to notice and delete
Backup:              Disk to back up the spam folder
Deletion:            CPU to expunge, disk to reclaim

Each step consumes electricity.
Each step serves no purpose the recipient requested.
```

The sysadmin who reads the access logs sees this waste quantified. A mail server that processes 10,000 messages per day, of which 7,000 are spam, is spending 70% of its resources on waste. Not 70% of disk space -- 70% of CPU, 70% of network bandwidth, 70% of the electricity bill. The spam filter is a better recycling bin. But the real solution is less spam in the pipe -- a lighter bag for the carrier.

### 5.4 Blocking at the Source

The anti-waste approach to spam is not better filters (better recycling bins). It is blocking the waste before it enters the pipe:

```bash
# DNS-based blackhole list (DNSBL)
# Reject connections from known spam sources at the SMTP level
# The message is never received, never processed, never stored

postfix/main.cf:
smtpd_recipient_restrictions =
    reject_rbl_client zen.spamhaus.org,
    reject_rbl_client bl.spamcop.net,
    permit_mynetworks,
    reject_unauth_destination

# The spam never enters the system.
# No CPU for filtering. No disk for storage.
# No bandwidth consumed beyond the initial TCP handshake.
```

This is the trust ladder applied to email. Known spam sources (Level 1) are rejected at the door -- not even 150 baud, but zero. Known correspondents (Level 4) are accepted immediately. Everything in between is evaluated and classified.

### 5.5 The Cost of Waste

Waste is not abstract. It is measurable:

| Waste type | Resource consumed | Scale |
|-----------|-------------------|-------|
| Spam email | 85+ billion messages/day globally | ~45% of all email |
| Ad-tech tracking | 30-50% of web page weight | 100+ trackers per page visit |
| Cryptocurrency mining malware | Stolen CPU/GPU cycles | Billions of $ in electricity |
| DDoS attacks | Network bandwidth | Terabits per second |
| Unused cloud instances | Compute + electricity | 30-40% of cloud spend is waste |

Each line represents resources consumed for purposes that serve neither the infrastructure owner nor the community. The sysadmin who quantifies this waste and blocks it at the source is not being restrictive -- the sysadmin is protecting resources that have a real cost.

### 5.6 Waste in the Anti-Pattern

The worst version of digital waste is the subscription model that creates artificial scarcity to sell relief from constraints it imposed:

```
Anti-pattern: The Throttle-to-Upsell Cycle

1. Provider offers "basic" plan at 25 Mbps on a 1 Gbps pipe
2. User experiences slow speeds during "peak hours"
   (provider throttles to create artificial congestion)
3. Provider offers "premium" plan at 100 Mbps for $30 more/month
4. User upgrades, gets speed that the pipe could deliver anyway
5. Provider profits from selling relief from a problem they created

The pipe is the same. The electricity is the same.
The only thing that changed is the throttle configuration.
```

This is the opposite of the utility model. A water utility does not restrict your pressure to 20 PSI and then offer "premium water" at 60 PSI for an extra fee. The pipe delivers what the pipe delivers. You pay for what flows through the meter. The utility model is honest because the meter is the only variable.

---

## 6. Rooftop Solar Computing

The RTX 4060 Ti on the desk is a rooftop solar panel. It generates compute locally. It serves surplus to the community when available. No middleman is needed for generation. The infrastructure already runs to the house.

### 6.1 The Solar Analogy

Rooftop solar generation transformed the electricity grid from a one-way delivery system into a bidirectional network. Homeowners who install solar panels generate their own electricity, consume what they need, and feed surplus back to the grid. They went from pure consumers to prosumers -- producing and consuming on the same connection.

```
Traditional grid (one-way):
Power plant  ->  Substation  ->  Transformer  ->  House (consume)

Solar grid (bidirectional):
Power plant  <-> Substation  <-> Transformer  <-> House (generate + consume)
                                                    |
                                                   [Solar panels on roof]
```

The same transformation applies to compute. A GPU on the desk is a local generator. It processes work locally without sending data to a remote cloud, waiting in a queue, or paying per-token for API access. The results are immediate, private, and free at the margin (after the hardware cost is paid, the incremental cost is electricity).

### 6.2 The Local GPU

The RTX 4060 Ti is a concrete example:

```
NVIDIA RTX 4060 Ti specifications:

CUDA cores:        4352
Tensor cores:      136 (4th generation)
VRAM:              8 GB GDDR6
Memory bandwidth:  288 GB/s
FP32 performance:  22.06 TFLOPS
FP16 performance:  44.12 TFLOPS (with tensor cores)
INT8 performance:  176.5 TOPS (with tensor cores)
TDP:               160 watts

Cost: ~$400 (one-time purchase)
Electricity: ~$14/month at $0.12/kWh running 8 hours/day at full load

Compare to cloud GPU pricing:
NVIDIA A10G on AWS:  ~$1.00/hour = $240/month (8 hours/day)
NVIDIA T4 on GCP:    ~$0.35/hour = $84/month (8 hours/day)
```

The local GPU pays for itself in 2-4 months compared to cloud GPU rental. After that, the only ongoing cost is electricity. The compute is sovereign -- no API keys, no rate limits, no usage tracking, no terms of service changes. The hardware is yours. The compute it generates is yours.

### 6.3 The Hydrogen Loop

Solar power has a storage problem: the sun does not shine at night. The solution in progress is the hydrogen loop:

```
Solar -> Electricity -> Electrolyze water -> Store hydrogen
                                                    |
                                                    v
                              Fuel cell / catalytic converter
                                                    |
                                                    v
                                        Heat + Pure clean water

Input:  Water + Sunlight
Output: Heat + Clean water (cleaner than the input)
```

The water that comes out of the fuel cell is cleaner than what went in. The electrolysis splits H2O into hydrogen and oxygen. The fuel cell recombines them, producing electricity, heat, and pure water. No combustion. No emissions. The only inputs are water and sunlight. The existing pipes carry the water. The existing wires carry the electricity. The existing infrastructure is sufficient -- we just need to update how we use it.

### 6.4 The Compute Loop

The same pattern applies to local compute:

```
Electricity -> GPU -> Process data locally -> Serve results
                                                    |
                                                    v
                                         Knowledge created

Input:  Electricity + Data
Output: Results + Knowledge

The results serve the community.
The knowledge persists after the GPU powers down.
The electricity cost is the only recurring expense.
```

When the local GPU is idle -- not processing the admin's work -- it can serve the community. Run inference for community members. Process research data. Render visualizations. The surplus compute is like surplus solar: generated locally, shared voluntarily, at rates the admin sets.

### 6.5 No Middleman for Generation

The critical property of rooftop solar is that it eliminates the middleman for generation. The homeowner generates electricity without buying it from the utility. The same principle applies to local compute:

- **Cloud GPU:** You send data to a provider, the provider processes it on their hardware, you receive results. The provider sees your data. The provider controls the pricing. The provider can change terms at any time.
- **Local GPU:** You process data on your hardware. Nobody sees your data. Nobody controls the pricing. Nobody can change the terms. The compute is sovereign.

This is not anti-cloud. Cloud compute has valid use cases -- burst capacity, global distribution, managed services. But for the admin's own work, for the community's regular needs, local compute is the rooftop solar panel: cheaper at steady state, private by default, owned outright.

---

## 7. Mesh Networking

A mesh network is infrastructure where every device is a participant. You do not connect TO the network -- you ARE the network. Your phone, your laptop, your wifi access point -- each one routes traffic for the mesh. The more devices participate, the more capacity and resilience the network has.

### 7.1 How Mesh Works

In a traditional network, all traffic flows through a central router. If the router fails, the network fails. In a mesh, devices route traffic directly to each other:

```
Traditional (star topology):
    Device A  \
    Device B  ---> Central Router ---> Internet
    Device C  /

    Router fails: everything fails.

Mesh topology:
    Device A <---> Device B <---> Device C
        ^              |              ^
        |              v              |
        +-------> Device D <----------+

    Any device fails: traffic routes around it.
    Add a device: capacity increases.
    Every participant strengthens the network.
```

### 7.2 Mesh Protocols

| Protocol | Type | Range | Typical use |
|----------|------|-------|------------|
| 802.11s | Wi-Fi mesh | ~50m indoor | Community mesh networks |
| Batman-adv | Layer 2 mesh | Network-dependent | Large mesh deployments |
| Babel | Distance-vector routing | Network-dependent | Heterogeneous mesh |
| Yggdrasil | Overlay mesh | Internet-wide | Encrypted mesh overlay |
| cjdns | Encrypted mesh | Internet-wide | Privacy-focused mesh |
| Meshtastic | LoRa mesh | 1-10 km | Off-grid communication |

### 7.3 Community Mesh as Trust Infrastructure

The BRC playa mesh is the physical manifestation of trust-based access. The installation teaches burners how to build mesh networks with phones, wifi devices, and cell towers. Building the mesh is participating. The network you build IS the infrastructure that connects you to the community.

```
Mesh trust mapping:

Device contributes to mesh routing  ->  Device earns trust
Device consumes bandwidth only       ->  Device gets baseline access
Device disrupts mesh operations      ->  Device gets blocked

The trust ladder applies:
  - Mesh node that routes traffic for others: Level 3+ (contributing)
  - Device that only consumes: Level 2 (identified, taking)
  - Unknown device, no mesh participation: Level 1 (150 baud)
```

Mesh networking makes the trust relationship physical. Contributing to the mesh infrastructure is a concrete demonstration of community participation. You are not just consuming a service -- you are providing the service to others while consuming it yourself. This is the utility model made visible: every participant is simultaneously a provider and a consumer.

### 7.4 Building a Community Mesh

A practical community mesh starts with commodity hardware:

```bash
# Configure a mesh node using batman-adv (Linux)

# Load the batman-adv kernel module
modprobe batman-adv

# Create a mesh interface
ip link set wlan0 down
iw dev wlan0 set type ibss
ip link set wlan0 up
iw dev wlan0 ibss join "community-mesh" 2412

# Add the wifi interface to batman-adv
batctl if add wlan0
ip link set bat0 up

# Assign an IP from the mesh range
ip addr add 10.mesh.x.y/16 dev bat0

# Check mesh neighbors
batctl n
# Shows every device in radio range that is participating in the mesh
```

Each node that joins the mesh extends the coverage area and increases the total bandwidth. A mesh of 50 nodes with 100 Mbps each has a theoretical aggregate bandwidth far exceeding any single access point. The mesh scales with participation.

### 7.5 The Mesh as Teaching Tool

The Burning Man installation serves a dual purpose: it provides network connectivity for the event, and it teaches participants how mesh networking works. Every person who connects a device to the mesh learns:

1. **Their device is infrastructure.** Not just a consumer -- a router, a relay, a contributor.
2. **Network topology is physical.** Move closer to a node, get better signal. Position matters.
3. **Participation creates capacity.** More devices = more routes = more bandwidth = more resilience.
4. **Trust is earned through contribution.** Route traffic for others, earn bandwidth for yourself.

These lessons transfer directly to community networking outside the event. Participants leave the playa understanding that they can build their own infrastructure. They do not need to wait for a carrier to install fiber. They can start a mesh with a few neighbors and grow it organically.

---

## 8. Public Compute as Utility

GPU server compute should be accessible like power and water. Public libraries already provide free books, free internet access, free meeting spaces. Public compute follows the same principle: a shared resource, maintained by the community, available to everyone within the service area.

### 8.1 The Library Model

Public libraries are the proof that utility-model shared resources work at scale:

| Library provides | Compute utility provides |
|-----------------|------------------------|
| Books (read, return) | Processing time (use, release) |
| Internet access (terminals, wifi) | GPU time (batch processing, inference) |
| Meeting rooms (reserve, use, return) | Dedicated instances (reserve, use, release) |
| Expert assistance (librarians) | Expert assistance (documentation, support) |
| No cost to user (tax-funded) | Metered or tax-funded |
| Library card (basic trust) | Account (basic trust) |
| Late fees (abuse of shared resource) | Rate limits (abuse of shared resource) |

The library does not sell books. It lends them. The compute utility does not sell processing time. It provides it, metered or subsidized, to the community it serves.

### 8.2 Not Free-for-All

"Available to everyone" does not mean "unlimited for everyone." Utilities are metered, managed, and maintained:

- **Metered:** Usage is tracked. Heavy users pay more. Light users pay less. This is fair because it reflects actual resource consumption.
- **Managed:** The utility engineer monitors the system, allocates capacity, and plans for growth. Demand spikes are handled through queuing and priority, not by crashing the system.
- **Maintained:** The infrastructure requires ongoing care -- hardware replacement, software updates, security patches, capacity planning. Someone does this work. They are paid for it.

The trust ladder applies here too. Community members who have established trust get priority access during contention. Unknown users get baseline access. Nobody gets unlimited access because the resource is finite and the cost of maintenance is real.

### 8.3 Pay the Experts

The knowledge to build and maintain compute infrastructure exists. It is scattered across decades of systems administration experience, academic research, open-source projects, and industry practice. A lot of knowledge is out there.

Pay people to teach the systems their knowledge. They are the human in the loop while we engineer the solutions. The expert who maintains the infrastructure is not a cost center -- they are the reason the infrastructure works. The sysadmin who keeps the servers running, the network engineer who designs the mesh, the security analyst who monitors the access logs -- pay them. Their expertise is what makes the utility reliable.

This is not a call for volunteerism. It is a call for valuing the labor that keeps infrastructure functioning. The water utility pays plumbers. The electric utility pays lineworkers. The compute utility pays sysadmins. The model works because the experts are compensated and the community benefits from their expertise.

### 8.4 Knowledge Gathering

A lot of knowledge exists, scattered. Academic papers, industry documentation, open-source projects, forum posts, tribal knowledge in sysadmin communities. This module -- this entire SYS research project -- gathers it into one walkable trail.

The PNW research series is proof that this gathering works. Each module takes scattered knowledge and organizes it into a coherent learning path. The reader follows the trail from basic concepts to deep understanding. The knowledge was always there -- it just needed a trail cut through it.

The same principle applies to compute infrastructure. The knowledge to build community mesh networks, run local GPU compute, implement trust-based access control, and manage resources as a utility -- it all exists. It needs to be gathered, organized, and made accessible. That is what this module does.

---

## 9. Resource Stewardship

The sysadmin is a utility engineer. Reading the meters. Keeping the pressure right. Ensuring fair distribution. Monitoring bandwidth usage. Identifying waste. Allocating resources where they serve a purpose. Not a gatekeeper selling access -- a steward keeping the infrastructure honest.

### 9.1 Reading the Meters

The sysadmin reads the metrics the same way a utility engineer reads the gauges:

```bash
# Bandwidth utilization per interface
$ vnstat -i eth0
                      rx      |     tx      |    total    |   avg. rate
--------------------------+-------------+-------------+---------------
today          12.43 GiB |    8.71 GiB |   21.14 GiB |    1.96 Mbit/s
yesterday      14.21 GiB |    9.88 GiB |   24.09 GiB |    2.27 Mbit/s
this month    287.41 GiB |  198.32 GiB |  485.73 GiB |    1.87 Mbit/s

# Per-connection bandwidth (real-time)
$ iftop -i eth0
                    192.168.1.100  =>  203.0.113.42     12.3Mb  8.41Mb  6.22Mb
                                   <=                    4.12Mb  3.88Mb  2.91Mb
                    192.168.1.100  =>  198.51.100.10     45.2Kb  38.1Kb  33.7Kb
                                   <=                    1.22Mb  980Kb   870Kb

# CPU and memory utilization
$ htop
# Visual, real-time, per-process resource usage

# Disk I/O
$ iostat -x 1
Device     r/s     w/s   rMB/s   wMB/s  %util
nvme0n1   45.2    120.3    2.8     8.4    12.3%
```

These are the meters. They tell the sysadmin:
- How much bandwidth is being consumed and by whom
- Whether the connection is being used efficiently or wasted
- Where resource contention exists
- When capacity planning needs to happen

### 9.2 Identifying Waste

The access logs quantify waste. The sysadmin reads them:

```bash
# Top bandwidth consumers in the last 24 hours
$ vnstat -t -i eth0
# Shows top 10 traffic peaks

# Access log analysis: requests by source
$ awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head
   47832 203.0.113.42      # Known bot: scraping
   12451 198.51.100.10     # Community member: normal usage
    8823 192.0.2.100       # Unknown: probe scanning
    3421 10.0.0.5          # Admin: legitimate
```

47,832 requests from a single IP that is scraping content. That is waste. It consumed bandwidth, CPU, and disk I/O to serve content to an automated scraper that provides no value to the community. The sysadmin blocks it:

```bash
# Block the scraper at the firewall level
nft add rule inet filter input ip saddr 203.0.113.42 drop

# Or rate-limit to 150 baud (trust Level 1)
# using the tc class defined in Section 4
```

### 9.3 Fair Distribution

Stewardship means ensuring that the resource serves everyone on the grid, not just the loudest or the most aggressive. Fair distribution requires active management:

```
Scenario: 1 Gbps connection, 10 community members

Without shaping:
  Aggressive user A: 800 Mbps (80% of pipe)
  9 other users: 22 Mbps each (sharing the remaining 20%)

With trust-based shaping:
  All Level 4 users: guaranteed 80 Mbps each
  Burst: up to 200 Mbps if others are idle
  Total guaranteed: 800 Mbps (80% for community)
  Reserve: 200 Mbps (20% for admin and headroom)
```

Without shaping, the TCP protocol's congestion control rewards aggressive senders. A single user running multiple parallel downloads can saturate the connection, degrading service for everyone else. The sysadmin's traffic shaping creates fairness that TCP alone does not provide.

### 9.4 Monitoring and Alerting

The utility engineer does not wait for a pipe to burst. The sysadmin does not wait for the connection to saturate:

```bash
# Prometheus + Grafana monitoring stack (common setup)

# Alert: bandwidth utilization above 80% for 15 minutes
- alert: HighBandwidthUtilization
  expr: rate(node_network_receive_bytes_total[5m]) * 8 > 800000000
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Bandwidth utilization above 80% ({{ $value | humanize }}bps)"

# Alert: unknown IPs consuming more than 10 Mbps
- alert: UnknownHighBandwidth
  expr: bandwidth_by_trust_level{level="unknown"} > 10000000
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Unknown source consuming {{ $value | humanize }}bps"
```

Proactive monitoring means the sysadmin knows about problems before users report them. The meters are always running. The alerts are always watching. The steward keeps the infrastructure honest by paying attention.

### 9.5 The Steward's Responsibility

The sysadmin as steward has three responsibilities:

1. **Keep the infrastructure running.** Uptime, reliability, performance. The utility delivers service when needed.
2. **Protect the community's resources.** Block waste, manage capacity, enforce fair access. The trust ladder is the mechanism.
3. **Plan for growth.** Monitor trends, anticipate demand, upgrade before saturation. The utility engineer who replaces a pipe before it bursts is better than the one who responds after the flood.

This is not a business model. This is service. The admin pays the bills, maintains the infrastructure, and shares it with the community. The community benefits and, in the mesh model, contributes capacity back. The trust system ensures that the benefit flows to those who participate honestly.

---

## 10. Implementation Architecture

Philosophy without implementation is aspiration. This section bridges the gap between trust-based access principles and running code on real infrastructure.

### 10.1 Where the Trust Variable Lives

The trust level for each connection must be accessible to every layer that makes access decisions -- the firewall, the traffic shaper, the web server, the application. This requires a shared trust database:

```
Trust Database (source of truth):
+------------------+-------+------------+------------------+
| Identity         | Level | Bandwidth  | Last verified    |
+------------------+-------+------------+------------------+
| admin@local      | 5     | 1 Gbps     | always           |
| alice@community  | 4     | 100 Mbps   | 2026-03-08       |
| bob@known        | 3     | 50 Mbps    | 2026-03-01       |
| visitor_7f3a     | 2     | 5 Mbps     | 2026-03-09       |
| *                | 1     | 150 bps    | n/a              |
+------------------+-------+------------+------------------+

Query interface:
  trust_level(ip_address) -> { level, bandwidth_bps, identity }
```

The trust database is queried at multiple layers:

```
Packet arrives at interface
    |
    v
[Firewall] -- query trust DB by source IP
    |          Level 1? Apply 150 bps limit
    |          Level 2-4? Allow, tag with trust level
    v
[Traffic shaper] -- classify into tc class based on trust level
    |               Each level has its HTB class with rate/ceil
    v
[Web server] -- read trust level from header or lookup
    |            Apply per-level rate limiting
    v
[Application] -- enforce content access based on trust level
                  Level 1: welcome page only
                  Level 4: full access
```

### 10.2 Trust-to-Bandwidth Mapping

The configuration that maps trust levels to bandwidth lives in the server configuration, tied to the trust system:

```yaml
# /etc/trust-bandwidth.yaml
# Trust-based bandwidth allocation

trust_levels:
  5:  # Owner/Admin
    rate: "1gbit"
    ceil: "1gbit"
    priority: 0
    qos_class: "EF"
    description: "Full pipe - admin"

  4:  # Trusted community
    rate: "100mbit"
    ceil: "500mbit"
    priority: 1
    qos_class: "AF41"
    description: "High bandwidth - earned trust"

  3:  # Known visitors
    rate: "50mbit"
    ceil: "100mbit"
    priority: 2
    qos_class: "AF21"
    description: "Moderate bandwidth - some history"

  2:  # Identified strangers
    rate: "5mbit"
    ceil: "10mbit"
    priority: 4
    qos_class: "AF11"
    description: "Low bandwidth - identified, no history"

  1:  # Unknown visitors
    rate: "1200bps"     # 150 bytes/sec = 1200 bps
    ceil: "1200bps"
    priority: 7
    qos_class: "BE"
    description: "150 baud - unknown, earn trust to get more"

global:
  interface: "eth0"
  total_bandwidth: "1gbit"
  monitoring: true
  log_level: "info"
```

### 10.3 Rate Limiting Middleware

At the application layer, a middleware component reads the trust level and applies rate limits:

```
Request flow:

Client -> [TLS termination] -> [Trust lookup] -> [Rate limiter] -> [Application]
                                    |                  |
                                    v                  v
                              Trust database      Rate limit state
                              (Level 1-5)         (token bucket per client)
```

The middleware pattern:

1. Extract client identity (IP, certificate, session token)
2. Query trust database for trust level
3. Check rate limit state for this client
4. If within limits: pass request to application, decrement tokens
5. If over limits: return 429 (Too Many Requests) with Retry-After header
6. Log the decision (for monitoring and stewardship metrics)

### 10.4 Trust Changes and Bandwidth Updates

When a visitor's trust level changes -- either promotion (earned trust) or demotion (violated trust) -- the bandwidth allocation must update:

```
Trust promotion event:
  visitor_7f3a promoted from Level 2 to Level 3

1. Trust database updated: level 2 -> 3
2. tc class migration: move from 1:20 (5 Mbps) to 1:15 (50 Mbps)
3. nginx rate zone migration: "identified" -> "known"
4. Application access expanded: additional content unlocked
5. Audit log: "visitor_7f3a promoted to Level 3 by alice@community"
```

The promotion is not instant -- it requires a trusted community member to vouch for the visitor. The demotion can be instant -- if a Level 3 user starts scraping or attacking, the admin drops them to Level 1 immediately. Trust takes time to build and seconds to lose. This asymmetry is deliberate.

### 10.5 Monitoring the Trust Distribution

The sysadmin monitors not just bandwidth but the trust distribution itself:

```
Trust distribution dashboard:

Level 5 (Admin):       1 entity    | 1 Gbps allocated
Level 4 (Trusted):     8 entities  | 800 Mbps allocated
Level 3 (Known):      15 entities  | 750 Mbps allocated
Level 2 (Identified): 42 entities  | 210 Mbps allocated
Level 1 (Unknown):   ~200/day      | 240 Kbps total

Total allocated: 2.76 Gbps (oversubscribed 2.76:1)
Actual usage:    ~400 Mbps average, 800 Mbps peak
Headroom:        200 Mbps guaranteed

Oversubscription works because not everyone uses their allocation
simultaneously. Same principle as ISP bandwidth planning.
```

The trust distribution tells the sysadmin about the community: how many people are at each level, whether promotions are happening, whether the community is growing. A healthy community has a pyramid shape -- many Level 1 visitors, some Level 2-3 progressing, a core group at Level 4. If Level 1 traffic suddenly spikes, something is attracting unwanted attention. If Level 4 is empty, the community is not growing.

### 10.6 The Technical-Philosophical Bridge

Every technical decision in this section maps to a philosophical principle:

| Technical mechanism | Philosophical principle |
|--------------------|----------------------|
| HTB traffic classes | Trust controls access |
| 150 bps default rate | Unknown strangers earn their way in |
| Token bucket burst | Brief needs are accommodated gracefully |
| QoS marking | Critical traffic is protected |
| Rate limit 429 response | Honest feedback when limits are reached |
| Trust database | Single source of truth for relationships |
| Audit logging | The trail is always maintained |
| Oversubscription | Share abundance, not scarcity |

The implementation is not a separate concern from the philosophy. The configuration file IS the philosophy, expressed in YAML instead of English. The tc rules ARE the trust ladder, expressed in queuing disciplines instead of paragraphs. The code is the principle, running.

---

## 11. Cross-References

### Internal Module References

- **[Module 02: The Network](02-the-network.md)** -- Network fundamentals that underpin bandwidth management. TCP/IP, routing, DNS, the protocols that carry the traffic being shaped.
- **[Module 03: The Logs](03-the-logs.md)** -- Access logs as the primary record of who used what bandwidth when. The access log is the bandwidth meter's receipt.
- **[Module 07: Security Operations](07-security-operations.md)** -- Security as the enforcement mechanism for trust boundaries. Firewalls, intrusion detection, and incident response as trust-system enforcement.

### Cross-Series References

- **[SHE Module 3: Connectivity & Protocols](../SHE/research/03-connectivity-protocols.md)** -- MQTT QoS levels (0, 1, 2) as a trust-like graduated delivery guarantee. QoS in IoT protocols maps to the same principle: more assurance costs more resources.
- **[SHE Module 6: Safety Standards](../SHE/research/06-safety-standards.md)** -- VLAN segmentation as trust-zone isolation. Physical network separation mirrors the logical trust boundaries described in this module.
- **[BRC Trust System](../BRC/)** -- The trust ladder in this module is the same trust architecture used for camp access, federation, and the stamp system. Bandwidth allocation is one more resource gated by the same web of trust.

### Glossary Links

Key terms used in this module are defined in the [Glossary](00-glossary.md): Bandwidth, Throughput, Latency, QoS, Rate limiting, Throttling, Firewall, VLAN, Trust level, Permission bits, ACL, Authentication, Authorization, Principle of least privilege.

---

## 12. Sources

### Standards and Specifications

1. **RFC 2475** -- "An Architecture for Differentiated Services." Blake, S., et al., 1998. Defines the DiffServ framework for QoS classification, including DSCP code points and per-hop behaviors. https://www.rfc-editor.org/rfc/rfc2475

2. **RFC 2697** -- "A Single Rate Three Color Marker." Heinanen, J., Guerin, R., 1999. Defines the token bucket metering algorithm used in traffic classification. https://www.rfc-editor.org/rfc/rfc2697

3. **RFC 2698** -- "A Two Rate Three Color Marker." Heinanen, J., Guerin, R., 1999. Defines the dual-rate token bucket used in HTB-style traffic shaping. https://www.rfc-editor.org/rfc/rfc2698

4. **IEEE 802.11s** -- "IEEE Standard for Information Technology — Mesh Networking." Amendment to 802.11 defining mesh station operation, path selection, and mesh peering management.

### Linux Documentation

5. **Linux Traffic Control (tc)** -- "Linux Advanced Routing & Traffic Control HOWTO." https://lartc.org/ -- Comprehensive guide to tc, HTB, qdisc configuration, and traffic shaping on Linux.

6. **Linux HTB (Hierarchical Token Bucket)** -- Devik, M., "HTB Linux Queuing Discipline Manual." https://linux.die.net/man/8/tc-htb -- Configuration reference for HTB classes, rates, and ceilings.

7. **nftables Wiki** -- "nftables — Packet Classification Framework." https://wiki.nftables.org/ -- Configuration and usage of the modern Linux firewall framework.

8. **nginx Rate Limiting** -- "Module ngx_http_limit_req_module." https://nginx.org/en/docs/http/ngx_http_limit_req_module.html -- Request rate limiting in nginx using leaky bucket algorithm.

### Community Networking

9. **Freifunk** -- German community mesh networking initiative. Open-source firmware and protocols for building community-owned wireless networks. https://freifunk.net/ -- Operational since 2003, one of the largest community mesh networks globally.

10. **NYC Mesh** -- Community-owned mesh network serving New York City. Provides internet access without ISP dependence using rooftop antennas and mesh protocols. https://www.nycmesh.net/

11. **Guifi.net** -- Community telecommunications network in Catalonia, Spain. Over 35,000 active nodes, one of the largest mesh networks in the world. Demonstrates that community-owned infrastructure scales. https://guifi.net/

12. **Meshtastic** -- Open-source LoRa mesh networking project for off-grid communication. Long-range (1-10 km), low-power, no internet required. https://meshtastic.org/

### Mesh Protocols

13. **batman-adv (Better Approach to Mobile Ad-hoc Networking)** -- Layer 2 mesh protocol implemented as a Linux kernel module. https://www.open-mesh.org/projects/batman-adv/wiki

14. **Babel** -- "The Babel Routing Protocol." Chroboczek, J., RFC 8966, 2021. A distance-vector routing protocol designed for heterogeneous mesh networks. https://www.rfc-editor.org/rfc/rfc8966

15. **Yggdrasil Network** -- Encrypted, self-arranging mesh network overlay. Provides end-to-end encrypted IPv6 connectivity without central infrastructure. https://yggdrasil-network.github.io/

16. **cjdns** -- Encrypted IPv6 mesh networking protocol using public-key cryptography for address allocation. https://github.com/cjdelisle/cjdns

### Rate Limiting and Traffic Engineering

17. **Turner, J.S.** -- "New Directions in Communications (or Which Way to the Information Age?)." *IEEE Communications Magazine*, Vol. 24, No. 10, 1986. Early articulation of the leaky bucket algorithm for traffic shaping.

18. **Floyd, S. and Jacobson, V.** -- "Random Early Detection Gateways for Congestion Avoidance." *IEEE/ACM Transactions on Networking*, Vol. 1, No. 4, 1993. Foundation of active queue management in traffic engineering.

### Public Infrastructure and Utility Models

19. **Crawford, Susan** -- *Fiber: The Coming Tech Revolution — and Why America Might Miss It.* Yale University Press, 2018. Analysis of broadband as utility infrastructure and the consequences of treating it as a commercial product.

20. **Benkler, Yochai** -- *The Wealth of Networks: How Social Production Transforms Markets and Freedom.* Yale University Press, 2006. Theoretical framework for peer production and commons-based resource sharing.

21. **Ostrom, Elinor** -- *Governing the Commons: The Evolution of Institutions for Collective Action.* Cambridge University Press, 1990. Nobel Prize-winning analysis of how communities successfully manage shared resources without privatization or government control. The foundational text for community-managed infrastructure.

### Energy and Computing

22. **International Energy Agency** -- "Data Centres and Data Transmission Networks." IEA Energy Technology Perspectives, 2024. Analysis of global data center energy consumption and projections. https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks

23. **NVIDIA RTX 4060 Ti Specifications** -- Official specifications and power consumption data. https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/

### Further Reading

24. **Hasan, Samiul et al.** -- "Community Networks: A Survey." *ACM Computing Surveys*, 2023. Comprehensive survey of community-owned network infrastructure, governance models, and sustainability.

25. **De Filippi, P. and Tréguer, F.** -- "Wireless Community Networks: Towards a Public Policy for the Network Commons." In *Net Neutrality Compendium*, Springer, 2016. Policy framework for treating community networks as commons infrastructure.

---

*Infrastructure is a utility. Trust controls access. Waste is the enemy. The sysadmin is not a gatekeeper -- the sysadmin is a utility engineer, reading the meters, keeping the pressure right, ensuring fair distribution. The pipe is the pipe. You pay for what you use. Nobody injects advertisements into your water supply. Nobody throttles your electricity to sell you a premium plan. The model is proven by every utility that already works. We just need to apply it to compute and bandwidth. The infrastructure exists. The knowledge exists. The trail is right here.*
