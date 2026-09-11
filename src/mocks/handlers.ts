import { delay, http, HttpResponse } from "msw";
import { mockGames } from "./data";

export const handlers = [
  http.all("*", async () => {
    await delay(1000);
  }),

  http.get("/api/games", () => {
    return HttpResponse.json(mockGames.map((game) => ({
      ...game,
      progress: game.status === "PLAYING" ? 50 : 100,
    })));
  }),
];
