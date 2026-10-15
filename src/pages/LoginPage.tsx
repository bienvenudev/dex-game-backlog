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
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();
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

          {/* htmlFor instead of a wrapping label: the toggle button must not sit inside the label. */}
          <div>
            <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isPending}
                aria-invalid={error ? true : undefined}
                className={`${inputClass} pr-11`}
              />
              {/* Fixed label + aria-pressed: the state is announced once, not twice. */}
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-pressed={showPassword}
                aria-label="Show password"
                className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted transition-colors hover:text-ink"
              >
                <EyeIcon crossedOut={showPassword} />
              </button>
            </div>
          </div>

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

function EyeIcon({ crossedOut }: { crossedOut: boolean }) {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossedOut && <path d="M3 3l18 18" />}
    </svg>
  );
}
