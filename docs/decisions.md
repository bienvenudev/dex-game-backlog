# Design decisions

Short records of the choices made while building Dex and the reasoning behind them. Each entry is a decision, its alternative, and why. The longer explanations written while learning the underlying concepts live in [learning-notes.md](learning-notes.md).

## Domain model

### Two game shapes instead of one `Game` with optional objectives

`GameSummary` (Library list, no objectives) and `GameDetail` (objectives + progress) are separate interfaces sharing a non-exported `GameBase`. The compiler then knows which endpoint the data came from. A single type with `objectives?: Objective[]` would force every consumer to check whether objectives were loaded. Mirrors the backend spec, whose list endpoint must not return objectives.

### Objectives are their own resource

Each objective carries a `gameId`. Matches the backend's `/api/games/{id}/objectives` routes and lets a single objective be ticked without re-saving the whole game.

### `Progress.percentage` is `number | null`

`null` means "no objectives", distinct from `0` meaning "none ticked yet". Progress is computed by the (mock) server; components only display it. This is what keeps the Library and the detail page consistent.

### `field: T | null` instead of `field?: T` for optional data

The JSON API sends `"rating": null` explicitly. `T | null` matches that. `?:` would mean the key may be absent, a different contract.

### Dates are ISO strings, not `Date`

That's what arrives over JSON. Convert at display time.

### Business rules stay out of the type system

"Rating only when not UNPLAYED" is enforced by the form and the backend, not by a discriminated union. Encoding it in types is possible but makes forms and mocks awkward for little gain.

### `coverUrl` and `backgroundUrl` were added to the contract

Neither spec has image fields. Added as `string | null` on the game so the UI can show cover art and a hero banner; the backend capstone will add the columns. Alternative rejected: a frontend-only lookup keyed by title, which would be a hack to remove later.

## Mocking

### MSW over hand-rolled mock functions

Services use real `fetch` against `/api/...` from day one. [Mock Service Worker](https://mswjs.io/) handlers in `src/mocks/` answer them with a delay and in-memory data. When the backend exists, the handlers are removed and `VITE_API_BASE_URL` changes; service code is untouched. Cost: one dependency and a one-time worker setup. The mocked app runs under `tauri dev` only, because service workers may not register on Tauri's packaged custom scheme.

### The mock store is a database, not canned responses

`data.ts` holds two arrays shaped like the backend's tables: games without `progress`, and objectives with a `gameId`. Handlers assemble responses the way the C# controllers will: filter, compute, return a DTO. `computeProgress(gameId)` is the single source of truth.

### Handlers enforce the backend's rules and are typed against the contract

`POST /games` returns 400 on validation and 409 on a duplicate title + platform; `POST /objectives` 400 on an empty label and 409 on a duplicate label; `PUT` clears the rating when status returns to `UNPLAYED`; `DELETE` cascades and returns 204. Response objects are annotated (`const summaries: GameSummary[]`) so a mock can't drift from the service's types. This means every UI error path is exercised now, not when the real backend arrives.

### Handlers read the request, not the page URL

`new URL(request.url).searchParams` is the intercepted request's query string. `window.location` is the page's own hash URL and unrelated.

## Data fetching

### A two-file service layer: `http.ts` and per-resource modules

`http.ts` knows *how* to talk to the server: base URL from `.env`, JSON, and turning non-2xx into a thrown `ApiError` carrying `status` and the server's `message`. `games.ts` and `objectives.ts` know *what* the API offers, one typed function per endpoint. Components call those only. Adding an auth header later touches one file; components never see a URL.

### TanStack Query over hand-written `useEffect` fetching

The first implementation used `useEffect` with `data`/`loading`/`error` state and an `ignore` flag for cleanup. It worked and is kept in history as a learning step. It was replaced because every page needed the same boilerplate, and because keyed caching makes the stale-response race impossible by construction: a late response updates the *old* key's entry and never reaches the screen. The React docs themselves recommend a library or a hand-built cache over raw effects.

### Query keys are hierarchical

`['games']` is the prefix for `['games', id]` and `['games', { search, status }]`. After any mutation, `invalidateQueries({ queryKey: ['games'] })` refreshes the list *and* every detail page in one call. Invalidating only `['games', id]` looked fine in testing but would leave a filtered list stale under `staleTime` or fast back-navigation.

### `isPending` / `isError` for narrowing

TanStack v5 types the result as a discriminated union on `status`. Early-returning on `isPending` then `isError` narrows `data` to defined and `error` to `null`, so no `!data` guards or `?.` chains follow. `isLoading` does not narrow.

### Retry policy: never on 4xx

Default is three retries with backoff. A 404 or 409 won't change on retry, so the `QueryClient` uses a `retry` function: `false` for `ApiError` under 500, one retry otherwise.

### Early returns vs. ternaries, decided per page

Early returns read as a checklist (pending, error, empty, success) and are used on Detail and Edit. The Library uses a ternary because the search box and filters must stay visible while loading, otherwise a filter that returns nothing could not be cleared.

## Search and filter

### Filters go through the query key

`queryKey: ['games', { search, status }]`. Each combination is its own cache entry. TanStack compares keys structurally, so a fresh object each render still matches.

### Debounce plus `keepPreviousData`

A new key per keystroke means a request per keystroke, so the search text is debounced (300 ms). `placeholderData: keepPreviousData` keeps the old grid on screen while the new key loads; `isPlaceholderData` dims it. Cost: for a moment the list may not match the input.

### Two empty messages, one guess

"No games match your filters" vs "Your library is empty" is chosen by whether a filter is active. Filtering an empty library shows the first. Correct would need the unfiltered total (the backend's dashboard summary); not worth a second request.

## Mutations

### `useMutation` + invalidate, never manual cache edits

`onSuccess` returns the `invalidateQueries` promise so `isPending` stays true until fresh data is on screen. Optimistic updates were not needed at this scale.

### `mutateAsync` only where the caller must sequence on the result

`AddObjectiveForm` clears its input only after a successful add (on a 409 the user keeps their text), so it receives `mutateAsync`. Everywhere else `mutate` is used.

### Forms own their fields; pages own the mutation

`GameForm` and `AddObjectiveForm` hold field state and cross-field rules and receive `onSubmit`/`onAdd`, `isPending`, `error`. Pages decide what submitting means. Add and Edit share `GameForm` unchanged; Edit passes `key={game.id}` so a different game remounts the form.

### Rating is disabled, not hidden, on `UNPLAYED`

Disabled with a hint keeps the layout stable and teaches the rule; hidden would make the field undiscoverable. Changing status to `UNPLAYED` also clears the rating client-side, matching what the backend does.

### Delete confirmation is a native `<dialog>`

`showModal()` gives a backdrop and focus trap for free. Escape and backdrop click both cancel. A headless UI library was considered and rejected: nothing here needs what HTML lacks.

## Routing

### `createHashRouter` over `createBrowserRouter`

The packaged Tauri build serves files from a custom protocol, not a web server, so a reload on a nested path may not resolve to `index.html`. Hash URLs never leave the page. Nobody sees the URL bar in a desktop app. Switching is a one-word change.

### Layout route and a catch-all

A parent route with no `path` renders `AppLayout` once; children appear at `<Outlet />`. `path: "*"` renders the not-found page inside the layout instead of the router's default error screen.

## Styling

### Tailwind v4 with role-named tokens

Colours are named by role in `@theme` (`canvas`, `panel`, `line`, `ink`, `muted`, `gold`) so classes read `bg-panel text-muted`, not hex values. One typeface (Space Grotesk, self-hosted so the Tauri window works offline). Visual direction is inspired by play-this.com (layout patterns, not assets or branding): near-black chrome, one gold accent, cover art as the only saturated element.

### Hero banner without a new field, then with one

First version blurred and scaled the portrait cover. `backgroundUrl` was added afterwards for Steam's wide `library_hero.jpg`; the blurred portrait remains the fallback.

## Accessibility

To verify any of this: start Orca (`orca`, or Super+Alt+S on GNOME) and open the app in Firefox at <http://localhost:1420>; or open Firefox DevTools → Accessibility, or Chrome DevTools → Accessibility pane, and click an element to see the Name, Role and State a screen reader gets.

### Status filter is a native radio group

Five pills, exactly one selected: a radio group. Each pill is a `<label>` wrapping a visually hidden `<input type="radio" name="status">` inside a `<fieldset>` with a screen-reader-only `<legend>`. The label styles itself from the input via Tailwind's `has-checked:` and `has-focus-visible:`. Result, all from the browser: one Tab stop, arrow keys move and select, "Playing, radio button, checked, 2 of 5" announced. Rejected: `<button aria-pressed>` per pill (five Tab stops, no grouping) and Headless UI (a dependency for something HTML already does).

**To reproduce.** Shift+Tab out of the search box: focus lands on the *selected* pill. Arrow keys move the selection and refilter. One Tab leaves the whole group.

### Arrow keys apply the filter immediately

Per the [WAI-ARIA Authoring Practices radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), arrow keys "uncheck the previously focused button, and check the newly focused button". Selection follows focus by definition. The documented exception (Tabs pattern) is activation slow enough to "slow focus movement"; here focus moves instantly and `keepPreviousData` keeps the old grid up while the fetch completes.

### Result count is a live region

The count next to "Your library" is `<span aria-live="polite">`, always mounted, filled only when fresh data arrives (not while `isPlaceholderData`). After an arrow press a screen reader hears "4 games" with no focus change. Wording: "No games", "1 game", "12 games".

### Search is a landmark; no submit button

`role="search"` on the wrapper makes it jumpable. Search-as-you-type does not violate WCAG 3.2.2 (On Input): refiltering in place is not a change of context. The live region provides the "results changed" feedback. A flush-on-Enter variant was tried and removed as more code than the gain justified.

### Confirm dialog: Escape and backdrop both cancel

A click whose `target` is the `<dialog>` itself can only be the backdrop, so it cancels; padding lives on an inner `div` so the box has no clickable margin. `onClose` (Escape) also cancels, keeping React state in sync. `aria-labelledby`/`aria-describedby` point at the heading and message via `useId`. Focus is trapped by `showModal()`.

### Accessible names carry context

"Edit" and "Delete" on the detail page are read as "Edit Hollow Knight" via a `sr-only` suffix. "Add some" became "Add notes". Icon-only remove buttons have `aria-label="Remove objective: …"`. Objective checkboxes are nested inside their `<label>`.

### Strike-through contrast

Completed objectives were 14 px muted grey with a line through: the ratio passed (about 7:1) but the line made them hard to read. Now 16 px, main text colour at 70% opacity, softer line colour.

### Applied everywhere

Progress bars have `role="progressbar"`, `aria-label` and `aria-valuetext` ("1 of 3 objectives"). Warnings and errors are `role="alert"`; invalid inputs set `aria-invalid` and `aria-describedby`. Decorative artwork is `alt=""`/`aria-hidden`. Gold `:focus-visible` outlines. `prefers-reduced-motion` disables transitions globally.

### Known limitations (deliberate)

Left as-is because the fix adds more code than the capstone justifies. Each names the cheap fix.

- **Search has no explicit submit.** Fix: `<form role="search">` whose submit applies the text immediately.
- **The live region reads only the count**, not the active filter. Fix: include the status label in the text.
- **"No games match your filters" is a guess** when the library itself is empty. Fix: fetch the unfiltered total.
- **Artwork is `alt=""`** because the title is always adjacent as text. Needs a real `alt` if art ever carries information the text doesn't.
- **No skip link.** The header has three focusable items, so content is three Tabs away. Fix: a hidden "Skip to content" link first in the DOM.
- **Badge colours** (gold, green, rose) aren't distinguishable for every colour-vision deficiency. Acceptable because the label is always present.
- **Screen-reader simulators can misreport.** Silktide once showed "Checked" on an unchecked box.
- **`<dialog>` with `showModal()`** needs a 2022+ webview. Fine on Tauri 2 with current OSes.

**References.** [WAI-ARIA APG: Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) · [WAI-ARIA APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) · [WCAG 2.2: On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html) · [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) · [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) · [MDN: search role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role) · [Making search & filters accessible](https://theadminbar.com/accessibility-weekly/accessible-search-and-filter/) · [UXPin: filter UI best practices](https://www.uxpin.com/studio/blog/filter-ui-and-ux/) · [VA.gov: when a screen reader needs to announce content](https://design.va.gov/accessibility/when-a-screen-reader-needs-to-announce-content) · [Orca screen reader](https://help.gnome.org/users/orca/stable/)

## Tooling

### ESLint flat config with TypeScript, React hooks, React Refresh and TanStack Query plugins

The React Refresh rule (`only-export-components`) caught constants exported from component files twice; those constants now live in `types/game.ts`.

### npm over pnpm

Development started on pnpm. A fresh Windows clone with only npm failed on `beforeDevCommand: "pnpm dev"`, and a missing `.env` produced a cryptic JSON parse error. Two fixes: the project moved to npm, since every reviewer already has it and speed on one developer's machine matters less than zero-friction cloning; and the API base URL defaults to `/api` in code. Rule: a setup step a human can skip will be skipped; defaults live in code, docs describe the exception.

### Conventional commits, one concern per commit

`type: imperative verb`, lowercase first word, proper nouns keep their casing, under about 55 characters. Contract changes (new fields) are committed separately from the UI that uses them.
