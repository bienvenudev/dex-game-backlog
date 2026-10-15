import {
  GameDetail,
  GameFilters,
  GameInput,
  GameSummary,
  StatusHistoryEntry,
  StatusUpdateInput,
  StatusUpdateResponse,
} from "../types/game";
import { Paged } from "../types/api";
import { http } from "./http";

export function getGames(filters: GameFilters = {}): Promise<Paged<GameSummary>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    // false is a real filter value (hasObjectives=false); only undefined and "" mean "not set".
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return http.getPage<GameSummary>(query ? `/games?${query}` : "/games");
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

export function deleteGame(gameId: string): Promise<void> {
  return http.delete(`/games/${gameId}`);
}

export function changeStatus(
  gameId: string,
  input: StatusUpdateInput,
): Promise<StatusUpdateResponse> {
  return http.patch<StatusUpdateResponse>(`/games/${gameId}/status`, input);
}

export function getStatusHistory(gameId: string): Promise<StatusHistoryEntry[]> {
  return http.get<StatusHistoryEntry[]>(`/games/${gameId}/history`);
}
