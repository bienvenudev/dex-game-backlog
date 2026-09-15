import { Link } from "react-router";
import { GameSummary } from "../types/game";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

export default function GameCard({ game }: { game: GameSummary }) {
  return (
    <Link
      to={`/games/${game.id}`}
      className="group block rounded-sm focus-visible:outline-none"
    >
      <div className="aspect-2/3 overflow-hidden rounded-sm border border-line bg-panel transition-shadow group-hover:border-gold group-hover:shadow-[0_0_24px_rgba(242,184,7,0.35)] group-focus-visible:border-gold group-focus-visible:shadow-[0_0_24px_rgba(242,184,7,0.35)]">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-t from-panel-raised to-panel p-3">
            <span className="text-lg font-bold leading-tight text-muted">{game.title}</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <h3 className="truncate font-semibold leading-tight" title={game.title}>
          {game.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{game.platform}</span>
          <StatusBadge status={game.status} />
        </div>
        <ProgressBar progress={game.progress} />
      </div>
    </Link>
  );
}
