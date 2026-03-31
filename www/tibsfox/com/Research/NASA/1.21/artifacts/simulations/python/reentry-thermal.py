#!/usr/bin/env python3
"""
Friendship 7 Reentry Thermal Analysis
=======================================
NASA Mission Series v1.21

Simulates heat shield thermal response during John Glenn's reentry
aboard Mercury-Atlas 6 / Friendship 7 on February 20, 1962.

During reentry, telemetry (Segment 51) indicated the landing bag deploy
switch had activated — suggesting the heat shield might be loose.
Mission Control retained the retropack as an extra strap. Glenn saw
flaming chunks streaming past his window, not knowing if it was the
retropack or his heat shield disintegrating.

The heat shield was ablative fiberglass honeycomb filled with phenolic
resin. Above ~1,200 C the resin chars and outgasses, carrying heat
away (ablation cooling) — analogous to how Chinook salmon regulate
thermal stress through controlled material transfer in temperature-
gradient rivers.

Physics model:
  Trajectory:  3DOF (velocity, flight path angle, altitude)
  Atmosphere:  Exponential density rho = 1.225 * exp(-h/8500)
  Heating:     Sutton-Graves q = C * sqrt(rho/r_n) * V^3
  Conduction:  1D with ablation above threshold temperature

Organism: Chinook salmon (Oncorhynchus tshawytscha)

Usage: python3 reentry-thermal.py
Dependencies: numpy, scipy, matplotlib
Output: friendship7-reentry.png (4 subplots)
"""

import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt

# ============================================================
# CONSTANTS AND CAPSULE PARAMETERS
# ============================================================

G0 = 9.80665                  # m/s^2
R_EARTH = 6371.0e3            # m
MU = 3.986004418e14           # m^3/s^2
RHO_0 = 1.225                 # kg/m^3 sea-level density
H_SCALE = 8500.0              # m scale height

MASS = 1360.0                 # kg capsule reentry mass
SHIELD_D = 1.89               # m heat shield diameter
NOSE_R = 0.94                 # m effective nose radius
AREA = np.pi * (SHIELD_D / 2) ** 2
CD = 1.2                      # blunt body drag coefficient
C_SG = 1.7415e-4              # Sutton-Graves constant (Earth/air)

# Entry conditions
V_ENTRY = 7840.0              # m/s
GAMMA_ENTRY = -1.5            # deg flight path angle
H_ENTRY = 120.0e3             # m entry interface

# Heat shield thermal properties (ablative phenolic)
SH_RHO = 1440.0               # kg/m^3
SH_CP = 1200.0                # J/(kg*K)
SH_K = 0.5                    # W/(m*K)
SH_ALPHA = SH_K / (SH_RHO * SH_CP)
T_ABLATION = 1473.15          # K (~1200 C)
H_ABLATION = 20.0e6           # J/kg ablation enthalpy
SH_THICK = 0.025              # m initial thickness
EMISSIVITY = 0.85
SIGMA = 5.670374419e-8        # Stefan-Boltzmann
T_AMB = 250.0                 # K upper atmosphere

# Event times (seconds after entry interface)
EV_RETRO_JETTISON = 60.0      # normal jettison point (was NOT jettisoned)
EV_BLACKOUT_START = 180.0     # plasma blackout begin
EV_BLACKOUT_END = 420.0       # plasma blackout end

# ============================================================
# ATMOSPHERE AND EQUATIONS OF MOTION
# ============================================================

def rho(h):
    return RHO_0 * np.exp(-max(h, 0) / H_SCALE)

def reentry_eom(t, y):
    """3DOF: dV/dt, dgamma/dt, dh/dt."""
    V, gamma, h = y
    if h < 0 or V < 1.0:
        return [0.0, 0.0, 0.0]
    rh = rho(h)
    g = MU / (R_EARTH + h) ** 2
    r = R_EARTH + h
    D = 0.5 * rh * V**2 * CD * AREA
    dV = -D / MASS - g * np.sin(gamma)
    dg = (1.0 / V) * (-g * np.cos(gamma) + V**2 * np.cos(gamma) / r)
    dh = V * np.sin(gamma)
    return [dV, dg, dh]

# ============================================================
# THERMAL MODEL
# ============================================================

def thermal_response(t_arr, V_arr, h_arr):
    """Surface temperature, heat flux, and ablation from energy balance."""
    n = len(t_arr)
    T_surf = np.full(n, T_AMB)
    heat_flux = np.zeros(n)
    ablation = np.zeros(n)
    thickness = np.full(n, SH_THICK)

    for i in range(1, n):
        dt = t_arr[i] - t_arr[i-1]
        if dt <= 0:
            continue
        rh = rho(h_arr[i])
        V = max(V_arr[i], 0)
        # Sutton-Graves stagnation heating
        q_conv = C_SG * np.sqrt(rh / NOSE_R) * V**3
        heat_flux[i] = q_conv
        # Radiation cooling
        q_rad = EMISSIVITY * SIGMA * (T_surf[i-1]**4 - T_AMB**4)
        q_net = q_conv - q_rad
        # Thermal penetration depth
        d_th = min(np.sqrt(SH_ALPHA * t_arr[i]), thickness[i-1])
        d_th = max(d_th, 1e-4)
        dT = q_net * dt / (SH_RHO * SH_CP * d_th)
        T_surf[i] = T_surf[i-1] + dT
        thickness[i] = thickness[i-1]
        # Ablation
        if T_surf[i] > T_ABLATION:
            excess = (T_surf[i] - T_ABLATION) * SH_RHO * SH_CP * d_th
            dm = excess / H_ABLATION
            ablation[i] = ablation[i-1] + dm
            thickness[i] = max(thickness[i-1] - dm / (SH_RHO * AREA), 0.002)
            T_surf[i] = T_ABLATION

    return heat_flux, T_surf - 273.15, ablation

# ============================================================
# MAIN
# ============================================================

def main():
    y0 = [V_ENTRY, np.radians(GAMMA_ENTRY), H_ENTRY]
    hit = lambda t, y: y[2]
    hit.terminal = True; hit.direction = -1

    print("Integrating reentry trajectory...")
    sol = solve_ivp(reentry_eom, (0, 600), y0, t_eval=np.linspace(0, 600, 6000),
                    method='RK45', max_step=0.5, rtol=1e-8, atol=1e-10, events=hit)
    t, V, gamma, h = sol.t, sol.y[0], sol.y[1], sol.y[2]
    print(f"  {len(t)} pts, {t[-1]:.0f}s, final alt {h[-1]/1e3:.1f} km")

    # Derived quantities
    decel = np.array([0.5*rho(h[i])*V[i]**2*CD*AREA/MASS/G0 for i in range(len(t))])
    heat_flux, T_surf_C, ablation = thermal_response(t, V, h)

    ipk_q = np.argmax(heat_flux)
    ipk_g = np.argmax(decel)
    ipk_T = np.argmax(T_surf_C)
    i_chute = next((i for i in range(len(h)) if h[i] < 8000 and V[i] < 200), None)

    print(f"  Peak heating: {heat_flux[ipk_q]/1e6:.2f} MW/m^2 at t={t[ipk_q]:.0f}s")
    print(f"  Peak temp: {T_surf_C[ipk_T]:.0f} C | Peak g: {decel[ipk_g]:.1f}g")

    # ========================================================
    # PLOTTING (4 subplots)
    # ========================================================
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.patch.set_facecolor('#0a0e1a')
    ax_q, ax_T, ax_g, ax_c = axes[0, 0], axes[0, 1], axes[1, 0], axes[1, 1]

    def add_events(ax):
        for lbl, ts, c in [("Retropack\njettison pt", EV_RETRO_JETTISON, '#44aaff'),
                           ("Blackout start", EV_BLACKOUT_START, '#ff8844'),
                           ("Blackout end", EV_BLACKOUT_END, '#ff8844')]:
            if ts <= t[-1]:
                ax.axvline(x=ts, color=c, lw=0.6, ls=':', alpha=0.6)
        if i_chute and t[i_chute] <= t[-1]:
            ax.axvline(x=t[i_chute], color='#44ff88', lw=0.6, ls=':', alpha=0.6)

    # --- Heat Flux ---
    ax_q.set_facecolor('#0d1b2a')
    ax_q.plot(t, heat_flux/1e6, color='#ff4444', lw=1.5)
    ax_q.fill_between(t, 0, heat_flux/1e6, color='#ff4444', alpha=0.15)
    ax_q.plot(t[ipk_q], heat_flux[ipk_q]/1e6, 'o', color='#ffcc00', ms=8,
              mec='white', mew=0.8, zorder=10)
    ax_q.annotate(f'Peak: {heat_flux[ipk_q]/1e6:.2f} MW/m\u00b2\nt={t[ipk_q]:.0f}s',
                  xy=(t[ipk_q], heat_flux[ipk_q]/1e6),
                  xytext=(t[ipk_q]+30, heat_flux[ipk_q]/1e6*0.85),
                  color='#ffcc00', fontsize=8, fontweight='bold',
                  arrowprops=dict(arrowstyle='->', color='#ffcc00', lw=0.8))
    ax_q.axvspan(EV_BLACKOUT_START, EV_BLACKOUT_END, color='#ff8844', alpha=0.08)
    ax_q.text((EV_BLACKOUT_START+EV_BLACKOUT_END)/2, heat_flux.max()/1e6*0.95,
              'PLASMA\nBLACKOUT', color='#ff8844', fontsize=7, ha='center', va='top',
              fontweight='bold', alpha=0.7)
    add_events(ax_q)
    ax_q.set_xlabel('Time (s)', color='#aabbcc', fontsize=9)
    ax_q.set_ylabel('Heat Flux (MW/m\u00b2)', color='#aabbcc', fontsize=9)
    ax_q.set_title('Stagnation-Point Heating Rate', color='#ccddee', fontsize=11, fontweight='bold')
    ax_q.tick_params(colors='#778899', labelsize=8); ax_q.set_xlim(0, t[-1])

    # --- Surface Temperature ---
    ax_T.set_facecolor('#0d1b2a')
    ax_T.plot(t, T_surf_C, color='#ff8844', lw=1.5)
    ax_T.fill_between(t, T_surf_C.min(), T_surf_C, color='#ff8844', alpha=0.1)
    ax_T.axhline(y=T_ABLATION-273.15, color='#ff4444', lw=0.8, ls='--', alpha=0.7)
    ax_T.text(t[-1]*0.98, T_ABLATION-273.15+30, f'Ablation {T_ABLATION-273.15:.0f}\u00b0C',
              color='#ff4444', fontsize=7, ha='right')
    ax_T.plot(t[ipk_T], T_surf_C[ipk_T], 'o', color='#ffcc00', ms=8,
              mec='white', mew=0.8, zorder=10)
    ax_T.annotate(f'Peak: {T_surf_C[ipk_T]:.0f}\u00b0C', xy=(t[ipk_T], T_surf_C[ipk_T]),
                  xytext=(t[ipk_T]+40, T_surf_C[ipk_T]-100),
                  color='#ffcc00', fontsize=8, fontweight='bold',
                  arrowprops=dict(arrowstyle='->', color='#ffcc00', lw=0.8))
    add_events(ax_T)
    ax_T.set_xlabel('Time (s)', color='#aabbcc', fontsize=9)
    ax_T.set_ylabel('Temperature (\u00b0C)', color='#aabbcc', fontsize=9)
    ax_T.set_title('Heat Shield Surface Temperature', color='#ccddee', fontsize=11, fontweight='bold')
    ax_T.tick_params(colors='#778899', labelsize=8); ax_T.set_xlim(0, t[-1])

    # --- G-Load ---
    ax_g.set_facecolor('#0d1b2a')
    ax_g.plot(t, decel, color='#44aaff', lw=1.5)
    ax_g.fill_between(t, 0, decel, color='#44aaff', alpha=0.12)
    ax_g.plot(t[ipk_g], decel[ipk_g], 'o', color='#ffcc00', ms=8,
              mec='white', mew=0.8, zorder=10)
    ax_g.annotate(f'Peak: {decel[ipk_g]:.1f}g\nt={t[ipk_g]:.0f}s',
                  xy=(t[ipk_g], decel[ipk_g]),
                  xytext=(t[ipk_g]+40, decel[ipk_g]*0.85),
                  color='#ffcc00', fontsize=8, fontweight='bold',
                  arrowprops=dict(arrowstyle='->', color='#ffcc00', lw=0.8))
    ax_g.axhline(y=7.7, color='#ff4444', lw=0.8, ls='--', alpha=0.6)
    ax_g.text(t[-1]*0.98, 8.0, 'Design ref: 7.7g', color='#ff4444', fontsize=7, ha='right')
    ax_g.axhline(y=12.0, color='#884444', lw=0.5, ls=':', alpha=0.4)
    ax_g.text(t[-1]*0.98, 12.3, 'Tolerance ~12g', color='#884444', fontsize=6, ha='right', alpha=0.6)
    add_events(ax_g)
    ax_g.set_xlabel('Time (s)', color='#aabbcc', fontsize=9)
    ax_g.set_ylabel('Deceleration (g)', color='#aabbcc', fontsize=9)
    ax_g.set_title('Aerodynamic Deceleration', color='#ccddee', fontsize=11, fontweight='bold')
    ax_g.tick_params(colors='#778899', labelsize=8); ax_g.set_xlim(0, t[-1])

    # --- Reentry Corridor (alt vs vel) ---
    ax_c.set_facecolor('#0d1b2a')
    hn = heat_flux / (heat_flux.max() + 1e-10)
    for i in range(1, len(t)):
        r = min(1.0, hn[i]*2); g = max(0, 0.6-hn[i]); b = max(0, 1.0-hn[i]*1.5)
        ax_c.plot(V[i-1:i+1]/1e3, h[i-1:i+1]/1e3, color=(r, g, b), lw=1.5, alpha=0.85)
    # Entry point
    ax_c.plot(V[0]/1e3, h[0]/1e3, '^', color='#00ff88', ms=10, mec='white', mew=0.8, zorder=10)
    ax_c.annotate(f'Entry\n{H_ENTRY/1e3:.0f} km', xy=(V[0]/1e3, h[0]/1e3),
                  xytext=(V[0]/1e3-1.5, h[0]/1e3-15), color='#00ff88', fontsize=7,
                  fontweight='bold', arrowprops=dict(arrowstyle='->', color='#00ff88', lw=0.8))
    # Peak heating
    ax_c.plot(V[ipk_q]/1e3, h[ipk_q]/1e3, '*', color='#ff4444', ms=12, mec='white',
              mew=0.5, zorder=10)
    ax_c.annotate(f'Peak heating\n{h[ipk_q]/1e3:.0f} km', xy=(V[ipk_q]/1e3, h[ipk_q]/1e3),
                  xytext=(V[ipk_q]/1e3+0.8, h[ipk_q]/1e3+10), color='#ff4444', fontsize=7,
                  fontweight='bold', arrowprops=dict(arrowstyle='->', color='#ff4444', lw=0.8))
    # Peak g
    ax_c.plot(V[ipk_g]/1e3, h[ipk_g]/1e3, 'D', color='#44aaff', ms=8, mec='white',
              mew=0.5, zorder=10)
    ax_c.annotate(f'Peak {decel[ipk_g]:.1f}g', xy=(V[ipk_g]/1e3, h[ipk_g]/1e3),
                  xytext=(V[ipk_g]/1e3+1.0, h[ipk_g]/1e3-8), color='#44aaff', fontsize=7,
                  fontweight='bold', arrowprops=dict(arrowstyle='->', color='#44aaff', lw=0.8))
    # Chute
    if i_chute:
        ax_c.plot(V[i_chute]/1e3, h[i_chute]/1e3, 'o', color='#44ff88', ms=8,
                  mec='white', mew=0.8, zorder=10)
        ax_c.annotate(f'Main chute\n{h[i_chute]/1e3:.0f} km', xy=(V[i_chute]/1e3, h[i_chute]/1e3),
                      xytext=(V[i_chute]/1e3+1, h[i_chute]/1e3+8), color='#44ff88', fontsize=7,
                      fontweight='bold', arrowprops=dict(arrowstyle='->', color='#44ff88', lw=0.8))
    ax_c.set_xlabel('Velocity (km/s)', color='#aabbcc', fontsize=9)
    ax_c.set_ylabel('Altitude (km)', color='#aabbcc', fontsize=9)
    ax_c.set_title('Reentry Corridor \u2014 Altitude vs. Velocity', color='#ccddee',
                    fontsize=11, fontweight='bold')
    ax_c.tick_params(colors='#778899', labelsize=8)

    # Suptitle and info
    fig.suptitle('Friendship 7 Reentry Thermal Analysis \u2014 February 20, 1962',
                 color='#e8e8e8', fontsize=16, fontweight='bold', y=0.98)
    info = (f"Mercury-Atlas 6 | John H. Glenn Jr. | Entry: {V_ENTRY:.0f} m/s at "
            f"{H_ENTRY/1e3:.0f} km | FPA: {GAMMA_ENTRY}\u00b0 | "
            f"Shield: {SHIELD_D:.2f}m ablative | Retropack retained (Segment 51)")
    fig.text(0.5, 0.01, info, ha='center', va='bottom', fontsize=7, color='#8899aa',
             fontfamily='monospace', bbox=dict(boxstyle='round,pad=0.4',
             fc='#0a0e1a', ec='#334455', alpha=0.9))

    plt.tight_layout(rect=[0, 0.04, 1, 0.96], pad=2.0)
    out = 'friendship7-reentry.png'
    plt.savefig(out, dpi=200, facecolor=fig.get_facecolor(), bbox_inches='tight')
    print(f"\nSaved: {out}")
    print(f"  Peak flux: {heat_flux[ipk_q]/1e6:.2f} MW/m^2 | "
          f"Peak temp: {T_surf_C[ipk_T]:.0f} C | Peak g: {decel[ipk_g]:.1f}g")
    if i_chute:
        print(f"  Chute: t={t[i_chute]:.0f}s, alt={h[i_chute]/1e3:.1f} km")
    plt.show()


if __name__ == '__main__':
    main()
