import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";

// Wraps every route that needs a signed-in user. Remembers where the user was heading
// so the login page can send them back there afterwards.
export default function RequireAuth() {
  const { username } = useAuth();
  const location = useLocation();

  if (!username) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
