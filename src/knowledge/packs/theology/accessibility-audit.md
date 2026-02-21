# THEO-101: Accessibility Audit

Last Updated: 2026-02-20

## Overview

Religious studies is primarily text-based, discussion-focused, and conceptual—inherently accessible modalities. However, specific accessibility considerations arise from sacred texts (especially non-Latin scripts), multi-faith content presentation, and sensitive topics requiring accessible warnings.

## WCAG 2.1 AA Accessibility Status

| Feature | Status | Notes |
|---------|--------|-------|
| Screen Reader Compatible | ✓ Yes | Text-based content fully compatible |
| Large Text Available | ✓ Yes | All materials support magnification |
| High Contrast Available | ✓ Yes | Digital content uses WCAG AA ratios |
| Keyboard Navigable | ✓ Yes | All tools support keyboard access |
| Alt Text Provided | ✓ Yes | All religious art/architecture has descriptions |
| Captions Available | ✓ Partial | Video content captioned; transcripts available |

## Domain-Specific Accessibility Considerations

### 1. Sacred Text Excerpts & Non-Latin Scripts

**Current Status:** Needs improvement

**Challenge:** Sacred texts include Hebrew, Arabic, Devanagari, Chinese, and other non-Latin scripts. Screen readers may not handle these correctly; copy-paste preserves encoding issues.

**Remediation:**
- [ ] **Unicode compliance:** Verify all text files support UTF-8 encoding properly
- [ ] **Transliteration options:** Provide Latin transliteration alongside original script (e.g., "Qur'an" alongside العربية)
- [ ] **Audio recordings:** Offer audio of sacred texts in original languages (with English translation available)
- [ ] **Braille embossing:** For major texts, provide Braille versions of transliterated excerpts
- [ ] **Screen reader testing:** Verify NVDA, JAWS handle multilingual content correctly
- [ ] **Font support:** Ensure fonts support all required Unicode ranges

**Timeline:** 2026-Q2

### 2. Content Sensitivity Warnings

**Current Status:** Text-only warnings (visual presentation only)

**Challenge:** Warnings about sensitive content (violence, conflict, persecution) are sometimes presented visually. Blind/low-vision learners may miss warnings.

**Remediation:**
- [ ] **Audio warnings:** Include warning messages in **audio format at start of section**
- [ ] **Text emphasis:** Use **bold, caps, clear language** in addition to color
- [ ] **Machine-readable metadata:** Tag sensitive content in structured data (ARIA labels)
- [ ] **Accessible alerts:** Use accessible notification patterns (not just red boxes)

**Timeline:** 2026-Q1

### 3. Multi-Faith Artwork & Architecture

**Current Status:** Requires enhancement

**Challenge:** Religious art and architecture are central to understanding traditions but are visual. Many sacred sites appear in photos without descriptions.

**Remediation:**
- [ ] **Detailed descriptions:** For each artwork/shrine/temple, provide comprehensive text description
- [ ] **Audio descriptions:** Record 2-3 minute audio tour of major religious sites
- [ ] **3D models:** Create 3D scanned/modeled versions of sacred spaces (accessible via 3D browsers)
- [ ] **Tactile replicas:** For major works, create tactile 3D models suitable for touch exploration
- [ ] **Virtual tours:** Develop 360° accessible virtual visits to major religious sites

**Timeline:** 2026-Q2-Q3

### 4. Discussion & Dialogue Activities

**Current Status:** Excellent accessibility ✓

**Strength:**
- Text-based discussions fully accessible
- Video dialogues captioned
- Recorded seminars transcribed
- No visual requirements for participation

**Enhancement:**
- [ ] Support **audio recording** as alternative to text contributions
- [ ] Provide **discussion protocols** adapted for deaf/hard of hearing (ASL, CART)
- [ ] Offer **structured reflection prompts** for neurodivergent learners

### 5. Interfaith Dialogue Simulation

**Current Status:** Accessible with accommodations

**Accessibility:**
- Text-based scenario briefings
- Role assignments can be audio or text
- Dialogue can occur via written exchange, oral discussion, or hybrid
- No visual components required

**Enhancement:**
- [ ] Create **video versions with captions and audio descriptions**
- [ ] Develop **written dialogue option** alongside oral
- [ ] Provide **accessibility guides** for facilitators running dialogue activities

## Neurodiversity Considerations

### Anxiety-Friendly Features

- ✓ Content warnings provided
- ✓ Diverse perspectives presented respectfully
- [ ] Add: **Discussion norms** that prevent personal attacks
- [ ] Add: **Opt-out options** for particularly sensitive content
- [ ] Add: **Advance notice** of discussion topics

### ADHD Engagement

- ✓ Discussion-based (active engagement)
- ✓ Multiple modalities (text, audio, video)
- [ ] Add: **Shorter segments** with clear transitions
- [ ] Add: **Explicit learning objectives** for each activity
- [ ] Add: **Reflection checkpoints** between topics

### Autism Spectrum Considerations

- ✓ Systematic exploration of each tradition
- ✓ Clear frameworks (5 major religions, specific modules)
- [ ] Add: **Explicit discussion protocols** (turn-taking, topic transitions)
- [ ] Add: **Preference options** (group vs. individual activities)
- [ ] Add: **Clear expectations** for emotional responses

## Language Access

| Language | Status | Action |
|----------|--------|--------|
| English | ✓ Complete | Full content |
| Spanish (es) | In Progress | 0% — planned for 2026-Q3 |
| French (fr) | Planned | — |
| German (de) | Planned | — |
| Italian (it) | Planned | — |

**Note:** Religious translation is complex. Cultural consultants from each tradition should review translations for accuracy.

## Sensitive Content Accessibility

### Religious Conflict & Violence

- **Content:** History of religious conflict, persecution, genocide
- **Accessibility Need:** Warnings must be **audio** + text + visual
- **Current State:** Text warnings only
- **Remediation:** Audio alert at start of section; resource links for support

### Depictions of Sacred Figures & Practices

- **Content:** Images of deities, religious practices
- **Accessibility Need:** Detailed description + context
- **Current State:** Text descriptions
- **Remediation:** Expand to audio descriptions; cultural context

## Assistive Technology Compatibility

| Technology | Compatibility | Notes |
|------------|---------------|-------|
| NVDA | ✓ Yes | Tested; Unicode handling verified |
| JAWS | ✓ Yes | Tested; RTL script support needed |
| VoiceOver | ✓ Yes | Works well with Safari |
| ZoomText | ✓ Yes | All content magnifies cleanly |
| Dragon NaturallySpeaking | ✓ Yes | Voice control fully supported |
| CART (Live Captioning) | ✓ Yes | For discussion activities |
| ASL Interpretation | ✓ Yes | Can be arranged for sessions |

## Remediation Roadmap

### Immediate (2026-Q1)
- [ ] Audit Unicode support in all sacred text files
- [ ] Make sensitivity warnings audio + text
- [ ] Add transliterations alongside non-Latin scripts
- [ ] Create ARIA labels for sacred artwork

### Short-term (2026-Q2)
- [ ] Record audio tours of major religious sites
- [ ] Create detailed artwork descriptions (100-200 words each)
- [ ] Develop 3D models of major sacred spaces
- [ ] Partner with cultural organizations for accuracy review

### Medium-term (2026-Q3)
- [ ] Expand to 360° virtual tours with accessibility features
- [ ] Create tactile replicas of major sacred objects
- [ ] Conduct accessibility testing with users who are deaf/blind
- [ ] Develop neurodivergence-friendly discussion protocols

### Long-term (2026-Q4)
- [ ] Complete translations with cultural review
- [ ] Establish accessibility fellowship with religious studies departments
- [ ] Create universally designed alternatives for all visual elements
- [ ] Develop podcast series on religious traditions

## Testing & Validation

**Accessibility Testing:**
- [ ] Unicode/RTL script rendering (Hebrew, Arabic)
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Video caption accuracy
- [ ] Audio description clarity and length
- [ ] User testing with practitioners of each tradition

**Next Scheduled Audit:** 2026-05-20

## Cultural Consultation Commitment

**Critical:** This pack requires review by **practitioners of each tradition** represented. THEO-101 commits to:

- [ ] Annual review by **faith leaders** from each tradition
- [ ] Feedback loop for corrections and improvements
- [ ] Respect for **community preferences** on sensitive topics
- [ ] **Permission-based sharing** of sacred content
- [ ] **Compensation** for consultant expertise

## Responsible Party

**Maintenance:** Theology & Religion Studies Working Group
**Accessibility Lead:** (To be assigned)
**Cultural Consultation Coordinator:** (To be assigned)

## Resources

- [AAR Statement on Religion in Public Schools](https://www.aarweb.org/)
- [Interfaith Alliance Resources](https://www.interfaithalliance.org/)
- [WebAIM: Multilingual Web Accessibility](https://webaim.org/articles/multilingual/)
- [Unicode Standard](https://unicode.org/)
- [CAST Universal Design for Learning](https://www.cast.org/)

## Commitment to Respect

Religious studies accessibility is not just about technical compliance. It means ensuring that every learner—regardless of ability or faith background—can engage with religious traditions respectfully, comprehensively, and safely.
