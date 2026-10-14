import { getSession, SESSION_EXPIRED_EVENT } from "./session";
import { Paged } from "../types/api";

const baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Carries the HTTP status so callers can tell a 409 from a 500.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// The backend sends two error shapes: its own { message }, and ASP.NET's automatic validation
// response { title, errors: { Field: ["..."] } } which has no message. Read whichever is there.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (body?.errors && typeof body.errors === "object") {
      const messages = Object.values(body.errors)
        .flat()
        .filter((m): m is string => typeof m === "string");
      if (messages.length > 0) return messages.join(" ");
    }
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.title === "string") return body.title;
  } catch {
    // body was empty or not JSON
  }
  return response.statusText || `HTTP ${response.status}`;
}

async function send(method: string, url: string, body?: unknown): Promise<Response> {
  const session = getSession();
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // 401 while holding a token: the session is dead. Tell the auth layer, which signs out;
    // the route guard then shows the login page. A 401 without a token is a failed login
    // attempt and is reported to the form as normal.
    if (response.status === 401 && session) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  return response;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const response = await send(method, url, body);
  // 204 No Content has no body to parse.
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const http = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  delete: (url: string) => request<void>("DELETE", url),

  // List endpoints return the items as the body and the totals in X-Total-Count, X-Page and
  // X-Page-Size. Headers are readable because the dev proxy keeps requests same-origin; a
  // cross-origin deployment would need the backend to expose them via CORS.
  getPage: async <T>(url: string): Promise<Paged<T>> => {
    const response = await send("GET", url);
    const items: T[] = await response.json();
    return {
      items,
      totalCount: Number(response.headers.get("X-Total-Count") ?? items.length),
      page: Number(response.headers.get("X-Page") ?? 1),
      pageSize: Number(response.headers.get("X-Page-Size") ?? items.length),
    };
  },
};
