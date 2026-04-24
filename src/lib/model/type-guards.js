/**
 * Runtime type guards. Each assert* function throws TypeError on failure and
 * returns undefined on success. The `label` argument identifies the caller and
 * is embedded in error messages so the thrown error points at the real site.
 */

/**
 * Text that is either a plain string or a language-keyed map of strings
 * (e.g. `{ en: 'Hi there!', es: 'Hola' }`).
 *
 * @typedef {string|Object<string, string>} LangText
 */

/**
 * Player choice options mapping spinner positions (numeric keys as strings) to
 * choice labels.
 *
 * @typedef {Object<string, string>} InputOptions
 */

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Asserts that `value` is a string.
 *
 * @param {unknown} value
 * @param {string} label - Identifier included in error messages.
 * @throws {TypeError}
 */
export function assertString(value, label) {
  if (typeof value !== 'string') {
    throw new TypeError(`${label}: expected string, got ${describeType(value)}`);
  }
}

/**
 * Asserts that `value` is a string or null.
 *
 * @param {unknown} value
 * @param {string} label - Identifier included in error messages.
 * @throws {TypeError}
 */
export function assertStringOrNull(value, label) {
  if (value === null) return;
  if (typeof value !== 'string') {
    throw new TypeError(`${label}: expected string or null, got ${describeType(value)}`);
  }
}

/**
 * Asserts that `value` is one of:
 *   - null
 *   - a string
 *   - a plain object whose values are all strings (keys are language codes)
 *
 * Matches the shape consumed by getText() in src/lib/helpers/i18n.js.
 *
 * @param {unknown} value
 * @param {string} label - Identifier included in error messages.
 * @throws {TypeError}
 * @see {@link LangText}
 */
export function assertLangText(value, label) {
  if (value === null) return;
  if (typeof value === 'string') return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(
      `${label}: expected string, plain object, or null, got ${describeType(value)}`
    );
  }
  Object.entries(value).forEach(([key, val]) => {
    if (typeof val !== 'string') {
      throw new TypeError(
        `${label}: value for key "${key}" must be a string, got ${describeType(val)}`
      );
    }
  });
}

/**
 * Asserts that `value` is null, or a plain object whose keys parse as finite
 * numbers and whose values are strings.
 *
 * @param {unknown} value
 * @param {string} label - Identifier included in error messages.
 * @throws {TypeError}
 * @see {@link InputOptions}
 */
export function assertInputOptions(value, label) {
  if (value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(
      `${label}: expected plain object or null, got ${describeType(value)}`
    );
  }
  Object.entries(value).forEach(([key, val]) => {
    if (!Number.isFinite(Number(key))) {
      throw new TypeError(`${label}: key "${key}" is not a finite number`);
    }
    if (typeof val !== 'string') {
      throw new TypeError(
        `${label}: value for key "${key}" must be a string, got ${describeType(val)}`
      );
    }
  });
}
