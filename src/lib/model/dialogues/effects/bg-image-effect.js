import DialogueEffect from './dialogue-effect';

/**
 * Sets the back-screen background image via `GameUiController.setBackgroundPath`.
 *
 * Options:
 *  - `path` (string|null): Image path to display, or null to clear.
 *
 * Lifecycle:
 *  - `onStarting` applies the configured path.
 *  - `terminate` clears the path back to null, reverting the lasting state
 *    change as required by the `DialogueEffect` contract.
 */
export default class BgImageEffect extends DialogueEffect {
  // eslint-disable-next-line class-methods-use-this
  getDefaultOptions() {
    return { path: null };
  }

  onStarting(doneCallback) {
    this.app.gameUiController.setBackgroundPath(this.options.path);
    doneCallback();
  }

  terminate() {
    this.app.gameUiController.setBackgroundPath(null);
  }
}
