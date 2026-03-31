#!/usr/bin/env python3
"""
Friendship 7 Orbital Ground Track Simulator
=============================================
NASA Mission Series v1.21

Computes and plots John Glenn's three-orbit ground track aboard
Mercury-Atlas 6 / Friendship 7 on February 20, 1962.

Glenn launched from Cape Canaveral at 14:47:39 UTC and splashed down
4h 55m 23s later near Grand Turk Island — the first American to orbit
Earth, completing three orbits at 32.5 degrees inclination.

The ground track traces a sinusoidal path whose westward drift is
caused by Earth's rotation beneath the orbiting spacecraft. Each
orbit shifts approximately 22.1 degrees west at the equator.

Orbital elements:
  Semi-major axis: 6,584 km | Eccentricity: 0.0079 | Inclination: 32.5 deg
  Perigee: 161 km | Apogee: 265 km | Period: ~88.5 min

Organism: Chinook salmon (Oncorhynchus tshawytscha)

Usage: python3 orbital-groundtrack.py
Dependencies: numpy, matplotlib
Output: friendship7-groundtrack.png (2 subplots)
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# ORBITAL PARAMETERS
# ============================================================

R_EARTH = 6371.0          # km
PERIGEE_ALT, APOGEE_ALT = 161.0, 265.0  # km
SEMI_MAJOR = R_EARTH + (PERIGEE_ALT + APOGEE_ALT) / 2
ECCENTRICITY = 0.0079
INCLINATION = 32.5        # degrees
RAAN_LAUNCH = 160.0       # degrees (right ascension of ascending node)
ARG_PERIGEE = 0.0         # degrees
PERIOD = 88.5             # minutes
N_ORBITS = 3
EARTH_ROT_RATE = 360.0 / (23 * 60 + 56 + 4.0 / 60)  # deg/min (sidereal)
CAPE_CANAVERAL = (28.5, -80.6)
SPLASHDOWN = (21.2, -68.4)

TRACKING_STATIONS = {
    "Bermuda": (32.4, -64.7), "Canary Is.": (28.1, -15.4),
    "Kano": (12.0, 8.5), "Zanzibar": (-6.2, 39.2),
    "Muchea": (-31.6, 115.9), "Woomera": (-31.1, 136.8),
    "Canton Is.": (-2.8, -171.7), "Hawaii": (19.9, -155.1),
    "Guaymas": (27.9, -110.9), "Pt. Arguello": (34.6, -120.6),
}

KEY_EVENTS = {
    "BECO": 2.4, "SECO": 5.1, "Sunrise 1": 45.0,
    "Sunset 1": 75.0, "Retrofire": 254.0,
}

# ============================================================
# GROUND TRACK COMPUTATION
# ============================================================

def compute_ground_track(npts=600):
    """Compute sub-satellite lat/lon for 3 orbits via Keplerian two-body."""
    total = npts * N_ORBITS
    t = np.linspace(0, N_ORBITS * PERIOD, total)
    n = 2 * np.pi / PERIOD
    M = n * t
    # Kepler's equation (Newton iteration)
    E = M.copy()
    for _ in range(10):
        E -= (E - ECCENTRICITY * np.sin(E) - M) / (1 - ECCENTRICITY * np.cos(E))
    # True anomaly and radius
    cos_nu = (np.cos(E) - ECCENTRICITY) / (1 - ECCENTRICITY * np.cos(E))
    sin_nu = (np.sqrt(1 - ECCENTRICITY**2) * np.sin(E)) / (1 - ECCENTRICITY * np.cos(E))
    nu = np.arctan2(sin_nu, cos_nu)
    altitude = SEMI_MAJOR * (1 - ECCENTRICITY * np.cos(E)) - R_EARTH
    # Ground track
    u = np.radians(ARG_PERIGEE) + nu
    inc_rad = np.radians(INCLINATION)
    lat = np.degrees(np.arcsin(np.sin(inc_rad) * np.sin(u)))
    alpha = np.arctan2(np.cos(inc_rad) * np.sin(u), np.cos(u))
    lon = np.degrees(alpha) + RAAN_LAUNCH - EARTH_ROT_RATE * t
    lon = ((lon + 180) % 360) - 180
    return t, lat, lon, altitude


def draw_coastlines(ax):
    """Simplified continental outlines (lon, lat) — no cartopy needed."""
    coasts = [
        # North America
        [(-170,65),(-160,60),(-148,62),(-130,55),(-125,50),(-120,35),(-115,30),
         (-105,20),(-95,18),(-90,22),(-85,12),(-80,10),(-82,25),(-80,32),(-75,35),
         (-70,42),(-60,47),(-55,50),(-65,58),(-85,65),(-110,70),(-140,70),(-170,65)],
        # South America
        [(-82,8),(-72,12),(-60,5),(-50,0),(-38,-8),(-35,-12),(-42,-22),(-53,-33),
         (-68,-55),(-75,-45),(-72,-18),(-80,-5),(-82,8)],
        # Europe
        [(-10,36),(0,38),(3,43),(-5,48),(-10,52),(5,53),(15,55),(28,55),(30,60),
         (22,68),(10,63),(0,53),(-10,52)],
        # Africa
        [(-17,15),(-8,5),(10,0),(15,-5),(25,-17),(35,-25),(28,-33),(15,-25),
         (40,-10),(50,12),(40,15),(32,32),(10,37),(-10,34),(-17,20),(-17,15)],
        # Asia
        [(28,55),(40,45),(55,40),(70,38),(80,28),(100,15),(110,20),(130,40),
         (140,40),(145,50),(170,65)],
        # Australia
        [(115,-35),(115,-22),(130,-12),(145,-15),(153,-28),(140,-38),(115,-35)],
    ]
    for c in coasts:
        lons, lats = zip(*c)
        ax.plot(lons, lats, color='#3a5a3a', lw=0.8, alpha=0.7)
        ax.fill(lons, lats, color='#d4e8d4', alpha=0.2)


# ============================================================
# PLOTTING
# ============================================================

def main():
    t, lat, lon, altitude = compute_ground_track()
    ppo = len(t) // N_ORBITS  # points per orbit
    colors = ['#1f4e9a', '#d4a017', '#b22222']
    labels = ['Orbit 1', 'Orbit 2', 'Orbit 3']

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12),
                                    gridspec_kw={'height_ratios': [3, 1]})
    fig.patch.set_facecolor('#0a0e1a')

    # --- Ground Track Map ---
    ax1.set_facecolor('#0d1b2a')
    for ll in range(-80, 90, 20):
        ax1.axhline(y=ll, color='#1a2a3a', lw=0.3, alpha=0.5)
    for ll in range(-180, 181, 30):
        ax1.axvline(x=ll, color='#1a2a3a', lw=0.3, alpha=0.5)
    ax1.axhline(y=0, color='#2a3a4a', lw=0.6, alpha=0.7, ls='--')
    ax1.axvline(x=0, color='#2a3a4a', lw=0.6, alpha=0.7, ls='--')
    draw_coastlines(ax1)

    # Plot each orbit, breaking at map-edge crossings
    for i in range(N_ORBITS):
        s, e = i * ppo, (i + 1) * ppo
        o_lon, o_lat = lon[s:e], lat[s:e]
        segs = [([o_lon[0]], [o_lat[0]])]
        for j in range(1, len(o_lon)):
            if abs(o_lon[j] - o_lon[j-1]) > 90:
                segs.append(([o_lon[j]], [o_lat[j]]))
            else:
                segs[-1][0].append(o_lon[j])
                segs[-1][1].append(o_lat[j])
        for k, (sl, st) in enumerate(segs):
            ax1.plot(sl, st, color=colors[i], lw=1.8, alpha=0.85,
                    label=labels[i] if k == 0 else None)

    # Launch and splashdown markers
    ax1.plot(CAPE_CANAVERAL[1], CAPE_CANAVERAL[0], '^', color='#00ff88',
             ms=12, mec='white', mew=1.0, zorder=10)
    ax1.annotate('LAUNCH\nCape Canaveral', xy=(CAPE_CANAVERAL[1], CAPE_CANAVERAL[0]),
                 xytext=(-72, 34), color='#00ff88', fontsize=7, fontweight='bold',
                 arrowprops=dict(arrowstyle='->', color='#00ff88', lw=0.8))
    ax1.plot(SPLASHDOWN[1], SPLASHDOWN[0], 'v', color='#ff6644',
             ms=12, mec='white', mew=1.0, zorder=10)
    ax1.annotate('SPLASHDOWN\nGrand Turk Is.', xy=(SPLASHDOWN[1], SPLASHDOWN[0]),
                 xytext=(-60, 13), color='#ff6644', fontsize=7, fontweight='bold',
                 arrowprops=dict(arrowstyle='->', color='#ff6644', lw=0.8))

    # Tracking stations
    offsets = {"Muchea": (-20, -4), "Hawaii": (-15, -5),
               "Woomera": (4, -4), "Canton Is.": (4, -4)}
    for name, (st_lat, st_lon) in TRACKING_STATIONS.items():
        ax1.plot(st_lon, st_lat, 'o', color='#ffcc00', ms=5, mec='white', mew=0.5, zorder=8)
        ox, oy = offsets.get(name, (3, 2))
        ax1.annotate(name, xy=(st_lon, st_lat), xytext=(st_lon + ox, st_lat + oy),
                     color='#ffcc00', fontsize=5.5, alpha=0.85,
                     arrowprops=dict(arrowstyle='->', color='#ffcc00', lw=0.4, alpha=0.5))

    # Key events
    for ev, ev_t in KEY_EVENTS.items():
        idx = np.argmin(np.abs(t - ev_t))
        c = '#ff4444' if ev == "Retrofire" else ('#ffaa44' if 'Su' in ev else '#88ccff')
        ax1.plot(lon[idx], lat[idx], '*', color=c, ms=8, zorder=12, mec='white', mew=0.3)
        ax1.annotate(ev, xy=(lon[idx], lat[idx]), xytext=(lon[idx]+5, lat[idx]+5),
                     color=c, fontsize=5.5, fontweight='bold',
                     arrowprops=dict(arrowstyle='->', color=c, lw=0.5))

    ax1.set_xlim(-180, 180); ax1.set_ylim(-60, 75)
    ax1.set_xlabel('Longitude (degrees)', color='#aabbcc', fontsize=10)
    ax1.set_ylabel('Latitude (degrees)', color='#aabbcc', fontsize=10)
    ax1.set_title('Friendship 7 \u2014 Three Orbits (February 20, 1962)',
                   color='#e8e8e8', fontsize=16, fontweight='bold', pad=15)
    ax1.tick_params(colors='#778899', labelsize=8)
    ax1.legend(loc='lower left', fontsize=9, facecolor='#0d1b2a',
               edgecolor='#334455', labelcolor='#ccddee')
    # Inclination band
    for sign in [1, -1]:
        ax1.axhline(y=sign * INCLINATION, color='#555', lw=0.5, ls=':', alpha=0.5)
    ax1.text(175, INCLINATION + 1.5, f'+{INCLINATION}\u00b0', color='#555', fontsize=6, ha='right')
    ax1.text(175, -INCLINATION + 1.5, f'-{INCLINATION}\u00b0', color='#555', fontsize=6, ha='right')

    info = ("Mercury-Atlas 6 | Astronaut: John H. Glenn Jr.\n"
            "Launch: 14:47:39 UTC | Duration: 4h 55m 23s\n"
            f"Perigee: {PERIGEE_ALT:.0f} km | Apogee: {APOGEE_ALT:.0f} km | "
            f"Inc: {INCLINATION}\u00b0 | Period: {PERIOD:.1f} min")
    ax1.text(0.99, 0.97, info, transform=ax1.transAxes, fontsize=7, color='#aabbcc',
             va='top', ha='right', fontfamily='monospace',
             bbox=dict(boxstyle='round,pad=0.4', fc='#0a0e1a', ec='#334455', alpha=0.9))

    # --- Altitude vs Time ---
    ax2.set_facecolor('#0d1b2a')
    for i in range(N_ORBITS):
        s, e = i * ppo, (i + 1) * ppo
        ax2.plot(t[s:e], altitude[s:e], color=colors[i], lw=1.5, alpha=0.85, label=labels[i])
    for alt, name in [(PERIGEE_ALT, 'Perigee'), (APOGEE_ALT, 'Apogee')]:
        ax2.axhline(y=alt, color='#446688', lw=0.6, ls='--', alpha=0.6)
        ax2.text(t[-1] + 1, alt, f'{name} {alt:.0f} km', color='#668899', fontsize=7, va='center')
    for ev, ev_t in KEY_EVENTS.items():
        c = '#ff4444' if ev == 'Retrofire' else '#88ccff'
        ax2.axvline(x=ev_t, color=c, lw=0.5, ls=':', alpha=0.5)
        ax2.text(ev_t, altitude.max() + 5, ev, color=c, fontsize=5.5, rotation=45,
                 ha='left', va='bottom')

    ax2.set_xlim(0, t[-1]); ax2.set_ylim(PERIGEE_ALT - 20, APOGEE_ALT + 30)
    ax2.set_xlabel('Mission Time (minutes)', color='#aabbcc', fontsize=10)
    ax2.set_ylabel('Altitude (km)', color='#aabbcc', fontsize=10)
    ax2.set_title('Orbital Altitude Profile \u2014 Elliptical Variation',
                   color='#ccddee', fontsize=12, pad=8)
    ax2.tick_params(colors='#778899', labelsize=8)
    ax2.legend(loc='upper right', fontsize=8, facecolor='#0d1b2a',
               edgecolor='#334455', labelcolor='#ccddee')

    plt.tight_layout(pad=2.0)
    out = 'friendship7-groundtrack.png'
    plt.savefig(out, dpi=200, facecolor=fig.get_facecolor(), bbox_inches='tight')
    print(f"Saved: {out}")
    print(f"  Orbits: {N_ORBITS} | Period: {PERIOD} min")
    print(f"  Westward drift/orbit: {EARTH_ROT_RATE * PERIOD:.1f} deg")
    print(f"  Tracking stations: {len(TRACKING_STATIONS)}")
    plt.show()


if __name__ == '__main__':
    main()
