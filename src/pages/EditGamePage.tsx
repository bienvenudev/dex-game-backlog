import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGame, updateGame } from "../services/games";
import { GameInput } from "../types/game";
import GameForm from "../components/GameForm";
import GameLoadError from "../components/GameLoadError";

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

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse" aria-busy>
        <div className="h-4 w-16 rounded bg-panel" />
        <div className="mt-3 mb-8 h-9 w-1/2 rounded bg-panel" />
        <div className="space-y-5">
          <div className="h-10 rounded bg-panel" />
          <div className="h-10 rounded bg-panel" />
          <div className="h-24 rounded bg-panel" />
        </div>
      </div>
    );
  }
  if (isError) return <GameLoadError error={error} />;

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
    <div className="mx-auto max-w-3xl">
      <Link to={`/games/${game.id}`} className="text-sm text-muted hover:text-ink">
        ← {game.title}
      </Link>
      <h1 className="mt-2 mb-8 text-3xl font-bold tracking-tight">Edit game</h1>
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
