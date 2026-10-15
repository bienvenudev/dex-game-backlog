import { createContext } from "react";

export interface AuthValue {
  username: string | null; // null = signed out
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  // true after the user clicked "Sign out"; false after a 401 or a fresh sign-in. Required, not
  // optional, so a provider that forgets to supply it is a compile error.
  signedOutOnPurpose: boolean;
}

// null default so useAuth can detect a component rendered outside the provider.
export const AuthContext = createContext<AuthValue | null>(null);
