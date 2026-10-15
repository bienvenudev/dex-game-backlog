import { LoginRequest, LoginResponse } from "../types/auth";
import { http } from "./http";

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>("/auth/login", credentials);
}
