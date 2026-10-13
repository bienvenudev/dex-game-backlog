import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import LogoMark from "../components/LogoMark";

export default function AppLayout() {
  const { username, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <LogoMark />
            Dex
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "text-ink" : "text-muted hover:text-ink transition-colors"
              }
            >
              Library
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Link
              to="/games/new"
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas hover:bg-gold-deep transition-colors"
            >
              Add game
            </Link>
            <span className="text-sm text-muted">
              <span className="sr-only">Signed in as </span>
              {username}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
