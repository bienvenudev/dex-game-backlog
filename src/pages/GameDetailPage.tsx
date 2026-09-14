import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteGame, getGame } from "../services/games";
import {
  addObjective,
  completeObjective,
  removeObjective,
  reopenObjective,
} from "../services/objectives";
import { Objective } from "../types/game";
import ProgressText from "../components/ProgressText";
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

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>{game.title}</h1>
      <p>
        {game.platform} · {game.status} · <ProgressText progress={game.progress} />
      </p>
      <p>Rating: {game.rating ?? "—"}</p>
      {game.notes && <p>{game.notes}</p>}
      <p>
        <Link to={`/games/${game.id}/edit`}>Edit</Link>{" "}
        <button type="button" onClick={() => setConfirmingDelete(true)}>
          Delete
        </button>
      </p>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${game.title}?`}
        message={`This will permanently delete the game and its ${game.objectives.length} objective${
          game.objectives.length === 1 ? "" : "s"
        }.`}
        confirmLabel="Delete game"
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmingDelete(false)}
      />

      <h2>Objectives</h2>
      {game.objectives.length === 0 && <p>No objectives yet.</p>}
      <ul>
        {game.objectives.map((objective) => (
          <li key={objective.id}>
            <label>
              <input
                type="checkbox"
                checked={objective.completed}
                disabled={toggleMutation.isPending}
                onChange={() => toggleMutation.mutate(objective)}
              />{" "}
              {objective.label}
            </label>{" "}
            <button
              type="button"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate(objective.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {toggleMutation.isError && <p>Error: {toggleMutation.error.message}</p>}
      {removeMutation.isError && <p>Error: {removeMutation.error.message}</p>}

      <AddObjectiveForm
        onAdd={(label) => addMutation.mutateAsync(label)}
        isPending={addMutation.isPending}
        error={addMutation.isError ? addMutation.error.message : null}
      />
    </div>
  );
}
