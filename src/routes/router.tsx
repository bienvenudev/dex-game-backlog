import { createHashRouter } from 'react-router';
import AppLayout from './AppLayout';
import LibraryPage from '../pages/LibraryPage';
import AddGamePage from '../pages/AddGamePage';
import GameDetailPage from '../pages/GameDetailPage';
import EditGamePage from '../pages/EditGamePage';

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'games/new', element: <AddGamePage /> },
      { path: 'games/:gameId', element: <GameDetailPage /> },
      { path: 'games/:gameId/edit', element: <EditGamePage /> },
    ],
  },
]);
