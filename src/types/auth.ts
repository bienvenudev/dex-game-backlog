// Mirrors the backend's Contracts/AuthContracts.cs.
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string; // ISO date
  username: string;
}

// What the app keeps after a successful login.
export interface Session {
  accessToken: string;
  expiresAt: string;
  username: string;
}
