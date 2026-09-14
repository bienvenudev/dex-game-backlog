import { FormEvent, useState } from "react";
import { GAME_STATUSES, GameInput, GameStatus, PLATFORMS, Platform } from "../types/game";

interface Props {
  initialValues: GameInput;
  onSubmit: (values: GameInput) => void;
  isPending: boolean;
  error: string | null;
  submitLabel: string;
  outstandingObjectives?: number;
}

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
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Title{" "}
          <input
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Platform{" "}
          <select
            value={values.platform}
            onChange={(e) => setField("platform", e.target.value as Platform)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Status{" "}
          <select
            value={values.status}
            onChange={(e) => handleStatusChange(e.target.value as GameStatus)}
          >
            {GAME_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {finishingWithOutstanding && (
          <p role="alert">
            {outstandingObjectives} objective{outstandingObjectives === 1 ? "" : "s"} still
            unticked. You can finish anyway.
          </p>
        )}
      </div>

      <div>
        <label>
          Rating (1-10){" "}
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            disabled={ratingDisabled}
            value={values.rating ?? ""}
            onChange={(e) => setField("rating", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        {ratingDisabled && <small> Available once the game is started.</small>}
      </div>

      <div>
        <label>
          Notes{" "}
          <textarea
            value={values.notes ?? ""}
            onChange={(e) => setField("notes", e.target.value)}
            rows={4}
          />
        </label>
      </div>

      {error && <p>Error: {error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
