# Indigenous Data and Digital Sovereignty Across the Pacific Rim

**Research Module 09 — ROF Sovereignty Series**
*Data is the fourth layer of the Sovereignty Stack. You cannot build infrastructure (Layer 5) without knowing who controls the signal (Layer 4).*

---

## Table of Contents

1. [The Sovereignty Stack: Where Data Fits](#1-the-sovereignty-stack-where-data-fits)
2. [The CARE Principles: A Governance Framework, Not a Technical Standard](#2-the-care-principles-a-governance-framework-not-a-technical-standard)
3. [OCAP® — First Nations Information Governance Centre](#3-ocap--first-nations-information-governance-centre)
4. [Māori Data Sovereignty — Aotearoa New Zealand](#4-māori-data-sovereignty--aotearoa-new-zealand)
5. [U.S. Indigenous Data Sovereignty Network (USIDSN)](#5-us-indigenous-data-sovereignty-network-usidsn)
6. [Center for Tribal Digital Sovereignty (CTDS)](#6-center-for-tribal-digital-sovereignty-ctds)
7. [Indigenous-Owned Digital Infrastructure: Emerging Cases](#7-indigenous-owned-digital-infrastructure-emerging-cases)
8. [AI Governance and the Training-Data Frontier](#8-ai-governance-and-the-training-data-frontier)
9. [Connection to the GSD Ecosystem: DACP, Trust Architecture, and Cross-Sovereign Data Flows](#9-connection-to-the-gsd-ecosystem-dacp-trust-architecture-and-cross-sovereign-data-flows)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Sovereignty Stack: Where Data Fits

Sovereignty is not a single switch. It is a layered architecture, and each layer depends on the integrity of the layer beneath it. When analysts discuss Indigenous sovereignty in the context of the Ring of Fire — the arc of seismic hazard, critical mineral territory, and governance complexity running from Northern California through Alaska and across the Pacific — they often focus on governance (who makes decisions) and territory (whose land). These are foundational. But the analysis breaks down if it stops there.

The Sovereignty Stack is a five-layer model for understanding how sovereign authority actually exercises itself in a world of data networks, environmental monitoring systems, AI-assisted resource assessments, and digital infrastructure built across ancestral territories:

- **Layer 1 — Governance Foundation:** Who holds the authority to make binding decisions? What are the institutions, the decision-making processes, the consent requirements? For Indigenous nations, this is inherent sovereignty — not granted by colonial governments, but recognized by them in treaties and international instruments. Without this layer, no other layer can stand.
- **Layer 2 — Territorial Authority:** Whose land? Whose waters? Whose air, whose subsurface, whose fisheries and tidal zones? Territorial authority defines the geographic scope of sovereign jurisdiction. In the Ring of Fire context, territorial authority is actively contested across hundreds of overlapping claims, treaty boundaries, and unextinguished Aboriginal title areas.
- **Layer 3 — Resource Rights:** Who owns what is extracted? Who receives royalties, who provides consent for extraction, who sets the terms of remediation? Resource rights are the economic expression of territorial authority. They are also the layer most immediately under pressure from critical mineral development in the Ring of Fire region.
- **Layer 4 — DATA SOVEREIGNTY:** Who controls the signal? Who collects environmental monitoring data from sensors placed on Indigenous territory? Who owns the health data gathered from Indigenous communities during environmental assessments? Who controls the ethnobotanical knowledge encoded in traditional land use studies submitted to regulatory bodies? Who can access, analyze, share, or sell data about Indigenous lands, resources, and peoples? This is Layer 4, and it is the subject of this module.
- **Layer 5 — Infrastructure:** Who owns the pipe? Who builds and operates the broadband networks, the sensor arrays, the data centers, the satellite links that serve Indigenous communities and territories? Infrastructure is the physical and digital layer through which all sovereign authority must eventually flow.

The core argument of this module is precise: **you cannot build Layer 5 without Layer 4.** Indigenous communities that build broadband networks without establishing data sovereignty frameworks find that the network itself becomes an instrument of extraction — a pipe through which community data flows outward to outside researchers, government agencies, and corporations, generating knowledge and value that the community neither controls nor benefits from. The pipe matters. But who governs what flows through it matters more.

This is not a hypothetical concern. It is a documented pattern repeated across the Pacific Rim. Environmental monitoring programs have placed sensors on Indigenous territories, collected data about lands and resources, and published findings in academic journals without nation consent over methodology, publication, or data retention. Health research programs have gathered genetic and health data from Indigenous communities under broad consent frameworks that allowed the data to be used for purposes the communities never agreed to. Traditional knowledge — ecological, medicinal, cultural — has been incorporated into databases, patents, and AI training datasets without the knowledge or consent of the nations who hold that knowledge as part of their collective heritage.

Data sovereignty is the layer that interrupts this pattern. It does so by asserting what the governance layer already establishes: that Indigenous peoples have the inherent right to govern their own affairs, and that data about them, their lands, and their resources is part of those affairs. The UNDRIP provisions most directly relevant here — particularly Articles 11, 12, 18, 19, 31, and 32 — make clear that FPIC applies not only to physical infrastructure projects but to the collection, use, and dissemination of information about Indigenous peoples and territories. (See Module A, `05-territorial-rights-legal-frameworks.md`, for the full UNDRIP framework.)

In the Ring of Fire Regional Assessment context, this translates directly. The environmental and socioeconomic assessments being conducted across the Far North Ontario region involve the systematic collection of data about Matawa and NAN First Nations territories, resources, and communities. OCAP®-compliant data governance — described in Section 3 of this module — requires that those nations are not merely consulted about data collection methodologies, but that they own, control, and have physical possession of the data generated about them. The distinction between consultation and sovereignty is the distance between Layer 1 and Layer 4.

---

## 2. The CARE Principles: A Governance Framework, Not a Technical Standard

The dominant framework for data governance in research and open science has been FAIR: Findable, Accessible, Interoperable, Reusable. FAIR principles were developed to maximize the utility of research data — to make data discoverable, machine-readable, and available for reanalysis. They represent a genuine advance in scientific data management, and they have been widely adopted across research institutions, government data portals, and international science programs.

FAIR is researcher-centric. It optimizes for the needs of the person or institution that wants to use the data. It asks: can I find this data? Can I access it? Can I combine it with other datasets? Can I reuse it? These are legitimate questions for scientific data management. But they are the wrong starting questions for data about and belonging to Indigenous peoples.

The CARE Principles — Collective Benefit, Authority to Control, Responsibility, and Ethics — were developed specifically to address this gap. Articulated by the Research Data Alliance International Indigenous Data Sovereignty Interest Group and published in 2020 through Data Science Journal, CARE principles do not compete with FAIR. They operate at a different layer. FAIR governs technical interoperability; CARE governs the governance of that interoperability. Together, they form a complete framework: FAIR ensures data can be shared efficiently; CARE ensures it is shared on terms that Indigenous peoples actually agree to.

**Collective Benefit** establishes that Indigenous data ecosystems must be designed to benefit Indigenous peoples collectively, not merely to serve research or policy objectives of outside institutions. Collective Benefit operates at three levels. First, it requires that data governance structures be designed to include and prioritize Indigenous participation and benefit-sharing. Second, it demands that data be collected and used in ways that generate value for the communities it concerns — not extracting value from those communities for the benefit of outside actors. Third, it requires that Indigenous peoples and communities be recognized as active contributors to research and knowledge creation, not merely as subjects or data sources. In the Ring of Fire context, Collective Benefit would mean that environmental assessment data not only informs federal and provincial decision-making, but actively serves the land management, health monitoring, and economic planning needs of affected First Nations.

**Authority to Control** is the recognition that Indigenous peoples have rights and interests in their data, and that data governance frameworks must actively support — not merely tolerate — Indigenous authority over that data. Authority to Control encompasses the right to determine what data is collected, how it is collected, how it is stored, who can access it, and under what conditions it can be used or shared. Critically, Authority to Control extends across the data lifecycle: it does not end when data is published, archived, or deposited in a research repository. Indigenous data governance authority persists as long as the data exists. This principle has significant implications for legacy datasets — archives of environmental data, health surveys, ethnobotanical studies, and land use assessments collected under earlier, less rigorous consent frameworks — which may require retroactive governance negotiation.

**Responsibility** places the obligation on those who work with Indigenous data — researchers, government agencies, corporations, NGOs — to account for how they use it. Responsibility is not satisfied by a consent form. It requires ongoing, transparent communication about data use; active engagement with the governance bodies of the nations whose data is in use; and concrete mechanisms for correcting misuse or restoring Indigenous control when governance frameworks have been violated. In practice, Responsibility means that a research institution that holds Indigenous health data from a 1980s survey cannot simply archive that data indefinitely under institutional ownership. It must negotiate with the relevant nations about the appropriate disposition of that legacy data.

**Ethics** frames the entire CARE framework in terms of Indigenous rights and wellbeing rather than in terms of research utility or institutional compliance. Ethical data governance, under CARE principles, means that Indigenous peoples' rights and wellbeing are the primary consideration at every stage of the data lifecycle — from research design through collection, analysis, publication, archiving, and eventual disposition. Ethics under CARE is not a checklist. It is an orientation: Indigenous peoples are the ultimate authorities on what constitutes ethical treatment of their data, and external ethics frameworks (Institutional Review Boards, ethics committees, publisher policies) cannot substitute for Indigenous governance frameworks.

The relationship between CARE and FAIR is worth dwelling on, because it is often mischaracterized as adversarial. It is not. FAIR describes how data should be technically structured for maximum interoperability. CARE describes the governance conditions under which that interoperability may or may not be authorized. A properly CARE-governed dataset might be technically FAIR — well-described metadata, interoperable formats, clearly licensed — while simultaneously being restricted from general access because the governing nation has determined that unrestricted access would harm community interests. Another dataset might be CARE-governed, publicly shareable under a Creative Commons license, and fully FAIR-compliant because the nation determined that wide dissemination serves their collective interests. CARE does not make data less FAIR; it makes the decision about FAIR a decision that Indigenous peoples, not outside institutions, make.

---

## 3. OCAP® — First Nations Information Governance Centre

OCAP® is a registered standard of the First Nations Information Governance Centre (FNIGC), the pan-Canadian organization established by the Assembly of First Nations to support First Nations governance over information and data. The four principles — Ownership, Control, Access, Possession — are the primary framework for First Nations data sovereignty in Canada, and they represent one of the most developed, institutionally supported Indigenous data governance frameworks anywhere in the world.

**Ownership** establishes that a First Nation or community collectively owns the information and data concerning their community. Ownership is a collective right, not an individual one. The people, not a researcher or a government agency, own the data about them. FNIGC documentation is precise on this point: "Ownership refers to the relationship of a community or group to its cultural knowledge, data, and information. This principle asserts that a community or group owns information collectively in the same way that an individual owns their personal information." This has direct implications for the Ring of Fire Regional Assessment, where environmental data, traditional land use studies, and socioeconomic assessments are being collected about and sometimes by First Nations communities. Under OCAP® Ownership, that data belongs to the communities it concerns, regardless of which institution funded the data collection.

**Control** addresses the authority to make decisions about that data — how it is collected, what it contains, how it is used, who can access it, and when it can be disclosed. Control operates at the level of the First Nation as a collective governance body. Individual community members can share or restrict their own information, but collective governance decisions about community-wide data require collective governance processes. Control means that a federal agency conducting an environmental assessment cannot unilaterally determine how community health data will be used in that assessment; the First Nation government must give its consent, under its own governance processes, for each specific use. Control also means that terms of consent are binding and specific: consent to use data for one purpose does not constitute consent to use it for another.

**Access** addresses who may access First Nations data and under what conditions. OCAP® does not assert that all First Nations data is restricted or private — rather, it asserts that the terms of access are determined by the First Nation, not by external institutions. A First Nation may choose to make environmental monitoring data publicly available as part of its advocacy for territorial protection. That is an exercise of OCAP® Access — the nation determining the access policy. The same nation may simultaneously restrict access to traditional knowledge databases and genetic resource surveys. The key principle is that the nation, not the research institution, the funding agency, or the regulatory body, sets the access terms.

**Possession** addresses physical custody of data. OCAP® recognizes that meaningful control over data requires actual physical or functional possession. Data that exists only in servers operated by universities, government agencies, or corporations is data over which First Nations control is theoretical rather than real. Possession means that First Nations should have physical or functional custody of their data, whether through on-site data storage, mirrored copies held under First Nations control, or technical agreements that guarantee the First Nation's ability to access, modify, and delete data about them. In the modern era, Possession increasingly means questions about cloud sovereignty, server jurisdiction, and data residency. FNIGC has worked with technology partners to address these questions in the context of Canadian federal data infrastructure.

The application of OCAP® to Ring of Fire contexts is direct. The Ring of Fire Regional Assessment, conducted under the auspices of Crown-First Nations agreements between the Matawa First Nations Management and the Ontario government, involves systematic data collection about First Nations territories, resources, and communities. OCAP® applies to every phase of that assessment:

- Environmental monitoring sensors placed on traditional territory generate data that, under OCAP®, belongs to the relevant First Nation — not to the monitoring program that installed the sensors.
- Health impact assessments conducted with community members require OCAP®-compliant consent frameworks that are specific to each use, collectively governed, and revocable.
- Traditional land use studies submitted to regulatory bodies as part of impact assessment constitute First Nations data; their use, citation, and retention in government records databases requires ongoing community governance oversight.
- Geospatial data about mineral deposits, watercourses, and ecological systems collected through resource exploration programs on Treaty 9 and Treaty 5 territories is subject to OCAP® principles regarding who owns the maps.

The FNIGC's work on OCAP® implementation has produced practical tools: the First Nations Data Governance Strategy (2020), which outlines a ten-year roadmap for building national First Nations data infrastructure; the First Nations Regional Health Survey, which operates under OCAP® protocols as a model for community-controlled health data collection; and the National First Nations Information Governance Centre accreditation program, which supports community-level data governance capacity building.

For the Ring of Fire specifically, OCAP® provides the governance architecture through which First Nations can negotiate the terms of data collection in impact assessments, assert ownership of traditional land use knowledge, and build the internal capacity to collect, manage, and use their own environmental and socioeconomic data. (See Module B, `06-nation-governance-profiles.md`, for how individual Matawa and NAN First Nations are positioning on data governance.)

---

## 4. Māori Data Sovereignty — Aotearoa New Zealand

Māori data sovereignty represents one of the most advanced and institutionally embedded Indigenous data governance frameworks in the world. Its development is rooted in tino-rangatiratanga — Māori self-determination — as expressed through Te Tiriti o Waitangi (the Treaty of Waitangi), and it has moved from academic advocacy to government policy adoption over the past decade at a pace that makes Aotearoa a benchmark case for the Pacific Rim and beyond.

The foundational claim is straightforward: Māori have the right to govern data about their communities, their lands, their taonga (treasures, both tangible and intangible), and their relationships. This right is not derived from a data protection statute or a privacy framework — it is derived from tino-rangatiratanga itself, the expression of Māori sovereignty that Te Tiriti guaranteed but that colonial governance repeatedly failed to honor. Māori data sovereignty is thus not a new claim. It is the application of an existing and long-established sovereignty claim to a new domain.

Te Mana Raraunga, the Māori Data Sovereignty Network, was established in 2016 by Māori researchers, practitioners, and community advocates to develop and advance Māori data sovereignty principles and practice. Its foundational document, *A Declaration of Māori Data Sovereignty* (2016), articulates the core position: Māori data is a taonga subject to the protections of Te Tiriti; Māori have the right to govern the collection, ownership, and application of data about their peoples, territories, and resources; and the Crown and its agencies must recognize and give effect to this right in all data-related policies and practices.

The kaupapa Māori data governance framework — kaupapa meaning philosophy, principles, or foundation — operationalizes these claims through several interrelated concepts:

**Whanaungatanga** (relationship-building and collective responsibility) is identified in recent scholarship as a core requirement for Māori data governance. Research by Oliver, Lilley, Cranefield, and Lewellen (2024), examining New Zealand public sector data governance through a Māori data sovereignty lens, finds that trust-building between Māori communities and data-holding institutions is foundational to any governance arrangement. Whanaungatanga is not merely interpersonal rapport; it is the establishment of accountable relational obligations that govern how data is handled across institutional and community boundaries.

**Rangatiratanga** (sovereignty and self-determination) in the data context means that iwi (tribal groupings) and hapū (subtribal groupings) are the primary authorities over data concerning their communities and territories. Rangatiratanga is not satisfied by consultation or advisory roles; it requires actual decision-making authority. The Oliver et al. (2024) research identifies rangatiratanga as one of four core requirements alongside whanaungatanga, kotahitanga, and capacity building — and finds that public sector data governance in Aotearoa is still in early stages of operationalizing this principle, despite formal policy commitments.

**Kotahitanga** (collective benefit and unity) in the data governance context maps closely to the CARE principle of Collective Benefit. Data governance arrangements should benefit Māori collectively, not merely serve individual or institutional research interests. Kotahitanga emphasizes that Māori data sovereignty is not about restricting all access to Māori data — it is about ensuring that data use generates genuine, collectively determined benefit for Māori communities. This has practical implications for how data sharing agreements are structured: they must include benefit-sharing provisions that return tangible value to the iwi or hapū whose data is being used.

The New Zealand Crown's recognition of Māori data sovereignty has advanced significantly since 2016. The Government Chief Data Steward's Data for New Zealand report (2018) acknowledged Māori data sovereignty as a principle of national data governance. Stats NZ's Harnessing the Power of Data for New Zealand and its subsequent Te Mana Ōrite Mō te Mātauranga Māori program have begun operationalizing Māori data sovereignty in national statistical systems — though Māori data sovereignty advocates continue to note significant gaps between policy commitment and implementation.

The private sector has also engaged. Major technology companies operating in Aotearoa have begun developing Māori data sovereignty frameworks for their data handling practices. Cloud providers operating data centers in New Zealand have engaged with Māori governance bodies about data residency requirements — the question of whether Māori data must remain in Aotearoa rather than being routed through offshore servers, which would remove it from the jurisdiction where Te Tiriti protections apply.

The health sector provides the most developed set of case studies. The Māori Health Authority (abolished in 2024 but with significant legacy impact on policy architecture) established Māori data sovereignty principles for health data that recognized iwi and hapū as collective data governors for health information about their communities. The Hau Ora Māori research framework developed tools for FPIC in health data collection that require collective, not merely individual, consent for data that concerns community-level patterns.

For Pacific Rim governance analysis, the Māori data sovereignty trajectory offers several lessons. First, it demonstrates that Indigenous data sovereignty frameworks can advance from academic advocacy to government policy adoption within a decade when they are grounded in existing treaty rights rather than framed as new claims. Second, it shows that data sovereignty and national data strategy are not mutually exclusive — Aotearoa's investment in national data infrastructure and its recognition of Māori data sovereignty have developed in parallel, with each strengthening the other. Third, the emphasis on capacity building — the Oliver et al. (2024) finding that Māori data sovereignty requires substantial investment in community-level data governance capability, not just policy acknowledgment — offers a critical lesson for Ring of Fire nations where data governance capacity is still being built.

---

## 5. U.S. Indigenous Data Sovereignty Network (USIDSN)

The U.S. Indigenous Data Sovereignty Network (USIDSN) was established in 2016 by researchers at the University of Arizona, working in collaboration with tribal nations and Indigenous scholars, to advance Indigenous data governance principles in U.S. federal policy and research practice. It operates as the primary U.S. institutional voice for Indigenous data sovereignty, serving both as a research network and as an advocacy and policy engagement body.

The USIDSN's foundational position mirrors the international Indigenous data sovereignty consensus: tribal nations have the inherent right to govern data about their peoples, lands, and resources. This right is grounded in tribal sovereignty — the inherent authority of tribal nations recognized in the U.S. Constitution, in federal trust responsibilities, and in hundreds of treaties — and does not require statutory authorization to exist. Federal and state policies that allow data about tribal communities to be collected, held, and used without tribal consent are inconsistent with tribal sovereignty, regardless of whether those policies are formally legal under current statutory frameworks.

The policy engagement work of USIDSN has focused on several federal arenas. The 2020 National Congress of American Indians (NCAI) Data Sovereignty Act resolution formally called on Congress to enact tribal data sovereignty protections. USIDSN research has documented the ways in which federal data collection programs — the U.S. Census, federal health surveys, environmental monitoring databases, the USDA Farm Service Agency, the Bureau of Indian Affairs — collect data about tribal communities under frameworks that do not adequately recognize tribal data governance rights. The American Community Survey, for example, collects socioeconomic data about tribal communities that is then used by federal agencies for policy planning purposes, but tribal nations have limited ability to govern how that data is collected, what questions are asked, how results are reported, or what uses are made of the resulting data.

The USIDSN has also engaged substantively with federal research funding agencies. NIH, NSF, and USDA all have tribal consultation requirements, but USIDSN research demonstrates that consultation is not equivalent to data sovereignty. A research program that consults with a tribal government about study design but retains institutional ownership of the resulting data, deposits it in a federal repository, and allows unrestricted secondary use does not satisfy tribal data sovereignty principles, regardless of whether it consulted appropriately. USIDSN's engagement with NIH has contributed to the development of tribal data governance considerations in the NIH Tribal Consultation Policy and in the 2023 NIH Tribal Health Research and Data Sovereignty guidance.

The USIDSN's work connects to Ring of Fire research through its engagement with environmental data sovereignty. The collection of climate data, air quality monitoring data, water quality data, and ecological monitoring data on tribal lands is governed by the same sovereignty principles as health and census data. Tribal nations in the U.S. portion of the Pacific Rim — including Lummi Nation, Tulalip Tribes, Quinault Indian Nation, Makah Tribe, and numerous Alaska Native corporations and tribes — have territories subject to overlapping federal environmental monitoring programs operated by EPA, NOAA, USGS, and the Forest Service. The data generated by those monitoring programs concerns tribal territories and resources, and USIDSN principles assert that tribal nations should govern that data, not merely be consulted about it.

The USIDSN framework is also relevant to federal critical minerals policy. The critical minerals deposits in the Pacific Rim region — including the rare earth elements, chromium, cobalt, and nickel deposits that have drawn increasing attention since the 2021 Executive Order on America's Supply Chains — are located on or adjacent to tribal territories. The data generated by federal mineral surveys of those territories, including geophysical surveys, geochemical analyses, and resource assessments, constitutes tribal data under USIDSN principles and should be governed accordingly.

---

## 6. Center for Tribal Digital Sovereignty (CTDS)

The Center for Tribal Digital Sovereignty (CTDS) represents the current leading edge of institutional capacity for operationalizing data sovereignty principles at the tribal government level. Launched in 2024 through a partnership between the National Congress of American Indians (NCAI) and Arizona State University, CTDS is the first center in the United States dedicated specifically to supporting tribal governments in planning and implementing digital sovereignty frameworks.

The gap that CTDS was created to address is a critical one. Data sovereignty principles — OCAP®, CARE, USIDSN frameworks — are well-developed at the theoretical and policy advocacy level. What has been missing is operational capacity: the practical governance tools, technical infrastructure planning support, legal template frameworks, and workforce development programs that allow a tribal government to move from acknowledging data sovereignty as a principle to actually implementing it in the systems, contracts, and technical infrastructure through which data about their community flows.

CTDS operates on the premise that digital sovereignty — including data sovereignty, cybersecurity sovereignty, AI governance sovereignty, and broadband infrastructure sovereignty — requires tribal governments to develop internal technical and governance capacity, not simply to rely on federal programs or outside consultants. The Center provides:

- **Tribal digital sovereignty planning support:** Helping tribal governments assess their current data governance posture, identify data flows that do not align with sovereignty principles, and develop governance frameworks appropriate to their institutional capacity and community priorities.
- **Model governance frameworks:** Template data governance policies, data sharing agreement frameworks, and consent protocols that tribal governments can adapt to their specific legal, cultural, and technical contexts.
- **Workforce development:** Training tribal government staff in data governance, cybersecurity, digital infrastructure management, and AI governance — building the human capital base for sustainable tribal digital sovereignty.
- **Technical infrastructure guidance:** Supporting tribal governments in evaluating options for tribally-owned or tribally-controlled digital infrastructure, including on-reservation data storage, tribal broadband networks, and tribally-governed cloud environments.
- **Policy engagement:** Connecting tribal governments with federal policy processes — FCC broadband proceedings, federal data governance rulemaking, AI policy development — so that tribal sovereignty interests are represented in the rules that govern the digital infrastructure on which tribal communities increasingly depend.

The CTDS launch in 2024 was timely: it coincided with the proliferation of AI systems, the expansion of federal broadband investment under the Infrastructure Investment and Jobs Act, and growing tribal government awareness that digital infrastructure decisions made in 2024-2028 will shape the digital sovereignty landscape for decades. Tribal governments that build broadband networks under sovereignty frameworks — owning the infrastructure, governing the data flows, building local technical workforce — will be positioned very differently than those that accept commercial or federally-administered networks without negotiating data governance terms.

For Ring of Fire research, CTDS represents the kind of institutional infrastructure that Canadian First Nations governance bodies like FNIGC provide on the north side of the border. The parallel is not exact — FNIGC has a longer history and deeper First Nations political backing through the Assembly of First Nations — but the function is similar: building the institutional capacity and practical tools that allow Indigenous nations to move from data sovereignty as a principle to data sovereignty as an operational reality.

The Ring of Fire Regional Assessment context requires exactly this kind of institutional support. First Nations communities participating in impact assessments, negotiating impact benefit agreements, and managing ongoing relationships with provincial and federal environmental monitoring programs need practical data governance tools, not just policy frameworks. CTDS-style capacity building, adapted to the Canadian First Nations context through FNIGC and partner organizations, is the mechanism through which OCAP® principles move from the policy document to the data management system.

---

## 7. Indigenous-Owned Digital Infrastructure: Emerging Cases

The transition from data sovereignty as policy principle to data sovereignty as operational reality requires physical and technical infrastructure. This is where Layer 4 (data sovereignty) and Layer 5 (infrastructure) connect most concretely. Indigenous-owned and Indigenous-governed digital infrastructure is not a future aspiration; it exists today in forms ranging from First Nations-owned ISPs to tribally-operated broadband networks to emerging Indigenous data center concepts. The cases below represent the leading edge of this transition.

### KNET — Keewaytinook Okimakanak

Keewaytinook Okimakanak (KO) is the tribal council representing six remote First Nations in northwestern Ontario: Deer Lake, Fort Severn, Keewaywin, McDowell Lake, North Spirit Lake, and Poplar Hill. These communities are among the most geographically isolated in Canada — accessible only by air or seasonal ice roads — and sit directly in the heart of the Ring of Fire mineral belt. KNET (Keewaytinook Internet) is their community-owned telecommunications network, and it represents perhaps the most important model for Indigenous digital sovereignty in the Ring of Fire context.

KNET began in the late 1990s as a response to the complete absence of reliable telecommunications infrastructure in KO communities. Rather than waiting for commercial carriers or federal programs to serve these communities, KO built its own network — using microwave links, satellite connections, and fiber where accessible. By the mid-2000s, KNET was providing broadband connectivity to KO communities and had become one of Canada's earliest First Nations-owned ISPs. Its technical architecture was designed around community ownership from the beginning: the network infrastructure belongs to the First Nations, not to a commercial carrier.

Over the following two decades, KNET's scope expanded substantially. It moved beyond basic connectivity to develop KO-Knet Multimedia, a media production and training program that produces content by and for Indigenous communities. It developed remote health monitoring applications, distance education platforms, and emergency communications systems designed specifically for the needs of isolated northern communities. And in recent years, KNET has begun expanding into drone mapping, remote sensing, and AI-assisted land monitoring — tools that allow KO communities to collect and manage their own environmental data about their territories.

This last expansion is particularly significant for Ring of Fire analysis. The Ring of Fire mineral belt runs through or adjacent to KO territory. Mining exploration and development in the region will generate enormous quantities of environmental monitoring data — air quality, water quality, permafrost monitoring, caribou habitat assessment, fish population surveys. Under current frameworks, this data is typically collected by mining companies, their environmental consultants, and provincial monitoring programs, and is held in those institutions' systems with limited First Nations ownership or control.

KNET's trajectory points toward a different model: one where First Nations have the technical infrastructure to collect their own monitoring data, hold it in their own systems, and use it to support their own governance decisions — including decisions about whether and on what terms to consent to mining development. The drone mapping and remote sensing capabilities KNET is building are not primarily commercial ventures; they are data sovereignty tools. A First Nation that can independently map its own territory, monitor its own water quality, and track changes in its own ecosystem has a fundamentally different position in an environmental assessment process than one that must rely entirely on data produced by the proponent.

### Tribal Broadband: FCC Tribal Priority Windows and E-Rate

In the United States, the Federal Communications Commission has developed two significant mechanisms for supporting tribally-owned broadband infrastructure:

The **FCC Tribal Priority Window** program reserves spectrum in the Citizens Broadband Radio Service (CBRS) band and in other licensed bands for tribal use before commercial carriers can access it. Tribal nations that apply during the priority window can obtain priority access licenses that allow them to build tribally-owned wireless broadband networks on their territories. The program has limitations — the licenses are for specific spectrum bands, the technical capacity to build and operate a wireless network is substantial, and not all tribal nations have the resources to take advantage of the priority window — but it represents a meaningful federal policy recognition that spectrum on tribal lands should be available to tribal governments, not just commercial carriers.

The **E-Rate program** provides discounts on telecommunications services for eligible schools and libraries, including those on tribal lands. While E-Rate is primarily a discount program rather than a tribal ownership program, tribal nations that operate tribal schools and tribal libraries can use E-Rate funding to reduce the cost of connectivity infrastructure, freeing resources for other aspects of tribal digital sovereignty development.

The **Infrastructure Investment and Jobs Act (2021)** provided $65 billion in broadband funding, including specific provisions for tribal broadband development. The USDA's ReConnect program and the FCC's Emergency Connectivity Fund both include tribal priority provisions. NTIA's Tribal Broadband Connectivity Program has provided direct grants to tribal nations for broadband infrastructure construction. These programs collectively represent the largest federal investment in tribal broadband in U.S. history, and they are creating the infrastructure foundation on which tribal data sovereignty can be built — provided that tribal nations govern the networks they build rather than accepting commercial or federally-administered alternatives.

### Indigenous Data Centers: The Physical Sovereignty Frontier

The concept of Indigenous-owned data centers — physical computing infrastructure owned and operated by Indigenous nations — is the most recent and most frontier-level development in Indigenous digital sovereignty. It addresses a gap in the current sovereignty architecture: even a First Nation that builds its own broadband network and adopts OCAP®-compliant data governance policies will store most of its data in cloud infrastructure operated by Amazon Web Services, Microsoft Azure, or Google Cloud — servers physically located in data centers outside First Nations territory, subject to the jurisdiction of non-Indigenous governments, and owned by corporations with no inherent accountability to Indigenous governance.

The data residency question is not merely legal. It is about the physical expression of data sovereignty. Where data lives, who can physically access it, whose jurisdiction governs it — these are Layer 4 and Layer 5 questions simultaneously. A First Nation that stores its land use data, health data, and resource assessment data in Amazon data centers in Virginia or Oregon has theoretical governance rights over that data (through contracts, licensing agreements, and applicable law) but no physical sovereignty. The data lives in someone else's infrastructure, under someone else's jurisdiction, in someone else's power grid.

Indigenous data centers are beginning to emerge as a response to this gap. In Canada, several First Nations have invested in on-reserve server infrastructure for health and administrative data. FNIGC's research on OCAP® implementation has consistently identified physical possession of data as a prerequisite for meaningful data sovereignty. The First Nations Health Authority in British Columbia has developed data governance infrastructure that keeps First Nations health data within First Nations-controlled systems to the extent possible. These are not yet large-scale data center operations, but they represent the beginning of a trajectory.

The infrastructure requirements are substantial. A data center capable of serving regional First Nations data governance needs requires reliable power (a significant challenge for remote northern communities still partially dependent on diesel generation), reliable high-speed connectivity (which KNET and similar networks are building), and the technical workforce to operate and maintain the facility. All three of these infrastructure requirements are solvable with sufficient investment — and all three represent exactly the kind of economic development opportunity that well-structured Ring of Fire resource development could potentially support.

---

## 8. AI Governance and the Training-Data Frontier

The rapid advancement of artificial intelligence systems creates a new and urgent frontier for Indigenous data sovereignty. AI systems — particularly large language models, image recognition systems, ecological monitoring AI, and resource assessment AI — are trained on vast datasets, and they generate value through the patterns they extract from that training data. In the context of Indigenous data, this creates a new form of potential extraction: the incorporation of Indigenous knowledge, language, cultural expression, and ecological expertise into AI training datasets without Indigenous consent, compensation, or governance.

The question of who trains the model is inseparable from the question of who owns the training data. When an AI system is trained on ethnobotanical literature that contains traditional plant knowledge held by specific Indigenous nations, the AI model encodes that knowledge in a form that can be commercialized without attribution or benefit-sharing. When a language model is trained on Indigenous language texts collected without community consent, it can generate content in that language — including content that misrepresents, trivializes, or commodifies cultural concepts — without the community having any governance authority over how their language is used. When an ecological monitoring AI is trained on environmental data collected from Indigenous territories, the resulting system may be more accurate in predicting conditions on those territories, but the value of that accuracy accrues to the institution that owns the AI, not to the First Nations on whose territory the training data was collected.

The AI governance question has several distinct dimensions for Indigenous nations:

**Training data consent and governance:** Before an AI system can be trained on data that concerns or originates from Indigenous communities, the same FPIC and OCAP®/CARE frameworks that govern any data use should apply. This means that Indigenous nations should have explicit governance authority over whether, how, and on what terms their data can be used for AI training. This principle is straightforward in concept but technically complex in practice, because many AI training datasets aggregate data from thousands of sources, making it difficult to identify and govern Indigenous data within large training corpora.

**Model ownership and benefit-sharing:** When AI systems trained partly on Indigenous data are commercially deployed, what benefit-sharing obligations exist toward the nations whose data contributed to the model's capability? This question does not yet have clear answers in law, policy, or practice. The emerging international discussion around AI and Indigenous rights — including work by the UN Special Rapporteur on the Rights of Indigenous Peoples, by the OECD's AI Policy Observatory, and by Indigenous AI working groups at USIDSN and FNIGC — is beginning to develop frameworks, but the policy landscape is still forming.

**AI systems in resource and environmental governance:** In the Ring of Fire context, AI will increasingly be used in environmental monitoring, resource assessment, and impact prediction. Remote sensing AI can analyze satellite and drone imagery to detect changes in permafrost, wetland extent, caribou migration patterns, and mining-related disturbance. These systems can be powerful tools for First Nations environmental monitoring — or they can be tools through which mining companies and government agencies collect and analyze data about Indigenous territories in ways that First Nations cannot monitor or govern. The difference lies entirely in the data governance layer: whether First Nations own the data, govern the AI training process, and receive the outputs, or whether the AI operates as an extraction engine directed at Indigenous territories by outside actors.

**Indigenous AI development:** Several First Nations and tribal organizations are beginning to develop AI applications designed specifically for their own governance and cultural revitalization needs. Language revitalization AI — systems trained on community-held recordings and texts to support endangered language learning and documentation — is perhaps the most developed application, with programs in multiple Canadian First Nations, Māori communities, and Pacific Island nations. Ecological monitoring AI trained on traditional ecological knowledge combined with contemporary sensor data represents a frontier where Indigenous-owned data sovereignty can generate Indigenous-owned AI capability.

The USIDSN and FNIGC have both published preliminary positions on Indigenous AI governance. The common thread is that existing Indigenous data sovereignty frameworks — OCAP®, CARE, tino-rangatiratanga-based Māori frameworks — provide the governance foundation for AI governance as well. AI does not create a new sovereignty domain; it creates a new and technically complex application of existing sovereignty principles. First Nations that have built robust data governance capacity are better positioned to govern AI applications of their data than those that have not.

---

## 9. Connection to the GSD Ecosystem: DACP, Trust Architecture, and Cross-Sovereign Data Flows

The GSD ecosystem — particularly the Deterministic Agent Communication Protocol (DACP) and the planning-bridge MCP server pattern — offers a technical architecture that models several of the governance properties that Indigenous data sovereignty frameworks require. The parallel is structural, not incidental.

**DACP as a model for Indigenous-controlled data flows:** The core properties of DACP are explicit permissions, audit trails, and deterministic routing. In a DACP-governed system, every data flow has an explicit authorization: an agent can only receive data if the governance layer has explicitly granted that permission. Every data exchange is logged in an audit trail. Routing is deterministic: data does not flow through unexpected paths or accumulate in unintended caches. These properties map directly onto the OCAP® and CARE governance requirements for Indigenous data.

Under OCAP® Access, the terms of access to First Nations data must be explicit and governed by the First Nation. DACP's explicit permissions model operationalizes this: access to a data resource requires an explicit grant, not an assumption of openness. Under OCAP® Possession, First Nations should have physical or functional custody of their data. DACP's deterministic routing allows governance systems to ensure that data remains within First Nations-controlled infrastructure unless explicitly routed elsewhere. Under CARE Responsibility, those who use Indigenous data must account for how they use it. DACP's audit trail provides the technical substrate for that accountability.

**The planning-bridge MCP server pattern as a cross-sovereign data sharing template:** The MCP (Model Context Protocol) server pattern developed in the GSD ecosystem addresses a specific problem: how do autonomous agents in one context share relevant information with agents in another context, without exposing the full internal state of either system? This is precisely the problem that cross-sovereign data sharing presents for Indigenous nations. A First Nation may want to share specific environmental monitoring data with a provincial regulatory body for specific regulatory purposes, without exposing the broader dataset to general access, without surrendering governance over the data once shared, and with the ability to revoke the sharing arrangement if terms are violated.

A planning-bridge model for cross-sovereign Indigenous data sharing would implement: data sovereignty governance rules as the permission layer (what can be shared, with whom, under what conditions), OCAP®/CARE-compliant consent documentation as the authorization record, audit logging as the accountability mechanism, and technical revocability as the enforcement mechanism. The First Nation's data governance body would operate the sovereignty side of the bridge; the receiving institution would operate through a constrained interface that enforces the governance terms.

**The GSD trust model and OCAP® principles:** The GSD system's foundational trust philosophy — "earned, not given" — is structurally aligned with OCAP® and CARE principles in ways that go beyond technical architecture. Both reject the assumption that access to data or systems should be granted by default and restricted only when problems emerge. Both require that trust be established through demonstrated reliability, transparency, and accountability before access is granted. Both maintain ongoing accountability for those who have been granted access, not merely at the point of initial authorization. The parallelism suggests that the GSD trust architecture, developed for autonomous agent governance in a software context, could serve as a template for Indigenous data governance frameworks at the technical implementation layer.

The connection is not about repurposing Indigenous governance principles for software design — it runs in the other direction. Software architectures that operationalize trust, permission, audit, and revocability are doing so in domains where Indigenous governance frameworks have centuries of precedent. The value of noting the structural parallel is practical: it suggests that GSD system components developed for agent governance could be adapted, with appropriate Indigenous governance oversight and direction, to support tribally-operated data governance infrastructure. The DACP audit layer could serve as the technical backbone for OCAP® Possession. The MCP planning-bridge pattern could serve as the technical backbone for cross-sovereign environmental data sharing agreements.

This is not a proposal for technology transfer from a software project to Indigenous communities. It is an observation about architectural alignment. Any adaptation would require Indigenous governance bodies to determine whether and how outside technical patterns serve their sovereignty goals — which is itself an OCAP® and CARE principle: Indigenous peoples, not outside technologists, determine how technology serves their governance needs.

---

## 10. Cross-References

- **Module A — `05-territorial-rights-legal-frameworks.md`:** UNDRIP Articles 11, 12, 18, 19, 31, and 32 establish the international law foundation for Indigenous data sovereignty. Article 31 — the right to maintain, control, protect, and develop cultural heritage, traditional knowledge, and traditional cultural expressions — is particularly relevant to the data sovereignty and AI governance analysis in this module. FPIC under UNDRIP applies to data collection and use as well as to physical infrastructure projects.

- **Module B — `06-nation-governance-profiles.md`:** Nation-specific data governance positions for Matawa and NAN First Nations, including any existing data governance policies, OCAP®-compliant research agreements, and positions on environmental monitoring data in the Ring of Fire Regional Assessment. The KNET model described in Section 7 of this module is directly relevant to KO communities profiled in Module B.

- **Module C — `07-resource-sovereignty-critical-minerals.md`:** Resource data sovereignty in the Ring of Fire assessment context. The geophysical survey data, mineral resource assessments, and environmental monitoring data generated by Ring of Fire mineral exploration constitute First Nations data under OCAP® and CARE principles. Module C's analysis of resource rights frameworks intersects with this module's analysis of data rights at the point where resource assessment data is collected from, about, and within First Nations territories.

---

## 11. Sources

**CARE Principles:**
1. Carroll, S.R., Garba, I., Figueroa-Rodríguez, O.L., Holbrook, J., Lovett, R., Materechera, S., Parsons, M., Raseroka, K., Rodriguez-Lonebear, D., Rowe, R., Sara, R., Walker, J.D., Anderson, J., & Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19(1), 43. https://doi.org/10.5334/dsj-2020-043

2. Global Indigenous Data Alliance. (2019). *CARE Principles for Indigenous Data Governance*. https://www.gida-global.org/care

**OCAP® and FNIGC:**
3. First Nations Information Governance Centre. (2014). *Ownership, Control, Access and Possession (OCAP®): The Path to First Nations Information Governance*. Ottawa: The First Nations Information Governance Centre. ISBN: 978-0-9920244-4-4.

4. First Nations Information Governance Centre. (2020). *First Nations Data Governance Strategy*. Ottawa: FNIGC. https://fnigc.ca/wp-content/uploads/2020/09/FNIGC_Data_Governance_Strategy_EN_FINAL.pdf

5. First Nations Information Governance Centre. (2022). *National Report of the First Nations Regional Health Survey — Phase 3: Volume Two*. Ottawa: FNIGC.

**Māori Data Sovereignty:**
6. Oliver, P., Lilley, C., Cranefield, J., & Lewellen, C. (2024). "Māori Data Sovereignty in the New Zealand Public Sector: Trust, Rangatiratanga, and Capacity." *Information Systems Journal*, ahead of print. https://doi.org/10.1111/isj.12520

7. Te Mana Raraunga — Māori Data Sovereignty Network. (2016). *A Declaration of Māori Data Sovereignty*. https://www.temanararaunga.maori.nz/declarasyon

8. Tahu Kukutai & John Taylor (Eds.). (2016). *Indigenous Data Sovereignty: Toward an Agenda*. ANU Press. ISBN 9781760460501.

9. Stats NZ. (2021). *Te Mana Ōrite Mō te Mātauranga Māori: Data Sovereignty and the Public Service*. Wellington: Stats NZ. https://www.stats.govt.nz/corporate/data-leadership/maori-data-sovereignty

10. New Zealand Government Chief Data Steward. (2018). *Government Chief Data Steward Strategy 2018*. Wellington: Statistics New Zealand.

**U.S. Indigenous Data Sovereignty:**
11. Rainie, S.C., Kukutai, T., Walter, M., Figueroa-Rodríguez, O.L., Walker, J., & Axelsson, P. (2019). "Issues in Open Data: Indigenous Data Sovereignty." In *The State of Open Data: Histories and Horizons*, ed. T. Davies, S.B. Walker, M. Rubinstein, & F. Perini. Ottawa: African Minds and International Development Research Centre.

12. U.S. Indigenous Data Sovereignty Network. (2020). *USIDSN Policy Position: Tribal Data Sovereignty and Federal Data Governance*. University of Arizona. https://usindigenousdata.org/

13. National Congress of American Indians. (2020). *Resolution #SAC-20-011: Supporting Tribal Data Sovereignty*. NCAI Annual Convention.

14. National Institutes of Health. (2023). *Tribal Consultation Policy and Tribal Health Research Data Sovereignty Guidance*. Washington, DC: NIH. https://www.nih.gov/about-nih/who-we-are/nih-director/tribal-consultation-policy

**Center for Tribal Digital Sovereignty:**
15. National Congress of American Indians / Arizona State University. (2024). *Center for Tribal Digital Sovereignty: Launch and Charter*. Phoenix: NCAI/ASU. https://www.ncai.org/initiatives/digital-sovereignty

**KNET and Indigenous Digital Infrastructure:**
16. Beaton, B., & Campbell, R. (2014). "First Mile Challenges to Last Mile Rhetoric: Exploring the Discourse of International ICT Development and Its Applicability to Indigenous Communities in Northern Canada." *Journal of Community Informatics*, 10(2).

17. McMahon, R., LaHache, T., & Whiteduck, T. (2014). "Breaking through Structural Barriers: How a First Nations-Owned Telecommunications Network Is Building Technical and Organizational Community Capacity in Remote Communities." *Journal of Community Informatics*, 10(2).

18. Keewaytinook Okimakanak Research Institute. (2019). *KNET Annual Report: Two Decades of First Nations Digital Sovereignty*. Balmertown: KO Research Institute.

**Tribal Broadband — U.S.:**
19. Federal Communications Commission. (2020). *Connecting Tribal Nations: Report on the FCC Tribal Priority Window for CBRS Spectrum*. Washington, DC: FCC. DA 20-428.

20. National Telecommunications and Information Administration. (2022). *Tribal Broadband Connectivity Program: Program Overview and Guidance*. Washington, DC: NTIA. https://www.ntia.gov/tribal-broadband-connectivity-program

21. U.S. Department of Agriculture. (2021). *ReConnect Program: Tribal Eligibility and Priority Guidelines*. Washington, DC: USDA Rural Development.

**AI and Indigenous Data Sovereignty:**
22. Lewis, J.E., Abdilla, A., Arista, N., Brown, K., Cordes, S., Davison, E., Duarte, M., Gaertner, D., Gold, J., Gould, S., Inahara, M., Iseke-Barnes, J., Ishii, K., Johnson, R., Kahunanui, L.K., Lampinen, A., Lee, A., Nansen, B., Nguyen, D., ... & Yellow Old Woman-Brantford, P. (2020). *Indigenous Protocol and Artificial Intelligence Position Paper*. Honolulu: The Initiative for Indigenous Futures. ISBN 978-0-578-64377-1.

23. United Nations Special Rapporteur on the Rights of Indigenous Peoples. (2023). *Report: Artificial Intelligence, Digital Technologies, and the Rights of Indigenous Peoples*. UN General Assembly document A/78/426. New York: United Nations.

24. OECD. (2023). *OECD AI Policy Observatory: Recommendations on AI and Indigenous Peoples*. Paris: OECD. https://oecd.ai/en/

**International Frameworks:**
25. United Nations. (2007). *United Nations Declaration on the Rights of Indigenous Peoples*. UN General Assembly Resolution 61/295. Articles 11, 12, 18, 19, 31, 32. New York: United Nations.

26. Research Data Alliance International Indigenous Data Sovereignty Interest Group. (2019). *CARE Principles for Indigenous Data Governance*. The Global Indigenous Data Alliance. https://www.gida-global.org/care

27. Wilkinson, M.D., et al. (2016). "The FAIR Guiding Principles for Scientific Data Management and Stewardship." *Scientific Data*, 3, 160018. https://doi.org/10.1038/sdata.2016.18

**Ring of Fire Regional Context:**
28. Ontario Ministry of Northern Development. (2023). *Ring of Fire Regional Assessment: Terms of Reference and Data Governance Provisions*. Toronto: Government of Ontario.

29. Matawa First Nations Management. (2021). *Framework Agreement on Consultation and Accommodation Regarding the Ring of Fire*. Matawa First Nations.

30. NAN Tribal Council. (2022). *Nishnawbe Aski Nation Data Governance Framework: Principles and Implementation Guidance*. Thunder Bay: NAN.
