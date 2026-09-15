import { ApiError } from "../services/http";
import ErrorState from "./ErrorState";

// A 404 means the game is gone; anything else is a transient failure.
export default function GameLoadError({ error }: { error: Error }) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <ErrorState
        code="404"
        title="This game doesn't exist"
        message="It may have been deleted, or the link is old."
        actionTo="/"
        actionLabel="Back to library"
      />
    );
  }
  return (
    <ErrorState
      title="Couldn't load this game"
      message={error.message}
      actionTo="/"
      actionLabel="Back to library"
    />
  );
}
