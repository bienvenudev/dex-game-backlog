interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const buttonClass =
  "rounded-md border border-line bg-panel px-4 py-2 font-medium transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line";

// Renders nothing until there is more than one page, so small libraries never see it.
export default function Pager({ page, pageSize, totalCount, onPageChange }: Props) {
  if (!pageSize) return null;
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={buttonClass}
      >
        Previous
      </button>
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={buttonClass}
      >
        Next
      </button>
    </nav>
  );
}
