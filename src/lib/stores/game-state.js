import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * @typedef {Object} GameState
 * @property {string|null} text - Dialogue text currently displayed to the player.
 * @property {Object<string, string>|null} input - Player choice options mapping
 *   spinner positions (numeric keys) to choice labels.
 * @property {(text: string|null) => void} setText - Replace the current dialogue text.
 * @property {(input: Object<string, string>|null) => void} setInput - Replace the
 *   current player choice options.
 */

const useGameState = create(
  immer((set) => ({
    text: null,
    input: null,

    /**
     * Replace the current dialogue text.
     *
     * @param {string|null} text - Text to display, or null to clear.
     * @throws {TypeError} If text is not a string or null.
     */
    setText: (text) => {
      if (text !== null && typeof text !== 'string') {
        throw new TypeError(`setText: expected string or null, got ${typeof text}`);
      }
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.text = text; });
    },

    /**
     * Replace the current player choice options.
     *
     * @param {Object<string, string>|null} input - Map of spinner positions
     *   (numeric keys) to choice labels, or null to clear.
     * @throws {TypeError} If input is not a valid options object or null.
     */
    setInput: (input) => {
      if (input !== null) {
        if (typeof input !== 'object' || Array.isArray(input)) {
          throw new TypeError(`setInput: expected plain object or null, got ${Array.isArray(input) ? 'array' : typeof input}`);
        }
        Object.entries(input).forEach(([key, value]) => {
          if (!Number.isFinite(Number(key))) {
            throw new TypeError(`setInput: key "${key}" is not a finite number`);
          }
          if (typeof value !== 'string') {
            throw new TypeError(`setInput: value for key "${key}" must be a string, got ${typeof value}`);
          }
        });
      }
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.input = input; });
    },
  }))
);

export default useGameState;
