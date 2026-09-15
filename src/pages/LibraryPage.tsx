import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getGames } from "../services/games";
import { GAME_STATUSES, GameStatus, STATUS_LABELS } from "../types/game";
import { useDebounce } from "../hooks/useDebounce";
import GameCard from "../components/GameCard";

type StatusFilter = GameStatus | "";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const debouncedSearch = useDebounce(search);

  const filters = { search: debouncedSearch, status: status || undefined };
  const isFiltering = Boolean(filters.search || filters.status);

  const { data: games, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["games", filters],
    queryFn: () => getGames(filters),
    placeholderData: keepPreviousData, // keep old list on screen while the new filter loads
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* A radio group: one Tab stop, arrow keys move between options, "2 of 5" is announced. */}
        <fieldset className="flex flex-wrap gap-2 rounded-md border border-line bg-panel p-1 text-sm font-medium">
          <legend className="sr-only">Filter by status</legend>
          <FilterPill value="" current={status} onChange={setStatus}>
            All
          </FilterPill>
          {GAME_STATUSES.map((s) => (
            <FilterPill key={s} value={s} current={status} onChange={setStatus}>
              {STATUS_LABELS[s]}
            </FilterPill>
          ))}
        </fieldset>

        {/* role="search" makes this a landmark screen readers can jump to. */}
        <div role="search" className="relative w-72">
          <label>
            <span className="sr-only">Search by title</span>
            <SearchIcon />
            <input
              type="search"
              placeholder="Find a game"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-line bg-panel py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </label>
        </div>
      </div>

      <section>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          Your library{" "}
          {/* Live region: announces the new count after a filter change, since the grid itself
              updates silently. Always mounted so screen readers pick up the change. */}
          <span aria-live="polite" className="ml-2 text-base font-normal text-muted">
            {games && !isPending && !isPlaceholderData && formatCount(games.length)}
          </span>
        </h1>

        {isPending ? (
          <CardGrid>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-2/3 rounded-sm bg-panel" />
                <div className="mt-3 h-4 w-3/4 rounded bg-panel" />
                <div className="mt-2 h-3 w-1/2 rounded bg-panel" />
              </div>
            ))}
          </CardGrid>
        ) : isError ? (
          <Notice title="Couldn't load your library">{error.message}</Notice>
        ) : games.length === 0 ? (
          isFiltering ? (
            <Notice title="No games match">Try a different status or clear the search.</Notice>
          ) : (
            <Notice title="Your library is empty">
              <Link to="/games/new" className="text-gold hover:underline">
                Add your first game
              </Link>
            </Notice>
          )
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
            <CardGrid>
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </CardGrid>
          </div>
        )}
      </section>
    </div>
  );
}

function formatCount(n: number): string {
  if (n === 0) return "No games";
  return n === 1 ? "1 game" : `${n} games`;
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-6 gap-y-8">
      {children}
    </div>
  );
}

function FilterPill({
  value,
  current,
  onChange,
  children,
}: {
  value: StatusFilter;
  current: StatusFilter;
  onChange: (value: StatusFilter) => void;
  children: React.ReactNode;
}) {
  // The radio is visually hidden but still focusable; the label is the pill and styles itself
  // from the input's state via the `has-*` variants.
  return (
    <label className="cursor-pointer rounded px-3 py-1.5 text-muted transition-colors hover:text-ink has-checked:bg-panel-raised has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold">
      <input
        type="radio"
        name="status"
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
