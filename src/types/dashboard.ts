import { GameStatus, GameSummary } from "./game";

// Mirrors DashboardSummaryResponse.
export interface DashboardSummary {
  totalGames: number;
  // The backend only includes statuses that have games, so a missing key means zero.
  gamesByStatus: Partial<Record<GameStatus, number>>;
  fullyCompleteGames: number;
  gamesWithNoObjectives: number;
  averageRating: number | null; // null when nothing is rated
  recentlyUpdatedGames: GameSummary[];
}
