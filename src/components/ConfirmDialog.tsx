import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Thin wrapper over the native <dialog>: showModal() gives a backdrop and focus trap for free.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  isPending = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // <dialog> is imperative (showModal/close); this effect syncs it with the `open` prop.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // onClose also fires on Escape, so the parent's state stays in sync.
    <dialog ref={ref} onClose={onCancel}>
      <h2>{title}</h2>
      <p>{message}</p>
      {error && <p>Error: {error}</p>}
      <button type="button" onClick={onCancel} disabled={isPending}>
        Cancel
      </button>{" "}
      <button type="button" onClick={onConfirm} disabled={isPending}>
        {isPending ? "Deleting..." : confirmLabel}
      </button>
    </dialog>
  );
}
