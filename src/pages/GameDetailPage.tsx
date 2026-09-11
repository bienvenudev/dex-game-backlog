import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getGame } from "../services/games";
import { GameDetail } from "../types/game";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false; // owned by this effect run only
    setLoading(true);
    setError(null);

    getGame(gameId!)
      .then((g) => {
        if (!ignore) setGame(g);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // Runs before the next effect run (gameId changed) and on unmount.
    return () => {
      ignore = true;
    };
  }, [gameId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!game) return <p>Game not found.</p>;

  return (
    <div>
      <h1>{game.title}</h1>
      <p>
        {game.platform} · {game.status}
      </p>
    </div>
  );
}
