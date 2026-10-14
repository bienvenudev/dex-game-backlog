import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeStatus, deleteGame, getGame } from "../services/games";
import GameLoadError from "../components/GameLoadError";
import {
  addObjective,
  completeObjective,
  removeObjective,
  renameObjective,
  reopenObjective,
  reorderObjectives,
} from "../services/objectives";
import { GameDetail, Objective, StatusUpdateInput } from "../types/game";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import AddObjectiveForm from "../components/AddObjectiveForm";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusControl from "../components/StatusControl";
import StatusHistory from "../components/StatusHistory";
import ObjectiveRow from "../components/ObjectiveRow";
import SectionTab from "../components/SectionTab";
import Stat from "../components/Stat";
import { formatDate } from "../utils/format";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Set from the server's answer, not guessed client-side; cleared on the next change.
  const [finishedWithOutstanding, setFinishedWithOutstanding] = useState(false);
  // Read out by a screen reader after a reorder, because the moved row may lose focus.
  const [announcement, setAnnouncement] = useState("");

  const invalidateGames = () => queryClient.invalidateQueries({ queryKey: ["games"] });

  const toggleMutation = useMutation({
    mutationFn: (objective: Objective) =>
      objective.completed
        ? reopenObjective(gameId!, objective.id)
        : completeObjective(gameId!, objective.id),
    onSuccess: invalidateGames,
  });

  const addMutation = useMutation({
    mutationFn: (label: string) => addObjective(gameId!, label),
    onSuccess: invalidateGames,
  });

  const removeMutation = useMutation({
    mutationFn: (objectiveId: string) => removeObjective(gameId!, objectiveId),
    onSuccess: invalidateGames,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      renameObjective(gameId!, id, label),
    onSuccess: invalidateGames,
  });

  const reorderMutation = useMutation({
    mutationFn: (objectiveIds: string[]) => reorderObjectives(gameId!, objectiveIds),
    onSuccess: invalidateGames,
  });

  const statusMutation = useMutation({
    mutationFn: (input: StatusUpdateInput) => changeStatus(gameId!, input),
    onMutate: () => setFinishedWithOutstanding(false),
    onSuccess: async (response) => {
      setFinishedWithOutstanding(response.hasOutstandingObjectives);
      await invalidateGames();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(gameId!),
    onSuccess: async () => {
      // Drop this detail from the cache so nothing refetches a game that no longer exists.
      queryClient.removeQueries({ queryKey: ["games", gameId] });
      await queryClient.invalidateQueries({ queryKey: ["games"] });
      navigate("/");
    },
  });

  const { data: game, isPending, isError, error } = useQuery({
    queryKey: ["games", gameId],
    queryFn: () => getGame(gameId!),
  });

  if (isPending) return <DetailSkeleton />;
  if (isError) return <GameLoadError error={error} />;

  const objectiveCount = game.objectives.length;
  const objectivesBusy =
    toggleMutation.isPending ||
    removeMutation.isPending ||
    renameMutation.isPending ||
    reorderMutation.isPending;

  // Swap with the neighbour and send the whole new order; the backend wants every id exactly once.
  function moveObjective(index: number, direction: -1 | 1) {
    const target = index + direction;
    const ids = game!.objectives.map((o) => o.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const label = game!.objectives[index].label;
    reorderMutation.mutate(ids, {
      onSuccess: () => setAnnouncement(`${label} moved to position ${target + 1} of ${ids.length}`),
    });
  }

  return (
    <>
      <Hero backgroundUrl={game.backgroundUrl} coverUrl={game.coverUrl} />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="-mt-40 space-y-3">
            <Cover game={game} />
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/games/${game.id}/edit`}
                className="rounded-md border border-line bg-panel py-2 text-center text-sm font-medium hover:border-gold hover:text-gold transition-colors"
              >
                Edit<span className="sr-only"> {game.title}</span>
              </Link>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md border border-rose-500/40 bg-panel py-2 text-sm font-medium text-rose-400 hover:border-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                Delete<span className="sr-only"> {game.title}</span>
              </button>
            </div>
          </aside>

          <div className="space-y-6 pt-2">
            <div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight">{game.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-gold">{game.platform}</span>
                <StatusBadge status={game.status} />
                <span className="text-muted">Added {formatDate(game.createdAt)}</span>
              </div>
            </div>

            <StatusControl
              key={game.status}
              currentStatus={game.status}
              onChange={(input) => statusMutation.mutateAsync(input)}
              isPending={statusMutation.isPending}
              error={statusMutation.isError ? statusMutation.error.message : null}
            />

            {finishedWithOutstanding && (
              <p role="alert" className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
                Marked as finished with {game.progress.total - game.progress.completed} objective
                {game.progress.total - game.progress.completed === 1 ? "" : "s"} still unticked.
              </p>
            )}

            {game.notes ? (
              <p className="max-w-prose text-muted">{game.notes}</p>
            ) : (
              <p className="text-sm text-muted">
                No notes yet.{" "}
                <Link to={`/games/${game.id}/edit`} className="text-gold hover:underline">
                  Add notes
                </Link>
              </p>
            )}

            <dl className="grid gap-4 sm:grid-cols-3">
              <Stat label="Your rating">
                {game.rating !== null ? (
                  <>
                    <span className="text-4xl font-bold">{game.rating}</span>
                    <span className="ml-1 text-sm text-muted">/ 10</span>
                  </>
                ) : (
                  <span className="text-sm text-muted">
                    {game.status === "UNPLAYED" ? "Rate it once you start" : "Not rated yet"}
                  </span>
                )}
              </Stat>
              <Stat label="Progress">
                {game.progress.percentage !== null ? (
                  <>
                    <span className="text-4xl font-bold">{game.progress.percentage}</span>
                    <span className="ml-1 text-sm text-muted">%</span>
                    <div className="mt-2">
                      <ProgressBar progress={game.progress} />
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted">Add objectives to track it</span>
                )}
              </Stat>
              <Stat label={game.finishedAt ? "Finished" : "Started"}>
                <span className="text-lg font-semibold">
                  {formatDate(game.finishedAt ?? game.startedAt) ?? (
                    <span className="text-sm font-normal text-muted">Not started</span>
                  )}
                </span>
              </Stat>
            </dl>
          </div>
        </div>

        <section className="mt-12 md:ml-70" aria-labelledby="objectives-heading">
          <SectionTab id="objectives-heading" count={objectiveCount}>
            Objectives
          </SectionTab>

          {objectiveCount === 0 ? (
            <p className="mt-6 text-sm text-muted">
              Nothing tracked yet. Add the goals you set for yourself, like a difficulty to clear
              or a boss to beat.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {game.objectives.map((objective, index) => (
                <ObjectiveRow
                  key={objective.id}
                  objective={objective}
                  index={index}
                  count={objectiveCount}
                  busy={objectivesBusy}
                  onToggle={() => toggleMutation.mutate(objective)}
                  onRemove={() => removeMutation.mutate(objective.id)}
                  onMove={(direction) => moveObjective(index, direction)}
                  onRename={(label) => renameMutation.mutateAsync({ id: objective.id, label })}
                />
              ))}
            </ul>
          )}

          {(toggleMutation.isError || removeMutation.isError || reorderMutation.isError) && (
            <p role="alert" className="mt-3 text-sm text-rose-400">
              {toggleMutation.error?.message ??
                removeMutation.error?.message ??
                reorderMutation.error?.message}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>

          <div className="mt-6">
            <AddObjectiveForm
              onAdd={(label) => addMutation.mutateAsync(label)}
              isPending={addMutation.isPending}
              error={addMutation.isError ? addMutation.error.message : null}
            />
          </div>
        </section>

        <StatusHistory gameId={game.id} />
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${game.title}?`}
        message={`This permanently deletes the game and its ${objectiveCount} objective${
          objectiveCount === 1 ? "" : "s"
        }.`}
        confirmLabel="Delete game"
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}

function Hero({
  backgroundUrl,
  coverUrl,
}: {
  backgroundUrl: string | null;
  coverUrl: string | null;
}) {
  // Breaks out of the layout's padded column so the banner runs edge to edge.
  return (
    <div aria-hidden className="relative -mx-6 -mt-8 h-80 overflow-hidden bg-panel">
      {backgroundUrl ? (
        <img src={backgroundUrl} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        coverUrl && (
          // No wide art: fall back to the portrait, blown up and blurred.
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full scale-125 object-cover object-top opacity-60 blur-xl"
          />
        )
      )}
      <div className="absolute inset-0 bg-linear-to-b from-canvas/10 via-canvas/50 to-canvas" />
    </div>
  );
}

function Cover({ game }: { game: GameDetail }) {
  return (
    <div className="aspect-2/3 overflow-hidden rounded-sm border-2 border-gold bg-panel shadow-[0_0_32px_rgba(242,184,7,0.25)]">
      {game.coverUrl ? (
        <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-end bg-linear-to-t from-panel-raised to-panel p-4">
          <span className="text-xl font-bold leading-tight text-muted">{game.title}</span>
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy>
      <div className="-mx-6 -mt-8 h-72 bg-panel" />
      <div className="grid gap-10 md:grid-cols-[240px_1fr]">
        <div className="-mt-40 aspect-2/3 rounded-sm bg-panel-raised" />
        <div className="space-y-4 pt-2">
          <div className="h-10 w-2/3 rounded bg-panel" />
          <div className="h-4 w-1/3 rounded bg-panel" />
          <div className="h-16 w-full rounded bg-panel" />
        </div>
      </div>
    </div>
  );
}
