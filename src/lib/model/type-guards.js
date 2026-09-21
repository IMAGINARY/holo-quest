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
 * Player input control. `type` is the identifier of the registered UI control
 * that renders it (e.g. `'rail'`, `'drum'`), `options` maps spinner positions
 * (numeric keys as strings) to option labels as {@link LangText}, and the
 * optional `placeholder` is the label for controls that show one.
 *
 * @typedef {Object} InputControl
 * @property {string} type - Non-empty control identifier.
 * @property {Object<string, LangText>} options - Map of spinner position to
 *   option label.
 * @property {LangText} [placeholder] - Label for controls that show one.
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
 * Asserts that `value` is null, or a plain object of the shape:
 *   { type: string (non-empty), options: { [numeric-key]: LangText },
 *     placeholder?: LangText }
 *
 * @param {unknown} value
 * @param {string} label - Identifier included in error messages.
 * @throws {TypeError}
 * @see {@link InputControl}
 */
export function assertInputControl(value, label) {
  if (value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(
      `${label}: expected plain object or null, got ${describeType(value)}`
    );
  }
  assertString(value.type, `${label}.type`);
  if (value.type === '') {
    throw new TypeError(`${label}.type: expected non-empty string`);
  }
  const { options } = value;
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(
      `${label}.options: expected plain object, got ${describeType(options)}`
    );
  }
  Object.entries(options).forEach(([key, val]) => {
    if (!Number.isFinite(Number(key))) {
      throw new TypeError(`${label}.options: key "${key}" is not a finite number`);
    }
    assertLangText(val, `${label}.options["${key}"]`);
  });
  if (value.placeholder !== undefined) {
    assertLangText(value.placeholder, `${label}.placeholder`);
  }
}
