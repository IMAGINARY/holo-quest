# Dialogues

Dialogues describe interactive conversations.

The schema is defined in [dialogues.schema.json](../specs/dialogue.schema.json).

## Dialogue format

Example:

```json
{
  "id": "dialogue_id",
  "items": [
  ],
  "capture": {
    "cond": "consent = 1",
    "flags": ["survey-*", "ending"]
  }
}
```

A dialogue has three properties:

- **id**: (string) The dialogue's id.
- **items**: (array) An array of node objects.
- **capture**: (object, optional) Flags whose values are captured at the end of the game (see
    [Capture](#capture)).

## Nodes

A dialogue is composed of nodes. Nodes can have different types:

- **statement**: A statement is a node that displays a text and can have responses.
- **random**: A random node is a node that randomly picks one of its items.
- **cycle**: A cycle node is a node that picks the next of its items, in order and starting with 
    the first, when becomes active.
- **sequence**: A sequence node is a node that goes through its items in order.
- **first**: A first node is a node that continues to its first valid item.

When playing a dialogue, there's one active node. A node might transition to another node, but if
there's no transition, the dialogue ends.

All nodes have these properties:

- `id`: (string) The node's id. If it's not set, it's generated automatically.
- `type`: (string, default: 'statement') The node's type. Can be 'statement', 'effect', 'random', 
     'cycle', or 'sequence'.
- `cond` (string, optional): A logical expression (see below).
- `set` (string | array, optional): One or more flags that are set when the node becomes active.

A node can only become active if its `cond` is true. When it becomes active, it
sets all of its `set` flags.

### Statement nodes

Example:

```json
{
  "id": "node_id",
  "type": "statement",
  "cond": "flag1 | (^flag2 & flag3)",
  "text": "Dialogue text",
  "sound": { "path": "stories/example/audio/voice.mp3", "loop": false },
  "class": ["aClass", "anotherClass"],
  "set": ["flag3", "flag4"],
  "responses": [
    {
      "cond": ["flag5", "flag6"],
      "text": "Response text",
      "class": ["aClass", "anotherClass"],
      "set": ["flag7", "flag8"],
      "value": "yes",
      "thenText": "Text to display after selecting this response",
      "then": "node_id"
    }
  ],
  "responseFlag": "selected_response",
  "responseControl": "drum",
  "responsePlaceholder": "Select an option",
  "then": "node_id"
}
```

Statement nodes have these properties:

- `text` (string | object, required): The text to display.
- `sound` (string | object, optional): A sound to play while the statement is active. Either a string (path to a sound file) or an object with `path` (string, required) and `loop` (boolean, optional, default `false`). The sound starts when the bubble appears and stops when the player advances past the statement (continue input or response selection). The `thenText` shown after a response is *not* covered by the statement's sound. For sound that should keep playing independently across multiple nodes, use the `sound` effect instead (see [Effect nodes](#effect-nodes)).
- `class` (string | array, optional): One or more classes that are set when the text is displayed.
- `responses` (array, optional): An array of response objects.
- `responseFlag` (string, optional): The id of a flag that will be set to the `value` of the selected response. Requires every response in the node to have a `value` (validation will fail otherwise). The flag holds whatever type the `value` has: with `"value": "yes"` a later node branches on `answer = "yes"`, and with `"value": 4` on `answer > 3`. All responses in the node must use the same type, and two nodes writing to the same `responseFlag` must agree on it.
- `responseControl` (string, optional): The identifier of the input control the player uses to pick a response. Defaults to `rail`. See [Response controls](#response-controls). Requires `responses`.
- `responsePlaceholder` (string | object, optional): A label for controls that show one, such as `drum`. Translatable like any other text (see [i18n](#i18n)). Requires `responses`.
- `then` (string, optional): The ID of the next node to transition to.

If the statement node has `responses`, they player will have to pick one of them to continue.

The statement node will transition to the next one, decided by the first of these that applies:

- A node specified in the selected response's `then` property.
- A node specified in the statement node's `then` property.
- Back to the parent node.

If there's no transition, the dialogue ends.

#### Responses

A response object has these properties:

- `cond` (string, optional): A logical expression (see below).
- `text` (string | object, required): The text to display.
- `class` (string | array, optional): One or more classes that are set when the response is displayed.
- `set` (string | array, optional): One or more flags that are set when the response is selected.
- `value` (string | number, optional): A stable identifier for this response, written to the node's `responseFlag` when the response is selected. If any response in a set has a `value`, all responses in that set must have one, they must all be of the same type, and all values within the set must be unique. It is narrative data only; use `position` to say where the response sits on the spinner.
- `position` (integer, optional): Where this response sits on the input track. If any response in a set has a `position`, all must have one. See [Response placement](#response-placement).
- `thenText` (string | object, optional): A text that will be displayed after the response is selected.
- `thenClass` (string | array, optional): One or more classes that are set when the `thenText` is displayed.
- `then` (string, optional): The ID of the next node to transition to.

The player is offered all responses that have a `cond` that is true, up to the maximum number.

The player can select only one response, which will set all of its `set` flags.

If the response has a `then` property, the dialogue will transition to the node specified in it, or
display the text as if it were a statement node with no properties other than `text`.

##### Response value types

A `value` is a number if it is written as one, and a string otherwise, following ordinary YAML
rules. Quote anything that is meant to be a string:

| YAML | Stored as |
| --- | --- |
| `value: 4` | number `4` |
| `value: "4"` | string `"4"` |
| `value: 007` | number `7` |
| `value: 0x1F` | number `31` |
| `value: yes` | string `"yes"` |
| `value: true` | boolean — rejected |
| `value: 2025-01-01` | date — rejected |

Numeric values are what make a rating scale work: with values `1`–`5`, a later node can test
`happiness > 3`. Note that `0` is legal but falsy, so it is skipped by `COUNT()` and reads as false
in `&`, `|` and `^`, exactly like `""` — prefer starting a scale at 1.

One known inconsistency: `value: 1e3` is accepted as `1000`, while the same number in a `set`
assignment, `'flag = 1e3'`, is rejected. Write it as `1000`.

##### Response placement

By default the engine lays a response set out symmetrically around the neutral centre of the
spinner track, skipping position 0. Give every response a `position` to place them yourself:

```yaml
responses:
  - text: Strongly against
    position: -2
  - text: Against
    position: -1
  - text: For
    position: 1
  - text: Strongly for
    position: 2
```

Negative positions sit left of the neutral centre, positive ones right of it. The rules, all
checked when the story loads:

- **All or none.** Either every response in the set has a `position` or none do.
- **Integers, and unique** within the set.
- **Never 0.** 0 is the neutral resting position where the spinner starts, and it never confirms a
    selection, so an option placed there could never be picked.
- **Contiguous**, apart from the skipped 0. `-2, -1, 1, 2` is fine; `-3, 3` is not, because the
    spinner would still stop at -2, -1, 1 and 2 with nothing there to select.

`position` is only about placement and `value` is only about narrative data, so a response can carry
either, both or neither.

Placement is up to the [input control](#response-controls). `position` is honoured by controls that
lay their options out along a track, like `rail`. `drum` numbers its options in order instead, so it
ignores `position`.

One caveat when combining `position` with `cond`: a positioned set is placed exactly as written, so
if a condition hides a response in the middle of the run, the gap it leaves stays empty — the spinner
will stop there and nothing will happen. Either keep conditional responses at the ends of the track,
or leave the set unpositioned so the engine lays out whichever responses survive.

##### Response controls

A statement's responses are picked with an input control, chosen by `responseControl`. The value is
an identifier, not a fixed list: it is looked up at runtime among the controls the app registers, so
an installation can add its own. The controls that ship with the engine are:

| `responseControl` | Control |
| --- | --- |
| `rail` (default) | A horizontal rail with the options spread along it. Honours `position`. Has no placeholder. |
| `drum` | A vertical drum that scrolls through the options one row at a time. The placeholder is shown as the neutral row the drum rests on before a choice is made. Numbers the options in order and ignores `position`. |

```yaml
- text: What do you do on a free evening?
  responseControl: drum
  responsePlaceholder:
    en: Select an activity
    de: Wähle eine Aktivität
  responses:
    - text: Reading
    - text: Sleeping
    - text: Going out
```

`responsePlaceholder` is a text (a string, or one string per language) and is always optional. A
control that shows a placeholder still works without one, it just renders an empty label; a control
that has none, like `rail`, ignores it. Neither property does anything on a node without `responses`,
so validation rejects that.

The identifier must be well formed (letters, digits, `_`, `-` and `.`, not starting with a digit),
and it must name a registered control. That second rule can't be checked from the dialogue alone, so
it is checked when the story is loaded into the app: an unknown identifier stops the app with a fatal
error listing the registered controls, rather than surfacing when the player reaches that node. See
[ui-controls.md](ui-controls.md) for how controls are registered.

### Effect nodes

Effect nodes are nodes that perform an effect when they become active. They don't display any text.

Example:

```json
{
    "id": "node_id",
    "type": "effect",
    "cond": "flag1 | (^flag2 & flag3)",
    "effect": {
        "type": "effect_type",
        "options": {
            "option1": "value1",
            "option2": "value2"
        }
    },
    "set": ["flag3", "flag4"],
    "then": "node_id"
}
```

They have these properties:

- `effect` (string | object, optional): An effect to perform when the node becomes active (see below).
- `then` (string, optional): The ID of the next node to transition to.

#### Effects

Effects are performed when the node becomes active. They can be used to make all types of visual 
changes to the game. Dialogues don't specify the possible effects, they're offered by the 
game engine and made available to the dialogue interpreter as a sort of runtime environment.

An effect object has these properties:

- `type` (string, required): The type of effect to perform.
- `options` (object, optional): Named arguments for the effect.
- `phase` (string, optional): The phase of the effect to perform. Can be 'start', 'end', or 'all'.

The `phase` property indicates whether to begin and end the effect (`all`) with no nodes in between,
or to `start` the effect ending it after, when a second effect node with the same type and `end` 
in the `phase` property is found.

It might be possible to have more than one effect active at the same time, but only one of each type
can be started. If a second effect node with the same type is found, the first one is terminated
unceremoniously.

### Collection nodes

Collection nodes are those that have child nodes. Collection nodes transition to one of their
children depending on their specific type.

Children are specified through the `items` property.

- `items` (array, required): An array of node objects.

Collection nodes only consider children with a `cond` property that is true (or no `cond`) when
deciding which one to transition to.

their behavior is defined by their type:

- `sequence`: Go through all of their children in order.
- `first`: Transitions to the first children node.
- `random`: Randomly pick one of their children and transition to it.
- `cycle`: Each time a `cycle` node becomes active, it picks the next of its children in order
    (starting with the first, on the first activation). When all children have been picked, it 
    starts again.

## i18n

Any time a text is specified (`text`, `thenText` or `responsePlaceholder` properties), there are two options:

- Using a string
- Using multiple strings, one per language

Multilingual strings are specified as objects, where the keys are language codes and the values are
the strings in that language.

```
{
  "text": {
    "en": "Hello!",
    "es": "¡Hola!"
    "de": "Hallo!"
  }
}
```

## Expressions

Expressions are used in `cond` properties. They can be used to check for one or more flags.

The following operators are supported:

- `&`: Logical AND
- `|`: Logical OR
- `^`: Logical NOT
- `=`: Equals
- `!=`: Not equals
- `<`: Less than
- `<=`: Less than or equal to
- `>`: Greater than
- `>=`: Greater than or equal to

The following functions are supported:

- `COUNT("prefix")`: Returns the number of flags (which are set, i.e. > 0) that start with `prefix`. 
  The prefix must be entered within quotes.
- `ABS(value)`: Returns the absolute value.
- `CEIL(value)`: Rounds up to the nearest integer.
- `FLOOR(value)`: Rounds down to the nearest integer.
- `ROUND(value)`: Rounds to the nearest integer.
- `TRUNC(value)`: Removes the decimal part (rounds towards zero).
- `MANTISSA(value)`: Returns the decimal part (i.e. `value - TRUNC(value)`).

Parentheses can be used to group expressions.

### Types in expressions

Terms are numbers, strings, or flags (which hold either). An unset flag reads as `0`.

- `=` and `!=` are type-aware: values of different types are never equal, and comparing them is
    never an error. `ending = "good"` is simply false while `ending` is unset.
- `<`, `>`, `<=` and `>=` compare numbers numerically and strings lexicographically. Comparing a
    string with a number is an error. Since an unset flag reads as `0`, an ordering comparison only
    works once the flag has been assigned — guard it, e.g. `ending != "" & ending < "m"`.
- `&`, `|` and `^` treat a non-empty string as true, and `""` (like `0`) as false.
- `COUNT("prefix")` counts flags holding a positive number or a non-empty string.
- The math functions require numbers and reject strings.

Because an unset flag reads as `0`, an ordering test against a numeric `responseFlag` is simply
false before the question has been answered: `happiness > 3` evaluates `0 > 3`. That is usually
what you want, but it fails quietly rather than announcing that the flag was never written. Gate on
a separate flag if you need to tell "not asked yet" apart from "answered low".

Beware that `^` binds tighter than `=`, so `^ending = "good"` means `(^ending) = "good"`, which is
always false. Write `^(ending = "good")` instead.

### Strictness

When an expression can't be evaluated — a math function applied to a string, a string compared with
a number, or a syntax error — the engine either throws or logs the problem and treats the condition
as false. This is controlled by `game.strictExpressions` (see `config/game.yml`), which defaults to
throwing during development and failing softly in a production build, so that a content mistake
can't take the kiosk down mid-story. Pass `?strict=1` to turn strict checking on for a single
session on the kiosk itself.

Example:

```
flag1 | (^flag2 & flag3)
```

It's also possible to check flags used as counters

```
counter1 >= 3 | counter2 >= 2
```

## Flags

Flags are used to keep track of the player's progress. They can be used in `cond` and `set` properties.

A flag holds either a number or a string.

In `cond` properties, flags can only be read. In `set` properties, flags's values can be changed 
in different ways:

- `flag`: If the flag is unset or holds a falsy value (`0` or `""`), it's set to 1. Otherwise, its
    value is not changed.
- `flag = 3`: Sets the flag to 3.
- `flag = "evacuated"`: Sets the flag to a string.
- `flag += n`: Adds n to the flag's value (where n is a number literal).
- `flag -= n`: Subtracts n from the flag's value (where n is a number literal).

Flags accept decimal numbers, including negative values.

### String values

String literals are written in double quotes and are only accepted after `=`. `+=` and `-=` are
numeric-only: writing one with a string literal is rejected when the story is loaded, and applying
one to a flag that currently holds a string is an error at runtime.

```yaml
set:
  - 'ending = "evacuated"'
  - 'note = "has space"'
  - 'cleared = ""'
```

Note the surrounding single quotes: in YAML they keep the inner double quotes intact.

A string literal cannot contain a double quote or a backslash — the backslash is reserved for a
possible future escape syntax. Setting a flag to `""` makes it falsy, which is the idiomatic way
to clear it.

**Numbers and strings are never equal.** `answer = 3` is false when `answer` holds the string `"3"`
— write `answer = "3"` instead. With `responseFlag` the flag holds whatever type the selected
response's `value` had, so `value: 3` is matched by `answer = 3` and `value: "3"` by `answer = "3"`.

## Capture

A dialogue can declare flags whose values are captured (sent to an external data store) at the end
of the game.

Example:

```json
{
  "capture": {
    "cond": "consent = 1",
    "flags": ["survey-*", "ending"]
  }
}
```

A capture object has these properties:

- `cond` (string, optional): A logical expression (see [Expressions](#expressions)). Flags are
    only captured if it's true. If it's not set, flags are always captured.
- `flags` (array, required): One or more flag names or patterns. A flag is captured if its name
    matches any of them.

No other properties are allowed, so a misspelled `cond` fails validation instead of silently
capturing flags unconditionally.

Patterns can use these wildcards:

- `*`: Matches any sequence of characters, including none.
- `?`: Matches exactly one character.

Matching is case-sensitive and must cover the whole flag name. For example, `survey-*` matches
`survey-age` but not `pre-survey-age`, and `q?` matches `q1` but not `q10`.

Be careful with a pattern of `*` on its own: it captures *every* flag in the store, including any
the engine sets itself, such as the values written through `responseFlag`. Prefer a shared prefix
like `survey-*` so that adding a flag elsewhere in the story can't silently widen what is captured.

At the end of a story the engine evaluates `cond` and selects the flags matching `flags`.
Forwarding them to the external data store is not implemented yet, so nothing leaves the device.

Nothing is captured if the story declares no `capture`, if `cond` is false or fails to evaluate, or
if no flag matches any pattern. Each of those decisions is logged at `info` level together with its
reason; flag values are never written to the log.

Capture also runs when a play-through is cut short by a restart, with whatever flags are set at that
point. A story that only wants data from completed runs should say so in `cond` — for example by
gating on a flag set on the final node.

## Restrictions

These rules are enforced when the dialogue is built, not while it plays. A story that breaks one of
them fails to load and stops the app with a fatal error, rather than running until the broken part
is reached.

### IDs must be unique

Node IDs, and the ID of the dialogue itself, must be unique within a dialogue.

### Cycles are forbidden

A dialogue can't have cycles. That is, there cannot be a path from a node to itself through 
`then` properties. Even though cycles could be designed in a way that avoids infinite loops,
they are not allowed because the risk of having one by mistake is too high.

### Response sets must be consistent

Within one response set, either every response has a `value` or none do, all values are of the same
type, and all are unique. Two nodes writing to the same `responseFlag` must agree on the type they
write. The same all-or-none rule applies to `position`, which must additionally be a non-zero
integer, unique within the set, and contiguous apart from the skipped 0.

### Response controls need responses

A node with `responseControl` or `responsePlaceholder` must have at least one response. The control
identifier must also belong to a registered control; that is checked when the story is loaded into
the app rather than when the dialogue is built (see [Response controls](#response-controls)).
