# SYS Proof of Concept — Trust-Based Access Server

A zero-dependency Node.js HTTP server that demonstrates trust-based bandwidth control, structured access logging, and anti-waste metrics. This is the working proof of concept for the SYS (Systems Administration) research module.

## Quick Start

```bash
cd www/tibsfox/com/Research/SYS/poc/
node server.mjs
```

That's it. No `npm install`, no build step, no dependencies. Node.js 18+ required (uses ESM, `node:` prefixed imports).

Open the dashboard: **http://localhost:3000/_dashboard**

Browse the PNW research: **http://localhost:3000/** (serves everything under `www/tibsfox/com/Research/`)

## What This Proves

**Trust-based access control works as a practical system.**

Traditional servers treat all clients equally — same bandwidth, same priority, same resources. This PoC demonstrates an alternative where **trust determines throughput**:

- **Owner** gets the full pipe. Unlimited bandwidth. You're paying the bills, you get the fast lane.
- **Trusted** clients (friends, known collaborators) get 1 MB/s. Comfortable, unrestricted browsing.
- **Known** clients get 100 KB/s. Functional access, moderate speed.
- **Visitors** get 10 KB/s. They can read, but they're not prioritized.
- **Unknown/Bot** traffic gets 150 baud. Yes, baud. The modem-era crawl. Not blocked — just deprioritized to near-nothing.

The throttling is real. Responses are streamed in timed chunks that match the tier's bytes-per-second allowance. A bot hitting this server will receive data at 150 bytes per second — it will technically work, but it won't be worth their compute time to continue.

## The Principles

### Infrastructure is a Utility

The admin pays the electricity bill, the bandwidth bill, the hardware cost. Infrastructure is not free and not public — it's a utility that the admin operates. The admin decides how to allocate resources.

### Trust Controls Speed, Not Just Permission

Most access control is binary: allowed or denied. This system introduces a spectrum. Everyone can access the content, but the speed at which they receive it reflects the admin's trust in that client. This is closer to how real-world hospitality works — a friend gets the good chair, a stranger gets the folding one. Nobody is turned away, but the allocation reflects relationship.

### 150 Baud is Not Hostile

It's the digital "no junk mail" sign. Unknown traffic — bots, scrapers, unidentified clients — isn't blocked. It's just deprioritized so severely that the cost of scraping exceeds the value. A 1 MB page at 150 B/s takes nearly 2 hours. Most bots will timeout and move on. The ones that don't? They're getting the data — slowly, honestly, without consuming meaningful bandwidth.

### The Logs Show Reality

Every request is logged as structured JSON with trust tier, bandwidth allocation, bytes served, and response time. This creates an honest record of who consumed what resources. The admin can see at a glance: "40% of my requests were unknown bots that consumed 0.1% of my bandwidth because I throttled them." That's the anti-waste principle working.

### Anti-Waste: Signal Over Noise

The waste ratio metric quantifies how much server activity serves real users versus noise. A well-configured trust system pushes this ratio toward zero waste — not by blocking traffic, but by making waste too slow to accumulate.

## Configuration

Edit `trust-config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "staticRoot": "../../"
  },
  "tiers": {
    "owner":   { "bytesPerSecond": -1,      "label": "Owner — Full Pipe" },
    "trusted": { "bytesPerSecond": 1048576,  "label": "Trusted — 1 MB/s" },
    "known":   { "bytesPerSecond": 102400,   "label": "Known — 100 KB/s" },
    "visitor": { "bytesPerSecond": 10240,    "label": "Visitor — 10 KB/s" },
    "unknown": { "bytesPerSecond": 150,      "label": "Unknown — 150 Baud" }
  },
  "clients": {
    "127.0.0.1": "owner",
    "::1": "owner",
    "192.168.1.50": "trusted"
  },
  "botPatterns": [
    "bot", "crawler", "spider", "scraper", "curl", "wget",
    "python-requests", "Go-http-client", "Java/"
  ]
}
```

- **`server.staticRoot`**: Relative path from the poc directory to the content root. Default `../../` serves all of `www/tibsfox/com/Research/`.
- **`tiers`**: Define any number of trust tiers. `bytesPerSecond: -1` means unlimited.
- **`clients`**: Map IP addresses to trust tiers. `127.0.0.1` and `::1` should always be owner.
- **`botPatterns`**: User-agent substrings that auto-classify a client as "unknown" regardless of IP mapping. Case-insensitive.

## Dashboard

The dashboard at `/_dashboard` shows:

- **Server uptime** — how long the server has been running
- **Total requests** — aggregate count across all tiers
- **Anti-waste ratio** — percentage of requests from unknown/bot tier (lower is better)
- **Tier table** — per-tier breakdown: rate limit, request count, bandwidth served, share percentage
- **Request distribution bar** — visual breakdown of requests by tier
- **Live access log** — last 100 requests with timestamp, status, tier, URL, bandwidth, and response time

Auto-refreshes every 5 seconds via the `/_api/stats` JSON endpoint.

The dashboard uses a terminal-green-on-dark theme. It's meant to feel like reading server output, not a marketing page.

## Access Log

Every request writes a JSON line to `access.log`:

```json
{
  "timestamp": "2026-03-09T15:30:42.123Z",
  "ip": "192.168.1.50",
  "tier": "trusted",
  "method": "GET",
  "url": "/COL/index.html",
  "status": 200,
  "bytesServed": 45678,
  "bytesPerSecAllowed": 1048576,
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  "responseTimeMs": 12
}
```

One JSON object per line (JSONL format). Structured, parseable, greppable:

```bash
# Show all unknown-tier requests
cat access.log | grep '"tier":"unknown"'

# Count requests per tier
cat access.log | jq -r .tier | sort | uniq -c | sort -rn

# Show all 404s
cat access.log | grep '"status":404'
```

Console output is compact and color-coded by tier: green for owner, cyan for trusted, yellow for known, orange for visitor, red for unknown.

## How This Connects to SYS

The SYS research module covers systems administration — the infrastructure that makes everything else possible. This PoC demonstrates the core philosophy:

1. **The admin is the steward.** They maintain the infrastructure, pay the costs, and decide allocation policy.
2. **Trust is the currency.** Not credentials or API keys — relationship-based trust expressed as resource allocation.
3. **Logging is accountability.** Every interaction is recorded honestly. The admin can audit, analyze, and adjust.
4. **Anti-waste is active defense.** Not firewalls and blocklists — graduated throttling that makes waste uneconomical.

The SYS module's broader research covers networking, server administration, security hardening, monitoring, and infrastructure-as-code. This PoC is the seed: a working demonstration that the principles hold up in real code, with zero dependencies, in under 400 lines.

## Files

| File | Purpose |
|------|---------|
| `server.mjs` | Main server — HTTP, routing, throttling, logging, metrics |
| `trust-config.json` | Trust tier definitions, client mappings, bot patterns |
| `dashboard.html` | Terminal-themed monitoring dashboard (auto-refreshing) |
| `README.md` | This file |
| `access.log` | Generated at runtime — JSONL access log (gitignored) |
