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
    <form onSubmit={handleSubmit}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="New objective"
        disabled={isPending}
      />
      <button type="submit" disabled={isPending || !label.trim()}>
        Add
      </button>
      {error && <p>Error: {error}</p>}
    </form>
  );
}
