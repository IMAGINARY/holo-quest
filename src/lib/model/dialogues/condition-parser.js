import { ExpressionParser } from 'expressionparser';
import DialogueSchema from '../../../../specs/dialogue.schema.json';
import { logger } from '../../helpers/logger';
import ConditionTypeError from './condition-type-error';

/**
 * Strict in development and under tests, lenient in a production build.
 *
 * The direction is deliberate: if the config is ever left unthreaded, a
 * production build falls back to lenient and the kiosk keeps running, whereas
 * defaulting to strict would fail toward a dead exhibit.
 */
const DEFAULT_STRICT = import.meta.env?.DEV ?? true;

const describeValue = (value) => `${typeof value} ${JSON.stringify(value)}`;

/** @param {*} value @param {string} op @returns {number} @throws {ConditionTypeError} */
const num = (value, op) => {
  if (typeof value !== 'number') {
    throw new ConditionTypeError(`${op}: expected number, found ${describeValue(value)}`);
  }

  return value;
};

/** @param {*} value @param {string} op @returns {string} @throws {ConditionTypeError} */
const str = (value, op) => {
  if (typeof value !== 'string') {
    throw new ConditionTypeError(`${op}: expected string, found ${describeValue(value)}`);
  }

  return value;
};

/** Truthiness: a non-empty string is true, `''` is false, numbers use `!== 0`. */
const truthy = (value) => (typeof value === 'string' ? value !== '' : !!value);

/** Normalizes a JS boolean to the 1/0 the expression language uses. */
const bool = (value) => (value ? 1 : 0);

/**
 * Type-aware equality. Values of different types are never equal.
 *
 * This deliberately never throws: an unset flag reads as the number 0, so
 * `ending = "good"` before `ending` is assigned has to be legitimately false
 * rather than an error.
 */
const equals = (a, b) => typeof a === typeof b && a === b;

/**
 * Builds a type-aware ordering operator. Numbers compare numerically, strings
 * lexicographically (by UTF-16 code unit); mixed operands are a content error.
 *
 * Note that an unset flag reads as the number 0, so ordering comparisons only
 * work once the flag has actually been assigned.
 *
 * @param {string} op - Operator name, for the error message.
 * @param {function(number): boolean} accept - Tests the sign of the comparison.
 * @returns {function(*, *): number}
 */
const compare = (op, accept) => (a, b) => {
  const comparable = (typeof a === 'number' && typeof b === 'number')
    || (typeof a === 'string' && typeof b === 'string');
  if (!comparable) {
    throw new ConditionTypeError(`${op}: cannot compare ${describeValue(a)} with ${describeValue(b)}`);
  }

  let sign = 0;
  if (a < b) sign = -1;
  else if (a > b) sign = 1;
  return bool(accept(sign));
};

/**
 * Whether a flag counts toward `COUNT`: a positive number, or a non-empty
 * string.
 *
 * Numbers keep the historical `> 0` rule rather than using `truthy`, so that
 * negative counters stay uncounted exactly as they always have.
 */
const isCounted = (value) => (typeof value === 'string' ? value !== '' : value > 0);

/**
 * Evaluates boolean/arithmetic expressions used in dialogue conditions.
 *
 * Supports infix operators (`<`, `>`, `>=`, `<=`, `=`, `!=`, `&`, `|`),
 * prefix operators (`^` for NOT, `COUNT` for flag-prefix counting, and the
 * math functions), number and string literals, and flag lookups.
 *
 * Flags hold numbers or strings. Equality is type-aware, ordering compares
 * strings lexicographically, and a non-empty string is truthy.
 */
export default class ConditionParser {
  /**
   * @param {DialogueIteratorContext} context - Provides flag values for term
   *   evaluation, and optionally a `strict` flag.
   * @param {Object} [options]
   * @param {boolean} [options.strict] - Overrides `context.strict`. When true,
   *   an expression that cannot be evaluated throws; when false it is logged
   *   and treated as false.
   */
  constructor(context, options = {}) {
    this.context = context;
    this.strict = options.strict ?? context?.strict ?? DEFAULT_STRICT;

    this.language = {
      INFIX_OPS: {
        '<': (a, b) => compare('<', (sign) => sign < 0)(a(), b()),
        '>': (a, b) => compare('>', (sign) => sign > 0)(a(), b()),
        '>=': (a, b) => compare('>=', (sign) => sign >= 0)(a(), b()),
        '<=': (a, b) => compare('<=', (sign) => sign <= 0)(a(), b()),
        '=': (a, b) => bool(equals(a(), b())),
        '!=': (a, b) => bool(!equals(a(), b())),
        '&': (a, b) => bool(truthy(a()) && truthy(b())),
        '|': (a, b) => bool(truthy(a()) || truthy(b())),
      },
      PREFIX_OPS: {
        '^': (a) => bool(!truthy(a())),
        COUNT: (a) => (this.prefixCount(str(a(), 'COUNT'))),
        ABS: (a) => Math.abs(num(a(), 'ABS')),
        CEIL: (a) => Math.ceil(num(a(), 'CEIL')),
        FLOOR: (a) => Math.floor(num(a(), 'FLOOR')),
        ROUND: (a) => Math.round(num(a(), 'ROUND')),
        TRUNC: (a) => Math.trunc(num(a(), 'TRUNC')),
        MANTISSA: (a) => {
          const value = num(a(), 'MANTISSA');
          return value - Math.trunc(value);
        },
      },
      AMBIGUOUS: {},
      PRECEDENCE: [['^', 'COUNT', 'ABS', 'CEIL', 'FLOOR', 'ROUND', 'TRUNC', 'MANTISSA'], ['<', '>', '>=', '<='], ['=', '!='], ['&', '|']],
      LITERAL_OPEN: '"',
      LITERAL_CLOSE: '"',
      GROUP_OPEN: '(',
      GROUP_CLOSE: ')',
      SEPARATOR: ' ',
      SYMBOLS: ['<', '>', '!', '=', '&', '|', '^', '(', ')'],
      termDelegate: this.evaluateTerm.bind(this),
      isCaseInsensitive: false,
    };

    this.parser = new ExpressionParser(this.language);
  }

  /**
   * Evaluates a condition expression string and returns its numeric result.
   * Truthy = non-zero, falsy = 0.
   *
   * In strict mode an unparseable or ill-typed expression throws. Otherwise it
   * is logged and evaluates to 0, so the node or response is skipped rather
   * than taking the kiosk down.
   *
   * @param {string} expression
   * @returns {number}
   * @throws {Error} in strict mode, on unexpected tokens or invalid terms.
   */
  evaluate(expression) {
    try {
      const stack = this.parser.expressionToRpn(expression);
      const result = this.parser.rpnToValue(stack);
      if (stack.length !== 0) {
        throw new Error(`Unexpected token "${stack[stack.length - 1]}"`);
      }
      // A bare string flag evaluates to the string itself; normalize so the
      // documented number contract holds for every expression.
      return typeof result === 'number' ? result : bool(truthy(result));
    } catch (e) {
      if (this.strict) {
        throw e;
      }
      if (e instanceof ConditionTypeError) {
        logger.warn('ConditionParser: %s; condition "%s" treated as false', e.message, expression);
      } else {
        logger.error('ConditionParser: could not evaluate "%s" (%s); treated as false', expression, e.message);
      }
      return 0;
    }
  }

  /**
   * Returns true if the term starts with a digit (integer literal).
   *
   * @param {string} term
   * @returns {boolean}
   */
  static isValidLiteral(term) {
    return term[0] >= '0' && term[0] <= '9';
  }

  static DECIMAL_RE = /^-?\d+(\.\d+)?$/;

  static parseDecimal(aString) {
    if (!ConditionParser.DECIMAL_RE.test(aString)) return Number.NaN;
    return Number(aString);
  }

  /**
   * Returns true if the term matches the flag id pattern from the dialogue schema.
   *
   * @param {string} term
   * @returns {boolean}
   */
  static isValidFlag(term) {
    const regExp = new RegExp(DialogueSchema.definitions.flag_id.pattern);
    return regExp.test(term);
  }

  /**
   * Resolves a single term to its value: number literal or flag lookup.
   *
   * String literals never reach here — the expression library returns a
   * quoted token as a raw string without consulting the term delegate.
   *
   * @param {string} term
   * @returns {number|string}
   * @throws {Error} if the term is neither a valid literal nor a valid flag.
   */
  evaluateTerm(term) {
    const numVal = ConditionParser.parseDecimal(term);
    if (Number.isNaN(numVal)) {
      if (ConditionParser.isValidFlag(term)) {
        return this.context.flags.value(term);
      }
      throw new Error(`Invalid term: ${term}`);
    }
    return numVal;
  }

  /**
   * Counts the flags whose name starts with the given prefix and which hold a
   * positive number or a non-empty string.
   *
   * @param {string} flagPrefix
   * @returns {number}
   */
  prefixCount(flagPrefix) {
    return Object.entries(this.context.flags.all())
      .filter(([name, value]) => name.startsWith(flagPrefix) && isCounted(value))
      .length;
  }
}
