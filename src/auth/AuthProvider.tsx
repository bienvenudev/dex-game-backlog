import { ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "../services/auth";
import { clearSession, getSession, saveSession } from "../services/session";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState<string | null>(() => getSession()?.username ?? null);

  async function signIn(username: string, password: string) {
    const response = await login({ username, password });
    saveSession(response);
    setUsername(response.username);
  }

  function signOut() {
    clearSession();
    setUsername(null);
    // Otherwise the next user would briefly see the previous user's cached games.
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ username, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}
