import { FormEvent, useState } from "react";

interface Props {
  onAdd: (label: string) => Promise<unknown>;
  isPending: boolean;
  error: string | null;
}

// Owns only the input text. The parent owns the mutation and decides what "add" means.
export default function AddObjectiveForm({ onAdd, isPending, error }: Props) {
  const [label, setLabel] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setLabel("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
      <label className="flex-1 min-w-48">
        <span className="sr-only">New objective</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Add an objective, e.g. Beat the game on hard"
          disabled={isPending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "add-objective-error" : undefined}
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm placeholder:text-muted focus:border-gold focus:outline-none disabled:opacity-60"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || !label.trim()}
        className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      {error && (
        <p id="add-objective-error" role="alert" className="basis-full text-sm text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
