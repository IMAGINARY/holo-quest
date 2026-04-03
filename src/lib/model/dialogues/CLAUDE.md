# Dialogue Subsystem

Tree-structured dialogue engine: parses JSON dialogue definitions, validates them, traverses the tree at runtime, and drives UI playback through a state machine.

## Files

- **`dialogue.js`** — `Dialogue` class; parses JSON into a node tree with parent links and id lookup map (`Dialogue.fromJson`)
- **`dialogue-iterator.js`** — `DialogueIterator`; walks the node tree (`next`/`nextWithResponse`/`goTo`), evaluates conditions, processes flag assignments
- **`dialogue-iterator-context.js`** — `DialogueIteratorContext`; runtime state wrapping an external `FlagStore` + cycle position tracking
- **`dialogue-sequencer.js`** — `DialogueSequencer`; playback controller that drives the iterator, manages UI states and effects, emits `'end'`/`'terminate'` events
- **`condition-parser.js`** — `ConditionParser`; expression evaluator using `expressionparser` lib
- **`dialogue-safe-builder.js`** — `safeBuildDialogueFromItems`; error-tolerant builder that returns a placeholder dialogue on failure

### Validation (three layers, run in order)

- **`dialogue-schema-validation.js`** — JSON Schema validation via AJV (lazily compiled)
- **`dialogue-validation.js`** — Structural checks: duplicate IDs, invalid `then` references, cycles
- **`dialogue-validation-cycles.js`** — Directed graph cycle detection via `find-cycle/directed`

### Sequencer UI States (`dialogue-sequencer-states/`)

All states implement the `onBegin`/`onAction`/`onEnd` lifecycle from the base class.

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
- **`root`** — synthetic; assigned to the top-level node by `Dialogue.fromJson`

## Execution Flow

1. `Dialogue.fromJson(json)` — schema-validates, deep-copies, links parents, normalizes types/ids
2. `validateDialogue(dialogue)` — checks duplicate IDs, invalid references, cycles
3. `DialogueSequencer.play(dialogue, context, options)` — creates iterator, calls `runUntilInteractivity`
4. Iterator skips non-interactive nodes (sequence/random/cycle/first) via `next()`
5. On `statement` → TextState → speech bubble → (optional) ResponseState → (optional) ThenState
6. On `effect` → EffectState → creates/ends effect via factory
7. After UI completes → `endUi()` → iterator advances → loop until end → emits `'end'`, calls `terminate()`

## Flag Assignments (`set` property)

- `"flag"` — touch (set to 1 if unset)
- `"flag = 3"` — assign value
- `"flag += 1"` — increment
- `"flag -= 1"` — decrement

Values clamped to [0, 999] by `FlagStore`.

## Condition Language

- **Operators:** `<`, `>`, `>=`, `<=`, `=`, `!=`, `&` (AND), `|` (OR), `^` (NOT)
- **Functions:** `COUNT "prefix"`, `ABS`, `CEIL`, `FLOOR`, `ROUND`, `TRUNC`, `MANTISSA`
- **Terms:** integer/decimal literals, flag names (resolved via `FlagStore.value`), double-quoted strings (for `COUNT`)

## External Dependencies

- `expressionparser` — condition expression parsing and evaluation
- `eventemitter3` — sequencer events (`'end'`, `'terminate'`)
- `find-cycle/directed` — cycle detection in validation
- `ajv` — JSON Schema validation
- `loglevel` — logging

## Key Interfaces

- `DialogueIteratorContext` wraps `FlagStore` from `../flag-store.js`
- `DialogueSequencer` talks to a `dialogueOverlay` (UI interface): `showSpeech`, `hideSpeech`, `speedUpSpeech`, `showPressToContinue`, `showResponseOptions`, `hideResponseOptions`, `getSelectedResponseId`, `setTopTitle`, `hide`; overlay exposes `events` (EventEmitter with `'speechComplete'`)
- Each file exports a single default export

## Related Files

- **`specs/dialogue.schema.json`** — JSON Schema for dialogue definitions
- **`docs/dialogues.md`** — dialogue format documentation
- **`src/lib/model/flag-store.js`** — `FlagStore` class (value/touch/set/inc/dec)
- **`test/dialogues.test.js`** — main test suite with fixtures in `test/fixtures/dialogues/`
- **`test/condition-parser.test.js`** — condition expression tests
- **`test/dialogue-validation.test.js`** — validation tests
