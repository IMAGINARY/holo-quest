# Input controls

An input control is the on-screen widget the player drives with the spinner to pick a response. A
story chooses one per statement with `responseControl` (see
[Response controls](dialogues.md#response-controls)); the controls themselves are registered by the
app.

## Registering controls

`src/lib/init/register-ui-controls.js` builds the registry: a `Map` from the identifier a story uses
to the control component.

```js
export default function registerUiControls() {
  return new Map([
    ['rail', OptionRail],
    ['drum', OptionDrum],
  ]);
}
```

`src/main.jsx` calls it and passes the result to `GameController`, which keeps it and hands controls
to `GameView` by name. The file is deliberately the only place that lists the available controls, so
a customised install can add or swap controls by adding component files and replacing this one file.
Nothing else needs editing.

The registry must contain the default control, `rail` (`DEFAULT_UI_CONTROL` in
`src/lib/game/ui-controls.js`). It is used whenever a statement has no `responseControl`, and for
the engine's own "continue" prompt.

## The control contract

A control is a React component that takes these props:

| Prop | Description |
| --- | --- |
| `options` | Map of spinner position to option label, as resolved text: `{ 1: 'Reading', 2: 'Sleeping' }`. |
| `placeholder` | Resolved label for controls that show one. `''` when the statement has no `responsePlaceholder`. A control with no use for it ignores it. |
| `position` | Current spinner position, fractional while it moves. |
| `velocity` | Current spinner velocity, normalised for the control's `gearRatio`. |
| `confirmationProgress` | 0 to 1: how far the current selection is through its confirmation delay. |

Controls are purely presentational. Confirmation is detected by `useSpinnerController`, which calls
back with the settled position; `GameUiController` maps that position back to a response.

A control can also declare three static properties, all optional:

| Static | Default | Meaning |
| --- | --- | --- |
| `placement` | `'centered'` | How responses are assigned spinner positions. `'centered'` uses each response's authored `position`, or spreads the set symmetrically around the neutral centre 0 (skipping 0). `'sequential'` numbers the responses `1..n` in order and ignores `position`. |
| `gearRatio` | `1` | Steps the spinner travels per unit of its base calibration. Raise it for controls with denser steps. Passed to `useSpinnerController`. |
| `anchorTop` | `0` | Distance in px from the control's top edge to its anchor line (e.g. its selected row). `GameView` places that line at `inputTopPercent`, so tall controls line up with short ones instead of hanging below them. |

```js
export default function OptionDrum({ options, placeholder, position, velocity }) { /* ... */ }

OptionDrum.placement = 'sequential';
OptionDrum.gearRatio = theme.drum.gearRatio;
OptionDrum.anchorTop = centerTop; // top of the selected row
```

Position 0 is always the spinner's neutral resting position and never confirms, so a control
either leaves it empty (`rail`) or uses it as its placeholder row (`drum`).

## Validation

Story loading checks the story against the registry in `GameController.validateStory`, which
`setStory` calls before storing the story. It throws when a statement's `responseControl` isn't
registered, or when the registry lacks the default control. The error names each offending node and
lists the registered controls. Because `main.jsx` doesn't catch it, it reaches the fatal-error
handler installed by `initStandaloneApp`, so a typo fails at startup instead of when the player
reaches the node.

`validateStory` is where any further pre-game story checks that need runtime context belong. Checks
that only need the dialogue itself live in `src/lib/model/dialogues/dialogue-validation.js`.
