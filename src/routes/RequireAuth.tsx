import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";

// Wraps every route that needs a signed-in user. When the app forced the login (a deep link
// opened while signed out, or an expired session) it remembers the page so the login page can
// return there. After a deliberate sign-out it remembers nothing: the next login starts at home.
export default function RequireAuth() {
  const { username, signedOutOnPurpose } = useAuth();
  const location = useLocation();

  if (!username) {
    return (
      <Navigate
        to="/login"
        replace
        state={signedOutOnPurpose ? undefined : { from: location.pathname }}
      />
    );
  }
  return <Outlet />;
}
