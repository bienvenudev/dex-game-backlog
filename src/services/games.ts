import { GameDetail, GameSummary } from "../types/game";
import { http } from "./http";

export function getGames(): Promise<GameSummary[]> {
  return http.get<GameSummary[]>("/games");
}

export function getGame(gameId: string): Promise<GameDetail> {
  return http.get<GameDetail>(`/games/${gameId}`);
}
