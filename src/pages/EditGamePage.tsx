import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGame, updateGame } from "../services/games";
import { GameInput } from "../types/game";
import GameForm from "../components/GameForm";

export default function EditGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: game, isPending, isError, error } = useQuery({
    queryKey: ["games", gameId],
    queryFn: () => getGame(gameId!),
  });

  const mutation = useMutation({
    mutationFn: (values: GameInput) => updateGame(gameId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["games"] });
      navigate(`/games/${gameId}`);
    },
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;

  const initialValues: GameInput = {
    title: game.title,
    platform: game.platform,
    status: game.status,
    rating: game.rating,
    notes: game.notes,
    coverUrl: game.coverUrl,
    backgroundUrl: game.backgroundUrl,
  };
  const outstanding = game.objectives.filter((o) => !o.completed).length;

  return (
    <div>
      <h1>Edit Game</h1>
      <GameForm
        // key forces a fresh form if the loaded game changes; useState only reads initialValues once
        key={game.id}
        initialValues={initialValues}
        onSubmit={(values) => mutation.mutate(values)}
        isPending={mutation.isPending}
        error={mutation.isError ? mutation.error.message : null}
        submitLabel="Save changes"
        outstandingObjectives={outstanding}
      />
    </div>
  );
}
