import { http } from "./http";
import { Objective } from "../types/game";

export function addObjective(gameId: string, label: string): Promise<Objective> {
  return http.post<Objective>(`/games/${gameId}/objectives`, { label });
}

export function removeObjective(gameId: string, objectiveId: string): Promise<void> {
  return http.delete(`/games/${gameId}/objectives/${objectiveId}`);
}

export function completeObjective(gameId: string, objectiveId: string): Promise<Objective> {
  return http.patch<Objective>(`/games/${gameId}/objectives/${objectiveId}/complete`);
}

export function reopenObjective(gameId: string, objectiveId: string): Promise<Objective> {
  return http.patch<Objective>(`/games/${gameId}/objectives/${objectiveId}/reopen`);
}

export function renameObjective(
  gameId: string,
  objectiveId: string,
  label: string,
): Promise<Objective> {
  return http.put<Objective>(`/games/${gameId}/objectives/${objectiveId}`, { label });
}

// The body must list every objective of the game exactly once, in the new order.
export function reorderObjectives(gameId: string, objectiveIds: string[]): Promise<Objective[]> {
  return http.put<Objective[]>(`/games/${gameId}/objectives/order`, { objectiveIds });
}
