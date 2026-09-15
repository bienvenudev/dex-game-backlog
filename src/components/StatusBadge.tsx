import { GameStatus, STATUS_LABELS } from "../types/game";

const STYLES: Record<GameStatus, string> = {
  UNPLAYED: "bg-panel-raised text-muted",
  PLAYING: "bg-gold/15 text-gold",
  FINISHED: "bg-emerald-500/15 text-emerald-400",
  ABANDONED: "bg-rose-500/15 text-rose-400",
};

export default function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
