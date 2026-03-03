# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Holo-Quest is a first-person interactive story engine built with vanilla JavaScript (no framework), Tailwind CSS v4 for styling, and Vite as the build tool.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — ESLint (zero warnings enforced via `--max-warnings=0`)
- `npm run lint:style` — Stylelint for CSS
- `npm run test` — Vitest tests (currently passes with no tests)

## Architecture

- **Entry point**: `index.html` loads `/src/main.js` and `/src/styles/default.css`
- **`src/main.js`** — Application entry point
- **`src/styles/`** — CSS stylesheets (Tailwind CSS v4)
- **`src/assets/`** — Static assets

## Code Style

- ESLint with Airbnb config; zero warnings policy
- Trailing commas on multiline (except functions)
- No file extensions in JS/JSX/TS/TSX imports
- CSS follows `stylelint-config-standard`

## Conventions

- Classes stored in kebab-case files (e.g., `MapView` class → `map-view.js`)
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`

## Requirements

- Node.js >= 24.4.1
