import { delay, http, HttpResponse } from "msw";
import { mockGames, mockObjectives } from "./data";
import { GameDetail, GameSummary, Objective, Progress } from "../types/game";

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

  http.post("/api/games/:gameId/objectives", async ({ params, request }) => {
    const gameId = String(params.gameId);
    if (!mockGames.some((g) => g.id === gameId)) {
      return HttpResponse.json({ message: "Game not found" }, { status: 404 });
    }

    const body = (await request.json()) as { label?: string };
    const label = body.label?.trim();
    if (!label) {
      return HttpResponse.json({ message: "Label is required" }, { status: 400 });
    }

    const siblings = mockObjectives.filter((o) => o.gameId === gameId);
    if (siblings.some((o) => o.label.toLowerCase() === label.toLowerCase())) {
      return HttpResponse.json(
        { message: "An objective with this label already exists" },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const objective: Objective = {
      id: crypto.randomUUID(),
      gameId,
      label,
      completed: false,
      position: siblings.length + 1,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    mockObjectives.push(objective);
    return HttpResponse.json(objective, { status: 201 });
  }),

  http.delete("/api/games/:gameId/objectives/:objectiveId", ({ params }) => {
    const index = mockObjectives.findIndex(
      (o) => o.gameId === params.gameId && o.id === params.objectiveId,
    );
    if (index === -1) {
      return HttpResponse.json({ message: "Objective not found" }, { status: 404 });
    }
    mockObjectives.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
