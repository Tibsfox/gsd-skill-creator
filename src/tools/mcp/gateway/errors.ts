/**
 * Gateway error handling -- structured JSON-RPC error responses.
 *
 * Provides standard JSON-RPC 2.0 error codes and a GatewayError class
 * for consistent error formatting across the gateway server.
 */

// ── JSON-RPC 2.0 Standard Error Codes ──────────────────────────────────────

/** Parse error: invalid JSON was received. */
export const PARSE_ERROR = -32700;

/** Invalid Request: JSON is not a valid JSON-RPC request. */
export const INVALID_REQUEST = -32600;

/** Method not found: the method does not exist. */
export const METHOD_NOT_FOUND = -32601;

/** Invalid params: invalid method parameter(s). */
export const INVALID_PARAMS = -32602;

/** Internal error: internal JSON-RPC error. */
export const INTERNAL_ERROR = -32603;

// ── Application-Specific Error Codes ───────────────────────────────────────

/** Permission denied: insufficient scope for the requested operation. */
export const PERMISSION_DENIED = -32000;

/** Rate limited: too many requests. */
export const RATE_LIMITED = -32001;

// ── GatewayError Class ─────────────────────────────────────────────────────

/**
 * Structured error for gateway JSON-RPC responses.
 */
export class GatewayError extends Error {
  /** JSON-RPC error code. */
  readonly code: number;
  /** Optional additional error data. */
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.data = data;
  }
}

// ── Error Formatting ───────────────────────────────────────────────────────

/**
 * Format a JSON-RPC 2.0 error response object.
 *
 * @param id - The request ID (null for notifications or parse errors)
 * @param code - The JSON-RPC error code
 * @param message - Human-readable error description
 * @param data - Optional additional error data
 */
export function formatJsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): { jsonrpc: '2.0'; error: { code: number; message: string; data?: unknown }; id: string | number | null } {
  const error: { code: number; message: string; data?: unknown } = { code, message };
  if (data !== undefined) {
    error.data = data;
  }
  return {
    jsonrpc: '2.0',
    error,
    id,
  };
}

/**
 * Convert an unknown error into a structured JSON-RPC error response.
 * GatewayError instances preserve their code; other errors become internal errors.
 *
 * @param id - The request ID
 * @param err - The error to convert
 */
export function toJsonRpcError(
  id: string | number | null,
  err: unknown,
): { jsonrpc: '2.0'; error: { code: number; message: string; data?: unknown }; id: string | number | null } {
  if (err instanceof GatewayError) {
    return formatJsonRpcError(id, err.code, err.message, err.data);
  }

  if (err instanceof Error) {
    return formatJsonRpcError(id, INTERNAL_ERROR, err.message);
  }

  return formatJsonRpcError(id, INTERNAL_ERROR, 'Unknown internal error');
}
