/**
 * Tiny template renderer for vision-doc.md.tmpl and meeting-record.md.tmpl.
 *
 * Plain string substitution — NO template engine dependency.
 * Supports:
 *   {var}                       — direct path lookup (dot notation, e.g. {decision.ai_draft.title})
 *   {if expr} block {end}       — conditional, expr is truthy if value not in {undefined, null, '', false, [], {}}
 *   {if !expr} block {end}      — negation
 *   {for each item in list}     — iteration; inside the block use {item} or {item.field}
 *     ...
 *   {end}
 *
 * Phase 825 / C10 (T3 + T5).
 */

export type TemplateContext = Record<string, unknown>;

/**
 * Look up a dotted path against a context object. Returns undefined for
 * missing intermediate values; never throws.
 */
export function lookup(ctx: TemplateContext, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur: unknown = ctx;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Truthy check that treats empty arrays/objects/strings as falsy
 * (matches the conditional-block intent in the PRD vision-doc template).
 */
function isTruthy(v: unknown): boolean {
  if (v == null) return false;
  if (v === false) return false;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object' && Object.keys(v as object).length === 0) return false;
  return Boolean(v);
}

/** Fill `{var}` placeholders in `text` against the provided context. */
function substitute(text: string, ctx: TemplateContext): string {
  return text.replace(/\{([^{}\n]+?)\}/g, (_match, expr) => {
    const trimmed = (expr as string).trim();
    // Skip control directives we should never interpret as a variable.
    if (
      trimmed.startsWith('if ') ||
      trimmed.startsWith('if !') ||
      trimmed.startsWith('for each ') ||
      trimmed === 'end'
    ) {
      return _match; // leave control directives alone for the block parser
    }
    const v = lookup(ctx, trimmed);
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    // Fallback: JSON-serialize unknown shapes (rare in templates).
    return JSON.stringify(v);
  });
}

/** Strip a leading newline on a block body (avoids extra blank lines). */
function trimBlockBody(body: string): string {
  return body.replace(/^\n/, '').replace(/\n$/, '');
}

/**
 * Find the matching `{end}` token for a block opened at position `openIdx`.
 * Returns the index AFTER the closing `{end}`, or -1 if unbalanced.
 *
 * Tokens recognized as block-openers: `{for each ...}`, `{if ...}`, `{if !...}`.
 */
function findMatchingEnd(text: string, openIdx: number): {
  bodyStart: number;
  bodyEnd: number;
  afterEnd: number;
} | null {
  // openIdx points at the `{` of the opening tag. Find the closing `}` of the tag.
  const tagClose = text.indexOf('}', openIdx);
  if (tagClose < 0) return null;
  const bodyStart = tagClose + 1;
  let depth = 1;
  let cursor = bodyStart;
  const blockOpenRe = /\{(for each \w+ in [\w.]+|if !?[\w.]+)\}/g;
  const endTok = '{end}';
  while (cursor < text.length) {
    const nextEnd = text.indexOf(endTok, cursor);
    if (nextEnd < 0) return null;
    blockOpenRe.lastIndex = cursor;
    let nextOpen = -1;
    const match = blockOpenRe.exec(text);
    if (match && match.index < nextEnd) {
      nextOpen = match.index;
    }
    if (nextOpen >= 0) {
      depth++;
      cursor = match!.index + match![0].length;
    } else {
      depth--;
      if (depth === 0) {
        return {
          bodyStart,
          bodyEnd: nextEnd,
          afterEnd: nextEnd + endTok.length,
        };
      }
      cursor = nextEnd + endTok.length;
    }
  }
  return null;
}

/** Process the next block (for-each or if) found in `text`; returns processed text + advanced. */
function processNextBlock(
  text: string,
  ctx: TemplateContext,
): string {
  // Find earliest for-each or if opener.
  const blockOpenRe = /\{(for each (\w+) in ([\w.]+)|if (!?)([\w.]+))\}/;
  const match = blockOpenRe.exec(text);
  if (!match) return text;

  const balanced = findMatchingEnd(text, match.index);
  if (!balanced) {
    // Unbalanced — leave the rest alone to avoid corrupting output.
    return text;
  }
  const before = text.slice(0, match.index);
  const body = text.slice(balanced.bodyStart, balanced.bodyEnd);
  const after = text.slice(balanced.afterEnd);

  let rendered: string;
  if (match[2] && match[3]) {
    // for-each: match[2] = varName, match[3] = listPath
    const varName = match[2];
    const listPath = match[3];
    const list = lookup(ctx, listPath);
    if (!Array.isArray(list) || list.length === 0) {
      rendered = '';
    } else {
      const trimmed = trimBlockBody(body);
      rendered = list
        .map((item) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
          ) {
            // Replace {varName} with the scalar directly within the body
            // BEFORE further block processing, then run inner blocks against
            // the parent ctx (with the scalar bound to varName as a string).
            const sub: TemplateContext = { ...ctx, [varName]: item };
            const after = trimmed.replace(
              new RegExp(`\\{${varName}\\}`, 'g'),
              String(item),
            );
            return renderInner(after, sub);
          }
          const sub: TemplateContext = { ...ctx, [varName]: item };
          return renderInner(trimmed, sub);
        })
        .join('\n');
    }
  } else {
    // if: match[4] = neg (! or empty), match[5] = path
    const neg = match[4];
    const path = match[5];
    const v = lookup(ctx, path);
    const truthy = isTruthy(v);
    const include = neg === '!' ? !truthy : truthy;
    if (!include) {
      rendered = '';
    } else {
      const trimmed = trimBlockBody(body);
      rendered = renderInner(trimmed, ctx);
    }
  }

  return processNextBlock(before + rendered + after, ctx);
}

/** Recursively render any nested blocks inside a block body. */
function renderInner(body: string, ctx: TemplateContext): string {
  const processed = processNextBlock(body, ctx);
  // Substitute leaf {var} placeholders.
  return substitute(processed, ctx);
}

/** Render the template with the given context. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  let out = processNextBlock(template, ctx);
  out = substitute(out, ctx);
  // Collapse runs of >2 blank lines to keep markdown clean.
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}
