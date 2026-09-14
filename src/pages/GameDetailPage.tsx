import { useParams } from "react-router";
import { getGame } from "../services/games";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProgressText from "../components/ProgressText";
import { reopenObjective, completeObjective } from "../services/objectives";
import { Objective } from "../types/game";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (objective: Objective) => {
      if (objective.completed) {
        return reopenObjective(gameId!, objective.id);
      } else {
        return completeObjective(gameId!, objective.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
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
      <ul>
        {game.objectives.map((objective) => (
          <li key={objective.id}>
            <input
              type="checkbox"
              checked={objective.completed}
              onChange={() => mutation.mutate(objective)}
              style={{ cursor: "pointer", marginRight: "8px" }}
            />
            {objective.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
