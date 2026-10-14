import { ReactNode } from "react";

// A section heading styled as an underlined tab. `id` is what the section's aria-labelledby points at.
export default function SectionTab({
  id,
  count,
  children,
}: {
  id: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <h2
        id={id}
        className="inline-block border-b-2 border-gold pb-2 text-sm font-semibold uppercase tracking-wide"
      >
        {children}
        {count !== undefined && <span className="ml-2 font-normal text-muted">{count}</span>}
      </h2>
    </div>
  );
}
