import { useQuery } from "@tanstack/react-query";
import { getStatusHistory } from "../services/games";
import { STATUS_LABELS } from "../types/game";
import { formatDate } from "../utils/format";
import SectionTab from "./SectionTab";
import StatusBadge from "./StatusBadge";

// Fetches its own data so a slow or failing history never blocks the rest of the page.
// The key sits under ['games', id], so any mutation that invalidates ['games'] refreshes it.
export default function StatusHistory({ gameId }: { gameId: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["games", gameId, "history"],
    queryFn: () => getStatusHistory(gameId),
  });

  return (
    <section className="mt-12 md:ml-70" aria-labelledby="history-heading">
      <SectionTab id="history-heading" count={data?.length}>
        Status history
      </SectionTab>

      {isPending ? (
        <p className="mt-4 text-sm text-muted">Loading history…</p>
      ) : isError ? (
        <p role="alert" className="mt-4 text-sm text-rose-400">
          Couldn't load the history: {error.message}
        </p>
      ) : data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No status changes yet. Move the game to another status and it is recorded here.
        </p>
      ) : (
        <ol className="mt-2 divide-y divide-line">
          {[...data].reverse().map((entry) => (
            <li key={entry.id} className="py-3">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <StatusBadge status={entry.previousStatus} />
                <span aria-hidden>→</span>
                <span className="sr-only">changed to</span>
                <StatusBadge status={entry.newStatus} />
                <time dateTime={entry.changedAt} className="ml-1 text-muted">
                  {formatDate(entry.changedAt)}
                </time>
                <span className="sr-only">
                  , from {STATUS_LABELS[entry.previousStatus]} to {STATUS_LABELS[entry.newStatus]}
                </span>
              </p>
              {entry.comment && <p className="mt-1 text-sm text-muted">{entry.comment}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
