import { Link, useNavigate } from "react-router";
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
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="text-sm text-muted hover:text-ink">
        ← Library
      </Link>
      <h1 className="mt-2 mb-8 text-3xl font-bold tracking-tight">Add a game</h1>
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
