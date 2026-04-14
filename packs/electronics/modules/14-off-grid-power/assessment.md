# Module 14: Off-Grid Power Systems -- Assessment

> 5 questions testing understanding, not memorization

## Questions

### Question 1

Why does an MPPT controller extract more energy from a solar panel than a PWM controller?

### Question 2

A 12V 200Ah lead-acid battery bank is used in an off-grid system with a 50% depth of discharge limit. How many usable amp-hours does this battery bank provide, and why is the 50% limit important?

### Question 3

Why does a solar panel's open-circuit voltage (Voc) decrease with increasing temperature, while its short-circuit current (Isc) increases slightly?

### Question 4

A 3kW pure sine wave inverter is running at 25% load (750W). Why is its efficiency lower than when running at 75% load (2250W)?

### Question 5

NEC 690.12 requires a rapid shutdown system for rooftop solar installations. What are the voltage and time limits that apply to conductors within the array boundary?

## Answer Key

**1.** An MPPT controller operates the solar panel at its maximum power point (MPP) using a DC-DC converter, regardless of battery voltage. A PWM controller clamps the panel voltage to the battery voltage, which is typically well below the MPP voltage. By operating below MPP, the PWM controller extracts less power from the same panel. The difference is most significant when the voltage mismatch between panel Vmp and battery voltage is large -- MPPT can improve energy harvest by 15-30% compared to PWM.

**2.** 100Ah usable. The 200Ah battery bank at 50% DOD provides only half its rated capacity for use: 200Ah * 0.50 = 100Ah. The 50% DOD limit is important because lead-acid batteries suffer dramatically reduced cycle life at deeper discharge levels. At 50% DOD, a lead-acid battery can deliver 500-800 cycles; at 80% DOD, cycle life drops to only 200-300 cycles. Staying above 50% SOC preserves battery longevity and keeps the overall cost per kWh lower.

**3.** Higher temperature increases the intrinsic carrier concentration in silicon, which reduces the bandgap voltage. Since Voc depends on the bandgap (Voc decreases approximately 2mV per cell per degree C above 25C), higher temperature means lower Voc. Isc increases slightly because the reduced bandgap allows photons with slightly less energy to be absorbed, marginally increasing the photocurrent. The Voc decrease dominates the overall effect, so panel power decreases with temperature -- a 36-cell panel at 60C loses about 2.5V compared to 25C.

**4.** An inverter has fixed power losses (standby power, gate drive circuits, transformer magnetizing current, control electronics) that are present regardless of load. At 25% load (750W), these fixed losses represent a much larger fraction of the output power than at 75% load (2250W). For example, if fixed losses are 50W: at 750W output, losses are 50/750 = 6.7% of output; at 2250W output, losses are 50/2250 = 2.2% of output. This is why inverters should be sized to operate primarily in the 50-100% load range for best efficiency.

**5.** NEC 690.12 requires that conductors within 1 foot of the array boundary must drop to 80V or less within 30 seconds of rapid shutdown initiation. This requirement exists because solar panels cannot be turned off while the sun is shining, and firefighters or maintenance workers need to be protected from lethal DC voltages when working on or near rooftop arrays. Module-level power electronics (MLPEs) such as microinverters or DC optimizers with rapid shutdown capability are the most common compliance method.
