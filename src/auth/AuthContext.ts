import { createContext } from "react";

export interface AuthValue {
  username: string | null; // null = signed out
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

// null default so useAuth can detect a component rendered outside the provider.
export const AuthContext = createContext<AuthValue | null>(null);
