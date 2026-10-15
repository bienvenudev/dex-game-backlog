import { FormEvent, useRef, useState } from "react";
import { Objective } from "../types/game";
import { formatDate } from "../utils/format";

interface Props {
  objective: Objective;
  index: number;
  count: number;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onRename: (label: string) => Promise<unknown>;
}

const iconButton =
  "rounded p-1.5 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted";

// Owns only the rename draft; the page owns every mutation and passes the results down as callbacks.
export default function ObjectiveRow({
  objective,
  index,
  count,
  busy,
  onToggle,
  onRemove,
  onMove,
  onRename,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(objective.label);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  function startEditing() {
    setDraft(objective.label);
    setError(null);
    setEditing(true);
  }

  // The edit button is unmounted while editing, so hand focus back once it exists again.
  function stopEditing() {
    setEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const label = draft.trim();
    if (!label || label === objective.label) {
      stopEditing();
      return;
    }
    setSaving(true);
    try {
      await onRename(label);
      stopEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <li className="py-3">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && stopEditing()}
            aria-label={`New label for ${objective.label}`}
            aria-invalid={error ? true : undefined}
            maxLength={200}
            autoFocus
            disabled={saving}
            className="min-w-48 flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm focus:border-gold focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-canvas hover:bg-gold-deep disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={stopEditing}
            disabled={saving}
            className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:border-ink disabled:opacity-50"
          >
            Cancel
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-400">
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 py-3">
      {/* Input nested in the label: implicit association, no ids to keep in sync. */}
      <label
        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-base ${
          objective.completed ? "text-ink/70 line-through decoration-muted/60" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={objective.completed}
          disabled={busy}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-gold"
        />
        <span className="wrap-anywhere">{objective.label}</span>
      </label>

      {objective.completedAt && (
        <span className="hidden text-xs text-muted sm:inline">{formatDate(objective.completedAt)}</span>
      )}

      {/* Always visible (not hover-only) so touch screens can reach them. */}
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={busy || index === 0}
          aria-label={`Move up: ${objective.label}`}
          className={iconButton}
        >
          <Icon d="m6 15 6-6 6 6" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={busy || index === count - 1}
          aria-label={`Move down: ${objective.label}`}
          className={iconButton}
        >
          <Icon d="m6 9 6 6 6-6" />
        </button>
        <button
          ref={editButtonRef}
          type="button"
          onClick={startEditing}
          disabled={busy}
          aria-label={`Rename: ${objective.label}`}
          className={iconButton}
        >
          <Icon d="M4 20h4L19 9l-4-4L4 16v4z" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label={`Remove objective: ${objective.label}`}
          className={`${iconButton} hover:text-rose-400`}
        >
          <Icon d="M6 6l12 12M18 6L6 18" />
        </button>
      </div>
    </li>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
