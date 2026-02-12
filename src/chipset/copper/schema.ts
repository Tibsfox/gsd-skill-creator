import { z } from 'zod';

// Stub schemas -- will be implemented in GREEN phase
export const WaitInstructionSchema = z.object({ type: z.literal('wait') });
export const MoveInstructionSchema = z.object({ type: z.literal('move') });
export const SkipInstructionSchema = z.object({ type: z.literal('skip') });
export const CopperInstructionSchema = z.union([WaitInstructionSchema, MoveInstructionSchema, SkipInstructionSchema]);
export const CopperMetadataSchema = z.object({});
export const CopperListSchema = z.object({});
