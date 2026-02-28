# Module 5: Transistors -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Current-Controlled vs. Voltage-Controlled

**Conceptual**: Explain why a BJT is called a "current-controlled" device while a MOSFET is called a "voltage-controlled" device. What practical consequence does this distinction have for circuit design?

## Question 2: Common-Emitter Calculation

**Calculation**: A common-emitter amplifier has VCC = 12V, RC = 2.2k ohm, beta = 150, and IB = 20 microamps. Calculate:
- (a) The collector current IC
- (b) The collector voltage VC

## Question 3: Emitter Follower Analysis

**Analysis**: An emitter follower circuit has VCC = 15V, RB = 220k ohm (from VCC to base), RE = 2.2k ohm (from emitter to ground), and a BJT with beta = 100. Find:
- (a) The emitter voltage VE
- (b) The voltage gain of the circuit

## Question 4: BJT Switch Design

**Application**: Design a BJT switch to control a 12V relay coil with a resistance of 120 ohms from a 3.3V logic signal. Using a 2N2222 NPN transistor (beta = 100), calculate the minimum base resistor RB to ensure the transistor is in saturation with a forced beta of 10.

## Question 5: Current Mirror vs. Resistor

**Reasoning**: A designer needs a 1mA current source in a circuit where VCC can vary between 10V and 15V. Explain why a current mirror produces a more stable current than simply using a resistor from VCC. Include a quantitative comparison.

---

## Answer Key

### Answer 1

A BJT is current-controlled because its collector current is determined by the base current: IC = beta * IB. To control the BJT, you must supply a continuous current into the base terminal. The base-emitter junction is a forward-biased diode that draws real current.

A MOSFET is voltage-controlled because its drain current is determined by the gate-source voltage VGS. The gate is insulated from the channel by a thin oxide layer, so no DC gate current flows (input impedance is essentially infinite).

**Practical consequence**: BJTs require a continuous base current to stay ON, which means the driving circuit must supply power. MOSFETs require only a voltage at the gate with no steady-state current, making them easier to drive from high-impedance sources and CMOS logic. This is why MOSFETs dominate digital logic and power switching applications.

### Answer 2

**(a)** IC = beta * IB = 150 * 20 uA = 3.0 mA

**(b)** VC = VCC - IC * RC = 12V - (3.0 mA * 2.2k ohm) = 12V - 6.6V = **5.4V**

The transistor is in the active region since VC (5.4V) is well above VE (approximately 0V for grounded emitter), confirming the calculation is valid. If VC had been calculated as negative, it would indicate saturation and the formulas would not apply.

### Answer 3

**(a)** First find the base voltage. Current through RB flows into the base and then through the BJT to the emitter. Using the approximation that IB is small:

VB is approximately VCC minus the drop across RB. With IB = IE/(beta+1) and IE = VE/RE:

VE/RE = (beta+1) * IB, and VB = VE + 0.6V, and VCC - VB = IB * RB

Substituting: VCC - (VE + 0.6) = (VE / (RE * (beta+1))) * RB

15 - VE - 0.6 = VE * 220000 / (2200 * 101) = VE * 0.990

14.4 = VE * (1 + 0.990) = VE * 1.990

**VE = 14.4 / 1.990 = 7.24V**

**(b)** The voltage gain of an emitter follower is approximately:

Av = RE / (RE + re), where re = VT/IC = 26mV / (VE/RE) = 26mV / 3.29mA = 7.9 ohm

Av = 2200 / (2200 + 7.9) = **0.996 (approximately unity)**

The emitter follower has a voltage gain very close to 1, confirming its role as a unity-gain buffer.

### Answer 4

Relay coil current: I_relay = 12V / 120 ohm = 100 mA

For saturation with forced beta of 10:
IB(required) = IC / forced_beta = 100 mA / 10 = 10 mA

From the 3.3V logic signal:
RB = (V_logic - VBE(sat)) / IB = (3.3V - 0.7V) / 10 mA = 2.6V / 10 mA = **260 ohms**

Use a standard value of **220 ohms** (next lower standard value to ensure adequate base drive). This gives IB = 2.6V / 220 = 11.8 mA, providing a comfortable saturation margin.

Note: A flyback diode across the relay coil is essential to protect the transistor from the inductive voltage spike when the relay turns off.

### Answer 5

**Using a resistor (R = VCC / I_target)**:
- At VCC = 10V: I = 10V / 10k = 1.0 mA
- At VCC = 15V: I = 15V / 10k = 1.5 mA
- Variation: 0.5 mA, or 50% change for a 50% supply change

**Using a current mirror (R_ref sets I_ref)**:
- I_ref = (VCC - VBE) / R_ref
- At VCC = 10V: I = (10 - 0.6) / 9.4k = 1.0 mA
- At VCC = 15V: I = (15 - 0.6) / 9.4k = 1.53 mA
- Wait -- the reference side still varies!

The real advantage is on the **mirror output side**. The mirror transistor Q2 acts as a current source with very high output resistance (r_o = VA/IC, typically 50k-500k ohms). So the mirror current stays nearly constant as long as Q2 remains in the active region, regardless of the voltage across the load. The reference current variation can be reduced with a cascode or a feedback-regulated reference.

A simple resistor current source has output resistance equal to R itself (10k ohm). The current mirror has output resistance of r_o (perhaps 100k ohm), making it 10x less sensitive to load voltage changes. This is why current mirrors are preferred in analog IC design where stable bias currents are critical.
