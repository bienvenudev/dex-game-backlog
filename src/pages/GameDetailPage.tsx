import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGame } from "../services/games";
import {
  addObjective,
  completeObjective,
  removeObjective,
  reopenObjective,
} from "../services/objectives";
import { Objective } from "../types/game";
import ProgressText from "../components/ProgressText";
import AddObjectiveForm from "../components/AddObjectiveForm";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const queryClient = useQueryClient();

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
        <Link to={`/games/${game.id}/edit`}>Edit</Link>
      </p>

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
