// Dates are ISO 8601 strings, not Date objects: that's what arrives over JSON.
export type Platform = 'STEAM' | 'EPIC' | 'GOG' | 'XBOX' | 'PLAYSTATION' | 'OTHER';

export type GameStatus = 'UNPLAYED' | 'PLAYING' | 'FINISHED' | 'ABANDONED';

// Runtime lists for <select> options
export const PLATFORMS = ['STEAM', 'EPIC', 'GOG', 'XBOX', 'PLAYSTATION', 'OTHER'] as const;
export const GAME_STATUSES = ['UNPLAYED', 'PLAYING', 'FINISHED', 'ABANDONED'] as const;

// User-facing labels; the wire values stay upper-case.
export const STATUS_LABELS: Record<GameStatus, string> = {
  UNPLAYED: 'Unplayed',
  PLAYING: 'Playing',
  FINISHED: 'Finished',
  ABANDONED: 'Abandoned',
};

// Computed by the service/backend, never by components.
export interface Progress {
  completed: number;
  total: number;
  percentage: number | null; // null = no objectives, distinct from 0%
}

export interface Objective {
  id: string;
  gameId: string;
  label: string;
  completed: boolean;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GameBase {
  id: string;
  title: string;
  platform: Platform;
  status: GameStatus;
  rating: number | null; // 1-10, only allowed when status !== 'UNPLAYED'
  notes: string | null;
  coverUrl: string | null; // portrait art for cards
  backgroundUrl: string | null; // wide art for the detail hero
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Library list shape: no objectives.
export interface GameSummary extends GameBase {
  progress: Progress;
}

// Game Detail shape: objectives in position order.
export interface GameDetail extends GameBase {
  objectives: Objective[];
  progress: Progress;
}

export interface GameInput {
  title: string;
  platform: Platform;
  status: GameStatus;
  rating: number | null;
  notes: string | null;
  coverUrl: string | null;
  backgroundUrl: string | null;
}

export const EMPTY_GAME_INPUT: GameInput = {
  title: "",
  platform: "STEAM",
  status: "UNPLAYED",
  rating: null,
  notes: null,
  coverUrl: null,
  backgroundUrl: null,
};

// Body and response of PATCH /api/games/{id}/status.
export interface StatusUpdateInput {
  status: GameStatus;
  comment: string | null;
}

export interface StatusUpdateResponse {
  game: GameSummary;
  hasOutstandingObjectives: boolean; // finished while objectives remain unticked
}

// Mirrors the backend's StatusTransitionRules so the UI only offers legal moves.
// The backend still enforces them; a drift shows up as a 409, not bad data.
export const ALLOWED_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  UNPLAYED: ['PLAYING', 'FINISHED', 'ABANDONED'],
  PLAYING: ['FINISHED', 'ABANDONED', 'UNPLAYED'],
  FINISHED: ['PLAYING', 'ABANDONED'],
  ABANDONED: ['PLAYING', 'FINISHED'],
};

export type SortBy = 'title' | 'rating' | 'progress' | 'createdAt' | 'updatedAt';

// Query parameters of GET /api/games. Absent means "no filter".
export interface GameFilters {
  search?: string;
  status?: GameStatus;
  platform?: Platform;
  minRating?: number;
  maxRating?: number;
  hasObjectives?: boolean;
  fullyComplete?: boolean;
  sortBy?: SortBy;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// One row of GET /api/games/{id}/history, oldest first.
export interface StatusHistoryEntry {
  id: string;
  gameId: string;
  previousStatus: GameStatus;
  newStatus: GameStatus;
  changedBy: string;
  changedAt: string;
  comment: string | null;
}
