# Module 12: Sensors and Actuators -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain how a Wheatstone bridge converts a tiny resistance change into a measurable voltage. Why is it more sensitive than a simple voltage divider for detecting small resistance changes in a sensor?

## Question 2: Calculation

A strain gauge has a gauge factor of 2 and a nominal resistance of 350 ohms. Under a strain of 500 microstrain, what is the resistance change? If this strain gauge is used in a Wheatstone bridge with an excitation voltage Vs = 10V (all other resistors are 350 ohms), what is the bridge output voltage?

## Question 3: Analysis

You are driving a DC motor with an H-bridge and notice the motor sometimes jerks violently when changing direction. What might be causing this problem, and how do you fix it?

## Question 4: Design

A stepper motor has 200 steps per revolution (1.8 degrees per step). You need to rotate the shaft exactly 90 degrees. How many full steps are needed? If using half-stepping, how many half-steps are required?

## Question 5: Application

You need to isolate an MCU (3.3V logic) from a 240VAC relay circuit using an optocoupler. Specify: the input resistor value (given LED forward voltage of 1.2V and desired LED current of 10mA), the minimum CTR required, and the output configuration.

## Answer Key

### Answer 1

A Wheatstone bridge has four resistors arranged in a diamond. When all resistors are matched (balanced), the output voltage is exactly zero. This zero baseline is the key to its sensitivity. When a sensor (strain gauge, RTD) changes one resistor by even a tiny amount, the balance is disturbed and a small voltage appears at the output.

A simple voltage divider would produce a huge DC voltage (e.g., 2.5V from a 5V source) with the sensor's tiny change sitting on top as a minuscule variation (e.g., 2.5V +/- 6mV). Measuring that 6mV change against a 2.5V background requires an ADC with extremely high resolution. The bridge nulls out the 2.5V DC offset entirely, leaving only the delta signal against a zero baseline. This means a much simpler (and cheaper) amplifier and ADC can detect the same change. The approximate sensitivity formula is V_out ~ Vs * deltaR / (4*R) for small changes.

### Answer 2

**Resistance change:** dR = Gauge Factor * strain * R_nominal = 2 * 500e-6 * 350 = **0.35 ohms**

**Bridge output voltage:** Using the approximation V_out ~ Vs * dR / (4 * R):

V_out = 10V * 0.35 / (4 * 350) = 10 * 0.35 / 1400 = 3.5 / 1400 = **2.5 mV**

Alternatively, using the exact formula with R4 = 350.35 ohms:
V_out = 10 * (350/(350+350) - 350/(350+350.35)) = 10 * (0.5 - 0.49975) = 10 * 0.00025 = 2.5 mV

This 2.5mV signal would then be amplified by an instrumentation amplifier (e.g., gain = 1000 to produce 2.5V for the ADC).

### Answer 3

The violent jerking when changing motor direction is almost certainly caused by **shoot-through** -- a condition where both the high-side and low-side switches on the same leg of the H-bridge are ON simultaneously during the transition from forward to reverse.

During the switching transition, one transistor hasn't fully turned off before the other turns on. For a brief moment (nanoseconds to microseconds), both conduct, creating a direct short circuit from supply to ground through the two switches. This causes:
1. A massive current spike (potentially hundreds of amps)
2. A voltage spike that disturbs the motor drive signal
3. Mechanical jerking as the motor receives a burst of uncontrolled current

**Fix: Add dead-time delay.** Insert a brief blanking period (typically 0.5-2 microseconds) between turning off one switch and turning on the other. During this dead time, both switches are OFF and the motor coasts briefly. Motor driver ICs like the DRV8833 and L298 include built-in dead-time circuits. If using discrete MOSFETs, implement dead-time in the MCU firmware or use a dedicated gate driver IC with programmable dead-time.

### Answer 4

**Full steps for 90 degrees:** 90 / 1.8 = **50 full steps**

Each full step advances the motor by 1.8 degrees. 50 steps * 1.8 degrees/step = 90 degrees exactly.

**Half-steps for 90 degrees:** In half-stepping, each step is half the full-step angle: 0.9 degrees per half-step.

90 / 0.9 = **100 half-steps**

Half-stepping provides twice the positioning resolution (0.9 degrees vs 1.8 degrees) at the cost of slightly uneven torque between single-coil and double-coil phases. For even finer control, microstepping at 1/16 would require 50 * 16 = 800 microsteps for 90 degrees.

### Answer 5

**Input resistor:** R = (V_mcu - V_f_led) / I_led = (3.3V - 1.2V) / 10mA = 2.1V / 0.01A = **210 ohms**. Use the nearest standard value: **220 ohms** (gives 9.5mA, close enough).

**Minimum CTR requirement:** The output must reliably sink enough current to drive the relay driver transistor (typically needs 1-5mA base current). With 9.5mA input current and needing at least 5mA output: CTR_min = 5mA / 9.5mA = 52.6%. Specify **CTR > 50%**, and select an optocoupler with rated CTR well above this (e.g., 100% nominal) to account for aging and temperature derating.

**Output configuration:** Open-collector NPN phototransistor with a pull-up resistor to the relay driver's Vcc. When the MCU drives the LED, the phototransistor saturates, pulling the output LOW to trigger the relay driver transistor. When the MCU releases the LED, the output goes HIGH via the pull-up. The optocoupler provides isolation between the 3.3V MCU domain and the relay drive circuit, with the 240VAC isolation rated for at least 3.75kV (reinforced insulation per IEC 60950). Choose a device rated for the application's isolation voltage, such as the PC817 (5kV) or 4N35 (7.5kV peak).
