import DialogueEffect from './dialogue-effect';

/**
 * Plays a sound from a path via `SoundManager.playByPath`.
 *
 * Options:
 *  - `path` (string|string[]|null): Audio file path (or array of fallback formats).
 *  - `loop` (boolean): Whether the sound should loop. Defaults to false.
 *
 * Lifecycle:
 *  - `onStarting` starts playback non-blocking and stashes the `Howl` for cleanup.
 *  - `terminate` stops and unloads the `Howl`, covering both interruption and
 *    natural-end interleavings as required by the `DialogueEffect` contract.
 */
export default class SoundEffect extends DialogueEffect {
  // eslint-disable-next-line class-methods-use-this
  getDefaultOptions() {
    return { path: null, loop: false };
  }

  onStarting(doneCallback) {
    const { path, loop } = this.options;
    if (path) {
      this.howl = this.app.soundManager.playByPath(path, { loop });
    }
    doneCallback();
  }

  onEnding(doneCallback) {
    if (this.howl) {
      this.howl.stop();
    }
    doneCallback();
  }

  terminate() {
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
  }
}
