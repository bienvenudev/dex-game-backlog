import { GameDetail, GameInput, GameStatus, GameSummary } from "../types/game";
import { http } from "./http";

export interface GameFilters {
  search?: string;
  status?: GameStatus;
}

export function getGames(filters: GameFilters = {}): Promise<GameSummary[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return http.get<GameSummary[]>(query ? `/games?${query}` : "/games");
}

export function getGame(gameId: string): Promise<GameDetail> {
  return http.get<GameDetail>(`/games/${gameId}`);
}

export function createGame(input: GameInput): Promise<GameSummary> {
  return http.post<GameSummary>("/games", input);
}

export function updateGame(gameId: string, input: GameInput): Promise<GameSummary> {
  return http.put<GameSummary>(`/games/${gameId}`, input);
}
