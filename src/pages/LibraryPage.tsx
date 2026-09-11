import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getGames } from "../services/games";
import { GameSummary } from "../types/game";

export default function LibraryPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getGames()
      .then((games) => {
        if (!ignore) setGames(games);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <h1>Library</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : games.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${game.id}`}>{game.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
