import { Progress } from "../types/game";

export default function ProgressBar({ progress }: { progress: Progress }) {
  if (progress.percentage === null) {
    return <p className="text-xs text-muted">No objectives</p>;
  }
  return (
    <div>
      <div className="flex justify-between text-xs text-muted">
        <span>
          {progress.completed} of {progress.total}
        </span>
        <span>{progress.percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Objectives completed"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progress.completed} of ${progress.total} objectives`}
        className="mt-1 h-1 overflow-hidden rounded-full bg-panel-raised"
      >
        <div className="h-full bg-gold" style={{ width: `${progress.percentage}%` }} />
      </div>
    </div>
  );
}
