# Power Redundancy Architectures — Deep Reference

*Power Systems Skill — Transfer switches, generator integration, Uptime Institute tiers*

## Transfer Switch Types

### Automatic Transfer Switch (ATS)

Electromechanical contactor-based switch that automatically transfers load between two power sources.

- **Transfer time:** 1-4 seconds (mechanical contact operation)
- **Mechanism:** Open-transition (break-before-make) or closed-transition (make-before-break, <100ms overlap)
- **Rating:** Matched to load; available from 30A to 4000A
- **Application:** Utility-to-generator transfer for backup power
- **Limitation:** Transfer time too long for IT equipment without UPS buffer — even 100ms causes server reset

### Static Transfer Switch (STS)

Solid-state switch using SCRs (silicon-controlled rectifiers) for near-instantaneous source transfer.

- **Transfer time:** <4 ms (quarter-cycle transfer)
- **Mechanism:** SCR pair per phase; outgoing source SCRs commutate off, incoming SCRs fire
- **Rating:** Available 30A to 4000A at 480V
- **Application:** Dual-utility feed switching for data center distribution; STS at PDU input for source redundancy
- **Advantage:** Transfer faster than IT equipment ride-through (typically 10-20 ms) — no server impact
- **Limitation:** SCR losses generate heat; requires cooling; more expensive than ATS

### Maintained Power (UPS Internal)

Online double-conversion UPS with internal bypass:

- **Transfer time:** 0 ms (continuous power from inverter)
- **Mechanism:** Load always powered from inverter; bypass is for UPS maintenance only
- **Application:** All data center UPS configurations
- **Static bypass:** Solid-state bypass inside UPS; transfers load in <2 ms if inverter fails
- **Maintenance bypass:** Manual external bypass switch; allows complete UPS removal for service

## Uptime Institute Tier Correlation

The Uptime Institute defines four tier levels based on redundancy and fault tolerance:

### Tier I — Basic Site Infrastructure (N)

- **Power path:** Single, non-redundant
- **Redundancy:** N (no spare components)
- **Availability target:** 99.671% (28.8 hours downtime/year)
- **Maintenance impact:** Planned maintenance requires facility shutdown
- **Typical use:** Small business, development environments
- **Power topology:** Single utility feed -> single transformer -> single UPS -> single distribution path

### Tier II — Redundant Components (N+1)

- **Power path:** Single path with redundant components
- **Redundancy:** N+1 for UPS modules, generator, and cooling
- **Availability target:** 99.741% (22 hours downtime/year)
- **Maintenance impact:** Component maintenance without planned outage (one at a time)
- **Typical use:** SMB data centers, colocation
- **Power topology:** Single utility feed -> N+1 UPS modules -> single distribution path

### Tier III — Concurrently Maintainable (N+1, Dual Path)

- **Power path:** Multiple paths, one active
- **Redundancy:** N+1 components, dual path (only one active at a time)
- **Availability target:** 99.982% (1.6 hours downtime/year)
- **Maintenance impact:** Any component can be maintained without impacting IT load
- **Typical use:** Enterprise data centers, colocation premium
- **Power topology:** Dual utility feeds -> dual UPS systems -> dual distribution, one active path
- **Key requirement:** Concurrently maintainable means ANY single component can be taken offline for service

### Tier IV — Fault Tolerant (2N or 2N+1)

- **Power path:** Multiple active paths simultaneously
- **Redundancy:** 2N minimum; 2N+1 preferred
- **Availability target:** 99.995% (0.4 hours downtime/year)
- **Maintenance impact:** Any single fault tolerated without impact; any component maintainable
- **Typical use:** Mission-critical finance, healthcare, government
- **Power topology:** Dual independent utility feeds -> 2N UPS -> 2N distribution -> dual-corded servers
- **Key requirement:** Fault tolerant means a single failure event does NOT cause an outage — system automatically sustains load

### Tier Comparison Summary

| Attribute | Tier I | Tier II | Tier III | Tier IV |
|-----------|--------|---------|----------|---------|
| Redundancy | N | N+1 | N+1 / dual path | 2N or 2N+1 |
| Concurrent maintenance | No | Limited | Yes | Yes |
| Fault tolerant | No | No | No | Yes |
| Uptime target | 99.671% | 99.741% | 99.982% | 99.995% |
| Typical PUE | 1.6-2.0 | 1.4-1.6 | 1.2-1.4 | 1.2-1.4 |
| Relative cost | 1x | 1.5x | 2-3x | 4-5x |

## Generator Integration

### Emergency Power Sequence

1. **Utility fails** — voltage drops below threshold (typically <85% nominal for >3 cycles)
2. **ATS detects loss** — monitoring relay signals loss of preferred source (2-3 seconds)
3. **Generator start signal** — ATS sends start command to generator controller
4. **Generator cranking** — engine starts, ramps to rated speed and voltage (10-15 seconds typical)
5. **Stabilization** — generator output stabilizes within voltage and frequency tolerance (5-10 seconds)
6. **ATS transfer** — ATS transfers load from failed utility to generator (1-4 seconds)
7. **Total transfer time** — 10-30 seconds from utility failure to generator-on-load

**UPS role:** Bridges the 10-30 second gap. UPS battery provides seamless power during generator start. Minimum UPS runtime: 5 minutes (covers most generator start failures with restart attempts).

### Generator Sizing

- **Base load:** Total facility calculated load (from NEC 220 calculation)
- **Motor starting:** Largest motor locked-rotor current (6-8x FLC) for first 3-5 seconds
- **Margin:** Generator kW >= base load kW x 1.25
- **kW vs kVA:** Generator rated in kW at 0.8 PF (e.g., 1000 kW generator = 1250 kVA)
- **Step loading:** Generator should not accept >50% of rated load in a single step; use load sequencing via ATS priority load shedding

### Priority Load Shedding

In generator mode, shed non-critical loads to stay within generator capacity:

| Priority | Load Category | Action |
|----------|--------------|--------|
| 1 (highest) | IT equipment (servers, storage, network) | Never shed |
| 2 | Cooling (CRAC/CRAH for IT rooms) | Never shed |
| 3 | Life safety (fire alarm, egress lighting) | Never shed |
| 4 | Security (access control, cameras) | Shed last |
| 5 | General lighting | Reduce to 50% |
| 6 | Convenience (break rooms, office HVAC) | Shed immediately |
| 7 | EV charging | Shed immediately |

**Implementation:** Programmable load-shedding controller integrated with ATS; sheds loads based on generator capacity and priority table.

## PDU A/B Distribution for 2N

### Physical Layout

For a 2N data center power distribution:

```
                 ┌── PDU A1 ──── Racks 1-20 (A-side)
Utility A ─ UPS A ──── PDU A2 ──── Racks 21-40 (A-side)
                 └── PDU A3 ──── Racks 41-60 (A-side)

                 ┌── PDU B1 ──── Racks 1-20 (B-side)
Utility B ─ UPS B ──── PDU B2 ──── Racks 21-40 (B-side)
                 └── PDU B3 ──── Racks 41-60 (B-side)

Each rack: PSU-A connected to PDU A; PSU-B connected to PDU B
```

### Routing Requirements

- **A-side cables and B-side cables** must be in physically separate cable trays or raceways
- **Fire separation:** A and B path raceways separated by fire-rated partition or distance (>6 feet)
- **No shared raceway:** A single cable tray failure must not affect both paths
- **Labeling:** All A-path components labeled with "A" identifier; all B-path with "B"
- **Color coding:** Common convention: orange/red = Path A, blue = Path B (or per facility standard)

### Verification Testing

During commissioning:
1. Simulate Path A failure (open main UPS A output breaker)
2. Verify all servers continue operating on Path B
3. Monitor server event logs — no power events should appear
4. Repeat for Path B failure
5. Verify PDU BCMS shows load transfer correctly
6. Document results with timestamps

## Common Single Points of Failure (SPFs)

A single point of failure invalidates the redundancy design. Common SPFs found in audit:

| SPF | Impact | Mitigation |
|-----|--------|------------|
| Single utility transformer | Entire facility loses power on transformer failure | Dual utility feeds from separate substations; or generator as alternate source |
| Shared UPS output bus breaker | Both UPS paths share one output connection point | Isolating breakers per module; separate bus per path |
| Shared static bypass | If bypass activates, both paths merge through single point | Separate bypass per UPS or per path |
| Single cable tray for A and B paths | Physical damage (fire, water) disables both paths | Physically separate raceways with fire-rated separation |
| Single chiller/CDU serving entire hall | Cooling failure = thermal shutdown of all IT equipment | N+1 cooling minimum; ideally 2N for Tier IV |
| Single BMS/EPMS controller | Loss of monitoring and automated response | Redundant controllers or standalone safety systems |
| Single fire suppression zone | Accidental discharge or failure affects entire facility | Zone-based suppression with separate detection per zone |

**The most common SPF in "2N" designs that fail audit:** Shared bypass. Many facilities install dual UPS but route both through a single maintenance bypass — defeating the 2N architecture during any bypass event.

## Power Path Verification Checklist

For commissioning and annual re-verification:

- [ ] Document each power path completely from utility service entrance through to server PSU
- [ ] Single-line diagram shows every component: utility meter, main breaker, transformer, UPS, STS (if any), PDU, rack PDU, server PSU
- [ ] Verify physical separation between Path A and Path B raceways
- [ ] Perform failover test for each path independently under load
- [ ] Record transfer times for each ATS and STS in the path
- [ ] Verify server power supplies report no events (no reboot, no event log entry) during path switchover
- [ ] Perform full-load generator test: generator start, ATS transfer, load acceptance, run for minimum 2 hours, transfer back to utility
- [ ] Document generator fuel consumption at full load; verify fuel supply duration meets design target
- [ ] Verify UPS battery runtime test results match design calculations
- [ ] Confirm all breaker trip settings match coordination study recommendations
- [ ] Review arc flash labels on all equipment — current and matching latest study

---
*Deep reference for Power Systems Skill — Redundancy architecture design*
*Source: Uptime Institute Tier Standard, NFPA 110, IEEE 446 (Orange Book)*
