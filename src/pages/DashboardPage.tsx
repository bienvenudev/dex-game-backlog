import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../services/dashboard";
import { GAME_STATUSES, STATUS_LABELS } from "../types/game";
import CardGrid from "../components/CardGrid";
import ErrorState from "../components/ErrorState";
import GameCard from "../components/GameCard";
import Stat from "../components/Stat";

export default function DashboardPage() {
  // Under the ['games'] prefix on purpose: any game mutation that invalidates ['games']
  // also marks this stale, so the numbers never lag behind the Library.
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["games", "dashboard"],
    queryFn: getDashboardSummary,
  });

  if (isPending) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load the dashboard"
        message={error.message}
        actionTo="/"
        actionLabel="Back to library"
      />
    );
  }
  if (data.totalGames === 0) {
    return (
      <ErrorState
        title="Nothing to summarise yet"
        message="Add a game and your totals show up here."
        actionTo="/games/new"
        actionLabel="Add a game"
      />
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total games">
          <span className="text-4xl font-bold">{data.totalGames}</span>
        </Stat>
        <Stat label="Fully complete">
          <span className="text-4xl font-bold">{data.fullyCompleteGames}</span>
        </Stat>
        <Stat label="No objectives">
          <span className="text-4xl font-bold">{data.gamesWithNoObjectives}</span>
        </Stat>
        <Stat label="Average rating">
          {data.averageRating !== null ? (
            <>
              <span className="text-4xl font-bold">{data.averageRating.toFixed(1)}</span>
              <span className="ml-1 text-sm text-muted">/ 10</span>
            </>
          ) : (
            <span className="text-sm text-muted">No ratings yet</span>
          )}
        </Stat>
      </dl>

      <section aria-labelledby="by-status-heading">
        <h2 id="by-status-heading" className="mb-4 text-lg font-bold">
          By status
        </h2>
        <ul className="max-w-xl space-y-3">
          {GAME_STATUSES.map((status) => {
            const count = data.gamesByStatus[status] ?? 0;
            return (
              <li key={status} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span>{STATUS_LABELS[status]}</span>
                {/* The count is the information; the bar is only a visual aid. */}
                <div aria-hidden className="h-2 overflow-hidden rounded-full bg-panel-raised">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${(count / data.totalGames) * 100}%` }}
                  />
                </div>
                <span className="text-right tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-4 text-lg font-bold">
          Recently updated
        </h2>
        <CardGrid>
          {data.recentlyUpdatedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </CardGrid>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-10" aria-busy>
      <div className="h-8 w-40 rounded bg-panel" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-sm bg-panel" />
        ))}
      </div>
      <div className="h-32 max-w-xl rounded-sm bg-panel" />
    </div>
  );
}
