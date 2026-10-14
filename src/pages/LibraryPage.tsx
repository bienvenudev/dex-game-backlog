import { ReactNode, useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getGames } from "../services/games";
import { GameFilters } from "../types/game";
import { useDebounce } from "../hooks/useDebounce";
import { DEFAULT_FILTERS, hasActiveFilters } from "../utils/gameFilters";
import CardGrid from "../components/CardGrid";
import GameCard from "../components/GameCard";
import LibraryFilters from "../components/LibraryFilters";
import Pager from "../components/Pager";

// 24 divides evenly into the 2, 3, 4 and 6 column grids the card layout produces.
const PAGE_SIZE = 24;

export default function LibraryPage() {
  const [filters, setFilters] = useState<GameFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search);

  // Everything except search applies immediately; search waits for a pause in typing.
  const queryFilters: GameFilters = { ...filters, search: debouncedSearch, pageSize: PAGE_SIZE };

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["games", queryFilters],
    queryFn: () => getGames(queryFilters),
    placeholderData: keepPreviousData, // keep old list on screen while the new filter loads
  });

  // Any filter change returns to page 1; only the pager moves between pages.
  function changeFilters(patch: Partial<GameFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function clearFilters() {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      sortBy: prev.sortBy,
      sortDirection: prev.sortDirection,
    }));
  }

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0 });
  }

  const isFiltering = hasActiveFilters(filters);
  const currentPage = filters.page ?? 1;

  return (
    <div className="space-y-8">
      <LibraryFilters filters={filters} onChange={changeFilters} onClear={clearFilters} />

      <section>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          Your library{" "}
          {/* Live region: announces the new count after a filter change, since the grid itself
              updates silently. Always mounted so screen readers pick up the change. */}
          <span aria-live="polite" className="ml-2 text-base font-normal text-muted">
            {data && !isPending && !isPlaceholderData && formatCount(data.totalCount)}
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
        ) : data.items.length === 0 ? (
          currentPage > 1 ? (
            // Happens after deleting the last game on a later page.
            <Notice title="Nothing on this page">
              <button
                type="button"
                onClick={() => goToPage(1)}
                className="text-gold hover:underline"
              >
                Back to the first page
              </button>
            </Notice>
          ) : isFiltering ? (
            <Notice title="No games match">Try different filters or clear the search.</Notice>
          ) : (
            <Notice title="Your library is empty">
              <Link to="/games/new" className="text-gold hover:underline">
                Add your first game
              </Link>
            </Notice>
          )
        ) : (
          <>
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
              <CardGrid>
                {data.items.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </CardGrid>
            </div>
            <Pager
              page={currentPage}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={goToPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

function formatCount(n: number): string {
  if (n === 0) return "No games";
  return n === 1 ? "1 game" : `${n} games`;
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}
