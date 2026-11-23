# Dialogue Subsystem

Tree-structured dialogue engine: parses JSON dialogue definitions, validates them, traverses the tree at runtime, and drives UI playback through a state machine.

## Files

- **`dialogue.js`** — `Dialogue` class; parses JSON into a node tree with parent links and id lookup map (`Dialogue.fromJson`)
- **`dialogue-iterator.js`** — `DialogueIterator`; walks the node tree (`next`/`nextWithResponse`/`goTo`, with `continueAfter` deciding what follows a finished node), evaluates conditions, processes flag assignments, optionally starts at a given node id (constructor/`reset(startNode)`)
- **`dialogue-iterator-context.js`** — `DialogueIteratorContext`; runtime state wrapping an external `FlagStore` + cycle position tracking
- **`dialogue-sequencer.js`** — `DialogueSequencer`; playback controller that drives the iterator, manages UI states and effects, emits `'end'`/`'terminate'` events
- **`condition-parser.js`** — `ConditionParser`; expression evaluator using `expressionparser` lib
- **`condition-type-error.js`** — `ConditionTypeError`; raised for ill-typed operands, so lenient mode can tell a content mistake from a syntax error
- **`flag-capture.js`** — `selectCapturedFlags`; matches flag names against the patterns in a dialogue's `capture.flags` (also exports `flagPatternToRegExp`)

### Validation (three layers, run in order)

- **`dialogue-schema-validation.js`** — JSON Schema validation via AJV (lazily compiled)
- **`dialogue-validation.js`** — Structural checks: duplicate IDs, invalid `then` references, response values (all-or-none, unique, one type per set and per `responseFlag` across the dialogue), response positions (all-or-none, unique, non-zero, contiguous), `responseControl`/`responsePlaceholder` only on nodes with responses, `capture.cond` syntax, cycles. Runs at the end of `Dialogue.fromJson`, after the schema layer, so both layers run on the production load path. Set-level response rules live here rather than in the schema: expressing "all or none" there costs one `anyOf` branch per combination, so the branches multiply with every new property
- **`dialogue-validation-cycles.js`** — Directed graph cycle detection via `find-cycle/directed`. Its `getContinuationTargets` is the static counterpart of `DialogueIterator.continueAfter`; change one and the other has to follow

### Sequencer UI States (`dialogue-sequencer-states/`)

All states implement the `onBegin`/`onEnd` lifecycle from the base class.

- **`dialogue-sequencer-state.js`** — `DialogueSequencerState` base class
- **`text-state.js`** — Shows speech bubble; on complete, transitions to response state or shows press-to-continue
- **`effect-state.js`** — Manages effect start/end lifecycle; supports phases: `start`, `end`, `all`
- **`response-state.js`** — Displays player choices; on selection, transitions to then-state or advances iterator
- **`then-state.js`** — Shows follow-up text (`thenText`) after a response selection

### Effects (`effects/`)

- **`dialogue-effect.js`** — `DialogueEffect` abstract base; state machine: IDLE → STARTING → ACTIVE → ENDING → FINISHED; subclasses override `onStarting`/`onActive`/`onEnding`/`onFinished`/`terminate`
- **`dialogue-effect-factory.js`** — `DialogueEffectFactory`; static registry + factory; register effects via `DialogueEffectFactory.registerEffect(name, class)`

## Node Types

- **`statement`** — displays text (speech bubble), may have `responses`
- **`effect`** — triggers a registered effect (string or `{type, options, phase}`)
- **`sequence`** — plays enabled children in order
- **`random`** — picks one enabled child at random
- **`cycle`** — round-robins through enabled children across visits
- **`first`** — picks the first child whose condition is met
- **`root`** — synthetic; assigned to the top-level node by `Dialogue.fromJson`. Enters its first enabled item, like `first`

All node types accept `then`, collections included.

## Continuation (what follows a finished node)

Implemented once, in `DialogueIterator.continueAfter`, and used by both `next()` and `nextWithResponse()`:

1. The selected response's `then` (handled in `nextWithResponse` before `continueAfter`)
2. The node's own `then`
3. If the parent is a `sequence`: the next enabled sibling after the node, located by its position in the full `items` list (the node may have disabled itself while it played)
4. Otherwise the parent is finished too: rules 2-4 apply to the parent
5. No parent left: the dialogue ends

A collection with no enabled child finishes immediately and goes through the same rules. A parent is never re-entered, so `first`/`random`/`cycle` pick once per visit. The rule is documented for authors in `docs/dialogues.md` ("Transitions").

## Execution Flow

1. `Dialogue.fromJson(json)` — schema-validates, deep-copies, links parents, normalizes types/ids, then runs `validateDialogue` on the built tree (duplicate IDs, invalid references, response values, `responseFlag` types, `capture.cond`, cycles). Throws on any failure, so a `Dialogue` that exists is structurally valid. `src/main.jsx` calls it directly and lets the throw reach the fatal-error handler installed by `initStandaloneApp`
2. `DialogueSequencer.play(dialogue, context, options)` — creates iterator (optionally starting at `options.startNode`, resolved and validated by `GameController.resolveStartNode` against `config.app.startNode`), calls `runUntilInteractivity`
3. Iterator skips non-interactive nodes (sequence/random/cycle/first) via `next()`
4. On `statement` → TextState → speech bubble → (optional) ResponseState → (optional) ThenState
5. On `effect` → EffectState → creates/ends effect via factory
6. After UI completes → `endUi()` → iterator advances → loop until end → `terminate()` (emits `'terminate'`, which runs `GameController.captureFlags()` while the flags are still set) → emits `'end'` → `GameController.handleGameEnded()` restarts the game

## Flag Assignments (`set` property)

- `"flag"` — touch (set to 1 if unset or falsy)
- `"flag = 3"` — assign a number
- `"flag = \"text\""` — assign a string (only after `=`; no `"` or `\` inside)
- `"flag += 1"` — increment
- `"flag -= 1"` — decrement

`set` holds one such expression as a string, or an array of them; `DialogueIterator.processAssignments` accepts both, on nodes and on responses.

Parsed by `DialogueIterator.ASSIGNMENT_RE`, mirrored by the `flag_assignment` pattern in the schema.

A flag holds a number or a string. Values are not clamped or otherwise constrained by `FlagStore`; they can be negative, decimal or empty. `+=`/`-=` throw a `TypeError` when the flag holds a string. `responseFlag` writes the selected response's `value`, which is a number or a string depending on how it was written; all responses in a node, and all nodes sharing a `responseFlag`, must agree on the type.

A response's `value` is narrative data only. Placement on the input track is a separate optional property, `position`, consumed by `GameUiController.showInput` as the spinner option key; without it the controller lays the set out symmetrically around the neutral centre. That applies to controls whose static `placement` is `'centered'` (the default, e.g. `rail`); `'sequential'` controls (e.g. `drum`) number the responses `1..n` and ignore `position`.

## Input Controls (`responseControl`, `responsePlaceholder`)

A statement picks its input control with `responseControl` (an identifier, default `rail`) and may pass a translatable label with `responsePlaceholder`. `ResponseState.onBegin` hands both to `GameUiController.showInput`, which records the control id as the store's `input.type` and the placeholder as `input.placeholder`; `GameView` then builds the component by name from the registry.

The dialogue validator only checks the shape (identifier pattern in the schema; not set on a node without responses). Whether the identifier names a registered control is not knowable here, since the registry belongs to the deployment (`src/lib/init/register-ui-controls.js`), so `GameController.validateStory` checks it when the story is set. See `docs/ui-controls.md`.

## Condition Language

- **Operators:** `<`, `>`, `>=`, `<=`, `=`, `!=`, `&` (AND), `|` (OR), `^` (NOT)
- **Functions:** `COUNT "prefix"`, `ABS`, `CEIL`, `FLOOR`, `ROUND`, `TRUNC`, `MANTISSA`
- **Terms:** number literals, flag names (resolved via `FlagStore.value`), double-quoted string literals (usable anywhere, not just as the `COUNT` argument)
- **Types:** `=`/`!=` are type-aware and never throw; ordering compares numbers numerically and strings lexicographically and rejects mixed operands; a non-empty string is truthy; math functions require numbers
- **Strictness:** `context.strict` (from `game.strictExpressions`, or `?strict=`) decides whether a failed expression throws or is logged and treated as false; defaults to `import.meta.env.DEV`. Ill-typed operands raise `ConditionTypeError`, which lenient mode logs at `warn` rather than `error`.

## External Dependencies

- `expressionparser` — condition expression parsing and evaluation
- `eventemitter3` — sequencer events (`'end'`, `'terminate'`)
- `find-cycle/directed` — cycle detection in validation
- `ajv` — JSON Schema validation
- `loglevel` — logging

## Key Interfaces

- `DialogueIteratorContext` wraps `FlagStore` from `../flag-store.js`
- `DialogueSequencer` talks to a `uiController` (UI interface): `showSpeech`, `hideSpeech`, `speedUpSpeech`, `showPressToContinue`, `showResponseOptions`, `hideResponseOptions`, `getSelectedResponseId`, `setTopTitle`, `hide`; overlay exposes `events` (EventEmitter with `'textShown'`)
- Each file exports a single default export (`flag-capture.js` additionally exports `flagPatternToRegExp` for testing)

## Related Files

- **`specs/dialogue.schema.json`** — JSON Schema for dialogue definitions
- **`docs/dialogues.md`** — dialogue format documentation
- **`src/lib/model/flag-store.js`** — `FlagStore` class (value/touch/set/inc/dec)
- **`test/dialogues.test.js`** — main test suite with fixtures in `test/fixtures/dialogues/`
- **`test/condition-parser.test.js`** — condition expression tests
- **`test/dialogue-validation.test.js`** — validation tests
- **`test/flag-capture.test.js`** — flag pattern matching tests
- **`src/lib/game/game-controller.js`** — owns the `FlagStore` and runs capture on the sequencer's `'terminate'` event
