import EventEmitter from 'eventemitter3';

export default class FlagStore {
  constructor() {
    this.flags = {};
    this.events = new EventEmitter();
  }

  all() {
    return this.flags;
  }

  /**
   * True if the flag has ever been assigned, including to `0` or `''`.
   *
   * @param {string} flag
   * @returns {boolean}
   */
  has(flag) {
    return Object.prototype.hasOwnProperty.call(this.flags, flag);
  }

  /**
   * True if the flag holds a truthy value. Both `0` and `''` count as false,
   * so this cannot tell them from an unset flag — use {@link has} for that.
   *
   * @param {string} flag
   * @returns {boolean}
   */
  exists(flag) {
    const value = this.flags[flag];
    return typeof value === 'string' ? value !== '' : !!value;
  }

  /**
   * The flag's value, or `0` when unset.
   *
   * An unset flag and one assigned `0` remain indistinguishable, but a flag
   * assigned the empty string reads back as `''` rather than the number `0`.
   *
   * @param {string} flag
   * @returns {number|string}
   */
  value(flag) {
    return this.has(flag) ? this.flags[flag] : 0;
  }

  touch(flag) {
    if (!this.exists(flag)) {
      this.set(flag, 1);
    }
  }

  set(flag, value, setter = null) {
    const oldValue = this.has(flag) ? this.flags[flag] : undefined;
    this.flags[flag] = value;
    this.events.emit('flag', flag, this.flags[flag], oldValue, setter);
  }

  inc(flag, amount = 1) {
    this.set(flag, this.numericValue(flag, 'inc') + amount);
  }

  dec(flag, amount = 1) {
    this.set(flag, this.numericValue(flag, 'dec') - amount);
  }

  /**
   * The flag's value for arithmetic, treating an unset flag as `0`.
   *
   * @private
   * @param {string} flag
   * @param {string} op - Operation name, for the error message.
   * @returns {number}
   * @throws {TypeError} if the flag holds a string. `+=` and `-=` are
   *   numeric-only; concatenating (`'green' + 1`) would silently corrupt it.
   */
  numericValue(flag, op) {
    const current = this.value(flag);
    if (typeof current !== 'number') {
      throw new TypeError(`FlagStore.${op}: flag '${flag}' holds a string (${JSON.stringify(current)}); '+=' and '-=' are numeric-only`);
    }
    return current;
  }

  clear() {
    this.flags = {};
    this.events.emit('clear');
  }

  dump() {
    return JSON.stringify(Object.fromEntries(
      Object.entries(this.flags).sort((a, b) => a[0].localeCompare(b[0]))
    ), null, 2);
  }

  asJSON() {
    return this.flags;
  }
}
