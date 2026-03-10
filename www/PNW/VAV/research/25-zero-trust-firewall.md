# M20: Zero Trust, Proxy, and Firewall Architecture

**Module 20 of the Voxel as Vessel research atlas.**
Zero trust is the security philosophy that completes the sovereign world stack. Every module before this one built isolation — Keystone projects, CephX keyrings, Neutron security groups, LUKS encryption, msgr2 mutual TLS. This module names the framework those primitives implement, fills the gaps they leave, and places a firewall architecture around the entire deployment. The principle is simple: never trust, always verify. Every access request is evaluated against policy. Every session is continuously re-authenticated. Every network zone enforces explicit allow rules with implicit deny. The sovereign world does not assume any layer beneath it is safe — it verifies, at every boundary, that the request is authorized, the identity is current, and the data path is encrypted.

---

## 1. Zero Trust Principles (NIST SP 800-207)

### 1.1 The Paradigm Shift

Traditional perimeter security operates on "trust but verify" — once a request crosses the firewall, it is trusted. Zero trust inverts this: **never trust, always verify**. The perimeter dissolves. Every resource, every access request, every session is evaluated independently of network location.

NIST Special Publication 800-207 (August 2020) codifies the zero trust architecture into a logical framework with three core components:

**Policy Decision Point (PDP).** The PDP evaluates every access request against a set of policies. It considers:
- **Identity:** Who is requesting access? Authenticated via what mechanism? Multi-factor?
- **Device posture:** Is the requesting device compliant? Patched? Managed? Compromised?
- **Network location:** Where is the request originating? Internal network? Public internet? VPN?
- **Resource classification:** What is being accessed? Public data? PII? Sovereign world state?
- **Behavioral signals:** Does this access pattern match the user's historical behavior? Is the request anomalous in timing, volume, or scope?

The PDP does not enforce its decision — it computes it. The enforcement is delegated.

**Policy Enforcement Point (PEP).** The PEP intercepts every access request before it reaches the resource. It queries the PDP, receives an allow/deny decision, and enforces it. The PEP is implemented as a proxy, gateway, sidecar, or endpoint agent depending on the deployment model. The critical property: **no request bypasses the PEP**. If a path exists from client to resource that does not traverse the PEP, the zero trust model is broken.

**Continuous Authentication.** Traditional authentication happens once — at login. Zero trust authentication happens continuously. The Continuous Access Evaluation Profile (CAEP), defined by the OpenID Foundation's Shared Signals and Events Working Group, propagates security events to resource servers in real time:

- User revoked → all active sessions terminated immediately
- Device compliance changes → session re-evaluated
- Location anomaly detected → step-up authentication required
- Token expiry → re-authentication before next request

CAEP replaces the long-lived session token with a continuously validated assertion. The session is not "established" — it is "continuously permitted."

### 1.2 CISA Zero Trust Maturity Model v2.0

The Cybersecurity and Infrastructure Security Agency (CISA) published the Zero Trust Maturity Model version 2.0 in April 2023, defining five pillars of zero trust adoption:

| Pillar | Scope | What It Covers |
|--------|-------|----------------|
| **Identity** | Users, service accounts, API keys | Authentication, authorization, identity governance, MFA, least-privilege roles |
| **Devices** | Endpoints, servers, IoT, VMs | Device inventory, compliance posture, patch status, endpoint detection |
| **Networks** | Segments, zones, traffic flows | Microsegmentation, encrypted DNS, traffic inspection, network access control |
| **Applications & Workloads** | Software, containers, serverless | Application security testing, runtime protection, API gateways, supply chain |
| **Data** | At rest, in transit, in use | Classification, encryption, DLP, access logging, retention policies |

Each pillar is assessed across four maturity levels: **Traditional** (perimeter-based), **Initial** (some automation), **Advanced** (centralized visibility and policy), **Optimal** (continuous, real-time, adaptive). The model is not prescriptive about technology — it describes capabilities. An organization at "Advanced" in Identity but "Traditional" in Data has a clear gap to close.

### 1.3 DoD Zero Trust Reference Architecture v2.0

The Department of Defense Zero Trust Reference Architecture version 2.0 (September 2022) extends the CISA model to seven pillars by adding:

6. **Automation & Orchestration:** Policy-as-code, SOAR playbooks, automated response to security events
7. **Visibility & Analytics:** SIEM, UEBA, continuous monitoring, threat intelligence feeds

The DoD architecture emphasizes that zero trust is not a product — it is a strategy. No single vendor solution implements all seven pillars. The architecture is assembled from components, each addressing specific pillars, integrated through policy engines and event buses.

### 1.4 Economic Incentive

The IBM 2024 Cost of a Data Breach report found the global average breach cost at **$4.88 million** — a 10% increase from 2023 and the highest on record. Organizations with mature zero trust deployments reported breach costs 46% lower than those without. Gartner projects that by 2026, 10% of large enterprises will have a mature, measurable zero trust program, up from less than 1% in 2022. The gap between the 10% who implement and the 90% who do not represents an enormous risk surface.

The economic argument for zero trust in gaming infrastructure is the same as in enterprise: a compromised sovereign world is a data breach. Player data, world state, operator credentials — all protected by the same principles that protect financial records and health data. The cost of a breach is measured in trust, not just dollars.

---

## 2. Proxy Architectures

### 2.1 Comprehensive Taxonomy

A proxy is an intermediary that intercepts communication between two parties. Every proxy type serves a specific security or performance function, and the VAV architecture uses several.

| Proxy Type | Function | Use Case | VAV Relevance |
|---|---|---|---|
| **Forward proxy** | Client-side; hides client identity from server; caches responses | Corporate web filtering, anonymization | Minecraft client → forward proxy → internet (optional, client-side) |
| **Reverse proxy** | Server-side; sits in front of origin server; load balancing, TLS termination, caching | nginx, HAProxy in front of game servers | nginx in DMZ terminates TLS for S3/RGW and Minecraft connections |
| **Transparent proxy** | Intercepts traffic without client configuration; operates at network layer | ISP traffic shaping, captive portals | Not used in VAV (explicit proxy model preferred for auditability) |
| **Identity-aware proxy** | Enforces authentication and device posture per request; integrates with identity provider | BeyondCorp, Cloudflare Access, Microsoft Entra Private Access | **Velocity proxy** with Keystone integration — authenticates every player connection |
| **CASB** (Cloud Access Security Broker) | Discovers, monitors, and controls SaaS usage; enforces DLP policies | Shadow IT governance, compliance | Relevant for operators using third-party Minecraft management SaaS |
| **Break-and-inspect** | TLS termination + deep content inspection + re-encryption | WAF, DLP, anti-malware inline scanning | DMZ inspection of Minecraft protocol for exploit detection |

### 2.2 The Velocity Proxy as Identity-Aware Gateway

In the VAV architecture, the Velocity proxy (M10) is not merely a load balancer. It is the **Policy Enforcement Point** for player access. Every player connection enters through Velocity. Velocity:

1. **Authenticates** the player against the Keystone identity backend (or a JWT-based assertion)
2. **Evaluates** the player's role within the target world's project scope
3. **Routes** the connection to the correct backend Minecraft server
4. **Monitors** the session for anomalous behavior (rapid world-hopping, impossible teleportation, protocol violations)
5. **Terminates** the session if the JWT expires and cannot be refreshed

This makes Velocity the PEP. The PDP is the Keystone policy evaluation combined with the Velocity plugin's rule engine. The continuous authentication mechanism is JWT token refresh with a 15-minute expiry window.

### 2.3 The nginx Reverse Proxy in the DMZ

The DMZ-facing nginx instance handles all external traffic before it enters the application zone:

- **TLS termination** for HTTPS connections to the S3/RGW endpoint
- **Rate limiting** to prevent DDoS against the Minecraft port
- **Protocol validation** to reject malformed packets before they reach Velocity
- **Access logging** for forensic analysis and anomaly detection
- **Geographic filtering** (optional) to restrict connections by source country

nginx does not authenticate players — that is Velocity's role. nginx filters at the network and transport layer; Velocity filters at the application and identity layer. Defense in depth: two proxies, two layers, two failure modes.

---

## 3. Firewall Types and Zones

### 3.1 Firewall Type Taxonomy

Five categories of firewall technology, each operating at a different layer of the OSI model:

**1. Packet Filter (Stateless).** Matches on source/destination IP, port, and protocol. No connection state tracking. Implemented in the Linux kernel via `iptables` FORWARD chain or `nftables`. Extremely fast — operates at line rate on commodity hardware. Blind to session context: cannot distinguish between a new connection and a return packet for an established flow. Used for coarse-grained perimeter filtering.

**2. Stateful Inspection (SPI).** Tracks a connection table (conntrack in Linux). Allows return traffic only for established flows. This is the Linux default for server firewalls — `iptables` with `conntrack` module or `nftables` with `ct state`. The connection table associates each TCP flow with its state (NEW, ESTABLISHED, RELATED, INVALID). Return packets are permitted only if they match an established flow. This prevents spoofed source-IP attacks from eliciting responses.

```bash
# Example: nftables stateful firewall rule
nft add rule inet filter forward ct state established,related accept
nft add rule inet filter forward ct state invalid drop
nft add rule inet filter forward tcp dport 25565 accept  # Minecraft
nft add rule inet filter forward drop  # Default deny
```

**3. Application-Layer Firewall (WAF).** Deep packet inspection at Layer 7. Understands HTTP/HTTPS (after TLS termination), SQL injection patterns, cross-site scripting (XSS), and protocol-specific attack signatures. ModSecurity with the OWASP Core Rule Set (CRS) is the canonical open-source implementation. In the VAV context, a WAF inspects HTTP requests to the RGW S3 API — detecting injection attempts in bucket names, oversized headers, and malformed multipart uploads.

**4. Next-Generation Firewall (NGFW).** Combines stateful inspection, application awareness, intrusion prevention (IPS), user identity integration, and SSL inspection in a single appliance. Vendors: Palo Alto Networks, Fortinet FortiGate, Check Point. NGFWs identify applications by behavior rather than port number — they can distinguish Minecraft traffic from HTTP traffic on port 443. Relevant for organizations running VAV infrastructure behind a corporate NGFW.

**5. SASE (Secure Access Service Edge).** Cloud-native convergence of SD-WAN, Secure Web Gateway (SWG), CASB, Firewall-as-a-Service (FWaaS), and Zero Trust Network Access (ZTNA). Enforces policy at the network edge regardless of user location. SASE is the target architecture for multi-site VAV federations where players and world operators connect from diverse networks over the public internet. The SASE provider becomes the PEP for all inter-site traffic.

### 3.2 Network Segmentation: The 4-Zone Model

Network segmentation for Ceph/OpenStack VAV deployments follows a 4-zone model. Each zone has a specific trust level, and traffic between zones is explicitly permitted or denied.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        4-ZONE ARCHITECTURE                          │
│                                                                     │
│  ┌───────────┐     ┌──────────────────────────────────────────┐    │
│  │ INTERNET  │────▶│  ZONE 1: DMZ                              │    │
│  │ (untrusted)│     │  nginx reverse proxy                      │    │
│  └───────────┘     │  RGW S3 endpoint                          │    │
│                     │  TLS termination, rate limiting            │    │
│                     └──────────────┬───────────────────────────┘    │
│                                    │                                │
│                                    ▼                                │
│                     ┌──────────────────────────────────────────┐    │
│                     │  ZONE 2: APPLICATION                      │    │
│                     │  Velocity proxy                           │    │
│                     │  Minecraft servers (Paper/Folia)          │    │
│                     │  MultiPaper-Master                        │    │
│                     └──────────────┬───────────────────────────┘    │
│                                    │                                │
│                                    ▼                                │
│                     ┌──────────────────────────────────────────┐    │
│                     │  ZONE 3: STORAGE                          │    │
│                     │  Ceph OSD nodes                           │    │
│                     │  Ceph MON/MGR nodes                       │    │
│                     │  PostgreSQL (world metadata)              │    │
│                     └──────────────┬───────────────────────────┘    │
│                                    │                                │
│                                    ▼                                │
│                     ┌──────────────────────────────────────────┐    │
│                     │  ZONE 4: MANAGEMENT                       │    │
│                     │  IPMI / iDRAC (out-of-band)              │    │
│                     │  Ceph dashboard                           │    │
│                     │  OpenStack Horizon                        │    │
│                     │  Monitoring (Prometheus, Grafana)         │    │
│                     └──────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Zone Traffic Rules

Each zone boundary enforces explicit allow rules with implicit deny-all default:

```
# ─────────────────────────────────────────────────────────────────
# Internet → DMZ (Zone 1)
# ─────────────────────────────────────────────────────────────────
ALLOW  TCP 443    (HTTPS — S3 API, web console)
ALLOW  TCP 25565  (Minecraft protocol — player connections)
DENY   ALL        (everything else dropped at perimeter)

# ─────────────────────────────────────────────────────────────────
# DMZ → Application (Zone 2)
# ─────────────────────────────────────────────────────────────────
ALLOW  TCP 8080   (proxy protocol — nginx to Velocity)
ALLOW  TCP 4803   (Velocity internal port)
DENY   ALL        (DMZ cannot reach storage or management)

# ─────────────────────────────────────────────────────────────────
# Application → Storage (Zone 3)
# ─────────────────────────────────────────────────────────────────
ALLOW  TCP 6789   (Ceph MON — monitor cluster communication)
ALLOW  TCP 6800-7300  (Ceph OSD — data read/write)
ALLOW  TCP 5432   (PostgreSQL — world metadata queries)
DENY   ALL        (application servers cannot reach management)

# ─────────────────────────────────────────────────────────────────
# Storage ↔ Storage (Zone 3 internal)
# ─────────────────────────────────────────────────────────────────
ALLOW  TCP 3300   (msgr2 — Ceph messenger v2, encrypted)
ALLOW  TCP 6800-7300  (OSD-to-OSD replication)
# All storage-internal traffic uses msgr2 with mutual TLS

# ─────────────────────────────────────────────────────────────────
# ALL → Management (Zone 4)
# ─────────────────────────────────────────────────────────────────
DENY   ALL        (management-only VLAN, out-of-band access only)
# Access to Zone 4 requires:
#   1. Physical presence on management VLAN, OR
#   2. VPN tunnel from authorized operator workstation
#   3. MFA authentication to jump host
# No production traffic traverses Zone 4. Ever.
```

### 3.4 Why Four Zones

The 4-zone model prevents a single compromise from cascading:

- **DMZ compromise** (nginx exploited): attacker reaches Zone 2 but not Zone 3 or 4. Velocity re-authenticates all connections — the attacker must present valid Keystone credentials to proceed.
- **Application compromise** (Minecraft server exploited): attacker reaches Zone 3 but only via Ceph client protocol. CephX keyring limits access to a single world's namespace. Attacker cannot read other worlds, cannot reach management.
- **Storage compromise** (OSD node exploited): attacker has access to ciphertext (LUKS encryption). Without the LUKS key (stored in Barbican, Zone 2/4), the data is unreadable. Attacker cannot reach management.
- **Management compromise** (most severe): attacker has infrastructure control. This is why Zone 4 is air-gapped from production traffic and accessible only via out-of-band channels with MFA.

Each zone boundary is a **blast radius limiter**. The attacker must chain exploits across multiple zone boundaries, each defended by a different technology (nginx WAF, Velocity auth, CephX, LUKS, VLAN isolation).

---

## 4. Mapping Zero Trust to Ceph/OpenStack

### 4.1 Existing ZT Primitives in the v2 Architecture

The sovereign world architecture built across M10-M13 already implements many zero trust primitives, though they were not designed under the ZT label. Naming them correctly is the first step toward maturity assessment:

| ZT Primitive | VAV Implementation | Module Reference |
|---|---|---|
| Identity domain boundary | Keystone project per world | M11 Section 1 |
| Least-privilege data access | CephX keyrings with namespace caps | M11 Section 6, M13 Section 4 |
| Data-at-rest trust boundary | LUKS encryption above RBD layer | M11 Section 6.4, M13 Section 5 |
| Data-in-transit trust boundary | msgr2 mutual TLS (Ceph messenger v2) | M17 Section 3, M18 Section 2 |
| Microsegmentation (PEP at VM NIC) | OpenStack Neutron security groups | M11 Section 1.2 |
| Authentication gateway | Velocity proxy with Keystone integration | M10 Section 2 |
| Role-based access control | Keystone roles: world-owner, operator, player, spectator | M11 Section 4 |
| Backup encryption | BorgBackup with authenticated encryption | M13 Section 5 |

These primitives are real and enforced — but they were built incrementally. The zero trust framework names them as parts of a whole and reveals the gaps.

### 4.2 Gap Analysis

**Gap 1: Continuous Session Validation (CAEP Equivalent)**

Current state: A player authenticates once through Velocity when connecting. The session persists until the player disconnects or the server restarts. If the player's Keystone token is revoked (e.g., operator removes the player's role), the active session continues until natural termination.

Required state: Velocity should validate the player's JWT token at every significant action boundary — world change, chunk region crossing, inventory access. Token expiry should be 15 minutes. When the token expires, Velocity sends a refresh request to Keystone. If Keystone denies the refresh (token revoked, role changed, project disabled), Velocity terminates the session with a graceful disconnect message.

```
Player Session Lifecycle (Zero Trust Model):

  Connect → Velocity authenticates against Keystone
         → JWT issued (15-minute TTL)
         → Player enters world

  Every 15 minutes:
    Velocity → Keystone: refresh token for player UUID
    Keystone → Velocity: new JWT (success) OR deny (revoked)

    If denied:
      Velocity → Player: "Session expired. Please reconnect."
      Velocity → closes backend connection
      Velocity → logs event: SESSION_REVOKED, player UUID, world UUID, timestamp

    If success:
      Velocity → updates session token
      Player → continues playing (seamless, no interruption)
```

**Gap 2: Device Posture for Minecraft Clients**

Current state: Any Minecraft client that presents valid credentials can connect. No check on client version, modification status, or device health.

Required state: Velocity plugin checks client version, rejects known-exploitable versions, and optionally validates client-side integrity (mod signature verification for modded servers). This is "Advanced" maturity in the Devices pillar — full device posture assessment is impractical for game clients, but version validation closes the most critical attack surface.

**Gap 3: Per-Chunk-Region Microsegmentation**

Current state: Neutron security groups operate at the VM NIC level — all traffic to a world's VM is either permitted or denied as a unit.

Required state: Within a world, chunk regions could be segmented by access level. Public regions (spawn area) are readable by all players. Private regions (operator-only builds) require elevated role. This is application-layer segmentation implemented in the Minecraft server plugin, not at the network layer — but it maps to the Networks pillar of the CISA model.

**Gap 4: Application-Layer Inspection at Proxy**

Current state: Velocity routes Minecraft protocol packets without deep inspection of their content.

Required state: A Minecraft-protocol-aware inspection layer (analogous to a WAF for HTTP) that detects exploit packets, oversized NBT payloads, and protocol violations before they reach the backend server. This requires a custom protocol parser — the Minecraft protocol is not HTTP, and no off-the-shelf WAF handles it. The inspection layer operates between nginx (Zone 1) and Velocity (Zone 2).

**Gap 5: Per-Object Encryption in Squid (RGW)**

Current state: Data-at-rest encryption is handled by LUKS at the VM volume level. Objects stored in RGW (S3 buckets for resource packs and backups) rely on the Ceph cluster's disk-level encryption.

Required state: Server-Side Encryption with Customer-Managed Keys (SSE-CMK) in RGW. Each world's S3 bucket objects are encrypted with a key stored in Barbican, unique to the world owner. Even if the RGW service is compromised, objects from different worlds cannot be cross-read without the per-world key.

### 4.3 CISA Five-Pillar Maturity Assessment

The following table maps each CISA pillar to specific VAV components, assesses current maturity, and identifies the gap to close:

| Pillar | VAV Component | v2 Foundation | Current Maturity | Gap to Close | Target Maturity |
|---|---|---|---|---|---|
| **Identity** | CephX keyrings, Keystone RBAC | M11 Section 4, M13 Section 4 | Traditional | Continuous session validation (CAEP); JWT 15-min refresh via Velocity | Advanced |
| **Devices** | Nova instances, Minecraft clients | M11 Section 2 | Advanced | Device posture check for Minecraft client version at Velocity | Advanced |
| **Networks** | Neutron security groups, 4-zone model | M11 Section 3 | Advanced | Per-chunk-region microsegmentation within world servers | Optimal |
| **Applications** | Minecraft server processes, Velocity proxy | M10 Section 2 | Initial | Application-layer protocol inspection at proxy (Minecraft WAF) | Advanced |
| **Data** | RADOS pool ACLs, LUKS encryption | M11 Section 4, M13 Section 5 | Advanced | Per-object SSE-CMK encryption in RGW (Squid) | Optimal |

**Reading the table:** "Traditional" means perimeter-based with no ZT concepts. "Initial" means some ZT mechanisms exist but are not centrally managed. "Advanced" means centralized policy with automated enforcement. "Optimal" means continuous, adaptive, real-time policy evaluation across the pillar.

The VAV architecture is strongest in Networks and Data (both at Advanced, close to Optimal) because Ceph and OpenStack were designed for multi-tenant isolation. It is weakest in Applications (Initial) because Minecraft protocol inspection requires custom tooling that does not yet exist. Identity is at Traditional because authentication is one-shot at connection time — the CAEP gap is the most critical to close.

### 4.4 DoD Seven-Pillar Extension

The DoD model adds two pillars that map cleanly to existing VAV infrastructure:

| DoD Pillar | VAV Component | Status |
|---|---|---|
| **Automation & Orchestration** | OpenStack Heat templates for world provisioning (M11 Section 3); Ansible playbooks for Ceph deployment | Advanced — provisioning is automated, but incident response playbooks are manual |
| **Visibility & Analytics** | Prometheus metrics from Ceph MGR; Grafana dashboards; OpenStack Ceilometer; Velocity session logs | Advanced — metrics are collected, but UEBA (User and Entity Behavior Analytics) for player sessions is not implemented |

The seven-pillar model reinforces the same conclusion: the infrastructure layer (Ceph, OpenStack, Neutron) provides strong ZT foundations. The application layer (Minecraft protocol, player session management) is where maturity must improve.

---

## 5. Implementing Continuous Authentication

### 5.1 JWT Token Architecture

The continuous authentication gap (Section 4.2, Gap 1) is the highest-priority zero trust improvement. The implementation uses JSON Web Tokens (JWT) with short expiry, issued by a Velocity plugin that integrates with Keystone.

```
JWT Payload (claims):
{
  "sub": "player-uuid-a1b2c3d4",          // Keystone user UUID
  "iss": "keystone.vav.local",             // Issuer: Keystone service
  "aud": "velocity.vav.local",             // Audience: Velocity proxy
  "iat": 1741564800,                       // Issued at: Unix timestamp
  "exp": 1741565700,                       // Expires: iat + 900 (15 minutes)
  "project": "world-a1b2c3d4-e5f6-...",   // Keystone project (world)
  "roles": ["player"],                      // Keystone roles in this project
  "world_ns": "a1b2c3d4",                  // Ceph namespace (for audit)
  "session_id": "sess-xyz-789"             // Unique session identifier
}
```

**Signing:** RS256 (RSA-SHA256) with Keystone's private key. Velocity validates with Keystone's public key, which is cached and rotated on a 24-hour cycle.

**Refresh flow:**

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  Player   │         │   Velocity    │         │   Keystone    │
│  Client   │         │   Proxy       │         │   Identity    │
└─────┬─────┘         └──────┬───────┘         └──────┬───────┘
      │                      │                        │
      │  Connect (username)  │                        │
      │─────────────────────▶│                        │
      │                      │  Authenticate          │
      │                      │───────────────────────▶│
      │                      │  JWT (15-min TTL)      │
      │                      │◀───────────────────────│
      │  Welcome to world    │                        │
      │◀─────────────────────│                        │
      │                      │                        │
      │  ... gameplay ...    │                        │
      │                      │                        │
      │                      │  [Timer: 14 minutes]   │
      │                      │  Refresh token         │
      │                      │───────────────────────▶│
      │                      │  New JWT (success)     │
      │                      │◀───────────────────────│
      │                      │                        │
      │  ... gameplay ...    │  [Seamless, no         │
      │                      │   interruption]        │
      │                      │                        │
      │                      │  [Timer: 14 minutes]   │
      │                      │  Refresh token         │
      │                      │───────────────────────▶│
      │                      │  DENY (role revoked)   │
      │                      │◀───────────────────────│
      │  Session expired     │                        │
      │◀─────────────────────│                        │
      │  [Disconnect]        │                        │
```

### 5.2 Graceful Degradation

Edge case E-06 from the mission package: "Zero trust session expiry during an active Minecraft game session (player mid-fight); graceful degradation path?"

The answer: **grace period with read-only mode.** When a token refresh fails:

1. Velocity marks the session as "expiring" (not immediately terminated)
2. The player receives an in-game message: "Session expiring in 60 seconds. Save your progress."
3. During the grace period, the player can continue to observe but cannot modify world state (read-only mode enforced by the backend server plugin)
4. After 60 seconds, the session terminates with a disconnect

This prevents the frustration of instant disconnection during combat while still enforcing the zero trust principle. The grace period is configurable (default 60 seconds, minimum 0, maximum 300). Setting it to 0 provides immediate termination for high-security deployments.

### 5.3 Session Event Logging

Every session lifecycle event is logged for forensic analysis:

| Event | Fields | Storage |
|---|---|---|
| `SESSION_START` | player_uuid, world_uuid, source_ip, jwt_id, timestamp | Velocity log + PostgreSQL |
| `TOKEN_REFRESH` | player_uuid, old_jwt_id, new_jwt_id, timestamp | Velocity log |
| `TOKEN_DENIED` | player_uuid, world_uuid, reason (revoked/expired/role_changed), timestamp | Velocity log + PostgreSQL + alert |
| `SESSION_END` | player_uuid, world_uuid, duration_seconds, reason (voluntary/expired/kicked), timestamp | Velocity log + PostgreSQL |
| `GRACE_PERIOD_START` | player_uuid, world_uuid, grace_seconds, timestamp | Velocity log |

Logs are retained for 90 days in PostgreSQL (Zone 3) and 7 days in Velocity's local structured log. The `TOKEN_DENIED` event triggers an alert to the world operator via webhook (configurable: Discord, Slack, email).

---

## 6. Minecraft/Ceph Zero Trust Mapping

### 6.1 Component Isomorphism

Every zero trust concept maps to a specific VAV component. This is the security layer of the isomorphism that runs through the entire research atlas:

| Zero Trust Concept | VAV Implementation | How It Works |
|---|---|---|
| **PDP** (Policy Decision Point) | Velocity proxy plugin + Keystone policy evaluation | Velocity queries Keystone for each access decision; Keystone evaluates project scope, user roles, token validity |
| **PEP** (Policy Enforcement Point) | RGW bucket policy at S3 API layer | Every S3 request (resource pack download, backup upload) is checked against bucket policy before object access |
| **Continuous authentication** | JWT token refresh every 15 minutes via Velocity plugin | Session is re-validated against Keystone at regular intervals; revocation propagates within 15 minutes maximum |
| **Firewall zones** | 4-zone Ceph/OpenStack network segmentation | Internet → DMZ → Application → Storage → Management; each boundary enforces explicit allow with implicit deny |
| **Microsegmentation** | Neutron security groups per world VM | Each sovereign world's VM has its own security group; cross-world traffic is impossible without explicit VPN tunnel |
| **Identity domain** | Keystone project per world | The project UUID is the identity boundary; all resources within the project are sovereign to that world |
| **Least-privilege access** | CephX keyrings with namespace-scoped capabilities | Each world's keyring can only access its own namespace in the RADOS pool; OSD-level enforcement |
| **Data-at-rest encryption** | LUKS on VM volumes + SSE-CMK on RGW objects | Double layer: block device encryption (LUKS) and object encryption (Barbican-managed keys) |
| **Data-in-transit encryption** | msgr2 mutual TLS (Ceph) + TLS 1.3 (nginx) | All data movement between zones is encrypted; msgr2 provides Ceph-native authenticated encryption |
| **SASE** | Target architecture for multi-site federation | Federation traffic over public internet uses SASE model: SD-WAN + ZTNA at each site's edge |

### 6.2 The "Never Trust" Principle Applied

In the VAV architecture, "never trust, always verify" means:

- **Never trust the player connection.** Velocity authenticates every connection against Keystone. A player who was authorized 16 minutes ago is not authorized now — the token must be refreshed.
- **Never trust the network path.** Every zone boundary is a firewall. Traffic from Zone 1 cannot reach Zone 3 even if the application layer is compromised.
- **Never trust the storage medium.** Data at rest is encrypted with LUKS. Even if an OSD disk is physically stolen, the data is ciphertext.
- **Never trust the other world.** Cross-world communication requires bilateral VPN agreement (M11 Section 2.3), portal CephX keyring with explicit multi-namespace caps (M11 Section 6.3), and federation auth (M19).
- **Never trust the object exchange.** Every object exchanged between worlds in the federation protocol is authenticated. Source world signs the object; destination world verifies the signature against the source's public key. Unsigned or incorrectly signed objects are rejected.

### 6.3 SASE as Federation Target

For multi-site VAV deployments where sovereign worlds are distributed across geographic regions (e.g., US-West, EU-Central, AP-Southeast), SASE provides the overlay architecture:

```
Site A (US-West)                    Site B (EU-Central)
┌────────────────────┐             ┌────────────────────┐
│ Ceph Cluster A     │             │ Ceph Cluster B     │
│ OpenStack Region A │             │ OpenStack Region B │
│ Velocity Proxy A   │             │ Velocity Proxy B   │
└────────┬───────────┘             └────────┬───────────┘
         │                                  │
         ▼                                  ▼
┌────────────────────┐             ┌────────────────────┐
│ SASE Edge A        │◀───────────▶│ SASE Edge B        │
│ SD-WAN + ZTNA      │  encrypted  │ SD-WAN + ZTNA      │
│ FWaaS + SWG        │  tunnel     │ FWaaS + SWG        │
└────────────────────┘             └────────────────────┘
         │                                  │
         └──────────┬───────────────────────┘
                    │
              Public Internet
              (encrypted, policy-enforced,
               application-aware routing)
```

Each SASE edge enforces:
- **ZTNA:** Only authenticated federation requests traverse the tunnel
- **FWaaS:** Cloud-native firewall inspects all inter-site traffic
- **SWG:** Web traffic to management interfaces is filtered and logged
- **SD-WAN:** Intelligent path selection for latency-sensitive Minecraft traffic vs. bulk backup replication

The SASE model means that adding a new site requires deploying a SASE edge and configuring it against the central policy engine — not re-architecting the firewall rules at every existing site.

---

## 7. M2 Retrospective Forward Lesson

### 7.1 From Foundation to Framework

The M2 retrospective (Section 5.5) noted: "Zero trust provides the security foundation" — identifying M13's CephX security and LUKS encryption as the substrate upon which zero trust would be built. That observation is now realized in this module.

What M13 built (CephX keyrings, LUKS encryption, BorgBackup authenticated encryption, msgr2 mutual TLS) are the **enforcement mechanisms** — the PEPs, the encryption layers, the authentication protocols. What M20 adds is the **framework** — the policy model, the continuous evaluation, the maturity assessment, the gap analysis.

The difference between M13 and M20 is the difference between having locks on the doors and having a security policy that says which doors get locks, who gets keys, when keys expire, and what happens when a key is compromised. M13 is the lock. M20 is the policy.

### 7.2 The Five-Pillar Maturity Assessment as v3 Work

The CISA five-pillar maturity table (Section 4.3) is the assessment tool. It tells the VAV architect: "Your Identity pillar is at Traditional maturity because authentication is one-shot. Your Applications pillar is at Initial because there is no Minecraft protocol inspection. Your Networks and Data pillars are at Advanced because Ceph and OpenStack do this natively."

This assessment is directional, not final. Each gap identified in Section 4.2 becomes a work item for future implementation. The maturity table is a living document — as gaps are closed, the maturity level for each pillar is re-assessed.

---

## 8. Connection to Other Modules

### 8.1 Module Dependency Map

```
M10 (Multi-Server Fabric)     → Velocity proxy is the PEP for player access;
│                                 M20 adds JWT continuous auth to the proxy
│
M11 (Sovereign World)          → Keystone project isolation is the identity
│                                 domain; M20 maps it to the Identity pillar
│
M13 (Backup/Security)          → CephX keyrings and LUKS encryption are the
│                                 enforcement mechanisms; M20 provides the
│                                 framework that names and assesses them
│
M17 (Serialization/HPC)        → msgr2 framing provides data-in-transit
│                                 encryption; M20 places it in the Networks
│                                 pillar and the 4-zone model
│
M18 (Transport Security)       → Transport-layer security maps to the
│                                 Data-in-transit trust boundary; sneakernet
│                                 custody chain is a physical zero trust
│                                 implementation
│
M19 (Backup/Federation)        → Federation authentication between sites
│                                 is a zero trust problem; M20's SASE model
│                                 provides the overlay architecture
│
M20 (This module)              → Security capstone: names the framework,
                                  fills the gaps, provides the maturity
                                  assessment for the entire sovereign stack
```

### 8.2 Cross-Module Integration Points

| Integration Point | Modules | Zero Trust Implication |
|---|---|---|
| Velocity JWT refresh → Keystone token validation | M10 + M20 | Continuous authentication at PEP |
| CephX keyring namespace caps → RADOS pool ACL | M11 + M13 + M20 | Least-privilege enforcement at storage layer |
| msgr2 mutual TLS → OSD-to-OSD replication | M17 + M20 | Data-in-transit encryption in storage zone |
| BorgBackup authenticated encryption → offsite backup | M13 + M19 + M20 | Data-at-rest trust boundary extends to backup |
| Sneakernet custody chain → DTN bundle protocol | M18 + M20 | Physical zero trust: verify custody at every handoff |
| Federation query adapters → cross-site authentication | M19 + M20 | SASE model for inter-site ZTNA |
| RGW bucket policy → S3 API enforcement | M11 + M20 | PEP at object storage layer |

### 8.3 The Security Capstone

M20 is the security capstone of the VAV research atlas. It does not introduce new infrastructure — it names the security model that the infrastructure implements, identifies where the model is incomplete, and provides the framework for closing the gaps. Every module from M10 through M19 contributed security primitives. M20 assembles them into a coherent zero trust architecture and measures their maturity against the CISA and DoD frameworks.

The zero trust principle — "never trust, always verify" — is the security expression of the sovereignty principle that runs through the entire atlas. A sovereign world trusts nothing outside its boundary. Every access is verified. Every session is re-evaluated. Every data path is encrypted. The sovereign world authenticates every object exchange because sovereignty means you do not delegate trust — you verify it yourself, continuously, at every layer.

---

## 9. Sources

| # | Reference |
|---|-----------|
| 1 | NIST. "SP 800-207: Zero Trust Architecture." csrc.nist.gov/publications/detail/sp/800-207/final (August 2020). |
| 2 | CISA. "Zero Trust Maturity Model v2.0." cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf (April 2023). |
| 3 | DoD CIO. "Zero Trust Reference Architecture v2.0." dodcio.defense.gov/Portals/0/Documents/Library/(U)ZT_RA_v2.0(U)_Sep22.pdf (September 2022). |
| 4 | IBM Security. "Cost of a Data Breach Report 2024." ibm.com/reports/data-breach (2024). |
| 5 | Gartner. "Gartner Predicts 10% of Large Enterprises Will Have a Mature Zero Trust Program by 2026." gartner.com (2023). |
| 6 | OpenID Foundation. "Continuous Access Evaluation Profile (CAEP)." openid.net/specs/openid-caep-specification-1_0.html |
| 7 | Rose, S., Borchert, O., Mitchell, S., Connelly, S. "Zero Trust Architecture." NIST SP 800-207, doi:10.6028/NIST.SP.800-207 (August 2020). |
| 8 | OWASP Foundation. "ModSecurity Core Rule Set." coreruleset.org |
| 9 | Palo Alto Networks. "What Is a Next-Generation Firewall (NGFW)?" paloaltonetworks.com/cyberpedia/what-is-a-next-generation-firewall-ngfw |
| 10 | Gartner. "Secure Access Service Edge (SASE)." gartner.com/en/information-technology/glossary/secure-access-service-edge |
| 11 | Google. "BeyondCorp: A New Approach to Enterprise Security." research.google/pubs/pub43231/ (2014). |
| 12 | Ceph Foundation. "CephX Authentication." docs.ceph.com/en/latest/rados/configuration/auth-config-ref/ |
| 13 | Ceph Foundation. "Messenger v2 Protocol." docs.ceph.com/en/latest/rados/configuration/msgr2/ |
| 14 | OpenStack Documentation. "Keystone Identity Service." docs.openstack.org/keystone/latest/ |
| 15 | OpenStack Documentation. "Neutron Security Groups." docs.openstack.org/neutron/latest/admin/intro-os-networking.html |
| 16 | OpenStack Documentation. "Barbican Key Manager." docs.openstack.org/barbican/latest/ |
| 17 | Sovereign Cloud Stack. "SCS R7 Released — VPN-as-a-Service." scs.community/release/2024/09/11/release7 |
| 18 | OpenMetal. "Multi-Tenant OpenStack Architecture Basics." openmetal.io (November 2025). |
| 19 | RFC 7519. "JSON Web Token (JWT)." tools.ietf.org/html/rfc7519 (May 2015). |
| 20 | Cloudflare. "What Is SASE?" cloudflare.com/learning/access-management/what-is-sase/ |
