import { useEffect, useId, useRef } from "react";

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
  const titleId = useId();
  const messageId = useId();

  // <dialog> is imperative (showModal/close); this effect syncs it with the `open` prop.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // onClose also fires on Escape, so the parent's state stays in sync.
    <dialog
      ref={ref}
      onClose={onCancel}
      // A click on the backdrop reports the <dialog> itself as target; clicks inside land on children.
      // Padding lives on the inner div so the dialog box has no clickable "dead zone" of its own.
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      className="m-auto w-full max-w-md rounded-md border border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-canvas/80 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-muted">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-400">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:border-ink transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-canvas hover:bg-rose-400 transition-colors disabled:opacity-50"
          >
            {isPending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
