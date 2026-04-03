import EventEmitter from 'eventemitter3';

export default class FlagStore {
  constructor() {
    this.flags = {};
    this.events = new EventEmitter();
  }

  all() {
    return this.flags;
  }

  exists(flag) {
    return !!this.flags[flag];
  }

  value(flag) {
    return this.flags[flag] || 0;
  }

  touch(flag) {
    if (!this.exists(flag)) {
      this.set(flag, 1);
    }
  }

  set(flag, value, setter = null) {
    const oldValue = this.flags[flag] || undefined;
    this.flags[flag] = value;
    this.events.emit('flag', flag, this.flags[flag], oldValue, setter);
  }

  inc(flag, amount = 1) {
    if (this.flags[flag] === undefined) {
      this.flags[flag] = 0;
    }
    this.set(flag, this.flags[flag] + amount);
  }

  dec(flag, amount = 1) {
    if (this.flags[flag] === undefined) {
      this.flags[flag] = 0;
    }
    this.set(flag, this.flags[flag] - amount);
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
