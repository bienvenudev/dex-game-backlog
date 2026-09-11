import { delay, http, HttpResponse } from "msw";
import { mockGames } from "./data";

export const handlers = [
  http.all("*", async () => {
    await delay(1000);
  }),

  http.get("/api/games", () => {
    return HttpResponse.json(mockGames);
  }),

  http.get("/api/games/:gameId", ({ params }) => {
    const game = mockGames.find((g) => g.id === params.gameId);
    if (!game) {
      return HttpResponse.json({ message: "Game not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...game, objectives: [] });
  }),
];
