import { GameSummary } from "../types/game";
import { http } from "./http";

export function getGames(): Promise<GameSummary[]> {
  return http.get<GameSummary[]>("/games");
}
