/**
 * Raised when an expression is well-formed but its operands have the wrong
 * type — `FLOOR("green")`, or an ordering comparison between a string and a
 * number.
 *
 * Kept distinct from a syntax error so that lenient mode can report a content
 * mistake at `warn`, while a malformed expression — which should never reach
 * production — stays at `error`.
 */
export default class ConditionTypeError extends Error {}
