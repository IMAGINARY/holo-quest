import { ExpressionParser } from 'expressionparser';
import DialogueSchema from '../../../../specs/dialogue.schema.json';

/** @param {*} result @returns {number} @throws {Error} if not a number. */
const num = (result) => {
  if (typeof result !== 'number') {
    throw new Error(`Expected number, found: ${typeof result} ${JSON.stringify(result)}`);
  }

  return result;
};

/** @param {*} result @returns {string} @throws {Error} if not a string. */
const str = (result) => {
  if (typeof result !== 'string') {
    throw new Error(`Expected string, found: ${typeof result} ${JSON.stringify(result)}`);
  }

  return result;
};

/**
 * Evaluates boolean/arithmetic expressions used in dialogue conditions.
 *
 * Supports infix operators (`<`, `>`, `>=`, `<=`, `=`, `!=`, `&`, `|`),
 * prefix operators (`^` for NOT, `COUNT` for flag-prefix counting),
 * integer literals, flag lookups, and string literals (in double quotes).
 */
export default class LogicParser {
  /**
   * @param {DialogueIteratorContext} context - Provides flag values for term evaluation.
   */
  constructor(context) {
    this.context = context;

    this.language = {
      INFIX_OPS: {
        '<': (a, b) => (num(a()) < num(b()) ? 1 : 0),
        '>': (a, b) => (num(a()) > num(b()) ? 1 : 0),
        '>=': (a, b) => (num(a()) >= num(b()) ? 1 : 0),
        '<=': (a, b) => (num(a()) <= num(b()) ? 1 : 0),
        '=': (a, b) => (num(a()) === num(b()) ? 1 : 0),
        '!=': (a, b) => (num(a()) !== num(b()) ? 1 : 0),
        '&': (a, b) => ((!!num(a()) && !!num(b())) ? 1 : 0),
        '|': (a, b) => ((!!num(a()) || !!num(b())) ? 1 : 0),
      },
      PREFIX_OPS: {
        '^': (a) => (!num(a()) ? 1 : 0),
        COUNT: (a) => (this.prefixCount(str(a()))),
      },
      AMBIGUOUS: {},
      PRECEDENCE: [['^', 'COUNT'], ['<', '>', '>=', '<='], ['=', '!='], ['&', '|']],
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
   * @param {string} expression
   * @returns {number}
   * @throws {Error} on unexpected tokens or invalid terms.
   */
  evaluate(expression) {
    const stack = this.parser.expressionToRpn(expression);
    const result = this.parser.rpnToValue(stack);
    // return this.parser.expressionToValue(expression);
    if (stack.length !== 0) {
      throw new Error(`Unexpected token "${stack[stack.length - 1]}"`);
    }
    return result;
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
   * Resolves a single term to its numeric value: integer literal or flag lookup.
   *
   * @param {string} term
   * @returns {number}
   * @throws {Error} if the term is neither a valid literal nor a valid flag.
   */
  evaluateTerm(term) {
    if (LogicParser.isValidLiteral(term)) {
      return parseInt(term, 10);
    }
    if (LogicParser.isValidFlag(term)) {
      return this.context.flags.value(term);
    }
    throw new Error(`Invalid term: ${term}`);
  }

  /**
   * Counts the number of flags with a positive value whose name starts with the given prefix.
   *
   * @param {string} flagPrefix
   * @returns {number}
   */
  prefixCount(flagPrefix) {
    const flags = Object.entries(this.context.flags.all())
      .filter(([, value]) => value > 0)
      .map(([key]) => key);

    return flags.reduce((count, flag) => {
      if (flag.startsWith(flagPrefix)) {
        return count + 1;
      }
      return count;
    }, 0);
  }
}
