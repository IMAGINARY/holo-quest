# holo-quest
A first person interactive story engine.

## Building

Requires Node.js >= 24.4.1.

```bash
npm install        # Install dependencies
npm run build      # Create a production build (output in dist/)
npm run lint       # Run ESLint (zero warnings enforced)
npm run lint:style # Run Stylelint for CSS
npm run test       # Run Jest tests
```

## Running  

- `npm run dev` — Start the Vite dev server for development
- `npm run preview` — Preview the production build (run `npm run build` first)

## Query string arguments

The app accepts query string parameters to control its behavior:

| Parameter  | Description | Default |
|------------|-------------|---------|
| `log`      | Sets the logging verbosity level. Accepted values: `trace`, `debug`, `info`, `warn`, `error`, `silent`. | `warn` |
| `settings` | Comma-separated list of settings filenames to load (must match `[a-zA-Z0-9_-]+\.yml`). | _(none)_ |
| `sentry_dsn` | Sentry DSN for error tracking. Initializes Sentry immediately, before configuration is loaded. | _(none)_ |
| `frontAdj`   | Per-screen content transform for the **front** screen. Format: `offsetX,offsetY,scaleX,scaleY` (4 comma-separated numbers). Overrides `holoDisplay.screens.front`. | _(none)_ |
| `backAdj`    | Per-screen content transform for the **back** screen. Format: `offsetX,offsetY,scaleX,scaleY` (4 comma-separated numbers). Overrides `holoDisplay.screens.back`. | _(none)_ |
| `hdSim`      | Activates simulation mode (`holoDisplay.simulationMode`). Both screens are overlaid on a single monitor with CSS blend mode to approximate the pepper's ghost effect. Presence of this parameter enables it; no value needed. | `false` |
| `story`      | Story id to load. Overrides `app.story`; the file loaded is `${app.storyPath}/${story}.yml`. Must match `[a-zA-Z0-9_-]+`; invalid values are logged and ignored. | _(none)_ |
| `lang`       | Default language code at startup. Must be a value present in `game.languages`; if not, the first language in the list is used and a warning is logged. Overrides `game.defaultLanguage`. Must match `[a-zA-Z0-9_-]+`; invalid values are logged and ignored. | _(none)_ |
| `strict`     | Expression strictness (`game.strictExpressions`). When on, a condition or flag assignment that can't be evaluated throws; when off, it is logged and the condition is treated as false. Use `?strict=0` to disable, any other value to enable. Useful for proving a story out on the kiosk itself. | strict in dev, lenient in a production build |
| `startNode`  | Node id to start the story from, instead of its root node. Overrides `app.startNode`. Must match `[a-zA-Z0-9_-]+`; invalid values are logged and ignored. An id not found in the story is also logged and ignored, falling back to the root node. | _(none)_ |

Examples: `?log=debug`, `?settings=my-settings.yml`, `?log=info&settings=game1.yml,game2.yml`, `?sentry_dsn=https://examplePublicKey@o0.ingest.sentry.io/0`, `?frontAdj=0,0,1.1,1.2`, `?hdSim`, `?story=evacuate`, `?lang=en`, `?strict=1`, `?startNode=ready`

## Configuration

The app uses a two-tier configuration system:

1. **Built-in config files** — YAML files in `./config/`. These are shipped with the app and should not be modified directly.

2. **Settings files** — YAML files placed at the document root (next to `index.html`). Settings files are only loaded when explicitly specified via the `settings` query parameter (e.g. `?settings=settings.yml`).

3. **Merge behavior** — All config and settings files are deep-merged in order (config files first, then settings files). Later files override earlier ones. Arrays are fully replaced, not concatenated. Missing files are silently ignored.

4. **Override workflow** — To customize the app, create a `.yml` file at the document root and load it via the `settings` query parameter (e.g. `?settings=my-settings.yml`).

## Keyboard Shortcuts

| Command             | Default key | Description |
|---------------------|-------------|-------------|
| `toggleLang`        | `L`         | Cycles to the next language in `config.game.languages`, wrapping at the end. |
| `showRestartDialog` | `R`         | Opens the restart-game dialog. |

Shortcuts can be rebound in `config/shortcuts.yml`.

## Error Tracking (Sentry)

The app supports optional error tracking via [Sentry](https://sentry.io/). When enabled, Sentry captures `console.error` calls and uncaught exceptions.

There are two ways to provide the Sentry DSN:

1. **Query string** — Pass `?sentry_dsn=<DSN>`. Sentry is initialized immediately, before configuration files are loaded, so it can capture errors during startup.
2. **Config file** — Set `sentry.dsn` in a settings YAML file (e.g., `settings.yml`):
   ```yaml
   sentry:
     dsn: "https://examplePublicKey@o0.ingest.sentry.io/0"
   ```

If both are provided, the query string takes precedence — Sentry is initialized only once.

## Credits

Developed by Eric Londaits for IMAGINARY gGmbH.

## License

Copyright (c) 2026 IMAGINARY gGmbH
Licensed under the MIT license (see LICENSE)
