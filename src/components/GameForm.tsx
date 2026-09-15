import { FormEvent, useId, useState } from "react";
import {
  GAME_STATUSES,
  GameInput,
  GameStatus,
  PLATFORMS,
  Platform,
  STATUS_LABELS,
} from "../types/game";

interface Props {
  initialValues: GameInput;
  onSubmit: (values: GameInput) => void;
  isPending: boolean;
  error: string | null;
  submitLabel: string;
  outstandingObjectives?: number;
}

const inputClass =
  "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm placeholder:text-muted focus:border-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

// Knows nothing about the API. Owns the field values and the cross-field rules.
export default function GameForm({
  initialValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  outstandingObjectives = 0,
}: Props) {
  const [values, setValues] = useState<GameInput>(initialValues);
  const errorId = useId();

  function setField<K extends keyof GameInput>(key: K, value: GameInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleStatusChange(status: GameStatus) {
    // Rating is only allowed on played games; clear it on the way back to UNPLAYED.
    setValues((prev) => ({
      ...prev,
      status,
      rating: status === "UNPLAYED" ? null : prev.rating,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      ...values,
      title: values.title.trim(),
      notes: values.notes?.trim() || null,
    });
  }

  const ratingDisabled = values.status === "UNPLAYED";
  const finishingWithOutstanding = values.status === "FINISHED" && outstandingObjectives > 0;

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby={error ? errorId : undefined}
      className="grid gap-8 md:grid-cols-[1fr_200px]"
    >
      <div className="space-y-5">
        <Field label="Title">
          <input
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            required
            autoFocus
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Platform">
            <select
              value={values.platform}
              onChange={(e) => setField("platform", e.target.value as Platform)}
              className={inputClass}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={values.status}
              onChange={(e) => handleStatusChange(e.target.value as GameStatus)}
              className={inputClass}
            >
              {GAME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {finishingWithOutstanding && (
          <p role="alert" className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
            {outstandingObjectives} objective{outstandingObjectives === 1 ? "" : "s"} still
            unticked. You can finish anyway.
          </p>
        )}

        <Field
          label="Rating"
          hint={ratingDisabled ? "Available once the game is started." : "1 to 10"}
        >
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            disabled={ratingDisabled}
            value={values.rating ?? ""}
            onChange={(e) => setField("rating", e.target.value === "" ? null : Number(e.target.value))}
            className={`${inputClass} sm:w-32`}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={values.notes ?? ""}
            onChange={(e) => setField("notes", e.target.value)}
            rows={4}
            className={inputClass}
          />
        </Field>

        <Field label="Cover image URL" hint="Portrait art, shown on cards.">
          <input
            type="url"
            value={values.coverUrl ?? ""}
            onChange={(e) => setField("coverUrl", e.target.value || null)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>

        <Field label="Background image URL" hint="Wide art, shown behind the detail page.">
          <input
            type="url"
            value={values.backgroundUrl ?? ""}
            onChange={(e) => setField("backgroundUrl", e.target.value || null)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>

        {error && (
          <p id={errorId} role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
      </div>

      {/* Live preview so a pasted URL can be checked before saving. */}
      <div aria-hidden className="hidden md:block">
        <div className="aspect-2/3 overflow-hidden rounded-sm border border-line bg-panel">
          {values.coverUrl ? (
            <img src={values.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end bg-linear-to-t from-panel-raised to-panel p-3">
              <span className="text-lg font-bold leading-tight text-muted">
                {values.title || "Cover preview"}
              </span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
