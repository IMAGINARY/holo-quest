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

Examples: `?log=debug`, `?settings=my-settings.yml`, `?log=info&settings=game1.yml,game2.yml`

## Configuration

The app uses a two-tier configuration system:

1. **Built-in config files** — YAML files in `./config/`. These are shipped with the app and should not be modified directly. They are listed in `src/lib/init/inject-config-files.js`.

2. **Settings files** — YAML files placed at the document root (next to `index.html`). By default the app loads `settings.yml`. Custom settings files can be specified via the `settings` query parameter.

3. **Merge behavior** — All config and settings files are deep-merged in order (config files first, then settings files). Later files override earlier ones. Arrays are fully replaced, not concatenated. Missing files are silently ignored.

4. **Override workflow** — To customize the app, create a `settings.yml` (or a custom-named `.yml` file) at the document root and override any values from the built-in config files.

## Credits

Developed by Eric Londaits for IMAGINARY gGmbH.

## License

Copyright (c) 2026 IMAGINARY gGmbH
Licensed under the MIT license (see LICENSE)
