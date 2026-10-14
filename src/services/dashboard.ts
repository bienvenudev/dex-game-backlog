import { DashboardSummary } from "../types/dashboard";
import { http } from "./http";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return http.get<DashboardSummary>("/dashboard/summary");
}
