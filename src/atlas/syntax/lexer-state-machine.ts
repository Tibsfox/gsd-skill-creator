/**
 * Generic state-machine lexer engine.
 * @module atlas/syntax/lexer-state-machine
 *
 * Each state holds an ordered list of (regex, action) rules; first-match wins.
 * Rules can emit a token, push/pop states, or both. Pure data-driven — per-language
 * grammars supply only state tables, no control flow.
 *
 * Reference: Aho/Lam/Sethi/Ullman, Compilers: Principles, Techniques, and Tools
 * (the "dragon book"), 2e §3.6 "The Lexical-Analyzer Generator Lex"; Cooper &
 * Torczon, Engineering a Compiler 2e §2.4 "From Regular Expression to Scanner".
 */

import type { Token, TokenKind } from './tokenizer.js';

export type RuleAction =
  | { emit?: TokenKind; push?: string; pop?: boolean; popN?: number; replace?: string }
  | ((ctx: RuleContext) => void);

export interface RuleContext {
  match: RegExpExecArray;
  emit(kind: TokenKind, value?: string): void;
  push(state: string): void;
  pop(): void;
  source: string;
  pos: number;
  line: number;
  col: number;
}

export interface LexerRule {
  /** Regex must be anchored; engine tests at current position. */
  re: RegExp;
  action: RuleAction;
}

export interface LexerState {
  name: string;
  rules: LexerRule[];
}

export interface Grammar {
  name: string;
  initialState: string;
  states: Record<string, LexerState>;
  /** Optional post-pass: indent-stack handling for Python etc. */
  postProcess?: (tokens: Token[], source: string) => Token[];
  /** Optional keyword set; engine reclassifies 'identifier' → 'keyword' on match. */
  keywords?: Set<string>;
  /** Optional builtin/type sets; reclassified after keyword pass. */
  builtins?: Set<string>;
  types?: Set<string>;
}

/**
 * Anchored variants of the regex — we use sticky 'y' semantics by re-creating
 * each rule's regex with global flag and lastIndex bump. This keeps grammars
 * source-readable (authors write /^\s+/, engine handles position).
 */
function anchored(re: RegExp): RegExp {
  let src = re.source;
  if (!src.startsWith('^')) src = '^' + src;
  const flags = re.flags.includes('y') ? re.flags : re.flags;
  return new RegExp(src, flags.replace('y', ''));
}

/**
 * Run the state-machine lexer over `source` using `grammar`.
 * Always emits an 'eof' sentinel as the final token.
 */
export function runLexer(source: string, grammar: Grammar): Token[] {
  const tokens: Token[] = [];
  const stack: string[] = [grammar.initialState];
  let pos = 0;
  let line = 1;
  let col = 1;

  // Prebake anchored regexes for performance (each state, each rule).
  const compiled: Record<string, { re: RegExp; action: RuleAction }[]> = {};
  for (const [name, st] of Object.entries(grammar.states)) {
    compiled[name] = st.rules.map((r) => ({ re: anchored(r.re), action: r.action }));
  }

  const updateLineCol = (text: string): void => {
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10 /* \n */) {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
  };

  while (pos < source.length) {
    const stateName = stack[stack.length - 1];
    const rules = compiled[stateName];
    if (!rules) {
      // Unknown state — emit invalid char and recover.
      tokens.push({
        kind: 'invalid',
        value: source[pos]!,
        start: pos,
        end: pos + 1,
        line,
        col,
      });
      pos++;
      col++;
      continue;
    }

    const slice = source.slice(pos);
    let matched = false;
    for (const { re, action } of rules) {
      const m = re.exec(slice);
      if (!m || m.index !== 0) continue;
      const text = m[0];
      if (text.length === 0) {
        // Zero-length match — would loop forever; bail.
        break;
      }
      const startPos = pos;
      const startLine = line;
      const startCol = col;

      if (typeof action === 'function') {
        const ctx: RuleContext = {
          match: m,
          source,
          pos,
          line,
          col,
          emit(kind: TokenKind, value?: string) {
            tokens.push({
              kind,
              value: value ?? text,
              start: startPos,
              end: startPos + text.length,
              line: startLine,
              col: startCol,
            });
          },
          push(state: string) {
            stack.push(state);
          },
          pop() {
            if (stack.length > 1) stack.pop();
          },
        };
        action(ctx);
      } else {
        if (action.emit) {
          tokens.push({
            kind: action.emit,
            value: text,
            start: startPos,
            end: startPos + text.length,
            line: startLine,
            col: startCol,
          });
        }
        if (action.pop) {
          if (stack.length > 1) stack.pop();
        }
        if (typeof action.popN === 'number') {
          for (let i = 0; i < action.popN && stack.length > 1; i++) stack.pop();
        }
        if (action.replace) {
          if (stack.length > 0) stack[stack.length - 1] = action.replace;
        }
        if (action.push) {
          stack.push(action.push);
        }
      }

      updateLineCol(text);
      pos += text.length;
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({
        kind: 'invalid',
        value: source[pos]!,
        start: pos,
        end: pos + 1,
        line,
        col,
      });
      pos++;
      col++;
    }
  }

  // Reclassify identifiers using keyword/builtin/type sets.
  if (grammar.keywords || grammar.builtins || grammar.types) {
    for (const t of tokens) {
      if (t.kind !== 'identifier') continue;
      if (grammar.keywords?.has(t.value)) t.kind = 'keyword';
      else if (grammar.types?.has(t.value)) t.kind = 'type';
      else if (grammar.builtins?.has(t.value)) t.kind = 'builtin';
    }
  }

  let final = tokens;
  if (grammar.postProcess) final = grammar.postProcess(final, source);

  final.push({
    kind: 'eof',
    value: '',
    start: source.length,
    end: source.length,
    line,
    col,
  });
  return final;
}
