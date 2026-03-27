# Open Compute Node — Component Spec: Compute Systems

**Component:** 07-compute-systems.md
**Wave:** 2D (3 tasks)
**Model:** Sonnet (all)
**Dependencies:** 04 (rack positions), 05 (power feeds), 06 (cooling connections)

---

## Mission

Specify the compute payload integration using NVIDIA GB200 NVL72 as the reference platform. Document rack-level power, cooling, and network connections. Design the network architecture from fiber intake through top-of-rack switches to GPU interconnect. Specify community compute allocation as an isolated network segment.

## Deliverables

### D-07.1: GB200 NVL72 Rack Integration
- Per-rack power connection (48-51V DC bus bar)
- Per-rack cooling connection (manifold to CDU)
- Per-rack network connections (InfiniBand for GPU fabric, Ethernet for management)
- Physical mounting (bolt pattern, seismic bracing, cable routing)
- BMC/HMC management network configuration
- Reference design: 2 racks (NVL36×2 configuration preferred for 66kW/rack density)

### D-07.2: Network Architecture
```
External Fiber ──→ Splice Box ──→ Edge Router ──→ Management Switch
                                        │
                                  ┌─────┴─────┐
                                  ↓           ↓
                            Compute VLAN  Community VLAN
                                  │           │
                            InfiniBand    Community
                            Fabric        Access Point
                                  │
                            GPU Racks
```

- Fiber specification (single-mode, LC/UPC or MPO)
- Edge router (BGP peering with upstream provider)
- Management switch (ToR, 48-port GbE + uplinks)
- VLAN isolation (compute, management, community, monitoring)
- Community compute: 10% capacity on isolated VLAN, no cross-VLAN access

### D-07.3: Environmental Control
- Fire suppression: clean agent (FM-200 or Novec 1230), NFPA 75 compliant
- Leak detection: rope sensor along all liquid paths, tied to automated shutoff
- Temperature monitoring: ambient sensors per zone (8 minimum)
- Humidity monitoring: per ASHRAE TC 9.9 recommended ranges
- Access control: electronic lock with audit log, emergency panic bar

## Safety Requirements

- [ ] S-01: PE disclaimer on all pages
- [ ] S-04: Fire suppression specified and NFPA 75 compliant
- [ ] S-05: Leak detection on all liquid circuits
- [ ] Network isolation prevents community traffic from reaching compute VLAN

## Acceptance Criteria

1. Rack power draw matches power system allocation (≤132kW for NVL36×2)
2. Cooling connections match CDU capacity from 06-cooling-water-systems.md
3. Network architecture supports both high-performance GPU fabric and isolated community access
4. Fire suppression coverage verified for all zones
5. Leak detection covers 100% of liquid-carrying pipe runs
