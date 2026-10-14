import { GameFilters } from "../types/game";

export const DEFAULT_FILTERS: GameFilters = { sortBy: "updatedAt", sortDirection: "desc", page: 1 };

// value is "sortBy:sortDirection", so one <select> drives two query parameters.
export const SORT_OPTIONS = [
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "createdAt:desc", label: "Newest added" },
  { value: "title:asc", label: "Title A to Z" },
  { value: "title:desc", label: "Title Z to A" },
  { value: "rating:desc", label: "Highest rated" },
  { value: "rating:asc", label: "Lowest rated" },
  { value: "progress:desc", label: "Most complete" },
  { value: "progress:asc", label: "Least complete" },
] as const;

// The filters inside the collapsible panel. Search and status stay visible, so they aren't counted.
export function countAdvancedFilters(filters: GameFilters): number {
  return [
    filters.platform,
    filters.minRating,
    filters.maxRating,
    filters.hasObjectives,
    filters.fullyComplete,
  ].filter((value) => value !== undefined).length;
}

export function hasActiveFilters(filters: GameFilters): boolean {
  return (
    countAdvancedFilters(filters) > 0 || Boolean(filters.status) || Boolean(filters.search?.trim())
  );
}
