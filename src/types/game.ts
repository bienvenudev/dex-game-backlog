// Dates are ISO 8601 strings, not Date objects: that's what arrives over JSON.
export type Platform = 'STEAM' | 'EPIC' | 'GOG' | 'XBOX' | 'PLAYSTATION' | 'OTHER';

export type GameStatus = 'UNPLAYED' | 'PLAYING' | 'FINISHED' | 'ABANDONED';

// Runtime lists for <select> options
export const PLATFORMS = ['STEAM', 'EPIC', 'GOG', 'XBOX', 'PLAYSTATION', 'OTHER'] as const;
export const GAME_STATUSES = ['UNPLAYED', 'PLAYING', 'FINISHED', 'ABANDONED'] as const;

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
