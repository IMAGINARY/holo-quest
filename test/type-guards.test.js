import { describe, it, expect } from 'vitest';
import {
  assertString,
  assertStringOrNull,
  assertLangText,
  assertInputControl,
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

  describe('assertInputControl', () => {
    it('accepts null', () => {
      expect(() => assertInputControl(null, 'test')).not.toThrow();
    });

    it('accepts a control with string option values', () => {
      expect(() => assertInputControl(
        { type: 'default', options: { '-1': 'a', 1: 'b' } },
        'test'
      )).not.toThrow();
    });

    it('accepts a control with LangText option values', () => {
      expect(() => assertInputControl(
        { type: 'default', options: { 1: { en: 'yes', es: 'sí' } } },
        'test'
      )).not.toThrow();
    });

    it('accepts a control with an empty options map', () => {
      expect(() => assertInputControl(
        { type: 'default', options: {} },
        'test'
      )).not.toThrow();
    });

    it('throws on arrays', () => {
      expect(() => assertInputControl(['a'], 'test')).toThrow(/got array/);
    });

    it('throws when type is missing', () => {
      expect(() => assertInputControl({ options: {} }, 'test'))
        .toThrow(/test\.type: expected string, got undefined/);
    });

    it('throws when type is not a string', () => {
      expect(() => assertInputControl({ type: 1, options: {} }, 'test'))
        .toThrow(/test\.type: expected string, got number/);
    });

    it('throws when type is an empty string', () => {
      expect(() => assertInputControl({ type: '', options: {} }, 'test'))
        .toThrow(/test\.type: expected non-empty string/);
    });

    it('throws when options is missing', () => {
      expect(() => assertInputControl({ type: 'default' }, 'test'))
        .toThrow(/test\.options: expected plain object, got undefined/);
    });

    it('throws when options is an array', () => {
      expect(() => assertInputControl({ type: 'default', options: [] }, 'test'))
        .toThrow(/test\.options: expected plain object, got array/);
    });

    it('throws when options is null', () => {
      expect(() => assertInputControl({ type: 'default', options: null }, 'test'))
        .toThrow(/test\.options: expected plain object, got null/);
    });

    it('throws on non-numeric option keys', () => {
      expect(() => assertInputControl(
        { type: 'default', options: { abc: 'value' } },
        'test'
      )).toThrow(/test\.options: key "abc" is not a finite number/);
    });

    it('throws when an option value is an invalid LangText', () => {
      expect(() => assertInputControl(
        { type: 'default', options: { 1: 42 } },
        'test'
      )).toThrow(/test\.options\["1"\]: expected string, plain object, or null/);
    });

    it('accepts a control with a string placeholder', () => {
      expect(() => assertInputControl(
        { type: 'drum', options: { 1: 'a' }, placeholder: 'Pick one' },
        'test'
      )).not.toThrow();
    });

    it('accepts a control with a LangText placeholder', () => {
      expect(() => assertInputControl(
        { type: 'drum', options: { 1: 'a' }, placeholder: { en: 'Pick one', es: 'Elige uno' } },
        'test'
      )).not.toThrow();
    });

    it('throws when the placeholder is an invalid LangText', () => {
      expect(() => assertInputControl(
        { type: 'drum', options: { 1: 'a' }, placeholder: 42 },
        'test'
      )).toThrow(/test\.placeholder: expected string, plain object, or null/);
    });
  });
});
