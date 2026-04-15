---
name: incident-triage
description: Diagnose live incidents — load spikes, IO stalls, OOM kills, runaway processes, kernel messages — and stabilize before root-causing.
---

# incident-triage

Own the first 15 minutes of an incident. The goal is **stabilize,
then understand** — root cause can wait until the host is serving
traffic again.

## The first-pass loop

1. `uptime` — load average trend
2. `top` / `htop` — where is CPU or memory going?
3. `vmstat 1 5` — run queue, context switches, swap activity
4. `iostat -xz 1 5` — any device at >80% util with high await?
5. `dmesg -T | tail -100` — OOM, segfaults, block device errors
6. `journalctl -p err -b | tail -50` — recent service errors
7. `ss -s`, `ss -tunlp | wc -l` — connection pressure
8. `df -h`, `inode -i` — disk or inode exhaustion

## Stabilization playbook

- OOM: identify the killer, raise limits or scale horizontally, never just `swapoff`
- Runaway process: `strace -p <pid>` to see what it is stuck on before killing
- IO stall: `iotop -oPa` to attribute, then throttle or migrate
- Journal flood: raise rate limits (`RateLimitBurst=`) rather than dropping entries

Every event gets written into an `IncidentTimeline` record as it happens.
