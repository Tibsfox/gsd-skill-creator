# The Logs

> **Module:** SRV-LOG
> **Domain:** Observability
> **Through-line:** *The log is the ground truth.* Not what the UI showed, not what the user remembers, not what the documentation promised. What the system recorded. The sysadmin who reads logs sees reality. Everyone else sees interpretations.

---

## Table of Contents

1. [Why Logs Matter](#1-why-logs-matter)
2. [Syslog — The Original Record Keeper](#2-syslog--the-original-record-keeper)
3. [Journald — Structured Truth](#3-journald--structured-truth)
4. [Log Rotation — Managing the Archive](#4-log-rotation--managing-the-archive)
5. [Access Logs — Who Walked Through Your House](#5-access-logs--who-walked-through-your-house)
6. [Transport Logs — The Postal Route Records](#6-transport-logs--the-postal-route-records)
7. [The Anti-Waste Pattern](#7-the-anti-waste-pattern)
8. [Log Aggregation — One Place for the Truth](#8-log-aggregation--one-place-for-the-truth)
9. [Log Analysis Patterns](#9-log-analysis-patterns)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. Why Logs Matter

Every process that runs on a system leaves a record. Every network connection, every authentication attempt, every file access, every service start and stop, every error, every warning. The log is the trail. It is not optional, it is not decoration, it is not something you configure "later when you have time." It is the first thing you read when something breaks and the last thing you wish you had when something breaks and you have no logs.

This is the fundamental asymmetry of systems administration: when everything works, nobody reads the logs. When something fails, the logs are the only thing that tells you what actually happened. The UI might show "Error." The user might say "it stopped working." The monitoring dashboard might show a red dot. But the log says: at 14:32:07 UTC, process nginx (PID 28451) received SIGSEGV in worker process while handling request from 203.0.113.47 for /api/v2/users, upstream connection to 127.0.0.1:3000 failed with Connection refused.

That is the difference between "something broke" and "I know exactly what broke, when, why, and what caused it."

### 1.1 What Logs Record

A log entry typically contains:

| Field | What It Records | Why It Matters |
|-------|----------------|----------------|
| **Timestamp** | When the event occurred | Establishes sequence. Without time, you cannot correlate events across services. |
| **Source** | Which process, service, or subsystem generated the event | Narrows the search. Thousands of things run on a server — you need to know which one is talking. |
| **Severity** | How important the event is (emergency to debug) | Separates signal from noise. A debug message during normal operation is not the same as an error during a transaction. |
| **Message** | What happened | The actual content. May be structured (key-value, JSON) or free-form text. |
| **Context** | PID, user, session, request ID, connection details | Links the event to a specific execution context. Answers "whose request was this?" |

The timestamp is the most important field. Without it, log entries are facts without a timeline. You cannot say "A caused B" without knowing A happened before B. You cannot correlate a web server error with a database timeout without timestamps that agree. This is why NTP matters — see [Module 05: Data Provenance](05-data-provenance.md) for timestamp integrity.

### 1.2 The Log as Contract

A running system makes an implicit contract: *I will record what I do.* The quality of that contract varies:

- **Good logging:** Timestamps are consistent (UTC or well-defined timezone), messages are structured, severity levels are meaningful, context is included, sensitive data is not logged
- **Bad logging:** No timestamps, free-form strings with no parseable structure, everything logged at INFO regardless of importance, passwords and tokens appearing in plaintext
- **No logging:** Silent failures. The worst outcome. Something happened and there is no record. This is the digital equivalent of a crime scene with no evidence — you know something occurred, but you cannot reconstruct it.

The sysadmin's job is to ensure the contract is honored: services are configured to log, logs are stored reliably, and the information is accessible when needed. This is not overhead — it is the foundation of every other operational capability. You cannot monitor what you do not log. You cannot alert on what you do not monitor. You cannot diagnose what you have no record of.

### 1.3 Logs vs. Metrics vs. Traces

These three form the "three pillars of observability," and they serve different purposes:

| Pillar | What | When to Use | Example |
|--------|------|-------------|---------|
| **Logs** | Discrete events with context | Debugging, forensics, audit | "User admin failed login from 10.0.0.5 at 14:32" |
| **Metrics** | Numeric measurements over time | Trends, capacity planning, alerting | "CPU usage 78% at 14:32, 82% at 14:33, 91% at 14:34" |
| **Traces** | Request path across services | Distributed system debugging | "Request abc123 hit nginx (2ms) -> api (45ms) -> db (120ms) -> timeout" |

Logs tell you *what happened*. Metrics tell you *how much*. Traces tell you *where it went*. A mature observability setup uses all three. This module focuses on logs — the oldest, most fundamental, and most information-dense of the three.

---

## 2. Syslog — The Original Record Keeper

Syslog is the traditional Unix logging system, and its design reflects a simple but durable idea: every process should be able to send log messages to a central daemon, which decides where to write them based on two properties — *facility* (what kind of process sent it) and *severity* (how important it is).

### 2.1 Facility and Severity

The syslog protocol defines 24 facilities and 8 severity levels. The facility identifies the subsystem; the severity classifies the urgency.

**Facilities (selected):**

| Code | Facility | Typical Source |
|------|----------|---------------|
| 0 | kern | Kernel messages (via `printk`) |
| 1 | user | User-level programs (default for applications) |
| 2 | mail | Mail subsystem (Postfix, Dovecot, SpamAssassin) |
| 3 | daemon | System daemons (cron, sshd, ntpd) |
| 4 | auth | Authentication and authorization (PAM, sudo, login) |
| 5 | syslog | Syslog daemon internal messages |
| 9 | cron | Cron scheduling daemon |
| 10 | authpriv | Private authentication data (not forwarded by default) |
| 16-23 | local0-local7 | Locally defined — used by applications, custom services |

**Severity levels (RFC 5424):**

| Code | Level | Meaning | Example |
|------|-------|---------|---------|
| 0 | Emergency | System is unusable | Kernel panic, filesystem corruption |
| 1 | Alert | Immediate action required | Database unreachable, disk full |
| 2 | Critical | Critical condition | Hardware failure, child process death |
| 3 | Error | Error condition | Failed DNS lookup, permission denied |
| 4 | Warning | Warning condition | Disk 80% full, certificate expiring in 7 days |
| 5 | Notice | Normal but significant | Service started, user logged in |
| 6 | Info | Informational | Request served, connection accepted |
| 7 | Debug | Debug-level detail | Variable values, function entry/exit |

The severity levels are not arbitrary. They form a priority ordering that controls filtering: a rule that matches severity "Warning" also matches everything more severe (Error, Critical, Alert, Emergency). This allows you to say "send me everything Warning and above" without listing each level individually.

### 2.2 The /var/log/ Hierarchy

On a typical Linux system, syslog (or rsyslog, or syslog-ng) writes to files under `/var/log/`:

```
/var/log/
  syslog          # General system messages (Debian/Ubuntu)
  messages        # General system messages (RHEL/CentOS)
  auth.log        # Authentication events — logins, sudo, SSH
  kern.log        # Kernel messages — hardware, drivers, OOM
  daemon.log      # Non-kernel daemon messages
  mail.log        # Mail transport agent logs
  dpkg.log        # Package manager operations (Debian)
  yum.log         # Package manager operations (RHEL)
  boot.log        # Boot-time messages
  cron.log        # Scheduled task execution
  faillog         # Failed login attempts (binary, use faillog command)
  lastlog         # Last login for each user (binary, use lastlog command)
  wtmp            # Login/logout records (binary, use last command)
  btmp            # Bad login attempts (binary, use lastb command)
```

The most important files for a sysadmin:

- **auth.log** — Every authentication event. SSH connections, sudo usage, failed logins. When someone tries to break in, this is where the evidence lives. When you need to prove who did what with elevated privileges, this is the record.
- **syslog/messages** — The catch-all. If you do not know where to look, start here. Services that do not have their own log file write here by default.
- **kern.log** — Hardware failures, driver issues, OOM killer events, filesystem errors. When the machine itself is unhappy, the kernel says so here.

### 2.3 Syslog Configuration

The default syslog daemon on most modern distributions is **rsyslog**, which extends the original syslog protocol with:

- TCP transport (original syslog was UDP-only)
- TLS encryption for log transport
- Content-based filtering (beyond facility/severity)
- Output templates for custom log formats
- High-performance queuing for remote forwarding

Configuration lives in `/etc/rsyslog.conf` and `/etc/rsyslog.d/*.conf`:

```bash
# /etc/rsyslog.conf — basic rules

# Auth messages go to auth.log
auth,authpriv.*                 /var/log/auth.log

# All messages of info and above (except auth and mail) go to syslog
*.*;auth,authpriv.none          /var/log/syslog

# Kernel messages go to kern.log
kern.*                          /var/log/kern.log

# Emergency messages go to all logged-in users
*.emerg                         :omusrmsg:*
```

The rule syntax is `facility.severity  destination`. The asterisk means "all." The `none` keyword excludes a facility. This is a routing table for log messages — each line says "messages matching this pattern go to this destination."

### 2.4 The Syslog Protocol (RFC 5424)

RFC 5424 defines the standardized syslog message format. A compliant message contains:

```
<PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
```

Example:
```
<34>1 2026-03-09T14:32:07.123Z webserver01 nginx 28451 - - upstream timed out (110: Connection timed out)
```

Breaking it down:

| Field | Value | Meaning |
|-------|-------|---------|
| PRI | 34 | Priority = facility * 8 + severity. 34 = auth (4) * 8 + critical (2) |
| VERSION | 1 | Syslog protocol version |
| TIMESTAMP | 2026-03-09T14:32:07.123Z | RFC 3339 format, UTC |
| HOSTNAME | webserver01 | Originating host |
| APP-NAME | nginx | Application name |
| PROCID | 28451 | Process ID |
| MSGID | - | Message type identifier (or nil) |
| STRUCTURED-DATA | - | Key-value metadata (or nil) |
| MSG | upstream timed out... | Free-form message |

The priority value is the clever part. A single integer encodes both facility and severity. To decode: `facility = PRI / 8` (integer division), `severity = PRI % 8` (modulo). This compact encoding dates to the original BSD syslog implementation and survives because it works.

### 2.5 Remote Syslog

A single server's logs tell you what happened on that server. But if the server dies — disk failure, compromise, accidental deletion — the logs die with it. Remote syslog solves this by forwarding log messages to a central log server in real time.

```bash
# On the client — forward all messages to the log server
*.* @@logserver.example.com:514    # @@ = TCP, @ = UDP

# On the log server — receive and store by hostname
$template RemoteLog,"/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log"
*.* ?RemoteLog
```

This is the same principle as off-site backups: the copy that matters is the one that survives the disaster. A compromised machine's first action is often to erase or modify its own logs. If those logs were already forwarded to another machine, the attacker's modification is visible — the remote copy still has the original entries.

Transport options:

| Protocol | Reliability | Encryption | Use Case |
|----------|-------------|------------|----------|
| UDP (port 514) | Unreliable (fire and forget) | None | Legacy, LAN only |
| TCP (port 514) | Reliable (connection-based) | None | LAN, moderate security |
| TCP + TLS (port 6514) | Reliable | Encrypted | WAN, any security-sensitive environment |
| RELP | Reliable (application-level ack) | Optional TLS | High-reliability forwarding |

Use TCP with TLS for anything leaving your network. Use RELP when losing a single log message is unacceptable (financial services, healthcare, security monitoring). UDP is only acceptable on a trusted LAN where the log server is one hop away and you accept occasional message loss.

---

## 3. Journald — Structured Truth

Systemd introduced `journald` as a replacement (or complement) to syslog. Where syslog writes text files, journald writes structured binary journals. Where syslog routes by facility/severity, journald captures metadata fields automatically. The trade-off is real and worth understanding.

### 3.1 What Journald Captures

Every log entry in the journal automatically includes:

| Field | Source | Example |
|-------|--------|---------|
| `_SYSTEMD_UNIT` | The systemd unit that generated the message | `nginx.service` |
| `_PID` | Process ID | `28451` |
| `_UID` | User ID of the process | `33` (www-data) |
| `_GID` | Group ID | `33` |
| `_COMM` | Process command name | `nginx` |
| `_EXE` | Process executable path | `/usr/sbin/nginx` |
| `_HOSTNAME` | Machine hostname | `webserver01` |
| `_BOOT_ID` | Unique boot identifier | `a4b2c9d1...` |
| `PRIORITY` | Syslog severity level | `3` (Error) |
| `SYSLOG_FACILITY` | Syslog facility (if from syslog) | `3` (daemon) |
| `MESSAGE` | The actual log message | `upstream timed out` |
| `_SOURCE_REALTIME_TIMESTAMP` | Microsecond-precision timestamp | `1741528327123456` |

This metadata is not optional — journald captures it from the kernel for every message. You do not need to configure your application to include its PID or UID in the log format. The journal knows because it asks the kernel at the time of logging.

### 3.2 journalctl — Querying the Journal

`journalctl` is the tool for reading the journal. Its power comes from field-based filtering:

```bash
# All logs from the current boot
journalctl -b

# All logs from the previous boot (useful after a crash)
journalctl -b -1

# Logs from a specific service
journalctl -u nginx.service

# Logs from a specific service since a specific time
journalctl -u nginx.service --since "2026-03-09 14:00" --until "2026-03-09 15:00"

# Only errors and above
journalctl -p err

# Only kernel messages (equivalent to dmesg with timestamps)
journalctl -k

# Follow mode — like tail -f
journalctl -f

# Follow a specific service
journalctl -u postgresql.service -f

# Show logs from a specific PID
journalctl _PID=28451

# Show logs from a specific user
journalctl _UID=1000

# Show logs between two boots ago and last boot
journalctl -b -2

# Output as JSON (for piping to jq)
journalctl -u nginx.service -o json-pretty

# Count entries by priority
journalctl -p warning --no-pager | wc -l

# Disk usage of the journal
journalctl --disk-usage
```

The power here is *structured queries without grep*. With traditional syslog text files, finding all errors from nginx requires `grep nginx /var/log/syslog | grep -i error` and hoping the word "error" appears in the message. With journald, `journalctl -u nginx.service -p err` is exact — it matches the unit name and priority level from the metadata, not from string matching in the message body.

### 3.3 The Trade-off: Structure vs. Grepability

This is a genuine tension, and experienced sysadmins hold strong opinions:

**Binary journal advantages:**
- Structured queries (filter by unit, user, PID, time range, priority)
- Automatic field capture (no log format configuration needed)
- Integrity checking (forward-sealing detects tampering)
- Compression built in (journals take less disk space)
- Boot-indexed (trivially separate logs by boot cycle)

**Text log advantages:**
- grep, awk, sed, cut work directly — no special tools needed
- Readable on any system, even dead ones (mount the disk, read the files)
- Easy to ship to any aggregation system
- Survives journald bugs (a corrupted journal is harder to recover than a corrupted text file)
- Decades of tooling built around text processing

**The practical answer:** Run both. Most distributions forward journald entries to rsyslog by default, which writes the traditional text files. You get structured queries via `journalctl` for interactive debugging and text files for grep, external tools, and backup. The disk cost of duplicating logs is trivial compared to the diagnostic cost of missing them.

### 3.4 Journal Persistence

By default on some distributions, the journal is stored in `/run/log/journal/` — which is a tmpfs and does not survive reboot. To make journals persistent:

```bash
# Create the persistent journal directory
sudo mkdir -p /var/log/journal

# Set ownership
sudo systemd-tmpfiles --create --prefix /var/log/journal

# Restart journald to pick up the change
sudo systemctl restart systemd-journald
```

Or configure in `/etc/systemd/journald.conf`:

```ini
[Journal]
Storage=persistent      # auto, persistent, volatile, none
SystemMaxUse=500M       # Maximum disk usage
SystemKeepFree=1G       # Minimum free space to maintain
MaxRetentionSec=1month  # Maximum age of entries
MaxFileSec=1week        # Maximum age per journal file
Compress=yes            # Compress journal files
ForwardToSyslog=yes     # Also send to rsyslog
```

The `SystemMaxUse` and `SystemKeepFree` settings are guardrails. Without them, a verbose service can fill the disk with journal entries — and a full disk causes far more damage than missing logs. Set limits. The journal will automatically rotate and discard the oldest entries when limits are reached.

---

## 4. Log Rotation — Managing the Archive

Logs grow. That is their nature — every event adds a line, every request adds an entry, every second adds more data. Without management, logs will fill the disk, and a full `/var/log` partition can bring down services that need to write logs to function (some applications crash if they cannot write to their log file; others silently drop messages).

### 4.1 logrotate

`logrotate` is the standard tool for managing log file lifecycle. It runs daily via cron (or systemd timer), and for each configured log file it:

1. Checks if rotation criteria are met (size, age, or forced)
2. Rotates the current file (renames `service.log` to `service.log.1`, shifts previous rotations down)
3. Optionally compresses rotated files
4. Optionally runs post-rotation commands (like sending SIGHUP to the service to reopen its log file)
5. Deletes rotated files beyond the retention count

Configuration lives in `/etc/logrotate.conf` and `/etc/logrotate.d/`:

```bash
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily               # Rotate daily
    missingok           # Don't error if the log file is missing
    rotate 14           # Keep 14 rotated copies
    compress            # Compress rotated files with gzip
    delaycompress       # Don't compress the most recent rotation
    notifempty          # Don't rotate if the file is empty
    create 0640 www-data adm   # Create new log file with these permissions
    sharedscripts       # Run postrotate once for all matched files
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 $(cat /var/run/nginx.pid)
        fi
    endscript
}
```

### 4.2 Why delaycompress Matters

The `delaycompress` directive skips compression on the most recently rotated file. This matters because many log analysis tools and monitoring scripts read the previous log file (`.1`) immediately after rotation. If it is already compressed, those tools need to handle gzip — or they silently fail and miss data. Keeping the most recent rotation uncompressed for one cycle gives other tools time to process it.

### 4.3 The postrotate Signal

When logrotate renames `service.log` to `service.log.1`, the service still has the old file open (Unix processes hold file descriptors, not file names). The service continues writing to the renamed file. The newly created `service.log` is empty and nobody is writing to it.

The `postrotate` script fixes this by signaling the service to reopen its log file:

- **nginx:** `kill -USR1` causes worker processes to reopen log files
- **Apache:** `apachectl graceful` or sending SIGUSR1
- **rsyslog:** `systemctl restart rsyslog` or `kill -HUP`
- **PostgreSQL:** `pg_ctl logrotate` or `kill -HUP`

Each service has its own convention. Get it wrong and you have an empty log file growing while the real output goes to the rotated file. Get it right and the transition is seamless.

### 4.4 Retention Policies

How long to keep logs is a policy decision that balances three factors:

| Factor | Keep Longer | Keep Shorter |
|--------|-------------|-------------|
| **Storage cost** | Cheap disks, abundant space | Limited disk, cloud storage costs |
| **Forensic value** | Security investigations, compliance audits | Low-value debug logs |
| **Legal/compliance** | PCI-DSS (1 year), HIPAA (6 years), SOX (7 years) | No regulatory requirement |

A reasonable default for systems without compliance requirements:

```
Auth logs:      90 days (who logged in, when, failed attempts)
System logs:    30 days (general operations)
Access logs:    30 days (web requests, API calls)
Debug logs:     7 days (high volume, low long-term value)
Kernel logs:    30 days (hardware events, OOM kills)
Application:    14-30 days (depends on volume and value)
```

The principle: retain what you will actually read, and compress what you might need to search. Do not keep everything forever "just in case" — that is hoarding, not stewardship. But do not delete security-relevant logs too quickly — when an intrusion is discovered three weeks later, you need three weeks of auth.log to reconstruct what happened.

---

## 5. Access Logs — Who Walked Through Your House

Web server access logs are the most information-dense logs most sysadmins encounter. Every HTTP request generates a line, and that line tells you exactly who came to your server, what they asked for, and what happened.

### 5.1 The Combined Log Format

Apache and nginx both use (or can be configured to use) the "combined" log format, which is a de facto standard:

```
203.0.113.47 - alice [09/Mar/2026:14:32:07 +0000] "GET /api/v2/users HTTP/1.1" 200 4523 "https://example.com/dashboard" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
```

Each field:

| Position | Field | Value | Meaning |
|----------|-------|-------|---------|
| 1 | Remote IP | `203.0.113.47` | Client's IP address (or proxy address if behind load balancer) |
| 2 | Ident | `-` | RFC 1413 identity (almost always `-`, virtually unused) |
| 3 | User | `alice` | Authenticated user (or `-` for anonymous) |
| 4 | Timestamp | `[09/Mar/2026:14:32:07 +0000]` | Request time in server's local format |
| 5 | Request | `"GET /api/v2/users HTTP/1.1"` | Method, path, protocol |
| 6 | Status | `200` | HTTP response code |
| 7 | Bytes | `4523` | Response body size in bytes |
| 8 | Referer | `"https://example.com/dashboard"` | Page that linked to this request |
| 9 | User-Agent | `"Mozilla/5.0..."` | Client software identification |

### 5.2 Reading Access Patterns

The access log tells stories if you know how to read it:

**Normal traffic pattern:**
```
198.51.100.12 - - [09/Mar/2026:14:32:07 +0000] "GET / HTTP/1.1" 200 8234 "-" "Mozilla/5.0..."
198.51.100.12 - - [09/Mar/2026:14:32:07 +0000] "GET /style.css HTTP/1.1" 200 2340 "https://example.com/" "Mozilla/5.0..."
198.51.100.12 - - [09/Mar/2026:14:32:08 +0000] "GET /script.js HTTP/1.1" 200 15678 "https://example.com/" "Mozilla/5.0..."
198.51.100.12 - - [09/Mar/2026:14:32:08 +0000] "GET /images/logo.png HTTP/1.1" 200 4521 "https://example.com/" "Mozilla/5.0..."
```
A human browsing: loads the page, browser fetches assets. Normal referer chain. Real user-agent. Sequential timing.

**Suspicious pattern — directory scan:**
```
45.33.32.156 - - [09/Mar/2026:03:14:22 +0000] "GET /admin HTTP/1.1" 404 196 "-" "Mozilla/5.0"
45.33.32.156 - - [09/Mar/2026:03:14:22 +0000] "GET /wp-admin HTTP/1.1" 404 196 "-" "Mozilla/5.0"
45.33.32.156 - - [09/Mar/2026:03:14:22 +0000] "GET /wp-login.php HTTP/1.1" 404 196 "-" "Mozilla/5.0"
45.33.32.156 - - [09/Mar/2026:03:14:23 +0000] "GET /.env HTTP/1.1" 404 196 "-" "Mozilla/5.0"
45.33.32.156 - - [09/Mar/2026:03:14:23 +0000] "GET /phpMyAdmin HTTP/1.1" 404 196 "-" "Mozilla/5.0"
```
No referer. Identical user-agent. Sub-second timing between requests. Looking for common vulnerability paths. This is automated scanning — not a person, not a customer, not anyone you want on your server. The access log shows the cost of this noise: five requests, five 404 lookups, five log entries, all waste.

**Suspicious pattern — credential stuffing:**
```
Multiple IPs - - [09/Mar/2026:06:00:01 +0000] "POST /login HTTP/1.1" 401 89 "-" "python-requests/2.28"
Multiple IPs - - [09/Mar/2026:06:00:01 +0000] "POST /login HTTP/1.1" 401 89 "-" "python-requests/2.28"
Multiple IPs - - [09/Mar/2026:06:00:02 +0000] "POST /login HTTP/1.1" 401 89 "-" "python-requests/2.28"
```
Many different IPs hitting the same endpoint with the same user-agent. All 401 responses. This is a distributed brute force attack using a botnet and a list of stolen credentials.

### 5.3 Custom Log Fields

Modern web servers support custom fields for richer access logs:

```nginx
# nginx — extended log format
log_format extended '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct=$upstream_connect_time '
                    'uht=$upstream_header_time urt=$upstream_response_time';
```

The added timing fields (`request_time`, `upstream_response_time`) transform the access log from a traffic record into a performance record. You can now see not just *who* made a request, but *how long* each request took and where the time was spent — in nginx processing, in upstream connection, or in the backend application.

### 5.4 The X-Forwarded-For Problem

When your web server sits behind a load balancer or reverse proxy, the client IP in the access log is the proxy's IP — not the end user's. The real client IP is in the `X-Forwarded-For` header:

```
10.0.0.1 - - [09/Mar/2026:14:32:07 +0000] "GET /api/users HTTP/1.1" 200 4523 "-" "Mozilla/5.0..."
```

The IP `10.0.0.1` is your load balancer. The actual client might be anywhere. To log the real IP:

```nginx
# nginx — use the real IP from the proxy
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
```

If you forget this, your access logs show all traffic coming from one IP, which makes pattern analysis useless. Know your network topology. Know which IP in the log is the client and which is the proxy.

---

## 6. Transport Logs — The Postal Route Records

Network transport logs record every packet, connection, and flow that touches your infrastructure. If access logs tell you who walked through your front door, transport logs tell you every vehicle that drove down your street — including the ones that just drove past, the ones that tried your locked gate, and the ones carrying junk mail.

### 6.1 Firewall Logs

The firewall sees every packet that arrives at your network boundary. Logging dropped or rejected packets creates a record of what was *not* allowed in — which is often more interesting than what was.

```bash
# iptables logging rule — log all dropped incoming packets
iptables -A INPUT -j LOG --log-prefix "IPT-DROP: " --log-level 4
iptables -A INPUT -j DROP

# nftables equivalent
nft add rule inet filter input log prefix "NFT-DROP: " level warn drop
```

Resulting log entries (in kern.log or journald):

```
Mar  9 14:32:07 webserver01 kernel: IPT-DROP: IN=eth0 OUT= MAC=52:54:00:ab:cd:ef SRC=192.0.2.100 DST=203.0.113.5 LEN=44 TOS=0x00 PROTO=TCP SPT=54321 DPT=22 FLAGS=SYN
```

This single line tells you: an incoming TCP SYN packet (a connection attempt) from 192.0.2.100 to your server on port 22 (SSH) was dropped. The firewall did its job. But when you see thousands of these from different IPs, all targeting port 22, you are looking at a distributed SSH scan — automated, persistent, and entirely unsolicited.

### 6.2 TCP Connection Logs

The `ss` command (replacement for `netstat`) shows live TCP connections:

```bash
# All established connections
ss -tn state established

# Connections to port 443 (HTTPS)
ss -tn state established '( dport = :443 )'

# Connections in TIME_WAIT (finished but lingering)
ss -tn state time-wait | wc -l

# Connections in CLOSE_WAIT (remote closed, local hasn't)
ss -tn state close-wait
```

Connection states tell you different things:

| State | What It Means | When It Is a Problem |
|-------|---------------|---------------------|
| ESTABLISHED | Active, data flowing | Too many = possible connection leak or DDoS |
| TIME_WAIT | Connection closed, waiting for stale packets to expire | Normal after high traffic, but thousands indicate rapid connection cycling |
| CLOSE_WAIT | Remote side closed, local side hasn't | Almost always a bug — the application isn't closing its sockets |
| SYN_RECV | Received SYN, sent SYN-ACK, waiting for ACK | Many = possible SYN flood attack |

CLOSE_WAIT is the one that catches applications: it means the remote end hung up but your application still holds the connection open. Usually a missing `close()` call in the code. A growing count of CLOSE_WAIT connections is a connection leak, and it will eventually exhaust file descriptors.

### 6.3 DHCP Lease Logs

DHCP logs record every device that joins your network:

```
Mar  9 08:15:02 dhcpd: DHCPDISCOVER from 00:1a:2b:3c:4d:5e via eth0
Mar  9 08:15:02 dhcpd: DHCPOFFER on 192.168.1.42 to 00:1a:2b:3c:4d:5e via eth0
Mar  9 08:15:02 dhcpd: DHCPREQUEST for 192.168.1.42 from 00:1a:2b:3c:4d:5e via eth0
Mar  9 08:15:02 dhcpd: DHCPACK on 192.168.1.42 to 00:1a:2b:3c:4d:5e via eth0
```

This tells you: at 08:15, a device with MAC address 00:1a:2b:3c:4d:5e joined the network and was assigned IP 192.168.1.42. DHCP logs are the guest registry of your network — every device that connects is recorded. Cross-referencing DHCP logs with access logs and firewall logs lets you trace activity from a MAC address to an IP to specific requests.

### 6.4 NetFlow and sFlow

For high-volume networks where logging every packet is impractical, flow-based monitoring provides aggregate statistics:

| Technology | What It Records | Granularity |
|------------|----------------|-------------|
| **NetFlow** (Cisco/IETF) | Source/dest IP, ports, protocol, byte/packet counts, timestamps | Per-flow (connection) |
| **sFlow** (industry standard) | Sampled packets + interface counters | Statistical sampling (1-in-N packets) |
| **IPFIX** (IETF standard) | Generalized NetFlow with extensible templates | Per-flow, configurable fields |

A flow record says: "From 10:14:00 to 10:14:32, 203.0.113.47 sent 4.2 MB to your server on port 443 across 847 packets." It does not contain the packet contents, but it tells you the volume, duration, and endpoints of every conversation. This is the postal route record — not the contents of the mail, but who sent how much to whom.

Flow data is invaluable for:
- **Capacity planning:** Which links carry the most traffic? When does peak usage occur?
- **Anomaly detection:** Why did traffic to port 53 (DNS) spike 1000x at 3 AM?
- **Cost accounting:** Which internal team or service generates the most egress traffic?
- **Forensics:** After a breach, flow records show what data left the network and where it went

---

## 7. The Anti-Waste Pattern

Here is a question the logs answer that nobody else wants to ask: *how much of your server's work is processing requests nobody asked for?*

### 7.1 Quantifying the Junk

Every web server on the public internet receives unsolicited traffic. Bots scanning for vulnerabilities. Crawlers indexing pages nobody wants indexed. Brute-force login attempts from credential lists. Spam submissions to contact forms. Requests for WordPress files on a server that has never run WordPress.

The access log tells you the cost:

```bash
# Count requests by response code
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

  84521 200    # Successful responses — real work
  12847 301    # Redirects — redirects you configured
   9834 404    # Not found — things that don't exist
   3421 403    # Forbidden — blocked by access rules
   2156 400    # Bad requests — malformed input
    891 401    # Unauthorized — failed auth attempts
```

In this example, roughly 16,000 of ~114,000 requests (14%) were errors — things that do not exist, are not allowed, or are malformed. Every one of those requests consumed CPU cycles, memory, network bandwidth, and disk I/O for the log entry itself. The server did real work to say "no."

### 7.2 The Mail Carrier's Back

Think about the physical mail analogy. Your mail carrier delivers 20 letters. Six are bills, four are personal correspondence, and ten are unsolicited advertising. Those ten ads required:

- Trees cut down for paper
- Ink and printing press time
- Truck fuel for the print shop to the sorting facility
- Sorting facility processing time
- Truck fuel to the local post office
- The mail carrier's physical labor to carry them to your door
- Your time to carry them from the mailbox to the recycling bin

Every step in that chain costs real resources. The letter was never wanted. The sender benefits; everyone else in the chain pays. The postal service should not exist to be a delivery mechanism for the recycling industry's input stream.

The digital version is identical in structure. An unsolicited HTTP request:

- Consumes bandwidth at every network hop
- Uses CPU on the server to parse the request, check routing rules, look up resources
- Uses memory for the connection and request processing
- Uses disk I/O to write the 404 to the log file
- Uses the sysadmin's attention when they read the logs

### 7.3 Measuring the Waste

The logs let you quantify this. Here are patterns that identify waste:

```bash
# Top 20 IPs by request count — find the bots
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Requests for paths that have never existed on this server
awk '$9 == "404" {print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -30

# User agents that are clearly bots
awk -F'"' '$6 ~ /bot|crawler|spider|scan|python-requests/ {print $6}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Requests per hour — find the 3 AM scan spike
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f1,2 | uniq -c | sort -rn | head
```

Once you can see the waste, you can address it:

- **fail2ban:** Automatically ban IPs that generate too many failed requests
- **Firewall rules:** Block known-bad IP ranges
- **Rate limiting:** Throttle clients exceeding reasonable request rates
- **Bot detection:** Challenge suspicious user-agents with CAPTCHAs or JS challenges
- **WAF (Web Application Firewall):** Block known attack patterns at the request level

The sysadmin sees the waste because the sysadmin reads the logs. That is the first step. Everything else follows from seeing the truth.

### 7.4 The Real Cost

On a moderately trafficked server handling 100,000 requests per day, if 15% is unwanted traffic, that is 15,000 requests per day of pure waste. At an average processing cost of 2ms per request (including logging), that is 30 seconds of server CPU time per day spent saying "no." That sounds small until you realize:

- It scales with traffic. A server handling 10 million requests per day at 15% waste is spending 5+ hours of CPU time daily on junk.
- It is not just CPU. Each request uses memory, network bandwidth, and disk I/O.
- Log storage costs scale directly with request count. Those 15,000 waste requests generate 15,000 log lines that you then store, rotate, and potentially analyze.
- In a cloud environment, you pay for every CPU cycle, every byte of egress, every GB of storage. Waste traffic is literally money burned.

The anti-waste principle says: measure first, then act. The logs are the measurement tool. Read them.

---

## 8. Log Aggregation — One Place for the Truth

A single server has its logs in `/var/log/`. Two servers have their logs in two places. Twenty servers have twenty copies of the truth scattered across twenty machines. A hundred servers in a distributed system, each running multiple services, each producing access logs, error logs, application logs, security logs — the truth is fragmented across thousands of files on scores of machines.

Log aggregation solves this by collecting all logs into a central system where they can be searched, correlated, and analyzed as a whole.

### 8.1 Why Centralize

Three scenarios that make centralized logging essential:

**Scenario 1: Distributed request tracing.** A user reports that their API call failed. The request hit the load balancer, was forwarded to web server 3, which called the authentication service, which queried the database, which timed out. The error is on the database server. The user's request touched four machines. Without centralized logging, you need to SSH into four different servers and correlate timestamps manually. With centralized logging, one search finds all four log entries.

**Scenario 2: Post-breach forensics.** An attacker gained access to web server 5 and deleted its auth.log. But those entries were already forwarded to the central log server, which the attacker does not have access to. The evidence survives because it was copied in real time.

**Scenario 3: Capacity planning.** You want to know the total request volume across all your web servers, broken down by hour, for the past 30 days. With decentralized logs, this requires scripting SSH connections to every server, downloading log files, parsing them, and aggregating. With centralized logs, it is a single query.

### 8.2 ELK Stack (Elasticsearch, Logstash, Kibana)

The most widely deployed open-source log aggregation stack:

| Component | Role | What It Does |
|-----------|------|-------------|
| **Elasticsearch** | Storage + search engine | Indexes log data for fast full-text and structured queries. Distributed, horizontally scalable. |
| **Logstash** | Processing pipeline | Receives logs from multiple sources, parses/transforms them (grok patterns, mutate filters, GeoIP lookup), outputs to Elasticsearch. |
| **Kibana** | Visualization + UI | Web dashboard for searching logs, building visualizations, creating alerts. The human interface to the data. |
| **Beats** (Filebeat, Metricbeat) | Lightweight shippers | Agents on each server that tail log files and ship lines to Logstash or directly to Elasticsearch. Low overhead. |

The typical flow:

```
Server 1: Filebeat → reads /var/log/nginx/access.log
Server 2: Filebeat → reads /var/log/nginx/access.log    → Logstash → Elasticsearch → Kibana
Server 3: Filebeat → reads /var/log/auth.log
```

Logstash parses the raw log line into structured fields using grok patterns:

```ruby
# Logstash grok pattern for nginx combined log format
filter {
  grok {
    match => { "message" => "%{COMBINEDAPACHELOG}" }
  }
  date {
    match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
  }
  geoip {
    source => "clientip"
  }
}
```

After parsing, a raw log line becomes a structured document with fields for client IP, timestamp, method, path, status code, bytes, user-agent, and even the geographic location of the client IP. This structured data is what makes Kibana queries and dashboards possible.

### 8.3 Loki + Grafana

An alternative stack from the Grafana ecosystem, designed for lower resource usage:

| Component | Role | Key Difference from ELK |
|-----------|------|------------------------|
| **Loki** | Log aggregation engine | Does not index log content — indexes labels only. Stores raw log lines compressed. Much cheaper to operate than Elasticsearch. |
| **Promtail** | Log shipper | Like Filebeat, but native to Loki. Discovers log files, extracts labels, ships to Loki. |
| **Grafana** | Visualization | Already used for metrics dashboards — adding logs alongside metrics in the same tool. |

Loki's approach is fundamentally different: instead of full-text indexing (like Elasticsearch), it stores log streams labeled by source metadata (job, hostname, container) and only indexes those labels. Searching log content uses brute-force scanning of compressed chunks — like grep, but distributed and parallel.

The trade-off: queries over log content are slower than Elasticsearch (no inverted index), but storage costs are dramatically lower (10-100x less). For many teams, the storage savings outweigh the query speed difference, especially when most log searches start with "show me logs from this service in this time range" — which is a label query, not a content query.

### 8.4 rsyslog Forwarding

For teams that do not need a full aggregation stack, rsyslog's built-in forwarding provides basic centralization:

```bash
# On each server — forward everything to the central server
*.* @@logserver.internal:514

# On the central server — receive and write per-host
$template PerHost,"/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log"
*.* ?PerHost
```

This gives you all logs from all servers organized by hostname in one place. No fancy dashboards, no full-text search — but grep works, the files are text, and you can build simple scripts to analyze them. For a small fleet (under 20 servers), this is often sufficient.

---

## 9. Log Analysis Patterns

The tools for reading logs have existed for decades. They are the same text-processing tools that power every Unix pipeline: `grep`, `awk`, `cut`, `sort`, `uniq`. The sysadmin who knows these tools can answer most questions about system behavior in seconds, directly from the command line.

### 9.1 The Command-Line Toolkit

```bash
# Most common: grep for a pattern
grep "Failed password" /var/log/auth.log

# Count occurrences
grep -c "Failed password" /var/log/auth.log

# Show lines with context (2 lines before, 2 after)
grep -B2 -A2 "error" /var/log/syslog

# Case-insensitive search
grep -i "timeout" /var/log/syslog

# Multiple patterns (OR)
grep -E "error|warning|critical" /var/log/syslog

# Invert match — show lines that DON'T match
grep -v "healthcheck" /var/log/nginx/access.log
```

### 9.2 Extracting and Counting

The most powerful log analysis pattern is: extract a field, sort, count unique values, sort by count. This answers "what happened most often?"

```bash
# Top 10 source IPs of failed SSH logins
grep "Failed password" /var/log/auth.log | \
  awk '{print $(NF-3)}' | \
  sort | uniq -c | sort -rn | head -10

# Top requested URLs
awk '{print $7}' /var/log/nginx/access.log | \
  sort | uniq -c | sort -rn | head -20

# HTTP status code distribution
awk '{print $9}' /var/log/nginx/access.log | \
  sort | uniq -c | sort -rn

# Requests per minute (for traffic spike detection)
awk '{print $4}' /var/log/nginx/access.log | \
  cut -d: -f1-3 | sort | uniq -c | sort -rn | head

# Slowest requests (if response time is logged)
awk '{print $NF, $7}' /var/log/nginx/access.log | \
  sort -rn | head -20
```

The pipeline `sort | uniq -c | sort -rn` is the most frequently used pattern in log analysis. It works on any extracted field. Memorize it.

### 9.3 Regular Expressions for Log Parsing

When log formats are complex, regular expressions extract specific fields:

```bash
# Extract IP addresses from any log line
grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' /var/log/syslog

# Extract email addresses from mail logs
grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' /var/log/mail.log

# Extract timestamps in ISO 8601 format
grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' /var/log/syslog

# Match a specific error pattern with context
grep -P 'upstream\s+timed?\s*out' /var/log/nginx/error.log
```

### 9.4 Time-Based Analysis

Many diagnostic questions are time-based: "What happened between 14:30 and 14:35?"

```bash
# journalctl — native time filtering
journalctl --since "2026-03-09 14:30" --until "2026-03-09 14:35"

# For text log files — awk with timestamp comparison
awk '/09\/Mar\/2026:14:3[0-5]/' /var/log/nginx/access.log

# Requests per second during an incident window
awk '/09\/Mar\/2026:14:3[0-5]/ {print $4}' /var/log/nginx/access.log | \
  cut -d: -f1-4 | sort | uniq -c
```

### 9.5 Building Alerts from Patterns

Once you know what to look for, alerts turn log patterns into notifications:

```bash
# Simple: cron job that checks for failed SSH logins in the last hour
# and emails if count exceeds threshold
FAILS=$(journalctl -u ssh --since "1 hour ago" | grep -c "Failed password")
if [ "$FAILS" -gt 50 ]; then
  echo "SSH brute force detected: $FAILS failures in last hour" | \
    mail -s "SSH Alert" admin@example.com
fi
```

For production use, dedicated alerting tools handle this more robustly:

| Tool | How It Works | When to Use |
|------|-------------|-------------|
| **fail2ban** | Watches log files, bans IPs that match patterns | SSH brute force, web scanning, auth failures |
| **Prometheus Alertmanager** | Evaluates metric rules, sends notifications | Metric-based alerting (error rates, latency thresholds) |
| **Elastalert** | Queries Elasticsearch on schedule, alerts on matches | Log-based alerting with ELK stack |
| **Grafana Alerting** | Evaluates log/metric queries, sends to channels | Unified alerting with Grafana dashboards |

The key principle for alerting: alert on *symptoms*, not *causes*. Do not alert when CPU exceeds 80% — that might be normal during a deployment. Alert when request latency exceeds your SLA for more than 5 minutes — that means users are affected. The system highlights the anomaly; the human makes the judgment call.

### 9.6 The Dashboard

A well-built log dashboard shows at a glance:

- **Request rate** over time (are we busier than usual?)
- **Error rate** over time (is the error rate climbing?)
- **Response time** percentiles (p50, p95, p99 — are things getting slower?)
- **Top error paths** (which endpoints are failing?)
- **Geographic distribution** of traffic (is a DDoS coming from one region?)
- **Authentication failures** over time (is someone trying to break in?)

The dashboard is not a replacement for reading logs. It is a filter that helps the sysadmin decide *which* logs to read. The spike on the error rate graph at 14:32 is the signal; the log entries at 14:32 are the truth.

---

## 10. Cross-References

| Module | Connection |
|--------|-----------|
| [Server Foundations](01-server-foundations.md) | journalctl/systemd integration, service lifecycle logging |
| [The Network](02-the-network.md) | Transport protocols that generate network logs |
| [Process Forensics](04-process-forensics.md) | Process behavior recorded in logs, correlating PID/UID with log entries |
| [Data Provenance](05-data-provenance.md) | Timestamps, chain of custody, log integrity and forensic timelines |
| [Access & Bandwidth](06-access-bandwidth.md) | Access control events in auth.log, bandwidth utilization records |
| [Security Operations](07-security-operations.md) | Security audit trails, intrusion detection via log analysis |
| [Integration Synthesis](08-integration-synthesis.md) | Cross-module log correlation patterns |
| [SHE Module 4](../../../SHE/research/04-platforms-software.md) | InfluxDB/Grafana for time-series metrics and dashboards |
| [BPS Module 7](../../../BPS/research/07-gpu-ml-pipeline.md) | Real-time data processing pipeline monitoring |
| [Glossary](00-glossary.md) | Definitions: syslog, journald, log rotation, log aggregation, access log, audit log, structured logging |

---

## 11. Sources

### Standards and RFCs

1. **RFC 5424** — The Syslog Protocol (IETF, 2009). Defines message format, facility/severity encoding, structured data, and transport requirements. The authoritative specification for syslog interoperability.
   - https://datatracker.ietf.org/doc/html/rfc5424

2. **RFC 5425** — Transport Layer Security (TLS) Transport Mapping for Syslog (IETF, 2009). Specifies TLS-encrypted syslog transport on port 6514.
   - https://datatracker.ietf.org/doc/html/rfc5425

3. **RFC 3164** — The BSD Syslog Protocol (IETF, 2001). The original syslog specification, now considered "legacy" but still widely implemented.
   - https://datatracker.ietf.org/doc/html/rfc3164

### Documentation

4. **rsyslog documentation** — Configuration reference, input/output modules, rulebase engine, and performance tuning for the default syslog daemon on Debian/Ubuntu/RHEL systems.
   - https://www.rsyslog.com/doc/

5. **syslog-ng documentation** — Alternative syslog daemon with advanced filtering, parsing, and routing. Popular in enterprise environments.
   - https://www.syslog-ng.com/technical-documents/doc/syslog-ng-open-source-edition/

6. **systemd-journald.service(8)** — Manual page for the systemd journal service. Covers configuration, storage, forwarding, sealing, and maintenance.
   - https://www.freedesktop.org/software/systemd/man/systemd-journald.service.html

7. **journalctl(1)** — Manual page for the journal query tool. Complete reference for filtering, output formats, and field matching.
   - https://www.freedesktop.org/software/systemd/man/journalctl.html

8. **logrotate(8)** — Manual page for the log rotation utility. Configuration directives, scripting hooks, and common patterns.
   - https://man7.org/linux/man-pages/man8/logrotate.8.html

### Log Aggregation Systems

9. **Elasticsearch Reference** — Storage, indexing, query DSL, and cluster management for the ELK stack's search engine.
   - https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html

10. **Logstash Reference** — Pipeline configuration, input/filter/output plugins, and grok pattern library.
    - https://www.elastic.co/guide/en/logstash/current/index.html

11. **Kibana Guide** — Dashboard creation, Discover interface, visualization types, and alerting.
    - https://www.elastic.co/guide/en/kibana/current/index.html

12. **Grafana Loki Documentation** — Log aggregation engine design, LogQL query language, and Promtail agent configuration.
    - https://grafana.com/docs/loki/latest/

13. **Grafana Documentation** — Dashboard building, data source integration, alerting rules, and log panel usage.
    - https://grafana.com/docs/grafana/latest/

### Web Server Logging

14. **nginx Core Module: ngx_http_log_module** — Access log configuration, custom log formats, conditional logging, and buffer settings.
    - https://nginx.org/en/docs/http/ngx_http_log_module.html

15. **Apache HTTP Server: Log Files** — Common and combined log formats, CustomLog directive, piped logging, and conditional logging.
    - https://httpd.apache.org/docs/current/logs.html

### Security and Monitoring

16. **fail2ban documentation** — Log-based intrusion prevention. Filter definitions, jail configuration, and ban actions.
    - https://www.fail2ban.org/wiki/index.php/Main_Page

17. **Linux Audit System (auditd)** — Kernel-level audit framework for tracking security-relevant events. Rules, reports, and compliance.
    - https://man7.org/linux/man-pages/man8/auditd.8.html

### Books and References

18. **Brendan Gregg, "Systems Performance: Enterprise and the Cloud," 2nd ed., Addison-Wesley, 2020.** Chapter 8 covers file system and log I/O performance. Essential reference for understanding log I/O impact on system performance.

19. **Tom Limoncelli, Christina Hogan, Strata Chalup, "The Practice of System and Network Administration," 3rd ed., Addison-Wesley, 2016.** Chapters on monitoring and logging architecture. Industry standard reference for operational practices.

---

*The log is the ground truth. Not the dashboard, not the alert, not the status page. The log. When the dashboard says "all green" and the user says "it's broken," the sysadmin reads the log and finds the answer. When the alert fires at 3 AM, the sysadmin reads the log before restarting anything. The log is the evidence. Everything else is interpretation.*
