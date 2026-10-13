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

  async function signIn(username: string, password: string) {
    const response = await login({ username, password });
    // Fall back to what was typed until the backend returns username in LoginResponse.
    const session = { ...response, username: response.username ?? username };
    saveSession(session);
    setUsername(session.username);
  }

  function signOut() {
    clearSession();
    setUsername(null);
    // Otherwise the next user would briefly see the previous user's cached games.
    queryClient.clear();
  }

  // A 401 on any request means the token is no longer accepted (expired, or the backend's key
  // changed). http.ts announces it; signing out here lets RequireAuth redirect to /login.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, signOut);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, signOut);
  });

  return (
    <AuthContext.Provider value={{ username, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}
