import { Link, Outlet } from 'react-router';

export default function AppLayout() {
  return (
    <>
      <nav>
        <Link to="/">Library</Link> | <Link to="/games/new">Add Game</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
