/** The only regex-special characters a schema-valid `flag_pattern` can contain. */
const PATTERN_REPLACEMENTS = {
  '.': '\\.',
  '*': '.*',
  '?': '.',
};

/**
 * Compiles a flag-name pattern into an anchored RegExp.
 *
 * Only `.`, `*` and `?` need handling: the schema's `flag_pattern` charset
 * (`^[a-zA-Z_*?][.a-zA-Z0-9_*?-]*$`) admits no other regex metacharacter, and `-` is only
 * special inside a character class.
 *
 * @param {string} pattern A flag pattern, e.g. `survey-*`.
 * @returns {RegExp}
 */
export function flagPatternToRegExp(pattern) {
  const escaped = pattern.replace(/[.*?]/g, (char) => PATTERN_REPLACEMENTS[char]);
  return new RegExp(`^${escaped}$`);
}

/**
 * Returns the subset of `flags` whose names match at least one of `patterns`.
 *
 * Matching is case-sensitive and covers the whole flag name. The result is a new object, so it
 * does not alias the flag store's live internal state and survives a `clear()`.
 *
 * Flags are filtered by name only, so a flag whose value is `0` is kept — unlike
 * `FlagStore.exists()`/`value()`, which cannot tell `0` from unset.
 *
 * @param {string[]} patterns Patterns from a dialogue's `capture.flags`.
 * @param {Object<string, number|string>} flags Flag values, e.g. `FlagStore.all()`.
 * @returns {Object<string, number|string>}
 */
export default function selectCapturedFlags(patterns, flags) {
  const matchers = patterns.map(flagPatternToRegExp);
  return Object.fromEntries(
    Object.entries(flags).filter(([name]) => matchers.some((matcher) => matcher.test(name)))
  );
}
