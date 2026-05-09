/-
  ScribeRoundTrip.ToyAst
  ======================

  The toy-subset AST inductive type for the SCRIBE round-trip.

  Mirrors the TypeScript `AstNode` shape at:
    examples/cartridges/code-svg-hdl-bridge/ast-to-svg/render.ts

  Toy subset (per T3 doc 04 §4.2 + Doc 06 §3.1):
    - FunctionDeclaration  — name, parameters, single-return body
    - Parameter            — identifier-only (no destructuring, no defaults)
    - ReturnStatement      — wraps a single expression
    - BinaryExpression     — operator + lhs + rhs
    - ConditionalExpression — cond ? t : f  (used for mux)
    - Identifier           — variable reference
    - NumericLiteral       — natural-number literal
    - BooleanLiteral       — true | false

  Excluded from the toy subset (and from this Lean model):
    loops, function calls, state, destructuring, async/await, generics.

  Round-trip invariants enforced:
    I-AST-1: Every AST node has exactly one `<scribe:node>` (count match).
    I-AST-2: Node `sub_type` matches the source language's syntactic taxonomy.
    I-AST-3: Each leaf carries a `span` (byte offset range).
    I-AST-4: Every non-root node has exactly one incoming `child` edge.
    I-AST-5: Sibling order is preserved (`payload='{"order":N}'`).
    I-AST-6: Identifier/literal `label` carries the textual value.

  See `Section21.lean` for the round-trip identity theorem and the
  formal invariant statements.
-/

import ScribeRoundTrip.Basic

namespace ScribeRoundTrip

/-- Binary operators in the toy subset. We model the closed set explicitly
    so that the Verilog emitter (Section22) can do exhaustive case analysis. -/
inductive BinOp where
  | add
  | sub
  | mul
  | bitAnd
  | bitOr
  | bitXor
  | eq
  | lt
  deriving DecidableEq, Repr

/-- The toy AST. Each node carries an optional `span` (the byte-offset range
    in the original source) and an optional `id` (the SVG-graph-local
    identifier; assigned post-order by the renderer in `collectNodesAndEdges`).

    For round-trip obligations we treat span/id as metadata that round-trips
    losslessly when the parser sees the SCRIBE metadata block; see I-AST-3
    and the renderer's `collectNodesAndEdges` for the assignment discipline. -/
inductive Ast where
  /-- `function NAME(p1, p2, ...) { return BODY }` -/
  | funDecl    (name : String) (params : List String) (body : Ast) (span : Span)
  /-- A parameter declaration site (its label is the identifier). -/
  | param      (name : String) (span : Span)
  /-- `return EXPR` -/
  | retStmt    (expr : Ast) (span : Span)
  /-- `LHS OP RHS` -/
  | binExpr    (op : BinOp) (lhs : Ast) (rhs : Ast) (span : Span)
  /-- `COND ? T : F` -/
  | condExpr   (cond : Ast) (t : Ast) (f : Ast) (span : Span)
  /-- An identifier reference (variable use). -/
  | ident      (name : String) (span : Span)
  /-- A natural-number literal. -/
  | numLit     (n : Nat) (span : Span)
  /-- A boolean literal. -/
  | boolLit    (b : Bool) (span : Span)
  deriving Repr

/-- Convert a binary operator to its source-language label.
    Mirrors the `n.label` carried on `BinaryExpression` AST nodes. -/
def BinOp.toLabel : BinOp → String
  | .add    => "+"
  | .sub    => "-"
  | .mul    => "*"
  | .bitAnd => "&"
  | .bitOr  => "|"
  | .bitXor => "^"
  | .eq     => "==="
  | .lt     => "<"

/-- The inverse: parse a label back to a binary operator.
    Returns `none` if the label is unknown. The round-trip identity
    requires `BinOp.fromLabel ∘ BinOp.toLabel = some` — see Section21. -/
def BinOp.fromLabel : String → Option BinOp
  | "+"    => some .add
  | "-"    => some .sub
  | "*"    => some .mul
  | "&"    => some .bitAnd
  | "|"    => some .bitOr
  | "^"    => some .bitXor
  | "===" => some .eq
  | "<"    => some .lt
  | _      => none

/-- The `sub_type` discriminator string carried on every `<scribe:node>`.
    Mirrors the TypeScript switch in `astToSource()`. -/
def Ast.subType : Ast → String
  | .funDecl ..   => "FunctionDeclaration"
  | .param ..     => "Parameter"
  | .retStmt ..   => "ReturnStatement"
  | .binExpr ..   => "BinaryExpression"
  | .condExpr ..  => "ConditionalExpression"
  | .ident ..     => "Identifier"
  | .numLit ..    => "NumericLiteral"
  | .boolLit ..   => "BooleanLiteral"

/-- Total node count in an AST (used to state I-AST-1 — node-count
    preservation across round-trip). -/
def Ast.nodeCount : Ast → Nat
  | .funDecl _ ps body _ =>
      1 + ps.length + body.nodeCount
  | .param ..    => 1
  | .retStmt e _ => 1 + e.nodeCount
  | .binExpr _ l r _ => 1 + l.nodeCount + r.nodeCount
  | .condExpr c t f _ => 1 + c.nodeCount + t.nodeCount + f.nodeCount
  | .ident ..    => 1
  | .numLit ..   => 1
  | .boolLit ..  => 1

end ScribeRoundTrip
