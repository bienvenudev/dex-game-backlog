# Dex — game backlog tracker

Frontend capstone: React 19 + TypeScript + Vite + Tauri 2, pnpm. A later C# (ASP.NET Core) backend capstone will implement the API the mocks stand in for.

## How to work with me on this project

This is a training project. I need to understand everything I ship.

- Explain the concept before any code. Snippets are minimal and illustrative; do not write full implementations unless I explicitly say "do it" / "just do it".
- Prefer pointing me at keywords, hooks and docs pages to read over solving it outright.
- One small step at a time. After each step, check my understanding with a short question.
- Design decisions with tradeoffs: present the options and reasoning, let me choose.
- I know general programming (OOP, async/await, REST). I know some React but am not fluent. Don't over-explain basics.
- Build order is fixed: (1) structure/routing, (2) functionality with mocked services and minimal styling, (3) UI polish last. Don't jump ahead to styling.
- Be concise. When I ask "be concise", cut hard.

## Commands

- `pnpm tauri dev` — run the app (also serves at http://localhost:1420 in a browser, useful for the address bar and devtools)
- `pnpm tsc --noEmit` — type-check
- `pnpm lint` — ESLint

## Architecture (see docs/decisions.md for the why, docs/learning-notes.md for the concepts)

- `src/types/` — domain types. Two game shapes: `GameSummary` (list, no objectives) and `GameDetail` (objectives + progress). `Progress.percentage` is `number | null`; null = no objectives.
- `src/services/http.ts` — fetch wrapper: base URL from `VITE_API_BASE_URL`, throws `ApiError` (carries `status`) with the server's `message`.
- `src/services/games.ts` — one function per endpoint. Components never call `fetch` or know URLs.
- `src/mocks/` — MSW handlers and in-memory data. Started only in dev from `main.tsx`. Handlers mirror the backend spec's routes and compute progress from objectives; components never compute progress.
- `src/pages/` — one component per route. Data via TanStack Query (`useQuery`, keys `['games']`, `['games', id]`). Render order: `isPending` → `isError` → empty → success, as early returns.
- `src/routes/` — `createHashRouter` (Tauri serves from a custom scheme) with a layout route and `<Outlet />`.
- `.env` holds `VITE_API_BASE_URL=/api` (gitignored; `.env.example` is committed).

## Accessibility

This app is meant to demonstrate accessibility, not just pass a linter. Every UI change must:

- Use native elements first (`<button>`, `<dialog>`, `<label>`, `<progress>`-like roles) before reaching for ARIA. ARIA only fills gaps native HTML cannot.
- Give every interactive or ARIA-role element an accessible name: visible text, `<label>`, `aria-label`, or `aria-labelledby`. Icon-only controls get `aria-label`; decorative SVGs get `aria-hidden`.
- Keep keyboard parity: everything clickable is focusable and operable with Enter/Space, focus is visible (gold outline from `index.css`), and modals trap focus (`showModal()`).
- Announce state, not just show it: `aria-pressed` on toggles, `role="alert"` for warnings and errors, `aria-valuetext` on progress bars, `disabled` on in-flight actions.
- Respect `prefers-reduced-motion` (handled globally in `index.css`) and keep text contrast at least 4.5:1 against the near-black panels.
- Run the axe linter in the editor before committing; treat its findings as build failures.

## Conventions

- Conventional commits (`feat:`, `refactor:`, `chore:`), subject under ~50 chars, body only for the non-obvious why.
- Comments explain *why*, never *what*. Business rules the type can't express get a one-line comment.
- `field: T | null` for optional API data, not `field?: T`. Dates are ISO strings.
- No `Co-Authored-By` trailers in commits.
