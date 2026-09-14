import { Link } from "react-router";
import { getGames } from "../services/games";
import { useQuery } from "@tanstack/react-query";
import ProgressText from "../components/ProgressText";

export default function LibraryPage() {
  const { data: games, isPending, isError, error } = useQuery({
    queryKey: ["games"],
    queryFn: getGames,
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error: {error.message}</p>;
  if (games.length === 0) return <p>No games yet. Add one to get started.</p>;

  return (
    <div>
      <h1>Game Library</h1>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            <Link to={`/games/${game.id}`}>{game.title}</Link> · {game.platform} ·{" "}
            {game.status} · <ProgressText progress={game.progress} />
          </li>
        ))}
      </ul>
    </div>
  );
}
