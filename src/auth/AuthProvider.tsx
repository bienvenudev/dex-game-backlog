import { ReactNode, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "../services/auth";
import {
  clearSession,
  getSession,
  saveSession,
  SESSION_EXPIRED_EVENT,
} from "../services/session";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState<string | null>(() => getSession()?.username ?? null);
  const [signedOutOnPurpose, setSignedOutOnPurpose] = useState(false);

  async function signIn(username: string, password: string) {
    const response = await login({ username, password });
    // Fall back to what was typed until the backend returns username in LoginResponse.
    const session = { ...response, username: response.username ?? username };
    saveSession(session);
    setUsername(session.username);
    setSignedOutOnPurpose(false); // a fresh login starts a fresh session
  }

  function endSession() {
    clearSession();
    setUsername(null);
    // Otherwise the next user would briefly see the previous user's cached games.
    queryClient.clear();
  }

  // The Sign out button: remember it was deliberate so the guard doesn't offer to come back here.
  function signOut() {
    setSignedOutOnPurpose(true);
    endSession();
  }

  // The backend refused the token. Not deliberate, so the guard keeps the page to return to.
  function handleSessionExpired() {
    setSignedOutOnPurpose(false);
    endSession();
  }

  // A 401 on any request means the token is no longer accepted (expired, or the backend's key
  // changed). http.ts announces it; signing out here lets RequireAuth redirect to /login.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  });

  return (
    <AuthContext.Provider value={{ username, signIn, signOut, signedOutOnPurpose }}>
      {children}
    </AuthContext.Provider>
  );
}
