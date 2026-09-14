import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGame } from "../services/games";
import { EMPTY_GAME_INPUT } from "../types/game";
import GameForm from "../components/GameForm";

export default function AddGamePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: async (game) => {
      await queryClient.invalidateQueries({ queryKey: ["games"] });
      navigate(`/games/${game.id}`);
    },
  });

  return (
    <div>
      <h1>Add Game</h1>
      <GameForm
        initialValues={EMPTY_GAME_INPUT}
        onSubmit={(values) => mutation.mutate(values)}
        isPending={mutation.isPending}
        error={mutation.isError ? mutation.error.message : null}
        submitLabel="Add game"
      />
    </div>
  );
}
