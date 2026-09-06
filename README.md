# Live Audio Simulator

Minimal Hono application powered by Vite and Hono's Vite tooling.

## Setup

```sh
npm install
npm run dev
```

The development server exposes the Hono app at `http://localhost:5173`.

## Scripts

- `npm run dev` starts Vite with the Hono development server.
- `npm run build` creates the Hono server build and the React client bundle.
- `npm start` runs the built Node.js server.
- `npm run typecheck` runs TypeScript without emitting files.

The initial routes are `/` and `/health` in `src/index.ts`.

## Contributors

The detailed contributor guide is in [CONTRIBUTING.md](CONTRIBUTING.md). It covers the Hono and React architecture, GSAP lifecycle practices, `figdev__` BEM naming, CSS formatting, the derived color-token system, and the validation checklist.

### Architecture

- Hono is the backend and owns the HTML shell in `src/index.ts`.
- React is the frontend SPA. The development client starts at `src/client/main.tsx` and the production client is emitted as `dist/static/client.js`.
- Keep the Hono root response as HTML so `@hono/vite-dev-server` can inject its browser reload client.
- `npm run build` builds the Hono Node server first, then the React client with `vite build --mode client`.

### React and GSAP

- Use `@gsap/react`'s `useGSAP` hook for React animations rather than managing GSAP effects directly in `useEffect`.
- Scope animations with a React ref and use `gsap.context()` behavior provided by `useGSAP` so animations are reverted during cleanup.
- Keep animation selectors aligned with the `figdev__` class namespace.

### CSS conventions

- Use two spaces for indentation and keep CSS declarations expanded into readable multi-line blocks.
- Use BEM-style class names with the `figdev__` prefix. Blocks and elements use names such as `figdev__track` and `figdev__track-name`; state modifiers use names such as `figdev__track--active`.
- Define the palette from `--figdev-base-color: #232c22` and retain `--figdev-dark-base: #111411` as the dark contrast anchor.
- Derive surface, text, border, accent, waveform, and track colors with modern `color-mix()` and relative `oklch()` calculations instead of adding isolated hex values.
- The current mode is explicitly `color-scheme: dark`. Keep the token structure ready for a future light/dark mode layer without adding a toggle yet.
