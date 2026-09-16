# Learning notes

Longer explanations of the concepts behind the choices in [decisions.md](decisions.md), written while building Dex as a training project. Where decisions.md records *what* was chosen, these notes record *why it works*. Most entries end with search terms for further reading.

## TypeScript

### `as const` arrays alongside the unions

A type union such as `Platform` vanishes at runtime, so it cannot be iterated to build a dropdown. `PLATFORMS = [...] as const` gives a runtime list whose element type is still the literal union: `PLATFORMS[number]` is `Platform`, not `string`. Without `as const`, the array would be `string[]`, and a value read from it couldn't be assigned to `Platform` without a cast. The whole value of the union is that the compiler knows the legal values; `string` throws that away.

**Search:** "as const", "derive union from array", "typeof arr[number]".

### `useParams()` returns `string | undefined`

Even with a generic like `useParams<{ gameId: string }>()`, the router can't prove at compile time that the segment is present, so it always adds `undefined`. The generic only tells it which keys to expect, for autocomplete. Pages that use `gameId` guard or assert (`gameId!`), which is safe because the route pattern guarantees the segment.

## Async and promises

### Async is contagious

A function that awaits anything can only hand a `Promise` back to its caller. There is no syntax that makes an `async` function return a plain value: `await` unwraps inside the body, but `return` wraps it back. So `getGames` returns `Promise<GameSummary[]>` and is deliberately *not* marked `async`, because `async` would only re-wrap the promise it already has. The promise is unwrapped at the top of the chain, in the component, which is also why `useState(getGames())` can't work: it would store the promise object, not the games.

### Throwing is not returning

When an `async` function throws, the promise *rejects*. The error travels down the `.catch` path and is never part of the return type. TypeScript has no "throws" annotation, so `Promise<GameSummary[] | Error>` is wrong: the return type describes the success value only.

## React

### Manual `useEffect` fetching, and the `ignore` flag

The first implementation used three pieces of state (`data`, `loading` starting `true`, `error` starting `null`), a `useEffect` calling the service with `.then` / `.catch` / `.finally`, and a render branching loading → error → empty → data.

**The bug it has.** An effect that fetches has no way to cancel itself. If its dependency changes (Detail page: `/games/1` → `/games/2`) React re-runs the effect, but the first request is still in flight. Whichever response arrives *last* calls `setGame` last and wins, even if it's the stale one. Reproduced by making game 1's mock three seconds slower than game 2: the URL said game 2, the page showed game 1.

**Why a plain check doesn't work.** Inside the `.then` callback, `gameId` is not the current URL. It is the value captured when that effect run started (a closure). The callback from run 1 will always see `"1"`, so it can't detect that the page moved on. A `console.log` inside the callback printing "arrived while URL is /games/1" even though the address bar said 2 was the proof.

**The fix.** Each effect run declares its own `let ignore = false` and returns a cleanup that sets it to `true`. React calls the cleanup right before re-running the effect for new deps, and on unmount. Because each run's callbacks close over their *own* `ignore`, run 1's late response sees `true` and skips `setState`, while run 2's `ignore` is untouched. The same closure behaviour that caused the bug is what makes the cancellation possible. Every setter is guarded, including `.finally`, because a stale run flipping `loading` to `false` while the new request is still pending would be just as wrong as writing stale data.

**Search:** React docs "Synchronizing with Effects" → "Fetching data"; "stale closure"; "race condition useEffect".

### What TanStack Query removed

Three `useState`s, the effect, the cleanup, every `!ignore` guard. `useQuery` returns `{ data, isPending, isError, error }` and the service functions were untouched, which is the service layer paying off. `data` is `T | undefined` because on the first render nothing has been fetched yet; initialising manual state to `[]` had hidden this by making "not loaded" look like "empty".

### `isPending` / `isError` narrowing, and why not `?.` everywhere

TanStack v5 types the result as a discriminated union on `status`. `if (isPending) return …; if (isError) return …;` leaves `status: 'success'`, where `data` is defined and `error` is `null`. `isLoading` is a derived boolean (`isPending && isFetching`) and doesn't participate, so with it `data` stays `T | undefined`. Optional chaining would fix one line but spreads through the JSX and hides whether the value can actually be undefined there; one narrowing check at the top proves it once.

**Search:** "discriminated union narrowing", TanStack "TypeScript" guide.

### Effect cleanup, again: `useDebounce`

`useDebounce` is a `setTimeout` inside an effect whose cleanup clears the timer. Each keystroke re-runs the effect, the cleanup cancels the previous timer, and only the final value after a 300 ms pause gets through. Same cleanup mechanism as the `ignore` flag, different job.

### Bridging imperative APIs: `useRef` + `useEffect`

`<dialog>` opens with `showModal()`, a method call, not a prop. React can't express "call this method when state changes" in JSX, so a `useRef` grabs the element and an effect calls `showModal()` or `close()` whenever the `open` prop flips. The `onClose` event (fires on Escape) calls back into React so state and DOM stay in sync. This is the standard shape for any imperative browser API.

### Resetting a form with `key`

`useState(initialValues)` reads its argument once, on first render. If the Edit page loaded a different game, the form would ignore the new values. `key={game.id}` on `<GameForm>` unmounts and remounts it with fresh state when the id changes.

**Search:** React docs "Resetting state with a key".

### Lifting state: forms own fields, pages own mutations

`AddObjectiveForm` owns only the input text. The page owns the mutation and passes `onAdd`, `isPending`, `error`. The form is reusable and testable on its own; the page stays a coordinator.

**Search:** "lifting state up", "controlled components", "callback props".

## Data layer

### Error handling end to end: `ApiError` and the retry policy

Read bottom-up, from the network to the screen.

1. **`fetch` does not throw on HTTP errors.** A 404 or 500 resolves normally with `response.ok === false`. Only network failures reject. So `http.ts` has to convert non-2xx into thrown errors, or every caller would check `ok`.

2. **What to throw.** A plain `new Error("HTTP 500")` loses the server's explanation and the status code. So:

   ```ts
   export class ApiError extends Error {
     constructor(public readonly status: number, message: string) {
       super(message);
       this.name = "ApiError";
     }
   }
   ```

   `extends Error` means it still *is* an `Error`: `.message`, `instanceof Error`, stack traces all work. `public readonly status: number` in the constructor is a TypeScript *parameter property*: declares and assigns the field in one line.

3. **Reading the message safely.** `readErrorMessage` tries `response.json()` and returns `body.message` if it's a string. The `try/catch` exists because the body may be empty or not JSON (a proxy's HTML error page) and `.json()` would throw. `response.json()` can only be called once per response, which is why it's read *before* throwing and only on the error path.

4. **Where it surfaces.** The thrown `ApiError` rejects the promise from `http.get`. Services pass it through. `useQuery` exposes it as `error`, so the page renders the server's text ("Game not found"), not a string invented by the client. `GameLoadError` goes one step further and shows a 404 layout when `error.status === 404`.

5. **The retry policy.** TanStack retries three times by default. That's wrong for a 404. `retry` accepts a function:

   ```ts
   retry: (failureCount, error) => {
     if (error instanceof ApiError && error.status < 500) return false;
     return failureCount < 1;
   }
   ```

   `error` is typed `Error`, so `.status` is only accessible after `instanceof ApiError` narrows it. 4xx: stop. Anything else, including a network `TypeError` that isn't an `ApiError` at all: one retry.

**Search:** "fetch does not reject on 404", "extending Error TypeScript", "parameter properties", TanStack "retry" option.

### `mutate` vs `mutateAsync`

`mutate(vars)` is fire-and-forget; results arrive via `onSuccess`/`onError` and it never throws. `mutateAsync(vars)` returns the promise. `AddObjectiveForm` needs to know *whether* the add succeeded before clearing its input (on a 409 the user keeps their text), so it receives `mutateAsync` and does `await onAdd(trimmed); setLabel("")`. If the promise rejects, `setLabel` never runs and the error renders under the input. Rule: `mutate` when `onSuccess` handles everything; `mutateAsync` when the caller must sequence on the result.

### Query keys as folder paths

`['games']` contains `['games', '1']` and `['games', { status: 'PLAYING' }]` the way `games/` contains `games/1`. Invalidating the prefix refetches the whole family. Invalidating only the detail key looked fine in testing because navigating back to the Library remounted its query anyway; with `staleTime` set or a fast back-navigation it would have shown old progress.

### Two shapes for one resource

`GameSummary` vs `GameDetail`: with one `Game` type and optional `objectives`, every component receiving a `Game` would have to check whether objectives were loaded, and TypeScript could not tell which case applies. Two types encode which endpoint the data came from.

## Mocks

### Handlers read the request, not the page

`new URL(request.url).searchParams` is the intercepted request's query string. `window.location.href` is the page's own address, `#/` and all, and has nothing to do with the request being mocked.

### `HttpResponse.json` accepts anything

Which is why mock responses are annotated with the contract type (`const summaries: GameSummary[]`). It's the only place a mock is checked against what the service promises; `response.json()` on the other side is `any`.

## Accessibility

### Where "2 of 5" comes from

Not from the app's code. When radios share a `name`, browsers expose them as one group, and screen readers announce each as, for example, "Playing, radio button, checked, 2 of 5". The `<legend>` adds "Filter by status" when focus first enters. The native element gives all of this for free, which is the reason to prefer it over `<button aria-pressed>`.

### Why arrows select immediately

The WAI-ARIA radio pattern says arrow keys "uncheck the previously focused button, and check the newly focused button". Selection follows focus. The Tabs pattern names the exception: when activation is slow enough to "slow focus movement". With `keepPreviousData`, focus moves instantly and the grid catches up later, so the condition is met. A confirm step would add friction to a cheap, reversible action.

### Live regions

An `aria-live="polite"` element announces *changes* to its content when the user pauses. It must exist before the change (an element that appears from nothing is often not announced), which is why the count span is always mounted and only its text changes. It fills only when data is fresh, not while `isPlaceholderData`, so a stale count is never read. Coming back to the page later isn't a "change": the count is inside the `<h1>` and is read as part of the heading like any other text.

### Contrast ratio isn't legibility

Completed objectives passed the 4.5:1 rule at about 7:1, and were still hard to read because a line through 14 px grey text destroys letter shapes regardless of ratio. Ratios are a floor, not a verdict.

### Simulators vs. screen readers

Silktide's simulator reported "No accessible text" and "Checked" on a labelled, unchecked checkbox. Orca (a real screen reader) read it correctly. Use simulators for a quick sweep, a real screen reader to confirm.

## Tooling

### pnpm and Tauri inside the VS Code snap

(The project later moved to npm, which removed the first symptom; the GTK one still applies.) The VS Code snap remaps `HOME` and injects GTK paths into its terminals. Two symptoms: pnpm's `ERR_PNPM_UNEXPECTED_STORE` (store path computed from the fake home), and Tauri's window failing with `symbol lookup error … GLIBC_PRIVATE` (GTK modules from the snap's old glibc loaded into a binary built against the system's). Fixes: run from a normal terminal, set `pnpm config set store-dir` globally, and clear `GTK_PATH`, `GTK_EXE_PREFIX`, `GIO_MODULE_DIR`, `GSETTINGS_SCHEMA_DIR`, `LOCPATH` in `terminal.integrated.env.linux`. Or install VS Code from the `.deb`.

### React Refresh and exported constants

`react-refresh/only-export-components` fails when a component file also exports a constant, because hot reload can't preserve state across that file. Constants (`EMPTY_GAME_INPUT`, `STATUS_LABELS`) moved to `types/game.ts`.
