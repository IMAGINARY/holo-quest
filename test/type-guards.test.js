import { describe, it, expect } from 'vitest';
import {
  assertString,
  assertStringOrNull,
  assertLangText,
  assertInputOptions,
} from '../src/lib/model/type-guards.js';

describe('type-guards', () => {
  describe('assertString', () => {
    it('accepts strings', () => {
      expect(() => assertString('hello', 'test')).not.toThrow();
    });

    it('throws on null', () => {
      expect(() => assertString(null, 'test')).toThrow(TypeError);
    });

    it('throws on numbers', () => {
      expect(() => assertString(42, 'test')).toThrow(/expected string, got number/);
    });

    it('includes the label in the error', () => {
      expect(() => assertString(42, 'setLang')).toThrow(/^setLang:/);
    });
  });

  describe('assertStringOrNull', () => {
    it('accepts strings', () => {
      expect(() => assertStringOrNull('hi', 'test')).not.toThrow();
    });

    it('accepts null', () => {
      expect(() => assertStringOrNull(null, 'test')).not.toThrow();
    });

    it('throws on numbers', () => {
      expect(() => assertStringOrNull(42, 'test')).toThrow(/expected string or null/);
    });
  });

  describe('assertLangText', () => {
    it('accepts a string', () => {
      expect(() => assertLangText('hello', 'test')).not.toThrow();
    });

    it('accepts null', () => {
      expect(() => assertLangText(null, 'test')).not.toThrow();
    });

    it('accepts a lang-keyed object', () => {
      expect(() => assertLangText({ en: 'hi', es: 'hola' }, 'test')).not.toThrow();
    });

    it('throws on arrays', () => {
      expect(() => assertLangText(['hi'], 'test')).toThrow(/got array/);
    });

    it('throws when a value is not a string', () => {
      expect(() => assertLangText({ en: 42 }, 'test')).toThrow(/value for key "en"/);
    });
  });

  describe('assertInputOptions', () => {
    it('accepts null', () => {
      expect(() => assertInputOptions(null, 'test')).not.toThrow();
    });

    it('accepts an object with numeric keys and string values', () => {
      expect(() => assertInputOptions({ '-1': 'a', 1: 'b' }, 'test')).not.toThrow();
    });

    it('throws on non-numeric keys', () => {
      expect(() => assertInputOptions({ abc: 'value' }, 'test'))
        .toThrow(/key "abc" is not a finite number/);
    });

    it('throws on non-string values', () => {
      expect(() => assertInputOptions({ 1: 42 }, 'test'))
        .toThrow(/value for key "1" must be a string/);
    });

    it('throws on arrays', () => {
      expect(() => assertInputOptions(['a'], 'test')).toThrow(/got array/);
    });
  });
});
