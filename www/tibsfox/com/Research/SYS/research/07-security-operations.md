# Security Operations

> **Module ID:** SRV-SEC
> **Domain:** Security & Defense
> **Through-line:** *Security is stewardship, not theater.* Every control serves a purpose, every log tells the truth, every lock has a reason. The sysadmin sees the attacks in the logs every day and makes decisions about what to protect and how. The work is ongoing, unglamorous, and essential.

---

## Table of Contents

1. [Security as Stewardship](#1-security-as-stewardship)
2. [Hardening](#2-hardening)
3. [SSH & Remote Access](#3-ssh--remote-access)
4. [TLS & Certificates](#4-tls--certificates)
5. [Firewalls & Network Boundaries](#5-firewalls--network-boundaries)
6. [Intrusion Detection](#6-intrusion-detection)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Audit Trails](#8-audit-trails)
9. [Vulnerability Management](#9-vulnerability-management)
10. [Incident Response](#10-incident-response)
11. [Privacy by Design](#11-privacy-by-design)
12. [The Daily Reality](#12-the-daily-reality)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Security as Stewardship

Security is not a product you install, not a feature you enable, not a checklist you complete. Security is the ongoing practice of protecting the resources you are responsible for. It is stewardship — the same word we use for land, for forests, for anything worth preserving. You cannot buy it. You practice it, every day, or you do not have it.

The sysadmin is the steward. They see the threats in the logs — the SSH brute force attempts arriving every few minutes, the port scans sweeping subnets, the web crawlers probing for known vulnerabilities. They understand which services are exposed, which accounts have access, which patches are pending. They make decisions about what to protect and how, balancing security against usability, cost against risk, convenience against exposure.

### 1.1 Defense in Depth

No single control stops everything. Defense in depth means layering protections so that the failure of one layer does not mean compromise of the system. Each layer serves a purpose. Each layer buys time.

| Layer | Function | Example |
|-------|----------|---------|
| **Network perimeter** | Filter unwanted traffic before it reaches services | Firewall default-deny, rate limiting |
| **Service hardening** | Reduce what is exposed on each host | Disable unused services, bind to localhost |
| **Authentication** | Verify identity before granting access | SSH key auth, MFA |
| **Authorization** | Limit what authenticated users can do | Least privilege, sudo rules, file permissions |
| **Monitoring** | Detect anomalies and unauthorized changes | auditd, IDS, log aggregation |
| **Encryption** | Protect data in transit and at rest | TLS, LUKS, SSH tunnels |
| **Backup & recovery** | Survive what you cannot prevent | Tested restores, offsite copies |

The metaphor is a forest, not a fortress. A fortress has one wall — breach it and you are inside. A forest has depth, cover, and no single point of failure. An attacker who gets past the firewall still faces authentication. Past authentication, they face authorization. Past authorization, they face audit logging that records what they do. Past all of that, they face encrypted data they cannot read and backups they cannot reach.

### 1.2 The Threat Model

Before choosing controls, understand what you are protecting and from whom. A threat model answers four questions:

1. **What do you have?** — Assets: data, services, credentials, infrastructure
2. **What can go wrong?** — Threats: unauthorized access, data loss, service disruption, data theft
3. **Who would do it?** — Adversaries: automated bots, opportunistic attackers, targeted adversaries, insiders
4. **What are you doing about it?** — Controls: the defenses mapped to each threat

Most servers on the public internet face the same baseline threat: automated scanning and brute-force attacks from botnets. This is not hypothetical — it is the daily reality documented in Section 12. Your firewall logs prove it every hour.

The threat model determines proportional response. A personal development server needs different controls than a production database holding financial records. Both need basic hygiene — patching, firewalls, key-based SSH. The production system additionally needs audit logging, intrusion detection, encrypted backups, and formal incident response procedures.

### 1.3 The Principle of Least Surprise

Security controls should behave predictably. An administrator should be able to look at a system's configuration and understand what is permitted and what is denied. When controls are complex, overlapping, or undocumented, the system becomes harder to reason about — and harder to audit.

This means: simple rulesets over clever ones. Explicit denies over implicit allows. Documented exceptions over silent overrides. If you cannot explain your firewall rules to a colleague in five minutes, the rules are too complicated.

---

## 2. Hardening

Hardening is the practice of reducing a system's attack surface — closing everything that does not need to be open, disabling everything that does not need to run, removing everything that does not need to exist. It is like closing windows you do not use in your house. Not because someone is coming through them, but because there is no reason for them to be open.

### 2.1 The Default State Problem

A freshly installed Linux server is not secure. It may have default accounts, running services you did not ask for, open ports you do not need, and a permissive firewall (or no firewall at all). The default state prioritizes convenience and broad compatibility over security. Hardening is the process of moving from that default to a state appropriate for your threat model.

### 2.2 Service Inventory

The first step is knowing what is running. You cannot secure what you have not inventoried.

```bash
# List all listening sockets — what services are accepting connections?
ss -tlnp

# List all enabled systemd services — what starts at boot?
systemctl list-unit-files --state=enabled --type=service

# List installed packages — what software is on this system?
dpkg -l          # Debian/Ubuntu
rpm -qa           # RHEL/Fedora
```

For every listening service, ask: does this need to be accessible? If the answer is no, stop the service and disable it. If the answer is "only from localhost," bind it to 127.0.0.1.

```bash
# Disable a service you do not need
sudo systemctl stop cups.service
sudo systemctl disable cups.service
sudo systemctl mask cups.service   # prevents re-enabling

# Check what is still listening
ss -tlnp
```

The `mask` operation is stronger than `disable` — it creates a symlink to /dev/null, preventing any attempt to start the service. Use it for services you are certain you will never need.

### 2.3 CIS Benchmarks

The Center for Internet Security publishes hardening benchmarks for every major operating system, cloud platform, and server application. These are consensus-driven, regularly updated, and freely available. They are a starting point, not a destination — the benchmark tells you what to check, your threat model tells you what to apply. [SRC-CIS]

**Key categories in a CIS Linux benchmark:**

| Category | Examples |
|----------|----------|
| Filesystem | Separate partitions for /tmp, /var, /var/log; noexec on /tmp; disable unused filesystems (cramfs, squashfs) |
| Services | Disable avahi-daemon, cups, rpcbind unless needed; ensure NTP is configured |
| Network | Disable IP forwarding (unless router), disable ICMP redirects, enable TCP SYN cookies |
| Logging | Ensure auditd is enabled, log rotation configured, remote syslog forwarding |
| Access | Password aging policies, restrict su to wheel group, configure SSH properly |
| Permissions | Verify permissions on /etc/passwd, /etc/shadow, /etc/crontab, SSH host keys |

### 2.4 Practical Hardening Checklist

The following applies to a typical Debian/Ubuntu server. Adjust for your distribution.

```bash
# 1. Update everything first
sudo apt update && sudo apt upgrade -y

# 2. Remove packages you do not use
sudo apt purge telnet rsh-client rsh-redone-client

# 3. Disable USB storage if server has no USB device needs
echo "blacklist usb-storage" | sudo tee /etc/modprobe.d/disable-usb-storage.conf

# 4. Set restrictive umask (new files default to 027, not 022)
# In /etc/login.defs:
#   UMASK 027

# 5. Restrict cron to authorized users
echo "root" | sudo tee /etc/cron.allow
sudo chmod 600 /etc/cron.allow

# 6. Ensure core dumps are disabled for SUID programs
echo "fs.suid_dumpable = 0" | sudo tee -a /etc/sysctl.d/99-hardening.conf

# 7. Enable ASLR (usually default, verify)
echo "kernel.randomize_va_space = 2" | sudo tee -a /etc/sysctl.d/99-hardening.conf

# 8. Apply sysctl changes
sudo sysctl --system
```

### 2.5 Kernel Parameters for Network Hardening

```bash
# /etc/sysctl.d/99-network-hardening.conf

# Disable IP forwarding (this is not a router)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Ignore ICMP redirects (prevent routing table poisoning)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Do not send ICMP redirects
net.ipv4.conf.all.send_redirects = 0

# Enable TCP SYN cookies (mitigate SYN flood attacks)
net.ipv4.tcp_syncookies = 1

# Log suspicious packets (martians — packets with impossible source addresses)
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore broadcast ICMP (Smurf attack mitigation)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source routing (prevent packets from specifying their own route)
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Enable reverse path filtering (drop packets with unreachable source addresses)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
```

Each of these settings has a reason. SYN cookies prevent memory exhaustion from half-open connections. Martian logging alerts you to spoofed packets. Reverse path filtering drops packets that could not have arrived on the interface they were received on. None of these are exotic — they are basic hygiene that belongs on every server.

---

## 3. SSH & Remote Access

SSH is the most important service on most servers. It is the door you walk through to manage everything else. Secure it first — before the web server, before the database, before anything. If SSH is compromised, every other service is compromised.

### 3.1 Key-Based Authentication

Password authentication over SSH is a liability. Passwords can be brute-forced (and they will be — see Section 12). SSH keys are cryptographically stronger, immune to brute force against the service itself, and can be protected with passphrases for an additional layer.

**Generate a key pair:**

```bash
# Ed25519 is the modern default — short keys, fast operations, high security
ssh-keygen -t ed25519 -C "user@hostname"

# If you need RSA compatibility (older systems), use 4096 bits minimum
ssh-keygen -t rsa -b 4096 -C "user@hostname"
```

The `-C` comment is for your own identification — it does not affect security. The passphrase encrypts your private key at rest. If your laptop is stolen and your private key has no passphrase, the attacker has your key. With a passphrase, they have an encrypted file.

**Deploy the public key to a server:**

```bash
# ssh-copy-id handles permissions correctly
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Verify: the public key should appear in the server's authorized_keys
ssh user@server "cat ~/.ssh/authorized_keys"
```

**Permission requirements on the server:**

```bash
# SSH is strict about permissions — too permissive and it refuses the keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
# The home directory itself must not be group-writable or world-writable
```

If SSH silently falls back to password authentication when you expect key auth, the most common cause is wrong permissions on `~/.ssh` or `authorized_keys`. SSH logs the reason in `/var/log/auth.log` (or `journalctl -u sshd`).

### 3.2 SSH Server Hardening

After key auth works, harden the SSH daemon. Edit `/etc/ssh/sshd_config`:

```bash
# Disable password authentication — keys only
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login — always log in as a regular user, then sudo
PermitRootLogin no

# Limit login attempts per connection
MaxAuthTries 3

# Restrict to specific users (whitelist approach)
AllowUsers deployer admin

# Disable empty passwords (defense in depth — even if password auth is off)
PermitEmptyPasswords no

# Disable X11 forwarding unless explicitly needed
X11Forwarding no

# Disable agent forwarding unless explicitly needed
AllowAgentForwarding no

# Use only protocol version 2 (version 1 is broken — modern sshd defaults to this)
Protocol 2

# Set idle timeout (disconnect inactive sessions after 5 minutes)
ClientAliveInterval 300
ClientAliveCountMax 0

# Log more detail for authentication events
LogLevel VERBOSE
```

After editing, validate the configuration before restarting:

```bash
# Test config syntax — catches typos before they lock you out
sudo sshd -t

# Reload (not restart) to apply changes to new connections while keeping existing ones
sudo systemctl reload sshd
```

**Critical safety rule:** Never close your existing SSH session before verifying the new configuration works. Open a second terminal, try to connect with the new settings. If it fails, you still have your existing session to fix it. Restarting sshd with a bad config while connected through the only SSH session is how you lock yourself out of a remote server.

### 3.3 SSH Key Management

Keys accumulate. People leave teams, laptops get replaced, keys get copied to machines they should not be on. Key management is an ongoing practice, not a one-time setup.

```bash
# Audit authorized_keys — who has access?
cat ~/.ssh/authorized_keys

# Each line is one key — the comment field (last column) identifies it
# Remove keys for people who no longer need access
# Add keys only through a controlled process
```

**Key rotation:** Periodically generate new keys and remove old ones. There is no built-in expiration for SSH keys (unlike certificates), so this requires discipline and process.

**ssh-agent and key forwarding:** `ssh-agent` caches decrypted keys in memory so you do not enter your passphrase for every connection. Agent forwarding (`-A` flag) allows your local key to authenticate through a jump host to a target — but forwarding exposes your key to anyone with root on the jump host. Use `ProxyJump` instead.

### 3.4 Jump Hosts and Bastion Architecture

A bastion host (or jump host) is a hardened gateway between a public network and a private network. Instead of exposing every server's SSH port to the internet, only the bastion is accessible. All other servers accept SSH only from the bastion's internal address.

```bash
# ~/.ssh/config — connect to internal servers through the bastion
Host bastion
    HostName bastion.example.com
    User deployer
    IdentityFile ~/.ssh/id_ed25519

Host internal-web
    HostName 10.0.1.10
    User admin
    ProxyJump bastion

Host internal-db
    HostName 10.0.1.20
    User dbadmin
    ProxyJump bastion
```

```bash
# Direct connection through the bastion — transparent to the user
ssh internal-web
```

`ProxyJump` (SSH 7.3+) is preferable to `ProxyCommand` and agent forwarding. The connection is end-to-end encrypted — the bastion handles TCP forwarding but cannot read the session content. The bastion itself should be aggressively hardened: no services except SSH, minimal packages, strict access controls, detailed logging.

### 3.5 Port Knocking

Port knocking is a technique where the SSH port remains closed (filtered) until a specific sequence of connection attempts to other ports is detected. It is not security — it is obscurity that reduces noise. A port scanner sees a closed port and moves on, which eliminates the vast majority of automated brute-force traffic from your SSH logs.

```bash
# Using knockd — server-side daemon that watches for knock sequences
# /etc/knockd.conf
[openSSH]
    sequence    = 7000,8000,9000
    seq_timeout = 5
    command     = /usr/sbin/nft add rule inet filter input tcp dport 22 ip saddr %IP% accept
    tcpflags    = syn

[closeSSH]
    sequence    = 9000,8000,7000
    seq_timeout = 5
    command     = /usr/sbin/nft delete rule inet filter input handle <handle>
    tcpflags    = syn
```

```bash
# Client-side knock
knock server.example.com 7000 8000 9000 && ssh user@server.example.com
```

Port knocking is useful for reducing log noise from automated scanners but should never be the only access control. It is a noise filter, not a security boundary.

---

## 4. TLS & Certificates

TLS (Transport Layer Security) provides two things: encryption (nobody can read the traffic) and authentication (you know who you are talking to). Without TLS, every HTTP request, every API call, every form submission is readable by anyone between the client and the server. With TLS, the connection is a private tunnel.

### 4.1 How TLS Works

The TLS handshake establishes a shared secret between client and server without transmitting that secret over the network.

**Simplified handshake (TLS 1.3):**

1. **Client Hello** — Client sends supported cipher suites, TLS version, and a random value
2. **Server Hello** — Server selects cipher suite, sends its certificate and a key share
3. **Key Exchange** — Client and server use Diffie-Hellman to derive a shared secret from their key shares, without ever transmitting the secret itself
4. **Finished** — Both sides verify the handshake integrity with the shared key. All subsequent data is encrypted

TLS 1.3 completes this in a single round trip (1-RTT), compared to two round trips for TLS 1.2. It also removed obsolete cipher suites (RC4, DES, 3DES, static RSA key exchange) that were sources of vulnerability in earlier versions. [SRC-TLS-RFC]

### 4.2 The Certificate Chain

A certificate is a signed statement: "This public key belongs to this domain." The signature comes from a Certificate Authority (CA) that the client already trusts.

```
Root CA (self-signed, pre-installed in OS/browser trust stores)
  |
  +-- Intermediate CA (signed by root)
        |
        +-- Leaf certificate (signed by intermediate, identifies your domain)
```

**Why the chain matters:**

- **Root CA** — The anchor of trust. Root certificates are distributed with operating systems and browsers. There are roughly 100-150 root CAs trusted by default.
- **Intermediate CA** — Insulates the root. If an intermediate is compromised, only that intermediate's certificates are revoked, not the root. The root key stays offline in a vault.
- **Leaf certificate** — Your server's certificate. Contains your domain name, public key, validity period, and the intermediate CA's signature. This is what `openssl s_client` shows you.

The client verifies the chain by checking each signature up to a trusted root. If any link is missing, expired, or revoked, the verification fails and the connection is refused (or the browser shows a warning).

### 4.3 Let's Encrypt and Automated Certificate Management

Let's Encrypt is a free, automated, open Certificate Authority. It issues domain-validated (DV) certificates using the ACME protocol. The sysadmin installs a client (certbot, acme.sh), the client proves domain control, and the CA issues the certificate. No human intervention after initial setup. [SRC-LETSENCRYPT]

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate using HTTP-01 challenge (proves you control the web server)
sudo certbot certonly --standalone -d example.com -d www.example.com

# Or with nginx already running
sudo certbot --nginx -d example.com -d www.example.com

# Certificates are stored in /etc/letsencrypt/live/example.com/
# fullchain.pem  — leaf + intermediate (what the web server serves)
# privkey.pem    — private key (protect this file)
# chain.pem      — intermediate only
# cert.pem       — leaf only
```

**Automatic renewal:** Let's Encrypt certificates are valid for 90 days. Certbot installs a systemd timer (or cron job) that runs `certbot renew` twice daily. It only renews certificates within 30 days of expiration.

```bash
# Verify auto-renewal is configured
sudo systemctl status certbot.timer

# Test renewal without actually renewing
sudo certbot renew --dry-run
```

The 90-day lifetime is intentional. Shorter lifetimes limit the damage window if a key is compromised. Automated renewal means this short lifetime does not create operational burden — if your renewal is automated and tested, 90 days is safer than the old 1-2 year certificates that were forgotten until they expired in production at 3 AM.

### 4.4 Certificate Lifecycle

Every certificate follows a lifecycle. Failures at any stage cause outages.

| Stage | Actions | Failure Mode |
|-------|---------|-------------|
| **Generation** | Create private key, generate CSR or use ACME | Weak key, wrong domain name |
| **Issuance** | CA validates domain, signs certificate | Validation failure, rate limit exceeded |
| **Deployment** | Install cert and key, configure web server | Wrong file paths, missing intermediate, permission errors |
| **Monitoring** | Track expiration dates, check chain validity | Expired cert causes outage, missing alerts |
| **Renewal** | Re-run ACME or submit new CSR | Renewal fails silently, nobody notices until outage |
| **Revocation** | Invalidate compromised certificate via CRL/OCSP | Revocation not propagated, clients still trust compromised cert |

### 4.5 OpenSSL Commands Every Sysadmin Should Know

```bash
# View certificate details (expiration, issuer, subject, SAN)
openssl x509 -in cert.pem -text -noout

# Check certificate expiration date
openssl x509 -in cert.pem -enddate -noout

# Verify a certificate chain
openssl verify -CAfile chain.pem cert.pem

# Test TLS connection to a remote server
openssl s_client -connect example.com:443 -servername example.com

# Generate a private key
openssl genrsa -out server.key 4096

# Generate a CSR from an existing key
openssl req -new -key server.key -out server.csr

# Check if a private key matches a certificate
openssl x509 -in cert.pem -modulus -noout | openssl md5
openssl rsa -in server.key -modulus -noout | openssl md5
# If the MD5 hashes match, the key and cert belong together

# Convert between formats (PEM to PKCS12 for Java/Windows)
openssl pkcs12 -export -out server.p12 -inkey server.key -in cert.pem -certfile chain.pem
```

These are diagnostic tools. When a certificate problem occurs — expired cert, chain mismatch, wrong key — these commands let you isolate the issue in minutes instead of guessing.

### 4.6 The Cost of Expired Certificates

An expired certificate breaks trust. Browsers show alarming warnings. API clients reject connections. Automated systems halt. The service may be running perfectly — but no client will talk to it.

Certificate expiration is the most preventable cause of TLS outages. The fix is monitoring and automation: track expiration dates, alert before they expire, automate renewal wherever possible. Every expired certificate represents a monitoring failure.

---

## 5. Firewalls & Network Boundaries

A firewall decides what traffic enters and leaves a system. It is the front door — you decide who enters, under what conditions, and you log who was turned away. [Module 02](02-network-foundations.md) covers networking fundamentals. This section covers firewall policy design and the operational reality of what firewalls block.

### 5.1 Default Deny

The most important firewall principle: deny everything, then explicitly allow what you need. This is the opposite of the default state on most systems, where everything is allowed and you block specific threats.

Default deny means: if you did not write a rule to permit it, it is dropped. A new service does not become accessible until you add a firewall rule. A misconfigured application does not accidentally expose itself to the internet.

```bash
# nftables — start with default deny for all chains
table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;

        # Allow established/related connections (responses to your outbound traffic)
        ct state established,related accept

        # Allow loopback (local services talking to each other)
        iif lo accept

        # Allow SSH (your management access — never lock yourself out)
        tcp dport 22 accept

        # Allow HTTP/HTTPS (if running a web server)
        tcp dport { 80, 443 } accept

        # Allow ICMP ping (optional but useful for monitoring)
        icmp type echo-request accept
        icmpv6 type echo-request accept

        # Everything else is dropped by default policy
        # Log dropped packets (optional — see Section 5.3)
        log prefix "nftables-drop: " counter drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
        # This is not a router — drop all forwarded traffic
    }

    chain output {
        type filter hook output priority 0; policy accept;
        # Allow all outbound (server needs to reach package repos, DNS, NTP, etc.)
        # Restrict outbound if your threat model requires it
    }
}
```

### 5.2 Zone-Based Policies

Real networks have zones with different trust levels. The firewall enforces boundaries between them.

| Zone | Trust Level | Examples | Policy |
|------|------------|----------|--------|
| **Internet** | Untrusted | Everything outside your network | Default deny inbound, allow established |
| **DMZ** | Semi-trusted | Web servers, mail servers, DNS | Accept specific ports from internet, limited access to internal |
| **Internal** | Trusted | Application servers, databases | Accept from DMZ and internal only, deny from internet |
| **Management** | High trust | SSH access, monitoring, backup | Accept from specific IPs only, deny all others |

Traffic rules between zones:

- **Internet to DMZ:** Only specific ports (80, 443) to specific hosts
- **DMZ to Internal:** Only specific services (database port from web server)
- **Internal to DMZ:** Generally allowed (monitoring, deployment)
- **Internet to Internal:** Never directly. Always through DMZ or VPN
- **Any to Management:** Only from designated management hosts

### 5.3 Logging Dropped Traffic

The firewall log is where you see the noise. Every dropped packet is a connection attempt that was denied — most of it automated scanning, probing, and brute force from botnets across the internet.

This is the digital equivalent of junk mail. It wastes the carrier's bandwidth, your server's CPU cycles processing and dropping it, and your disk space logging it. The anti-waste principle applies: log enough to understand the pattern, not so much that the logs themselves become the waste.

```bash
# nftables — log dropped packets with rate limiting
# Without rate limiting, a port scan generates thousands of log entries per second
chain input {
    # ... allow rules ...

    # Rate-limited logging — max 5 log entries per minute for dropped packets
    limit rate 5/minute log prefix "fw-drop: " counter drop
}
```

```bash
# View firewall drops in real time
journalctl -f | grep "fw-drop"

# Count drops per source IP in the last hour
journalctl --since "1 hour ago" | grep "fw-drop" | grep -oP 'SRC=\K[\d.]+' | sort | uniq -c | sort -rn | head -20
```

What you will see: dozens to hundreds of unique source IPs per day, scanning common ports (22, 23, 80, 443, 3389, 8080, 8443), probing for known vulnerable services, attempting default credentials. This is normal. This is what the internet looks like from the perspective of a server with a public IP. The firewall is doing its job.

### 5.4 UFW for Simplicity

UFW (Uncomplicated Firewall) is a frontend for nftables/iptables that provides a simpler interface for common cases. If your firewall needs are straightforward, UFW reduces the chance of misconfiguration.

```bash
# Enable UFW with default deny inbound
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (do this BEFORE enabling UFW)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH from a specific subnet only
sudo ufw allow from 10.0.0.0/24 to any port 22

# Enable UFW
sudo ufw enable

# Check status
sudo ufw status verbose
```

UFW is appropriate for single-server setups with simple requirements. For complex multi-zone architectures, nftables gives you the control you need.

---

## 6. Intrusion Detection

Detection comes before prevention. You cannot prevent what you do not understand. Intrusion detection systems (IDS) monitor for unauthorized access, policy violations, and anomalous behavior, then alert the sysadmin to investigate. The human makes the judgment call — the system provides the data.

### 6.1 Host-Based vs. Network-Based

| Aspect | Host-Based IDS (HIDS) | Network-Based IDS (NIDS) |
|--------|----------------------|-------------------------|
| **Where** | On each individual host | At network boundaries or taps |
| **What it monitors** | File changes, syscalls, logs, processes | Network traffic, packet payloads |
| **Examples** | AIDE, OSSEC, auditd, Samhain | Suricata, Zeek (formerly Bro) |
| **Strengths** | Sees encrypted traffic (after decryption), detects local changes | Sees network-wide patterns, detects lateral movement |
| **Weaknesses** | Must be installed on each host, can be disabled by root compromise | Cannot see encrypted payloads, misses local attacks |
| **Best for** | File integrity, config changes, privilege escalation | Network scanning, C2 traffic, exfiltration |

Use both. They complement each other. HIDS tells you "this file changed" — NIDS tells you "this host is talking to a known malicious IP."

### 6.2 File Integrity Monitoring with AIDE

AIDE (Advanced Intrusion Detection Environment) creates a database of file checksums and metadata, then periodically compares the current state against the database. If a file changes that should not have changed, AIDE reports the difference. [SRC-AIDE]

```bash
# Install AIDE
sudo apt install aide

# Initialize the database (snapshot of current state)
sudo aideinit

# The database is created at /var/lib/aide/aide.db.new
# Move it to the expected location
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run a check — compare current state to database
sudo aide --check

# After intentional changes (package updates, config changes), update the database
sudo aide --update
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

**AIDE configuration (/etc/aide/aide.conf):**

```
# Monitor critical system files
/etc    p+i+u+g+s+m+S+sha256
/bin    p+i+u+g+s+m+S+sha256
/sbin   p+i+u+g+s+m+S+sha256
/usr/bin   p+i+u+g+s+m+S+sha256
/usr/sbin  p+i+u+g+s+m+S+sha256

# Exclude directories that change frequently
!/var/log
!/var/cache
!/tmp
```

The attribute flags: `p` (permissions), `i` (inode), `u` (user), `g` (group), `s` (size), `m` (mtime), `S` (check for growing size), `sha256` (hash). If any of these change on a monitored file and you did not make the change, something happened that needs investigation.

### 6.3 Auditd: Kernel-Level Auditing

The Linux audit system (`auditd`) monitors system calls at the kernel level. It can watch specific files, track specific system calls, and record who did what. It operates below the application layer — a compromised application cannot easily evade kernel-level auditing. [SRC-AUDITD]

```bash
# Install auditd
sudo apt install auditd audispd-plugins

# Key audit rules (/etc/audit/rules.d/security.rules)

# Watch sensitive files for any access
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity

# Watch SSH configuration and authorized keys
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /root/.ssh/authorized_keys -p wa -k authorized_keys

# Watch for privilege escalation (setuid/setgid changes)
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod

# Watch for unauthorized user/group modifications
-a always,exit -F arch=b64 -S execve -F path=/usr/sbin/useradd -k user_creation
-a always,exit -F arch=b64 -S execve -F path=/usr/sbin/usermod -k user_modification
-a always,exit -F arch=b64 -S execve -F path=/usr/sbin/userdel -k user_deletion

# Watch for sudo usage
-w /var/log/sudo.log -p wa -k sudo_log
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers

# Make the configuration immutable until next reboot
-e 2
```

```bash
# Search audit logs
ausearch -k identity --start today
ausearch -k sshd_config --start "1 week ago"
ausearch -k authorized_keys

# Generate audit reports
aureport --auth          # Authentication attempts
aureport --login         # Login attempts
aureport --failed        # Failed events
aureport --summary       # Overall summary
```

The `-e 2` rule at the end makes the audit configuration immutable — it cannot be changed without rebooting. This prevents an attacker who gains root from silently disabling auditing. It also means you must reboot to change audit rules, so get them right before applying this line.

### 6.4 OSSEC: Integrated HIDS

OSSEC combines file integrity monitoring, log analysis, rootkit detection, and real-time alerting in a single agent-based system. It can monitor multiple servers from a central manager. [SRC-OSSEC]

```bash
# Install OSSEC (agent mode, reporting to a manager)
# Or run in standalone (local) mode for a single server
sudo apt install ossec-hids

# Key configuration in /var/ossec/etc/ossec.conf
# - File integrity monitoring paths
# - Log files to analyze
# - Alert levels and notification rules
# - Active response rules (optional — auto-block attacking IPs)
```

OSSEC's active response feature can automatically block source IPs after detecting brute-force attacks. This is powerful but must be configured carefully — false positives in active response can lock out legitimate users.

### 6.5 Network IDS with Suricata

Suricata is an open-source network IDS/IPS (intrusion detection/prevention system) that inspects network traffic using rule sets. It can identify known attack patterns, protocol anomalies, and suspicious traffic. [SRC-SURICATA]

The distinction between detection and prevention matters:

- **IDS mode:** Monitors traffic, generates alerts, takes no action. The sysadmin reviews alerts and decides.
- **IPS mode:** Monitors traffic AND can drop or reject malicious packets in-line. Faster response, higher risk of false positives disrupting legitimate traffic.

Start with IDS mode. Learn what your normal traffic looks like. Tune the rules to reduce false positives. Only move to IPS mode for rules you trust completely.

### 6.6 The Detection Principle

Detect first, prevent what you understand. This ordering matters.

Prevention without detection is guessing — you block things you think are attacks but have no way to verify. Detection without prevention is awareness — you know what is happening and can respond intelligently.

The ideal is both: detection that feeds into prevention. But detection always comes first. You cannot write good prevention rules until you understand your traffic patterns, your normal baseline, and your actual threat landscape. The logs teach you what to block.

---

## 7. Authentication & Authorization

Authentication proves identity. Authorization determines permissions. They are separate steps in a chain, and confusing them leads to security failures. The full chain: identify, authenticate, authorize, audit. Each step is a checkpoint in the trust verification process.

### 7.1 The Auth Chain

| Step | Question | Mechanism | Failure Mode |
|------|----------|-----------|-------------|
| **Identify** | Who are you claiming to be? | Username, certificate CN, API key ID | Impersonation |
| **Authenticate** | Prove it. | Password, SSH key, MFA token, certificate | Credential theft, brute force |
| **Authorize** | What are you allowed to do? | File permissions, sudo rules, RBAC policies | Privilege escalation |
| **Audit** | What did you actually do? | auditd, access logs, session recording | Evidence tampering |

Each step depends on the previous one. Authentication without identification is meaningless (you proved something, but what?). Authorization without authentication is dangerous (you granted access, but to whom?). Any step without audit is unaccountable.

### 7.2 PAM: Pluggable Authentication Modules

PAM is the authentication framework for Linux. Every program that authenticates users — login, sudo, sshd, su — uses PAM. PAM configuration files in `/etc/pam.d/` define a stack of modules that execute in order. [SRC-PAM]

```bash
# /etc/pam.d/common-auth — shared authentication stack
auth    required    pam_faildelay.so    delay=2000000
auth    required    pam_env.so
auth    sufficient  pam_unix.so nullok try_first_pass
auth    required    pam_deny.so

# Breaking this down:
# pam_faildelay.so — 2-second delay after failed auth (slows brute force)
# pam_env.so       — set environment variables
# pam_unix.so      — check /etc/shadow (sufficient = success here means done)
# pam_deny.so      — if we get here, deny (catch-all)
```

**PAM module types:**

| Type | Purpose |
|------|---------|
| `auth` | Authenticate the user (verify credentials) |
| `account` | Check account validity (expired? locked? allowed at this time?) |
| `password` | Handle password changes (complexity, history) |
| `session` | Setup/teardown for the session (logging, resource limits, mount home) |

**PAM control flags:**

| Flag | Behavior |
|------|----------|
| `required` | Must succeed, but continue evaluating the stack |
| `requisite` | Must succeed, fail immediately if not |
| `sufficient` | If this succeeds and no prior required module failed, stop and accept |
| `optional` | Result is only used if no other modules in the stack determine outcome |

### 7.3 Multi-Factor Authentication

Something you know (password), something you have (hardware token, phone), something you are (biometrics). MFA requires two or more of these categories. A password plus a TOTP code from your phone is MFA. Two passwords are not MFA — both are "something you know." [SRC-NIST-MFA]

**TOTP with Google Authenticator PAM module:**

```bash
# Install the PAM module
sudo apt install libpam-google-authenticator

# As the user, generate a TOTP secret
google-authenticator
# Follow the prompts — save the secret key, note the emergency scratch codes

# Add to PAM stack (/etc/pam.d/sshd)
auth required pam_google_authenticator.so

# Enable in sshd_config
ChallengeResponseAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
# This requires both SSH key AND TOTP code
```

The `AuthenticationMethods` directive allows chaining: `publickey,keyboard-interactive` means the user must present a valid SSH key AND then provide a TOTP code. This is genuine MFA — key (something you have) plus TOTP (something you have, generated by a device you possess).

### 7.4 LDAP for Centralized Authentication

When managing more than a handful of servers, local user accounts become unmanageable. LDAP (Lightweight Directory Access Protocol) provides centralized authentication — users exist in one place, and all servers query the directory. [SRC-LDAP]

```bash
# nsswitch.conf — tells the system where to look for user information
# /etc/nsswitch.conf
passwd:    files ldap
group:     files ldap
shadow:    files ldap

# This means: check local files first (/etc/passwd), then LDAP
# Local root account always works even if LDAP is down
```

**SSSD (System Security Services Daemon)** is the modern alternative to direct LDAP integration. It caches credentials locally (so users can log in when LDAP is unreachable), handles Kerberos authentication, and manages group mappings. It is the recommended approach for production environments.

### 7.5 OAuth and OIDC for Web Services

OAuth 2.0 handles authorization (what can this application do on behalf of the user?). OpenID Connect (OIDC) adds authentication (who is this user?) on top of OAuth. Together, they power "Sign in with..." flows and API authorization. [SRC-OAUTH-RFC]

The key concept: **delegation**. OAuth allows a user to grant an application limited access to their resources without sharing their credentials. The user authenticates with the identity provider (Google, GitHub, a company's SSO), and the application receives a token with specific scoped permissions.

For the sysadmin, this means: your web services should not store passwords if they can delegate authentication to an identity provider. Fewer credentials stored means fewer credentials that can be breached.

---

## 8. Audit Trails

An audit trail answers the fundamental question: who did what, when, from where? Without audit trails, there is no accountability. With them, every action is traceable. The audit trail is the chain of custody for actions — the same concept applied to deeds rather than objects.

### 8.1 What to Audit

Not everything needs auditing at the same level. Over-auditing drowns you in data. Under-auditing leaves gaps. The threat model guides the balance.

**High-value audit targets:**

| Category | What to Watch | Why |
|----------|--------------|-----|
| **Authentication** | Login successes and failures, sudo usage, SSH sessions | Who accessed the system |
| **Authorization changes** | User creation/deletion, group changes, sudoers edits | Who can access the system |
| **Sensitive files** | /etc/passwd, /etc/shadow, authorized_keys, TLS private keys | Credential and key integrity |
| **Service configuration** | sshd_config, nginx.conf, database configs | Configuration drift or tampering |
| **Data access** | Database queries on sensitive tables, file reads on PII | Data protection compliance |
| **System changes** | Package installs/removes, kernel module loads, mount operations | System integrity |

### 8.2 Auditd Configuration in Practice

Building on Section 6.3's introduction to auditd, here is a production-grade audit configuration.

```bash
# /etc/audit/rules.d/10-base.rules — foundational rules

# Buffer size (increase for busy systems)
-b 8192

# Failure mode: 1 = printk, 2 = panic (use 1 for production, 2 for high-security)
-f 1

# Record all authentication events
-w /var/log/faillog -p wa -k auth
-w /var/log/lastlog -p wa -k auth
-w /var/log/tallylog -p wa -k auth

# Monitor login configuration
-w /etc/login.defs -p wa -k login_config
-w /etc/securetty -p wa -k login_config
-w /etc/pam.d/ -p wa -k pam_config

# Monitor network configuration changes
-w /etc/hosts -p wa -k network_config
-w /etc/network/ -p wa -k network_config
-w /etc/sysctl.conf -p wa -k network_config

# Monitor scheduled tasks
-w /etc/crontab -p wa -k cron
-w /etc/cron.d/ -p wa -k cron
-w /var/spool/cron/ -p wa -k cron
-w /etc/anacrontab -p wa -k cron

# Monitor time changes (tampering with timestamps breaks audit trails)
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time_change
-a always,exit -F arch=b64 -S clock_settime -k time_change
-w /etc/localtime -p wa -k time_change
```

### 8.3 Tamper-Evident Logging

Audit logs on the system they monitor are vulnerable — if an attacker gains root, they can modify the logs to cover their tracks. Tamper-evident logging sends logs to a separate system where the attacker cannot reach them.

**Approaches:**

| Method | How It Works | Protection Level |
|--------|-------------|-----------------|
| **Remote syslog** | Forward logs via rsyslog/syslog-ng to a central server in real time | Attacker must compromise both systems |
| **Write-once storage** | Write logs to append-only media or object storage with retention locks | Logs cannot be modified after writing |
| **Log signing** | Cryptographically sign log entries; tampering breaks the signature chain | Tampering is detectable, not preventable |
| **Blockchain-style chaining** | Each log entry includes a hash of the previous entry | Modification of any entry invalidates all subsequent hashes |

```bash
# rsyslog — forward all logs to a remote server
# /etc/rsyslog.d/99-remote.conf
*.* @@logserver.internal:514    # TCP forwarding (use TLS in production)

# On the log server — receive and store
# /etc/rsyslog.d/99-receive.conf
module(load="imtcp")
input(type="imtcp" port="514")
template(name="RemoteLogs" type="string" string="/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log")
*.* ?RemoteLogs
```

The remote log server should be hardened aggressively: no services except syslog, minimal access, its own monitoring. If the log server is compromised, the entire audit trail is suspect.

### 8.4 Compliance Frameworks

Compliance requirements exist because accountability matters. They codify what industries have learned about protecting data, often through painful experience.

| Framework | Scope | Key Audit Requirements |
|-----------|-------|----------------------|
| **PCI-DSS** | Payment card data | Log all access to cardholder data, retain logs 1 year, daily log review |
| **SOC 2** | Service organizations | Access controls, change management, monitoring, incident response |
| **HIPAA** | Healthcare data | Access audit trails, workforce training, encryption requirements |
| **GDPR** | EU personal data | Data access logging, right to erasure, breach notification within 72 hours |

These are not bureaucracy for its own sake. PCI-DSS exists because credit card breaches caused billions in losses. HIPAA exists because medical records were mishandled. GDPR exists because personal data was collected and sold without consent. Each requirement traces to a real-world failure that hurt real people.

The sysadmin implements the technical controls. The compliance framework tells you what to audit and how long to keep it. Your threat model tells you whether you need to comply and which framework applies.

---

## 9. Vulnerability Management

Every piece of software has bugs. Some of those bugs have security implications. Vulnerability management is the practice of knowing what you are running, knowing what vulnerabilities affect it, and deciding when and how to patch.

### 9.1 CVE Tracking

A CVE (Common Vulnerabilities and Exposures) is a standardized identifier for a known vulnerability. CVE-2024-3094 refers to the XZ Utils backdoor. CVE-2021-44228 refers to Log4Shell. The CVE system provides a common language for discussing vulnerabilities. [SRC-CVE]

**Severity scoring (CVSS):**

| Score | Severity | Example |
|-------|----------|---------|
| 0.0 | None | Informational |
| 0.1 - 3.9 | Low | Minor information disclosure |
| 4.0 - 6.9 | Medium | Denial of service, limited information disclosure |
| 7.0 - 8.9 | High | Remote code execution with preconditions |
| 9.0 - 10.0 | Critical | Unauthenticated remote code execution |

CVSS scores provide a starting point for prioritization, not a final answer. A CVSS 9.8 in a library you do not use is less urgent than a CVSS 6.5 in a service exposed to the internet. Context matters.

### 9.2 Security Advisories

Every major distribution publishes security advisories:

```bash
# Debian Security Tracker
# https://security-tracker.debian.org/

# Ubuntu Security Notices
# https://ubuntu.com/security/notices

# Check for available security updates
sudo apt update
apt list --upgradable 2>/dev/null | grep -i security

# View details of a specific advisory
apt changelog <package-name> | head -50
```

Subscribe to the security mailing list for your distribution. This is not optional — it is how you learn about vulnerabilities before they are exploited against your systems.

### 9.3 Unattended Security Upgrades

For Debian/Ubuntu, `unattended-upgrades` automatically applies security patches without manual intervention. This is the minimum acceptable patch management for any internet-facing server.

```bash
# Install
sudo apt install unattended-upgrades

# Configure (/etc/apt/apt.conf.d/50unattended-upgrades)
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

# Auto-remove unused dependencies after upgrade
Unattended-Upgrade::Remove-Unused-Dependencies "true";

# Email notification of what was upgraded
Unattended-Upgrade::Mail "admin@example.com";

# Automatic reboot if required (set time to minimize disruption)
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";

# Enable the timer
sudo dpkg-reconfigure -plow unattended-upgrades
```

**The patch vs. stability trade-off:** Automatic security patches occasionally break things. A patch might change behavior, introduce a regression, or conflict with custom configurations. This risk is real but manageable — and it is almost always smaller than the risk of running known-vulnerable software on the internet.

The mitigation: test patches in staging before production when possible. Have rollback procedures. Monitor services after patches apply. But do not let the fear of breakage prevent you from patching — unpatched systems are compromised systems on a long enough timeline.

### 9.4 Vulnerability Scanning

Scanning tools probe your systems for known vulnerabilities. They automate the process of checking installed software versions against CVE databases.

```bash
# OpenSCAP — NIST-backed scanning framework
sudo apt install openscap-scanner scap-security-guide
sudo oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_standard \
    --results results.xml --report report.html \
    /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml

# Lynis — security auditing tool (lighter weight, good for quick assessments)
sudo apt install lynis
sudo lynis audit system
```

Scanning tells you what is vulnerable. It does not tell you what to prioritize — that requires understanding your threat model, your exposure, and the actual exploitability of each finding. A scanner that reports 200 findings is not useful if you cannot distinguish the critical 5 from the informational 195.

### 9.5 Dependency Auditing

Modern software is built on layers of dependencies. Your web application depends on a framework, which depends on libraries, which depend on other libraries. A vulnerability in any layer affects everything above it. [SRC-OWASP-DEP]

```bash
# Node.js
npm audit

# Python
pip-audit

# Rust
cargo audit

# Go
govulncheck ./...

# System packages — check for known-vulnerable installed packages
debsecan    # Debian
```

The XZ Utils backdoor (CVE-2024-3094) demonstrated that even foundational system libraries can be compromised. Dependency auditing is not just about application libraries — it extends to every package installed on the system.

### 9.6 Zero-Day Reality

A zero-day vulnerability is one that is exploited before a patch exists. You cannot patch what is not known yet. This is why defense in depth matters — every layer of defense buys time and limits damage even when a specific component is compromised.

Against zero-days, your defenses are:
- **Least privilege** — the compromised service has limited access
- **Network segmentation** — the attacker cannot easily move laterally
- **Monitoring** — anomalous behavior is detected even if the specific exploit is not
- **Backups** — you can recover even if the system is destroyed
- **Incident response** — you know what to do when something goes wrong

You cannot prevent every attack. You can make attacks detectable, limit their damage, and recover from them.

---

## 10. Incident Response

When something actually goes wrong — a system is compromised, data is exposed, a service is disrupted — incident response is the structured process for dealing with it. The human makes the judgment calls. The system provides the data.

### 10.1 The Incident Response Lifecycle

| Phase | Actions | Key Principle |
|-------|---------|--------------|
| **Detect** | Alert fires, anomaly noticed, user reports issue | You cannot respond to what you do not detect |
| **Contain** | Isolate the affected system, stop the spread | Limit damage scope — do not let it get worse |
| **Investigate** | Analyze logs, forensic imaging, determine root cause | Understand what happened before you fix it |
| **Remediate** | Patch, rebuild, restore, close the vulnerability | Fix the actual problem, not just the symptom |
| **Learn** | Postmortem, documentation, process improvement | Every incident makes you better — if you learn from it |

These phases are not strictly sequential — containment and investigation often happen simultaneously. But the ordering matters: detect before you contain (you must know there is a problem), contain before you investigate (stop the bleeding first), investigate before you remediate (understand the disease before treating symptoms).

### 10.2 Containment Strategies

When a system is compromised, the first instinct is often "shut it down" or "wipe it and rebuild." Resist this impulse until you have made a forensic copy. Rebooting a compromised server destroys volatile evidence — running processes, network connections, memory contents. You cannot investigate what you have erased.

**Containment options, from least to most disruptive:**

| Strategy | When to Use | Trade-off |
|----------|------------|-----------|
| **Network isolation** | Suspected compromise, need to investigate | System stays running, evidence preserved, no user access |
| **Service shutdown** | Compromised service identified | Other services continue, partial availability |
| **Account lockout** | Compromised credentials | Legitimate user disrupted, but scope limited |
| **Full shutdown** | Active destructive attack, data at risk | Maximum disruption, evidence partially lost |

```bash
# Network isolation — firewall the compromised host
# On the host (if you still have access):
sudo nft flush ruleset
sudo nft add table inet isolate
sudo nft add chain inet isolate input '{ type filter hook input priority 0; policy drop; }'
sudo nft add chain inet isolate output '{ type filter hook output priority 0; policy drop; }'
sudo nft add rule inet isolate input iif lo accept
sudo nft add rule inet isolate output oif lo accept
# Allow only your management IP
sudo nft add rule inet isolate input ip saddr 10.0.0.5 accept
sudo nft add rule inet isolate output ip daddr 10.0.0.5 accept

# From a network device (router/switch): block the host's MAC or IP
# This is more reliable — the compromised host cannot undo it
```

### 10.3 Evidence Preservation

The order of volatility determines what to capture first — most volatile data disappears fastest.

| Priority | Data | Volatility | Collection Method |
|----------|------|-----------|------------------|
| 1 | Running processes, network connections | Seconds | `ps auxf`, `ss -tlnp`, `netstat -anp` |
| 2 | Memory contents | Minutes | `dd if=/dev/mem`, memory forensics tools (LiME) |
| 3 | Temporary files, /tmp, /dev/shm | Minutes | Copy before cleanup |
| 4 | Log files | Hours (rotation) | Copy current + rotated logs |
| 5 | Disk contents | Days | Forensic image (dd, dcfldd) |
| 6 | Backups | Weeks-months | Already preserved if backup system is intact |

```bash
# Quick volatile data capture — run BEFORE any containment action
mkdir /tmp/incident-$(date +%Y%m%d-%H%M%S)
cd /tmp/incident-*

# Running processes with full command lines
ps auxf > processes.txt

# Network connections
ss -tlnp > listening-sockets.txt
ss -anp > all-connections.txt

# Logged-in users
w > logged-in-users.txt
last -50 > recent-logins.txt

# Open files (can reveal attacker activity)
lsof +L1 > deleted-open-files.txt

# Loaded kernel modules (rootkit detection)
lsmod > kernel-modules.txt

# Running cron jobs
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -l -u $user 2>/dev/null && echo "--- $user ---"
done > crontabs.txt

# Filesystem image — full forensic copy
# Do this from a live boot or external system if possible
# sudo dcfldd if=/dev/sda hash=sha256 hashlog=disk-hash.txt of=/mnt/forensics/disk.img
```

See [Module 05 — Process Forensics](05-process-forensics.md) for detailed forensic investigation techniques.

### 10.4 Communication During Incidents

Incidents are stressful. Clear communication prevents panic, coordinates response, and maintains trust.

**Internal communication:**
- Designate an incident commander (one person makes decisions)
- Use a dedicated channel (not the general chat)
- Log every action taken and every decision made, with timestamps
- Do not speculate publicly about cause or scope until you know

**External communication (if user data is affected):**
- Legal requirements may mandate notification within specific timeframes (GDPR: 72 hours)
- Be honest about what you know and what you do not
- Provide specific actions users should take (change passwords, review access)
- Do not downplay — trust is earned through transparency

### 10.5 Blameless Postmortems

After the incident is resolved, conduct a postmortem. The purpose is to learn, not to punish. Blameless postmortems focus on systemic failures — what allowed the incident to happen, what could be improved — not on which individual made a mistake.

**Postmortem template:**

1. **Timeline** — What happened, when, and in what order
2. **Root cause** — The actual underlying issue (not "human error" — dig deeper)
3. **Impact** — What was affected, for how long, how many users
4. **Detection** — How was the incident discovered? Could it have been found sooner?
5. **Response** — What worked in the response? What did not?
6. **Action items** — Specific, assignable tasks to prevent recurrence
7. **Lessons learned** — What does the team know now that it did not before?

The postmortem is not complete until the action items are done. A document that sits in a folder and never changes anything is not a postmortem — it is a ritual.

---

## 11. Privacy by Design

Privacy is not a feature you bolt on after the system is built. It is a design principle that shapes every decision from the beginning. Data minimization means: do not collect what you do not need. Encryption means: protect what you do collect. Access control means: limit who can see it.

### 11.1 Data Minimization

The best protection for data you do not need is to not have it. Every piece of personal data you collect creates a liability — it must be stored, protected, access-controlled, audited, and eventually deleted. Each step is a place where something can go wrong.

**Questions before collecting any personal data:**
- Do we need this for the system to function?
- Can we achieve the same goal with less data?
- Can we use anonymized or aggregated data instead?
- How long do we need to keep it?
- Who will have access?
- What happens when it is no longer needed?

If you cannot answer these questions, you should not be collecting the data.

### 11.2 Encryption at Rest and in Transit

**In transit:** TLS for everything. No exceptions for internal traffic — a compromised internal host can sniff unencrypted traffic on the local network. Section 4 covers TLS in detail.

**At rest:** LUKS (Linux Unified Key Setup) for full-disk encryption. This protects data if the physical hardware is stolen or improperly decommissioned.

```bash
# LUKS — full disk encryption setup (typically done at install time)
# For an additional encrypted partition:
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup luksOpen /dev/sdb1 encrypted-data
sudo mkfs.ext4 /dev/mapper/encrypted-data
sudo mount /dev/mapper/encrypted-data /mnt/secure-data

# Application-level encryption for specific sensitive fields
# Database column encryption, file-level encryption with GPG
# The key management is the hard part — encrypted data with accessible keys is theater
```

**Key management:** Encryption is only as strong as the key management. If the encryption key is stored on the same disk as the encrypted data, physical theft defeats both. Keys should be stored separately — hardware security modules (HSMs), key management services, or at minimum, a separate system from the encrypted data.

### 11.3 Access Controls on Personal Data

Even within your organization, not everyone needs access to all data. The principle of least privilege applies to data access as much as it applies to system access.

```bash
# Database-level: create specific roles with limited access
# PostgreSQL example:
# CREATE ROLE app_readonly;
# GRANT SELECT ON users TO app_readonly;
# GRANT SELECT (id, username, email) ON users TO app_support;
# -- Support can see IDs and usernames but NOT password hashes or personal details

# File-level: restrict access to files containing personal data
sudo chown root:privacy-team /var/data/user-exports/
sudo chmod 750 /var/data/user-exports/
# Only root and members of the privacy-team group can access
```

### 11.4 The Character Sheet Model

In systems that involve personal interaction between users, the privacy model should follow a principle of explicit consent: users create their own profiles declaring exactly what they wish to share. Nothing inferred, nothing auto-populated, nothing scraped.

A user might share as little as a display name and an icon, or as much as they choose. The system presents exactly what the user declared — nothing more. Behavioral data (browsing patterns, interaction frequency, social connections) is never surfaced to other users unless the user explicitly opts in to sharing it.

### 11.5 Trust Relationships as Private Data

Social graphs — who knows whom, who trusts whom, who interacts with whom — are among the most sensitive data a system can hold. These relationships are private data owned by the participants. Never public, never aggregated into analytics, never used for recommendations without explicit consent.

The sysadmin's responsibility: ensure that trust relationship data is encrypted at rest, access-controlled to the minimum necessary for system function, and never logged in a way that allows reconstruction of the social graph from server-side data alone.

This is non-negotiable. The technical implementation must match the privacy promise.

### 11.6 Right to Erasure

When a user requests that their data be deleted, it must actually be deleted — not hidden, not deactivated, not archived. This means:

- **Database records:** Hard delete, not soft delete (for personal data)
- **Backups:** Acknowledge that backups may contain the data and have a policy for how backup retention interacts with deletion requests
- **Logs:** Personal data in logs must be accounted for in your retention policy
- **Third parties:** If personal data was shared with other systems, deletion must propagate

Building deletion into the system from the start is far easier than retrofitting it later. This is why privacy is a design principle, not a feature.

---

## 12. The Daily Reality

This section describes what a sysadmin actually sees in the security logs on a normal day. Not during an incident, not during an attack — just a regular Tuesday. Understanding the baseline is essential for recognizing when something deviates from it.

### 12.1 SSH Brute Force Attempts

Within minutes of exposing port 22 to the internet, a server begins receiving SSH login attempts from automated botnets. This is not hypothetical. It is measured, documented, and universal.

**What it looks like in the logs:**

```
Mar 09 14:23:17 server sshd[12847]: Failed password for root from 185.x.x.x port 49812 ssh2
Mar 09 14:23:19 server sshd[12847]: Failed password for root from 185.x.x.x port 49812 ssh2
Mar 09 14:23:21 server sshd[12847]: Failed password for root from 185.x.x.x port 49812 ssh2
Mar 09 14:23:22 server sshd[12849]: Failed password for invalid user admin from 103.x.x.x port 38291 ssh2
Mar 09 14:23:24 server sshd[12851]: Failed password for invalid user test from 45.x.x.x port 52103 ssh2
Mar 09 14:23:26 server sshd[12853]: Failed password for invalid user ubuntu from 91.x.x.x port 41822 ssh2
```

**The pattern:** Dozens to hundreds of different source IPs, cycling through common usernames (root, admin, test, ubuntu, deploy, postgres, git, oracle), attempting dictionary passwords. Typical rate: 5-50 attempts per minute on a newly exposed server. Some botnets are slow and persistent — 1 attempt per minute to avoid rate limits.

**Why it does not matter (if SSH is hardened):**

With `PasswordAuthentication no`, these attempts cannot succeed. The server rejects them before any password is checked. With `PermitRootLogin no`, attempts against root are doubly futile. The logs fill up, but no damage occurs.

With `fail2ban` or nftables rate limiting, repeat offenders get their IP blocked entirely, reducing log volume:

```bash
# fail2ban — auto-block IPs with too many failed SSH attempts
sudo apt install fail2ban

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
bantime = 3600
findtime = 600
```

### 12.2 Web Crawler and Scanner Traffic

A web server receives a constant stream of requests for pages that do not exist — probing for known vulnerable applications, exposed admin panels, and default configurations.

**Common probes in access logs:**

```
185.x.x.x - - [09/Mar/2026:14:30:00] "GET /wp-admin/ HTTP/1.1" 404 0
103.x.x.x - - [09/Mar/2026:14:30:03] "GET /phpmyadmin/ HTTP/1.1" 404 0
45.x.x.x  - - [09/Mar/2026:14:30:05] "GET /.env HTTP/1.1" 404 0
91.x.x.x  - - [09/Mar/2026:14:30:07] "GET /actuator/health HTTP/1.1" 404 0
72.x.x.x  - - [09/Mar/2026:14:30:09] "POST /xmlrpc.php HTTP/1.1" 404 0
58.x.x.x  - - [09/Mar/2026:14:30:11] "GET /config.php.bak HTTP/1.1" 404 0
41.x.x.x  - - [09/Mar/2026:14:30:13] "GET /server-status HTTP/1.1" 404 0
88.x.x.x  - - [09/Mar/2026:14:30:15] "GET /api/v1/../../etc/passwd HTTP/1.1" 400 0
```

**What they are looking for:**
- **WordPress admin** — the most commonly attacked CMS
- **phpMyAdmin** — database management tools left exposed
- **.env files** — application secrets accidentally deployed
- **Spring Boot actuators** — Java application management endpoints
- **XML-RPC** — WordPress pingback/brute-force vector
- **Config backups** — backup files left in web roots
- **Server status pages** — exposed monitoring endpoints
- **Path traversal** — attempting to read system files through the web server

If you do not run WordPress, these probes are pure noise. If you do run WordPress, they are targeting real vulnerabilities. Either way, the logs record the reality: your web server is probed constantly.

### 12.3 Port Scanning

Port scanners sweep IP ranges looking for open services. Your firewall drop logs show these as connection attempts to ports you are not using.

**Commonly scanned ports:**

| Port | Service | Why Scanned |
|------|---------|------------|
| 22 | SSH | Brute force, known vulnerabilities |
| 23 | Telnet | Often runs with no encryption, default credentials |
| 25 | SMTP | Open relays for spam |
| 445 | SMB | Eternal Blue and related exploits |
| 3306 | MySQL | Default credentials, exposed databases |
| 3389 | RDP | Windows remote desktop brute force |
| 5432 | PostgreSQL | Default credentials, exposed databases |
| 6379 | Redis | Often runs without authentication |
| 8080 | HTTP alt | Development servers left exposed |
| 27017 | MongoDB | Historically ran without auth by default |

A typical server with a public IP receives scans on dozens of ports per day from hundreds of unique source IPs. This is background radiation. The firewall drops it all, and the log records the fact.

### 12.4 Distinguishing Signal from Noise

The experienced sysadmin reads security logs the way a weather forecaster reads atmospheric data — patterns tell you what is coming.

**Noise (normal baseline):**
- SSH brute force from many different IPs = botnet, background noise
- WordPress probes on a server that does not run WordPress = automated scanner, irrelevant
- Port scans hitting closed ports = firewall doing its job

**Signal (requires investigation):**
- SSH login from an IP that has never accessed this server before — and succeeds
- Repeated probes from a single IP, targeting multiple services, over hours = targeted reconnaissance
- Failed login attempts for a username that actually exists on this system
- Unusual outbound connections from a server (beaconing to a C2 server)
- Successful login at an unusual time (3 AM on Saturday from a new country)
- Spike in traffic volume that deviates from the daily pattern

**How to monitor:**

```bash
# Quick SSH auth summary for today
journalctl -u sshd --since today | grep -c "Failed password"
journalctl -u sshd --since today | grep -c "Accepted"

# Unique source IPs attempting SSH today
journalctl -u sshd --since today | grep "Failed password" | \
    grep -oP 'from \K[\d.]+' | sort -u | wc -l

# Successful logins — who actually got in?
journalctl -u sshd --since today | grep "Accepted"

# Last successful logins per user
lastlog

# Currently logged-in users
w
```

The goal is not to read every line — it is to understand the pattern well enough that anomalies stand out. Set up automated alerting for the signals. Let the noise be dropped and counted but not individually reviewed.

### 12.5 Baseline and Trend Analysis

Over time, your logs build a picture of normal. Normal daily SSH failures. Normal request volume on the web server. Normal outbound bandwidth. Normal process count.

When any of these metrics deviate significantly — SSH failures jump 10x, outbound bandwidth spikes at 2 AM, a new process appears that was never there before — that deviation is worth investigating. The baseline makes the anomaly visible.

This is why log retention matters. Without historical data, you have no baseline. Without a baseline, every day looks the same as every other day, and anomalies disappear into the noise.

---

## 13. Cross-References

### Within SYS Series

- [Module 01 — Server Foundations](01-server-foundations.md): User/group management, file permissions, process ownership. The permission model is the first layer of authorization.
- [Module 02 — Network Foundations](02-network-foundations.md): TCP/IP fundamentals, firewall basics, DNS. Section 5 of this module builds on Module 02's network coverage with security-focused policy design.
- [Module 03 — Log Management](03-log-management.md): syslog, journald, log rotation, structured logging. Security logs are a specific application of the general logging infrastructure.
- [Module 05 — Process Forensics](05-process-forensics.md): strace, lsof, /proc investigation. Forensic techniques are essential during incident response (Section 10.3).
- [Module 06 — Access & Resource Control](06-access-resource-control.md): Trust-based access decisions, cgroups, resource limits. Authorization (Section 7) implements the access decisions Module 06 designs.

### Across PNW Series

- [SHE Module 6 — Safety, Standards & Security](../SHE/research/06-safety-standards.md): OWASP IoT Top 10, ETSI EN 303 645, VLAN segmentation for IoT devices. The IoT security standards in SHE complement the server-side security operations documented here. Smart home devices are endpoints that the sysadmin must integrate into the network security model.

### Thematic Connections

- **The Glossary** ([00-glossary.md](00-glossary.md)) defines every security term used across the SYS series. Terms like TLS, SSH, authentication, authorization, hardening, and intrusion detection are defined there with cross-module indexes.
- **The anti-waste principle** runs through security operations: unsolicited traffic wastes carrier bandwidth, server CPU, and disk space. The firewall is a waste filter. Logging noise consumes resources. The sysadmin's job includes knowing the cost of every resource and deciding what is worth paying.
- **Trust is earned, not given.** This principle from the project's trust system maps directly to how authentication and authorization work. Default deny. Prove identity. Grant minimum necessary access. Audit everything. The technical implementation of trust is the subject of this entire module.

---

## 14. Sources

| ID | Source | Description |
|----|--------|-------------|
| SRC-CIS | [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) | Center for Internet Security hardening benchmarks for Linux, cloud, applications |
| SRC-NIST-CSF | [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) | National Institute of Standards and Technology framework: Identify, Protect, Detect, Respond, Recover |
| SRC-NIST-MFA | [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) | Digital Identity Guidelines: Authentication and Lifecycle Management |
| SRC-OWASP | [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Open Web Application Security Project: most critical web application security risks |
| SRC-OWASP-DEP | [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) | Software composition analysis and dependency vulnerability scanning |
| SRC-OPENSSH | [OpenSSH Documentation](https://www.openssh.com/manual.html) | Official documentation for SSH client and server configuration |
| SRC-LETSENCRYPT | [Let's Encrypt Documentation](https://letsencrypt.org/docs/) | Free, automated, open Certificate Authority |
| SRC-TLS-RFC | [RFC 8446 — TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446) | Transport Layer Security Protocol Version 1.3 specification |
| SRC-OAUTH-RFC | [RFC 6749 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) | The OAuth 2.0 Authorization Framework |
| SRC-AUDITD | [Linux Audit Documentation](https://people.redhat.com/sgrubb/audit/) | Linux audit system: auditd, ausearch, aureport |
| SRC-PAM | [Linux-PAM Documentation](http://www.linux-pam.org/Linux-PAM-html/) | Pluggable Authentication Modules for Linux |
| SRC-AIDE | [AIDE Documentation](https://aide.github.io/) | Advanced Intrusion Detection Environment — file integrity monitoring |
| SRC-OSSEC | [OSSEC Documentation](https://www.ossec.net/docs/) | Open Source HIDS: file integrity, log analysis, rootkit detection, active response |
| SRC-SURICATA | [Suricata Documentation](https://docs.suricata.io/) | Open Source IDS/IPS: network traffic analysis and threat detection |
| SRC-CVE | [CVE Program](https://www.cve.org/) | Common Vulnerabilities and Exposures: standardized vulnerability identification |
| SRC-LDAP | [OpenLDAP Documentation](https://www.openldap.org/doc/) | Open source LDAP implementation for centralized authentication |
| SRC-FAIL2BAN | [fail2ban Documentation](https://www.fail2ban.org/) | Intrusion prevention: bans IPs with too many authentication failures |

---

## The Through-Line

Every section of this module connects to the same principle: security is stewardship. The sysadmin sees the attack surface because they manage it. They see the brute force attempts because they read the logs. They see the vulnerabilities because they track the advisories. They see the expired certificates because they monitor them.

None of this is glamorous work. It is the daily practice of maintaining the boundary between what you protect and what you allow. The firewall drops junk traffic that wastes everyone's resources. The audit log records the truth about what happened. The patch management system closes known vulnerabilities before they are exploited. The incident response playbook ensures that when something does go wrong, the response is organized, evidence is preserved, and the system learns from the failure.

Security is not a state you achieve. It is a practice you maintain. The logs record the reality. The steward reads the truth and makes the decisions. Every control exists for a reason, or it should not exist at all.
