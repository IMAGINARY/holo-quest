# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Holo-Quest is a first-person interactive story engine built with React 19, Tailwind CSS v4 + DaisyUI for styling, and Vite as the build tool.

## Platform

### Production (museum kiosk)

- Two-screen Pepper's Ghost display (one reflected on glass, one seen through glass) enabling parallax via two layers
- Input: spinner (freely rotating arcade knob) + two hardware buttons (switch language, reset)
- Runs in a Chromium-based kiosk browser; user has no access outside the app

### Development

- Regular screen, mouse/keyboard, standard browser

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — ESLint (zero warnings enforced via `--max-warnings=0`)
- `npm run lint:style` — Stylelint for CSS
- `npm run test` — Vitest tests (currently passes with no tests)

## Architecture

- **Entry point**: `index.html` loads `/src/main.jsx` and `/src/styles/default.css`
- **`src/main.jsx`** — Application entry point; renders React with `StrictMode`
- **`src/lib/components/`** — React components (JSX)
- **`src/lib/helpers/`** — Utility modules (logger, sentry)
- **`src/lib/helpers-web/`** — Browser-specific helpers (fatal error display)
- **`src/lib/sound/`** — SoundManager (Howler.js)
- **`src/lib/init/`** — App initialization and config injection
- **`src/lib/loaders/`** — YAML config loading
- **`config/`** — YAML configuration files
- **`src/styles/`** — CSS stylesheets (Tailwind CSS v4 with DaisyUI plugin via `@plugin "daisyui"`)
- **`src/assets/`** — Static assets
- **`playground/`** — Isolated UI component experiments; served by `npm run dev` but excluded from production builds. Copy `_template.html`/`_template.jsx` to create a new experiment.
- Vite runs in MPA mode (`appType: 'mpa'`)

## Code Style

- ESLint extends `airbnb` + `airbnb/hooks` (React rules); zero warnings policy
- `react/react-in-jsx-scope` and `react/prop-types` are disabled
- Trailing commas on multiline (except functions)
- No file extensions in JS/JSX/TS/TSX imports
- CSS follows `stylelint-config-standard`

## Conventions

- Classes stored in kebab-case files (e.g., `MapView` class → `map-view.js`)
- React components use kebab-case `.jsx` files (e.g., `AppView` → `app-view.jsx`)
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`

## Requirements

- Node.js >= 24.4.1
