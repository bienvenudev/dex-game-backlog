import { FormEvent, useId, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import LogoMark from "../components/LogoMark";

const inputClass =
  "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm placeholder:text-muted focus:border-gold focus:outline-none disabled:opacity-60";

export default function LoginPage() {
  const { username: signedInAs, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const errorId = useId();

  // Already signed in (e.g. opened #/login by hand): nothing to do here.
  if (signedInAs) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await signIn(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      // The server's message ("Invalid username or password") arrives here via ApiError.
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
          <LogoMark size={28} />
          Dex
        </div>

        <form
          onSubmit={handleSubmit}
          aria-describedby={error ? errorId : undefined}
          className="space-y-5 rounded-md border border-line bg-panel p-6"
        >
          <h1 className="text-lg font-bold">Sign in</h1>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              className={inputClass}
            />
          </label>

          {error && (
            <p id={errorId} role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
