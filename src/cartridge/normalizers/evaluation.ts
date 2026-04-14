/**
 * Evaluation chipset normalizer.
 *
 * Legacy department chipsets encode pre-deploy gates as a nested structure:
 *
 *   evaluation:
 *     gates:
 *       pre_deploy:
 *         - check: "all_skills_have_descriptions"
 *           description: "..."
 *           action: "block"
 *
 * The unified EvaluationChipsetSchema (src/cartridge/types.ts) expects a
 * flat shape:
 *
 *   kind: evaluation
 *   pre_deploy:
 *     - all_skills_have_descriptions
 *     - ...
 *
 * This normalizer runs inside the loader *after* fragment resolution but
 * *before* Zod parse. It flattens `gates.pre_deploy[].check` into
 * `pre_deploy[]` as a list of gate names and stashes the full original gate
 * objects under `metadata.gateDetails` so nothing is lost on the round trip.
 * A `metadata.gateLegacy: true` marker records that the transform fired.
 *
 * No schema edit. Relies on the `.passthrough()` on EvaluationChipsetSchema
 * so the synthesized `metadata` field rides alongside.
 *
 * The normalizer is a no-op when:
 *   - The payload already has a top-level `pre_deploy` array of strings.
 *   - The payload has no `gates.pre_deploy` to flatten.
 *   - The payload is not recognizably an evaluation chipset entry.
 *
 * Errors (thrown with file hint + gate index):
 *   - `gates.pre_deploy[i]` missing a `check` field.
 *   - `gates.pre_deploy[i].check` not a non-empty string.
 */

export interface NormalizeOptions {
  /** Path of the file the payload came from, used in error messages. */
  sourceFile?: string;
}

interface GateDetail {
  check: string;
  description?: string;
  action?: string;
  [k: string]: unknown;
}

/**
 * Normalize an evaluation chipset payload.
 *
 * @param payload A chipset payload (already fragment-resolved, not yet parsed)
 *                whose `kind` is expected to be 'evaluation'.
 * @param options  File hint for error messages.
 * @returns The normalized payload. If no transform is needed, returns the
 *          input reference unchanged.
 */
export function normalizeEvaluationChipset(
  payload: Record<string, unknown>,
  options: NormalizeOptions = {},
): Record<string, unknown> {
  // Already flat? Nothing to do.
  if (Array.isArray(payload.pre_deploy)) {
    return payload;
  }

  const gates = payload.gates;
  if (
    gates === null ||
    gates === undefined ||
    typeof gates !== 'object' ||
    Array.isArray(gates)
  ) {
    return payload;
  }

  const preDeployRaw = (gates as Record<string, unknown>).pre_deploy;
  if (!Array.isArray(preDeployRaw)) {
    return payload;
  }

  const fileHint = options.sourceFile
    ? ` (file: ${options.sourceFile})`
    : '';
  const gateDetails: GateDetail[] = [];
  const preDeploy: string[] = [];

  for (let i = 0; i < preDeployRaw.length; i++) {
    const gate = preDeployRaw[i];
    if (gate === null || typeof gate !== 'object' || Array.isArray(gate)) {
      throw new Error(
        `normalizeEvaluationChipset: gates.pre_deploy[${i}] is not an object${fileHint}`,
      );
    }
    const gateObj = gate as Record<string, unknown>;
    const check = gateObj.check;
    if (typeof check !== 'string' || check.length === 0) {
      throw new Error(
        `normalizeEvaluationChipset: gates.pre_deploy[${i}] missing non-empty 'check' field${fileHint}`,
      );
    }
    preDeploy.push(check);
    gateDetails.push({ ...gateObj, check });
  }

  const existingMetadata =
    payload.metadata &&
    typeof payload.metadata === 'object' &&
    !Array.isArray(payload.metadata)
      ? (payload.metadata as Record<string, unknown>)
      : {};

  const normalized: Record<string, unknown> = {
    ...payload,
    pre_deploy: preDeploy,
    metadata: {
      ...existingMetadata,
      gateLegacy: true,
      gateDetails,
    },
  };

  return normalized;
}
