import { useParams } from "react-router";
import { getGame } from "../services/games";
import { useQuery } from "@tanstack/react-query";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();

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
        {game.platform} · {game.status}
      </p>
    </div>
  );
}
