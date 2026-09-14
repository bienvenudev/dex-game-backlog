import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to Library</Link>
      </p>
    </div>
  );
}
