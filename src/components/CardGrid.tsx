import { ReactNode } from "react";

export default function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-6 gap-y-8">
      {children}
    </div>
  );
}
