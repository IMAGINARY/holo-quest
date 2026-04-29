/**
 * Dev-mode on-screen status bar — a TV-style OSD for transient developer
 * feedback. Push messages from anywhere; the bar (rendered by
 * `dev-status-bar.jsx` inside the holo display) flashes the message and
 * auto-clears after a configurable duration.
 *
 * Usage:
 *   import useDevStatus from '<...>/stores/dev-status';
 *   useDevStatus.getState().show('Preview: node-42');
 *
 * Multi-line: the bar is rendered with `whitespace-pre-wrap`, so embedded
 * `\n` produces multiple lines at no extra cost:
 *   useDevStatus.getState().show('flag set\nvalue=3');
 *
 * Pass `null` (or call `clear()`) to hide immediately; otherwise the message
 * disappears on its own per `gameView.devStatusBar.displayDurationMs`.
 *
 * Re-pushing the same string still restarts the auto-clear timer (the `seq`
 * counter is bumped on every `show`), so spamming a shortcut keeps the bar
 * visible without flicker.
 */

import { create } from 'zustand';

/**
 * @typedef {Object} DevStatusState
 * @property {string|null} message - Current dev OSD message, or null if hidden.
 * @property {number} seq - Monotonic counter; bumped on each `show()` so the
 *   consumer's auto-clear timer restarts even when the same message is pushed
 *   back-to-back.
 * @property {(message: string|null) => void} show - Push a transient dev
 *   message to the on-screen status bar. Pass null to clear immediately.
 * @property {() => void} clear - Clear the message immediately. Used by the
 *   consumer's auto-hide timer.
 */

const useDevStatus = create((set) => ({
  message: null,
  seq: 0,

  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),

  clear: () => set({ message: null }),
}));

export default useDevStatus;
