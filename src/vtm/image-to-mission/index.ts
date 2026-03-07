/**
 * Image-to-Mission (ITM) module.
 *
 * Companion to VTM (Vision-to-Mission). Where VTM starts from abstract
 * vision documents, ITM starts from concrete visual input — photographs,
 * screenshots, reference images — and produces executable build
 * specifications through structured observation.
 *
 * Pipeline: Observe → Listen → Connect → Extract → Translate → Build → Document
 *
 * @module vtm/image-to-mission
 */
export * from './types.js';
export * from './observation-engine.js';
export * from './context-integrator.js';
