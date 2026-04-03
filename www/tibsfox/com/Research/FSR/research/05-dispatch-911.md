# The Voice on the Line — Dispatch and 911

## Haleyville, Alabama

On February 16, 1968, the Speaker of the Alabama House of Representatives, Rankin Fite, picked up a red telephone in the Haleyville, Alabama city hall and dialed 9-1-1. Across town, at the Haleyville police station, U.S. Representative Tom Bevill answered. It was the first 911 call in American history.

The choice of those three digits was not accidental. AT&T had recommended 911 in 1967 after a series of presidential commissions identified the lack of a universal emergency number as a public safety crisis. The criteria were specific: the number had to be short, easy to remember, not already in use as an area code or service code, and easy to dial on a rotary phone (9-1-1 was fast because the digits were near the finger stop). The Federal Communications Commission endorsed the recommendation, and the race to implement it began.

Nome, Alaska followed Haleyville by a week. New York City implemented 911 in 1968. The rollout across the rest of the country was slow — painfully, lethally slow. By 1979, roughly 26 percent of the U.S. population had 911 access. By 1987, 50 percent. Universal coverage — defined as 96 percent or greater — was not achieved until the late 1990s. For three decades after the first call in Haleyville, millions of Americans in an emergency had to know the seven-digit phone number of their local police or fire department, or dial the operator. People died because they could not remember a phone number.

The delay was not technological. It was economic and political. Implementing 911 required telephone infrastructure upgrades, interagency agreements, funding for public safety answering points (PSAPs), and the political will to overcome inertia. Small communities without the tax base to fund PSAPs were last. Rural areas where the telephone infrastructure was decades old were last. The pattern is familiar: the communities with the least resources received the lifesaving infrastructure last.

## Enhanced 911

Basic 911 told the dispatcher that someone was calling. Enhanced 911 (E911), implemented beginning in the 1980s, told the dispatcher where they were calling from. Automatic Number Identification (ANI) provided the caller's phone number. Automatic Location Identification (ALI) provided the address associated with that phone number. These two data points — number and location — transformed 911 from a communication channel into an information system.

The significance of E911 is difficult to overstate. Before ANI/ALI, if a caller was unable to speak — because they were choking, having a seizure, being attacked, or because they were a child who could dial 911 but could not provide an address — the dispatcher had no way to send help. The call was a dead end. With E911, the dispatcher could see the address on their screen the moment the line connected. Help could be dispatched even if the caller never said a word.

The wireless revolution complicated everything. When 911 was designed, telephones were attached to walls. A phone number corresponded to a physical address. When mobile phones became ubiquitous — there are now more wireless 911 calls than wireline calls in the United States — the fixed relationship between number and location dissolved. A cell phone call to 911 arrives at the PSAP with a phone number but not a fixed address. Phase I wireless E911 provided the cell tower receiving the call, giving a general area. Phase II provided GPS coordinates from the handset, giving a location accurate to within 50 to 300 meters.

Fifty to 300 meters is a city block. In a high-rise building, it might represent twenty floors. In a dense urban environment, it might encompass hundreds of apartments. The gap between "the call is coming from somewhere in this area" and "the patient is in apartment 4B" is the gap between a quick response and a search. For a cardiac arrest patient whose survival is measured in minutes, the precision of location data is a clinical variable.

## Next Generation 911

Next Generation 911 (NG911) is the ongoing modernization of the 911 infrastructure from analog circuit-switched telephone networks to digital IP-based networks. The technical transformation is substantial: NG911 enables text-to-911, video streaming, photo transmission, telematics data from connected vehicles (automatic crash notification), and integration with building information systems that can provide floor plans and fire alarm panel data to dispatchers in real time.

Text-to-911 is particularly significant for deaf and hard-of-hearing callers, for domestic violence victims who cannot safely make a voice call, and for active shooter situations where speaking on the phone could reveal the caller's location. The capability is not yet universally available — implementation varies by PSAP — but the trajectory is toward universal text access.

The transition from legacy 911 to NG911 is, like the original 911 implementation, proceeding unevenly. Large, well-funded PSAPs in major metropolitan areas are leading the adoption. Small, rural PSAPs with limited budgets and aging infrastructure are behind. The pattern repeats.

## Computer-Aided Dispatch

The Computer-Aided Dispatch (CAD) system is the nerve center of the emergency response operation. A CAD system receives the 911 call data (ANI, ALI, caller information), creates a call record, recommends or assigns units based on geographic boundaries and unit availability, tracks unit status in real time, records all activity with timestamps, and provides the historical database that drives quality improvement, performance measurement, and legal documentation.

Modern CAD systems integrate with geographic information systems (GIS) for mapping, records management systems (RMS) for criminal history and call history, mobile data terminals (MDTs) in field units for dispatched call information, and automatic vehicle location (AVL) systems that show the real-time position of every fire apparatus, ambulance, and police unit. The dispatcher sees the entire system on a wall of screens: pending calls, unit status, maps, call details, and resource availability.

The CAD system is only as good as its data. Address databases must be current and accurate. GIS layers must reflect actual geography. Unit status must be updated in real time. When a new subdivision is built and the addresses are not loaded into the CAD, the system cannot route calls to the correct location. When a unit fails to update its status, the dispatcher's picture of resource availability is wrong. Data hygiene is not glamorous, but it is life-critical.

## Emergency Medical Dispatch

Emergency Medical Dispatch (EMD) is a structured system of protocols that enables the 911 dispatcher to assess the medical nature of a call, assign the appropriate resource level (BLS vs. ALS), and provide pre-arrival instructions — real-time medical coaching to the caller on what to do before the ambulance arrives.

The EMD system most widely used in the United States is the Medical Priority Dispatch System (MPDS), developed by Dr. Jeff Clawson in the 1970s. MPDS provides a card-based protocol for each call type (chest pain, breathing problems, cardiac arrest, falls, overdose, and dozens more). The dispatcher asks scripted questions in a specific sequence, and the answers determine the determinant code — a classification that defines the severity of the call and the response configuration.

The most consequential EMD intervention is telephone-guided CPR. When a caller reports someone who is not breathing and has no pulse, the EMD dispatcher walks the caller through chest compressions in real time: "Put the heel of your hand on the center of the chest, right between the nipples. Push hard and fast. One, two, three, four..." This continues until responders arrive.

The evidence for dispatcher-assisted CPR is overwhelming. Bystander CPR — chest compressions initiated by someone on scene before EMS arrives — dramatically improves cardiac arrest survival. Dispatcher-assisted CPR dramatically increases the rate of bystander CPR. In communities with strong EMD programs, bystander CPR rates can exceed 50 to 60 percent. In communities without, rates may be below 30 percent. The difference is measured in lives.

The dispatcher is performing emergency medicine with their voice. They cannot see the patient. They cannot touch the patient. They cannot assess vital signs. They have only the caller's words and the sound of the caller's voice. They are managing the medical situation and the caller's emotional state simultaneously — coaching someone through CPR while that person is watching a family member die. The clinical skill this requires has been systematically undervalued by the emergency services community and by the public.

Fire dispatching involves its own protocol complexity. The fire dispatcher must determine the nature and severity of a reported fire or emergency, assign the appropriate response level (single engine, full structure fire assignment, technical rescue, hazmat), and manage the dynamic resource allocation that a multi-alarm fire requires. As units are committed to an incident, the dispatcher must backfill coverage — moving companies between stations to maintain response capability across the rest of the jurisdiction. This resource chess game, played in real time during major incidents, requires a mental model of the entire system that is updated continuously.

## Trunked Radio and Communications

The radio system is the lifeline between the dispatcher and the field. Modern public safety communications use trunked radio systems — digital systems that automatically assign frequencies from a pool, allowing multiple agencies and talk groups to share infrastructure without interfering with each other. The dominant standard is Project 25 (P25), developed by the Association of Public-Safety Communications Officials (APCO) and the Telecommunications Industry Association.

The move from analog to digital radio has improved audio quality, increased channel capacity, enabled encryption (important for law enforcement tactical communications), and supported data transmission alongside voice. But digital radio has limitations that analog did not: digital audio quality degrades suddenly rather than gradually (the "cliff effect" — an analog signal gets staticky as it weakens, giving the user a warning; a digital signal works perfectly until it doesn't work at all), and digital systems can be more vulnerable to infrastructure failure.

Interoperability — the ability of different agencies on different systems to communicate with each other — remains the central challenge of public safety communications. The 9/11 attacks were a catastrophic demonstration of what happens when fire and police cannot talk to each other. Twenty-five years of investment in interoperability solutions have improved the situation, but the problem is not fully solved. Different agencies procure different systems on different timelines with different budgets and different technical requirements. Achieving seamless interoperability in this environment is as much a governance challenge as a technical one.

FirstNet — the First Responder Network Authority, established by Congress in 2012 and deployed by AT&T beginning in 2017 — is a dedicated nationwide broadband network for public safety. FirstNet provides priority and preemption on the AT&T LTE (and now 5G) network, meaning that first responder data traffic takes precedence during network congestion. This addresses the problem that plagued responders during major events: cell networks overwhelmed by public usage, leaving responders unable to communicate via mobile data. FirstNet also enables broadband applications — video streaming, large file transfer, real-time sensor data — that narrowband radio cannot support.

## The Emotional Toll

The dispatcher's psychological burden is among the most underrecognized in emergency services. Dispatchers hear everything. They hear the gunshots. They hear the screaming. They hear the mother who found her child in the pool. They hear the domestic violence victim whispering because the abuser is in the next room. They hear the silence after the line goes dead and they do not know if the caller is safe.

They hear all of this, and they cannot leave their console. A firefighter arrives on scene and takes action. A paramedic assesses the patient and provides treatment. A police officer intervenes. The dispatcher listens and talks. They send help, they provide instructions, they relay information. But they do not see the resolution. They do not know, in many cases, whether the patient survived. They hand the call to the responding units and move to the next call. The open loop — starting a crisis and never seeing its conclusion — is psychologically corrosive in ways that are distinct from the field responder's experience.

Research on dispatcher mental health has consistently found rates of PTSD, depression, anxiety, and burnout comparable to or exceeding those of field responders. A 2012 study published in the Journal of Traumatic Stress found that 911 dispatchers had PTSD rates similar to police officers and firefighters. A 2018 study in the Journal of Emergency Dispatch found that 33 percent of dispatchers had symptoms consistent with clinical PTSD. These numbers are not anomalies — they are consistent across studies and across decades.

The emotional toll is compounded by the nature of the work environment. Dispatchers sit in a room for an eight- or twelve-hour shift. They cannot step outside for fresh air between difficult calls. They cannot decompress with their crew at the kitchen table. They are chained to their console by headset and duty, processing call after call, with no physical separation between the traumatic call and the routine call. The call about the cardiac arrest and the call about the barking dog come through the same headset, to the same person, minutes apart.

The secondary trauma of hearing death and suffering through a headset — without the ability to act, without the closure of seeing the patient saved, without the camaraderie of a field crew — is a distinct and serious occupational hazard. And it has historically been treated as something less than what it is.

## The Dispatch Center Environment

The physical environment of a 911 dispatch center is a windowless room — windowless by design, because screens must be readable and distractions minimized. Rows of consoles, each equipped with multiple monitors displaying CAD, mapping, radio channels, phone lines, and unit status. The lighting is dim. The noise is constant — radio traffic, phone rings, keyboard clicks, the voices of other dispatchers working their own calls simultaneously.

A dispatcher working a busy urban center may handle dozens of calls per shift. Some are routine — alarm activations, non-injury accidents, noise complaints. Some are not. The dispatcher does not choose which calls they receive. They answer the phone, and whatever is on the other end is theirs to manage. A panic attack and a shooting and a house fire and a cat in a tree may come in sequence within minutes, and the dispatcher must calibrate their response — their tone, their urgency, their resource allocation — to each one independently.

The skill set is specific and demanding. A dispatcher must type rapidly while talking on the phone and monitoring radio traffic. They must simultaneously process information from the caller, enter it into the CAD system, and dispatch appropriate resources. They must manage their radio discipline — clear, concise transmissions that convey critical information without wasting airtime. They must know the geography of their jurisdiction well enough to route units efficiently, identify cross streets, and anticipate traffic or access problems. They must know the capabilities and limitations of the units they dispatch — which engine companies have ALS capability, which are out of service, which are already committed.

Multi-tasking is the wrong word for what dispatchers do. Multi-tasking implies doing several things at once with diminished attention to each. What dispatchers do is rapid sequential tasking — switching between tasks with full attention to each, at a pace that would be unsustainable for most people. The cognitive load is extreme, sustained for hours, and interrupted only by shift change.

The staffing of dispatch centers is a chronic problem nationwide. Dispatch positions are difficult to fill and harder to retain. The work is stressful, the pay is typically lower than field responder pay, the career advancement is limited, and the job lacks the visible identity and public recognition that field responders receive. Turnover rates in many dispatch centers exceed 30 percent annually. The consequence is that remaining dispatchers work mandatory overtime to cover empty positions, which increases fatigue, which increases errors, which increases stress, which drives more turnover. The cycle is self-reinforcing and the solutions — better pay, better staffing ratios, better support — require funding that many jurisdictions claim they cannot afford.

## The Fight for Reclassification

For federal statistical purposes, 911 dispatchers are classified by the Bureau of Labor Statistics under Standard Occupational Classification (SOC) code 43-5031: "Police, Fire, and Ambulance Dispatchers," which falls under the broader category of "Office and Administrative Support Occupations." This classification places dispatchers in the same occupational category as secretaries, file clerks, and data entry operators.

The consequences of this classification are not merely symbolic. Access to certain federal benefits, mental health programs, and retirement provisions that are available to first responders (classified under "Protective Service Occupations") are not available to dispatchers under the administrative support classification. Workers' compensation claims for PTSD and other psychological injuries may be evaluated differently for administrative support workers than for protective service workers. The classification shapes how the profession is perceived, funded, and supported.

The movement to reclassify 911 dispatchers as first responders has gained significant momentum. In 2019, the National Emergency Number Association (NENA) and APCO International formally petitioned the Office of Management and Budget to reclassify dispatchers under protective service occupations. Several states have passed legislation recognizing dispatchers as first responders at the state level. Federal legislation — the 911 SAVES Act — has been introduced in multiple congressional sessions to mandate reclassification at the federal level.

The argument for reclassification is straightforward: dispatchers perform work that is functionally identical to other first responders in its exposure to trauma, its public safety mission, its operational criticality, and its psychological cost. The classification as administrative support is an artifact of a time when the dispatcher's role was understood as clerical — answering the phone and sending the unit. That understanding has been obsolete for decades. The dispatcher is a medical provider (through EMD), a tactical coordinator (through incident management), and a crisis counselor (through every call they handle). Their work is protective service work. The classification should reflect that.

For thirty years, every call that reached the person to whom this research is dedicated first passed through a dispatcher's headset. The voice on the radio that gave the address, the nature of the call, the cross streets — that voice belonged to a person sitting in a room full of screens, managing multiple calls simultaneously, carrying the emotional weight of every one. The dispatcher and the field responder are two halves of the same system. One is not possible without the other. The recognition should be equal.

## Try This / DIY Project

> **Study Guide: [Radio Communications for Emergencies](study-guides/radio-communications-basics.md)**
> This chapter covers the dispatch side of communications --- CAD systems, trunked radio, EMD protocols. The radio study guide covers the citizen side: NOAA weather radio, FRS/GMRS walkie-talkies, and ham radio. When the dispatch center's 911 lines are overwhelmed or the phone network is down, amateur radio operators fill the communications gap --- the same electromagnetic spectrum, different access point.

> **Try Session: [Hands-Only CPR](try-sessions/hands-only-cpr.md)**
> Dispatcher-assisted CPR (covered in this chapter) works because the dispatcher guides bystanders through exactly the technique taught in the CPR try session. Learning CPR before the call means the dispatcher's instructions reinforce existing knowledge rather than teaching from scratch under maximum stress.

---

## Cross-References

- **[FSR-01]** History — the 911 system as an outgrowth of the same reform-by-catastrophe pattern
- **[FSR-03]** EMS and Paramedicine — EMD protocols and dispatcher-assisted CPR as prehospital medical interventions
- **[FSR-07]** Equipment — CAD systems, trunked radio, and the communications infrastructure that dispatchers operate
- **[FSR-09]** Responder Wellness — dispatcher PTSD rates comparable to field personnel, the unique psychology of hearing without seeing
- **[FSR-10]** PNW Departments — regional dispatch centers, Valley Communications (ValleyCom), NORCOM, and South Sound 911

---

## Sources and References

- National Emergency Number Association (NENA). "NENA Master Glossary of 9-1-1 Terminology." Updated regularly.
- Clawson, Jeff. "Medical Priority Dispatch System (MPDS)." International Academies of Emergency Dispatch.
- Lerner, E.B., et al. "911 Dispatcher-Assisted CPR." *Resuscitation*, 83(10), 2012.
- Husain, S., and Eisenberg, M. "Dispatcher-Assisted CPR and Cardiac Arrest Outcomes." *Prehospital Emergency Care*, various.
- Klimley, K.E., et al. "Posttraumatic Stress Disorder in Police, Firefighters, and Emergency Dispatchers." *Aggression and Violent Behavior*, 43, 2018.
- APCO International. "Project 25 (P25) Standards."
- First Responder Network Authority. firstnet.gov
- 911 SAVES Act. Introduced in multiple congressional sessions. (Reclassification legislation)

---

## College of Knowledge Connections

- **Science** --- [Systems Engineering]: The 911 system is a complex distributed system --- call routing, CAD (computer-aided dispatch), GIS mapping, radio interoperability, and telephone network infrastructure are all engineering disciplines that converge in the dispatch center.
- **Mind-Body** --- [Sustained Attention and Stress Management]: Dispatchers maintain constant vigilance across multiple channels of information for 8-12 hour shifts, making rapid triage decisions based on auditory information alone. The cognitive and emotional demands --- including listening to people in their worst moments --- make dispatch one of the highest-stress roles in emergency services.
- **Psychology** --- [Occupational Trauma]: Dispatchers experience vicarious trauma through repeated exposure to crisis calls. The movement to reclassify dispatchers as first responders (rather than clerical workers) reflects growing recognition of the psychological burden inherent to the role.

---

*This document is part of the FSR (First Responders) research series within the PNW Research Project. It is dedicated to those who answer the call.*
