import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteGame, getGame } from "../services/games";
import GameLoadError from "../components/GameLoadError";
import {
  addObjective,
  completeObjective,
  removeObjective,
  reopenObjective,
} from "../services/objectives";
import { GameDetail, Objective } from "../types/game";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import AddObjectiveForm from "../components/AddObjectiveForm";
import ConfirmDialog from "../components/ConfirmDialog";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
          <div className="border-b border-line">
            <h2
              id="objectives-heading"
              className="inline-block border-b-2 border-gold pb-2 text-sm font-semibold uppercase tracking-wide"
            >
              Objectives
              <span className="ml-2 font-normal text-muted">{objectiveCount}</span>
            </h2>
          </div>

          {objectiveCount === 0 ? (
            <p className="mt-6 text-sm text-muted">
              Nothing tracked yet. Add the goals you set for yourself, like a difficulty to clear
              or a boss to beat.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {game.objectives.map((objective) => (
                <ObjectiveRow
                  key={objective.id}
                  objective={objective}
                  busy={toggleMutation.isPending || removeMutation.isPending}
                  onToggle={() => toggleMutation.mutate(objective)}
                  onRemove={() => removeMutation.mutate(objective.id)}
                />
              ))}
            </ul>
          )}

          {(toggleMutation.isError || removeMutation.isError) && (
            <p role="alert" className="mt-3 text-sm text-rose-400">
              {toggleMutation.error?.message ?? removeMutation.error?.message}
            </p>
          )}

          <div className="mt-6">
            <AddObjectiveForm
              onAdd={(label) => addMutation.mutateAsync(label)}
              isPending={addMutation.isPending}
              error={addMutation.isError ? addMutation.error.message : null}
            />
          </div>
        </section>
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

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-line border-b-gold bg-panel px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gold">{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}

function ObjectiveRow({
  objective,
  busy,
  onToggle,
  onRemove,
}: {
  objective: Objective;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 py-3">
      {/* Input nested in the label: implicit association, no ids to keep in sync. */}
      <label
        className={`flex flex-1 cursor-pointer items-center gap-3 text-base ${
          objective.completed ? "text-ink/70 line-through decoration-muted/60" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={objective.completed}
          disabled={busy}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-gold"
        />
        {objective.label}
      </label>
      {objective.completedAt && (
        <span className="text-xs text-muted">{formatDate(objective.completedAt)}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove objective: ${objective.label}`}
        className="rounded p-1 text-muted opacity-0 transition-opacity hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </li>
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


function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
