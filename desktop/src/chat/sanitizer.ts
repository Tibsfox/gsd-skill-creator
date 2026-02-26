/**
 * Input sanitizer -- HTML stripping and entity escaping for XSS prevention.
 *
 * sanitizeInput() strips all HTML tags and returns plain text.
 * escapeHtml() encodes HTML entities for safe attribute insertion.
 * Pure functions with no external dependencies.
 */

/**
 * Escape HTML special characters to their entity equivalents.
 * Use when inserting text into HTML attributes or innerHTML
 * (prefer textContent where possible).
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Strip all HTML tags from input and return plain text.
 * Returns empty string for null/undefined/non-string input.
 * Preserves text content between tags and whitespace (including newlines).
 */
export function sanitizeInput(input: unknown): string {
  if (input == null || typeof input !== "string") return "";
  // Strip all HTML tags using regex -- safe because we are removing, not parsing
  return input.replace(/<[^>]*>/g, "");
}
