import { http } from "./http";
import { Objective } from "../types/game";

export function completeObjective(gameId: string, objectiveId: string): Promise<Objective> {
  return http.patch<Objective>(`/games/${gameId}/objectives/${objectiveId}/complete`);
}

export function reopenObjective(gameId: string, objectiveId: string): Promise<Objective> {
  return http.patch<Objective>(`/games/${gameId}/objectives/${objectiveId}/reopen`);
}