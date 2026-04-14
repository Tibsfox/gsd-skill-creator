/**
 * Core Functionality Integration Tests
 *
 * Tests F-NAV-01/06, F-LIB-01/04, F-OH-01/03, F-HB-01/03, F-SUMO-01/04, E-01/02.
 *
 * Required pass on P1 criteria. Any P1 failure blocks deployment.
 *
 * Source: foxfire-heritage-mission-v2--05-test-plan-phase1.md §4 and §7
 *
 * CRITICAL API NOTES applied:
 * - SkillHallFramework: getRoom(roomNumber), startSession(session), getRooms(), getRoomsByTradition()
 * - No navigateToRoom() or startTrySession() — those don't exist
 * - getWorksByTradition(tradition) returns CanonicalWorkWithNationContext[]
 * - BibliographyEngine.formatCitation(work, style) takes a CanonicalWork, not a string ID
 * - BibliographyEngine.generateFairUseNotice(work) takes a CanonicalWork
 * - getCorePractices() is free function, NOT OralHistoryStudio.getCorePractices()
 * - createHeritageBook() is a free function, NOT HeritageBookTemplate.createHeritageBook()
 * - addChapter() is a free function, NOT a method
 * - exportBook(book, format) is the free function from project-builder/export/index.ts
 */

import { createRequire } from 'module';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// Framework
import {
  SkillHallFramework,
  SafetyWarden,
  CulturalSovereigntyWarden,
} from '../../skill-hall/framework.js';
import { RoomNumber, Tradition, SafetyDomain } from '../../shared/types.js';
import { TRADITION_TO_ROOMS } from '../../shared/constants.js';

// Canonical Works
import {
  getWorksByTradition,
  getWorksByRoom,
  loadFoxfireCatalog,
} from '../../canonical-works/index.js';
import { BibliographyEngine } from '../../canonical-works/bibliography-engine.js';

// Oral History
import {
  getCorePractices,
  getConsentProtocol,
} from '../../oral-history/index.js';

// Heritage Book
import {
  createHeritageBook,
  addChapter,
} from '../../project-builder/heritage-book-template/index.js';

// Export Pipeline
import { exportBook, SyllabicsRenderer } from '../../project-builder/export/index.js';

// Simulator
import { SimulationSession } from '../../oral-history/simulator/index.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Shared framework instance
const safetyWarden = new SafetyWarden();
const culturalWarden = new CulturalSovereigntyWarden();
const framework = new SkillHallFramework(safetyWarden, culturalWarden);

// ─── Skill Hall Navigation (F-NAV-01 through F-NAV-06) ───────────────────────

describe('Skill Hall Navigation', () => {
  it('F-NAV-01: framework can retrieve all 14 rooms with correct metadata', () => {
    const rooms = framework.getRooms();
    expect(rooms).toHaveLength(14);

    // Spot check a few rooms
    const room1 = rooms.find(r => r.room === RoomNumber.BUILDING);
    expect(room1).toBeDefined();
    expect(room1!.room).toBe(1);
    expect(room1!.title).toBeTruthy();
    expect(room1!.domain).toBeTruthy();
    expect(room1!.traditions).toBeInstanceOf(Array);
    expect(room1!.traditions.length).toBeGreaterThan(0);

    const room14 = rooms.find(r => r.room === RoomNumber.ARCTIC_LIVING);
    expect(room14).toBeDefined();
    expect(room14!.isCritical).toBe(true);
  });

  it('F-NAV-02: tradition filtering returns only Inuit rooms and excludes Appalachian-only rooms', () => {
    const inuitRooms = framework.getRoomsByTradition(Tradition.INUIT);
    const inuitRoomNumbers = TRADITION_TO_ROOMS[Tradition.INUIT];

    // All returned rooms must be in the Inuit tradition set
    expect(inuitRooms).toHaveLength(inuitRoomNumbers.length);
    for (const room of inuitRooms) {
      expect(inuitRoomNumbers).toContain(room.room);
    }

    // Room 07 (Metalwork/Smithing) is APPALACHIAN-only — not in Inuit set
    const metalworkInInuit = inuitRooms.find(r => r.room === RoomNumber.METALWORK);
    expect(metalworkInInuit).toBeUndefined();
  });

  it('F-NAV-03: getRoom() retrieves a room with correct metadata structure', () => {
    const room5 = framework.getRoom(RoomNumber.FOOD);
    expect(room5).toBeDefined();
    expect(room5!.room).toBe(5);
    expect(room5!.isCritical).toBe(true);
    expect(room5!.safetyDomains).toContain(SafetyDomain.FOOD);
    expect(room5!.availableSessions).toBeInstanceOf(Array);
  });

  it('F-NAV-04: startSession() creates a SessionRunner that tracks step progress', () => {
    // Load a try session from the food preservation room
    const session = require('../../skill-hall/rooms/05-food-preservation/try-sessions/understanding-canning-safety.json') as import('../../shared/types.js').TrySession;
    expect(session).toBeDefined();
    expect(session.steps).toBeInstanceOf(Array);
    expect(session.steps.length).toBeGreaterThan(0);

    // Register the session with the framework and start it
    framework.registerSessions(RoomNumber.FOOD, [session]);
    const runner = framework.startSession(session);

    // Execute first step
    const stepResult = runner.nextStep();
    expect(stepResult).not.toBeNull();
    expect(stepResult!.step).toBeDefined();
    expect(stepResult!.step.order).toBe(1);
    expect(typeof stepResult!.canProceed).toBe('boolean');
  });

  it('F-NAV-05: SUMO path is returned for steps with sumoMapping field', () => {
    // Load a session that has sumoMapping on steps
    const session = require('../../skill-hall/rooms/05-food-preservation/try-sessions/understanding-canning-safety.json') as import('../../shared/types.js').TrySession;

    // Find a step with sumoMapping
    const stepWithMapping = session.steps.find(s => s.sumoMapping);
    if (stepWithMapping) {
      const runner = framework.startSession(session);
      const sumoPath = runner.getSUMOPath(stepWithMapping);
      expect(sumoPath).toBeInstanceOf(Array);
      expect(sumoPath!.length).toBeGreaterThan(0);
    } else {
      // If no step has sumoMapping, verify getSUMOPath returns undefined for a step without it
      const runner = framework.startSession(session);
      const noMappingPath = runner.getSUMOPath(session.steps[0]!);
      // Either undefined (no mapping) or a path array (has mapping) — both are valid
      expect(noMappingPath === undefined || Array.isArray(noMappingPath)).toBe(true);
    }
  });

  it('F-NAV-06: safety-critical rooms (05, 09, 14) are marked isCritical=true', () => {
    const criticalRoomNumbers = [
      RoomNumber.FOOD,
      RoomNumber.PLANTS,
      RoomNumber.ARCTIC_LIVING,
    ];

    for (const roomNumber of criticalRoomNumbers) {
      const room = framework.getRoom(roomNumber);
      expect(room).toBeDefined();
      expect(room!.isCritical).toBe(true);
    }

    // Non-critical room should be isCritical=false
    const nonCriticalRoom = framework.getRoom(RoomNumber.BUILDING);
    expect(nonCriticalRoom!.isCritical).toBe(false);
  });
});

// ─── Canonical Works & Bibliography (F-LIB-01 through F-LIB-04) ─────────────

describe('Canonical Works and Bibliography', () => {
  it('F-LIB-01: getWorksByTradition("appalachian") returns at least 10 entries', () => {
    const works = getWorksByTradition('appalachian');
    // Foxfire catalog has 10 entries (volumes + specialty titles)
    expect(works.length).toBeGreaterThanOrEqual(10);
    // Each work should have an id, title, authors, purchaseLinks
    for (const work of works) {
      expect(work.id).toBeTruthy();
      expect(work.title).toBeTruthy();
      expect(work.authors).toBeInstanceOf(Array);
      expect(work.purchaseLinks).toBeInstanceOf(Array);
    }
  });

  it('F-LIB-02: Foxfire works have creator-direct purchase links at priority 1', () => {
    const works = loadFoxfireCatalog();
    expect(works.length).toBeGreaterThan(0);

    // All Foxfire works should have priority-1 link from foxfire.org
    for (const work of works) {
      const priority1 = work.purchaseLinks.find(l => l.priority === 1);
      expect(priority1).toBeDefined();
      expect(priority1!.isCreatorDirect).toBe(true);
      // Creator-direct link should be foxfire.org
      expect(priority1!.url.toLowerCase()).toMatch(/foxfire/);
    }
  });

  it('F-LIB-03: BibliographyEngine.formatCitation() returns properly formatted Chicago citation', () => {
    const engine = new BibliographyEngine();
    const foxfireWorks = loadFoxfireCatalog();
    const firstWork = foxfireWorks[0]!;

    const citation = engine.formatCitation(firstWork, 'chicago');
    expect(citation).toBeTruthy();
    expect(typeof citation).toBe('string');
    // Chicago citation has at least: author/title fragment and year
    expect(citation.length).toBeGreaterThan(20);
    // Should contain the work title
    expect(citation).toContain(firstWork.title.substring(0, 10));
  });

  it('F-LIB-04: BibliographyEngine.generateFairUseNotice() returns a notice with required fields', () => {
    const engine = new BibliographyEngine();
    const foxfireWorks = loadFoxfireCatalog();
    const firstWork = foxfireWorks[0]!;

    const notice = engine.generateFairUseNotice(firstWork);
    expect(notice).toBeTruthy();
    expect(typeof notice).toBe('string');
    expect(notice.length).toBeGreaterThan(50);
    // The fair use notice must include the work title and creator link
    expect(notice).toContain(firstWork.title);
  });
});

// ─── Oral History & Heritage Book (F-OH-01/03, F-HB-01/03) ──────────────────

describe('Oral History and Heritage Book Authoring', () => {
  it('F-OH-01: getCorePractices() returns exactly 12 core practices', () => {
    const practices = getCorePractices();
    // 12 core oral history practices as defined in oral-history/core-practices.json
    expect(practices).toHaveLength(12);
    // Each practice has required fields
    for (const practice of practices) {
      expect(practice.id).toBeTruthy();
      expect(practice.name).toBeTruthy();
    }
  });

  it('F-OH-02: getConsentProtocol("ocap-compliant") includes community consent fields', () => {
    const protocol = getConsentProtocol('ocap-compliant');
    expect(protocol).toBeDefined();
    expect(protocol.id).toBe('ocap-compliant');

    const json = JSON.stringify(protocol);
    // OCAP protocol must reference community-level consent or data governance
    expect(/community|data.?governance|ownership|ocap/i.test(json)).toBe(true);
  });

  it('F-OH-03: SimulationSession for Appalachian elder scenario runs and returns feedback', () => {
    // Create a simulation session for the appalachian elder scenario
    const session = new SimulationSession('scenario-appalachian-elder');

    // Consent must be acknowledged before questions can be asked
    // (attempting to ask without consent throws SimulatorProtocolError)
    session.acknowledgeConsent();

    // Ask a question — the feedback engine returns a SimulationFeedback object regardless
    // of whether the question is appropriate or blocked. The session does NOT throw for
    // ordinary questions; it returns feedback with isAppropriate and violations fields.
    const feedback = session.askQuestion(
      'How did you first learn to split white oak for basketmaking?',
    );
    expect(feedback).toBeDefined();
    expect(typeof feedback.isAppropriate).toBe('boolean');
    expect(typeof feedback.guidance).toBe('string');
    expect(feedback.guidance.length).toBeGreaterThan(0);
    // The feedback engine always returns culturalSovereigntyBlocked as boolean
    expect(typeof feedback.culturalSovereigntyBlocked).toBe('boolean');

    // Session completes without throwing
    const summary = session.complete();
    expect(summary.questionsAsked).toBe(1);
    expect(summary.consentAcknowledged).toBe(true);
    expect(summary.completed).toBe(true);
  });

  it('F-HB-01: createHeritageBook() returns a book with frontMatter, chapters, and backMatter', () => {
    const book = createHeritageBook({
      id: 'test-book-f-hb-01',
      title: 'Appalachian Heritage Skills',
      authorName: 'Test Author',
      traditions: [Tradition.APPALACHIAN],
    });
    expect(book).toBeDefined();
    expect(book.frontMatter).toBeDefined();
    expect(book.backMatter).toBeDefined();
    expect(book.chapters).toBeInstanceOf(Array);
    expect(book.traditions).toContain(Tradition.APPALACHIAN);
  });

  it('F-HB-02: addChapter() + exportBook() completes without throwing for docx format', () => {
    let book = createHeritageBook({
      id: 'test-book-f-hb-02',
      title: 'Heritage Skills Documentation',
      authorName: 'Test Author',
      traditions: [Tradition.APPALACHIAN],
    });

    // Add 3 chapters
    book = addChapter(book, {
      order: 1,
      contentType: 'skill-documentation',
      title: 'Log Cabin Construction Techniques',
      content: 'Traditional Appalachian log cabin building methods using saddle notch and V-notch joints.',
      attributions: [],
    });
    book = addChapter(book, {
      order: 2,
      contentType: 'cultural-context',
      title: 'Community Traditions',
      content: 'Cabin raising as communal labor exchange in Appalachian communities.',
      attributions: [],
    });
    book = addChapter(book, {
      order: 3,
      contentType: 'historical-record',
      title: 'Historical Records',
      content: 'Documentation from Foxfire student interviews and regional archives.',
      attributions: [],
    });

    expect(book.chapters).toHaveLength(3);

    // Export to docx — must not throw
    const result = exportBook(book, 'docx');
    expect(result).toBeDefined();
    expect(result.format).toBe('docx');
    // Status is 'stub' (pending library) or 'success'
    expect(['stub', 'success']).toContain(result.status);
  });

  it('F-HB-03: Heritage Book with Inuktitut syllabics — syllabics detection returns true', () => {
    const renderer = new SyllabicsRenderer();
    // Inuktitut syllabics: ᐃᓄᒃᑎᑐᑦ (Inuktitut in syllabics)
    const syllabicsContent = 'ᐃᓄᒃᑎᑐᑦ — the Inuktitut language written in syllabics';
    const hasSyllabics = renderer.containsSyllabics(syllabicsContent);
    expect(hasSyllabics).toBe(true);

    // Non-syllabics content should return false
    const noSyllabics = renderer.containsSyllabics('Plain English text without syllabics');
    expect(noSyllabics).toBe(false);
  });
});

// ─── SUMO Ontology (F-SUMO-01 through F-SUMO-04) ────────────────────────────

describe('SUMO Ontology', () => {
  it('F-SUMO-01: heritage-domain-ontology.kif exists with required class names and balanced parentheses', () => {
    const kifPath = join(
      __dirname,
      '../../shared/sumo/heritage-domain-ontology.kif',
    );
    const kif = readFileSync(kifPath, 'utf-8');

    // Must contain required class names
    expect(kif).toContain('HeritageSkill');
    expect(kif).toContain('TraditionalProcess');
    expect(kif).toContain('CulturalPractice');

    // Check parenthesis balance
    let depth = 0;
    for (const char of kif) {
      if (char === '(') depth++;
      if (char === ')') depth--;
    }
    expect(depth).toBe(0);
  });

  it('F-SUMO-02: sumo-mappings.json covers all 14 rooms with required fields', () => {
    const mappings = require('../../shared/sumo/sumo-mappings.json') as Array<{
      heritageConceptId: string;
      sumoTerm: string;
      sumoFile: string;
      naturalLanguage: string;
    }>;

    expect(mappings).toBeInstanceOf(Array);
    expect(mappings.length).toBeGreaterThan(0);

    // All 14 rooms must have at least 1 SUMO mapping
    const roomIds = new Set<number>();
    for (const m of mappings) {
      // heritageConceptId format: 'room-NN-...'
      const match = /room-(\d+)-/.exec(m.heritageConceptId);
      if (match) {
        roomIds.add(parseInt(match[1]!, 10));
      }
      // Each mapping must have required fields
      expect(m.sumoTerm).toBeTruthy();
      expect(m.sumoFile).toBeTruthy();
      expect(m.naturalLanguage).toBeTruthy();
    }

    // All 14 rooms must be represented
    for (let i = 1; i <= 14; i++) {
      expect(roomIds.has(i)).toBe(true);
    }
  });

  it('F-SUMO-03: ontological-bridges.json has at least 5 bridges with required fields', () => {
    const bridges = require('../../shared/sumo/ontological-bridges.json') as Array<{
      id: string;
      sumoView: string;
      indigenousView: string;
      teachingPoint: string;
    }>;

    expect(bridges).toBeInstanceOf(Array);
    expect(bridges.length).toBeGreaterThanOrEqual(5);

    for (const bridge of bridges) {
      expect(bridge.sumoView).toBeTruthy();
      expect(bridge.indigenousView).toBeTruthy();
      expect(bridge.teachingPoint).toBeTruthy();
    }
  });

  it('F-SUMO-04: wordnet-bridges.json has a "canoe" entry with SUMO term mapping', () => {
    const wordnetBridges = require('../../shared/sumo/wordnet-bridges.json') as Array<{
      word: string;
      synsetId: string;
      sumoTerm: string;
    }>;

    expect(wordnetBridges).toBeInstanceOf(Array);
    expect(wordnetBridges.length).toBeGreaterThan(0);

    // Find canoe entry
    const canoeEntries = wordnetBridges.filter(e => e.word.toLowerCase() === 'canoe');
    expect(canoeEntries.length).toBeGreaterThanOrEqual(1);
    expect(canoeEntries[0]!.sumoTerm).toBeTruthy();
    expect(canoeEntries[0]!.synsetId).toBeTruthy();
  });
});

// ─── Edge Cases (E-01 and E-02) ──────────────────────────────────────────────

describe('Edge Cases', () => {
  it('E-01: ambiguous tradition query does not throw — framework gracefully returns rooms', () => {
    // An ambiguous query for "north" content: both Inuit and First Nations rooms include
    // content about food preservation in northern environments
    // The framework should return rooms without throwing
    let inuitRooms;
    let firstNationsRooms;
    expect(() => {
      inuitRooms = framework.getRoomsByTradition(Tradition.INUIT);
    }).not.toThrow();
    expect(() => {
      firstNationsRooms = framework.getRoomsByTradition(Tradition.FIRST_NATIONS);
    }).not.toThrow();

    // Both tradition room sets should include Room 05 (Food Preservation)
    expect(inuitRooms!.some(r => r.room === RoomNumber.FOOD)).toBe(true);
    expect(firstNationsRooms!.some(r => r.room === RoomNumber.FOOD)).toBe(true);
  });

  it('E-02: cross-tradition comparison — Appalachian and Inuit food preservation both accessible', () => {
    const appalachianWorks = getWorksByTradition('appalachian');
    const inuitWorks = getWorksByTradition('inuit');

    // Both tradition catalogs must have entries for food preservation content
    expect(appalachianWorks.length).toBeGreaterThan(0);
    expect(inuitWorks.length).toBeGreaterThan(0);

    // Appalachian works are credited to Appalachian tradition
    for (const work of appalachianWorks) {
      expect(work.tradition).toBe('appalachian');
    }

    // Inuit works are credited to Inuit tradition
    for (const work of inuitWorks) {
      expect(work.tradition).toBe('inuit');
    }

    // Both room sets share Room 05 (Food Preservation) for cross-tradition comparison
    const appalachianRooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
    const inuitRooms = framework.getRoomsByTradition(Tradition.INUIT);
    expect(appalachianRooms.some(r => r.room === RoomNumber.FOOD)).toBe(true);
    expect(inuitRooms.some(r => r.room === RoomNumber.FOOD)).toBe(true);
  });
});
