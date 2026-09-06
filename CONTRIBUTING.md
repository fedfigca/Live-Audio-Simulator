# Contributing

## Project shape

Live Audio Simulator is an SPA with a Hono backend and a React frontend.

- `src/index.ts` owns the Hono backend and the HTML shell.
- `src/client/main.tsx` mounts the React application.
- `src/client/App.tsx` contains the initial studio interface.
- `src/client/styles.css` contains the frontend styles and theme tokens.
- `src/simulation/` contains the framework-independent object-oriented stage simulation.
- `src/simulation/domain/stage/Stage.ts` is the canonical home for the master stage object.
- Development uses `@hono/vite-dev-server` and loads the React entry from `/src/client/main.tsx`.
- Production builds the Hono Node server and then emits the React client to `dist/static/client.js`.

The root Hono response must remain HTML. The Hono Vite dev server injects its browser reload client into HTML responses; returning plain text prevents browser reload behavior from working correctly.

## Shared project knowledge

All agents and contributors must record project-specific conventions, architectural decisions, setup requirements, and other durable implementation details in this file. Do not store repository-specific knowledge only in agent memory files or private notes; those are not available to remote contributors and future sessions working from the repository. Update this guide when a convention changes, and keep the README link to this file intact.

## Local workflow

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

`npm run build` runs both the Hono server build and the client build. `npm start` runs the generated Node server from `dist/index.js`.

## React and GSAP

Use React's current patterns and keep animation lifecycle management inside React.

- Use `@gsap/react`'s `useGSAP` hook instead of managing GSAP animations directly in `useEffect`.
- Pass a React ref as the `scope` so selectors remain local to the component.
- Rely on `useGSAP` cleanup to revert GSAP contexts when components unmount or update.
- Keep GSAP selectors aligned with the `figdev__` class namespace.
- Keep client-side behavior in the React app; use Hono for backend routes and the document shell.

## Simulation domain

- Keep simulation rules and stage state in `src/simulation/domain/`; do not place domain logic in React components or Hono route handlers.
- The master stage object belongs in `src/simulation/domain/stage/Stage.ts`.
- Add future stage elements under `src/simulation/domain/stage/entities/` and domain values under `src/simulation/domain/stage/value-objects/`.
- Add instrument sources under `src/simulation/domain/stage/entities/sources/instruments/` and microphone sources under `src/simulation/domain/stage/entities/sources/microphones/`; export them from the sources barrel.
- Add playback sources under `src/simulation/domain/stage/entities/sources/players/`; keep future stereo-file playback behavior inside `AudioPlayer` rather than the UI.
- Add system output devices under `src/simulation/domain/stage/entities/outputs/` and signal processors under `src/simulation/domain/stage/entities/processors/`; export them from their matching barrel files.
- Model speaker or headphone jacks as physical input ports even though the device is an audio-system output and uses `DeviceRole.Sink`.
- Keep the domain layer independent of React, Hono, Vite, and browser APIs.
- Put orchestration and use cases in `src/simulation/application/`; put persistence and external integrations in `src/simulation/infrastructure/`.
- Register every available device in `src/simulation/application/catalog/DeviceCatalog.ts`; the Hono `GET /api/devices` route sends frontend-safe summaries to the React sidebar.
- Do not invent or duplicate the master object API before its source implementation is provided.

## Class naming

Use BEM-style class names with the `figdev__` prefix:

- Block: `figdev__track`
- Element: `figdev__track-name`
- Modifier: `figdev__track--active`
- Animation hook: `figdev__reveal`

Every authored class in `App.tsx` and its matching selector in `styles.css` should use this namespace. Keep JSX and CSS changes synchronized.

## CSS formatting

- Use two spaces for indentation.
- Keep declarations in expanded, readable multi-line blocks.
- Preserve the existing selector and token organization unless a change requires restructuring.
- Avoid isolated hard-coded palette colors in component rules.

## Color token system

The current dark palette is controlled by one editable base color and one fixed contrast anchor:

```css
--figdev-base-color: #232c22;
--figdev-dark-base: #111411;
```

Derived tokens in `src/client/styles.css` use modern CSS color arithmetic:

- `color-mix(in oklab, ...)` derives surfaces, muted text, waveform colors, and tracks.
- `color-mix(in srgb, ...)` derives transparent borders and accent overlays.
- Relative `oklch(from var(--figdev-base-color) ...)` derives the accent hue and maintains a relationship to the base color.
- `color-scheme: dark` is currently explicit.

When changing the palette, update the base color first and let the derived tokens recalculate the theme. Keep the token structure ready for a future light/dark mode layer, but do not add a theme toggle unless the feature is requested.

## Review checklist

Before opening a pull request:

- Run `npm run typecheck`.
- Run `npm run build`.
- Confirm the Hono root route still returns HTML.
- Confirm new classes use the `figdev__` BEM namespace.
- Confirm new colors use the derived token system.
- Keep unrelated formatting and refactors out of the change.
