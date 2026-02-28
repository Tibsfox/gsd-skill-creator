# Module 1: The Circuit -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

If you double the resistance in a circuit with a fixed voltage source, what happens to the current? What happens to the power dissipated by the resistor? Explain *why* using Ohm's law and the power equation.

## Question 2: Calculation

A voltage divider consists of a 10V source, R1 = 4.7k ohm (top resistor), and R2 = 10k ohm (bottom resistor, connected to ground). Calculate the output voltage V_out at the junction between R1 and R2.

## Question 3: Analysis

In a parallel circuit with three branches, the total current entering the junction is 30mA. You measure the current in two branches: Branch A carries 10mA and Branch B carries 12mA. What current does Branch C carry? Which of Kirchhoff's laws tells you this?

## Question 4: Application

An LED requires 5V at 20mA to operate. You have a 12V power supply. Calculate the resistance of the current-limiting resistor needed in series with the LED. What is the minimum power rating for this resistor?

## Question 5: Reasoning

Why does a short circuit (resistance approaching zero) cause dangerously high current even at low voltages? Use Ohm's law to explain what happens as R approaches 0, and describe the real-world consequences.

## Answer Key

### Answer 1

**Current halves.** By Ohm's law, I = V/R. If R doubles and V stays the same, I is divided by 2. For example, 9V across 1k gives 9mA; 9V across 2k gives 4.5mA.

**Power drops to one quarter.** Using P = V^2/R: if R doubles, P halves. But you can also see it through P = I^2 * R: current halved (squared = 1/4) times resistance doubled (x2) gives 1/4 * 2 = 1/2... Actually, let's be precise:
- P = V^2/R: doubling R halves P (to 1/2 original).
- Alternatively, P = I * V: I halved, V unchanged, so P halved.

**Power halves** when resistance doubles at fixed voltage. The key insight is that higher resistance reduces current, which reduces power dissipation.

### Answer 2

Using the voltage divider formula:

V_out = V_in * R2 / (R1 + R2)
V_out = 10V * 10000 / (4700 + 10000)
V_out = 10V * 10000 / 14700
V_out = 10V * 0.6803
**V_out = 6.80V**

The larger bottom resistor (R2) means the output is more than half the input. The ratio R2/(R1+R2) = 0.68 determines the fraction of V_in that appears at the output.

### Answer 3

**Branch C carries 8mA.**

This is determined by **Kirchhoff's Current Law (KCL)**: the sum of currents entering a node must equal the sum of currents leaving.

I_total = I_A + I_B + I_C
30mA = 10mA + 12mA + I_C
I_C = 30mA - 10mA - 12mA = **8mA**

KCL is conservation of charge -- current cannot accumulate at the junction, so everything that flows in must flow out through the branches.

### Answer 4

The LED drops 5V, so the resistor must drop the remaining voltage:

V_R = V_supply - V_LED = 12V - 5V = **7V**

Using Ohm's law to find resistance:

R = V_R / I = 7V / 0.020A = **350 ohm**

The nearest standard value is 330 ohm (slightly more current, ~21.2mA) or 390 ohm (slightly less current, ~17.9mA). Either would work; 330 ohm is the common choice when the LED can tolerate a bit more current.

Power dissipated by the resistor:

P = V_R * I = 7V * 0.020A = **0.14W (140mW)**

A standard **1/4W (250mW) resistor** is sufficient, providing adequate margin above the 140mW dissipation.

### Answer 5

By Ohm's law, I = V/R. As R approaches 0:

- At R = 1 ohm and V = 5V: I = 5A
- At R = 0.1 ohm and V = 5V: I = 50A
- At R = 0.01 ohm and V = 5V: I = 500A

**As R approaches zero, current approaches infinity.** Even at "low" voltages like 5V, near-zero resistance produces enormous currents.

Real-world consequences:
1. **Extreme heat**: P = I^2 * R. Even with tiny R, the I^2 term dominates. Wires glow red-hot.
2. **Wire melting**: Conductors have small but nonzero resistance. Huge current through this resistance causes rapid heating.
3. **Fire hazard**: Overheated insulation ignites. This is the primary cause of electrical fires.
4. **Source damage**: Batteries and power supplies have internal resistance. Short-circuit current causes internal overheating, potentially causing battery venting or explosion.
5. **Protection mechanisms**: Fuses and circuit breakers exist specifically to interrupt short-circuit current before damage occurs.

The takeaway: resistance is not optional. Every circuit needs controlled current paths. An accidental short circuit bypasses all the carefully designed current control, with potentially destructive results.
