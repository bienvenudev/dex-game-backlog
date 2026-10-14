import { FormEvent, useId, useState } from "react";
import { ALLOWED_TRANSITIONS, GameStatus, STATUS_LABELS, StatusUpdateInput } from "../types/game";

interface Props {
  currentStatus: GameStatus;
  onChange: (input: StatusUpdateInput) => Promise<unknown>;
  isPending: boolean;
  error: string | null;
}

// Owns only its fields; the page owns the mutation. The page remounts it (key) after each
// change so the selection resets to the first move allowed from the new status.
export default function StatusControl({ currentStatus, onChange, isPending, error }: Props) {
  const options = ALLOWED_TRANSITIONS[currentStatus];
  const [next, setNext] = useState<GameStatus>(options[0]);
  const [comment, setComment] = useState("");
  const errorId = useId();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onChange({ status: next, comment: comment.trim() || null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
          Move to
        </span>
        <select
          value={next}
          onChange={(e) => setNext(e.target.value as GameStatus)}
          disabled={isPending}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm focus:border-gold focus:outline-none disabled:opacity-60"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block min-w-48 flex-1">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Comment (optional)
        </span>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          disabled={isPending}
          placeholder="e.g. Rolled credits on hard"
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm placeholder:text-muted focus:border-gold focus:outline-none disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating…" : "Update status"}
      </button>

      {error && (
        <p id={errorId} role="alert" className="basis-full text-sm text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
