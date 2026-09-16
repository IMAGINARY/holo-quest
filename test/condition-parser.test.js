import {
  describe, it, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest';
import logger from 'loglevel';
import ConditionParser from '../src/lib/model/dialogues/condition-parser';
import FlagStore from '../src/lib/model/flag-store';

describe('ConditionParser', () => {
  let parser = null;
  let context = null;
  beforeAll(() => {
    context = {
      flags: new FlagStore(),
      // Pinned rather than inherited from the build, so these expectations
      // don't depend on import.meta.env.DEV.
      strict: true,
    };
    parser = new ConditionParser(context);
  });

  beforeEach(() => {
    context.flags.clear();
  });

  describe('terms', () => {
    it('should evaluate number literals', () => {
      expect(parser.evaluate('0')).to.equal(0);
      expect(parser.evaluate('1')).to.equal(1);
      expect(parser.evaluate('5')).to.equal(5);
      expect(parser.evaluate('987')).to.equal(987);
      expect(parser.evaluate('987.1111')).to.equal(987.1111);
      expect(parser.evaluate('0.5')).to.equal(0.5);
      expect(parser.evaluate('0.33')).to.equal(0.33);
      expect(parser.evaluate('-0.33')).to.equal(-0.33);
      expect(parser.evaluate('-1')).to.equal(-1);
      expect(parser.evaluate('-7')).to.equal(-7);
      expect(parser.evaluate('-57')).to.equal(-57);
    });

    it('should evaluate flags', () => {
      parser.context.flags.touch('a');
      expect(parser.evaluate('a')).to.equal(1);
      expect(parser.evaluate('b')).to.equal(0);
    });
  });

  describe('logic operators', () => {
    it('should evaluate & and |', () => {
      parser.context.flags.touch('a');
      parser.context.flags.touch('b');
      expect(parser.evaluate('a & b')).to.equal(1);
      expect(parser.evaluate('a & c')).to.equal(0);
      expect(parser.evaluate('a | b')).to.equal(1);
      expect(parser.evaluate('a | c')).to.equal(1);
      expect(parser.evaluate('c | d')).to.equal(0);
    });

    it('should handle chains of & and |', () => {
      parser.context.flags.touch('a');
      parser.context.flags.touch('b');
      parser.context.flags.touch('c');
      expect(parser.evaluate('a & b & c')).to.equal(1);
      expect(parser.evaluate('a & b & d')).to.equal(0);
      expect(parser.evaluate('a | b | c')).to.equal(1);
      expect(parser.evaluate('a | d | e')).to.equal(1);
      expect(parser.evaluate('d | e | f')).to.equal(0);
    });

    it('should handle ^', () => {
      parser.context.flags.touch('a');
      expect(parser.evaluate('^a')).to.equal(0);
      expect(parser.evaluate('^b')).to.equal(1);
      expect(parser.evaluate('^(^a)')).to.equal(1);
      expect(parser.evaluate('a | ^a')).to.equal(1);
      expect(parser.evaluate('a | ^b')).to.equal(1);
      expect(parser.evaluate('a & ^a')).to.equal(0);
      expect(parser.evaluate('a & ^b')).to.equal(1);
    });

    it('should handle parentheses', () => {
      parser.context.flags.touch('a');
      parser.context.flags.touch('e');
      expect(parser.evaluate('(a | b | c) & (d | e)')).to.equal(1);
      expect(parser.evaluate('^(a | b | c) & (d | e)')).to.equal(0);
      expect(parser.evaluate('(a | b | c) & (d | f)')).to.equal(0);
      expect(parser.evaluate('^(b | c) & (d | e)')).to.equal(1);
      expect(parser.evaluate('(^a | e) & (^b | f)')).to.equal(1);
      expect(parser.evaluate('^((a | b | c) & (d | f))')).to.equal(1);
    });
  });

  describe('comparison operators', () => {
    it('should compare flags with literals', () => {
      parser.context.flags.touch('a');
      expect(parser.evaluate('a = 1')).to.equal(1);
      expect(parser.evaluate('1 = a')).to.equal(1);
      expect(parser.evaluate('a = 0')).to.equal(0);
      expect(parser.evaluate('0 = a')).to.equal(0);
      expect(parser.evaluate('a != 1')).to.equal(0);
      expect(parser.evaluate('a != 0')).to.equal(1);
      expect(parser.evaluate('a > 0')).to.equal(1);
      expect(parser.evaluate('a > 0.5')).to.equal(1);
      expect(parser.evaluate('a > 1')).to.equal(0);
      expect(parser.evaluate('a > -1')).to.equal(1);
      expect(parser.evaluate('a > 1.5')).to.equal(0);
      expect(parser.evaluate('a < 0')).to.equal(0);
      expect(parser.evaluate('a < 1')).to.equal(0);
      expect(parser.evaluate('a >= 0')).to.equal(1);
      expect(parser.evaluate('a >= 1')).to.equal(1);
      expect(parser.evaluate('a <= 0')).to.equal(0);
      expect(parser.evaluate('a <= 1')).to.equal(1);
      expect(parser.evaluate('a < 2')).to.equal(1);
      expect(parser.evaluate('a = 1 & a > 0')).to.equal(1);
      expect(parser.evaluate('a = 1 & a < 0')).to.equal(0);
      expect(parser.evaluate('a > 0.5 & a < 1.5')).to.equal(1);
    });

    it('should compare flags with flags', () => {
      parser.context.flags.touch('a');
      parser.context.flags.touch('b');
      parser.context.flags.set('c', 2);
      parser.context.flags.set('d', 1.5);
      expect(parser.evaluate('a = a')).to.equal(1);
      expect(parser.evaluate('a = b')).to.equal(1);
      expect(parser.evaluate('b = a')).to.equal(1);
      expect(parser.evaluate('a = c')).to.equal(0);
      expect(parser.evaluate('a = d')).to.equal(0);
      expect(parser.evaluate('a < b')).to.equal(0);
      expect(parser.evaluate('a <= b')).to.equal(1);
      expect(parser.evaluate('a >= b')).to.equal(1);
      expect(parser.evaluate('a > b')).to.equal(0);
      expect(parser.evaluate('b > a')).to.equal(0);
      expect(parser.evaluate('b < a')).to.equal(0);
      expect(parser.evaluate('c > a')).to.equal(1);
      expect(parser.evaluate('c >= a')).to.equal(1);
      expect(parser.evaluate('a < c')).to.equal(1);
      expect(parser.evaluate('a <= c')).to.equal(1);
      expect(parser.evaluate('c > d')).to.equal(1);
      expect(parser.evaluate('a < d')).to.equal(1);
    });

    it('should allow mixing comparison and logic operators', () => {
      parser.context.flags.touch('a');
      parser.context.flags.touch('b');
      parser.context.flags.set('c', 2);
      parser.context.flags.set('d', 1.5);

      expect(parser.evaluate('a = 1 & a = b')).to.equal(1);
      expect(parser.evaluate('a = 1 & a = c')).to.equal(0);
      expect(parser.evaluate('a = 1 | a = c')).to.equal(1);
      expect(parser.evaluate('d > 1.25 | d < a')).to.equal(1);
      expect(parser.evaluate('^(a = c)')).to.equal(1);
      expect(parser.evaluate('a = 1 & ^(a = c)')).to.equal(1);
      expect(parser.evaluate('a = 1 & b = 1 & c = 2')).to.equal(1);
      expect(parser.evaluate('a = b & b != c & ^(a = c)')).to.equal(1);
    });

    it('should support the COUNT function', () => {
      parser.context.flags.touch('cat_a_1');
      parser.context.flags.touch('cat_b_1');
      parser.context.flags.touch('cat_b_2');
      parser.context.flags.touch('cat_c_1');
      parser.context.flags.touch('cat_c_2');
      parser.context.flags.touch('cat_c_3');
      parser.context.flags.touch('other');

      expect(parser.evaluate('COUNT("cat_a")')).to.equal(1);
      expect(parser.evaluate('COUNT("cat_b")')).to.equal(2);
      expect(parser.evaluate('COUNT("cat_c")')).to.equal(3);
      expect(parser.evaluate('COUNT("cat_c_2")')).to.equal(1);
      expect(parser.evaluate('COUNT("other")')).to.equal(1);
      expect(parser.evaluate('COUNT("cat")')).to.equal(6);
      expect(parser.evaluate('COUNT("wrong")')).to.equal(0);
      expect(parser.evaluate('COUNT("cat_a") = 1')).to.equal(1);
      expect(parser.evaluate('COUNT("cat_a") > 1')).to.equal(0);
      expect(parser.evaluate('COUNT("cat_b") > 1')).to.equal(1);
      expect(parser.evaluate('COUNT("cat_c") > 2')).to.equal(1);
      expect(parser.evaluate('COUNT("cat") > 6 | COUNT("other") = 1 ')).to.equal(1);
    });
  });

  describe('math functions', () => {
    it('should support the ABS function', () => {
      expect(parser.evaluate('ABS(1)')).to.equal(1);
      expect(parser.evaluate('ABS(-1)')).to.equal(1);
      expect(parser.evaluate('ABS(0)')).to.equal(0);
      expect(parser.evaluate('ABS(-3.5)')).to.equal(3.5);
    });

    it('should support the CEIL function', () => {
      expect(parser.evaluate('CEIL(1.1)')).to.equal(2);
      expect(parser.evaluate('CEIL(-1.1)')).to.equal(-1);
      expect(parser.evaluate('CEIL(2)')).to.equal(2);
      expect(parser.evaluate('CEIL(0.5)')).to.equal(1);
    });

    it('should support the FLOOR function', () => {
      expect(parser.evaluate('FLOOR(1.9)')).to.equal(1);
      expect(parser.evaluate('FLOOR(-1.1)')).to.equal(-2);
      expect(parser.evaluate('FLOOR(2)')).to.equal(2);
      expect(parser.evaluate('FLOOR(0.5)')).to.equal(0);
    });

    it('should support the ROUND function', () => {
      expect(parser.evaluate('ROUND(1.4)')).to.equal(1);
      expect(parser.evaluate('ROUND(1.5)')).to.equal(2);
      expect(parser.evaluate('ROUND(-1.5)')).to.equal(-1);
      expect(parser.evaluate('ROUND(2)')).to.equal(2);
    });

    it('should support the TRUNC function', () => {
      expect(parser.evaluate('TRUNC(1.9)')).to.equal(1);
      expect(parser.evaluate('TRUNC(-1.9)')).to.equal(-1);
      expect(parser.evaluate('TRUNC(2)')).to.equal(2);
      expect(parser.evaluate('TRUNC(0.7)')).to.equal(0);
    });

    it('should support the MANTISSA function', () => {
      expect(parser.evaluate('MANTISSA(3.75)')).to.equal(0.75);
      expect(parser.evaluate('MANTISSA(1)')).to.equal(0);
      expect(parser.evaluate('MANTISSA(-2.5)')).to.equal(-0.5);
    });

    it('should accept flag arguments', () => {
      parser.context.flags.set('x', 3.7);
      expect(parser.evaluate('FLOOR(x)')).to.equal(3);
      expect(parser.evaluate('CEIL(x)')).to.equal(4);
      expect(parser.evaluate('ROUND(x)')).to.equal(4);
      expect(parser.evaluate('TRUNC(x)')).to.equal(3);
      expect(parser.evaluate('ABS(x)')).to.equal(3.7);
      expect(parser.evaluate('MANTISSA(x)')).to.be.closeTo(0.7, 0.0001);
    });

    it('should combine with comparison and logic operators', () => {
      expect(parser.evaluate('FLOOR(1.9) = 1')).to.equal(1);
      expect(parser.evaluate('CEIL(1.1) = 2')).to.equal(1);
      expect(parser.evaluate('ABS(-1) > 0 & FLOOR(1.5) = 1')).to.equal(1);
      expect(parser.evaluate('ROUND(2.5) >= 2 & TRUNC(2.9) < 3')).to.equal(1);
    });
  });

  describe('string flags', () => {
    it('should compare strings for equality', () => {
      parser.context.flags.set('colour', 'red');
      expect(parser.evaluate('colour = "red"')).to.equal(1);
      expect(parser.evaluate('colour = "blue"')).to.equal(0);
      expect(parser.evaluate('colour != "blue"')).to.equal(1);
      expect(parser.evaluate('"red" = colour')).to.equal(1);
    });

    it('should never equate a string with a number', () => {
      parser.context.flags.set('answer', '3');
      expect(parser.evaluate('answer = 3')).to.equal(0);
      expect(parser.evaluate('answer != 3')).to.equal(1);
      expect(parser.evaluate('answer = "3"')).to.equal(1);
    });

    it('should treat an unset flag as equal to no string', () => {
      expect(parser.evaluate('missing = "red"')).to.equal(0);
      expect(parser.evaluate('missing != "red"')).to.equal(1);
    });

    it('should compare strings lexicographically', () => {
      parser.context.flags.set('a', 'apple');
      parser.context.flags.set('b', 'banana');
      expect(parser.evaluate('a < b')).to.equal(1);
      expect(parser.evaluate('b < a')).to.equal(0);
      expect(parser.evaluate('a <= "apple"')).to.equal(1);
      expect(parser.evaluate('b >= "apple"')).to.equal(1);
    });

    it('should reject an ordering comparison between a string and a number', () => {
      parser.context.flags.set('colour', 'red');
      expect(() => parser.evaluate('colour < 5')).to.throw('cannot compare');
    });

    it('should treat a non-empty string as true and the empty string as false', () => {
      parser.context.flags.set('colour', 'red');
      parser.context.flags.set('blank', '');
      expect(parser.evaluate('colour')).to.equal(1);
      expect(parser.evaluate('blank')).to.equal(0);
      expect(parser.evaluate('^colour')).to.equal(0);
      expect(parser.evaluate('^blank')).to.equal(1);
      expect(parser.evaluate('colour & ^blank')).to.equal(1);
      expect(parser.evaluate('blank | colour')).to.equal(1);
    });

    it('should reject a math function applied to a string', () => {
      parser.context.flags.set('colour', 'red');
      expect(() => parser.evaluate('FLOOR(colour)')).to.throw('FLOOR: expected number');
    });

    it('should count non-empty string flags but not empty ones', () => {
      parser.context.flags.set('survey-a', 'yes');
      parser.context.flags.set('survey-b', '');
      parser.context.flags.set('survey-c', 2);
      expect(parser.evaluate('COUNT("survey-")')).to.equal(2);
    });

    it('should still ignore zero and negative numeric flags when counting', () => {
      parser.context.flags.set('n-zero', 0);
      parser.context.flags.set('n-neg', -3);
      parser.context.flags.set('n-pos', 1);
      expect(parser.evaluate('COUNT("n-")')).to.equal(1);
    });
  });

  describe('lenient mode', () => {
    let lenient = null;

    beforeEach(() => {
      vi.spyOn(logger, 'warn').mockImplementation(() => {});
      vi.spyOn(logger, 'error').mockImplementation(() => {});
      lenient = new ConditionParser({ flags: context.flags, strict: false });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should treat an ill-typed condition as false and warn', () => {
      context.flags.set('colour', 'red');
      expect(lenient.evaluate('FLOOR(colour)')).to.equal(0);
      expect(lenient.evaluate('colour < 5')).to.equal(0);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should treat a malformed condition as false and log an error', () => {
      expect(lenient.evaluate('colour = $')).to.equal(0);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should still evaluate valid conditions normally', () => {
      context.flags.set('colour', 'red');
      expect(lenient.evaluate('colour = "red"')).to.equal(1);
    });
  });

  it('should fail with invalid syntax', () => {
    expect(() => parser.evaluate('(a')).to.throw('Mismatched Grouping (unexpected "(")');
    expect(() => parser.evaluate('a & b)')).to.throw('Mismatched Grouping (unexpected closing ")")');
    expect(() => parser.evaluate('test1 * * * test2')).to.throw('Unexpected token "*"');
    expect(() => parser.evaluate('&')).to.throw('Invalid term: &');
    expect(() => parser.evaluate('a &')).to.throw('Invalid term: &');
    expect(() => parser.evaluate('^')).to.throw('Invalid term: ^');
    expect(() => parser.evaluate('a b')).to.throw('Unexpected token "a"');
    expect(() => parser.evaluate('COUNT(1)')).to.throw('COUNT: expected string');
    expect(() => parser.evaluate('COUNT(cat)')).to.throw('COUNT: expected string');
  });
});
