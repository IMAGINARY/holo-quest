# holo-quest
A first person interactive story engine.

## Building

Requires Node.js >= 24.4.1.

```bash
npm install        # Install dependencies
npm run build      # Create a production build (output in dist/)
npm run lint       # Run ESLint (zero warnings enforced)
npm run lint:style # Run Stylelint for SCSS
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
| `settings` | Comma-separated list of settings filenames to load (must match `[a-zA-Z0-9_-]+\.yml`). Replaces the default settings file. | `settings.yml` |
| `sentry_dsn` | Sentry DSN for error tracking. Initializes Sentry immediately, before configuration is loaded. | _(none)_ |

Examples: `?log=debug`, `?settings=my-settings.yml`, `?log=info&settings=game1.yml,game2.yml`, `?sentry_dsn=https://examplePublicKey@o0.ingest.sentry.io/0`

## Configuration

The app uses a two-tier configuration system:

1. **Built-in config files** — YAML files in `./config/`. These are shipped with the app and should not be modified directly.

2. **Settings files** — YAML files placed at the document root (next to `index.html`). By default, the app loads `settings.yml`. Custom settings files can be specified via the `settings` query parameter.

3. **Merge behavior** — All config and settings files are deep-merged in order (config files first, then settings files). Later files override earlier ones. Arrays are fully replaced, not concatenated. Missing files are silently ignored.

4. **Override workflow** — To customize the app, create a `settings.yml` (or a custom-named `.yml` file) at the document root and override any values from the built-in config files.

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
