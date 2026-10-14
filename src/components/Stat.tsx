import { ReactNode } from "react";

// A <dt>/<dd> pair in a gold-underlined card. Must sit inside a <dl>.
export default function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-sm border border-line border-b-gold bg-panel px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gold">{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}
