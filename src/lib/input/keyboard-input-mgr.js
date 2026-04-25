export default class KeyboardInputMgr {
  /**
   * Attaches a single `keydown` listener on `document` and dispatches to
   * registered shortcuts whose descriptor matches the event.
   */
  constructor() {
    this.shortcuts = [];
    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.shortcuts.forEach(({ descriptor, callback }) => {
        if (KeyboardInputMgr.matchesShortcut(event, descriptor)) {
          callback();
        }
      });
    });
  }

  /**
   * Register a keyboard shortcut.
   *
   * @param {string} shortcutString - e.g. "KeyR", "Alt+KeyJ", "Ctrl+Shift+KeyP"
   * @param {function} callback - Called when the shortcut is activated
   */
  addShortcut(shortcutString, callback) {
    const descriptor = KeyboardInputMgr.parseShortcut(shortcutString);
    this.shortcuts.push({ descriptor, callback });
  }

  /**
   * Parses a shortcut string into a descriptor object.
   *
   * @param {string} shortcutString E.g. `"KeyR"`, `"Alt+KeyJ"`, `"Ctrl+Shift+KeyP"`.
   * @returns {{ code: string, ctrl: boolean, alt: boolean, shift: boolean }}
   */
  static parseShortcut(shortcutString) {
    const parts = shortcutString.split('+').map((p) => p.trim());
    const code = parts.pop();
    const modifiers = parts.map((m) => m.toLowerCase());
    return {
      code,
      ctrl: modifiers.includes('ctrl'),
      alt: modifiers.includes('alt'),
      shift: modifiers.includes('shift'),
    };
  }

  /**
   * Tests whether a keyboard event matches a parsed shortcut descriptor.
   *
   * @param {KeyboardEvent} event
   * @param {{ code: string, ctrl: boolean, alt: boolean, shift: boolean }} descriptor
   * @returns {boolean}
   */
  static matchesShortcut(event, descriptor) {
    return event.code === descriptor.code
      && event.ctrlKey === descriptor.ctrl
      && event.altKey === descriptor.alt
      && event.shiftKey === descriptor.shift;
  }
}
