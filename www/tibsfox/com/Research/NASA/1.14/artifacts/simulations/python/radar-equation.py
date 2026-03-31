#!/usr/bin/env python3
"""
Echo 1 — Passive Relay Link Budget (Radar Equation)
=========================================================================
Mission 1.14: Echo 1 (NASA / Delta DM-19), August 12, 1960
FIRST PASSIVE COMMUNICATIONS SATELLITE — 30.5m aluminized Mylar balloon

Computes the bistatic radar link budget for Echo 1's passive relay.
Unlike an active satellite (which receives, amplifies, and retransmits),
Echo 1 simply reflects whatever radio energy hits its surface. The
received power follows the radar equation: the signal travels UP to
the balloon (free-space path loss), reflects from the surface (radar
cross-section), and travels DOWN to the receiver (another FSPL).

This produces:
  1. Received power vs altitude for Echo 1's passive relay
  2. Comparison: passive relay (Echo 1) vs active relay (Telstar)
  3. Radar cross-section of a 30.5m sphere vs frequency
  4. Link margin vs elevation angle during a pass
  5. Passive vs active satellite scaling — why passive doesn't scale

Requires: numpy, matplotlib
Run: python3 radar-equation.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Constants & Echo 1 Parameters
# =========================================================================
C = 2.998e8              # Speed of light (m/s)
K_BOLTZ = 1.381e-23      # Boltzmann constant (J/K)
PI = np.pi

# Echo 1 satellite
DIAMETER = 30.5          # Balloon diameter (m)
RADIUS = DIAMETER / 2.0  # 15.25 m
MASS = 76.0              # kg
ORBIT_PERI = 1519e3      # Perigee altitude (m)
ORBIT_APO = 1687e3       # Apogee altitude (m)
ORBIT_MID = (ORBIT_PERI + ORBIT_APO) / 2.0  # ~1603 km
R_EARTH = 6371e3         # Earth radius (m)

# Radar cross-section of a sphere in the optical regime (diameter >> wavelength)
# RCS = pi * r^2 (geometric cross-section) for a metallic sphere
RCS = PI * RADIUS**2     # = 730.6 m^2

# Ground station: Bell Labs, Holmdel NJ
FREQ_TX = 960e6          # Transmit frequency (Hz) — UHF band
LAMBDA = C / FREQ_TX     # Wavelength = 0.312 m
P_TX_W = 10e3            # Transmitter power (watts) — 10 kW
G_TX_DBI = 40.0          # Transmit antenna gain (dBi) — large horn
G_RX_DBI = 40.0          # Receive antenna gain (dBi) — large horn

# Receiver (JPL Goldstone for cross-country test)
T_SYS = 300.0            # System noise temperature (K) — 1960 technology
BW = 1000.0              # Receiver bandwidth (Hz)

# Telstar comparison
TELSTAR_P_TX = 2.0       # Telstar onboard transmitter: 2W
TELSTAR_G_TX = 0.0       # Telstar tx antenna gain (dBi, omnidirectional)
TELSTAR_FREQ = 4170e6    # Telstar downlink frequency (Hz)
TELSTAR_LAMBDA = C / TELSTAR_FREQ

# =========================================================================
# Link Budget Functions
# =========================================================================

def fspl_linear(distance_m, wavelength_m):
    """Free-space path loss as a linear factor (not dB)."""
    return (4 * PI * distance_m / wavelength_m)**2

def fspl_db(distance_m, wavelength_m):
    """Free-space path loss in dB."""
    return 10 * np.log10(fspl_linear(distance_m, wavelength_m))

def passive_relay_power(distance_up_m, distance_down_m, rcs_m2,
                        p_tx_w, g_tx_linear, g_rx_linear, wavelength_m):
    """
    Bistatic radar equation for passive relay.
    P_rx = (P_tx * G_tx * G_rx * lambda^2 * RCS) /
           ((4*pi)^3 * R_up^2 * R_down^2)
    """
    numerator = p_tx_w * g_tx_linear * g_rx_linear * wavelength_m**2 * rcs_m2
    denominator = (4 * PI)**3 * distance_up_m**2 * distance_down_m**2
    return numerator / denominator

def active_relay_power(distance_down_m, p_sat_w, g_sat_linear,
                       g_rx_linear, wavelength_m):
    """
    Standard link equation for active relay satellite.
    P_rx = (P_sat * G_sat * G_rx * lambda^2) / ((4*pi)^2 * R_down^2)
    """
    numerator = p_sat_w * g_sat_linear * g_rx_linear * wavelength_m**2
    denominator = (4 * PI)**2 * distance_down_m**2
    return numerator / denominator

def slant_range(altitude_m, elevation_deg):
    """Slant range from ground station to satellite at given elevation."""
    el_rad = np.radians(elevation_deg)
    # Law of cosines in the Earth-satellite geometry
    r = R_EARTH + altitude_m
    return -R_EARTH * np.sin(el_rad) + np.sqrt(
        (R_EARTH * np.sin(el_rad))**2 + 2 * R_EARTH * altitude_m + altitude_m**2
    )

# =========================================================================
# Convert antenna gains from dBi to linear
# =========================================================================
G_TX_LIN = 10**(G_TX_DBI / 10)
G_RX_LIN = 10**(G_RX_DBI / 10)

# =========================================================================
# Plot 1: Received Power vs Altitude (Passive Relay)
# =========================================================================
altitudes_km = np.linspace(200, 5000, 500)
altitudes_m = altitudes_km * 1000

# Assume symmetric geometry: distance_up ≈ distance_down ≈ slant range at 45°
elevations_45 = np.full_like(altitudes_m, 45.0)
ranges_m = slant_range(altitudes_m, 45.0)

p_rx_passive = passive_relay_power(
    ranges_m, ranges_m, RCS,
    P_TX_W, G_TX_LIN, G_RX_LIN, LAMBDA
)

p_rx_passive_dbm = 10 * np.log10(p_rx_passive * 1000)

# Noise floor
noise_power_w = K_BOLTZ * T_SYS * BW
noise_power_dbm = 10 * np.log10(noise_power_w * 1000)

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# --- Subplot 1: Power vs Altitude ---
ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(altitudes_km, p_rx_passive_dbm, color='#2060CC', linewidth=2,
         label='Echo 1 passive relay')
ax1.axhline(y=noise_power_dbm, color='#CC4020', linestyle='--', linewidth=1,
            label=f'Noise floor ({noise_power_dbm:.0f} dBm, {BW:.0f} Hz BW)')
ax1.axvline(x=ORBIT_MID/1000, color='#C0C8D0', linestyle=':', linewidth=1,
            label=f'Echo 1 orbit ({ORBIT_MID/1000:.0f} km)')
ax1.set_xlabel('Altitude (km)')
ax1.set_ylabel('Received Power (dBm)')
ax1.set_title('Echo 1: Received Power vs Altitude\n(10 kW transmitter, 40 dBi antennas, 45° elevation)')
ax1.legend(fontsize=8)
ax1.grid(True, alpha=0.3)
ax1.set_ylim([-180, -80])

# --- Subplot 2: Passive vs Active Comparison ---
ax2 = fig.add_subplot(gs[0, 1])

# Active relay (Telstar-like) at same altitudes
TELSTAR_G_LIN = 10**(TELSTAR_G_TX / 10)
p_rx_active = active_relay_power(
    ranges_m, TELSTAR_P_TX, TELSTAR_G_LIN,
    G_RX_LIN, TELSTAR_LAMBDA
)
p_rx_active_dbm = 10 * np.log10(np.maximum(p_rx_active * 1000, 1e-30))

ax2.plot(altitudes_km, p_rx_passive_dbm, color='#2060CC', linewidth=2,
         label='Echo 1 (passive, 10 kW ground TX)')
ax2.plot(altitudes_km, p_rx_active_dbm, color='#8040CC', linewidth=2,
         label='Telstar-type (active, 2W onboard TX)')
ax2.axhline(y=noise_power_dbm, color='#CC4020', linestyle='--', linewidth=1,
            label='Noise floor')
ax2.set_xlabel('Altitude (km)')
ax2.set_ylabel('Received Power (dBm)')
ax2.set_title('Passive vs Active Satellite Relay\n(Same ground receiver, 45° elevation)')
ax2.legend(fontsize=8)
ax2.grid(True, alpha=0.3)
ax2.set_ylim([-200, -60])

# Annotate the key insight
ax2.annotate('Active relay wins\nat ALL altitudes',
             xy=(3000, p_rx_active_dbm[300]),
             xytext=(3500, -100),
             arrowprops=dict(arrowstyle='->', color='#8040CC'),
             fontsize=8, color='#8040CC')

ax2.annotate('Passive relay: P ∝ 1/R⁴\nActive relay: P ∝ 1/R²',
             xy=(1000, -170), fontsize=8, color='#888888',
             bbox=dict(boxstyle='round', facecolor='#111122', edgecolor='#333'))

# --- Subplot 3: RCS vs Frequency ---
ax3 = fig.add_subplot(gs[1, 0])

freqs_mhz = np.logspace(1, 4, 200)  # 10 MHz to 10 GHz
freqs_hz = freqs_mhz * 1e6
lambdas = C / freqs_hz
size_param = 2 * PI * RADIUS / lambdas  # 2πa/λ

# Optical regime: RCS = π*a² when 2πa/λ >> 1
# Rayleigh regime: RCS = (128/3)*π⁵*a⁶/λ⁴ when 2πa/λ << 1
# Mie regime: oscillations in between
rcs_optical = PI * RADIUS**2 * np.ones_like(freqs_hz)
rcs_rayleigh = (128.0/3.0) * PI**5 * RADIUS**6 / lambdas**4

# Use optical for large size parameter, Rayleigh for small
rcs_approx = np.where(size_param > 10, rcs_optical,
             np.where(size_param < 0.5, rcs_rayleigh,
             rcs_optical * (1 - np.exp(-size_param/3))))

rcs_dbsm = 10 * np.log10(rcs_approx)

ax3.semilogx(freqs_mhz, rcs_dbsm, color='#C0C8D0', linewidth=2)
ax3.axvline(x=960, color='#2060CC', linestyle=':', linewidth=1,
            label=f'Echo 1 freq (960 MHz)')
ax3.axhline(y=10*np.log10(RCS), color='#2060CC', linestyle='--', linewidth=1,
            label=f'Geometric RCS ({10*np.log10(RCS):.1f} dBsm)')
ax3.set_xlabel('Frequency (MHz)')
ax3.set_ylabel('Radar Cross-Section (dBsm)')
ax3.set_title(f'Echo 1 Radar Cross-Section vs Frequency\n(30.5m diameter aluminized Mylar sphere)')
ax3.legend(fontsize=8)
ax3.grid(True, alpha=0.3)

# --- Subplot 4: Link Margin vs Elevation ---
ax4 = fig.add_subplot(gs[1, 1])

elevations_deg = np.linspace(5, 90, 180)
ranges_elev = slant_range(ORBIT_MID, elevations_deg)

p_rx_elev = passive_relay_power(
    ranges_elev, ranges_elev, RCS,
    P_TX_W, G_TX_LIN, G_RX_LIN, LAMBDA
)
p_rx_elev_dbm = 10 * np.log10(p_rx_elev * 1000)
link_margin = p_rx_elev_dbm - noise_power_dbm

ax4.plot(elevations_deg, link_margin, color='#2060CC', linewidth=2,
         label='Echo 1 link margin')
ax4.axhline(y=0, color='#CC4020', linestyle='--', linewidth=1,
            label='Detection threshold (0 dB margin)')
ax4.axhline(y=10, color='#8AAA70', linestyle=':', linewidth=1,
            label='Reliable comm (10 dB margin)')
ax4.fill_between(elevations_deg, link_margin, 0,
                 where=link_margin > 0,
                 alpha=0.1, color='#2060CC')
ax4.fill_between(elevations_deg, link_margin, 0,
                 where=link_margin <= 0,
                 alpha=0.1, color='#CC4020')
ax4.set_xlabel('Elevation Angle (degrees)')
ax4.set_ylabel('Link Margin (dB)')
ax4.set_title(f'Echo 1: Link Margin vs Elevation\n(Altitude {ORBIT_MID/1000:.0f} km, 10 kW TX, 40 dBi antennas)')
ax4.legend(fontsize=8)
ax4.grid(True, alpha=0.3)

# --- Main title ---
fig.suptitle('NASA Mission 1.14 — Echo 1: Passive Relay Link Budget\n'
             'First Passive Communications Satellite — August 12, 1960',
             fontsize=14, fontweight='bold', y=0.98)

plt.savefig('echo1-radar-equation.png', dpi=150, bbox_inches='tight',
            facecolor='#0a0a15', edgecolor='none')
plt.show()

# =========================================================================
# Summary Statistics
# =========================================================================
print("\n" + "=" * 70)
print("Echo 1 — Passive Relay Link Budget Summary")
print("=" * 70)
print(f"\nSatellite:")
print(f"  Diameter:          {DIAMETER} m")
print(f"  Mass:              {MASS} kg")
print(f"  Orbit:             {ORBIT_PERI/1000:.0f} x {ORBIT_APO/1000:.0f} km")
print(f"  RCS (geometric):   {RCS:.1f} m² ({10*np.log10(RCS):.1f} dBsm)")
print(f"\nGround Station:")
print(f"  TX power:          {P_TX_W/1000:.0f} kW ({10*np.log10(P_TX_W*1000):.1f} dBm)")
print(f"  Frequency:         {FREQ_TX/1e6:.0f} MHz (λ = {LAMBDA:.3f} m)")
print(f"  TX antenna gain:   {G_TX_DBI:.0f} dBi")
print(f"  RX antenna gain:   {G_RX_DBI:.0f} dBi")
print(f"  System temp:       {T_SYS:.0f} K")
print(f"  Bandwidth:         {BW:.0f} Hz")
print(f"\nLink Budget (zenith pass, altitude {ORBIT_MID/1000:.0f} km):")
range_zenith = slant_range(ORBIT_MID, 90.0)
p_zenith = passive_relay_power(range_zenith, range_zenith, RCS,
                                P_TX_W, G_TX_LIN, G_RX_LIN, LAMBDA)
p_zenith_dbm = 10 * np.log10(p_zenith * 1000)
margin_zenith = p_zenith_dbm - noise_power_dbm
print(f"  Slant range:       {range_zenith/1000:.0f} km")
print(f"  FSPL (one way):    {fspl_db(range_zenith, LAMBDA):.1f} dB")
print(f"  Received power:    {p_zenith_dbm:.1f} dBm ({p_zenith:.2e} W)")
print(f"  Noise floor:       {noise_power_dbm:.1f} dBm")
print(f"  Link margin:       {margin_zenith:.1f} dB")
print(f"\nPassive vs Active:")
p_active_zenith = active_relay_power(range_zenith, TELSTAR_P_TX,
                                      TELSTAR_G_LIN, G_RX_LIN, TELSTAR_LAMBDA)
p_active_dbm = 10 * np.log10(p_active_zenith * 1000)
print(f"  Echo 1 (passive):  {p_zenith_dbm:.1f} dBm")
print(f"  Telstar (active):  {p_active_dbm:.1f} dBm")
print(f"  Active advantage:  {p_active_dbm - p_zenith_dbm:.1f} dB")
print(f"\nKey insight: Passive relay power ∝ 1/R⁴ (radar equation)")
print(f"             Active relay power ∝ 1/R² (one-way link)")
print(f"             Passive relay requires massive ground stations")
print(f"             Active relay scales to higher orbits and longer distances")
