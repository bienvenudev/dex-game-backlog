import { Progress } from "../types/game";

export default function ProgressText({ progress }: { progress: Progress }) {
  if (progress.percentage === null) return <span>No objectives</span>;
  return (
    <span>
      {progress.completed} / {progress.total} ({progress.percentage}%)
    </span>
  );
}
