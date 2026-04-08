---
id: SNO-05-certificate-pki-operations
title: "Module 5: Certificate & PKI Operations"
type: reference
owner: Systems Network Operations Mission
lifecycle_state: Published
review_cadence: Annual
audience: [network_operations_engineer, security_engineer, devops_engineer, infrastructure_lead, site_reliability_engineer]
framework_refs: [rfc-8555-acme, rfc-6960-ocsp, rfc-5280-x509, rfc-6962-ct, ca-browser-forum-sc081, spiffe-v1, nist-sp-800-57]
scope: "TLS certificate lifecycle management, ACME automation, internal CA operations, mTLS and workload identity, certificate transparency, revocation mechanisms, and the transition to shorter certificate lifetimes"
purpose: "Provide operations engineers with a comprehensive reference for managing the full certificate lifecycle across public and private PKI, from issuance through monitoring, rotation, revocation, and the organizational changes required by the industry's shift to shorter certificate lifetimes"
version: "1.0"
last_reviewed: "2026-04-08"
next_review: "2027-04-08"
---

# Module 5: Certificate & PKI Operations

## Table of Contents

1. [Introduction](#1-introduction)
2. [The TLS Certificate Lifecycle](#2-the-tls-certificate-lifecycle)
3. [ACME Protocol and Let's Encrypt at Scale](#3-acme-protocol-and-lets-encrypt-at-scale)
4. [Certificate Rotation Automation](#4-certificate-rotation-automation)
5. [Expiry Monitoring and Alerting](#5-expiry-monitoring-and-alerting)
6. [Mutual TLS Operations](#6-mutual-tls-operations)
7. [Internal CA Management](#7-internal-ca-management)
8. [Certificate Transparency](#8-certificate-transparency)
9. [The Shorter-Lifetime Transition](#9-the-shorter-lifetime-transition)
10. [Certificate Revocation in 2026](#10-certificate-revocation-in-2026)
11. [Code Signing and Document Signing](#11-code-signing-and-document-signing)
12. [Certificate Pinning](#12-certificate-pinning)
13. [Incidents That Changed the Industry](#13-incidents-that-changed-the-industry)
14. [Source Index and Citations](#14-source-index-and-citations)

---

## 1. Introduction

A certificate is a small file that binds a public key to an identity. When that file expires, is misconfigured, or was never issued in the first place, the consequences range from a browser warning that users click through, to a nationwide cellular network going dark, to a data breach running undetected for seventy-six days. Certificate and PKI operations sit at the intersection of cryptography, automation, compliance, and operational discipline. The cryptographic fundamentals are well understood. The operational failures are not exotic. They are expired certificates on forgotten load balancers, monitoring tools that nobody configured to check internal CAs, and rotation procedures that work perfectly in staging but break in production because someone hardcoded a thumbprint.

This module covers the operational lifecycle of certificates rather than the mathematics of public key cryptography. The audience is the engineer who needs to ensure that every certificate in their environment is issued correctly, monitored continuously, rotated before expiry, and revoked when compromised. The emphasis is on automation, because the industry's direction is unambiguous: certificate lifetimes are getting shorter, and manual renewal processes are already broken at ninety days. At forty-seven days they will be catastrophic.

The landscape has shifted meaningfully since 2024. Let's Encrypt now offers six-day certificates. The CA/Browser Forum has voted to reduce maximum certificate lifetimes to forty-seven days by March 2029. Let's Encrypt has ended OCSP support entirely, moving to CRL-only revocation. SPIFFE has graduated as a CNCF project and is now the standard framework for workload identity. These are not incremental changes. They represent a fundamental shift in how organizations must think about certificate operations.

**What this module covers:**

- The complete certificate lifecycle from request through revocation
- ACME protocol mechanics and Let's Encrypt at scale
- Automation patterns for zero-downtime certificate rotation
- Expiry monitoring tools and alerting strategies
- Mutual TLS for service-to-service authentication
- Internal CA platforms (step-ca, HashiCorp Vault PKI, EJBCA, Microsoft AD CS)
- Certificate Transparency logs and unauthorized issuance detection
- The 90-day to 47-day transition timeline and operational impact
- Code signing and document signing operations
- Certificate pinning: when to use it, when to avoid it
- Real-world incidents caused by certificate failures

**What this module does not cover:**

- X.509 certificate format internals and ASN.1 encoding (covered in cryptography references)
- TLS handshake protocol mechanics (covered in SNE Module 7, Network Security Engineering)
- Hardware Security Module procurement and physical security (covered in data center operations)

---

## 2. The TLS Certificate Lifecycle

Every TLS certificate moves through a defined lifecycle. Operations teams that treat certificates as static artifacts, something you install and forget, will eventually experience an outage. The lifecycle is a continuous loop.

### 2.1 Lifecycle Stages

| Stage | What Happens | Who Owns It | Typical Duration |
|-------|-------------|-------------|------------------|
| **Request** | Application team submits a Certificate Signing Request (CSR) specifying subject, SANs, key type, and key size | Application owner | Minutes to days |
| **Validation** | CA verifies domain ownership (DV), organization identity (OV), or extended validation (EV) | Certificate Authority | Seconds (ACME DV) to weeks (EV) |
| **Issuance** | CA signs the certificate and returns it along with the chain | Certificate Authority | Seconds (automated) to days (manual) |
| **Deployment** | Certificate and private key are installed on the target server, load balancer, or CDN | Operations / DevOps | Minutes (automated) to hours (manual) |
| **Monitoring** | Certificate expiry, chain validity, and revocation status are continuously checked | Operations / SRE | Continuous |
| **Renewal** | Before expiry, a new certificate is requested, validated, issued, and deployed | Automation system | Days before expiry |
| **Revocation** | If the private key is compromised or the certificate is no longer needed, the CA is notified | Security / Operations | Immediate |

### 2.2 Key Types and Sizes

| Key Type | Common Size | Performance | Compatibility | Recommendation |
|----------|-------------|-------------|---------------|----------------|
| RSA | 2048 or 4096 bit | Slower TLS handshake | Universal | 2048 minimum; 4096 for long-lived internal CAs |
| ECDSA | P-256 (secp256r1) | Faster handshake, smaller certificates | Supported by all modern clients since ~2015 | Default choice for new deployments |
| ECDSA | P-384 (secp384r1) | Slightly slower than P-256 | Broad support | Government and high-security environments |
| EdDSA | Ed25519 | Fastest | Limited TLS support; excellent for SSH | Not yet standard for TLS certificates |

The operational decision: use ECDSA P-256 for web-facing TLS certificates. The performance advantage over RSA is measurable. A single ECDSA P-256 signature takes roughly 0.1 ms compared to 1.5 ms for RSA-2048 on modern hardware. At scale, this difference matters for TLS termination on load balancers handling thousands of new connections per second.

### 2.3 Certificate Chain Architecture

Every TLS certificate is part of a chain:

```
Root CA (self-signed, in trust stores)
  -> Intermediate CA (signed by root)
    -> Leaf Certificate (signed by intermediate, installed on server)
```

Operational rules:

- **Never expose root CA private keys online.** Keep the root offline, air-gapped. Sign intermediates with it, then lock it away.
- **Always serve the full chain** from the server. Missing intermediates are the single most common TLS misconfiguration. The server must send the leaf certificate plus all intermediates, but not the root.
- **Rotate intermediates independently.** When an intermediate is compromised, only certificates under that intermediate need replacement.

---

## 3. ACME Protocol and Let's Encrypt at Scale

The Automatic Certificate Management Environment (ACME, RFC 8555) protocol transformed certificate operations from a manual, error-prone process into a fully automated workflow. Let's Encrypt, the largest public CA, has issued over four billion certificates since its launch in 2015 and now serves over 500 million active certificates.

### 3.1 ACME Protocol Flow

```
Client                           ACME Server (e.g., Let's Encrypt)
  |                                        |
  |  1. Create Account                     |
  |--------------------------------------->|
  |  2. Request Certificate (new order)    |
  |--------------------------------------->|
  |  3. Receive Challenge (HTTP-01/DNS-01) |
  |<---------------------------------------|
  |  4. Fulfill Challenge                  |
  |--------------------------------------->|
  |  5. Server Validates Challenge         |
  |<---------------------------------------|
  |  6. Submit CSR (finalize)              |
  |--------------------------------------->|
  |  7. Receive Signed Certificate         |
  |<---------------------------------------|
```

### 3.2 Challenge Types

| Challenge | Mechanism | Use Case | Limitation |
|-----------|-----------|----------|------------|
| **HTTP-01** | Place a token file at `/.well-known/acme-challenge/` on port 80 | Single-domain certs on web servers with public port 80 | Cannot issue wildcards; requires inbound port 80 |
| **DNS-01** | Create a `_acme-challenge` TXT record in DNS | Wildcard certs, servers behind firewalls, CDN origins | Requires DNS API integration; DNS propagation delays |
| **TLS-ALPN-01** | Present a self-signed cert with ACME extension on port 443 | Servers where port 80 is unavailable | Limited client support; cannot issue wildcards |

**The operational recommendation:** DNS-01 is the most flexible challenge type. It works for wildcards, does not require inbound network access, and supports pre-validation before the certificate is needed. The cost is DNS API integration, which every major DNS provider now supports.

### 3.3 ACME Clients

| Client | Language | Best For | Key Feature |
|--------|----------|----------|-------------|
| **certbot** | Python | Traditional Linux servers, Apache/Nginx | Automatic web server configuration |
| **acme.sh** | Shell | Minimal-dependency environments, embedded systems | Pure shell, no dependencies beyond curl and openssl |
| **Caddy** | Go | Web servers with built-in ACME | Automatic HTTPS with zero configuration |
| **cert-manager** | Go | Kubernetes environments | Native K8s operator, CRD-based management |
| **lego** | Go | Custom integrations, CI/CD pipelines | Library and CLI, extensive DNS provider support |
| **Traefik** | Go | Reverse proxies and ingress controllers | Built-in ACME with automatic routing |

### 3.4 Let's Encrypt Rate Limits

Let's Encrypt enforces rate limits to prevent abuse. As of early 2026, the key limits are:

| Limit | Value | Reset Period | Notes |
|-------|-------|--------------|-------|
| Certificates per Registered Domain | 50 | 7 days | Counts all certs for *.example.com |
| Duplicate Certificates | 5 | 7 days | Same exact set of SANs |
| Failed Validations | 5 | 1 hour | Per account, per hostname, per hour |
| New Orders | 300 | 3 hours | Per account |
| Accounts per IP | 10 | 3 hours | Per IP address |

**Critical operational detail:** Renewals coordinated through ACME Renewal Information (ARI) are exempt from all rate limits. ARI allows clients to query the CA for the optimal renewal window, and the CA can use this to spread renewal load. Every production ACME deployment should use ARI-aware clients.

### 3.5 Certificate Profiles and Short-Lived Certificates

Let's Encrypt now offers multiple certificate profiles through the ACME protocol:

- **Default (90-day):** The standard profile, being reduced to 64 days and then 45 days over 2026-2028.
- **Short-lived (6-day):** 160-hour certificates that became generally available in January 2026. These certificates are small enough that revocation becomes unnecessary: they expire before a compromise can be meaningfully exploited. Let's Encrypt recommends renewing six-day certificates every three days.

To request a short-lived certificate, ACME clients select the `shortlived` certificate profile. This requires ACME client support for the profile negotiation extension.

---

## 4. Certificate Rotation Automation

Automated certificate rotation eliminates the human error that causes certificate expiry outages. The goal is zero-downtime rotation where the new certificate is deployed and validated before the old one is removed.

### 4.1 Zero-Downtime Rotation Pattern

```
Timeline:
  Day 0: Certificate issued (valid 90 days)
  Day 60: Automation requests new certificate
  Day 60: New certificate deployed alongside old certificate
  Day 60: Health checks verify new certificate is serving
  Day 60: Old certificate removed from active rotation
  Day 90: Old certificate expires (already out of service)
```

The overlap period is critical. At no point during rotation should the service be unreachable or presenting an invalid certificate.

### 4.2 Kubernetes cert-manager

cert-manager is the standard for certificate automation in Kubernetes. It is a CNCF project (stewardship now under CyberArk/Venafi) and operates as a Kubernetes operator with Custom Resource Definitions.

**Core resources:**

- `Issuer` / `ClusterIssuer`: Defines where certificates come from (ACME, Vault, step-ca, self-signed)
- `Certificate`: Declares the desired certificate (domain, key type, duration, renewal window)
- `CertificateRequest`: The CSR lifecycle object
- `Secret`: Where the issued certificate and private key are stored

cert-manager monitors `Certificate` resources, automatically requests issuance when none exists, and renews before expiry based on the configured `renewBefore` threshold. The default is to renew when two-thirds of the certificate lifetime has elapsed.

### 4.3 OCSP Stapling

OCSP stapling allows the server to include a pre-fetched, CA-signed OCSP response in the TLS handshake, avoiding the privacy and performance problems of clients querying the CA directly. However, the landscape changed significantly in 2025.

**Let's Encrypt ended OCSP support entirely:**

| Date | Change |
|------|--------|
| January 30, 2025 | OCSP Must-Staple requests begin failing |
| May 7, 2025 | OCSP URLs removed from newly issued certificates |
| August 6, 2025 | OCSP services shut down entirely |

The reason: OCSP is a privacy risk (the CA learns which sites a user visits) and web server OCSP stapling implementations have been unreliable, creating downtime rather than preventing it. The CA/Browser Forum passed Ballot SC-63 in August 2023 making OCSP optional and CRLs mandatory for publicly trusted CAs.

**For operators:** Remove OCSP Must-Staple from certificate requests. Ensure your web server or load balancer handles CRL-based revocation checking. For short-lived certificates (six-day), revocation checking is largely unnecessary since the certificate expires before revocation could propagate anyway.

---

## 5. Expiry Monitoring and Alerting

Certificate expiry is the most predictable outage in operations. The expiry date is literally encoded in the certificate. Yet certificate expiry remains one of the most common causes of production incidents because organizations lose track of where certificates are deployed.

### 5.1 Monitoring Approaches

| Approach | Tool Examples | Coverage | Limitation |
|----------|--------------|----------|------------|
| **External probing** | Nagios `check_ssl_cert`, Prometheus blackbox_exporter, UptimeRobot | Any publicly reachable endpoint | Cannot see internal certificates |
| **cert-manager metrics** | cert-manager Prometheus exporter | All Kubernetes-managed certificates | Kubernetes only |
| **CT log monitoring** | crt.sh, Certspotter, Facebook CT monitor | All publicly issued certificates for your domains | Does not cover internal CAs |
| **Agent-based scanning** | Venafi, Keyfactor, AppViewX | Internal and external, every host with an agent | Requires agent deployment |
| **Network scanning** | sslyze, testssl.sh, Qualys SSL Labs | Any reachable TLS endpoint | Point-in-time, not continuous |

### 5.2 Alert Thresholds

For 90-day certificates, a standard alerting ladder:

| Days to Expiry | Severity | Action |
|----------------|----------|--------|
| 30 | Info | Verify automation is scheduled |
| 14 | Warning | Investigate if renewal has not occurred |
| 7 | Critical | Manual intervention required |
| 3 | Emergency | Page the on-call engineer |
| 0 | Incident | Certificate has expired; begin incident response |

For 47-day certificates (after March 2029), these thresholds compress proportionally. For six-day certificates, alerting shifts to hours: warn at 48 hours, critical at 24 hours.

### 5.3 The Discovery Problem

The hardest part of certificate monitoring is not the monitoring itself. It is finding every certificate. Organizations commonly have certificates in:

- Web servers and load balancers (the ones everyone remembers)
- API gateways and reverse proxies
- Database connections (PostgreSQL, MySQL with TLS)
- Message brokers (Kafka, RabbitMQ with mTLS)
- SMTP servers (STARTTLS)
- VPN concentrators (IPsec certificates)
- IoT devices and embedded systems
- Legacy applications with bundled certificates
- CDN configurations (Cloudflare, Akamai, Fastly)
- Third-party SaaS integrations with custom domains

A certificate inventory audit should be performed at least quarterly. Network scanning tools like sslyze can discover TLS-enabled endpoints across IP ranges. CT log monitoring catches any publicly issued certificates for your domains that you might not be aware of.

---

## 6. Mutual TLS Operations

Mutual TLS (mTLS) extends the standard TLS handshake so that both the client and the server present certificates and verify each other's identity. In a standard TLS connection, only the server proves its identity. With mTLS, the client also proves its identity through a certificate, replacing or supplementing traditional authentication mechanisms like API keys or tokens.

### 6.1 When to Use mTLS

- **Service-to-service communication** in microservice architectures
- **Zero-trust network access** where network location is not a trust signal
- **API authentication** where API keys are insufficient
- **Database connections** between application servers and database clusters

### 6.2 SPIFFE and SPIRE

SPIFFE (Secure Production Identity Framework for Everyone) is a CNCF graduated project that provides a standard for workload identity. SPIRE (SPIFFE Runtime Environment) is the production implementation. Together they solve the certificate distribution problem for mTLS at scale.

**SPIFFE Identity (SVID):**

Every workload receives a SPIFFE Verifiable Identity Document (SVID), which is an X.509 certificate with a SPIFFE ID as the URI SAN:

```
spiffe://trust-domain/workload-identifier
spiffe://production.example.com/payments/api-server
```

**SPIRE Architecture:**

```
SPIRE Server (central)
  |-- Issues SVIDs to registered workloads
  |-- Maintains registration entries (workload -> identity mapping)
  |-- Rotates certificates automatically (default: 1 hour lifetime)
  
SPIRE Agent (per node)
  |-- Attests node identity to SPIRE Server
  |-- Provides Workload API to local processes
  |-- Caches SVIDs for performance
```

**Service mesh integration:** Istio and Envoy natively support SPIFFE identities. Istio can be configured to use SPIRE as the identity provider instead of its built-in certificate authority, enabling consistent identity management across clusters with granularity beyond Kubernetes service accounts.

### 6.3 Certificate Distribution at Scale

The core challenge of mTLS is certificate distribution. Every service needs a certificate, and those certificates must be rotated frequently. The SPIRE model solves this with short-lived certificates (one-hour default) that are automatically rotated by the SPIRE Agent. The application never touches certificate files directly; it receives them through the SPIFFE Workload API.

For environments not using SPIRE, common distribution patterns include:

- **Kubernetes Secrets** managed by cert-manager, mounted into pods
- **HashiCorp Vault Agent** sidecar that fetches and renews certificates
- **Consul Connect** for Consul-native service meshes

---

## 7. Internal CA Management

Public CAs like Let's Encrypt are appropriate for internet-facing services. Internal services, development environments, and mTLS infrastructure require an internal CA that you control.

### 7.1 Platform Comparison

| Platform | Deployment | Best For | Key Differentiator |
|----------|-----------|----------|-------------------|
| **step-ca** (Smallstep) | Single binary, Docker, K8s | DevOps teams, small-to-medium PKI | ACME server built-in; simple to operate |
| **HashiCorp Vault PKI** | Vault cluster | Organizations already using Vault | Integrated with Vault auth, audit, and policy |
| **EJBCA** (PrimeKey/Keyfactor) | Java application server | Enterprise PKI, compliance-heavy environments | Full-featured enterprise CA with OCSP, CMP, EST |
| **Microsoft AD CS** | Windows Server | Windows-centric enterprises | Deep Active Directory integration, Group Policy auto-enrollment |
| **AWS Private CA** | Managed service | AWS-native environments | Fully managed, IAM-integrated, pay-per-certificate |

### 7.2 step-ca

step-ca is an open-source online certificate authority built by Smallstep. It supports X.509 and SSH certificates, runs as a single binary, and includes a built-in ACME server. This means any ACME client (certbot, acme.sh, cert-manager) can request certificates from your internal CA using the same protocol used with Let's Encrypt.

**Key capabilities:**

- Short-lived certificates with automated renewal (default 24-hour lifetime)
- ACME, EST, CMPv2, and SCEP protocol support
- Multiple provisioners: ACME, OIDC (integrate with identity providers), JWK, X5C, SSHPOP
- Database backends: Badger (embedded), BoltDB, PostgreSQL, MySQL
- High availability with multiple intermediaries and root federation
- Registration Authority mode for distributed deployments

### 7.3 HashiCorp Vault PKI Secrets Engine

Vault's PKI secrets engine generates X.509 certificates dynamically. Applications authenticate to Vault using their existing identity (Kubernetes service account, AWS IAM role, LDAP credentials) and receive a short-lived certificate. No CSR workflow, no manual approval.

**Architecture:**

```
Root CA (offline or Vault-managed)
  -> Intermediate CA (Vault PKI mount)
    -> Leaf certificates (generated on demand, short-lived)
```

Since Vault 1.11.0, a single PKI mount can hold multiple issuer certificates, enabling seamless intermediate rotation. Since Vault 1.14, the PKI engine supports the ACME protocol, allowing ACME clients like cert-manager to issue certificates from Vault.

**Vault PKI supports:** ACME, EST, CMPv2, and SCEP protocols. Enterprise features include cross-signing, unified CRL, and OCSP responder.

### 7.4 Microsoft AD CS

Active Directory Certificate Services remains dominant in Windows enterprise environments. Auto-enrollment through Group Policy distributes certificates to domain-joined machines without any user or administrator action. For environments that are already Windows-centric, AD CS provides the deepest integration with Active Directory, including smart card login, EFS encryption, and 802.1X authentication.

The operational challenge with AD CS is that it is tightly coupled to Active Directory and Windows Server. Managing certificates for Linux servers, containers, or non-domain-joined devices requires additional tooling or a hybrid approach with a second CA.

---

## 8. Certificate Transparency

Certificate Transparency (CT) is a system of public, append-only logs that record every publicly trusted TLS certificate. Introduced by Google in 2013 (RFC 6962), CT makes unauthorized certificate issuance detectable. If someone obtains a certificate for your domain from any public CA, that certificate will appear in CT logs.

### 8.1 How CT Works

When a CA issues a certificate, it submits a pre-certificate to one or more CT logs. The log returns a Signed Certificate Timestamp (SCT) proving the certificate was logged. Browsers require SCTs before trusting a certificate:

- **Chrome:** Requires SCTs from at least two independent CT logs
- **Safari:** Requires SCTs since October 2018
- **Firefox:** Began requiring CT in February 2025 (Firefox 135)

### 8.2 Monitoring Your Domains

CT monitoring tools alert you when any certificate is issued for your domains:

| Tool | Type | Coverage | Cost |
|------|------|----------|------|
| **crt.sh** | Web interface / API | All major CT logs | Free |
| **Certspotter** (SSLMate) | Monitoring service | All CT logs, email/webhook alerts | Free tier available |
| **Facebook CT Monitor** | Monitoring service | All CT logs | Free |
| **Google Certificate Transparency search** | Web interface | Google-operated logs | Free |

**Operational practice:** Configure CT monitoring for all domains you own, including subdomains. Search for `%.yourdomain.com` on crt.sh to find all certificates, including wildcards. Any certificate you do not recognize is a potential indicator of compromise or unauthorized issuance and should be investigated immediately.

### 8.3 CT Log Operators (2025-2026)

Approved CT log operators include Google, Cloudflare, DigiCert, Sectigo, Let's Encrypt, and Trust Asia. Chrome is migrating to static-CT-API logs but requires at least one SCT from a traditional RFC 6962 log during the transition period, expected to complete by end of 2025.

---

## 9. The Shorter-Lifetime Transition

The CA/Browser Forum approved Ballot SC-081v3 on April 11, 2025, establishing a phased reduction in maximum TLS certificate lifetimes. All four major browser vendors, Apple, Google, Mozilla, and Microsoft, voted in favor.

### 9.1 Timeline

| Effective Date | Maximum Certificate Lifetime | Maximum DCV Reuse |
|----------------|-----------------------------|--------------------|
| Current (pre-March 2026) | 398 days | 398 days |
| **March 15, 2026** | **200 days** | 200 days |
| **March 15, 2027** | **100 days** | 100 days |
| **March 15, 2029** | **47 days** | 10 days |

Domain Control Validation (DCV) reuse reduction is equally significant. By March 2029, domain ownership must be re-validated every 10 days, meaning the validation itself must be automated, not just the certificate request.

### 9.2 Let's Encrypt's Parallel Path

Let's Encrypt is independently reducing its default certificate lifetime:

| Timeframe | Default Lifetime | Notes |
|-----------|-----------------|-------|
| 2015-2025 | 90 days | Original default |
| 2026 | 64 days | First reduction |
| 2027-2028 | 45 days | Final default |
| Available now | 6 days (opt-in) | Short-lived profile, generally available since January 2026 |

### 9.3 Operational Impact

**What breaks at 47 days:**

- **Manual renewal processes.** Any certificate that requires a human to log into a portal, download a file, and upload it to a server will expire before anyone remembers to renew it.
- **Ticketing-based workflows.** "Open a ticket, wait for the security team, wait for the change window" does not work when certificates expire in six weeks.
- **Hardcoded certificate thumbprints.** Any system that pins to a specific certificate (rather than a CA) will break at every rotation.
- **Vendor-managed certificates.** Third-party services that manage your certificates must support automated renewal, or you need to manage the certificates yourself and push them to the vendor.

**What must be true by March 2029:**

- Every certificate renewal is fully automated (ACME or equivalent)
- DNS validation is automated (DNS-01 challenge with API-driven DNS providers)
- Certificate deployment is automated (cert-manager, systemd hooks, load balancer APIs)
- Monitoring catches failures within hours, not days

---

## 10. Certificate Revocation in 2026

Revocation has always been the weakest link in the PKI chain. The mechanisms exist, but their real-world effectiveness has been limited. The 2025 changes clarify the path forward.

### 10.1 Revocation Mechanisms

| Mechanism | How It Works | Status in 2026 |
|-----------|-------------|----------------|
| **CRL (Certificate Revocation List)** | CA publishes a signed list of revoked serial numbers; clients download periodically | Mandatory for public CAs (CA/B Forum SC-63) |
| **OCSP (Online Certificate Status Protocol)** | Client queries CA in real-time for status of specific certificate | Deprecated by Let's Encrypt; optional for other CAs |
| **OCSP Stapling** | Server fetches OCSP response and includes it in TLS handshake | Declining as OCSP itself declines |
| **Short-lived certificates** | Certificates expire before revocation could matter | Emerging standard (6-day certs from Let's Encrypt) |
| **CRLite (Firefox)** | Browser ships compressed revocation data with updates | Firefox-specific, production since 2024 |

### 10.2 The Short-Lived Certificate Argument

Short-lived certificates (six-day or shorter) effectively make revocation unnecessary. If a certificate is compromised, the maximum exposure window is the remaining validity period. For a six-day certificate renewed every three days, the worst case is roughly three days of exposure, comparable to or better than the time it takes for revocation to propagate through CRLs.

This is the direction the industry is heading. Short-lived certificates replace the complex, unreliable revocation infrastructure with a simple guarantee: the certificate will expire soon regardless.

---

## 11. Code Signing and Document Signing

Certificate operations extend beyond TLS. Code signing and document signing use the same X.509 infrastructure but with different operational requirements.

### 11.1 Code Signing

Code signing certificates prove that software was published by a known entity and has not been modified since signing. The operational requirements differ from TLS:

| Requirement | TLS Certificate | Code Signing Certificate |
|-------------|----------------|------------------------|
| **Private key storage** | Server memory or KMS | HSM or hardware token (FIPS 140-2 Level 2+ required for EV) |
| **Timestamping** | Not applicable | Critical: preserves trust after certificate expiry |
| **Lifetime** | Moving to 47 days | Typically 1-3 years |
| **Revocation impact** | Users see a warning | All previously signed software becomes untrusted unless timestamped |

**EV Code Signing** is required for Windows kernel-mode drivers (Windows 10 Build 1607+) and provides immediate SmartScreen reputation. Standard (OV) certificates build reputation over time.

**Timestamping is mandatory.** Every code signature must include a timestamp from a trusted Timestamping Authority (TSA). Without a timestamp, the signature becomes invalid when the certificate expires. With a timestamp, the signature remains valid indefinitely, proving the code was signed while the certificate was active.

**Cloud signing services:** Microsoft Trusted Signing (formerly Azure Code Signing) eliminates the need for physical hardware tokens by storing keys in FIPS 140-2 Level 3 HSMs in Azure. It integrates with SignTool.exe, GitHub Actions, and Azure DevOps.

### 11.2 Document Signing

PDF and document signing certificates follow similar principles. Adobe's Approved Trust List (AATL) governs which CAs are trusted for document signatures in Adobe Reader. Timestamping is equally critical for document signatures.

---

## 12. Certificate Pinning

Certificate pinning restricts which certificates a client will accept for a given domain, beyond the standard CA trust store validation. The practice has a complicated history and a clear current recommendation.

### 12.1 HPKP: The Deprecated Standard

HTTP Public Key Pinning (HPKP) was a browser standard that allowed websites to declare, via HTTP headers, which public keys should be associated with their domain. Chrome deprecated HPKP in version 72 (2018) and it is no longer supported by any major browser. The reasons:

- **HPKP Suicide:** If you lose the pinned keys (hardware failure, key rotation error), your site becomes permanently inaccessible to users who cached the pin. Recovery requires waiting for the pin's max-age to expire, which could be months.
- **RansomPKP:** Attackers who gain temporary control of your server can pin their own keys, locking you out of your own domain.
- **Operational complexity:** Pin rotation required careful coordination that most organizations could not sustain.

### 12.2 Mobile App Pinning

Mobile applications can pin certificates or public keys in application code, independent of browser standards. This remains relevant but the 2025 consensus is shifting away:

- **Google's Android security best practices explicitly recommend against pinning** for most applications, advising reliance on the default CA trust model.
- **Apple's App Transport Security** provides strong defaults without pinning.
- **Pinning breaks legitimate interception** needed for enterprise security, debugging, and CDN rotation.

**When pinning is still appropriate:**

- High-value financial applications with dedicated server infrastructure
- Applications communicating with a single, well-controlled backend
- Environments where you control both client and server and can coordinate rotation

**If you must pin:** Pin the Subject Public Key Info (SPKI) hash, not the full certificate. SPKI pins survive certificate reissuance as long as the same key pair is used. Always include at least two pins (active and backup) and ensure the backup key exists in your certificate chain.

### 12.3 Modern Alternatives to Pinning

| Alternative | What It Does | Why It's Better |
|-------------|-------------|-----------------|
| **Certificate Transparency monitoring** | Detects unauthorized issuance | Broad coverage, no client-side breakage risk |
| **DNS CAA records** | Restricts which CAs can issue for your domain | Server-side, no client impact |
| **HSTS (HTTP Strict Transport Security)** | Enforces HTTPS | Prevents downgrade attacks without key pinning |
| **Strong TLS configuration** | Disable weak ciphers and protocols | Reduces attack surface |

---

## 13. Incidents That Changed the Industry

Three incidents illustrate why certificate operations matter. Each one caused significant real-world impact and drove permanent changes in how the industry approaches certificate management.

### 13.1 Ericsson/O2 Network Outage (December 6, 2018)

**What happened:** An expired software certificate in Ericsson's SGSN-MME (Serving GPRS Support Node / Mobility Management Entity) firmware caused a cascading failure across mobile networks in 11 countries.

**Impact:** 32 million O2 customers in the UK lost voice and data service. The outage rippled downstream to MVNOs including GiffGaff, Sky Mobile, Lyca, and Tesco Mobile. SoftBank in Japan was simultaneously affected. Transport for London's timetable service went down. NHS staff lost connectivity on iPads used for patient records. The 3G data service began returning early evening on December 6 and was fully restored by 9:30 PM.

**Root cause:** A certificate embedded in Ericsson's network equipment software had expired. There was no monitoring for the certificate's expiry date. The certificate was not managed through any automated lifecycle process. It was a static artifact baked into firmware.

**Lesson:** Certificates in network equipment firmware and embedded systems are the hardest to track and the most dangerous to miss. They do not appear in web server certificate inventories. They require dedicated discovery and tracking.

### 13.2 Let's Encrypt DST Root CA X3 Expiry (September 30, 2021)

**What happened:** The DST Root CA X3 certificate, which Let's Encrypt used as a cross-signature to achieve broad device compatibility, expired at 14:01:15 UTC on September 30, 2021.

**Impact:** Older devices that did not trust Let's Encrypt's own ISRG Root X1 certificate began rejecting connections to sites using Let's Encrypt certificates. The most significant impact was on older Android devices, certain OpenSSL versions (pre-1.1.0), and embedded systems that could not be updated. A bug in older OpenSSL versions caused certificate chain validation to prefer the expired chain path over valid alternatives, breaking connections even when a valid path existed.

**Root cause:** Root certificate transitions are inherently risky because the old root is embedded in millions of devices that may never receive updates. Let's Encrypt mitigated this with a creative cross-signature that extended trust past the root expiry for most clients, but the OpenSSL chain-building bug was an unexpected amplifier.

**Lesson:** Root CA transitions require years of planning, and you cannot assume all clients will update. The long tail of old devices, old libraries, and old embedded systems will always be longer than you expect.

### 13.3 Equifax Breach Detection Failure (2017)

**What happened:** Equifax suffered a data breach from May to July 2017 that exposed the personal information of 147.9 million Americans, 15.2 million British citizens, and approximately 19,000 Canadian citizens. The breach was enabled by an unpatched Apache Struts vulnerability. But the reason it went undetected for 76 days was a certificate operations failure.

**Impact:** Equifax had a network traffic inspection device that could decrypt and analyze outgoing traffic to detect data exfiltration. That device had been inactive for 19 months because its SSL certificate had expired. When the certificate was finally renewed on July 29, 2017, the device immediately flagged suspicious outbound traffic, and the exploit was shut down by July 30.

**Scale of the certificate problem:** At the time of the breach, Equifax had allowed at least 324 SSL certificates to expire across their infrastructure. Seventy-nine of those expired certificates were on devices monitoring business-critical domains.

**Lesson:** Certificate expiry does not just cause user-facing outages. It silently disables security infrastructure. An expired certificate on a monitoring tool is invisible to users but creates a gap in your security posture that attackers can exploit for months. Certificate monitoring must cover all certificates, not just the ones serving web traffic.

---

## 14. Source Index and Citations

### Standards and Specifications

- **rfc-8555:** Barnes et al., *Automatic Certificate Management Environment (ACME)*, IETF RFC 8555, March 2019. https://www.rfc-editor.org/rfc/rfc8555

- **rfc-6960:** Santesson et al., *X.509 Internet Public Key Infrastructure Online Certificate Status Protocol - OCSP*, IETF RFC 6960, June 2013. https://www.rfc-editor.org/rfc/rfc6960

- **rfc-5280:** Cooper et al., *Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile*, IETF RFC 5280, May 2008. https://www.rfc-editor.org/rfc/rfc5280

- **rfc-6962:** Laurie et al., *Certificate Transparency*, IETF RFC 6962, June 2013. https://www.rfc-editor.org/rfc/rfc6962

- **cab-sc081:** CA/Browser Forum, *Ballot SC-081v3: Introduce Schedule of Reducing Validity and Data Reuse Periods*, April 2025. https://cabforum.org/2025/04/11/ballot-sc-081v3/

- **spiffe-v1:** CNCF, *SPIFFE: Secure Production Identity Framework for Everyone*, Specification v1. https://spiffe.io/

### Let's Encrypt Documentation and Announcements

- **le-rate-limits:** Let's Encrypt, *Rate Limits*, 2026. https://letsencrypt.org/docs/rate-limits/

- **le-scaling:** Let's Encrypt, *Scaling Our Rate Limits to Prepare for a Billion Active Certificates*, January 2025. https://letsencrypt.org/2025/01/30/scaling-rate-limits.html

- **le-shorter-rates:** Let's Encrypt, *Shorter Certificate Lifetimes and Rate Limits*, February 2026. https://letsencrypt.org/2026/02/24/rate-limits-45-day-certs

- **le-6day-announce:** Let's Encrypt, *Announcing Six Day and IP Address Certificate Options in 2025*, January 2025. https://letsencrypt.org/2025/01/16/6-day-and-ip-certs

- **le-6day-first:** Let's Encrypt, *We Issued Our First Six Day Cert*, February 2025. https://letsencrypt.org/2025/02/20/first-short-lived-cert-issued

- **le-6day-ga:** Let's Encrypt, *6-day and IP Address Certificates are Generally Available*, January 2026. https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability

- **le-ending-ocsp:** Let's Encrypt, *Ending OCSP Support in 2025*, December 2024. https://letsencrypt.org/2024/12/05/ending-ocsp

- **le-dst-expiry:** Let's Encrypt, *DST Root CA X3 Expiration (September 2021)*, 2021. https://letsencrypt.org/docs/dst-root-ca-x3-expiration-september-2021/

- **le-45day:** Let's Encrypt, *Decreasing Certificate Lifetimes to 45 Days*, December 2025. https://letsencrypt.org/2025/12/02/from-90-to-45

### PKI Platforms and Tools

- **smallstep-ca:** Smallstep, *step-ca Certificate Authority Overview*, 2026. https://smallstep.com/docs/step-ca/

- **vault-pki:** HashiCorp, *PKI Secrets Engine*, Vault Documentation, 2026. https://developer.hashicorp.com/vault/docs/secrets/pki

- **vault-pki-rotation:** HashiCorp, *PKI Secrets Engine - Rotation Primitives*, Vault Documentation. https://developer.hashicorp.com/vault/docs/secrets/pki/rotation-primitives

- **cert-manager:** cert-manager project, *ACME Configuration*, 2026. https://cert-manager.io/docs/configuration/acme/

### Certificate Transparency

- **ct-dev:** Certificate Transparency project, *How CT Works*, 2025. https://certificate.transparency.dev/howctworks/

- **le-ct-logs:** Let's Encrypt, *Certificate Transparency (CT) Logs*, 2025. https://letsencrypt.org/docs/ct-logs/

- **crt-sh:** Sectigo, *crt.sh Certificate Search*, 2026. https://crt.sh/

### Industry Analysis and Incident Reports

- **digicert-47day:** DigiCert, *TLS Certificate Lifetimes Will Officially Reduce to 47 Days*, 2025. https://www.digicert.com/blog/tls-certificate-lifetimes-will-officially-reduce-to-47-days

- **globalsign-47day:** GlobalSign, *A Complete 47-day SSL/TLS Certificate Validity Q&A*, 2025. https://www.globalsign.com/en/blog/navigating-the-47-day-ssl-tls-certificate-validity-era

- **ericsson-o2:** The Register, *Why millions of Brits' mobile phones were knackered on Thursday: An expired Ericsson software certificate*, December 2018. https://www.theregister.com/2018/12/06/ericsson_o2_telefonica_uk_outage/

- **equifax-cert:** The SSL Store, *The Equifax Data Breach went undetected for 76 days because of an expired certificate*, 2017. https://www.thesslstore.com/blog/the-equifax-data-breach-went-undetected-for-76-days-because-of-an-expired-certificate/

- **equifax-breach:** BreachSense, *Equifax Data Breach 2017: Timeline, $1.38B Cost & Lessons*, 2025. https://www.breachsense.com/blog/equifax-data-breach/

- **catchpoint-dst:** Catchpoint, *Lessons From An Internet Outage - Issues Caused By Let's Encrypt DST Root CA X3 Expiration*, 2021. https://www.catchpoint.com/blog/lessons-from-an-internet-outage-issues-caused-by-lets-encrypt-dst-root-ca-x3-expiration

### Certificate Pinning and Revocation

- **owasp-pinning:** OWASP, *Certificate and Public Key Pinning*, 2024. https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning

- **8ksec-pinning:** 8kSec, *Why You Should Remove SSL Pinning from Your Mobile Apps in 2025*, 2025. https://8ksec.io/why-you-should-remove-ssl-pinning-from-your-mobile-apps-in-2025/

- **axelspire-revocation:** Axelspire, *Certificate Revocation Deep Dive: CRL, OCSP, OCSP Stapling, and Short-Lived Certs*, 2025. https://axelspire.com/vault/operations/certificate-revocation-crl-ocsp/

### SPIFFE/SPIRE

- **spiffe-io:** SPIFFE project, *SPIRE Use Cases*, 2026. https://spiffe.io/docs/latest/spire-about/use-cases/

- **hashicorp-spiffe:** HashiCorp, *SPIFFE: Securing the Identity of Agentic AI and Non-Human Actors*, 2025. https://www.hashicorp.com/en/blog/spiffe-securing-the-identity-of-agentic-ai-and-non-human-actors

- **redhat-spiffe:** Red Hat, *What are SPIFFE and SPIRE?*, 2025. https://www.redhat.com/en/topics/security/spiffe-and-spire

---

*[PENDING REVIEW] -- This module has been generated and requires human review gate before transitioning from Published to fully verified status.*

*Document ID: SNO-05-certificate-pki-operations | Version: 1.0 | Owner: Systems Network Operations Mission | Last Reviewed: 2026-04-08 | Next Review: 2027-04-08*
