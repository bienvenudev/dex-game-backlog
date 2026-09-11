import { GameSummary } from "../types/game";

export const mockGames: Omit<GameSummary, "progress">[] = [
  {
    id: "1",
    title: "The Witcher 3: Wild Hunt",
    platform: "STEAM",
    status: "PLAYING",
    rating: 9,
    notes: "Great game, but a bit long.",
    startedAt: "2023-01-01T00:00:00Z",
    finishedAt: null,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    title: "Hades",
    platform: "EPIC",
    status: "FINISHED",
    rating: 10,
    notes: "Amazing game, loved it!",
    startedAt: "2023-02-01T00:00:00Z",
    finishedAt: "2023-02-15T00:00:00Z",
    createdAt: "2023-02-01T00:00:00Z",
    updatedAt: "2023-02-15T00:00:00Z",
  },
];
