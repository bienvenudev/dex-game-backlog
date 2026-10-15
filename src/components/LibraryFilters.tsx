import { ReactNode, useId, useState } from "react";
import {
  GAME_STATUSES,
  GameFilters,
  GameStatus,
  PLATFORMS,
  Platform,
  SortBy,
  STATUS_LABELS,
} from "../types/game";
import { countAdvancedFilters, hasActiveFilters, SORT_OPTIONS } from "../utils/gameFilters";

const controlClass =
  "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm focus:border-gold focus:outline-none";
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  filters: GameFilters;
  onChange: (patch: Partial<GameFilters>) => void;
  onClear: () => void;
}

// Controlled: it owns no filter state, only whether the extra-filters panel is open.
// Search, status and sort are always visible; everything else lives behind one button.
export default function LibraryFilters({ filters, onChange, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const advancedCount = countAdvancedFilters(filters);
  const sortValue = `${filters.sortBy ?? "updatedAt"}:${filters.sortDirection ?? "desc"}`;

  // The backend rejects min > max, so keep the pair consistent instead of letting a request fail.
  function changeMinRating(value: string) {
    const min = value ? Number(value) : undefined;
    const clash = min !== undefined && filters.maxRating !== undefined && min > filters.maxRating;
    onChange({ minRating: min, ...(clash ? { maxRating: min } : {}) });
  }

  function changeMaxRating(value: string) {
    const max = value ? Number(value) : undefined;
    const clash = max !== undefined && filters.minRating !== undefined && max < filters.minRating;
    onChange({ maxRating: max, ...(clash ? { minRating: max } : {}) });
  }

  function changeSort(value: string) {
    const [sortBy, sortDirection] = value.split(":") as [SortBy, "asc" | "desc"];
    onChange({ sortBy, sortDirection });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* A radio group: one Tab stop, arrow keys move between options, "2 of 5" is announced. */}
        <fieldset className="flex flex-wrap gap-2 rounded-md border border-line bg-panel p-1 text-sm font-medium">
          <legend className="sr-only">Filter by status</legend>
          <StatusPill value="" current={filters.status} onSelect={(status) => onChange({ status })}>
            All
          </StatusPill>
          {GAME_STATUSES.map((s) => (
            <StatusPill
              key={s}
              value={s}
              current={filters.status}
              onSelect={(status) => onChange({ status })}
            >
              {STATUS_LABELS[s]}
            </StatusPill>
          ))}
        </fieldset>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          {/* role="search" makes this a landmark screen readers can jump to. */}
          <div role="search" className="relative min-w-44 flex-1 sm:max-w-64">
            <label>
              <span className="sr-only">Search by title</span>
              <SearchIcon />
              <input
                type="search"
                placeholder="Find a game"
                value={filters.search ?? ""}
                onChange={(e) => onChange({ search: e.target.value })}
                className={`${controlClass} pl-9 placeholder:text-muted`}
              />
            </label>
          </div>

          <label>
            <span className="sr-only">Sort by</span>
            <select
              value={sortValue}
              onChange={(e) => changeSort(e.target.value)}
              className={`${controlClass} w-auto`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              open || advancedCount > 0
                ? "border-gold text-gold"
                : "border-line bg-panel text-muted hover:text-ink"
            }`}
          >
            <FilterIcon />
            Filters
            {advancedCount > 0 && (
              <>
                <span
                  aria-hidden
                  className="rounded-full bg-gold px-1.5 text-xs font-semibold text-canvas"
                >
                  {advancedCount}
                </span>
                <span className="sr-only">, {advancedCount} active</span>
              </>
            )}
          </button>

          {hasActiveFilters(filters) && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-medium text-gold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="More filters"
          className="grid gap-4 rounded-md border border-line bg-panel p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Platform">
            <select
              value={filters.platform ?? ""}
              onChange={(e) => onChange({ platform: (e.target.value || undefined) as Platform | undefined })}
              className={controlClass}
            >
              <option value="">Any platform</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Minimum rating">
            <select
              value={filters.minRating ?? ""}
              onChange={(e) => changeMinRating(e.target.value)}
              className={controlClass}
            >
              <option value="">Any</option>
              {RATINGS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Maximum rating">
            <select
              value={filters.maxRating ?? ""}
              onChange={(e) => changeMaxRating(e.target.value)}
              className={controlClass}
            >
              <option value="">Any</option>
              {RATINGS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Objectives">
            <select
              value={filters.hasObjectives === undefined ? "" : filters.hasObjectives ? "yes" : "no"}
              onChange={(e) =>
                onChange({ hasObjectives: e.target.value === "" ? undefined : e.target.value === "yes" })
              }
              className={controlClass}
            >
              <option value="">Any</option>
              <option value="yes">Has objectives</option>
              <option value="no">No objectives</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 self-end py-2 text-sm">
            <input
              type="checkbox"
              checked={filters.fullyComplete === true}
              onChange={(e) => onChange({ fullyComplete: e.target.checked ? true : undefined })}
              className="h-4 w-4 accent-gold"
            />
            Fully complete only
          </label>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({
  value,
  current,
  onSelect,
  children,
}: {
  value: GameStatus | "";
  current: GameStatus | undefined;
  onSelect: (status: GameStatus | undefined) => void;
  children: ReactNode;
}) {
  // The radio is visually hidden but still focusable; the label is the pill and styles itself
  // from the input's state via the `has-*` variants.
  return (
    <label className="cursor-pointer rounded px-3 py-1.5 text-muted transition-colors hover:text-ink has-checked:bg-panel-raised has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold">
      <input
        type="radio"
        name="status"
        value={value}
        checked={(current ?? "") === value}
        onChange={() => onSelect(value || undefined)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
