import ErrorState from "../components/ErrorState";

export default function NotFoundPage() {
  return (
    <ErrorState
      code="404"
      title="This page doesn't exist"
      message="The link may be old, or the game was deleted."
      actionTo="/"
      actionLabel="Back to library"
    />
  );
}
