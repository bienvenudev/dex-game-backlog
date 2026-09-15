import { Link, NavLink, Outlet } from "react-router";

export default function AppLayout() {
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

// A ticked box: the app is a backlog of checklists.
function LogoMark() {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
