import { OptionDrum, OptionRail } from '../components/spinner-ui';

/**
 * Builds the registry of input controls a statement can select with `responseControl`.
 *
 * Replace this file to add or swap controls without touching the rest of the app. The returned
 * map is handed to `GameController`, which checks the story against it and hands controls to
 * `GameView` by name. It must register `DEFAULT_UI_CONTROL` (see `../game/ui-controls`).
 *
 * @returns {Map<string, Function>} Control components, by identifier.
 */
export default function registerUiControls() {
  return new Map([
    ['rail', OptionRail],
    ['drum', OptionDrum],
  ]);
}
