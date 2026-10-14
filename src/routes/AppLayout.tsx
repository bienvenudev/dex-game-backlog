import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import LogoMark from "../components/LogoMark";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-ink" : "text-muted hover:text-ink transition-colors";

export default function AppLayout() {
  const { username, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
        {/* Wraps instead of overflowing: the Tauri window opens at 800px and can be narrower. */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <LogoMark />
            Dex
          </Link>

          <nav aria-label="Main" className="flex items-center gap-5 text-sm font-medium">
            <NavLink to="/" end className={navClass}>
              Library
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/games/new"
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas hover:bg-gold-deep transition-colors"
            >
              Add game
            </Link>
            <span className="text-sm text-muted max-sm:sr-only">
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
