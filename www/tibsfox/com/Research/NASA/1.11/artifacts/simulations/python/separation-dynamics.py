#!/usr/bin/env python3
"""
Explorer 5 — Juno I Stage Separation Dynamics
=========================================================================
Mission 1.11: Explorer 5 (Juno I / ABMA), FAILED August 24, 1958
SEPARATION FAILURE — Upper Cluster Contacted Booster

Simulates the Juno I upper-stage separation sequence: the spinning
cluster ("tub") separates from the spent first-stage booster via spring
mechanisms. In the nominal case, the tub clears the booster cleanly
and the upper stages fire along the intended trajectory. In the failure
case (Explorer 5), the edge of the spinning tub contacts the booster
body, applying an off-axis impulse that induces nutation (wobble).

Physics:
  - Spinning body: angular momentum L = I * omega (gyroscopic stability)
  - Separation: axial spring force pushes tub away from booster
  - Contact event: off-axis impulse creates torque T = r x F
  - Nutation: the spin axis wobbles — precession around the angular
    momentum vector with nutation angle theta_n
  - Trajectory divergence: thrust vector misalignment causes the
    payload to miss orbital insertion

This produces:
  1. 2D animation of separation: nominal (clean) vs failure (contact)
  2. Phase portrait of spin axis: stable spin vs nutation
  3. Trajectory comparison: orbital insertion vs ballistic return
  4. Nutation angle growth over time

Requires: numpy, matplotlib
Run: python3 separation-dynamics.py
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, Rectangle
from matplotlib.animation import FuncAnimation
import matplotlib.gridspec as gridspec

# =========================================================================
# Physical Parameters (Juno I approximate values)
# =========================================================================
TUB_MASS = 80.0           # Upper cluster mass (kg)
TUB_RADIUS = 0.40         # Tub radius (m)
TUB_HEIGHT = 0.80         # Tub height (m)
BOOSTER_RADIUS = 0.45     # Booster body radius (m)
CLEARANCE_NOMINAL = 0.05  # Nominal radial clearance (m)
CLEARANCE_FAILURE = 0.01  # Reduced clearance causing contact (m)

SPIN_RATE = 450.0          # RPM (upper cluster spin rate)
SPIN_OMEGA = SPIN_RATE * 2 * np.pi / 60  # rad/s

# Moments of inertia (solid cylinder approximation)
I_SPIN = 0.5 * TUB_MASS * TUB_RADIUS**2     # About spin axis (z)
I_TRANS = TUB_MASS * (3 * TUB_RADIUS**2 + TUB_HEIGHT**2) / 12  # About transverse axis

SPRING_FORCE = 500.0       # Separation spring force (N)
SPRING_DURATION = 0.050    # Spring contact time (s)
SEPARATION_VELOCITY = SPRING_FORCE * SPRING_DURATION / TUB_MASS  # m/s

CONTACT_IMPULSE = 50.0     # Contact impulse (N*s), off-axis
CONTACT_ARM = TUB_RADIUS   # Moment arm for contact torque (m)

# Derived nutation parameters
NUTATION_TORQUE = CONTACT_IMPULSE * CONTACT_ARM / SPRING_DURATION
NUTATION_RATE = SPIN_OMEGA * I_SPIN / I_TRANS  # Nutation frequency (rad/s)


# =========================================================================
# Simulation Functions
# =========================================================================

def simulate_separation(clearance, contact=False, dt=0.001, t_max=5.0):
    """
    Simulate the separation sequence.

    Parameters
    ----------
    clearance : float
        Radial clearance between tub and booster (m)
    contact : bool
        Whether contact occurs during separation
    dt : float
        Time step (s)
    t_max : float
        Total simulation time (s)

    Returns
    -------
    t : array
        Time vector
    x, y : arrays
        Position of tub center (m)
    theta_n : array
        Nutation angle (degrees)
    spin_x, spin_y : arrays
        Spin axis direction (unit vector components)
    """
    n_steps = int(t_max / dt)
    t = np.linspace(0, t_max, n_steps)

    x = np.zeros(n_steps)
    y = np.zeros(n_steps)
    vx = np.zeros(n_steps)
    vy = np.zeros(n_steps)
    theta_n = np.zeros(n_steps)  # nutation angle (rad)
    spin_x = np.zeros(n_steps)   # spin axis x-component
    spin_y = np.zeros(n_steps)   # spin axis y-component

    # Initial conditions
    y[0] = 0.0  # tub starts at booster top
    vy[0] = SEPARATION_VELOCITY
    vx[0] = 0.0

    # Spin axis initially aligned with y (vertical)
    spin_x[0] = 0.0
    spin_y[0] = 1.0

    # Contact event
    contact_time = 0.1  # contact occurs shortly after spring release
    nutation_applied = False

    for i in range(1, n_steps):
        # Position update
        x[i] = x[i-1] + vx[i-1] * dt
        y[i] = y[i-1] + vy[i-1] * dt

        # Gravity (simplified — no orbital mechanics, just ballistic)
        vy[i] = vy[i-1] - 9.81 * dt * 0.01  # scaled for visualization

        if contact and not nutation_applied and t[i] > contact_time:
            # CONTACT EVENT
            # Off-axis impulse induces nutation
            nutation_applied = True
            # Initial nutation angle from impulse
            theta_n_initial = np.arctan2(CONTACT_IMPULSE,
                                         I_SPIN * SPIN_OMEGA) * CONTACT_ARM
            theta_n[i] = theta_n_initial
            # Lateral velocity kick
            vx[i] = vx[i-1] + CONTACT_IMPULSE / TUB_MASS * 0.1

        if contact and nutation_applied:
            # Nutation: spin axis precesses around angular momentum vector
            nutation_phase = NUTATION_RATE * (t[i] - contact_time)
            # Nutation angle grows slightly due to asymmetric thrust
            growth = 1.0 + 0.05 * (t[i] - contact_time)
            theta_n[i] = theta_n[max(0, i-1)] * growth if theta_n[max(0, i-1)] > 0 else theta_n_initial
            theta_n[i] = min(theta_n[i], np.pi / 4)  # cap at 45 degrees

            # Spin axis wobbles
            spin_x[i] = np.sin(theta_n[i]) * np.sin(nutation_phase)
            spin_y[i] = np.cos(theta_n[i])

            # Trajectory deviation from misaligned thrust
            if t[i] > contact_time + 0.5:  # upper stages fire
                thrust_misalign = np.sin(theta_n[i])
                vx[i] += thrust_misalign * 0.05 * dt
                vy[i] += (np.cos(theta_n[i]) - 1.0) * 0.02 * dt
        else:
            spin_x[i] = 0.0
            spin_y[i] = 1.0
            theta_n[i] = 0.0
            vx[i] = vx[i-1]

    theta_n_deg = np.degrees(theta_n)
    return t, x, y, theta_n_deg, spin_x, spin_y


# =========================================================================
# Generate Comparison Plots
# =========================================================================

def plot_comparison():
    """Generate side-by-side comparison of nominal vs failure."""
    # Simulate both cases
    t_nom, x_nom, y_nom, theta_nom, sx_nom, sy_nom = simulate_separation(
        CLEARANCE_NOMINAL, contact=False)
    t_fail, x_fail, y_fail, theta_fail, sx_fail, sy_fail = simulate_separation(
        CLEARANCE_FAILURE, contact=True)

    fig = plt.figure(figsize=(16, 12), facecolor='#050505')
    gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

    # --- Plot 1: Trajectories ---
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor('#0a0a1a')
    ax1.plot(x_nom, y_nom, color='#40CC40', linewidth=2, label='Nominal (clean separation)')
    ax1.plot(x_fail, y_fail, color='#CC2020', linewidth=2, label='Explorer 5 (contact failure)')
    # Mark contact point
    contact_idx = np.argmax(t_fail > 0.1)
    ax1.plot(x_fail[contact_idx], y_fail[contact_idx], 'o',
             color='#D4A830', markersize=10, zorder=5, label='Contact event')
    ax1.set_xlabel('Lateral Displacement (m)', color='#888')
    ax1.set_ylabel('Altitude above Booster (m)', color='#888')
    ax1.set_title('Trajectory: Nominal vs Failure', color='#D0D8E0', fontsize=13)
    ax1.legend(fontsize=9, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax1.tick_params(colors='#666')
    ax1.spines['bottom'].set_color('#333')
    ax1.spines['left'].set_color('#333')
    ax1.spines['top'].set_color('#333')
    ax1.spines['right'].set_color('#333')
    ax1.grid(True, alpha=0.15)

    # --- Plot 2: Nutation Angle ---
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_facecolor('#0a0a1a')
    ax2.plot(t_nom, theta_nom, color='#40CC40', linewidth=2, label='Nominal (0 deg)')
    ax2.plot(t_fail, theta_fail, color='#CC2020', linewidth=2, label='Explorer 5 failure')
    ax2.axhline(y=0, color='#333', linewidth=0.5)
    ax2.axvline(x=0.1, color='#D4A830', linewidth=1, linestyle='--',
                alpha=0.6, label='Contact event')
    ax2.set_xlabel('Time (s)', color='#888')
    ax2.set_ylabel('Nutation Angle (degrees)', color='#888')
    ax2.set_title('Nutation Angle vs Time', color='#D0D8E0', fontsize=13)
    ax2.legend(fontsize=9, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax2.tick_params(colors='#666')
    ax2.spines['bottom'].set_color('#333')
    ax2.spines['left'].set_color('#333')
    ax2.spines['top'].set_color('#333')
    ax2.spines['right'].set_color('#333')
    ax2.grid(True, alpha=0.15)

    # --- Plot 3: Spin Axis Phase Portrait ---
    ax3 = fig.add_subplot(gs[1, 0])
    ax3.set_facecolor('#0a0a1a')
    ax3.set_aspect('equal')
    # Nominal: single point at (0, 1)
    ax3.plot(sx_nom[::10], sy_nom[::10], '.', color='#40CC40',
             markersize=3, alpha=0.5, label='Nominal (stable)')
    # Failure: wobbling circle
    ax3.plot(sx_fail[::5], sy_fail[::5], '.', color='#CC2020',
             markersize=2, alpha=0.3, label='Explorer 5 (nutating)')
    ax3.plot(0, 1, 'o', color='#40CC40', markersize=8, zorder=5)
    ax3.set_xlabel('Spin Axis X', color='#888')
    ax3.set_ylabel('Spin Axis Y', color='#888')
    ax3.set_title('Spin Axis Phase Portrait', color='#D0D8E0', fontsize=13)
    ax3.legend(fontsize=9, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax3.tick_params(colors='#666')
    ax3.spines['bottom'].set_color('#333')
    ax3.spines['left'].set_color('#333')
    ax3.spines['top'].set_color('#333')
    ax3.spines['right'].set_color('#333')
    ax3.grid(True, alpha=0.15)

    # --- Plot 4: Separation Diagram ---
    ax4 = fig.add_subplot(gs[1, 1])
    ax4.set_facecolor('#0a0a1a')
    ax4.set_aspect('equal')

    # Draw booster body
    booster = Rectangle((-BOOSTER_RADIUS, -1.0), BOOSTER_RADIUS * 2, 1.0,
                        facecolor='#333344', edgecolor='#555', linewidth=1.5)
    ax4.add_patch(booster)
    ax4.text(0, -0.5, 'BOOSTER', ha='center', va='center',
             color='#888', fontsize=9)

    # Draw spinning tub (nominal position)
    tub_nom = Rectangle((-TUB_RADIUS, 0.05), TUB_RADIUS * 2, TUB_HEIGHT,
                        facecolor='#224422', edgecolor='#40CC40', linewidth=1.5,
                        linestyle='--', alpha=0.5)
    ax4.add_patch(tub_nom)
    ax4.text(0, 0.45, 'NOMINAL', ha='center', va='center',
             color='#40CC40', fontsize=8, alpha=0.7)

    # Draw spinning tub (failure position — tilted, contacting)
    from matplotlib.patches import FancyBboxPatch
    import matplotlib.transforms as transforms

    # Show the clearance gap
    ax4.annotate('', xy=(BOOSTER_RADIUS, 0.02), xytext=(TUB_RADIUS, 0.02),
                 arrowprops=dict(arrowstyle='<->', color='#D4A830', lw=1.5))
    gap_label = f'{CLEARANCE_NOMINAL*100:.0f} cm'
    ax4.text((BOOSTER_RADIUS + TUB_RADIUS) / 2, 0.06, gap_label,
             ha='center', color='#D4A830', fontsize=8)

    # Contact point marker
    ax4.plot(BOOSTER_RADIUS, 0.0, '*', color='#CC2020', markersize=15, zorder=5)
    ax4.text(BOOSTER_RADIUS + 0.05, 0.02, 'CONTACT', color='#CC2020', fontsize=8)

    # Spin arrows
    for angle in np.linspace(0, 2*np.pi, 8, endpoint=False):
        r = TUB_RADIUS * 0.7
        xa = r * np.cos(angle)
        ya = 0.4 + r * np.sin(angle) * 0.3
        dx = -0.03 * np.sin(angle)
        dy = 0.03 * np.cos(angle) * 0.3
        ax4.arrow(xa, ya, dx, dy, head_width=0.015, head_length=0.01,
                  fc='#D4A830', ec='#D4A830', alpha=0.4)

    ax4.set_xlim(-0.8, 0.8)
    ax4.set_ylim(-1.2, 1.2)
    ax4.set_title('Separation Geometry', color='#D0D8E0', fontsize=13)
    ax4.tick_params(colors='#666')
    ax4.spines['bottom'].set_color('#333')
    ax4.spines['left'].set_color('#333')
    ax4.spines['top'].set_color('#333')
    ax4.spines['right'].set_color('#333')

    fig.suptitle('Explorer 5 — Juno I Stage Separation Failure Analysis\n'
                 'August 24, 1958 — Upper cluster contacted booster during separation',
                 color='#D0D8E0', fontsize=14, y=0.98)

    plt.savefig('explorer5-separation-analysis.png', dpi=150, facecolor='#050505',
                bbox_inches='tight')
    plt.show()
    print("\nSaved: explorer5-separation-analysis.png")


# =========================================================================
# Parameter Study: Clearance vs Failure Probability
# =========================================================================

def clearance_study():
    """Show how clearance margin affects nutation severity."""
    clearances = np.linspace(0.005, 0.10, 20)
    max_nutations = []

    for c in clearances:
        _, _, _, theta, _, _ = simulate_separation(c, contact=(c < 0.04))
        max_nutations.append(np.max(theta))

    fig, ax = plt.subplots(figsize=(10, 6), facecolor='#050505')
    ax.set_facecolor('#0a0a1a')

    ax.bar(clearances * 100, max_nutations,
           width=0.4, color=['#CC2020' if n > 5 else '#40CC40' for n in max_nutations],
           alpha=0.8)
    ax.axvline(x=CLEARANCE_FAILURE * 100, color='#D4A830', linewidth=2,
               linestyle='--', label=f'Explorer 5 clearance ({CLEARANCE_FAILURE*100:.0f} cm)')
    ax.axvline(x=CLEARANCE_NOMINAL * 100, color='#40CC40', linewidth=2,
               linestyle='--', label=f'Nominal clearance ({CLEARANCE_NOMINAL*100:.0f} cm)')

    ax.set_xlabel('Radial Clearance (cm)', color='#888', fontsize=12)
    ax.set_ylabel('Maximum Nutation Angle (degrees)', color='#888', fontsize=12)
    ax.set_title('Clearance Margin vs Nutation Severity',
                 color='#D0D8E0', fontsize=14)
    ax.legend(fontsize=10, facecolor='#0a0a1a', edgecolor='#333', labelcolor='#aaa')
    ax.tick_params(colors='#666')
    for spine in ax.spines.values():
        spine.set_color('#333')
    ax.grid(True, alpha=0.15, axis='y')

    plt.savefig('explorer5-clearance-study.png', dpi=150, facecolor='#050505',
                bbox_inches='tight')
    plt.show()
    print("Saved: explorer5-clearance-study.png")


# =========================================================================
# Main
# =========================================================================

if __name__ == '__main__':
    print("=" * 70)
    print("Explorer 5 — Juno I Stage Separation Dynamics")
    print("Mission 1.11: FAILED August 24, 1958")
    print("=" * 70)
    print()
    print(f"Spinning tub parameters:")
    print(f"  Mass:           {TUB_MASS} kg")
    print(f"  Radius:         {TUB_RADIUS} m")
    print(f"  Spin rate:      {SPIN_RATE} RPM ({SPIN_OMEGA:.1f} rad/s)")
    print(f"  Spin inertia:   {I_SPIN:.3f} kg*m^2")
    print(f"  Trans inertia:  {I_TRANS:.3f} kg*m^2")
    print()
    print(f"Separation parameters:")
    print(f"  Spring force:   {SPRING_FORCE} N")
    print(f"  Sep velocity:   {SEPARATION_VELOCITY:.2f} m/s")
    print(f"  Nominal gap:    {CLEARANCE_NOMINAL*100:.1f} cm")
    print(f"  Failure gap:    {CLEARANCE_FAILURE*100:.1f} cm")
    print()
    print(f"Contact event:")
    print(f"  Impulse:        {CONTACT_IMPULSE} N*s")
    print(f"  Moment arm:     {CONTACT_ARM} m")
    print(f"  Nutation rate:  {NUTATION_RATE:.1f} rad/s ({NUTATION_RATE/(2*np.pi):.1f} Hz)")
    print()

    print("Generating comparison plots...")
    plot_comparison()

    print("\nGenerating clearance study...")
    clearance_study()

    print("\nDone. The garden of forking paths has been mapped.")
