import { delay, http, HttpResponse } from "msw";
import { mockGames, mockObjectives } from "./data";
import { GameDetail, GameSummary, Progress } from "../types/game";

function computeProgress(gameId: string): Progress {
  const gameObjectives = mockObjectives.filter((o) => o.gameId === gameId);
  const completed = gameObjectives.filter(
    (o) => o.completed).length;
  const total = gameObjectives.length;
  const percentage = total === 0 ? null : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percentage,
  };
}

export const handlers = [
  http.all("*", async () => {
    await delay(1000);
  }),

  http.get("/api/games", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.toLowerCase();
    const status = params.get("status");

    const summaries: GameSummary[] = mockGames
      .filter((game) => !search || game.title.toLowerCase().includes(search))
      .filter((game) => !status || game.status === status)
      .map((game) => ({
        ...game,
        progress: computeProgress(game.id),
      }));

    return HttpResponse.json(summaries);
  }),

  http.get("/api/games/:gameId", ({ params }) => {
    const game = mockGames.find((g) => g.id === params.gameId);
    if (!game) {
      return HttpResponse.json({ message: "Game not found" }, { status: 404 });
    }
    const objectives = mockObjectives
      .filter((o) => o.gameId === params.gameId)
      .sort((a, b) => a.position - b.position);
    const detail: GameDetail = {
      ...game,
      objectives,
      progress: computeProgress(game.id),
    };
    return HttpResponse.json(detail);
  }),
  http.patch("/api/games/:gameId/objectives/:objectiveId/complete", ({ params }) => {
    const objective = mockObjectives.find(
      (o) => o.gameId === params.gameId && o.id === params.objectiveId
    );
    if (!objective) {
      return HttpResponse.json({ message: "Objective not found" }, { status: 404 });
    }
    objective.completed = true;
    objective.completedAt = new Date().toISOString();
    return HttpResponse.json(objective);
  }),

  http.patch("/api/games/:gameId/objectives/:objectiveId/reopen", ({ params }) => {
    const objective = mockObjectives.find(
      (o) => o.gameId === params.gameId && o.id === params.objectiveId
    );
    if (!objective) {
      return HttpResponse.json({ message: "Objective not found" }, { status: 404 });
    }
    objective.completed = false;
    objective.completedAt = null;
    return HttpResponse.json(objective);
  }),
];
