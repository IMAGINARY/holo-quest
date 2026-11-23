/**
 * Input-control contract shared by everything in the UI-controls registry (the `Map` returned by
 * `src/lib/init/register-ui-controls.js`, keyed by the identifier a statement's `responseControl`
 * refers to).
 *
 * A control is a React component taking `{ options, placeholder, position, velocity,
 * confirmationProgress }`, where `options` is a map of spinner position to option label. It may
 * also carry three static properties:
 *
 * - `placement`: how a response set is laid out along the spinner track. `'centered'` (the
 *   default) uses each response's authored `position`, or spreads the set symmetrically around
 *   the neutral centre. `'sequential'` numbers the responses `1..n` in order and ignores any
 *   authored `position`.
 * - `gearRatio`: how many steps the spinner travels per unit of its base calibration (default 1).
 * - `anchorTop`: distance in px from the control's top edge to its anchor line (e.g. its selected
 *   row). `GameView` places that line at `inputTopPercent` (default 0, i.e. the top edge).
 *
 * See docs/ui-controls.md.
 */

/** Control used when a statement has no `responseControl`, and for the engine's own prompts. */
export const DEFAULT_UI_CONTROL = 'rail';

/**
 * Checks that the story only refers to registered input controls, so a typo in a
 * `responseControl` fails when the story loads rather than when the player reaches that node.
 *
 * @param {Dialogue} story The parsed story.
 * @param {Map<string, Function>} uiControls Registered control components, by identifier.
 * @throws {Error} If the default control is not registered, or a statement names an unknown one.
 */
export function validateStoryControls(story, uiControls) {
  const registered = [...uiControls.keys()].join(', ') || '(none)';

  if (!uiControls.has(DEFAULT_UI_CONTROL)) {
    throw new Error(`The default input control '${DEFAULT_UI_CONTROL}' is not registered (registered: ${registered})`);
  }

  const unknown = story.statementNodes
    .filter((node) => node.responseControl !== undefined && !uiControls.has(node.responseControl))
    .map((node) => `node ${node.id} uses '${node.responseControl}'`);

  if (unknown.length > 0) {
    throw new Error(`Unknown input control: ${unknown.join('; ')} (registered: ${registered})`);
  }
}
