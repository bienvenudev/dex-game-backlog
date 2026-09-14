import { Link, NavLink, Outlet } from "react-router";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span aria-hidden className="flex text-gold">
              <TriangleIcon />
              <TriangleIcon />
              <TriangleIcon />
            </span>
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

          <Link
            to="/games/new"
            className="ml-auto rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas hover:bg-gold-deep transition-colors"
          >
            Add game
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function TriangleIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" className="-mr-1">
      <path d="M1 1l12 7-12 7z" />
    </svg>
  );
}
