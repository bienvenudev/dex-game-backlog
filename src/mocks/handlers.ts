import { delay, http, HttpResponse } from "msw";
import { mockGames, mockObjectives } from "./data";
import {
  GAME_STATUSES,
  GameDetail,
  GameInput,
  GameSummary,
  Objective,
  PLATFORMS,
  Progress,
} from "../types/game";

type StoredGame = (typeof mockGames)[number];

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

// Mirrors the backend's validation rules.
function validateGameInput(input: GameInput): string | null {
  if (!input.title?.trim()) return "Title is required";
  if (!PLATFORMS.includes(input.platform)) return "Platform is invalid";
  if (!GAME_STATUSES.includes(input.status)) return "Status is invalid";
  if (input.rating !== null) {
    if (input.status === "UNPLAYED") return "Rating is not allowed on an unplayed game";
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10) {
      return "Rating must be a whole number from 1 to 10";
    }
  }
  return null;
}

function isDuplicate(input: GameInput, excludeGameId?: string): boolean {
  return mockGames.some(
    (g) =>
      g.id !== excludeGameId &&
      g.platform === input.platform &&
      g.title.trim().toLowerCase() === input.title.trim().toLowerCase(),
  );
}

function toSummary(game: StoredGame): GameSummary {
  return { ...game, progress: computeProgress(game.id) };
}

export const handlers = [
  http.all("*", async () => {
    await delay(1000);
  }),

  http.post("/api/games", async ({ request }) => {
    const input = (await request.json()) as GameInput;
    const error = validateGameInput(input);
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    if (isDuplicate(input)) {
      return HttpResponse.json(
        { message: "You already have this title on this platform" },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const game: StoredGame = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      platform: input.platform,
      status: input.status,
      rating: input.rating,
      notes: input.notes || null,
      coverUrl: input.coverUrl || null,
      startedAt: input.status !== "UNPLAYED" ? now : null,
      finishedAt: input.status === "FINISHED" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    mockGames.push(game);
    return HttpResponse.json(toSummary(game), { status: 201 });
  }),

  http.put("/api/games/:gameId", async ({ params, request }) => {
    const game = mockGames.find((g) => g.id === params.gameId);
    if (!game) {
      return HttpResponse.json({ message: "Game not found" }, { status: 404 });
    }

    const input = (await request.json()) as GameInput;
    const error = validateGameInput(input);
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    if (isDuplicate(input, game.id)) {
      return HttpResponse.json(
        { message: "You already have this title on this platform" },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    game.title = input.title.trim();
    game.platform = input.platform;
    game.status = input.status;
    game.rating = input.status === "UNPLAYED" ? null : input.rating;
    game.notes = input.notes || null;
    game.coverUrl = input.coverUrl || null;
    if (input.status !== "UNPLAYED" && !game.startedAt) game.startedAt = now;
    if (input.status === "FINISHED") game.finishedAt = now;
    game.updatedAt = now;
    return HttpResponse.json(toSummary(game));
  }),

  http.delete("/api/games/:gameId", ({ params }) => {
    const index = mockGames.findIndex((g) => g.id === params.gameId);
    if (index === -1) {
      return HttpResponse.json({ message: "Game not found" }, { status: 404 });
    }
    mockGames.splice(index, 1);
    // Cascade, as the backend's FK constraint will.
    for (let i = mockObjectives.length - 1; i >= 0; i--) {
      if (mockObjectives[i].gameId === params.gameId) mockObjectives.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
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
