import { createHashRouter } from 'react-router';
import AppLayout from './AppLayout';
import RequireAuth from './RequireAuth';
import LoginPage from '../pages/LoginPage';
import LibraryPage from '../pages/LibraryPage';
import DashboardPage from '../pages/DashboardPage';
import AddGamePage from '../pages/AddGamePage';
import GameDetailPage from '../pages/GameDetailPage';
import EditGamePage from '../pages/EditGamePage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createHashRouter([
  { path: 'login', element: <LoginPage /> },
  {
    // Everything below requires a signed-in user.
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <LibraryPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'games/new', element: <AddGamePage /> },
          { path: 'games/:gameId', element: <GameDetailPage /> },
          { path: 'games/:gameId/edit', element: <EditGamePage /> },
          // Catch-all: unknown URLs render inside the layout instead of the router's default error screen.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
