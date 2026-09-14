import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getGames } from "../services/games";
import { GAME_STATUSES, GameStatus } from "../types/game";
import { useDebounce } from "../hooks/useDebounce";
import ProgressText from "../components/ProgressText";

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GameStatus | "">("");
  const debouncedSearch = useDebounce(search);

  const filters = { search: debouncedSearch, status: status || undefined };
  const isFiltering = Boolean(filters.search || filters.status);

  const { data: games, isPending, isError, error } = useQuery({
    queryKey: ["games", filters],
    queryFn: () => getGames(filters),
    placeholderData: keepPreviousData, // keep old list on screen while the new filter loads
  });

  return (
    <div>
      <h1>Game Library</h1>

      <input
        type="search"
        placeholder="Search by title"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value as GameStatus | "")}>
        <option value="">All statuses</option>
        {GAME_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {isPending ? (
        <p>Loading...</p>
      ) : isError ? (
        <p>Error: {error.message}</p>
      ) : games.length === 0 ? (
        <p>{isFiltering ? "No games match your filters." : "No games yet. Add one to get started."}</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${game.id}`}>{game.title}</Link> · {game.platform} ·{" "}
              {game.status} · <ProgressText progress={game.progress} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
